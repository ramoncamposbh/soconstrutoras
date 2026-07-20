-- ============================================================
-- SóConstrutoras — Schema PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- AUTENTICAÇÃO & PERFIS
-- ------------------------------------------------------------

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('construtora', 'parceiro', 'admin')),
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PLANOS DE ASSINATURA
-- ------------------------------------------------------------

CREATE TABLE planos (
  id                    SERIAL PRIMARY KEY,
  nome                  TEXT NOT NULL,
  preco_mensal          NUMERIC(10,2) NOT NULL,
  max_empreendimentos   INT NOT NULL DEFAULT 5,
  max_parceiros         INT NOT NULL DEFAULT 3,  -- inclui house de vendas
  features              JSONB,
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE
);

-- Planos iniciais
INSERT INTO planos (nome, preco_mensal, max_empreendimentos, max_parceiros) VALUES
  ('Starter',       299.90,  2, 3),
  ('Profissional',  599.90,  5, 3),
  ('Enterprise',   1299.90, 20, 3);

-- ------------------------------------------------------------
-- CONSTRUTORAS
-- ------------------------------------------------------------

CREATE TABLE construtoras (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razao_social        TEXT NOT NULL,
  nome_fantasia       TEXT,
  cnpj                TEXT UNIQUE NOT NULL,
  logo_url            TEXT,
  has_house_de_vendas BOOLEAN NOT NULL DEFAULT FALSE,
  plano_id            INT REFERENCES planos(id),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
                        CHECK (subscription_status IN ('trial','ativa','suspensa','cancelada')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- ASSINATURAS (billing)
-- ------------------------------------------------------------

CREATE TABLE assinaturas (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  construtora_id          UUID NOT NULL REFERENCES construtoras(id) ON DELETE CASCADE,
  plano_id                INT NOT NULL REFERENCES planos(id),
  status                  TEXT NOT NULL DEFAULT 'ativa'
                            CHECK (status IN ('ativa','suspensa','cancelada')),
  vigencia_inicio         DATE NOT NULL,
  vigencia_fim            DATE,
  stripe_subscription_id  TEXT,
  stripe_customer_id      TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- EMPREENDIMENTOS
-- ------------------------------------------------------------

CREATE TABLE empreendimentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  construtora_id  UUID NOT NULL REFERENCES construtoras(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  tipo            TEXT NOT NULL CHECK (tipo IN ('apartamento','casa','terreno','comercial','studio')),
  status          TEXT NOT NULL DEFAULT 'lancamento'
                    CHECK (status IN ('lancamento','em_obras','pronto','suspenso')),
  -- Localização
  endereco        TEXT,
  bairro          TEXT,
  cidade          TEXT NOT NULL,
  estado          CHAR(2) NOT NULL,
  cep             TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  -- Características
  preco_min       NUMERIC(14,2),
  preco_max       NUMERIC(14,2),
  area_min        NUMERIC(8,2),
  area_max        NUMERIC(8,2),
  quartos_min     INT,
  quartos_max     INT,
  vagas           INT,
  -- SEO & slug
  slug            TEXT UNIQUE NOT NULL,
  publicado       BOOLEAN NOT NULL DEFAULT FALSE,
  publicado_em    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empreendimentos_construtora ON empreendimentos(construtora_id);
CREATE INDEX idx_empreendimentos_cidade_estado ON empreendimentos(cidade, estado);
CREATE INDEX idx_empreendimentos_status ON empreendimentos(status) WHERE publicado = TRUE;

-- ------------------------------------------------------------
-- MÍDIAS DOS EMPREENDIMENTOS
-- ------------------------------------------------------------

CREATE TABLE empreendimento_midias (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  url               TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('foto','video','planta','tour_virtual')),
  ordem             INT NOT NULL DEFAULT 0,
  legenda           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PARCEIROS (imobiliárias ou corretores autônomos)
-- ------------------------------------------------------------

CREATE TABLE parceiros (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  construtora_id  UUID NOT NULL REFERENCES construtoras(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('imobiliaria','corretor')),
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL,
  telefone        TEXT,
  creci           TEXT,
  is_house_de_vendas BOOLEAN NOT NULL DEFAULT FALSE,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Regra de negócio: só 1 house por construtora
  UNIQUE NULLS NOT DISTINCT (construtora_id, is_house_de_vendas)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_parceiros_construtora ON parceiros(construtora_id);

-- ------------------------------------------------------------
-- VÍNCULO EMPREENDIMENTO ↔ PARCEIRO (com regras de distribuição)
-- ------------------------------------------------------------

CREATE TABLE empreendimento_parceiros (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  parceiro_id       UUID NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
  -- Modo de distribuição de leads
  modo_distribuicao TEXT NOT NULL DEFAULT 'sequencial'
                      CHECK (modo_distribuicao IN ('sequencial','percentual')),
  percentual        NUMERIC(5,2) CHECK (percentual BETWEEN 0 AND 100),
  ordem             INT NOT NULL DEFAULT 0,    -- para modo sequencial
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empreendimento_id, parceiro_id),
  -- percentual obrigatório quando modo = percentual
  CONSTRAINT chk_percentual CHECK (
    modo_distribuicao != 'percentual' OR percentual IS NOT NULL
  )
);

CREATE INDEX idx_emp_parceiros_empreendimento ON empreendimento_parceiros(empreendimento_id);

-- ------------------------------------------------------------
-- LEADS
-- ------------------------------------------------------------

CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id),
  -- Dados do interessado
  nome              TEXT NOT NULL,
  email             TEXT,
  telefone          TEXT NOT NULL,
  mensagem          TEXT,
  -- Rastreamento
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  ip_origem         TEXT,
  -- Status do lead
  status            TEXT NOT NULL DEFAULT 'novo'
                      CHECK (status IN ('novo','atribuido','em_atendimento','convertido','perdido')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_empreendimento ON leads(empreendimento_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ------------------------------------------------------------
-- ATRIBUIÇÕES DE LEADS (auditoria)
-- ------------------------------------------------------------

CREATE TABLE lead_atribuicoes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  parceiro_id  UUID NOT NULL REFERENCES parceiros(id),
  atribuido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente','visualizado','em_atendimento','convertido','perdido')),
  observacoes  TEXT
);

CREATE INDEX idx_lead_atribuicoes_lead ON lead_atribuicoes(lead_id);
CREATE INDEX idx_lead_atribuicoes_parceiro ON lead_atribuicoes(parceiro_id);

-- ------------------------------------------------------------
-- ESTADO DA DISTRIBUIÇÃO (controle do round-robin / percentual)
-- Mantém o cursor por empreendimento para garantir atomicidade
-- ------------------------------------------------------------

CREATE TABLE lead_distribuicao_estado (
  empreendimento_id UUID PRIMARY KEY REFERENCES empreendimentos(id) ON DELETE CASCADE,
  ultimo_parceiro_idx INT NOT NULL DEFAULT 0,
  leads_por_parceiro  JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- JSONB: { "parceiro_uuid": count_de_leads_enviados }
  total_leads_recebidos BIGINT NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- FUNÇÕES AUXILIARES
-- ------------------------------------------------------------

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at         BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_construtoras_updated_at  BEFORE UPDATE ON construtoras  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_empreendimentos_updated_at BEFORE UPDATE ON empreendimentos FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_parceiros_updated_at     BEFORE UPDATE ON parceiros     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_leads_updated_at         BEFORE UPDATE ON leads         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Validação: max parceiros por empreendimento respeitando regra de negócio
CREATE OR REPLACE FUNCTION validar_limite_parceiros()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_construtora_id UUID;
  v_has_house      BOOLEAN;
  v_max_parceiros  INT;
  v_count_atual    INT;
BEGIN
  -- Busca construtora do empreendimento
  SELECT construtora_id INTO v_construtora_id
  FROM empreendimentos WHERE id = NEW.empreendimento_id;

  SELECT has_house_de_vendas INTO v_has_house
  FROM construtoras WHERE id = v_construtora_id;

  -- Regra: com house = max 2 parceiros externos; sem house = max 3
  v_max_parceiros := CASE WHEN v_has_house THEN 2 ELSE 3 END;

  SELECT COUNT(*) INTO v_count_atual
  FROM empreendimento_parceiros ep
  JOIN parceiros p ON p.id = ep.parceiro_id
  WHERE ep.empreendimento_id = NEW.empreendimento_id
    AND ep.ativo = TRUE
    AND p.is_house_de_vendas = FALSE
    AND ep.id != COALESCE(NEW.id, uuid_nil());

  IF v_count_atual >= v_max_parceiros THEN
    RAISE EXCEPTION 'Limite de % parceiros atingido para este empreendimento.', v_max_parceiros;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_limite_parceiros
  BEFORE INSERT OR UPDATE ON empreendimento_parceiros
  FOR EACH ROW EXECUTE FUNCTION validar_limite_parceiros();
