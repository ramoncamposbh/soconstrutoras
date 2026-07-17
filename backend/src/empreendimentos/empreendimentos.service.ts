import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import slugify from 'slugify';
import { PG_POOL } from '../database/database.module';
import { CriarEmpreendimentoDto } from './dto/criar-empreendimento.dto';
import { BuscarEmpreendimentosDto } from './dto/buscar-empreendimentos.dto';

@Injectable()
export class EmpreendimentosService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1',
      [userId],
    );
    if (!c) throw new ForbiddenException('Construtora nao encontrada para este usuario.');
    return c.id;
  }

  async criar(userId: string, dto: CriarEmpreendimentoDto) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    const slug = slugify(`${dto.nome}-${dto.cidade}`, { lower: true, strict: true });

    const { rows: [emp] } = await this.pool.query(
      `INSERT INTO empreendimentos
         (construtora_id, nome, descricao, tipo, status, endereco, bairro,
          cidade, estado, cep, latitude, longitude,
          preco_min, preco_max, area_min, area_max,
          quartos_min, quartos_max, vagas, slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        construtoraId, dto.nome, dto.descricao, dto.tipo, dto.status ?? 'lancamento',
        dto.endereco, dto.bairro, dto.cidade, dto.estado, dto.cep,
        dto.latitude ?? null, dto.longitude ?? null,
        dto.preco_min, dto.preco_max, dto.area_min, dto.area_max,
        dto.quartos_min, dto.quartos_max, dto.vagas, slug,
      ],
    );
    return emp;
  }

  async listar(userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    const { rows } = await this.pool.query(
      `SELECT e.*, COUNT(l.id) AS total_leads
       FROM empreendimentos e
       LEFT JOIN leads l ON l.empreendimento_id = e.id
       WHERE e.construtora_id = $1
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [construtoraId],
    );
    return rows;
  }

  async buscarPublico(filtros: BuscarEmpreendimentosDto) {
    const conditions: string[] = ['e.publicado = TRUE'];
    const params: any[] = [];
    let i = 1;

    if (filtros.cidade) { conditions.push(`e.cidade ILIKE $${i++}`); params.push(`%${filtros.cidade}%`); }
    if (filtros.estado) { conditions.push(`e.estado = $${i++}`); params.push(filtros.estado.toUpperCase()); }
    if (filtros.tipo) { conditions.push(`e.tipo = $${i++}`); params.push(filtros.tipo); }
    if (filtros.preco_min) { conditions.push(`e.preco_max >= $${i++}`); params.push(filtros.preco_min); }
    if (filtros.preco_max) { conditions.push(`e.preco_min <= $${i++}`); params.push(filtros.preco_max); }
    if (filtros.quartos_min) { conditions.push(`e.quartos_max >= $${i++}`); params.push(filtros.quartos_min); }
    if (filtros.vagas) { conditions.push(`e.vagas >= $${i++}`); params.push(filtros.vagas); }
    if (filtros.area_min) { conditions.push(`e.area_max >= $${i++}`); params.push(filtros.area_min); }

    const where  = conditions.join(' AND ');
    const limit  = Math.min(filtros.limite ?? 20, 50);
    const offset = (filtros.pagina ?? 0) * limit;

    const { rows } = await this.pool.query(
      `SELECT e.id, e.nome, e.slug, e.tipo, e.status, e.bairro, e.cidade, e.estado,
              e.preco_min, e.preco_max, e.area_min, e.area_max,
              e.quartos_min, e.quartos_max, e.vagas,
              e.latitude, e.longitude,
              c.nome_fantasia AS construtora,
              (SELECT url FROM empreendimento_midias m
               WHERE m.empreendimento_id = e.id AND m.tipo = 'foto'
               ORDER BY m.ordem LIMIT 1) AS foto_capa
       FROM empreendimentos e
       JOIN construtoras c ON c.id = e.construtora_id
       WHERE ${where}
       ORDER BY e.publicado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset],
    );
    return rows;
  }

  async buscarPorSlug(slug: string) {
    const { rows: [emp] } = await this.pool.query(
      `SELECT e.*, c.nome_fantasia AS construtora, c.logo_url AS construtora_logo,
              json_agg(m ORDER BY m.ordem) FILTER (WHERE m.id IS NOT NULL) AS midias
       FROM empreendimentos e
       JOIN construtoras c ON c.id = e.construtora_id
       LEFT JOIN empreendimento_midias m ON m.empreendimento_id = e.id
       WHERE e.slug = $1 AND e.publicado = TRUE
       GROUP BY e.id, c.nome_fantasia, c.logo_url`,
      [slug],
    );
    if (!emp) throw new NotFoundException('Empreendimento nao encontrado.');
    return emp;
  }

  async publicar(id: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(id, construtoraId);
    const { rows: [emp] } = await this.pool.query(
      `UPDATE empreendimentos SET publicado = TRUE, publicado_em = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return emp;
  }

  async atualizar(id: string, userId: string, dto: Partial<CriarEmpreendimentoDto>) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(id, construtoraId);

    const entradas = Object.entries(dto).filter(([, v]) => v !== undefined && v === v);
    if (entradas.length === 0) return;

    const campos = entradas.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const valores = entradas.map(([, v]) => v);

    const { rows: [emp] } = await this.pool.query(
      `UPDATE empreendimentos SET ${campos} WHERE id = $1 RETURNING *`,
      [id, ...valores],
    );
    return emp;
  }

  async remover(id: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(id, construtoraId);
    await this.pool.query('DELETE FROM empreendimentos WHERE id = $1', [id]);
    return { ok: true };
  }

  private async verificarPropriedade(id: string, construtoraId: string) {
    const { rows: [emp] } = await this.pool.query(
      'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
      [id, construtoraId],
    );
    if (!emp) throw new ForbiddenException('Empreendimento nao encontrado ou sem permissao.');
  }
}
