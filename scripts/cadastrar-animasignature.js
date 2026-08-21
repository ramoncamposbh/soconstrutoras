/**
 * cadastrar-animasignature.js
 * Cadastro completo Ânima Signature — 4 empreendimentos
 * Conta → Empreendimentos → Unidades → Fotos → Publicar
 *
 *   node cadastrar-animasignature.js
 */

const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'animasignature@soconstrutoras.com.br';
const SENHA = 'ANIMASIGNATURE@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Ânima Signature';

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

function ex(lista) { return lista.filter(f => fs.existsSync(f)); }

// ── EMPREENDIMENTOS ───────────────────────────────────────────────────────
const EMPREENDIMENTOS = [

  // ── 1. CASA PIUM-Í ───────────────────────────────────────────────────────
  {
    nome: 'Casa Pium-í',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'O Casa Pium-í é um empreendimento residencial exclusivo no bairro Anchieta, um dos mais nobres de Belo Horizonte.',
        '',
        'Apenas 4 apartamentos por edifício, com plantas diferenciadas de 2 e 3 quartos e acabamento de alto padrão.',
        '',
        'Diferenciais:',
        '• Piscina climatizada',
        '• Fitness completo',
        '• Hall sofisticado',
        '',
        'Entrega prevista: novembro de 2026.',
      ].join('\n'),
      endereco: 'Rua Pium-I', bairro: 'Anchieta', cidade: 'Belo Horizonte', estado: 'MG', cep: '30310-490',
      area_min: 99.80, area_max: 170.32,
      preco_min: 1970000, preco_max: 3362000,
      quartos_min: 2, quartos_max: 3, vagas: 3,
      latitude: -19.9470, longitude: -43.9240,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Fachada-2-966x1024.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Hall.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Piscina_climatizada.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Fitness.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Fitness(2).jpeg'),
    ]),
    unidades: [
      { nome:'Apt 202', tipo:'apartamento', m2:170.32, quartos:3, suites:3, vagas:3, preco:3362000 },
      { nome:'Apt 302', tipo:'apartamento', m2:150.20, quartos:3, suites:3, vagas:3, preco:2958500 },
      { nome:'Apt 402', tipo:'apartamento', m2:147.77, quartos:3, suites:3, vagas:3, preco:2905000 },
      { nome:'Apt 403', tipo:'apartamento', m2:99.80,  quartos:2, suites:2, vagas:2, preco:1970000 },
    ],
    fotosUnidade: () => ex([
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Apartamento.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Apartamento(2).jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Apartamento(3).jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PERSPECTIVAS', 'Suite_master.jpeg'),
    ]),
    plantasUnidade: () => ex([
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PLANTAS', '202.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PLANTAS', '2_andar.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PLANTAS', '3_andar.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PLANTAS', '4_andar.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PLANTAS', 'Garagem.jpeg'),
      path.join(BASE, '2026-07-28- Casa Pium-í', 'PLANTAS', 'Garagem(2).jpeg'),
    ]),
  },

  // ── 2. ÍCONE ─────────────────────────────────────────────────────────────
  {
    nome: 'Ícone',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'O Ícone é um empreendimento residencial de alto padrão na Rua Oriente, no bairro Mangabeiras — um dos mais valorizados de Belo Horizonte.',
        '',
        'Exclusividade absoluta: apenas uma unidade por andar, com área privativa generosa e acabamento excepcional.',
        '',
        'Diferenciais:',
        '• Piscina rooftop com vista panorâmica',
        '• Piscina privativa na área privativa',
        '• Espaço gourmet assinado pelo chef Leo Paixão',
        '• Espaço gourmet secundário',
        '• Espaço massagem',
        '• Fitness',
        '• Espaço kids interno',
        '• Pet place',
        '• Pomar',
        '• Running stairs',
        '• Salão de festas',
        '• Área de conveniência',
        '• Hall de entrada exclusivo',
        '',
        'Empreendimento entregue em julho de 2024.',
      ].join('\n'),
      endereco: 'Rua Oriente', bairro: 'Mangabeiras', cidade: 'Belo Horizonte', estado: 'MG', cep: '30315-450',
      area_min: 137.86, area_max: 284.00,
      preco_min: 3500000, preco_max: 3500000,
      quartos_min: 3, quartos_max: 3, vagas: 3,
      latitude: -19.9625, longitude: -43.9330,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Fachada.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Hall_entrada.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Piscina_rooftop.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Piscina_rooftop(2).jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Espaco_gourmet_-_Leo_Paixao.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Espaco_gourmet_2.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Espaco_massagem.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Fitness.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Kids_interno.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Pet_place.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Pomar.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Running_stairs.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Salao_de_festas.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Espaco_conveniencia.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Espaco_convivencia.jpeg'),
    ]),
    unidades: [
      { nome:'Apt 202 (Área Priv.)', tipo:'garden', m2:137.86, m2ext:147.15, quartos:3, suites:3, vagas:3, preco:3500000 },
    ],
    fotosUnidade: (tipo) => ex([
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Sala_de_estar.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Sala_de_estar(2).jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Suite_principal.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Quarto_2.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Quarto_3.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Quarto_3(2).jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Area_intima.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Sala_de_estar_-_Area_privativa.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Gourmet_-_Area_privativa.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PERSPECTIVAS', 'Piscina_-_Area_privativa.jpeg'),
    ]),
    plantasUnidade: () => ex([
      path.join(BASE, '2026-07-28- ICONE', 'PLANTAS', 'Area_privativa_-_final_02.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PLANTAS', 'Garagem_-_1_pavimento.jpeg'),
      path.join(BASE, '2026-07-28- ICONE', 'PLANTAS', 'Garagem_-_1_subsolo.jpeg'),
    ]),
  },

  // ── 3. MINAS NOVAS 164 ───────────────────────────────────────────────────
  {
    nome: 'Minas Novas 164',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'O Minas Novas 164 é um empreendimento residencial sofisticado no bairro Cruzeiro, em Belo Horizonte.',
        '',
        'Edifício com plantas variadas: apartamentos tipo, áreas privativas nos primeiros andares e cobertura com piscina exclusiva.',
        '',
        'Diferenciais:',
        '• Piscina com deck',
        '• Piscina na cobertura',
        '• Fitness',
        '• Sauna',
        '• Salão de festas',
        '• Espaço gourmet',
        '• Área de convivência',
        '• Espaço kids externo e interno',
        '• Pilotis paisagístico',
        '• Hall de entrada sofisticado',
        '',
        'Entrega prevista: julho de 2027.',
      ].join('\n'),
      endereco: 'Rua Minas Novas, 164', bairro: 'Cruzeiro', cidade: 'Belo Horizonte', estado: 'MG', cep: '30310-160',
      area_min: 94.22, area_max: 198.69,
      preco_min: 1678000, preco_max: 3312300,
      quartos_min: 3, quartos_max: 3, vagas: 2,
      latitude: -19.9398, longitude: -43.9317,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', '24001_ANI_MinasNovas_02_FachadaNoturna_R05_alta-min-768x1024.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Hall_de_entrada.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Pilotis.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Piscina_com_deck.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Piscina_com_deck(2).jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Espaco_gourmet.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Espaco_convivencia.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Salao_de_festas.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Salao_de_festas(2).jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Fitness.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Sauna.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Kids_externo.jpeg'),
      path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Kids_interno.jpeg'),
    ]),
    unidades: [
      { nome:'Apt 401 (Área Priv.)', tipo:'garden',     m2:122.08, quartos:3, suites:3, vagas:2, preco:1925000 },
      { nome:'Apt 403 (Área Priv.)', tipo:'garden',     m2:141.56, quartos:3, suites:3, vagas:2, preco:2116000 },
      { nome:'Apt 404 (Área Priv.)', tipo:'garden',     m2:118.03, quartos:3, suites:3, vagas:2, preco:1814000 },
      { nome:'Apt 601',              tipo:'apartamento', m2:94.22,  quartos:3, suites:2, vagas:2, preco:1678000 },
      { nome:'Terrace 701',          tipo:'apartamento', m2:187.38, quartos:3, suites:3, vagas:2, preco:2652000 },
      { nome:'Apt 801',              tipo:'apartamento', m2:116.81, quartos:3, suites:2, vagas:2, preco:2025000 },
      { nome:'Apt 901',              tipo:'apartamento', m2:106.12, quartos:3, suites:2, vagas:2, preco:1915000 },
      { nome:'Apt 902',              tipo:'apartamento', m2:106.12, quartos:3, suites:2, vagas:2, preco:2116000 },
      { nome:'Cob 1001',             tipo:'cobertura',   m2:198.69, quartos:3, suites:3, vagas:2, preco:3312300 },
    ],
    fotosUnidade: (tipo) => {
      if (tipo === 'garden') return ex([
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Area_privativa.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Area_privativa(2).jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Suite_principal.jpeg'),
      ]);
      if (tipo === 'cobertura') return ex([
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Sala_de_estar_e_TV_-_cobertura.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Sala_de_estar_e_cozinha_-_cobertura.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Terraco_gourmet_da_cobertura.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Piscina_da_cobertura.jpeg'),
      ]);
      return ex([
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Sala_de_estar_e_cozinha.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PERSPECTIVAS', 'Suite_principal.jpeg'),
      ]);
    },
    plantasUnidade: (tipo) => {
      if (tipo === 'garden') return ex([
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Privativa_401.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Privativa_403.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Privativa_404.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Garagem.jpeg'),
      ]);
      if (tipo === 'cobertura') return ex([
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', '015_Apartamento801_R00_-_Em_andamento.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Garagem(2).jpeg'),
      ]);
      return ex([
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Tipo_601.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Tipo_701.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Tipo_902.jpeg'),
        path.join(BASE, '2026-07-28- Minas Novas 164', 'PLANTAS', 'Garagem.jpeg'),
      ]);
    },
  },

  // ── 4. MAJOR ─────────────────────────────────────────────────────────────
  {
    nome: 'Major',
    dados: {
      tipo: 'apartamento', status: 'lancamento',
      descricao: [
        'O Major é um elegante empreendimento residencial na Rua Major Lopes, no bairro São Pedro, em Belo Horizonte.',
        '',
        'Projeto arquitetônico de alto padrão com apartamentos de 2 e 3 quartos, áreas privativas nos primeiros andares e acabamento premium.',
        '',
        'Diferenciais:',
        '• Academia completa',
        '• Sauna',
        '• Hall de entrada exclusivo',
        '',
        'Entrega prevista: junho de 2028.',
      ].join('\n'),
      endereco: 'Rua Major Lopes', bairro: 'São Pedro', cidade: 'Belo Horizonte', estado: 'MG', cep: '30330-070',
      area_min: 91.16, area_max: 153.10,
      preco_min: 2000000, preco_max: 2550000,
      quartos_min: 2, quartos_max: 3, vagas: 2,
      latitude: -19.9560, longitude: -43.9315,
    },
    fotosCondominio: ex([
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Fachada_Preliminar_01-R00.jpeg'),
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Fachada_Preliminar_02-R00.jpeg'),
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Fachada_Preliminar_03-R00.jpeg'),
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Fachada_Preliminar_04-R00.jpeg'),
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Imagem_Academia-R03.jpeg'),
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Imagem_Sauna-R03.jpeg'),
      path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', 'Hall-previa1.jpeg'),
    ]),
    unidades: [
      { nome:'Apt 301 (Área Priv.)', tipo:'garden',     m2:113.98, m2ext:39.12, quartos:3, suites:3, vagas:2, preco:2550000 },
      { nome:'Apt 302 (Área Priv.)', tipo:'garden',     m2:112.71, m2ext:33.56, quartos:3, suites:3, vagas:2, preco:2448000 },
      { nome:'Apt 601',  tipo:'apartamento', m2:115.00, quartos:3, suites:2, vagas:2, preco:2000000 },
      { nome:'Apt 701',  tipo:'apartamento', m2:115.00, quartos:3, suites:2, vagas:2, preco:2070000 },
      { nome:'Apt 801',  tipo:'apartamento', m2:115.00, quartos:3, suites:2, vagas:2, preco:2145000 },
      { nome:'Apt 902',  tipo:'apartamento', m2:113.73, quartos:3, suites:2, vagas:2, preco:2050000 },
      { nome:'Apt 1002', tipo:'apartamento', m2:113.73, quartos:3, suites:2, vagas:2, preco:2115000 },
      { nome:'Apt 1101', tipo:'apartamento', m2:115.00, quartos:3, suites:2, vagas:2, preco:2370000 },
      { nome:'Apt 1102', tipo:'apartamento', m2:113.73, quartos:3, suites:2, vagas:2, preco:2300000 },
      { nome:'Apt 1201', tipo:'apartamento', m2:113.54, m2ext:1.46, quartos:3, suites:2, vagas:2, preco:2440000 },
      { nome:'Apt 1202', tipo:'apartamento', m2:112.28, m2ext:1.45, quartos:3, suites:2, vagas:2, preco:2360000 },
      { nome:'Apt 1301', tipo:'apartamento', m2:91.16,  m2ext:25.38, quartos:2, suites:1, vagas:2, preco:2116000 },
    ],
    fotosUnidade: (tipo) => {
      if (tipo === 'garden') return ex([
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_01-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_02-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_03-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_04-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_17P_13-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_17P_15-R04.jpeg'),
      ]);
      return ex([
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_01-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_02-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_03-R04.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PERSPECTIVAS', '014-Interiores_16P_04-R04.jpeg'),
      ]);
    },
    plantasUnidade: (tipo) => {
      if (tipo === 'garden') return ex([
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '1.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '2.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '3.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '4.jpeg'),
      ]);
      return ex([
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '5.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '6.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '7.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '8.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '9.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '10.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '14.jpeg'),
        path.join(BASE, '2026-07-28-Major', 'PLANTAS', '15.jpeg'),
      ]);
    },
  },
];

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Ânima Signature — 4 empreendimentos');
  console.log('═══════════════════════════════════════════════\n');

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
      body: JSON.stringify({
        email: EMAIL, password: SENHA,
        nome: 'Ânima Signature',
        razao_social: 'Ânima Signature Empreendimentos',
        role: 'construtora',
      }),
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
    console.log(`\n${'─'.repeat(54)}`);
    console.log(`🏢 ${EMP.nome}`);
    console.log('─'.repeat(54));

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
    console.log(`\n  📸 Fotos do condomínio (${EMP.fotosCondominio.length})...`);
    const empDet = await api(`/empreendimentos/${emp.slug ?? EMP_ID}`, { headers: {Authorization:`Bearer ${TOKEN}`} });
    const fotosExist = (empDet.data?.midias ?? []).filter(m => m.tipo === 'foto');
    if (fotosExist.length > 0) {
      console.log(`    ✅ Já possui ${fotosExist.length} foto(s), pulando`);
    } else {
      const ok = await uploadLista(`/empreendimentos/${EMP_ID}/midias/upload-local`, EMP.fotosCondominio, 'foto', TOKEN);
      console.log(`    ✅ ${ok}/${EMP.fotosCondominio.length} enviadas`);
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

      process.stdout.write(`    ${u.nome}... `);
      let ok = 0;
      ok += await uploadLista(`/unidades/${unit.id}/midias/upload-local`, fotos,   'foto',   TOKEN);
      ok += await uploadLista(`/unidades/${unit.id}/midias/upload-local`, plantas, 'planta', TOKEN);
      console.log(`${ok} arquivo(s) ✅`);
    }

    // Publicar
    console.log(`\n  🚀 Publicando...`);
    const pub = await api(`/empreendimentos/${EMP_ID}/publicar`, {
      method: 'PATCH', headers: {Authorization:`Bearer ${TOKEN}`},
    });
    console.log(pub.data?.publicado ? '  ✅ Publicado!' : `  ⚠ ${JSON.stringify(pub.data)}`);
  }

  console.log('\n\n✨ Ânima Signature — Cadastro completo!');
  console.log('   Casa Pium-í:     https://soconstrutoras.vercel.app/imoveis/casa-pium-i-belo-horizonte');
  console.log('   Ícone:           https://soconstrutoras.vercel.app/imoveis/icone-belo-horizonte');
  console.log('   Minas Novas 164: https://soconstrutoras.vercel.app/imoveis/minas-novas-164-belo-horizonte');
  console.log('   Major:           https://soconstrutoras.vercel.app/imoveis/major-belo-horizonte');
}

main().catch(console.error);
module.exports = { main };
