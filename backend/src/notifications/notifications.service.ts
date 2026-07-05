import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface LeadNotificacaoPayload {
  parceiro_nome:   string;
  parceiro_email:  string;
  lead_nome:       string;
  lead_telefone:   string;
  lead_email?:     string;
  lead_mensagem?:  string;
  empreendimento:  string;
  cidade:          string;
  estado:          string;
  atribuido_em:    Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get('EMAIL_FROM', 'noreply@soconstrutoras.com.br');

    this.transporter = nodemailer.createTransport({
      host:   config.get('SMTP_HOST', 'smtp.resend.com'),
      port:   Number(config.get('SMTP_PORT', 465)),
      secure: Number(config.get('SMTP_PORT', 465)) === 465,
      auth: {
        user: config.get('SMTP_USER', ''),
        pass: config.get('SMTP_PASS', ''),
      },
    });
  }

  /** E-mail enviado ao parceiro quando recebe um novo lead */
  async notificarNovoCead(payload: LeadNotificacaoPayload): Promise<void> {
    const { parceiro_email, parceiro_nome } = payload;

    const html = this.templateNovoLead(payload);

    try {
      await this.transporter.sendMail({
        from:    `"SóConstrutoras" <${this.from}>`,
        to:      `"${parceiro_nome}" <${parceiro_email}>`,
        subject: `🏠 Novo lead: ${payload.lead_nome} — ${payload.empreendimento}`,
        html,
      });
      this.logger.log(`E-mail de lead enviado para ${parceiro_email}`);
    } catch (err) {
      // Falha no e-mail nunca deve derrubar a atribuição do lead
      this.logger.error(`Falha ao enviar e-mail para ${parceiro_email}: ${err}`);
    }
  }

  /** Template HTML do e-mail de novo lead */
  private templateNovoLead(p: LeadNotificacaoPayload): string {
    const data = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(p.atribuido_em);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Lead</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #4361ee; padding: 28px 32px; color: #fff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; color: #334155; margin-bottom: 20px; }
    .card { background: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .card-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .field { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
    .field-label { font-size: 12px; color: #64748b; min-width: 80px; padding-top: 1px; }
    .field-value { font-size: 14px; color: #1e293b; font-weight: 500; }
    .btn { display: inline-block; background: #4361ee; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px; }
    .footer { padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Novo lead para você!</h1>
      <p>${p.empreendimento} · ${p.cidade}/${p.estado}</p>
    </div>

    <div class="body">
      <p class="greeting">Olá, <strong>${p.parceiro_nome}</strong>! Um novo lead foi atribuído a você.</p>

      <div class="card">
        <div class="card-label">Dados do interessado</div>
        <div class="field">
          <span class="field-label">Nome</span>
          <span class="field-value">${p.lead_nome}</span>
        </div>
        <div class="field">
          <span class="field-label">Telefone</span>
          <span class="field-value">${p.lead_telefone}</span>
        </div>
        ${p.lead_email ? `
        <div class="field">
          <span class="field-label">E-mail</span>
          <span class="field-value">${p.lead_email}</span>
        </div>` : ''}
        ${p.lead_mensagem ? `
        <div class="field">
          <span class="field-label">Mensagem</span>
          <span class="field-value" style="font-style:italic">"${p.lead_mensagem}"</span>
        </div>` : ''}
        <div class="field" style="margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0">
          <span class="field-label">Recebido em</span>
          <span class="field-value">${data}</span>
        </div>
      </div>

      <p style="font-size:14px; color:#64748b; margin-bottom:20px;">
        Entre em contato o quanto antes — leads atendidos em até 5 minutos têm taxa de conversão muito maior.
      </p>

      <a href="https://app.soconstrutoras.com.br/dashboard/leads" class="btn">Ver no painel →</a>
    </div>

    <div class="footer">
      SóConstrutoras · Você está recebendo este e-mail pois é parceiro cadastrado.<br>
      Para dúvidas, responda a este e-mail.
    </div>
  </div>
</body>
</html>`;
  }
}
