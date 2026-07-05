import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
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
