import { Controller, Get, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get()
  async check() {
    try {
      await this.pool.query('SELECT 1');
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  }
}
