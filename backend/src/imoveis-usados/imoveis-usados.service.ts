import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { StorageService } from '../storage/storage.service';
import { CriarImovelUsadoDto, AtualizarImovelUsadoDto, ConfigImovelUsadoAdminDto, DistribuicaoLeadsImovelUsado } from './dto/imovel-usado.dto';

@Injectable()
export class ImoveisUsadosService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly storage: StorageService,
  ) {}

  // ── helpers ──────────────────────────────────────────────────────────────

  private async getConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1', [userId],
    );
    if (!c) throw new ForbiddenException('Construtora não encontrada.');
    return c.id;
  }

  private async verificarPermissao(imovelId: string, construtoraId: string) {
    const { rows: [i] } = await this.pool.query(
      'SELECT id FROM imoveis_usados WHERE id = $1 AND construtora_id = $2',
      [imovelId, construtoraId],
    );
    if (!i) throw new ForbiddenException('Imóvel não encontrado ou sem permissão.');
  }

  private async verificarHabilitado(construtoraId: string) {
    const { rows: [c] } = await this.pool.query(
      'SELECT imoveis_usados_habilitado, imoveis_usados_limite FROM construtoras WHERE id = $1',
      [construtoraId],
    );
    if (!c?.imoveis_usados_habilitado) {
      throw new ForbiddenException('Módulo de imóveis usados não habilitado para esta construtora.');
    }
    return c;
  }

  private async verificarLimite(construtoraId: string) {
    const { rows: [c] } = await this.pool.query(
      `SELECT imoveis_usados_limite,
              (SELECT count(*) FROM imoveis_usados WHERE construtora_id = $1) AS total
       FROM construtoras WHERE id = $1`,
      [construtoraId],
    );
    if (Number(c.total) >= Number(c.imoveis_usados_limite)) {
      throw new BadRequestException(
        `Limite de ${c.imoveis_usados_limite} imóveis usados atingido.`,
      );
    }
  }

  // ── CRUD construtora ─────────────────────────────────────────────────────

  async listarMeus(userId: string) {
    const cid = await this.getConstrutoraId(userId);
    const { rows } = await this.pool.query(
      `SELECT iu.*,
              (SELECT url FROM imovel_usado_midias m WHERE m.imovel_usado_id = iu.id AND m.tipo = 'foto' ORDER BY m.ordem LIMIT 1) AS foto_capa
       FROM imoveis_usados iu
       WHERE iu.construtora_id = $1
       ORDER BY iu.created_at DESC`,
      [cid],
    );
    return rows;
  }

  async obter(id: string) {
    const { rows: [iu] } = await this.pool.query(
      `SELECT iu.*, c.nome_fantasia AS construtora_nome
       FROM imoveis_usados iu
       JOIN construtoras c ON c.id = iu.construtora_id
       WHERE iu.id = $1`,
      [id],
    );
    if (!iu) throw new NotFoundException('Imóvel não encontrado.');
    const { rows: midias } = await this.pool.query(
      'SELECT * FROM imovel_usado_midias WHERE imovel_usado_id = $1 ORDER BY ordem, created_at',
      [id],
    );
    return { ...iu, midias };
  }

  async criar(userId: string, dto: CriarImovelUsadoDto) {
    const cid = await this.getConstrutoraId(userId);
    await this.verificarHabilitado(cid);
    await this.verificarLimite(cid);
    const { rows: [iu] } = await this.pool.query(
      `INSERT INTO imoveis_usados
         (construtora_id, titulo, descricao, tipo, endereco, bairro, cidade, estado, cep, area, quartos, vagas, preco, status, distribuicao_leads)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        cid, dto.titulo, dto.descricao ?? null, dto.tipo ?? 'apartamento',
        dto.endereco ?? null, dto.bairro ?? null,
        dto.cidade ?? 'Belo Horizonte', dto.estado ?? 'MG',
        dto.cep ?? null, dto.area ?? null, dto.quartos ?? null,
        dto.vagas ?? null, dto.preco ?? null, dto.status ?? 'disponivel',
        dto.distribuicao_leads ?? DistribuicaoLeadsImovelUsado.CONSTRUTORA,
      ],
    );
    return iu;
  }

  async atualizar(userId: string, id: string, dto: AtualizarImovelUsadoDto) {
    const cid = await this.getConstrutoraId(userId);
    await this.verificarPermissao(id, cid);
    const campos = Object.entries(dto)
      .filter(([, v]) => v !== undefined)
      .map(([k], i) => `${k} = $${i + 2}`)
      .join(', ');
    if (!campos) return this.obter(id);
    const valores = Object.values(dto).filter(v => v !== undefined);
    const { rows: [iu] } = await this.pool.query(
      `UPDATE imoveis_usados SET ${campos}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...valores],
    );
    return iu;
  }

  async publicar(userId: string, id: string) {
    const cid = await this.getConstrutoraId(userId);
    await this.verificarPermissao(id, cid);
    const { rows: [iu] } = await this.pool.query(
      `UPDATE imoveis_usados SET publicado = TRUE, publicado_em = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return iu;
  }

  async despublicar(userId: string, id: string) {
    const cid = await this.getConstrutoraId(userId);
    await this.verificarPermissao(id, cid);
    const { rows: [iu] } = await this.pool.query(
      `UPDATE imoveis_usados SET publicado = FALSE WHERE id = $1 RETURNING *`,
      [id],
    );
    return iu;
  }

  async deletar(userId: string, id: string) {
    const cid = await this.getConstrutoraId(userId);
    await this.verificarPermissao(id, cid);
    // Remove mídias do S3
    const { rows: midias } = await this.pool.query(
      'SELECT url FROM imovel_usado_midias WHERE imovel_usado_id = $1', [id],
    );
    for (const m of midias) {
      const key = m.url.split('/').slice(-2).join('/');
      await this.storage.deletar(key);
    }
    await this.pool.query('DELETE FROM imoveis_usados WHERE id = $1', [id]);
    return { ok: true };
  }

  // ── Upload de foto ────────────────────────────────────────────────────────

  async uploadFoto(userId: string, id: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const cid = await this.getConstrutoraId(userId);
    await this.verificarPermissao(id, cid);
    const url = await this.storage.uploadBuffer(
      `imoveis-usados/${id}/${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
    const { rows: [m] } = await this.pool.query(
      `INSERT INTO imovel_usado_midias (imovel_usado_id, url, tipo, ordem)
       VALUES ($1, $2, 'foto', (SELECT COALESCE(MAX(ordem),0)+1 FROM imovel_usado_midias WHERE imovel_usado_id = $1))
       RETURNING *`,
      [id, url],
    );
    return m;
  }

  async deletarFoto(userId: string, midiaId: string) {
    const cid = await this.getConstrutoraId(userId);
    const { rows: [m] } = await this.pool.query(
      `SELECT m.*, iu.construtora_id FROM imovel_usado_midias m
       JOIN imoveis_usados iu ON iu.id = m.imovel_usado_id
       WHERE m.id = $1`,
      [midiaId],
    );
    if (!m || m.construtora_id !== cid) throw new ForbiddenException('Sem permissão.');
    const key = m.url.split('/').slice(-2).join('/');
    await this.storage.deletar(key);
    await this.pool.query('DELETE FROM imovel_usado_midias WHERE id = $1', [midiaId]);
    return { ok: true };
  }

  // ── Listagem pública ──────────────────────────────────────────────────────

  async listarPublico(filtros: {
    tipo?: string; bairro?: string; cidade?: string;
    quartos?: number; preco_max?: number;
  }) {
    const conds: string[] = ['iu.publicado = TRUE', 'iu.status = \'disponivel\''];
    const params: any[] = [];
    let i = 1;
    if (filtros.tipo)      { conds.push(`iu.tipo = $${i++}`);      params.push(filtros.tipo); }
    if (filtros.bairro)    { conds.push(`iu.bairro ILIKE $${i++}`); params.push(`%${filtros.bairro}%`); }
    if (filtros.cidade)    { conds.push(`iu.cidade ILIKE $${i++}`); params.push(`%${filtros.cidade}%`); }
    if (filtros.quartos)   { conds.push(`iu.quartos >= $${i++}`);   params.push(filtros.quartos); }
    if (filtros.preco_max) { conds.push(`iu.preco <= $${i++}`);     params.push(filtros.preco_max); }

    const { rows } = await this.pool.query(
      `SELECT iu.*, c.nome_fantasia AS construtora_nome,
              (SELECT url FROM imovel_usado_midias m WHERE m.imovel_usado_id = iu.id AND m.tipo = 'foto' ORDER BY m.ordem LIMIT 1) AS foto_capa
       FROM imoveis_usados iu
       JOIN construtoras c ON c.id = iu.construtora_id
       WHERE ${conds.join(' AND ')}
       ORDER BY iu.publicado_em DESC`,
      params,
    );
    return rows;
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  async getConfigAdmin(construtoraId: string) {
    const { rows: [c] } = await this.pool.query(
      `SELECT id, nome_fantasia, imoveis_usados_habilitado, imoveis_usados_limite,
              (SELECT count(*) FROM imoveis_usados WHERE construtora_id = c.id) AS total_cadastrados
       FROM construtoras c WHERE id = $1`,
      [construtoraId],
    );
    if (!c) throw new NotFoundException('Construtora não encontrada.');
    return c;
  }

  async setConfigAdmin(construtoraId: string, dto: ConfigImovelUsadoAdminDto) {
    const { rows: [c] } = await this.pool.query(
      `UPDATE construtoras
       SET imoveis_usados_habilitado = $2, imoveis_usados_limite = $3
       WHERE id = $1
       RETURNING id, nome_fantasia, imoveis_usados_habilitado, imoveis_usados_limite`,
      [construtoraId, dto.habilitado, dto.limite],
    );
    if (!c) throw new NotFoundException('Construtora não encontrada.');
    return c;
  }

  async listarTodosAdmin() {
    const { rows } = await this.pool.query(
      `SELECT iu.*, c.nome_fantasia AS construtora_nome
       FROM imoveis_usados iu
       JOIN construtoras c ON c.id = iu.construtora_id
       ORDER BY iu.created_at DESC`,
    );
    return rows;
  }
}
