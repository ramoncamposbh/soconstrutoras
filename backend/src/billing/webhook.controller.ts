/**
 * WebhookController
 *
 * IMPORTANTE: Este controller NÃO usa o ValidationPipe global nem o body parser JSON.
 * O Stripe exige o body RAW (Buffer) para validar a assinatura do webhook.
 * Por isso usamos @RawBody() e configuramos express para preservar o buffer.
 */

import {
  Controller, Post, Headers, RawBodyRequest,
  HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('billing')
export class WebhookController {
  constructor(private readonly service: BillingService) {}

  // POST /api/v1/billing/webhook
  // Registrado no Stripe Dashboard → Webhooks → Add endpoint
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      return { received: false, error: 'rawBody ausente' };
    }

    await this.service.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
