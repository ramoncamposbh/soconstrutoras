-- =========================================================
-- Módulo: Lojas Parceiras (vitrines de desconto para clientes)
-- Tabelas: lojas_categorias, lojas, lojas_midias
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categorias de parceiros (ex: Decoração, Móveis, Eletrodomésticos)
CREATE TABLE IF NOT EXISTS lojas_categorias (
  id        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      VARCHAR(100) NOT NULL,
  icone     VARCHAR(50),           -- ex: "sofa", "lamp", "car"
  ordem     INT          NOT NULL DEFAULT 0,
  ativo     BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Lojas/marcas parceiras
CREATE TABLE IF NOT EXISTS lojas (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id       UUID         NOT NULL REFERENCES lojas_categorias(id) ON DELETE RESTRICT,
  nome               VARCHAR(200) NOT NULL,
  slug               VARCHAR(200) NOT NULL UNIQUE,
  descricao          TEXT,
  logo_url           TEXT,
  site_url           TEXT,
  whatsapp           VARCHAR(30),
  codigo_desconto    VARCHAR(100),
  descricao_desconto TEXT,
  ativo              BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fotos dos produtos da loja (máximo 20)
CREATE TABLE IF NOT EXISTS lojas_midias (
  id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id   UUID        NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  url       TEXT        NOT NULL,
  legenda   TEXT,
  ordem     INT         NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lojas_categoria   ON lojas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lojas_midias_loja ON lojas_midias(loja_id);
