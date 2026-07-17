import {
  Injectable, Inject, UnauthorizedException,
  ConflictException, OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { PG_POOL } from '../database/database.module';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly jwt: JwtService,
  ) {}

  // ── Migração automática: adiciona colunas OAuth se não existirem ────────────
  async onModuleInit() {
    try {
      await this.pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS google_id  VARCHAR(255),
          ADD COLUMN IF NOT EXISTS apple_id   VARCHAR(255),
          ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      `);
      // Permite password_hash nulo (contas criadas via OAuth)
      await this.pool.query(
        `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`
      ).catch(() => {/* já nullable */});
      // Índices únicos
      await this.pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='users' AND indexname='users_google_id_idx')
          THEN CREATE UNIQUE INDEX users_google_id_idx ON users(google_id) WHERE google_id IS NOT NULL;
          END IF;
        END $$;
      `);
      await this.pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='users' AND indexname='users_apple_id_idx')
          THEN CREATE UNIQUE INDEX users_apple_id_idx ON users(apple_id) WHERE apple_id IS NOT NULL;
          END IF;
        END $$;
      `);
    } catch (err: any) {
      console.warn('[Auth] Migração OAuth ignorada:', err.message);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  private gerarToken(user: { id: string; email: string; nome: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
    };
  }

  private async verificarOuCriarOAuth(p: {
    googleId?: string;
    appleId?: string;
    email?: string;
    nome: string;
    avatarUrl?: string;
  }) {
    // 1. Buscar por OAuth ID
    if (p.googleId) {
      const { rows: [u] } = await this.pool.query(
        'SELECT id, email, nome, role FROM users WHERE google_id = $1', [p.googleId],
      );
      if (u) return u;
    }
    if (p.appleId) {
      const { rows: [u] } = await this.pool.query(
        'SELECT id, email, nome, role FROM users WHERE apple_id = $1', [p.appleId],
      );
      if (u) return u;
    }

    // 2. Buscar por e-mail (vincula conta OAuth existente)
    if (p.email) {
      const { rows: [ex] } = await this.pool.query(
        'SELECT id, email, nome, role FROM users WHERE email = $1', [p.email],
      );
      if (ex) {
        const sets: string[] = [];
        const vals: any[] = [ex.id];
        let i = 2;
        if (p.googleId)  { sets.push(`google_id  = $${i++}`); vals.push(p.googleId); }
        if (p.appleId)   { sets.push(`apple_id   = $${i++}`); vals.push(p.appleId); }
        if (p.avatarUrl) { sets.push(`avatar_url = COALESCE(avatar_url, $${i++})`); vals.push(p.avatarUrl); }
        if (sets.length) await this.pool.query(
          `UPDATE users SET ${sets.join(', ')} WHERE id = $1`, vals,
        );
        return ex;
      }
    }

    // 3. Criar novo usuário cliente
    const emailFinal = p.email ?? `oauth_${(p.googleId ?? p.appleId)!}@soconstrutoras.internal`;
    const cols = ['email', 'nome', 'role', 'ativo'];
    const vals: any[] = [emailFinal, p.nome, 'cliente', true];
    if (p.googleId)  { cols.push('google_id');  vals.push(p.googleId); }
    if (p.appleId)   { cols.push('apple_id');   vals.push(p.appleId); }
    if (p.avatarUrl) { cols.push('avatar_url'); vals.push(p.avatarUrl); }

    const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
    const { rows: [nu] } = await this.pool.query(
      `INSERT INTO users (${cols.join(', ')}) VALUES (${ph}) RETURNING id, email, nome, role`,
      vals,
    );
    return nu;
  }

  // ── Registro / Login com e-mail ─────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'SELECT id FROM users WHERE email = $1', [dto.email],
      );
      if (rows.length > 0) throw new ConflictException('E-mail já cadastrado.');

      const hash = await bcrypt.hash(dto.password, 12);
      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, password_hash, nome, role)
         VALUES ($1, $2, $3, $4) RETURNING id, email, nome, role`,
        [dto.email, hash, dto.nome, dto.role],
      );

      if (dto.role === 'construtora') {
        await client.query(
          `INSERT INTO construtoras (user_id, razao_social, cnpj) VALUES ($1, $2, $3)`,
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
    if (!user.password_hash)
      throw new UnauthorizedException('Esta conta usa login social. Use Google ou Apple para entrar.');

    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas.');
    return this.gerarToken(user);
  }

  async perfil(userId: string) {
    const { rows: [user] } = await this.pool.query(
      'SELECT id, email, nome, role, avatar_url, created_at FROM users WHERE id = $1',
      [userId],
    );
    return user;
  }

  // ── OAuth: Google ───────────────────────────────────────────────────────────
  async loginComGoogle(credential: string) {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    if (!res.ok) throw new UnauthorizedException('Token Google inválido.');
    const p: any = await res.json();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && p.aud !== clientId)
      throw new UnauthorizedException('Token Google não autorizado para esta aplicação.');

    const user = await this.verificarOuCriarOAuth({
      googleId:  p.sub,
      email:     p.email,
      nome:      p.name ?? p.email?.split('@')[0] ?? 'Usuário',
      avatarUrl: p.picture,
    });
    return this.gerarToken(user);
  }

  // ── OAuth: Apple ────────────────────────────────────────────────────────────
  async loginComApple(idToken: string, userInfo?: any) {
    const parts = idToken.split('.');
    if (parts.length < 2) throw new UnauthorizedException('Token Apple inválido.');

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());

    const keysRes = await fetch('https://appleid.apple.com/auth/keys');
    if (!keysRes.ok) throw new UnauthorizedException('Erro ao verificar com Apple.');
    const { keys } = await keysRes.json() as { keys: any[] };

    const appleKey = keys.find((k) => k.kid === header.kid);
    if (!appleKey) throw new UnauthorizedException('Chave Apple não encontrada.');

    const { createPublicKey } = await import('crypto');
    const publicKey = createPublicKey({ key: appleKey, format: 'jwk' });
    const pem       = publicKey.export({ type: 'spki', format: 'pem' }) as string;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwtLib: any = require('jsonwebtoken');
    let payload: any;
    try {
      payload = jwtLib.verify(idToken, pem, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
      });
    } catch {
      throw new UnauthorizedException('Token Apple inválido ou expirado.');
    }

    const nomeParts = userInfo?.name;
    const nome = nomeParts
      ? `${nomeParts.firstName ?? ''} ${nomeParts.lastName ?? ''}`.trim()
      : payload.email?.split('@')[0] ?? 'Usuário';

    const user = await this.verificarOuCriarOAuth({
      appleId: payload.sub,
      email:   payload.email,
      nome,
    });
    return this.gerarToken(user);
  }
}
