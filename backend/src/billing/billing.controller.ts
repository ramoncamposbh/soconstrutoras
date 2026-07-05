import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  // GET /api/v1/billing/status
  @Get('status')
  status(@Request() req: any) {
    return this.service.getStatus(req.user.sub);
  }

  // POST /api/v1/billing/checkout
  // Body: { plano: 'starter' | 'profissional' | 'enterprise' }
  @Post('checkout')
  checkout(@Request() req: any, @Body() body: { plano: string }) {
    return this.service.createCheckoutSession(req.user.sub, body.plano);
  }

  // POST /api/v1/billing/portal
  // Redireciona para o Stripe Customer Portal (gerenciar / cancelar)
  @Post('portal')
  portal(@Request() req: any) {
    return this.service.createPortalSession(req.user.sub);
  }
}
