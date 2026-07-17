import {
  Injectable, Inject, UnauthorizedException,
  ConflictException, OnModuleInit, InternalServerErrorException,
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
    // Cada coluna em query separada para garantir idempotência
    for (const sql of [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id  VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id   VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
      `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
      // Adiciona 'cliente' ao CHECK de role se ainda não incluído
      `DO $$ BEGIN
         IF EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass
         ) THEN
           ALTER TABLE users DROP CONSTRAINT users_role_check;
         END IF;
       END $$`,
      `ALTER TABLE users ADD CONSTRAINT users_role_check
         CHECK (role IN ('construtora', 'parceiro', 'admin', 'cliente'))`,
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='users' AND indexname='users_google_id_idx')
         THEN CREATE UNIQUE INDEX users_google_id_idx ON users(google_id) WHERE google_id IS NOT NULL;
         END IF;
       END $$`,
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='users' AND indexname='users_apple_id_idx')
         THEN CREATE UNIQUE INDEX users_apple_id_idx ON users(apple_id) WHERE apple_id IS NOT NULL;
         END IF;
       END $$`,
    ]) {
      await this.pool.query(sql).catch((err: any) =>
        console.warn('[Auth] Migração ignorada:', sql.trim().slice(0, 60), '—', err.message),
      );
    }
    console.log('[Auth] Migração OAuth concluída.');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  private gerarToken(user: { id: string; email: string; nome: string; role: string }) {
    const payload = { sub: user.id, email: user.e