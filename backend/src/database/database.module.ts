import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, types } from 'pg';

export const PG_POOL = 'PG_POOL';

// Por padrão o driver `pg` devolve colunas NUMERIC/DECIMAL como string (ex: "45.50"),
// para não perder precisão. Isso quebra qualquer código no front que chama .toFixed()
// ou faz conta assumindo number (ex: preco, metragem_privativa, area_util, preco_m2).
// Registrando o parser aqui, TODO o backend passa a devolver NUMERIC já como float.
const PG_NUMERIC_OID = 1700;
types.setTypeParser(PG_NUMERIC_OID, (value: string) => (value === null ? null : parseFloat(value)));

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          max: 20,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
