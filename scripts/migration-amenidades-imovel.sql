-- Migration: adiciona itens_imovel e proximidades ao empreendimento
-- Executar no painel Neon ou Railway SQL

ALTER TABLE empreendimentos
  ADD COLUMN IF NOT EXISTS itens_imovel   TEXT[],
  ADD COLUMN IF NOT EXISTS proximidades   TEXT[];
