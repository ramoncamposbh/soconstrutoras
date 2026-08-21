/**
 * cadastrar-altti.js
 * Cadastro completo ALTTI — 4 empreendimentos
 * Conta → Empreendimentos → Unidades → Fotos → Publicar
 *
 *   node cadastrar-altti.js
 */

const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'altti@soconstrutoras.com.br';
const SENHA = 'ALTTI@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Altti';

// ── Helpers ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(p, opts = {}) {
  const res  = await fetch(`${API}${p}`, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function uploadFoto(endpoint, filePath, tipo, TOKEN) {
  if (!fs.existsSync(filePath)) { console.warn(`    ⚠ não encontrado: ${path.basename(filePath)}`); return null; }
  const buf  = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buf], { type: 'image/jpeg' }), path.basename(filePath));
  form.append('tipo', tipo);
  const res  = await fetch(`${API}${endpoint}`, {
    method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form,
  });
  if (res.status !== 201) { const t = await res.text(); console.warn(`    ✗ HTTP ${res.status}: ${t.slice(0,100)}`); return null; }
  return res.json();
}

async function uploadLista(endpoint, arquivos, tipo, TOKEN) {
  let ok = 0;
  for (const f of arquivos) {
    const r = await uploadFoto(endpoint, f, tipo, TOKEN);
    if (r) ok++;
    await sleep(400);
  }
  return ok;
}

// Filtra só arquivos que existem no disco
function ex(lista) { return lista.filter(f => fs.existsSync(f)); }

// ── EMPREENDIMENTOS ───────────────────────────────────────────────────────
const EMPREENDIMENTOS = [

  // ── 1. ALUMÍNIO 50 ──────────────────────────────────────────────────────
  {
    nome: 'Alumínio 50',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'Sofisticado e exclusivo, o Alumínio 50 é um edifício residencial de alto padrão no coração do bairro Serra, em Belo Horizonte.',
        '',
        'Com apenas 2 apartamentos por andar, oferece privacidade e vistas privilegiadas da cidade. Unidades amplas com 4 quartos (2 suítes e 2 semi-suítes), 3 vagas de garagem e acabamento superior.',
        '',
        'Diferenciais:',
        '• Piscina de raia coberta e piscina descoberta com deck',
        '• Home cinema',
        '• Fitness completo',
        '• Espaço gourmet com churrasqueira',
        '• Salão de festas e salão de jogos',
        '• Quadra poliesportiva',
        '• Espaço kids e playground',
        '• Copa e espaço para massagem',
        '• Praça do fogo',
        '• Hall social sofisticado',
        '• Co-working',
        '',
        'Obra entregue em novembro de 2023.',
      ].join('\n'),
      endereco: 'Rua Alumínio, 50', bairro: 'Serra', cidade: 'Belo Horizonte', estado: 'MG', cep: '30220-310',
      area_min: 164.36, area_max: 166.26,
      preco_min: 2901560, preco_max: 3166716,
      quartos_min: 4, quartos_max: 4, vagas: 3,
      latitude: -19.9353, longitude: -43.9320,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Fachada.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Hall_social.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Piscina_de_raia_coberta.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Piscina_descoberta_com_deck.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Piscina_descoberta_com_deck(2).jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Home_cinema.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Fitness.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Fitness(2).jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Espaco_gourmet_com_churrasqueira.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Salao_de_festas.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Salao_de_jogos.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Quadra_poliesportiva.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Espaco_kids.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Playground.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Coworking.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Copa.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Espaco_massagem.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'CONDOMINIO', 'Praca_do_fogo.jpeg'),
    ]),
    unidades: [
      { nome:'Apt 401',  tipo:'apartamento', m2:164.36, quartos:4, suites:2, vagas:3, preco:3045550 },
      { nome:'Apt 501',  tipo:'apartamento', m2:164.36, quartos:4, suites:2, vagas:3, preco:2914296 },
      { nome:'Apt 602',  tipo:'apartamento', m2:166.26, quartos:4, suites:2, vagas:3, preco:2901560 },
      { nome:'Apt 702',  tipo:'apartamento', m2:166.26, quartos:4, suites:2, vagas:3, preco:2924772 },
      { nome:'Apt 801',  tipo:'apartamento', m2:164.36, quartos:4, suites:2, vagas:3, preco:2983138 },
      { nome:'Apt 802',  tipo:'apartamento', m2:166.26, quartos:4, suites:2, vagas:3, preco:2947986 },
      { nome:'Apt 901',  tipo:'apartamento', m2:164.36, quartos:4, suites:2, vagas:3, preco:3006086 },
      { nome:'Apt 1502', tipo:'apartamento', m2:166.26, quartos:4, suites:2, vagas:3, preco:3110472 },
      { nome:'Apt 1601', tipo:'apartamento', m2:164.36, quartos:4, suites:2, vagas:3, preco:3166716 },
    ],
    fotosUnidade: () => ex([
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Sala_de_estar.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Sala_de_estar(2).jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Sala_de_jantar.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Sala_intima.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Suite_com_varanda.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Suite_com_varanda(2).jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Banheiro_principal.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Cozinha.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Closet.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Lavabo.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Quarto.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PERSPECTIVAS', 'APARTAMENTO', 'Quarto(2).jpeg'),
    ]),
    plantasUnidade: () => ex([
      path.join(BASE, '2026-08-13-Alumínio 50', 'PLANTAS', 'Apartamento_tipo_-_final_01.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PLANTAS', 'Apartamento_tipo_-_final_02.jpeg'),
      path.join(BASE, '2026-08-13-Alumínio 50', 'PLANTAS', 'Pilotis.jpeg'),
    ]),
  },

  // ── 2. AMALFI ────────────────────────────────────────────────────────────
  {
    nome: 'Amalfi',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'O Amalfi é um empreendimento residencial sofisticado no Sion, um dos bairros mais tradicionais e nobres de Belo Horizonte.',
        '',
        'Projeto arquitetônico diferenciado com apartamentos amplos de 3 suítes, áreas privativas exclusivas nos primeiros andares e cobertura com terraço.',
        '',
        'Diferenciais:',
        '• Academia completa',
        '• Campo de futebol com gramado natural',
        '• Espaço gourmet e de convivência',
        '• Espaço kids e playground',
        '• Piscina',
        '• Salão de festas',
        '• Co-working',
        '• Hall de entrada sofisticado',
        '',
        'Entrega prevista: setembro de 2026.',
      ].join('\n'),
      endereco: 'Rua São João do Paraíso', bairro: 'Sion', cidade: 'Belo Horizonte', estado: 'MG', cep: '30315-400',
      area_min: 110.76, area_max: 286.09,
      preco_min: 2095832, preco_max: 4535204,
      quartos_min: 3, quartos_max: 3, vagas: 2,
      latitude: -19.9510, longitude: -43.9367,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'altticombr-amalfi-altti-amalfi-fachada-595x850.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Hall_de_entrada.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Perspectiva_do_lazer.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Piscina.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Espaco_gourmet.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Espaco_gourmet_e_de_convivencia.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Academia.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Campo_de_futebol_com_gramado_natural.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Espaco_kids.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Playground.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Salao_de_festas.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Coworking.jpeg'),
      path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', 'CONDOMINIO', 'Entrada.jpeg'),
    ]),
    unidades: [
      { nome:'Apt 201 (Área Priv.)', tipo:'garden',     m2:236.57, quartos:3, suites:2, vagas:2, preco:2995791 },
      { nome:'Apt 202 (Área Priv.)', tipo:'garden',     m2:286.09, quartos:3, suites:2, vagas:2, preco:3201946 },
      { nome:'Apt 302',              tipo:'apartamento', m2:110.76, quartos:3, suites:2, vagas:2, preco:2095832 },
      { nome:'Apt 702',              tipo:'apartamento', m2:110.76, quartos:3, suites:2, vagas:2, preco:2337015 },
      { nome:'Cob 1302',             tipo:'cobertura',   m2:219.82, quartos:3, suites:2, vagas:3, preco:4535204 },
    ],
    fotosUnidade: (tipo) => {
      const pasta = tipo === 'garden' ? 'AREA PRIVATIVA' : tipo === 'cobertura' ? 'COBERTURA' : 'APARTAMENTO';
      return ex([
        path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', pasta, 'Sala_de_estar_e_varanda.jpeg'),
        path.join(BASE, '2026-08-13-Amalfi', 'PERSPECTIVAS', pasta, 'Suite_principal.jpeg'),
      ]);
    },
    plantasUnidade: (tipo) => {
      if (tipo === 'garden') return ex([
        path.join(BASE, '2026-08-13-Amalfi', 'PLANTAS', 'Apartamento_com_area_privativa_-_final_01.jpeg'),
        path.join(BASE, '2026-08-13-Amalfi', 'PLANTAS', 'Apartamento_com_area_privativa_-_final_02.jpeg'),
      ]);
      return ex([
        path.join(BASE, '2026-08-13-Amalfi', 'PLANTAS', 'Apartamento_tipo_-_final_01.jpeg'),
        path.join(BASE, '2026-08-13-Amalfi', 'PLANTAS', 'Apartamento_tipo_-_final_02.jpeg'),
        path.join(BASE, '2026-08-13-Amalfi', 'PLANTAS', 'Pilotis.jpeg'),
      ]);
    },
  },

  // ── 3. CADAQUÉS ──────────────────────────────────────────────────────────
  {
    nome: 'Cadaqués',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'O Cadaqués é um elegante edifício residencial no bairro São Pedro, em Belo Horizonte, com apartamentos de 1 e 2 quartos e uma exclusiva cobertura triplex.',
        '',
        'Inspirado na arquitetura mediterrânea, oferece unidades com planta inteligente, áreas privativas nos primeiros andares e cobertura com espaço exclusivo.',
        '',
        'Diferenciais:',
        '• Piscina com espaço gourmet',
        '• Academia',
        '• Salão de festas',
        '• Co-working',
        '• Espaço kids',
        '• Hall de entrada exclusivo',
        '',
        'Entrega prevista: agosto de 2026.',
      ].join('\n'),
      endereco: 'Rua Raimundo Correia', bairro: 'São Pedro', cidade: 'Belo Horizonte', estado: 'MG', cep: '30330-070',
      area_min: 53.19, area_max: 203.23,
      preco_min: 1032352, preco_max: 4381296,
      quartos_min: 1, quartos_max: 3, vagas: 1,
      latitude: -19.9565, longitude: -43.9320,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', '23014_ALT_SaoPedro_01_Fachada_R05_alta.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Hall_de_entrada.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Perspectiva_do_lazer.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Piscina_com_espaco_gourmet.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Academia.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Salao_de_festas.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Coworking.jpeg'),
      path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', 'CONDOMINIO', 'Entrada.jpeg'),
    ]),
    unidades: [
      { nome:'Apt 201 (Área Priv.)', tipo:'garden',     m2:55.92, m2ext:22.32, quartos:1, suites:1, vagas:1, preco:1242396 },
      { nome:'Apt 202 (Área Priv.)', tipo:'garden',     m2:53.20, m2ext:10.83, quartos:1, suites:1, vagas:1, preco:1120298 },
      { nome:'Apt 204 (Área Priv.)', tipo:'garden',     m2:80.25, m2ext:67.62, quartos:2, suites:1, vagas:2, preco:2032480 },
      { nome:'Apt 301', tipo:'apartamento', m2:55.92, quartos:1, suites:1, vagas:1, preco:1043396 },
      { nome:'Apt 303', tipo:'apartamento', m2:53.68, quartos:1, suites:1, vagas:1, preco:1032352 },
      { nome:'Apt 401', tipo:'apartamento', m2:55.92, quartos:1, suites:1, vagas:1, preco:1136994 },
      { nome:'Apt 403', tipo:'apartamento', m2:53.68, quartos:1, suites:1, vagas:1, preco:1098076 },
      { nome:'Apt 404', tipo:'apartamento', m2:80.25, quartos:2, suites:1, vagas:2, preco:1642948 },
      { nome:'Apt 501', tipo:'apartamento', m2:55.91, quartos:1, suites:1, vagas:1, preco:1128642 },
      { nome:'Apt 503', tipo:'apartamento', m2:53.68, quartos:1, suites:1, vagas:1, preco:1103292 },
      { nome:'Apt 504', tipo:'apartamento', m2:80.25, quartos:2, suites:1, vagas:2, preco:1650746 },
      { nome:'Apt 601', tipo:'apartamento', m2:56.00, quartos:1, suites:1, vagas:1, preco:1152220 },
      { nome:'Apt 802', tipo:'apartamento', m2:53.19, quartos:1, suites:1, vagas:1, preco:1112628 },
      { nome:'Apt 803', tipo:'apartamento', m2:53.68, quartos:1, suites:1, vagas:1, preco:1142412 },
      { nome:'Apt 804', tipo:'apartamento', m2:80.25, quartos:2, suites:1, vagas:2, preco:1728726 },
      { nome:'Apt 1101', tipo:'apartamento', m2:55.92, quartos:1, suites:1, vagas:1, preco:1280670 },
      { nome:'Apt 1102', tipo:'apartamento', m2:53.20, quartos:1, suites:1, vagas:1, preco:1172286 },
      { nome:'Cob 1201', tipo:'cobertura',  m2:203.23, quartos:3, suites:2, vagas:3, preco:4381296 },
    ],
    fotosUnidade: (tipo) => {
      const pasta = tipo === 'garden' ? 'AREA PRIVATIVA' : tipo === 'cobertura' ? 'COBERTURA' : 'APARTAMENTO';
      const base = path.join(BASE, '2026-08-13-Cadaqués', 'PERSPECTIVAS', pasta);
      const extras = tipo === 'cobertura' ? [
        path.join(base, 'Decoracao_Cobertura_01.jpeg'),
        path.join(base, 'Decoracao_Cobertura_02.jpeg'),
      ] : [];
      return ex([
        path.join(base, 'Sala_de_estar.jpeg'),
        path.join(base, 'Sala_de_estar_e_varanda.jpeg'),
        path.join(base, 'Suite_principal.jpeg'),
        path.join(base, 'Quarto_casal_201.jpeg'),
        path.join(base, 'Cozinha_apto_203.jpeg'),
        path.join(base, 'Escritorio_Casal_201.jpeg'),
        path.join(base, 'CADAQUES_dECORACOES_(3).jpeg'),
        ...extras,
      ]);
    },
    plantasUnidade: (tipo) => {
      if (tipo === 'garden') return ex([
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Apartamento_com_area_privativa_-_01_e_02.jpeg'),
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Apartamento_com_area_privativa_-_03_e_04.jpeg'),
      ]);
      if (tipo === 'cobertura') return ex([
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Cobertura_-_final_01.jpeg'),
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Cobertura_-_final_02.jpeg'),
      ]);
      return ex([
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Apartamento_tipo_-_final_01.jpeg'),
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Apartamento_tipo_-_final_02.jpeg'),
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Apartamento_tipo_-_final_03.jpeg'),
        path.join(BASE, '2026-08-13-Cadaqués', 'PLANTAS', 'Apartamento_tipo_-_final_04.jpeg'),
      ]);
    },
  },

  // ── 4. INNOVATTI CENTER ──────────────────────────────────────────────────
  {
    nome: 'Innovatti Center',
    dados: {
      tipo: 'comercial', status: 'lancamento',
      descricao: [
        'O Innovatti Center é um empreendimento comercial de alto padrão em Uberlândia/MG, na Avenida Maria Silva Garcia, no bairro Granja Marileusa.',
        '',
        'Projeto moderno com salas de diversas metragens, ideal para escritórios, consultórios e empresas de tecnologia. Infraestrutura completa para o seu negócio.',
        '',
        'Diferenciais:',
        '• Auditório e salas de reunião',
        '• Cozinha/copa compartilhada',
        '• Elevadores modernos de alta velocidade',
        '• Portaria com controle de acesso 24h',
        '• Estacionamento',
        '• Hall de entrada imponente',
        '',
        'Empreendimento entregue em junho de 2025.',
      ].join('\n'),
      endereco: 'Avenida Maria Silva Garcia', bairro: 'Granja Marileusa', cidade: 'Uberlândia', estado: 'MG', cep: '38400-782',
      area_min: 23.78, area_max: 432.15,
      preco_min: 303930, preco_max: 4471406,
      vagas: 1,
      latitude: -18.8748, longitude: -48.2940,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Captura_de_tela_2025-06-12_170530.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Entrada.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Hall_de_entrada.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Hall_de_entrada(2).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Hall_de_entrada(3).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Portaria.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Portaria(2).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Portaria(3).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Auditorio.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Auditorios.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Auditorios(2).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Elevadores.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Elevadores(2).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'CONDOMINIO', 'Cozinha.jpeg'),
    ]),
    unidades: [
      { nome:'Sala 201',  tipo:'comercial', m2:77.18,  vagas:1, preco:1027756 },
      { nome:'Sala 401',  tipo:'comercial', m2:88.76,  vagas:1, preco:1158148 },
      { nome:'Sala 402',  tipo:'comercial', m2:40.78,  vagas:1, preco:539490  },
      { nome:'Sala 403',  tipo:'comercial', m2:40.78,  vagas:1, preco:539490  },
      { nome:'Sala 404',  tipo:'comercial', m2:58.95,  vagas:1, preco:735854  },
      { nome:'Sala 504',  tipo:'comercial', m2:41.56,  vagas:1, preco:379636  },
      { nome:'Sala 505',  tipo:'comercial', m2:82.55,  vagas:1, preco:813532  },
      { nome:'Sala 511',  tipo:'comercial', m2:38.31,  vagas:1, preco:429152  },
      { nome:'Sala 517',  tipo:'comercial', m2:42.44,  vagas:1, preco:390770  },
      { nome:'Sala 518',  tipo:'comercial', m2:82.10,  vagas:1, preco:743292  },
      { nome:'Sala 601',  tipo:'comercial', m2:45.97,  vagas:1, preco:584654  },
      { nome:'Sala 602',  tipo:'comercial', m2:24.66,  vagas:1, preco:313586  },
      { nome:'Sala 618',  tipo:'comercial', m2:46.16,  vagas:1, preco:587134  },
      { nome:'Sala 701',  tipo:'comercial', m2:45.97,  vagas:1, preco:587622  },
      { nome:'Sala 702',  tipo:'comercial', m2:24.66,  vagas:1, preco:315178  },
      { nome:'Sala 703',  tipo:'comercial', m2:24.66,  vagas:1, preco:315178  },
      { nome:'Sala 704',  tipo:'comercial', m2:23.78,  vagas:1, preco:303930  },
      { nome:'Sala 705',  tipo:'comercial', m2:63.43,  vagas:1, preco:731922  },
      { nome:'Sala 706',  tipo:'comercial', m2:38.31,  vagas:1, preco:469814  },
      { nome:'Sala 707',  tipo:'comercial', m2:34.86,  vagas:1, preco:468268  },
      { nome:'Sala 708',  tipo:'comercial', m2:40.80,  vagas:1, preco:548006  },
      { nome:'Sala 709',  tipo:'comercial', m2:40.80,  vagas:1, preco:548006  },
      { nome:'Sala 710',  tipo:'comercial', m2:34.86,  vagas:1, preco:468268  },
      { nome:'Sala 711',  tipo:'comercial', m2:32.27,  vagas:1, preco:433532  },
      { nome:'Sala 712',  tipo:'comercial', m2:26.41,  vagas:1, preco:318920  },
      { nome:'Sala 713',  tipo:'comercial', m2:27.93,  vagas:1, preco:375166  },
      { nome:'Sala 714',  tipo:'comercial', m2:29.73,  vagas:1, preco:380014  },
      { nome:'Sala 715',  tipo:'comercial', m2:23.78,  vagas:1, preco:303930  },
      { nome:'Sala 716',  tipo:'comercial', m2:24.66,  vagas:1, preco:315178  },
      { nome:'Sala 717',  tipo:'comercial', m2:24.66,  vagas:1, preco:315178  },
      { nome:'Sala 718',  tipo:'comercial', m2:46.16,  vagas:1, preco:590116  },
      { nome:'Sala 1201', tipo:'comercial', m2:45.97,  vagas:1, preco:612248  },
      { nome:'Sala 1204', tipo:'comercial', m2:23.78,  vagas:1, preco:321390  },
      { nome:'Sala 1205', tipo:'comercial', m2:63.43,  vagas:1, preco:760688  },
      { nome:'Sala 1213', tipo:'comercial', m2:27.93,  vagas:1, preco:384640  },
      { nome:'Sala 1214', tipo:'comercial', m2:29.73,  vagas:1, preco:389610  },
      { nome:'Sala 1218', tipo:'comercial', m2:46.16,  vagas:1, preco:614802  },
      { nome:'Sala 1308', tipo:'comercial', m2:40.80,  vagas:1, preco:574894  },
      { nome:'Sala 1314', tipo:'comercial', m2:29.73,  vagas:1, preco:401314  },
      { nome:'Sala 1317', tipo:'comercial', m2:24.66,  vagas:1, preco:334514  },
      { nome:'Sala 1318', tipo:'comercial', m2:46.16,  vagas:1, preco:617784  },
      { nome:'Sala 1501', tipo:'comercial', m2:432.15, vagas:3, preco:4471406 },
      { nome:'Sala 1502', tipo:'comercial', m2:118.28, vagas:2, preco:1640756 },
      { nome:'Sala 1503', tipo:'comercial', m2:170.95, vagas:2, preco:2388316 },
      { nome:'Sala 1504', tipo:'comercial', m2:399.28, vagas:3, preco:3799220 },
    ],
    fotosUnidade: () => ex([
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'SALAS', 'Sala_de_Reuniao.jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'SALAS', 'Sala_de_Reuniao(2).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'SALAS', 'Sala_de_Reuniao(3).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'SALAS', 'Sala_de_Reuniao(4).jpeg'),
      path.join(BASE, '2026-08-13-Innovatti Center', 'PERSPECTIVAS', 'SALAS', 'Sala_de_Reuniao(5).jpeg'),
    ]),
    plantasUnidade: () => [],
  },
];

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  ALTTI — 4 empreendimentos');
  console.log('═══════════════════════════════════════════\n');

  // 1. Login ou registro
  console.log('🔑 Autenticando...');
  let TOKEN;
  const login = await api('/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email: EMAIL, password: SENHA}),
  });
  if (login.data?.access_token) {
    TOKEN = login.data.access_token;
    console.log('  ✅ Login OK');
  } else {
    const reg = await api('/auth/register', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email: EMAIL, password: SENHA, nome: 'ALTTI', razao_social: 'Altti Empreendimentos', role: 'construtora'}),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token;
    console.log('  ✅ Conta criada');
  }

  // 2. Buscar empreendimentos existentes
  const empListRes = await api('/empreendimentos/meus/listar', { headers: {Authorization:`Bearer ${TOKEN}`} });
  const empLista   = Array.isArray(empListRes.data) ? empListRes.data : [];

  // 3. Processar cada empreendimento
  for (const EMP of EMPREENDIMENTOS) {
    console.log(`\n${'─'.repeat(52)}`);
    console.log(`🏢 ${EMP.nome}`);
    console.log('─'.repeat(52));

    // Criar ou encontrar empreendimento
    let emp = empLista.find(e => e.nome === EMP.nome);
    if (emp) {
      console.log(`  ✅ Já existe — ID: ${emp.id}`);
    } else {
      const res = await api('/empreendimentos', {
        method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
        body: JSON.stringify({ nome: EMP.nome, ...EMP.dados }),
      });
      if (!res.data?.id) { console.log(`  ✗ Falha: ${JSON.stringify(res.data)}`); continue; }
      emp = res.data;
      empLista.push(emp);
      console.log(`  ✅ Criado — ID: ${emp.id} | slug: ${emp.slug}`);
    }

    const EMP_ID = emp.id;

    // Unidades
    console.log(`\n  🏠 Unidades (${EMP.unidades.length})...`);
    const unitRes = await api(`/unidades/empreendimentos/${EMP_ID}`, { headers: {Authorization:`Bearer ${TOKEN}`} });
    const unidadesExist = Array.isArray(unitRes.data) ? unitRes.data : [];
    const unitMap = {};
    for (const u of unidadesExist) unitMap[u.nome] = u;

    for (const u of EMP.unidades) {
      if (unitMap[u.nome]) { console.log(`    ✓ ${u.nome} (já existe)`); continue; }
      const body = {
        nome: u.nome, tipo: u.tipo,
        metragem_privativa: u.m2,
        metragem_total: u.m2ext ? (u.m2 + u.m2ext) : undefined,
        quartos: u.quartos ?? 0, suites: u.suites ?? 0,
        vagas: u.vagas ?? 0, preco: u.preco, disponivel: true,
      };
      const res = await api(`/unidades/empreendimentos/${EMP_ID}`, {
        method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
        body: JSON.stringify(body),
      });
      if (res.data?.id) { unitMap[u.nome] = res.data; console.log(`    ✅ ${u.nome}`); }
      else console.log(`    ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
    }

    // Fotos do condomínio
    console.log(`\n  📸 Fotos do condomínio (${EMP.fotosCondominio.length} disponíveis)...`);
    const empDet = await api(`/empreendimentos/${emp.slug ?? EMP_ID}`, { headers: {Authorization:`Bearer ${TOKEN}`} });
    const fotosExist = (empDet.data?.midias ?? []).filter(m => m.tipo === 'foto');
    if (fotosExist.length > 0) {
      console.log(`    ✅ Já possui ${fotosExist.length} foto(s), pulando`);
    } else {
      const ok = await uploadLista(`/empreendimentos/${EMP_ID}/midias/upload-local`, EMP.fotosCondominio, 'foto', TOKEN);
      console.log(`    ✅ ${ok}/${EMP.fotosCondominio.length} fotos enviadas`);
    }

    // Fotos das unidades
    console.log(`\n  📷 Fotos das unidades...`);
    for (const u of EMP.unidades) {
      const unit = unitMap[u.nome];
      if (!unit?.id) continue;
      if ((unit.midias ?? []).length > 0) { console.log(`    ✓ ${u.nome} — já tem fotos`); continue; }

      const fotos   = EMP.fotosUnidade(u.tipo);
      const plantas = EMP.plantasUnidade(u.tipo);
      if (fotos.length === 0 && plantas.length === 0) { console.log(`    ⚠ ${u.nome} — sem fotos locais`); continue; }

      const endUnit = `/unidades/${unit.id}/midias/upload-local`;
      process.stdout.write(`    ${u.nome}... `);
      let ok = 0;
      ok += await uploadLista(endUnit, fotos,   'foto',   TOKEN);
      ok += await uploadLista(endUnit, plantas, 'planta', TOKEN);
      console.log(`${ok} arquivo(s) ✅`);
    }

    // Publicar
    console.log(`\n  🚀 Publicando...`);
    const pub = await api(`/empreendimentos/${EMP_ID}/publicar`, {
      method: 'PATCH', headers: {Authorization:`Bearer ${TOKEN}`},
    });
    console.log(pub.data?.publicado ? '  ✅ Publicado!' : `  ⚠ ${JSON.stringify(pub.data)}`);
  }

  console.log('\n\n✨ ALTTI — Cadastro completo!');
  console.log('   Alumínio 50:      https://soconstrutoras.vercel.app/imoveis/aluminio-50-belo-horizonte');
  console.log('   Amalfi:           https://soconstrutoras.vercel.app/imoveis/amalfi-belo-horizonte');
  console.log('   Cadaqués:         https://soconstrutoras.vercel.app/imoveis/cadaques-belo-horizonte');
  console.log('   Innovatti Center: https://soconstrutoras.vercel.app/imoveis/innovatti-center-uberlandia');
}

main().catch(console.error);
module.exports = { main };
