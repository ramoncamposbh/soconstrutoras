import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { PG_POOL } from '../database/database.module';

@Injectable()
export class ConstutorasService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async perfil(userId: string) {
    const { rows: [c] } = await this.pool.query(
      `SELECT c.*, p.nome AS plano_nome, p.preco_mensal, p.max_empreendimentos, p.max_parceiros
       FROM construtoras c
       LEFT JOIN planos p ON p.id = c.plano_id
       WHERE c.user_id = $1`,
      [userId],
    );
    return c;
  }

  async atualizar(userId: string, dto: Partial<{
    nome_fantasia: string;
    logo_url: string;
    has_house_de_vendas: boolean;
  }>) {
    const campos = Object.entries(dto)
      .filter(([, v]) => v !== undefined)
      .map(([k], i) => `${k} = $${i + 2}`)
      .join(', ');
    const valores = Object.values(dto).filter(v => v !== undefined);

    const { rows: [c] } = await this.pool.query(
      `UPDATE construtoras SET ${campos}
       WHERE user_id = $1 RETURNING *`,
      [userId, ...valores],
    );
    return c;
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  async listarAdmin() {
    const { rows } = await this.pool.query(
      `SELECT c.id, c.nome_fantasia, c.logo_url, c.created_at,
              u.id AS user_id, u.nome, u.email, u.ativo,
              p.nome AS plano_nome,
              COUNT(DISTINCT e.id)::int AS total_empreendimentos,
              COUNT(DISTINCT e.id) FILTER (WHERE e.publicado = TRUE)::int AS publicados,
              COUNT(DISTINCT l.id)::int AS total_leads
       FROM construtoras c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN planos p ON p.id = c.plano_id
       LEFT JOIN empreendimentos e ON e.construtora_id = c.id
       LEFT JOIN leads l ON l.empreendimento_id = e.id
       WHERE u.role = 'construtora'
       GROUP BY c.id, u.id, p.nome
       ORDER BY c.created_at DESC`,
    );
    return rows;
  }

  async listarUsuarios() {
    const { rows } = await this.pool.query(
      `SELECT u.id, u.nome, u.email, u.created_at, u.ativo,
              c.id AS construtora_id, c.nome_fantasia, c.logo_url,
              p.nome AS plano_nome,
              COUNT(DISTINCT e.id)::int AS total_empreendimentos,
              COUNT(DISTINCT e.id) FILTER (WHERE e.publicado = TRUE)::int AS publicados
       FROM users u
       JOIN construtoras c ON c.user_id = u.id
       LEFT JOIN planos p ON p.id = c.plano_id
       LEFT JOIN empreendimentos e ON e.construtora_id = c.id
       WHERE u.role = 'construtora'
       GROUP BY u.id, c.id, c.nome_fantasia, c.logo_url, p.nome
       ORDER BY u.created_at DESC`,
    );
    return rows;
  }

  async resetSenha(userId: string): Promise<{ nova_senha: string }> {
    const alfa = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    const nova_senha = Array.from({ length: 10 }, () =>
      alfa[Math.floor(Math.random() * alfa.length)],
    ).join('');

    const hash = await bcrypt.hash(nova_senha, 12);
    const { rowCount } = await this.pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'construtora'`,
      [hash, userId],
    );
    if (!rowCount) throw new NotFoundException('Usuário não encontrado.');
    return { nova_senha };
  }

  async toggleAtivo(userId: string): Promise<{ ativo: boolean }> {
    const { rows: [u] } = await this.pool.query(
      `UPDATE users SET ativo = NOT ativo WHERE id = $1 AND role = 'construtora' RETURNING ativo`,
      [userId],
    );
    if (!u) throw new NotFoundException('Usuário não encontrado.');
    return { ativo: u.ativo };
  }

  async dashboard(userId: string) {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1',
      [userId],
    );

    const { rows: [stats] } = await this.pool.query(
      `SELECT
         COUNT(DISTINCT e.id) AS total_empreendimentos,
         COUNT(DISTINCT e.id) FILTER (WHERE e.publicado = TRUE) AS publicados,
         COUNT(l.id) AS total_leads,
         COUNT(l.id) FILTER (WHERE l.status = 'novo') AS leads_novos,
         COUNT(l.id) FILTER (WHERE l.status = 'convertido') AS leads_convertidos,
         COUNT(DISTINCT p.id) AS total_parceiros
       FROM construtoras c
       LEFT JOIN empreendimentos e ON e.construtora_id = c.id
       LEFT JOIN leads l ON l.empreendimento_id = e.id
       LEFT JOIN parceiros p ON p.construtora_id = c.id AND p.ativo = TRUE
       WHERE c.id = $1`,
      [c.id],
    );
    return stats;
  }
}
