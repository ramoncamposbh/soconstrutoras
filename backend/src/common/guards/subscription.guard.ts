/**
 * SubscriptionGuard
 *
 * Verifica se a construtora possui assinatura ativa antes de permitir
 * acesso a rotas protegidas (criar empreendimentos, gerenciar parceiros, etc.).
 *
 * Status permitidos: 'trial' e 'ativa'
 * Status bloqueados: 'suspensa' e 'cancelada'
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard, SubscriptionGuard)
 *   @Post()
 *   criar(...) {}
 *
 * Parceiros (role = 'parceiro') e admins passam sem verificação.
 */

import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, Inject,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';

const STATUS_ATIVOS = ['trial', 'ativa'];

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req  = context.switchToHttp().getRequest();
    const user = req.user;

    // Apenas construtoras precisam de assinatura ativa
    if (!user || user.role !== 'construtora') return true;

    const { rows: [construtora] } = await this.pool.query(
      'SELECT subscription_status FROM construtoras WHERE user_id = $1',
      [user.sub],
    );

    if (!construtora) throw new ForbiddenException('Construtora não encontrada.');

    if (!STATUS_ATIVOS.includes(construtora.subscription_status)) {
      throw new ForbiddenException(
        `Sua assinatura está ${construtora.subscription_status}. ` +
        `Acesse /dashboard/assinatura para regularizar.`,
      );
    }

    return true;
  }
}
