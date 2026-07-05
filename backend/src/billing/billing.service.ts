/**
 * BillingService — Integração Stripe
 *
 * Fluxo de assinatura:
 *  1. Construtora escolhe um plano → createCheckoutSession() → redireciona para Stripe
 *  2. Stripe processa o pagamento → dispara webhook checkout.session.completed
 *  3. handleWebhook() ativa a assinatura no banco e libera o acesso
 *  4. Para cancelar/trocar plano → createPortalSession() → Stripe Customer Portal
 *  5. Webhook customer.subscription.updated/deleted → atualiza status no banco
 */

import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { PG_POOL } from '../database/database.module';

// IDs dos produtos/preços no Stripe (criar no dashboard e colar aqui)
// Ou usar lookup_key para buscar dinamicamente
export const STRIPE_PRICE_IDS: Record<string, string> = {
  starter:       process.env.STRIPE_PRICE_STARTER      ?? 'price_starter',
  profissional:  process.env.STRIPE_PRICE_PROFISSIONAL  ?? 'price_profissional',
  enterprise:    process.env.STRIPE_PRICE_ENTERPRISE    ?? 'price_enterprise',
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);
  private readonly webhookSecret: string;
  private readonly frontendUrl: string;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(config.getOrThrow('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });
    this.webhookSecret = config.getOrThrow('STRIPE_WEBHOOK_SECRET');
    this.frontendUrl   = config.get('FRONTEND_URL', 'http://localhost:3001');
  }

  // ----------------------------------------------------------------
  // Checkout — inicia assinatura
  // ----------------------------------------------------------------

  async createCheckoutSession(userId: string, planoSlug: string) {
    const construtora = await this.getConstrutora(userId);
    const priceId = STRIPE_PRICE_IDS[planoSlug];

    if (!priceId) throw new BadRequestException(`Plano "${planoSlug}" não existe.`);

    // Garante que a construtora tenha um customer no Stripe
    const customerId = await this.upsertStripeCustomer(construtora);

    const session = await this.stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        'subscription',
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/dashboard/assinatura?sucesso=1`,
      cancel_url:  `${this.frontendUrl}/planos?cancelado=1`,
      metadata: {
        construtora_id: construtora.id,
        plano_slug:     planoSlug,
      },
      subscription_data: {
        metadata: { construtora_id: construtora.id },
      },
      allow_promotion_codes: true,
      locale: 'pt-BR',
    });

    return { checkoutUrl: session.url };
  }

  // ----------------------------------------------------------------
  // Customer Portal — gerenciar/cancelar assinatura
  // ----------------------------------------------------------------

  async createPortalSession(userId: string) {
    const construtora = await this.getConstrutora(userId);

    const { rows: [assinatura] } = await this.pool.query(
      'SELECT stripe_customer_id FROM assinaturas WHERE construtora_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [construtora.id, 'ativa'],
    );

    if (!assinatura?.stripe_customer_id) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada.');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer:   assinatura.stripe_customer_id,
      return_url: `${this.frontendUrl}/dashboard/assinatura`,
      locale:     'pt-BR',
    });

    return { portalUrl: session.url };
  }

  // ----------------------------------------------------------------
  // Status da assinatura
  // ----------------------------------------------------------------

  async getStatus(userId: string) {
    const construtora = await this.getConstrutora(userId);

    const { rows: [assinatura] } = await this.pool.query(
      `SELECT a.status, a.vigencia_fim, a.stripe_customer_id,
              LOWER(p.nome) AS plano
       FROM assinaturas a
       JOIN planos p ON p.id = a.plano_id
       WHERE a.construtora_id = $1
       ORDER BY a.created_at DESC LIMIT 1`,
      [construtora.id],
    );

    // Se não há assinatura (ainda no trial), retorna dados do trial
    if (!assinatura) {
      return {
        plano: 'trial',
        status: construtora.subscription_status as string,
        periodo_fim: null,
        stripe_customer_id: null,
      };
    }

    return {
      plano:              assinatura.plano,
      status:             assinatura.status,
      periodo_fim:        assinatura.vigencia_fim,
      stripe_customer_id: assinatura.stripe_customer_id,
    };
  }

  // ----------------------------------------------------------------
  // Webhook — eventos do Stripe
  // ----------------------------------------------------------------

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook inválido: ${err}`);
      throw new BadRequestException('Webhook inválido.');
    }

    this.logger.log(`Webhook recebido: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await this.onPaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Ignora eventos não tratados
        break;
    }
  }

  // ----------------------------------------------------------------
  // Handlers dos eventos
  // ----------------------------------------------------------------

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const construtoraId = session.metadata?.construtora_id;
    const planoSlug     = session.metadata?.plano_slug;

    if (!construtoraId || !planoSlug) return;

    const { rows: [plano] } = await this.pool.query(
      `SELECT id FROM planos WHERE LOWER(nome) = $1`,
      [planoSlug],
    );

    if (!plano) {
      this.logger.warn(`Plano não encontrado: ${planoSlug}`);
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Cria ou atualiza a assinatura
      await client.query(
        `INSERT INTO assinaturas
           (construtora_id, plano_id, status, vigencia_inicio, stripe_subscription_id, stripe_customer_id)
         VALUES ($1, $2, 'ativa', NOW(), $3, $4)
         ON CONFLICT DO NOTHING`,
        [construtoraId, plano.id, subscription.id, session.customer],
      );

      // Ativa a construtora
      await client.query(
        `UPDATE construtoras SET subscription_status = 'ativa', plano_id = $2 WHERE id = $1`,
        [construtoraId, plano.id],
      );

      await client.query('COMMIT');
      this.logger.log(`Assinatura ativada para construtora ${construtoraId}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async onSubscriptionUpdated(subscription: Stripe.Subscription) {
    const construtoraId = subscription.metadata?.construtora_id;
    if (!construtoraId) return;

    const statusMap: Record<string, string> = {
      active:   'ativa',
      past_due: 'suspensa',
      canceled: 'cancelada',
      unpaid:   'suspensa',
    };

    const novoStatus = statusMap[subscription.status] ?? 'suspensa';

    await this.pool.query(
      `UPDATE construtoras SET subscription_status = $2 WHERE id = $1`,
      [construtoraId, novoStatus],
    );

    await this.pool.query(
      `UPDATE assinaturas SET status = $2 WHERE stripe_subscription_id = $1`,
      [subscription.id, novoStatus],
    );

    this.logger.log(`Status atualizado para ${novoStatus} — construtora ${construtoraId}`);
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const construtoraId = subscription.metadata?.construtora_id;
    if (!construtoraId) return;

    await this.pool.query(
      `UPDATE construtoras SET subscription_status = 'cancelada' WHERE id = $1`,
      [construtoraId],
    );

    await this.pool.query(
      `UPDATE assinaturas SET status = 'cancelada', vigencia_fim = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id],
    );

    this.logger.log(`Assinatura cancelada — construtora ${construtoraId}`);
  }

  private async onPaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    // Suspende até pagamento regularizado
    const { rows: [assinatura] } = await this.pool.query(
      'SELECT construtora_id FROM assinaturas WHERE stripe_subscription_id = $1',
      [subscriptionId],
    );

    if (assinatura) {
      await this.pool.query(
        `UPDATE construtoras SET subscription_status = 'suspensa' WHERE id = $1`,
        [assinatura.construtora_id],
      );
      this.logger.warn(`Pagamento falhou — construtora ${assinatura.construtora_id} suspensa`);
    }
  }

  // ----------------------------------------------------------------
  // Helpers privados
  // ----------------------------------------------------------------

  private async getConstrutora(userId: string) {
    const { rows: [c] } = await this.pool.query(
      'SELECT id, subscription_status FROM construtoras WHERE user_id = $1',
      [userId],
    );
    if (!c) throw new NotFoundException('Construtora não encontrada.');
    return c;
  }

  private async upsertStripeCustomer(construtora: { id: string }): Promise<string> {
    // Verifica se já tem customer
    const { rows: [assinatura] } = await this.pool.query(
      'SELECT stripe_customer_id FROM assinaturas WHERE construtora_id = $1 LIMIT 1',
      [construtora.id],
    );

    if (assinatura?.stripe_customer_id) return assinatura.stripe_customer_id;

    // Busca dados da construtora para criar o customer
    const { rows: [dados] } = await this.pool.query(
      `SELECT c.razao_social, u.email FROM construtoras c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [construtora.id],
    );

    const customer = await this.stripe.customers.create({
      name:     dados.razao_social,
      email:    dados.email,
      metadata: { construtora_id: construtora.id },
    });

    return customer.id;
  }
}
