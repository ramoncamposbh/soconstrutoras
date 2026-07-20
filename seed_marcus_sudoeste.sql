-- ============================================================
-- SEED: Usuário Marcus Machado — Construtora Sudoeste
-- Executar no Neon SQL Editor: https://console.neon.tech
-- ============================================================
-- Credenciais de acesso:
--   E-mail : marcusmachado@construtorасudoeste.com.br
--   Senha  : 123456
-- ============================================================

BEGIN;

-- 1. Cria o usuário
INSERT INTO users (email, password_hash, nome, role, ativo)
VALUES (
  'marcusmachado@construtorасudoeste.com.br',
  '$2b$12$4sBkKB3nYnr/IUyGSZd4teEEUnmuicuMmhGEJSnsLrN3L2GdkjxK2',
  'Marcus Machado',
  'construtora',
  true
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      nome          = EXCLUDED.nome,
      ativo         = true;

-- 2. Cria o registro da construtora
INSERT INTO construtoras (user_id, razao_social, nome_fantasia, cnpj, subscription_status)
SELECT
  u.id,
  'Construtora Sudoeste Ltda.',
  'Sudoeste',
  '65.295.255/0001-74',
  'trial'
FROM users u
WHERE u.email = 'marcusmachado@construtorасudoeste.com.br'
ON CONFLICT (cnpj) DO NOTHING;

-- 3. Transfere os empreendimentos do seed anterior (comercial@sudoeste.com.br)
--    para a nova construtora do Marcus
UPDATE empreendimentos
SET construtora_id = (
  SELECT c.id FROM construtoras c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'marcusmachado@construtorасudoeste.com.br'
)
WHERE construtora_id = (
  SELECT c.id FROM construtoras c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'comercial@sudoeste.com.br'
);

COMMIT;

-- ============================================================
-- Verificação: deve listar os 7 empreendimentos do Marcus
-- ============================================================
SELECT
  e.nome,
  e.cidade,
  e.status,
  e.publicado,
  e.preco_min,
  e.preco_max
FROM empreendimentos e
JOIN construtoras c ON c.id = e.construtora_id
JOIN users u ON u.id = c.user_id
WHERE u.email = 'marcusmachado@construtorасudoeste.com.br'
ORDER BY e.nome;
