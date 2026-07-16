import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // ── Helpers ──────────────────────────────────────────────────────

  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1', [userId],
    );
    if (!c) throw new ForbiddenException('Construtora não encontrada.');
    return c.id;
  }

  private async verificarPropriedadeEmpreendimento(
    empreendimentoId: string, construtoraId: string,
  ) {
    const { rows: [e] } = await this.pool.query(
      'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
      [empreendimentoId, construtoraId],
    );
    if (!e) throw new ForbiddenException('Empreendimento não encontrado ou sem permissão.');
  }

  private async verificarPropriedadeUnidade(
    unidadeId: string, construtoraId: string,
  ): Promise<string> {
    const { rows: [u] } = await this.pool.query(
      `SELECT u.id, u.empreendimento_id
       FROM unidades u
       JOIN empreendimentos e ON e.id = u.empreendimento_id
       WHERE u.id = $1 AND e.construtora_id = $2`,
      [unidadeId, construtoraId],
    );
    if (!u) throw new ForbiddenException('Unidade não encontrada ou sem permissão.');
    return u.empreendimento_id;
  }

  private async verificarLimite(empreendimentoId: string, construtoraId: string) {
    const { rows: [c] } = await this.pool.query(
      'SELECT limite_unidades FROM construtoras WHERE id = $1', [construtoraId],
    );
    const limite = c?.limite_unidades ?? 10;

    const { rows: [cnt] } = await this.pool.query(
      'SELECT COUNT(*)::int AS total FROM unidades WHERE empreendimento_id = $1',
      [empreendimentoId],
    );
    if (cnt.total >= limite) {
      throw new BadRequestException(
        `Limite de ${limite} unidades atingido. Faça upgrade do seu plano para adicionar mais.`,
      );
    }
  }

  // ── CRUD Unidades ─────────────────────────────────────────────────

  async listar(empreendimentoId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeEmpreendimento(empreendimentoId, construtoraId);

    const { rows } = await this.pool.query(
      `SELECT u.*,
        COALESCE(
          json_agg(m ORDER BY m.ordem) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) AS midias
       FROM unidades u
       LEFT JOIN unidade_midias m ON m.unidade_id = u.id
       WHERE u.empreendimento_id = $1
       GROUP BY u.id
       ORDER BY u.ordem, u.created_at`,
      [empreendimentoId],
    );
    return rows;
  }

  /** Listagem pública: sem auth, sem filtro de construtora */
  async listarPublico(empreendimentoId: string) {
    const { rows } = await this.pool.query(
      `SELECT u.*,
        COALESCE(
          json_agg(m ORDER BY m.ordem) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) AS midias
       FROM unidades u
       LEFT JOIN unidade_midias m ON m.unidade_id = u.id
       WHERE u.empreendimento_id = $1
       GROUP BY u.id
       ORDER BY u.ordem, u.created_at`,
      [empreendimentoId],
    );
    return rows;
  }

  async criar(empreendimentoId: string, userId: string, dto: CriarUnidadeDto) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeEmpreendimento(empreendimentoId, construtoraId);
    await this.verificarLimite(empreendimentoId, construtoraId);

    const { rows: [u] } = await this.pool.query(
      `INSERT INTO unidades
         (empreendimento_id, tipo, nome, metragem_privativa, metragem_total,
          quartos, suites, vagas, preco, descricao, disponivel, ordem)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        empreendimentoId, dto.tipo, dto.nome ?? null,
        dto.metragem_privativa ?? null, dto.metragem_total ?? null,
        dto.quartos ?? 0, dto.suites ?? 0, dto.vagas ?? 0,
        dto.preco ?? null, dto.descricao ?? null,
        dto.disponivel ?? true, dto.ordem ?? 0,
      ],
    );
    return { ...u, midias: [] };
  }

  async atualizar(unidadeId: string, userId: string, dto: Partial<CriarUnidadeDto>) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);

    const campos = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (campos.length === 0) return;

    const sets   = campos.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const valores = campos.map(([, v]) => v);

    const { rows: [u] } = await this.pool.query(
      `UPDATE unidades SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [unidadeId, ...valores],
    );
    return u;
  }

  async remover(unidadeId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    await this.pool.query('DELETE FROM unidades WHERE id = $1', [unidadeId]);
    return { ok: true };
  }

  // ── Mídias da Unidade ─────────────────────────────────────────────

  async listarMidias(unidadeId: string) {
    const { rows } = await this.pool.query(
      'SELECT * FROM unidade_midias WHERE unidade_id = $1 ORDER BY ordem, created_at',
      [unidadeId],
    );
    return rows;
  }

  async adicionarMidia(
    unidadeId: string, userId: string,
    body: { url: string; tipo?: string; legenda?: string },
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);

    const { rows: [m] } = await this.pool.query(
      `INSERT INTO unidade_midias (unidade_id, url, tipo, legenda)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [unidadeId, body.url, body.tipo ?? 'foto', body.legenda ?? null],
    );
    return m;
  }

  async removerMidia(unidadeId: string, midiaId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    await this.pool.query(
      'DELETE FROM unidade_midias WHERE id = $1 AND unidade_id = $2',
      [midiaId, unidadeId],
    );
    return { ok: true };
  }
}
