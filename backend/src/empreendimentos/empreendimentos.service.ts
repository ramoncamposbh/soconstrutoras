import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import slugify from 'slugify';
import { PG_POOL } from '../database/database.module';
import { CriarEmpreendimentoDto } from './dto/criar-empreendimento.dto';
import { BuscarEmpreendimentosDto } from './dto/buscar-empreendimentos.dto';

@Injectable()
export class EmpreendimentosService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Resolve o construtoras.id a partir do users.id (sub do JWT) */
  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1',
      [userId],
    );
    if (!c) throw new ForbiddenException('Construtora não encontrada para este usuário.');
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

    if (filtros.cidade) {
      conditions.push(`e.cidade ILIKE $${i++}`);
      params.push(`%${filtros.cidade}%`);
    }
    if (filtros.estado) {
      conditions.push(`e.estado = $${i++}`);
      params.push(filtros.estado.toUpperCase());
    }
    if (filtros.tipo) {
      conditions.push(`LOWER(e.tipo) = LOWER($${i++})`);
      params.push(filtros.tipo);
    }
    if (filtros.preco_min) {
      conditions.push(`e.preco_max >= $${i++}`);
      params.push(filtros.preco_min);
    }
    if (filtros.preco_max) {
      conditions.push(`e.preco_min <= $${i++}`);
      params.push(filtros.preco_max);
    }
    if (filtros.quartos_min) {
      conditions.push(`COALESCE(e.quartos_max, e.quartos_min, 0) >= $${i++}`);
      params.push(filtros.quartos_min);
    }
    if (filtros.vagas) {
      conditions.push(`e.vagas >= $${i++}`);
      params.push(filtros.vagas);
    }
    if (filtros.area_min) {
      conditions.push(`e.area_max >= $${i++}`);
      params.push(filtros.area_min);
    }
    if (filtros.bairros) {
      const arr = filtros.bairros.split(',').map((b: string) => b.trim()).filter(Boolean);
      if (arr.length === 1) {
        conditions.push(`e.bairro ILIKE $${i++}`);
        params.push(`%${arr[0]}%`);
      } else if (arr.length > 1) {
        conditions.push(`e.bairro = ANY($${i++}::text[])`);
        params.push(arr);
      }
    }
    if (filtros.busca) {
      // Busca só na descricao (amenidades são características, não fazem parte do nome)
      // REPLACE remove hifens para "co-working" e "coworking" serem equivalentes
      conditions.push(`REPLACE(e.descricao, '-', '') ILIKE $${i}`);
      params.push(`%${filtros.busca.replace(/-/g, '')}%`);
      i++;
    }

    const where = conditions.join(' AND ');
    const limit  = Math.min(filtros.limite ?? 500, 1000);
    const offset = (filtros.pagina ?? 0) * limit;

    const { rows } = await this.pool.query(
      `SELECT e.id, e.nome, e.slug, e.tipo, e.status, e.bairro, e.cidade, e.estado,
              e.preco_min, e.preco_max, e.area_min, e.area_max,
              e.quartos_min, e.quartos_max, e.vagas,
              e.latitude, e.longitude, e.descricao,
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

  async getCidades(estado: string): Promise<string[]> {
    if (!estado) return [];
    const { rows } = await this.pool.query(
      `SELECT DISTINCT cidade FROM empreendimentos
       WHERE publicado = TRUE AND estado = $1 AND cidade IS NOT NULL
       ORDER BY cidade`,
      [estado.toUpperCase()],
    );
    return rows.map((r: any) => r.cidade);
  }

  async getBairros(cidade: string): Promise<string[]> {
    if (!cidade) return [];
    const { rows } = await this.pool.query(
      `SELECT DISTINCT bairro FROM empreendimentos
       WHERE publicado = TRUE AND cidade ILIKE $1 AND bairro IS NOT NULL AND bairro <> ''
       ORDER BY bairro`,
      [cidade],
    );
    return rows.map((r: any) => r.bairro).filter(Boolean);
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
    if (!emp) throw new NotFoundException('Empreendimento não encontrado.');
    return emp;
  }

  async publicar(id: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(id, construtoraId);
    const { rows: [emp] } = await this.pool.query(
      `UPDATE empreendimentos
       SET publicado = TRUE, publicado_em = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return emp;
  }

  async atualizar(id: string, userId: string, dto: Partial<CriarEmpreendimentoDto>) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.verificarPropriedade(id, construtoraId);

    // Remove campos undefined e NaN (hidden inputs vazios viram NaN)
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

  private async verificarPropriedade(id: string, construtoraId: string) {
    const { rows: [emp] } = await this.pool.query(
      'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
      [id, construtoraId],
    );
    if (!emp) throw new ForbiddenException('Empreendimento não encontrado ou sem permissão.');
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  async listarTodas() {
    const { rows } = await this.pool.query(
      `SELECT e.id, e.nome, e.slug, e.tipo, e.status, e.publicado, e.publicado_em,
              e.cidade, e.estado, e.bairro, e.latitude, e.longitude, e.preco_min, e.preco_max, e.created_at,
              c.nome_fantasia AS construtora_nome, c.id AS construtora_id,
              u.email AS construtora_email,
              COUNT(DISTINCT l.id)::int AS total_leads,
              COUNT(DISTINCT un.id)::int AS total_unidades,
              (SELECT url FROM empreendimento_midias m
               WHERE m.empreendimento_id = e.id AND m.tipo = 'foto'
               ORDER BY m.ordem LIMIT 1) AS foto_capa
       FROM empreendimentos e
       JOIN construtoras c ON c.id = e.construtora_id
       JOIN users u ON u.id = c.user_id
       LEFT JOIN leads l ON l.empreendimento_id = e.id
       LEFT JOIN unidades un ON un.empreendimento_id = e.id
       GROUP BY e.id, c.nome_fantasia, c.id, u.email
       ORDER BY e.created_at DESC`,
    );
    return rows;
  }

  async listarPorConstrutora(construtoraId: string) {
    const { rows } = await this.pool.query(
      `SELECT e.id, e.nome, e.slug, e.tipo, e.status, e.publicado, e.publicado_em,
              e.cidade, e.estado, e.preco_min, e.preco_max, e.created_at,
              COUNT(DISTINCT l.id)::int AS total_leads,
              COUNT(DISTINCT un.id)::int AS total_unidades,
              (SELECT url FROM empreendimento_midias m
               WHERE m.empreendimento_id = e.id AND m.tipo = 'foto'
               ORDER BY m.ordem LIMIT 1) AS foto_capa
       FROM empreendimentos e
       LEFT JOIN leads l ON l.empreendimento_id = e.id
       LEFT JOIN unidades un ON un.empreendimento_id = e.id
       WHERE e.construtora_id = $1
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [construtoraId],
    );
    return rows;
  }

  async editarAdmin(id: string, dto: { nome?: string; status?: string; tipo?: string }) {
    const entradas = Object.entries(dto).filter(([, v]) => v !== undefined && v !== '');
    if (entradas.length === 0) return;
    const campos = entradas.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const valores = entradas.map(([, v]) => v);
    const { rows: [emp] } = await this.pool.query(
      `UPDATE empreendimentos SET ${campos} WHERE id = $1 RETURNING id, nome, status, tipo`,
      [id, ...valores],
    );
    if (!emp) throw new NotFoundException('Empreendimento não encontrado.');
    return emp;
  }

  async togglePublicado(id: string) {
    const { rows: [emp] } = await this.pool.query(
      `UPDATE empreendimentos
       SET publicado    = NOT publicado,
           publicado_em = CASE WHEN NOT publicado THEN NOW() ELSE publicado_em END
       WHERE id = $1 RETURNING id, nome, publicado`,
      [id],
    );
    if (!emp) throw new NotFoundException('Empreendimento não encontrado.');
    return emp;
  }

  async deletarAdmin(id: string) {
    const { rows: [emp] } = await this.pool.query(
      'DELETE FROM empreendimentos WHERE id = $1 RETURNING id, nome',
      [id],
    );
    if (!emp) throw new NotFoundException('Empreendimento não encontrado.');
    return { deleted: true, ...emp };
  }

  async melhorM2(filtros: { estado?: string; cidade?: string; bairro?: string; tipo?: string }) {
    const conditions: string[] = ['e.publicado = TRUE', 'u.preco IS NOT NULL'];
    const params: any[] = [];
    let i = 1;

    if (filtros.estado) {
      conditions.push(`e.estado = $${i++}`);
      params.push(filtros.estado.toUpperCase());
    }
    if (filtros.cidade) {
      conditions.push(`e.cidade ILIKE $${i++}`);
      params.push(`%${filtros.cidade}%`);
    }
    if (filtros.bairro) {
      conditions.push(`e.bairro ILIKE $${i++}`);
      params.push(`%${filtros.bairro}%`);
    }
    if (filtros.tipo) {
      conditions.push(`u.tipo = $${i++}`);
      params.push(filtros.tipo);
    }

    const where = conditions.map(c => `AND ${c}`).join('\n        ');

    // area_util = metragem_privativa + area_externa * 0.5
    // preco_m2 = preco / area_util
    // Por empreendimento, pega a unidade com menor preco_m2
    const { rows } = await this.pool.query(
      `WITH ranked AS (
         SELECT
           e.id              AS empreendimento_id,
           e.nome            AS empreendimento_nome,
           e.slug,
           e.bairro,
           e.cidade,
           e.estado,
           e.tipo            AS emp_tipo,
           c.nome_fantasia    AS construtora_nome,
           u.id              AS unidade_id,
           u.tipo            AS unidade_tipo,
           u.nome            AS unidade_nome,
           u.quartos,
           u.vagas,
           u.preco,
           u.metragem_privativa,
           COALESCE(u.area_externa, 0)  AS area_externa,
           (COALESCE(u.metragem_privativa, 0) + COALESCE(u.area_externa, 0) * 0.5)
             AS area_util,
           CASE
             WHEN (COALESCE(u.metragem_privativa, 0) + COALESCE(u.area_externa, 0) * 0.5) > 0
             THEN u.preco / (COALESCE(u.metragem_privativa, 0) + COALESCE(u.area_externa, 0) * 0.5)
             ELSE NULL
           END AS preco_m2,
           (SELECT url FROM empreendimento_midias
            WHERE empreendimento_id = e.id
              AND tipo = 'foto'
            ORDER BY ordem LIMIT 1
           ) AS imagem,
           ROW_NUMBER() OVER (
             PARTITION BY e.id
             ORDER BY (
               CASE
                 WHEN (COALESCE(u.metragem_privativa, 0) + COALESCE(u.area_externa, 0) * 0.5) > 0
                 THEN u.preco / (COALESCE(u.metragem_privativa, 0) + COALESCE(u.area_externa, 0) * 0.5)
                 ELSE NULL
               END
             ) ASC NULLS LAST
           ) AS rn
         FROM empreendimentos e
         JOIN construtoras c ON c.id = e.construtora_id
         JOIN unidades u ON u.empreendimento_id = e.id
         WHERE TRUE
           ${where}
       )
       SELECT * FROM ranked
       WHERE rn = 1 AND preco_m2 IS NOT NULL
       ORDER BY preco_m2 ASC
       LIMIT 100`,
      params,
    );

    return rows;
  }
}
