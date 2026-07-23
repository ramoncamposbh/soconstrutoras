import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { PG_POOL } from '../database/database.module';
import { StorageService } from '../storage/storage.service';
import { CriarUnidadeDto } from './dto/criar-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly storage: StorageService,
  ) {}

  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1', [userId],
    );
    if (!c) throw new ForbiddenException('Construtora nao encontrada.');
    return c.id;
  }

  private async verificarPropriedadeEmpreendimento(empreendimentoId: string, construtoraId: string) {
    const { rows: [e] } = await this.pool.query(
      'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
      [empreendimentoId, construtoraId],
    );
    if (!e) throw new ForbiddenException('Empreendimento nao encontrado ou sem permissao.');
  }

  private async verificarPropriedadeUnidade(unidadeId: string, construtoraId: string): Promise<string> {
    const { rows: [u] } = await this.pool.query(
      `SELECT u.id, u.empreendimento_id
       FROM unidades u
       JOIN empreendimentos e ON e.id = u.empreendimento_id
       WHERE u.id = $1 AND e.construtora_id = $2`,
      [unidadeId, construtoraId],
    );
    if (!u) throw new ForbiddenException('Unidade nao encontrada ou sem permissao.');
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
      throw new BadRequestException(`Limite de ${limite} unidades atingido. Faca upgrade do seu plano.`);
    }
  }

  async listar(empreendimentoId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeEmpreendimento(empreendimentoId, construtoraId);
    const { rows: unidades } = await this.pool.query(
      `SELECT * FROM unidades WHERE empreendimento_id = $1 ORDER BY ordem, created_at`,
      [empreendimentoId],
    );
    if (unidades.length === 0) return [];
    const ids = unidades.map((u: any) => u.id);
    const { rows: midias } = await this.pool.query(
      `SELECT * FROM unidade_midias WHERE unidade_id = ANY($1) ORDER BY ordem, created_at`,
      [ids],
    );
    return unidades.map((u: any) => ({
      ...u,
      midias: midias.filter((m: any) => m.unidade_id === u.id),
    }));
  }

  async listarPublico(empreendimentoId: string) {
    const { rows: unidades } = await this.pool.query(
      `SELECT * FROM unidades WHERE empreendimento_id = $1 ORDER BY ordem, created_at`,
      [empreendimentoId],
    );
    if (unidades.length === 0) return [];
    const ids = unidades.map((u: any) => u.id);
    const { rows: midias } = await this.pool.query(
      `SELECT * FROM unidade_midias WHERE unidade_id = ANY($1) ORDER BY ordem, created_at`,
      [ids],
    );
    return unidades.map((u: any) => ({
      ...u,
      midias: midias.filter((m: any) => m.unidade_id === u.id),
    }));
  }

  async listarAdmin(empreendimentoId: string) {
    const { rows: unidades } = await this.pool.query(
      `SELECT * FROM unidades WHERE empreendimento_id = $1 ORDER BY ordem, created_at`,
      [empreendimentoId],
    );
    if (unidades.length === 0) return [];
    const ids = unidades.map((u: any) => u.id);
    const { rows: midias } = await this.pool.query(
      `SELECT * FROM unidade_midias WHERE unidade_id = ANY($1) ORDER BY ordem, created_at`,
      [ids],
    );
    return unidades.map((u: any) => ({
      ...u,
      midias: midias.filter((m: any) => m.unidade_id === u.id),
    }));
  }

  async criar(empreendimentoId: string, userId: string, dto: CriarUnidadeDto) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeEmpreendimento(empreendimentoId, construtoraId);
    await this.verificarLimite(empreendimentoId, construtoraId);
    const { rows: [u] } = await this.pool.query(
      `INSERT INTO unidades
         (empreendimento_id, tipo, nome, metragem_privativa, metragem_total,
          quartos, suites, vagas, preco, descricao, disponivel, ordem)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
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
    const campos  = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (campos.length === 0) return;
    const sets    = campos.map(([k], i) => `${k} = $${i + 2}`).join(', ');
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
    const { rows: midias } = await this.pool.query(
      'SELECT url FROM unidade_midias WHERE unidade_id = $1', [unidadeId],
    );
    await Promise.all(midias.map((m: any) => this.storage.deletar(m.url)));
    await this.pool.query('DELETE FROM unidades WHERE id = $1', [unidadeId]);
    return { ok: true };
  }

  async uploadViaProxy(
    unidadeId: string, userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    const empId = await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    const ext = (file.mimetype.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const key = `unidades/${empId}/${unidadeId}/${uuidv4()}.${ext}`;
    const url = await this.storage.uploadBuffer(key, file.buffer, file.mimetype);
    const { rows: [m] } = await this.pool.query(
      `INSERT INTO unidade_midias (unidade_id, url, tipo) VALUES ($1, $2, 'foto') RETURNING *`,
      [unidadeId, url],
    );
    return m;
  }

  async gerarUrlUploadMidia(unidadeId: string, userId: string, contentType: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    const empId = await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    return this.storage.gerarPresignedPost(`unidades/${empId}/${unidadeId}`, contentType);
  }

  async adicionarMidia(
    unidadeId: string, userId: string,
    body: { url: string; tipo?: string; legenda?: string },
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    const { rows: [m] } = await this.pool.query(
      `INSERT INTO unidade_midias (unidade_id, url, tipo, legenda) VALUES ($1, $2, $3, $4) RETURNING *`,
      [unidadeId, body.url, body.tipo ?? 'foto', body.legenda ?? null],
    );
    return m;
  }

  async reordenarMidias(
    unidadeId: string, userId: string,
    ordens: { id: string; ordem: number }[],
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const { id, ordem } of ordens) {
        await client.query(
          'UPDATE unidade_midias SET ordem = $1 WHERE id = $2 AND unidade_id = $3',
          [ordem, id, unidadeId],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return { ok: true };
  }

  async removerMidia(unidadeId: string, midiaId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedadeUnidade(unidadeId, construtoraId);
    const { rows: [m] } = await this.pool.query(
      'DELETE FROM unidade_midias WHERE id = $1 AND unidade_id = $2 RETURNING url',
      [midiaId, unidadeId],
    );
    if (m?.url) await this.storage.deletar(m.url);
    return { ok: true };
  }
}
