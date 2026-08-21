/**
 * cadastrar-terrazzo-belvedere.js
 * Cadastro completo ALTHOUSE — Terrazzo Belvedere
 * Conta → Empreendimento → Unidades → Fotos → Publicar
 *
 *   node cadastrar-terrazzo-belvedere.js
 */

const fs   = require('fs');
const path = require('path');

// ── Configurações ──────────────────────────────────────────────────────────
const API      = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL    = 'althouse@soconstrutoras.com.br';
const SENHA    = 'ALTHOUSE@2026';
const BASE_DIR = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\ALTHOUSE';
const PERSP    = path.join(BASE_DIR, 'perspectivas');
const PLAN     = path.join(BASE_DIR, 'Plantas');

// ── Fotos do condomínio (ordem de exibição) ────────────────────────────────
const FOTOS_COND = [
  path.join(PERSP, 'Captura_de_tela_2026-07-02_170144.jpeg'), // Fachada principal noturna
  path.join(PERSP, 'Captura_de_tela_2026-07-02_170209.jpeg'), // Fachada lateral diurna
  path.join(PERSP, 'Captura_de_tela_2026-07-02_170319.jpeg'), // Fachada com restaurante
  path.join(PERSP, 'Captura_de_tela_2026-07-02_170224.jpeg'), // Pátio interno / jardim
  path.join(PERSP, 'Captura_de_tela_2026-07-02_170239.jpeg'), // Rooftop panorâmica BH
  path.join(PERSP, 'Captura_de_tela_2026-07-02_170302.jpeg'), // Vista aérea localização
];

// ── Plantas (compartilhadas por todos) ────────────────────────────────────
const PLANTAS = [
  path.join(PLAN, 'Captura_de_tela_2026-07-02_170410.jpeg'), // Térreo
  path.join(PLAN, 'Captura_de_tela_2026-07-02_170425.jpeg'), // Nível 1
  path.join(PLAN, 'Captura_de_tela_2026-07-02_170443.jpeg'), // Nível 2
  path.join(PLAN, 'Captura_de_tela_2026-07-02_170454.jpeg'), // Rooftop
];

// ── Foto conceito estúdio ─────────────────────────────────────────────────
const CONCEITO_STUDIO = path.join(PERSP, 'WhatsApp_Image_2026-07-02_at_160314.jpeg');

// ── Unidades ──────────────────────────────────────────────────────────────
const UNIDADES = [
  // Lojas
  { nome:'Loja 01', tipo:'comercial', m2:57.64,  preco:1383360 },
  { nome:'Loja 02', tipo:'comercial', m2:51.68,  preco:1240320 },
  { nome:'Loja 04', tipo:'comercial', m2:51.68,  preco:1240320 },
  { nome:'Loja 05', tipo:'comercial', m2:53.00,  preco:1272000 },
  { nome:'Loja 06', tipo:'comercial', m2:13.20,  preco:316800,  descricao:'Quiosque' },
  { nome:'Loja 07', tipo:'comercial', m2:84.10,  preco:2018400 },
  { nome:'Loja 15', tipo:'comercial', m2:66.89,  preco:1605360 },
  { nome:'Loja 16', tipo:'comercial', m2:74.59,  preco:1790160 },
  { nome:'Loja 17', tipo:'comercial', m2:76.50,  preco:1836000, descricao:'Com terraço privativo' },
  { nome:'Loja 18', tipo:'comercial', m2:126.51, preco:3036240 },
  { nome:'Loja 29', tipo:'comercial', m2:72.26,  preco:1734240 },
  // Estúdios
  { nome:'Estúdio 08', tipo:'studio', m2:52.70, quartos:1, suites:1, preco:1264800 },
  { nome:'Estúdio 09', tipo:'studio', m2:51.38, quartos:1, suites:1, preco:1233120 },
  { nome:'Estúdio 10', tipo:'studio', m2:40.51, quartos:1, suites:1, preco:972240  },
  { nome:'Estúdio 11', tipo:'studio', m2:40.51, quartos:1, suites:1, preco:972240  },
  { nome:'Estúdio 12', tipo:'studio', m2:51.38, quartos:1, suites:1, preco:1233120 },
  { nome:'Estúdio 19', tipo:'studio', m2:52.70, quartos:1, suites:1, preco:1264800 },
  { nome:'Estúdio 20', tipo:'studio', m2:51.38, quartos:1, suites:1, preco:1233120 },
  { nome:'Estúdio 21', tipo:'studio', m2:40.51, quartos:1, suites:1, preco:972240  },
  { nome:'Estúdio 22', tipo:'studio', m2:40.51, quartos:1, suites:1, preco:972240  },
  { nome:'Estúdio 23', tipo:'studio', m2:51.38, quartos:1, suites:1, preco:1233120 },
  { nome:'Estúdio 24', tipo:'studio', m2:61.80, quartos:1, suites:1, preco:1483200 },
  { nome:'Estúdio 25', tipo:'studio', m2:40.57, quartos:1, suites:1, preco:973680  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(path, opts = {}) {
  const res  = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function uploadFoto(endpoint, filePath, tipo, TOKEN) {
  if (!fs.existsSync(filePath)) {
    console.warn(`    ⚠ não encontrado: ${path.basename(filePath)}`);
    return null;
  }
  const buf  = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buf], { type: 'image/jpeg' }), path.basename(filePath));
  form.append('tipo', tipo);
  const res  = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  if (res.status !== 201) {
    const t = await res.text();
    console.warn(`    ✗ HTTP ${res.status}: ${t.slice(0, 120)}`);
    return null;
  }
  return res.json();
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  ALTHOUSE — Terrazzo Belvedere');
  console.log('═══════════════════════════════════════════\n');

  // 1. LOGIN OU REGISTRO
  console.log('🔑 Autenticando...');
  let TOKEN;
  const login = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });

  if (login.data?.access_token) {
    TOKEN = login.data.access_token;
    console.log('  ✅ Login OK');
  } else {
    console.log('  Conta não existe, registrando...');
    const reg = await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: EMAIL, password: SENHA,
        nome: 'ALTHOUSE', razao_social: 'Althouse Empreendimentos', role: 'construtora',
      }),
    });
    if (!reg.data?.access_token) throw new Error('Registro falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token;
    console.log('  ✅ Conta criada');
  }

  // 2. EMPREENDIMENTO
  console.log('\n🏢 Empreendimento...');
  const emps = await api('/empreendimentos/meus/listar', { headers: { Authorization: `Bearer ${TOKEN}` } });
  const lista = Array.isArray(emps.data) ? emps.data : [];
  let emp = lista.find(e => e.nome === 'Terrazzo Belvedere');

  if (emp) {
    console.log(`  ✅ Já existe — ID: ${emp.id}`);
  } else {
    const cria = await api('/empreendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        nome: 'Terrazzo Belvedere',
        tipo: 'comercial',
        status: 'lancamento',
        descricao: [
          'Empreendimento de uso misto no coração do Belvedere, um dos bairros mais nobres de Belo Horizonte.',
          '',
          'O Terrazzo Belvedere combina lojas de alto padrão e estúdios residenciais em projeto arquitetônico sofisticado de 3 pavimentos mais rooftop.',
          '',
          'Diferenciais:',
          '• Rooftop com vista panorâmica de BH',
          '• Terraço gourmet com lounge',
          '• Work Coffee (co-working)',
          '• Restaurante e bar no térreo',
          '• Jardins e áreas de convivência',
          '• Estacionamento',
          '• Estúdios com cozinha integrada, varanda e suíte',
          '• Lojas com mezanino e terraços privativos',
          '',
          'Entrega: dezembro de 2027',
        ].join('\n'),
        endereco: 'Rua Desembargador Assis Rocha',
        bairro: 'Belvedere',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        cep: '30320-570',
        area_min: 13.20, area_max: 126.51,
        preco_min: 316800, preco_max: 3036240,
        quartos_min: 0, quartos_max: 1,
        vagas: 0,
        latitude: -19.9703, longitude: -43.9541,
      }),
    });
    if (!cria.data?.id) throw new Error('Criação falhou: ' + JSON.stringify(cria.data));
    emp = cria.data;
    console.log(`  ✅ Criado — ID: ${emp.id} | slug: ${emp.slug}`);
  }

  const EMP_ID = emp.id;

  // 3. UNIDADES
  console.log('\n🏠 Unidades...');
  const unitRes = await api(`/unidades/empreendimentos/${EMP_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const existentes = Array.isArray(unitRes.data) ? unitRes.data : [];
  const existeMap  = {};
  for (const u of existentes) existeMap[u.nome] = u;

  const UNIT_MAP = { ...existeMap }; // nome → {id, midias}

  for (const u of UNIDADES) {
    if (existeMap[u.nome]) {
      process.stdout.write(`  ✓ ${u.nome} (já existe)\n`);
      continue;
    }
    const body = {
      nome: u.nome, tipo: u.tipo,
      metragem_privativa: u.m2,
      quartos: u.quartos ?? 0, suites: u.suites ?? 0,
      vagas: 0, preco: u.preco, disponivel: true,
    };
    if (u.descricao) body.descricao = u.descricao;

    const res = await api(`/unidades/empreendimentos/${EMP_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(body),
    });

    if (res.data?.id) {
      UNIT_MAP[u.nome] = res.data;
      console.log(`  ✅ ${u.nome}`);
    } else {
      console.log(`  ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
    }
  }

  // 4. FOTOS DO CONDOMÍNIO
  console.log('\n📸 Fotos do condomínio...');
  const empDetalhes = await api(`/empreendimentos/${emp.slug ?? EMP_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const fotosExistentes = (empDetalhes.data?.midias ?? []).filter(m => m.tipo === 'foto');

  if (fotosExistentes.length > 0) {
    console.log(`  ✅ Já possui ${fotosExistentes.length} foto(s), pulando upload`);
  } else {
    for (let i = 0; i < FOTOS_COND.length; i++) {
      const f = FOTOS_COND[i];
      process.stdout.write(`  [${i+1}/${FOTOS_COND.length}] ${path.basename(f)}... `);
      const r = await uploadFoto(`/empreendimentos/${EMP_ID}/midias/upload-local`, f, 'foto', TOKEN);
      console.log(r ? '✅' : 'ignorado');
      await sleep(500);
    }
  }

  // 5. FOTOS DAS UNIDADES
  console.log('\n📷 Fotos das unidades...');
  for (const u of UNIDADES) {
    const unit = UNIT_MAP[u.nome];
    if (!unit?.id) continue;

    const midias = unit.midias ?? [];
    if (midias.length > 0) {
      console.log(`  ✅ ${u.nome} — já tem ${midias.length} foto(s), pulando`);
      continue;
    }

    process.stdout.write(`  ${u.nome}... `);
    let ok = 0;

    if (u.tipo === 'studio') {
      // Foto conceito + plantas
      const r = await uploadFoto(`/unidades/${unit.id}/midias/upload-local`, CONCEITO_STUDIO, 'foto', TOKEN);
      if (r) ok++;
      await sleep(300);
    }

    // Plantas para todos os tipos
    for (const p of PLANTAS) {
      const r = await uploadFoto(`/unidades/${unit.id}/midias/upload-local`, p, 'planta', TOKEN);
      if (r) ok++;
      await sleep(300);
    }

    console.log(`${ok} arquivo(s) ✅`);
    await sleep(400);
  }

  // 6. PUBLICAR
  console.log('\n🚀 Publicando...');
  const pub = await api(`/empreendimentos/${EMP_ID}/publicar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log(pub.data?.publicado ? '  ✅ Publicado!' : `  ⚠ ${JSON.stringify(pub.data)}`);

  console.log('\n✨ Concluído!');
  console.log(`   https://soconstrutoras.vercel.app/imoveis/${emp.slug ?? 'terrazzo-belvedere-belo-horizonte'}`);
}

main().catch(console.error);
module.exports = { main };
