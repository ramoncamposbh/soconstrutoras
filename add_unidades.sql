-- ══════════════════════════════════════════════════════════════════
-- MIGRATION: Unidades por empreendimento
-- Executar no Neon SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1) Limite de unidades configurável por construtora (admin pode editar)
ALTER TABLE construtoras
  ADD COLUMN IF NOT EXISTS limite_unidades INTEGER NOT NULL DEFAULT 10;

-- 2) Tabela principal de unidades
CREATE TABLE IF NOT EXISTS unidades (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id   UUID        NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  tipo                VARCHAR(30) NOT NULL DEFAULT 'apartamento',
  -- tipos: apartamento | cobertura | garden | duplex | studio | loft | comercial
  nome                VARCHAR(200),          -- ex: "Tipo A", "Cobertura Norte"
  metragem_privativa  NUMERIC(10,2),
  metragem_total      NUMERIC(10,2),
  quartos             SMALLINT    DEFAULT 0,
  suites              SMALLINT    DEFAULT 0,
  vagas               SMALLINT    DEFAULT 0,
  preco               NUMERIC(15,2),
  descricao           TEXT,
  disponivel          BOOLEAN     NOT NULL DEFAULT TRUE,
  ordem               SMALLINT    DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Fotos / plantas / imagens das unidades
CREATE TABLE IF NOT EXISTS unidade_midias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id  UUID        NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  tipo        VARCHAR(20) NOT NULL DEFAULT 'foto',
  -- tipos: foto | planta | render
  legenda     VARCHAR(300),
  ordem       SMALLINT    DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_unidades_empreendimento  ON unidades(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_unidade_midias_unidade   ON unidade_midias(unidade_id);

-- 5) Verificação
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'unidades')      AS tabela_unidades,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'unidade_midias') AS tabela_midias,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'construtoras' AND column_name = 'limite_unidades')             AS coluna_limite;
