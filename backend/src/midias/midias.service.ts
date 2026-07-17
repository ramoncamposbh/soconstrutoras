/**
 * MidiasService — empreendimentos
 *
 * Fluxo de upload sem trafegar o arquivo pelo servidor:
 *  1. Frontend solicita URL pré-assinada → gerarUrlUpload()
 *  2. Frontend faz POST diretamente no R2 com a URL + fields
 *  3. Frontend chama confirmarUpload() passando a urlPublica retornada
 *  4. Serviço registra a mídia em empreendimento_midias
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { PG_POOL } from '../database/database.module';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MidiasService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly storage: StorageService,
  ) {}

  // ── helpers ───────────────────────────────────────────────────────

  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1', [userId],
    );
    if (!c) throw new ForbiddenException('Construtora não encontrada para este usuário.');
    return c.id;
  }

  private async verificarPropriedade(empreendimentoId: string, construtoraId: string) {
    const { rows: [emp] } = await this.pool.query(
      'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
      [empreendimentoId, construtoraId],
    );
    if (!emp) throw new ForbiddenException('Empreendimento não encontrado ou sem permissão.');
  }

  // ── upload ────────────────────────────────────────────────────────

  /**
   * Upload via proxy: o arquivo passa pelo backend e vai direto ao R2.
   * Não exige CORS no bucket. Usado pelo endpoint /upload-local.
   */
  async uploadViaProxy(
    empreendimentoId: string,
    userId: string,
    tipo: 'foto' | 'video' | 'planta' | 'tour_virtual',
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);

    const ext = (file.mimetype.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const key = `empreendimentos/${empreendimentoId}/${tipo}/${uuidv4()}.${ext}`;
    const url = await this.storage.uploadBuffer(key, file.buffer, file.mimetype);

    const { rows: [{ prox_ordem }] } = await this.pool.query(
      `SELECT COALESCE(MAX(ordem) + 1, 0) AS prox_ordem
       FROM empreendimento_midias WHERE empreendimento_id = $1`,
      [empreendimentoId],
    );
    const { rows: [midia] } = await this.pool.query(
      `INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [empreendimentoId, url, tipo, prox_ordem],
    );
    return midia;
  }

  async gerarUrlUpload(
    empreendimentoId: string,
    userId: string,
    tipo: 'foto' | 'video' | 'planta' | 'tour_virtual',
    contentType: string,
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);
    return this.storage.gerarPresignedPost(
      `empreendimentos/${empreendimentoId}/${tipo}`,
      contentType,
    );
  }

  async confirmarUpload(
    empreendimentoId: string,
    userId: string,
    dto: { url: string; tipo: 'foto' | 'video' | 'planta' | 'tour_virtual'; legenda?: string },
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);

    const { rows: [{ prox_ordem }] } = await this.pool.query(
      `SELECT COALESCE(MAX(ordem) + 1, 0) AS prox_ordem
       FROM empreendimento_midias WHERE empreendimento_id = $1`,
      [empreendimentoId],
    );

    const { rows: [midia] } = await this.pool.query(
      `INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem, legenda)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [empreendimentoId, dto.url, dto.tipo, prox_ordem, dto.legenda ?? null],
    );
    return midia;
  }

  // ── listagem e reordenação ────────────────────────────────────────

  async listar(empreendimentoId: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM empreendimento_midias
       WHERE empreendimento_id = $1 ORDER BY ordem ASC`,
      [empreendimentoId],
    );
    return rows;
  }

  async reordenar(
    empreend