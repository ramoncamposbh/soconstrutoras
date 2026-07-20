-- ============================================================
-- CORRIGE o e-mail do Marcus (remove caractere cirílico)
-- e garante hash correto para senha 123456
-- Executar no Neon SQL Editor: https://console.neon.tech
-- ============================================================

BEGIN;

-- Remove o usuário com e-mail errado (cirílico) se existir
DELETE FROM users WHERE email = 'marcusmachado@construtorасudoeste.com.br';

-- Cria usuário com e-mail correto (ASCII puro)
INSERT INTO users (email, password_hash, nome, role, ativo)
VALUES (
  'marcusmachado@construtora-sudoeste.com.br',
  '$2b$10$cI4nGd5jP3vJAj0naEEdUuVjIz.NleJcmxId5AOV2UWjt8yHd4JMK',
  'Marcus Machado',
  'construtora',
  true
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      nome          = EXCLUDED.nome,
      ativo         = true;

-- Recria o registro da construtora
INSERT INTO construtoras (user_id, razao_social, nome_fantasia, cnpj, subscription_status)
SELECT
  u.id,
  'Construtora Sudoeste Ltda.',
  'Sudoeste',
  '65.295.255/0001-74',
  'trial'
FROM users u
WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br'
ON CONFLICT (cnpj) DO UPDATE
  SET user_id = EXCLUDED.user_id;

-- Transfere os empreendimentos para esta construtora
UPDATE empreendimentos
SET construtora_id = (
  SELECT c.id FROM construtoras c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br'
)
WHERE construtora_id IN (
  SELECT c.id FROM construtoras c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'comercial@sudoeste.com.br'
);

COMMIT;

-- Verificação final
SELECT u.email, u.nome, u.role, u.ativo, c.cnpj,
       COUNT(e.id) AS total_empreendimentos
FROM users u
JOIN construtoras c ON c.user_id = u.id
LEFT JOIN empreendimentos e ON e.construtora_id = c.id
WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br'
GROUP BY u.email, u.nome, u.role, u.ativo, c.cnpj;
