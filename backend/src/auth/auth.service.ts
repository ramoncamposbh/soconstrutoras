import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { PG_POOL } from '../database/database.module';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verifica duplicidade de e-mail
      const { rows } = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [dto.email],
      );
      if (rows.length > 0) throw new ConflictException('E-mail já cadastrado.');

      const hash = await bcrypt.hash(dto.password, 12);

      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, password_hash, nome, role)
         VALUES ($1, $2, $3, $4) RETURNING id, email, nome, role`,
        [dto.email, hash, dto.nome, dto.role],
      );

      // Se for construtora, cria o registro na tabela construtoras
      if (dto.role === 'construtora') {
        await client.query(
          `INSERT INTO construtoras (user_id, razao_social, cnpj)
           VALUES ($1, $2, $3)`,
          [user.id, dto.razao_social, dto.cnpj],
        );
      }

      await client.query('COMMIT');
      return this.gerarToken(user);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async login(dto: LoginDto) {
    const { rows: [user] } = await this.pool.query(
      'SELECT id, email, nome, role, password_hash FROM users WHERE email = $1 AND ativo = TRUE',
      [dto.email],
    );

    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const senhaValida = await bcrypt.compare(dto.password, user.password_hash);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas.');

    return this.gerarToken(user);
  }

  async perfil(userId: string) {
    const { rows: [user] } = await this.pool.query(
      'SELECT id, email, nome, role, created_at FROM users WHERE id = $1',
      [userId],
    );
    return user;
  }

  private gerarToken(user: { id: string; email: string; nome: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
    };
  }
}
