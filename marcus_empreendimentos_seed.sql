-- ============================================================
-- RE-SEED: 7 Empreendimentos para Marcus Machado (Sudoeste)
-- Email: marcusmachado@construtora-sudoeste.com.br
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_construtora_id UUID;
  v_emp_id UUID;
BEGIN
  SELECT c.id INTO v_construtora_id
  FROM construtoras c JOIN users u ON u.id = c.user_id
  WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br';

  IF v_construtora_id IS NULL THEN
    RAISE EXCEPTION 'Construtora do Marcus nao encontrada!';
  END IF;

  -- BIOS
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Bios', 'Alto padrão próximo à Praça da Liberdade e à Savassi. 1 torre com 42 unidades exclusivas em 16 pavimentos. Apartamentos de 2 e 3 quartos de 63,7 a 185,3 m² com 2 vagas. Lazer premium: piscinas adulto e infantil aquecidas, academia, salão de festas gourmet, deck e playground. Biometria nas áreas comuns, Wi-Fi no pilotis, tomadas USB nos quartos e ponto para recarga de veículo elétrico.', 'apartamento', 'lancamento', 'Praça da Boa Viagem', 'Funcionários', 'Belo Horizonte', 'MG', 2940105, 2940105, 63.7, 185.3, 2, 3, 2, 'bios-belo-horizonte', true, NOW(), -19.9356, -43.9346)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/bios/foto_01.jpg', 'foto', 1),
    (v_emp_id, '/empreendimentos/bios/foto_02.jpg', 'foto', 2),
    (v_emp_id, '/empreendimentos/bios/foto_03.jpg', 'foto', 3),
    (v_emp_id, '/empreendimentos/bios/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/bios/foto_05.jpg', 'foto', 5),
    (v_emp_id, '/empreendimentos/bios/foto_06.jpg', 'foto', 6);

  -- METALLO
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Metallo', 'Conceito Industrial Chic no melhor ponto do Gutierrez. Projeto arquitetônico Mosaico Arquitetura com fachada revestida e volumetria diferenciada. 3 e 4 quartos a partir de 135 m² com 2 a 4 vagas. Perto das principais avenidas de BH, com estrutura completa de comércios, serviços e lazer.', 'apartamento', 'lancamento', 'Gutierrez', 'Gutierrez', 'Belo Horizonte', 'MG', 2113927, 3100000, 135, 280, 3, 4, 2, 'metallo-gutierrez-belo-horizonte', true, NOW(), -19.9381, -43.9619)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/metallo/foto_01.jpg', 'foto', 1),
    (v_emp_id, '/empreendimentos/metallo/foto_02.jpg', 'foto', 2),
    (v_emp_id, '/empreendimentos/metallo/foto_03.jpg', 'foto', 3),
    (v_emp_id, '/empreendimentos/metallo/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/metallo/foto_05.jpg', 'foto', 5);

  -- PERLAGE
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Perlage Penna Residencial', 'A nova pérola do Santo Antônio. Localizado em um dos bairros mais cobiçados da região Centro-Sul de BH. Arquitetura de Marcos Satuf com fachada de volumetria diferencial, parcialmente revestida e aerada. 3 e 4 quartos de 96 a 253 m² com 2 a 3 vagas. Vista luminosa de Belo Horizonte e acesso facilitado a supermercados, escolas, farmácias, restaurantes e comércios.', 'apartamento', 'lancamento', 'Rua Penna', 'Santo Antônio', 'Belo Horizonte', 'MG', 2172236, 3133919, 96.83, 253.08, 3, 4, 2, 'perlage-penna-residencial-santo-antonio-belo-horizonte', true, NOW(), -19.9508, -43.9394)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/perlage/foto_01.png', 'foto', 1),
    (v_emp_id, '/empreendimentos/perlage/foto_02.png', 'foto', 2),
    (v_emp_id, '/empreendimentos/perlage/foto_03.png', 'foto', 3),
    (v_emp_id, '/empreendimentos/perlage/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/perlage/foto_05.jpg', 'foto', 5);

  -- ALDEA BIAS FORTES
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Aldea Bias Fortes', 'Empreendimento mixed use em ponto privilegiado do Lourdes. Studios e apartamentos de 1 e 2 quartos com conceito ALDEA: serviços pay-per-use (minimercado, lavanderia, academia, concierge, bike compartilhada), tecnologia integrada via app e lojas comerciais no térreo. Um dos primeiros empreendimentos 100% tokenizados do Brasil.', 'apartamento', 'lancamento', 'Av. Bias Fortes, 1.005', 'Lourdes', 'Belo Horizonte', 'MG', 584640, 1054000, 23, 60, 0, 2, 1, 'aldea-bias-fortes-lourdes-belo-horizonte', true, NOW(), -19.9275, -43.9384)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/bias_fortes/foto_01.jpg', 'foto', 1),
    (v_emp_id, '/empreendimentos/bias_fortes/foto_02.jpg', 'foto', 2),
    (v_emp_id, '/empreendimentos/bias_fortes/foto_03.jpg', 'foto', 3),
    (v_emp_id, '/empreendimentos/bias_fortes/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/bias_fortes/foto_05.jpg', 'foto', 5);

  -- ALDEA VALE DO SERENO
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Aldea Vale do Sereno', 'Nova versão de morar no Vale do Sereno, Nova Lima. Localização privilegiada: 4 min do Serena Mall, 7 min do Hospital Vila da Serra, 9 min do BH Shopping. Apartamentos de 1 e 2 quartos e duplex com conceito ALDEA: comunidade integrada, serviços pay-per-use e gestão digital via app exclusivo.', 'apartamento', 'lancamento', 'Rua do Cedro, 202', 'Vale do Sereno', 'Nova Lima', 'MG', 789045, 1800000, 35, 90, 1, 2, 1, 'aldea-vale-do-sereno-nova-lima', true, NOW(), -19.9872, -43.9417)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/vale_sereno/foto_01.jpg', 'foto', 1),
    (v_emp_id, '/empreendimentos/vale_sereno/foto_02.jpg', 'foto', 2),
    (v_emp_id, '/empreendimentos/vale_sereno/foto_03.jpg', 'foto', 3),
    (v_emp_id, '/empreendimentos/vale_sereno/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/vale_sereno/foto_05.jpg', 'foto', 5),
    (v_emp_id, '/empreendimentos/vale_sereno/foto_06.jpg', 'foto', 6);

  -- ALDEA CONTORNO
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Aldea Contorno', 'Morar na avenida mais icônica de BH. Arquitetura marcante e diferenciais exclusivos. Apartamentos de 1 e 2 quartos e coberturas com rooftop: espaço gourmet, praça do fogo, horta compartilhada, academia, lavanderia e pergolado. Comunidade ALDEA com serviços pay-per-use, eventos exclusivos e tecnologia integrada.', 'apartamento', 'lancamento', 'Av. do Contorno, 3.424', 'Funcionários', 'Belo Horizonte', 'MG', 815278, 1350000, 35, 120, 1, 2, 1, 'aldea-contorno-belo-horizonte', true, NOW(), -19.9343, -43.9365)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/contorno/foto_01.jpg', 'foto', 1),
    (v_emp_id, '/empreendimentos/contorno/foto_02.jpg', 'foto', 2),
    (v_emp_id, '/empreendimentos/contorno/foto_03.jpg', 'foto', 3),
    (v_emp_id, '/empreendimentos/contorno/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/contorno/foto_05.jpg', 'foto', 5),
    (v_emp_id, '/empreendimentos/contorno/foto_06.jpg', 'foto', 6);

  -- ALDEA PERNAMBUCO
  INSERT INTO empreendimentos (construtora_id, nome, descricao, tipo, status, endereco, bairro, cidade, estado, preco_min, preco_max, area_min, area_max, quartos_min, quartos_max, vagas, slug, publicado, publicado_em, latitude, longitude)
  VALUES (v_construtora_id, 'Aldea Pernambuco', 'Na Rua Pernambuco, próximo à Igreja Nossa Senhora da Boa Viagem no Funcionários. Studios e apartamentos de 1, 2 e 3 quartos com lazer premium e rooftop. Empreendimento 100% tokenizado com app exclusivo para gestão do imóvel. A 3 min da Praça da Liberdade e a 5 min do Palácio das Artes. Varanda fitness, academia e lavanderia.', 'apartamento', 'lancamento', 'Rua Pernambuco, 176', 'Funcionários', 'Belo Horizonte', 'MG', 669452, 2040000, 28, 120, 0, 3, 1, 'aldea-pernambuco-funcionarios-belo-horizonte', true, NOW(), -19.9370, -43.9355)
  RETURNING id INTO v_emp_id;
  INSERT INTO empreendimento_midias (empreendimento_id, url, tipo, ordem) VALUES
    (v_emp_id, '/empreendimentos/pernambuco/foto_01.jpg', 'foto', 1),
    (v_emp_id, '/empreendimentos/pernambuco/foto_02.jpg', 'foto', 2),
    (v_emp_id, '/empreendimentos/pernambuco/foto_03.jpg', 'foto', 3),
    (v_emp_id, '/empreendimentos/pernambuco/foto_04.jpg', 'foto', 4),
    (v_emp_id, '/empreendimentos/pernambuco/foto_05.jpg', 'foto', 5),
    (v_emp_id, '/empreendimentos/pernambuco/foto_06.jpg', 'foto', 6);

END $$;

COMMIT;

-- Verificacao: deve retornar 7 empreendimentos
SELECT e.nome, e.cidade, e.status, e.publicado, e.preco_min, e.preco_max
FROM empreendimentos e
JOIN construtoras c ON c.id = e.construtora_id
JOIN users u ON u.id = c.user_id
WHERE u.email = 'marcusmachado@construtora-sudoeste.com.br'
ORDER BY e.nome;
