-- ============================================================
-- RESET COMPLETO: Marcus Machado — Construtora Sudoeste
-- Executar no Neon SQL Editor: https://console.neon.tech
-- ============================================================
-- Login após executar:
--   E-mail : marcusmachado@construtora-sudoeste.com.br
--   Senha  : 123456
-- ============================================================

BEGIN;

-- 1. Remove qualquer versão anterior do usuário Marcus
DELETE FROM users WHERE email IN (
  'marcusmachado@construtora-sudoeste.com.br',
  'marcusmachado@construtorасudoeste.com.br'
);

-- 2. Remove construtora com o CNPJ do Sudoeste (se sobrou órfã)
DELETE FROM construtoras WHERE cnpj = '65.295.255/0001-74';

-- 3. Cria usuário limpo
INSERT INTO users (email, password_hash, nome, role, ativo)
VALUES (
  'marcusmachado@construtora-sudoeste.com.br',
  '$2b$12$ucaTHYULpx7RtKrT7y4CzOg6iAdt.zRSVem6ztkbWJfWV1W49ec46',
  'Marcus Machado',
  'construtora',
  true
);

-- 4. Cria construtora vinculada
INSERT INTO construtoras (user_id, razao_social, nome_fantasia, cnpj, subscription_status)
SELECT id, 'Construtora Sudoeste Ltda.', 'Sudoeste', '65.295.255/0001-74', 'trial'
FROM users WHERE email = 'marcusmachado@construtora-sudoeste.com.br';

-- 5. Vincula os empreendimentos Sudoeste à nova construtora
--    (os que vieram do seed anterior com comercial@sudoeste.com.br)
UPDATE empreendimentos
SET construtora_id = (
  SELECT c.id FROM construtoras c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br'
)
WHERE construtora_id = (
  SELECT c.id FROM construtoras c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'comercial@sudoeste.com.br'
);

COMMIT;

-- ============================================================
-- Verificação — deve retornar o usuário com total de imóveis
-- ============================================================
SELECT
  u.email,
  u.nome,
  u.role,
  u.ativo,
  c.cnpj,
  c.subscription_status,
  COUNT(e.id) AS total_empreendimentos
FROM users u
JOIN construtoras c ON c.user_id = u.id
LEFT JOIN empreendimentos e ON e.construtora_id = c.id
WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br'
GROUP BY u.email, u.nome, u.role, u.ativo, c.cnpj, c.subscription_status;
