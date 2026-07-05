/**
 * Aplica o schema.sql no banco Neon.
 * Rode: node aplicar-schema.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL =
  'postgresql://neondb_owner:npg_1apEYusjzt8d@ep-blue-haze-acnr2uw4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Conectando ao banco Neon...');
    await client.connect();
    console.log('✅ Conectado!\n');

    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    console.log('📦 Aplicando schema...');
    await client.query(sql);
    console.log('✅ Schema aplicado com sucesso!\n');

    // Verifica as tabelas criadas
    const { rows } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log('📋 Tabelas criadas:');
    rows.forEach(r => console.log('  •', r.tablename));

    console.log('\n🚀 Banco de dados pronto!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
