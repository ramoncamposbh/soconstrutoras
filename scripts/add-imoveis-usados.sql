-- ================================================================
-- IMÓVEIS USADOS (permuta) — migration
-- ================================================================

-- 1. Colunas na tabela construtoras
ALTER TABLE construtoras
  ADD COLUMN IF NOT EXISTS imoveis_usados_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS imoveis_usados_limite      INTEGER NOT NULL DEFAULT 5;

-- 2. Tabela principal
CREATE TABLE IF NOT EXISTS imoveis_usados (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id UUID NOT NULL REFERENCES construtoras(id) ON DELETE CASCADE,
  titulo         VARCHAR(200) NOT NULL,
  descricao      TEXT,
  tipo           VARCHAR(50)  NOT NULL DEFAULT 'apartamento',
  endereco       VARCHAR(200),
  bairro         VARCHAR(100),
  cidade         VARCHAR(100) NOT NULL DEFAULT 'Belo Horizonte',
  estado         VARCHAR(2)   NOT NULL DEFAULT 'MG',
  cep            VARCHAR(10),
  area           NUMERIC(10,2),
  quartos        INTEGER,
  vagas          INTEGER,
  preco          NUMERIC(15,2),
  status         VARCHAR(20)  NOT NULL DEFAULT 'disponivel',  -- disponivel | reservado | vendido
  publicado      BOOLEAN NOT NULL DEFAULT FALSE,
  publicado_em   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de mídias
CREATE TABLE IF NOT EXISTS imovel_usado_midias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_usado_id UUID NOT NULL REFERENCES imoveis_usados(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  tipo            VARCHAR(20)  NOT NULL DEFAULT 'foto',
  ordem           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_imoveis_usados_construtora ON imoveis_usados(construtora_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_usados_publicado   ON imoveis_usados(publicado) WHERE publicado = TRUE;
CREATE INDEX IF NOT EXISTS idx_imovel_usado_midias_imovel ON imovel_usado_midias(imovel_usado_id);

-- Verificação
SELECT 'imoveis_usados criado' AS status, count(*) FROM imoveis_usados;
