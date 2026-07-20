import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

@Injectable()
export class FavoritosService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Lista empreendimentos favoritados pelo usuário (dados completos para o card) */
  async listar(userId: string) {
    const { rows } = await this.pool.query(
      `SELECT
         e.id, e.nome, e.slug, e.status, e.tipo,
         e.cidade, e.estado, e.bairro,
         e.preco_min, e.preco_max,
         e.area_min, e.area_max,
         e.quartos_min, e.quartos_max,
         e.vagas,
         (SELECT url FROM empreendimento_midias m
          WHERE m.empreendimento_id = e.id AND m.tipo = 'foto'
          ORDER BY m.ordem LIMIT 1) AS foto_capa,
         uf.criado_em AS favoritado_em
       FROM user_favoritos uf
       JOIN empreendimentos e ON e.id = uf.empreendimento_id
       WHERE uf.user_id = $1
       ORDER BY uf.criado_em DESC`,
      [userId],
    );
    return rows;
  }

  /** Adiciona favorito. Ignora se já existir (UPSERT). */
  async adicionar(userId: string, empreendimentoId: string) {
    await this.pool.query(
      `INSERT INTO user_favoritos (user_id, empreendimento_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, empreendimento_id) DO NOTHING`,
      [userId, empreendimentoId],
    );
    return { ok: true };
  }

  /** Remove favorito. */
  async remover(userId: string, empreendimentoId: string) {
    await this.pool.query(
      `DELETE FROM user_favoritos
       WHERE user_id = $1 AND empreendimento_id = $2`,
      [userId, empreendimentoId],
    );
    return { ok: true };
  }

  /** Retorna lista de IDs favoritados (para checar estado dos corações). */
  async listarIds(userId: string): Promise<string[]> {
    const { rows } = await this.pool.query(
      `SELECT empreendimento_id FROM user_favoritos WHERE user_id = $1`,
      [userId],
    );
    return rows.map((r: { empreendimento_id: string }) => r.empreendimento_id);
  }
}
