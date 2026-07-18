import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { PG_POOL } from '../database/database.module';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class LojasService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly storage: StorageService,
  ) {}

  // ── Guards ────────────────────────────────────────────────────────────────
  private assertAdmin(role: string) {
    if (role !== 'admin')
      throw new ForbiddenException('Apenas administradores podem realizar esta ação.');
  }

  // ── Categorias ────────────────────────────────────────────────────────────
  async listarCategorias() {
    const { rows } = await this.pool.query(
      `SELECT c.*, COUNT(l.id)::int AS total_lojas
       FROM lojas_categorias c
       LEFT JOIN lojas l ON l.categoria_id = c.id AND l.ativo = TRUE
       WHERE c.ativo = TRUE
       GROUP BY c.id
       ORDER BY c.ordem, c.nome`,
    );
    return rows;
  }

  async criarCategoria(role: string, dto: { nome: string; icone?: string; ordem?: number }) {
    this.assertAdmin(role);
    const { rows: [cat] } = await this.pool.query(
      `INSERT INTO lojas_categorias (nome, icone, ordem) VALUES ($1, $2, $3) RETURNING *`,
      [dto.nome, dto.icone ?? null, dto.ordem ?? 0],
    );
    return cat;
  }

  async removerCategoria(role: string, id: string) {
    this.assertAdmin(role);
    const { rows: [{ total }] } = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM lojas WHERE categoria_id = $1 AND ativo = TRUE`,
      [id],
    );
    if (total > 0)
      throw new BadRequestException('Categoria possui lojas ativas. Remova-as primeiro.');
    await this.pool.query(`UPDATE lojas_categorias SET ativo = FALSE WHERE id = $1`, [id]);
    return { ok: true };
  }

  // ── Lojas — público ───────────────────────────────────────────────────────
  async listarPublico() {
    const { rows } = await this.pool.query(
      `SELECT l.*,
              c.nome AS categoria_nome, c.icone AS categoria_icone,
              (SELECT url FROM lojas_midias m WHERE m.loja_id = l.id ORDER BY m.ordem LIMIT 1)
                AS primeira_midia
       FROM lojas l
       JOIN lojas_categorias c ON c.id = l.categoria_id
       WHERE l.ativo = TRUE AND c.ativo = TRUE
       ORDER BY c.ordem, c.nome, l.nome`,
    );
    return rows;
  }

  async buscarPorSlug(slug: string) {
    const { rows: [loja] } = await this.pool.query(
      `SELECT l.*, c.nome AS categoria_nome, c.icone AS categoria_icone
       FROM lojas l
       JOIN lojas_categorias c ON c.id = l.categoria_id
       WHERE l.slug = $1 AND l.ativo = TRUE`,
      [slug],
    );
    if (!loja) throw new NotFoundException('Parceiro não encontrado.');
    const { rows: midias } = await this.pool.query(
      `SELECT * FROM lojas_midias WHERE loja_id = $1 ORDER BY ordem`,
      [loja.id],
    );
    return { ...loja, midias };
  }

  // ── Lojas — admin ─────────────────────────────────────────────────────────
  async listarAdmin(role: string) {
    this.assertAdmin(role);
    const { rows } = await this.pool.query(
      `SELECT l.*, c.nome AS categoria_nome
       FROM lojas l
       JOIN lojas_categorias c ON c.id = l.categoria_id
       ORDER BY c.nome, l.nome`,
    );
    return rows;
  }

  async criar(role: string, dto: any) {
    this.assertAdmin(role);
    const slug = dto.slug ? dto.slug : this.gerarSlug(dto.nome);
    const { rows: [loja] } = await this.pool.query(
      `INSERT INTO lojas
         (categoria_id, nome, slug, descricao, site_url, whatsapp, codigo_desconto, descricao_desconto)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        dto.categoria_id, dto.nome, slug,
        dto.descricao ?? null, dto.site_url ?? null,
        dto.whatsapp ?? null, dto.codigo_desconto ?? null,
        dto.descricao_desconto ?? null,
      ],
    );
    return loja;
  }

  async atualizar(role: string, id: string, dto: any) {
    this.assertAdmin(role);
    const { rows: [loja] } = await this.pool.query(
      `UPDATE lojas SET
         categoria_id       = COALESCE($1,  categoria_id),
         nome               = COALESCE($2,  nome),
         descricao          = COALESCE($3,  descricao),
         logo_url           = COALESCE($4,  logo_url),
         site_url           = COALESCE($5,  site_url),
         whatsapp           = COALESCE($6,  whatsapp),
         codigo_desconto    = COALESCE($7,  codigo_desconto),
         descricao_desconto = COALESCE($8,  descricao_desconto),
         ativo              = COALESCE($9,  ativo),
         atualizado_em      = NOW()
       WHERE id = $10 RETURNING *`,
      [
        dto.categoria_id ?? null, dto.nome ?? null,
        dto.descricao ?? null, dto.logo_url ?? null,
        dto.site_url ?? null, dto.whatsapp ?? null,
        dto.codigo_desconto ?? null, dto.descricao_desconto ?? null,
        dto.ativo ?? null, id,
      ],
    );
    if (!loja) throw new NotFoundException('Loja não encontrada.');
    return loja;
  }

  async remover(role: string, id: string) {
    this.assertAdmin(role);
    await this.pool.query(`UPDATE lojas SET ativo = FALSE WHERE id = $1`, [id]);
    return { ok: true };
  }

  // ── Mídias ────────────────────────────────────────────────────────────────
  async uploadLogo(role: string, lojaId: string, file: Express.Multer.File) {
    this.assertAdmin(role);
    const ext = (file.mimetype.split('/')[1] ?? 'png').replace('jpeg', 'jpg');
    const key = `lojas/logos/${lojaId}-${uuidv4()}.${ext}`;
    const url = await this.storage.uploadBuffer(key, file.buffer, file.mimetype);
    await this.pool.query(`UPDATE lojas SET logo_url = $1 WHERE id = $2`, [url, lojaId]);
    return { url };
  }

  async uploadFoto(role: string, lojaId: string, file: Express.Multer.File) {
    this.assertAdmin(role);
    const { rows: [{ total }] } = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM lojas_midias WHERE loja_id = $1`,
      [lojaId],
    );
    if (total >= 20) throw new BadRequestException('Limite de 20 fotos atingido.');

    const ext = (file.mimetype.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const key = `lojas/${lojaId}/${uuidv4()}.${ext}`;
    const url = await this.storage.uploadBuffer(key, file.buffer, file.mimetype);

    const { rows: [{ prox_ordem }] } = await this.pool.query(
      `SELECT COALESCE(MAX(ordem)+1, 0) AS prox_ordem FROM lojas_midias WHERE loja_id = $1`,
      [lojaId],
    );
    const { rows: [midia] } = await this.pool.query(
      `INSERT INTO lojas_midias (loja_id, url, ordem) VALUES ($1,$2,$3) RETURNING *`,
      [lojaId, url, prox_ordem],
    );
    return midia;
  }

  async removerMidia(role: string, lojaId: string, midiaId: string) {
    this.assertAdmin(role);
    const { rows: [midia] } = await this.pool.query(
      `DELETE FROM lojas_midias WHERE id = $1 AND loja_id = $2 RETURNING *`,
      [midiaId, lojaId],
    );
    if (midia?.url) await this.storage.deletar(midia.url);
    return { ok: true };
  }

  // ── Utils ─────────────────────────────────────────────────────────────────
  private gerarSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
