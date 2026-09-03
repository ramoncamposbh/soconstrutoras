-- =====================================================
-- MIGRAÇÃO: Imóveis Usados
-- 1. Adiciona campo distribuicao_leads
-- 2. Habilita o módulo para todas as construtoras
-- =====================================================

-- 1. Adiciona coluna de distribuição de leads (se não existir)
ALTER TABLE imoveis_usados
  ADD COLUMN IF NOT EXISTS distribuicao_leads VARCHAR(20)
    NOT NULL DEFAULT 'construtora'
    CHECK (distribuicao_leads IN ('construtora', 'parceiros'));

-- 2. Habilita módulo para todas as construtoras com limite padrão de 20
UPDATE construtoras
SET
  imoveis_usados_habilitado = TRUE,
  imoveis_usados_limite = COALESCE(NULLIF(imoveis_usados_limite, 0), 20);

-- 3. Confirmar resultado
SELECT
  COUNT(*) AS total_construtoras,
  SUM(CASE WHEN imoveis_usados_habilitado THEN 1 ELSE 0 END) AS habilitadas,
  AVG(imoveis_usados_limite) AS limite_medio
FROM construtoras;
