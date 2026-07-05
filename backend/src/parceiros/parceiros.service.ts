import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { AdicionarParceiroDto } from './dto/adicionar-parceiro.dto';
import { VincularParceiroDto } from './dto/vincular-parceiro.dto';

@Injectable()
export class ParceirosService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private async resolverConstrutoraId(userId: string): Promise<string> {
    const { rows: [c] } = await this.pool.query(
      'SELECT id FROM construtoras WHERE user_id = $1',
      [userId],
    );
    if (!c) throw new ForbiddenException('Construtora não encontrada para este usuário.');
    return c.id;
  }

  /** Lista todos os parceiros da construtora */
  async listar(userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    const { rows } = await this.pool.query(
      `SELECT p.*, 0 AS total_leads_recebidos
       FROM parceiros p
       WHERE p.construtora_id = $1
       ORDER BY p.created_at DESC`,
      [construtoraId],
    );
    return rows;
  }

  /** Adiciona um parceiro à construtora */
  async adicionar(userId: string, dto: AdicionarParceiroDto) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    // Valida regra: máximo 1 house de vendas
    if (dto.is_house_de_vendas) {
      const { rows } = await this.pool.query(
        'SELECT id FROM parceiros WHERE construtora_id = $1 AND is_house_de_vendas = TRUE AND ativo = TRUE',
        [construtoraId],
      );
      if (rows.length > 0) {
        throw new BadRequestException('Já existe uma house de vendas cadastrada para esta construtora.');
      }
    }

    const { rows: [parceiro] } = await this.pool.query(
      `INSERT INTO parceiros
         (construtora_id, tipo, nome, email, telefone, creci, is_house_de_vendas)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [construtoraId, dto.tipo, dto.nome, dto.email, dto.telefone, dto.creci, dto.is_house_de_vendas ?? false],
    );
    return parceiro;
  }

  /** Vincula um parceiro a um empreendimento com regras de distribuição */
  async vincular(userId: string, empreendimentoId: string, dto: VincularParceiroDto) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verifica se o parceiro pertence à construtora
      const { rows: [parceiro] } = await client.query(
        'SELECT id, is_house_de_vendas FROM parceiros WHERE id = $1 AND construtora_id = $2 AND ativo = TRUE',
        [dto.parceiro_id, construtoraId],
      );
      if (!parceiro) throw new NotFoundException('Parceiro não encontrado.');

      // Verifica o empreendimento
      const { rows: [emp] } = await client.query(
        'SELECT id FROM empreendimentos WHERE id = $1 AND construtora_id = $2',
        [empreendimentoId, construtoraId],
      );
      if (!emp) throw new NotFoundException('Empreendimento não encontrado.');

      // Verifica limite (a trigger do banco também valida, mas melhor falhar antes)
      const { rows: [contagem] } = await client.query(
        `SELECT COUNT(*) AS total
         FROM empreendimento_parceiros ep
         JOIN parceiros p ON p.id = ep.parceiro_id
         WHERE ep.empreendimento_id = $1
           AND ep.ativo = TRUE
           AND p.is_house_de_vendas = FALSE`,
        [empreendimentoId],
      );

      const { rows: [construtora] } = await client.query(
        'SELECT has_house_de_vendas FROM construtoras WHERE id = $1',
        [construtoraId],
      );

      const max = construtora.has_house_de_vendas ? 2 : 3;
      if (!parceiro.is_house_de_vendas && parseInt(contagem.total) >= max) {
        throw new BadRequestException(
          `Limite de ${max} parceiros externos atingido para este empreendimento.`,
        );
      }

      // Se modo percentual, valida que soma <= 100
      if (dto.modo_distribuicao === 'percentual') {
        const { rows: [soma] } = await client.query(
          `SELECT COALESCE(SUM(percentual), 0) AS total
           FROM empreendimento_parceiros
           WHERE empreendimento_id = $1 AND ativo = TRUE`,
          [empreendimentoId],
        );
        if (parseFloat(soma.total) + dto.percentual! > 100) {
          throw new BadRequestException('A soma dos percentuais dos parceiros não pode ultrapassar 100%.');
        }
      }

      const { rows: [vinculo] } = await client.query(
        `INSERT INTO empreendimento_parceiros
           (empreendimento_id, parceiro_id, modo_distribuicao, percentual, ordem)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (empreendimento_id, parceiro_id)
         DO UPDATE SET modo_distribuicao = EXCLUDED.modo_distribuicao,
                       percentual = EXCLUDED.percentual,
                       ordem = EXCLUDED.ordem,
                       ativo = TRUE
         RETURNING *`,
        [empreendimentoId, dto.parceiro_id, dto.modo_distribuicao, dto.percentual, dto.ordem ?? 0],
      );

      await client.query('COMMIT');
      return vinculo;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Lista parceiros vinculados a um empreendimento */
  async listarDoEmpreendimento(empreendimentoId: string) {
    const { rows } = await this.pool.query(
      `SELECT p.id, p.nome, p.email, p.tipo, p.is_house_de_vendas,
              ep.modo_distribuicao, ep.percentual, ep.ordem,
              0 AS leads_recebidos
       FROM empreendimento_parceiros ep
       JOIN parceiros p ON p.id = ep.parceiro_id
       WHERE ep.empreendimento_id = $1 AND ep.ativo = TRUE
       ORDER BY ep.ordem ASC`,
      [empreendimentoId],
    );
    return rows;
  }

  async removerVinculo(empreendimentoId: string, parceiroId: string, userId: string) {
    const construtoraId = await this.resolverConstrutoraId(userId);
    await this.pool.query(
      `UPDATE empreendimento_parceiros SET ativo = FALSE
       WHERE empreendimento_id = $1 AND parceiro_id = $2`,
      [empreendimentoId, parceiroId],
    );
    return { ok: true };
  }
}
