-- Migration: adicionar campo previsao_entrega em empreendimentos
-- Execute este script no console do Neon antes de fazer o deploy

ALTER TABLE empreendimentos
  ADD COLUMN IF NOT EXISTS previsao_entrega DATE;

-- Verificar:
-- SELECT id, nome, previsao_entrega FROM empreendimentos LIMIT 5;
