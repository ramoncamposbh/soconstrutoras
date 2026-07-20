-- Tabela de favoritos por usuário
CREATE TABLE IF NOT EXISTS user_favoritos (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  empreendimento_id  UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, empreendimento_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favoritos_user ON user_favoritos(user_id);
