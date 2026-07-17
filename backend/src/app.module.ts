import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ConstutorasModule } from './construtoras/construtoras.module';
import { EmpreendimentosModule } from './empreendimentos/empreendimentos.module';
import { ParceirosModule } from './parceiros/parceiros.module';
import { LeadsModule } from './leads/leads.module';
import { MidiasModule } from './midias/midias.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { BillingModule } from './billing/billing.module';
import { UnidadesModule } from './unidades/unidades.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    StorageModule,
    AuthModule,
    ConstutorasModule,
    EmpreendimentosModule,
    ParceirosModule,
    LeadsModule,
    MidiasModule,
    NotificationsModule,
    HealthModule,
    BillingModule,
    UnidadesModule,
  ],
})
export class AppModule {}
