/**
 * MidiasService
 *
 * Fluxo de upload sem tráfegar o arquivo pelo servidor (mais rápido e barato):
 *  1. Frontend solicita uma URL pré-assinada → gerarUrlUpload()
 *  2. Frontend faz PUT diretamente no R2/S3 usando essa URL
 *  3. Frontend chama confirmarUpload() passando a URL pública do arquivo
 *  4. Serviço salva o registro em empreendimento_midias
 *
 * Compatível com Cloudflare R2 e AWS S3 (ambos implementam a mesma API).
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MidiasService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
  ) {
    this.bucket    = config.getOrThrow('STORAGE_BUCKET');
    this.publicUrl = config.getOrThrow('STORAGE_PUBLIC_URL');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.getOrThrow('STORAGE_ENDPOINT'),
      credentials: {
        accessKeyId:     config.getOrThrow('STORAGE_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow('STORAGE_SECRET_KEY'),
      },
    });
  }

  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1',
      [userId],
    );
    if (!c) throw new ForbiddenException('Construtora não encontrada para este usuário.');
    return c.id;
  }

  /**
   * Gera uma URL pré-assinada para que o frontend faça upload direto.
   * Expira em 5 minutos.
   */
  async gerarUrlUpload(
    empreendimentoId: string,
    userId: string,
    tipo: 'foto' | 'video' | 'planta' | 'tour_virtual',
    contentType: string,
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);

    const ext      = contentType.split('/')[1] ?? 'jpg';
    const key      = `empreendimentos/${empreendimentoId}/${tipo}/${uuidv4()}.${ext}`;
    const urlPublica = `${this.publicUrl}/${key}`;

    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key:    key,
      Conditions: [
        ['content-length-range', 0, 20 * 1024 * 1024], // max 20 MB
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: 300, // 5 minutos
    });

    return { uploadUrl: url, fields, urlPublica, key };
  }

  /**
   * Após o upload concluído, registra a mídia no banco.
   */
  async confirmarUpload(
    empreendimentoId: string,
    userId: string,
    dto: {
      url: string;
      tipo: 'foto' | 'video' | 'planta' | 'tour_virtual';
      legenda?: string;
    },
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);

    // Define a ordem como próximo índice disponível
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

  /** Lista mídias de um empreendimento ordenadas */
  async listar(empreendimentoId: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM empreendimento_midias
       WHERE empreendimento_id = $1 ORDER BY ordem ASC`,
      [empreendimentoId],
    );
    return rows;
  }

  /** Reordena mídias (drag-and-drop) */
  async reordenar(
    empreendimentoId: string,
    userId: string,
    ordens: { id: string; ordem: number }[],
  ) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const { id, ordem } of ordens) {
        await client.query(
          `UPDATE empreendimento_midias SET ordem = $1
           WHERE id = $2 AND empreendimento_id = $3`,
          [ordem, id, empreendimentoId],
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

  /** Remove uma mídia do banco e do storage */
  async remover(id: string, empreendimentoId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(empreendimentoId, construtoraId);

    const { rows: [midia] } = await this.pool.query(
      'DELETE FROM empreendimento_midias WHERE id = $1 AND empreendimento_id = $2 RETURNING *',
      [id, empreendimentoId],
    );

    if (midia) {
      // Extrai a key do R2/S3 da URL pública
      const key = midia.url.replace(`${this.publicUrl}/`, '');
      if (midia.url.includes(this.publicUrl)) {
        const key = midia.url.replace(this.publicUrl + '/', '');
        try {
          await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        } catch {
          // Não bloqueia se falhar no storage
        }
      }
    }
    return { ok: true };
  }

  private async verificarPropriedade(empreendimentoId: string, construtoraId: string) {
    const { rows: [emp] } = await this.pool.query(
      'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
      [empreendimentoId, construtoraId],
    );
    if (!emp) throw new ForbiddenException('Empreendimento não encontrado ou sem permissão.');
  }
}
