/**
 * cadastrar-aquila.js
 * Cadastro completo ÁQUILA — 1 empreendimento, 12 unidades
 * Conta → Empreendimento → Unidades → Fotos → Publicar
 *
 *   node cadastrar-aquila.js
 */

const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'aquila@soconstrutoras.com.br';
const SENHA = 'AQUILA@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\AQUILA\\2026-07-28-Áquila';

const PERSP  = path.join(BASE, 'PERSPECTIVAS');
const PLAN   = path.join(BASE, 'PLANTAS');

// ── Helpers ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function ex(lista)  { return lista.filter(f => fs.existsSync(f)); }

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

// ── FOTOS ─────────────────────────────────────────────────────────────────
const FOTOS_COND = ex([
  path.join(PERSP, 'CONDOMINIO', 'Perspectiva.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Hall_de_entrada.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Piscina_com_deck_molhado.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Piscina_infantil.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Espaco_gourmet.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Salao_de_festas.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Academia.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Espaco_kids.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Playground.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Bicicletario.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Lojas.jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'Lojas(2).jpeg'),
  path.join(PERSP, 'CONDOMINIO', 'WhatsApp_Image_2025-12-18_at_222903.jpeg'),
]);

// Fotos por tipo de unidade
function fotosUnidade(tipo) {
  if (tipo === 'cobertura') return ex([
    path.join(PERSP, 'APARTAMENTO', 'Living.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Suite_principal.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Cozinha.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Terraco_da_cobertura.jpeg'),
  ]);
  if (tipo === 'garden') return ex([
    path.join(PERSP, 'APARTAMENTO', 'Living.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Suite_principal.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Cozinha.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Terraco_da_cobertura.jpeg'),
  ]);
  // apartamento
  return ex([
    path.join(PERSP, 'APARTAMENTO', 'Living.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Suite_principal.jpeg'),
    path.join(PERSP, 'APARTAMENTO', 'Cozinha.jpeg'),
  ]);
}

function plantasUnidade(tipo) {
  if (tipo === 'cobertura') return ex([
    path.join(PLAN, 'Cobertura.jpeg'),
    path.join(PLAN, 'Garagem_-_terreo.jpeg'),
    path.join(PLAN, 'Garagem_-_subsolo.jpeg'),
  ]);
  if (tipo === 'garden') return ex([
    path.join(PLAN, 'Apartamento_com_area_privativa.jpeg'),
    path.join(PLAN, 'Garagem_-_terreo.jpeg'),
    path.join(PLAN, 'Garagem_-_subsolo.jpeg'),
  ]);
  return ex([
    path.join(PLAN, 'Apartamento_tipo.jpeg'),
    path.join(PLAN, 'Garagem_-_terreo.jpeg'),
    path.join(PLAN, 'Garagem_-_subsolo.jpeg'),
  ]);
}

// ── UNIDADES ──────────────────────────────────────────────────────────────
const UNIDADES = [
  { nome:'Apt 402', tipo:'apartamento', m2:83.00, m2ext:2.00,  quartos:3, suites:2, vagas:2, preco:950000,  disponivel:true  },
  { nome:'Apt 403', tipo:'apartamento', m2:83.00, m2ext:2.00,  quartos:3, suites:2, vagas:2, preco:920000,  disponivel:true  },
  { nome:'Apt 501', tipo:'apartamento', m2:83.00,              quartos:3, suites:2, vagas:2, preco:905000,  disponivel:true  },
  { nome:'Apt 502', tipo:'apartamento', m2:83.00,              quartos:3, suites:2, vagas:2, preco:930000,  disponivel:true  },
  { nome:'Apt 503', tipo:'apartamento', m2:83.00,              quartos:3, suites:2, vagas:2, preco:920000,  disponivel:true  },
  { nome:'Apt 602', tipo:'apartamento', m2:83.00,              quartos:3, suites:2, vagas:2, preco:960000,  disponivel:true  },
  { nome:'Apt 603', tipo:'apartamento', m2:83.00,              quartos:3, suites:2, vagas:2, preco:940000,  disponivel:true  },
  { nome:'Apt 703', tipo:'apartamento', m2:83.00,              quartos:3, suites:2, vagas:3, preco:980000,  disponivel:true  },
  { nome:'Apt 902', tipo:'apartamento', m2:77.00, m2ext:5.00,  quartos:3, suites:2, vagas:2, preco:990000,  disponivel:false }, // Reservado
  { nome:'Apt 903', tipo:'garden',      m2:154.00, m2ext:10.00, quartos:3, suites:3, vagas:4, preco:1900000, disponivel:true  },
  { nome:'Apt 904', tipo:'garden',      m2:154.00, m2ext:10.00, quartos:3, suites:3, vagas:4, preco:1900000, disponivel:true  },
  { nome:'Cob 1004', tipo:'cobertura',  m2:95.00,  m2ext:47.00, quartos:3, suites:3, vagas:3, preco:1350000, disponivel:true  },
];

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  ÁQUILA — Coração Eucarístico, BH/MG');
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
        nome: 'Áquila', razao_social: 'Áquila Empreendimentos', role: 'construtora',
      }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token;
    console.log('  ✅ Conta criada');
  }

  // 2. Empreendimento
  console.log('\n🏢 Empreendimento...');
  const empListRes = await api('/empreendimentos/meus/listar', { headers: {Authorization:`Bearer ${TOKEN}`} });
  const empLista   = Array.isArray(empListRes.data) ? empListRes.data : [];
  let emp = empLista.find(e => e.nome === 'Áquila');

  if (emp) {
    console.log(`  ✅ Já existe — ID: ${emp.id}`);
  } else {
    const res = await api('/empreendimentos', {
      method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
      body: JSON.stringify({
        nome: 'Áquila',
        tipo: 'apartamento', status: 'lancamento',
        descricao: [
          'O Áquila é um empreendimento residencial de alto padrão no bairro Coração Eucarístico, em Belo Horizonte.',
          '',
          'Projeto sofisticado com apartamentos de 3 quartos, unidades com área privativa e cobertura exclusiva.',
          '',
          'Diferenciais:',
          '• Piscina com deck molhado',
          '• Piscina infantil',
          '• Espaço gourmet',
          '• Salão de festas',
          '• Academia completa',
          '• Espaço kids',
          '• Playground',
          '• Bicicletário',
          '• Lojas no térreo',
          '• Hall de entrada exclusivo',
          '',
          'Entrega prevista: março de 2027.',
        ].join('\n'),
        endereco: 'Rua Padre João Crisóstomo', bairro: 'Coração Eucarístico',
        cidade: 'Belo Horizonte', estado: 'MG', cep: '30535-560',
        area_min: 77.00, area_max: 201.00,
        preco_min: 905000, preco_max: 1900000,
        quartos_min: 3, quartos_max: 3, vagas: 2,
        latitude: -19.9215, longitude: -43.9897,
      }),
    });
    if (!res.data?.id) throw new Error('Criação falhou: ' + JSON.stringify(res.data));
    emp = res.data;
    console.log(`  ✅ Criado — ID: ${emp.id} | slug: ${emp.slug}`);
  }

  const EMP_ID = emp.id;

  // 3. Unidades
  console.log(`\n🏠 Unidades (${UNIDADES.length})...`);
  const unitRes = await api(`/unidades/empreendimentos/${EMP_ID}`, { headers: {Authorization:`Bearer ${TOKEN}`} });
  const existentes = Array.isArray(unitRes.data) ? unitRes.data : [];
  const unitMap = {};
  for (const u of existentes) unitMap[u.nome] = u;

  for (const u of UNIDADES) {
    if (unitMap[u.nome]) { console.log(`  ✓ ${u.nome} (já existe)`); continue; }
    const body = {
      nome: u.nome, tipo: u.tipo,
      metragem_privativa: u.m2,
      metragem_total: u.m2ext ? (u.m2 + u.m2ext) : undefined,
      quartos: u.quartos ?? 0, suites: u.suites ?? 0,
      vagas: u.vagas ?? 0, preco: u.preco, disponivel: u.disponivel ?? true,
    };
    const res = await api(`/unidades/empreendimentos/${EMP_ID}`, {
      method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
      body: JSON.stringify(body),
    });
    if (res.data?.id) { unitMap[u.nome] = res.data; console.log(`  ✅ ${u.nome}${u.disponivel === false ? ' (reservado)' : ''}`); }
    else console.log(`  ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
  }

  // 4. Fotos do condomínio
  console.log(`\n📸 Fotos do condomínio (${FOTOS_COND.length})...`);
  const empDet = await api(`/empreendimentos/${emp.slug ?? EMP_ID}`, { headers: {Authorization:`Bearer ${TOKEN}`} });
  const fotosExist = (empDet.data?.midias ?? []).filter(m => m.tipo === 'foto');
  if (fotosExist.length > 0) {
    console.log(`  ✅ Já possui ${fotosExist.length} foto(s), pulando`);
  } else {
    const ok = await uploadLista(`/empreendimentos/${EMP_ID}/midias/upload-local`, FOTOS_COND, 'foto', TOKEN);
    console.log(`  ✅ ${ok}/${FOTOS_COND.length} enviadas`);
  }

  // 5. Fotos das unidades
  console.log('\n📷 Fotos das unidades...');
  for (const u of UNIDADES) {
    const unit = unitMap[u.nome];
    if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome} — já tem fotos`); continue; }

    const fotos   = fotosUnidade(u.tipo);
    const plantas = plantasUnidade(u.tipo);
    if (fotos.length === 0 && plantas.length === 0) { console.log(`  ⚠ ${u.nome} — sem fotos locais`); continue; }

    process.stdout.write(`  ${u.nome}... `);
    let ok = 0;
    ok += await uploadLista(`/unidades/${unit.id}/midias/upload-local`, fotos,   'foto',   TOKEN);
    ok += await uploadLista(`/unidades/${unit.id}/midias/upload-local`, plantas, 'planta', TOKEN);
    console.log(`${ok} arquivo(s) ✅`);
  }

  // 6. Publicar
  console.log('\n🚀 Publicando...');
  const pub = await api(`/empreendimentos/${EMP_ID}/publicar`, {
    method: 'PATCH', headers: {Authorization:`Bearer ${TOKEN}`},
  });
  console.log(pub.data?.publicado ? '  ✅ Publicado!' : `  ⚠ ${JSON.stringify(pub.data)}`);

  console.log('\n✨ ÁQUILA — Cadastro completo!');
  console.log(`   https://soconstrutoras.vercel.app/imoveis/${emp.slug ?? 'aquila-belo-horizonte'}`);
}

main().catch(console.error);
module.exports = { main };
