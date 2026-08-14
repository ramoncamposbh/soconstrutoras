/**
 * cadastrar-baumac.js — BAUMAC
 *   1. Edifício Atenas — Barroca, BH  (entrega 30/06/2027) — 20 unidades
 *   2. Santorinii      — Gutierrez, BH (entregue 2023)    — sem unidades disponíveis
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'baumac@soconstrutoras.com.br';
const SENHA = 'BAUMAC@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\BAUMAC';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function ex(l)     { return l.filter(f => fs.existsSync(f)); }
function p(...a)   { return path.join(...a); }

async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}
async function uploadFoto(ep, file, tipo, TOKEN) {
  if (!fs.existsSync(file)) { console.warn(`    ⚠ ${path.basename(file)}`); return null; }
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], { type: 'image/jpeg' }), path.basename(file));
  form.append('tipo', tipo);
  const res = await fetch(`${API}${ep}`, { method:'POST', headers:{Authorization:`Bearer ${TOKEN}`}, body:form });
  if (res.status !== 201) { console.warn(`    ✗ ${res.status}`); return null; }
  return res.json();
}
async function upLista(ep, files, tipo, TOKEN) {
  let ok = 0;
  for (const f of files) { if (await uploadFoto(ep, f, tipo, TOKEN)) ok++; await sleep(400); }
  return ok;
}
async function criarOuBuscar(TOKEN, nome, body) {
  const list = await api('/empreendimentos/meus/listar', { headers:{Authorization:`Bearer ${TOKEN}`} });
  const existe = (Array.isArray(list.data) ? list.data : []).find(e => e.nome === nome);
  if (existe) { console.log(`  ✓ ${nome} já existe (ID: ${existe.id})`); return existe; }
  const res = await api('/empreendimentos', {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
    body: JSON.stringify({ nome, ...body }),
  });
  if (!res.data?.id) throw new Error('Falha: ' + JSON.stringify(res.data).slice(0,200));
  console.log(`  ✅ ${nome} criado (ID: ${res.data.id})`); return res.data;
}
async function criarUnidades(TOKEN, EMP_ID, unidades) {
  const ur = await api(`/unidades/empreendimentos/${EMP_ID}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  const mp = {}; for (const u of (Array.isArray(ur.data) ? ur.data : [])) mp[u.nome] = u;
  for (const u of unidades) {
    if (mp[u.nome]) { console.log(`    ✓ ${u.nome}`); continue; }
    const res = await api(`/unidades/empreendimentos/${EMP_ID}`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
      body: JSON.stringify({ nome:u.nome, tipo:u.tipo, metragem_privativa:u.m2,
        metragem_total: u.ext ? u.m2+u.ext : undefined,
        quartos:u.q, suites:u.s, vagas:u.v, preco:u.preco, disponivel:u.disp ?? true }),
    });
    if (res.data?.id) { mp[u.nome] = res.data; console.log(`    ✅ ${u.nome}`); }
    else console.log(`    ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
    await sleep(300);
  }
  return mp;
}

// ── BAUMAC BASE PATHS ─────────────────────────────────────────────────────
const AT = p(BASE, '2026-08-14-Edifício Atenas');
const SA = p(BASE, '2026-08-14-Santorinii');

// ── EDIFÍCIO ATENAS — fotos ───────────────────────────────────────────────
const AT_COND = ex([
  p(AT,'Academia.jpeg'), p(AT,'Coworking.jpeg'),
  p(AT,'Gourmet_Externo.jpeg'), p(AT,'Gourmet_Interno.jpeg'),
  p(AT,'Hall.jpeg'), p(AT,'Piscina.jpeg'),
  p(AT,'Quadra_Poliesportiva_Espaco_Kids.jpeg'), p(AT,'Sauna.jpeg'),
]);
const AT_APT  = ex([
  p(AT,'Closet.jpeg'), p(AT,'Cozinha_-_Ap.jpeg'),
  p(AT,'Lavabo_-_Ap.jpeg'), p(AT,'Semissuite_-_Ap.jpeg'), p(AT,'Suite_-_Ap.jpeg'),
]);
const AT_GARDEN = ex([
  p(AT,'Garden.jpeg'), p(AT,'Cozinha_-_Ap.jpeg'), p(AT,'Suite_-_Ap.jpeg'),
]);
const AT_COB = ex([
  p(AT,'Sala_-_Cobertura.jpeg'), p(AT,'Semissuite_-_Cobertura.jpeg'), p(AT,'Suite_-_Cobertura.jpeg'),
  p(AT,'Cozinha_-_Ap.jpeg'),
]);

const AT_UNIDADES = [
  { nome:'Apt 202', tipo:'garden',      m2:89.43, ext:35.60, q:3, s:1, v:2, preco:1653526.91 },
  { nome:'Apt 301', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1293781.42 },
  { nome:'Apt 302', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1288350.66 },
  { nome:'Apt 303', tipo:'apartamento', m2:87.93,            q:3, s:1, v:2, preco:1352269.98 },
  { nome:'Apt 402', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1307895.88 },
  { nome:'Apt 404', tipo:'apartamento', m2:87.93,            q:3, s:1, v:2, preco:1377796.74 },
  { nome:'Apt 501', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1332871.84 },
  { nome:'Apt 502', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1327441.09 },
  { nome:'Apt 503', tipo:'apartamento', m2:87.93,            q:3, s:1, v:2, preco:1392462.00 },
  { nome:'Apt 504', tipo:'apartamento', m2:88.93,            q:3, s:1, v:2, preco:1397892.75 },
  { nome:'Apt 602', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1346986.30 },
  { nome:'Apt 603', tipo:'apartamento', m2:87.93,            q:3, s:1, v:2, preco:1412558.00 },
  { nome:'Apt 604', tipo:'apartamento', m2:87.93,            q:3, s:1, v:2, preco:1417988.76 },
  { nome:'Apt 702', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1366531.51 },
  { nome:'Apt 801', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1391507.48 },
  { nome:'Apt 802', tipo:'apartamento', m2:85.52,            q:3, s:1, v:2, preco:1386076.72 },
  { nome:'Cob 901', tipo:'cobertura',   m2:126.02, ext:22.23, q:3, s:2, v:3, preco:2265914.50 },
  { nome:'Cob 902', tipo:'cobertura',   m2:126.02, ext:22.23, q:3, s:2, v:3, preco:2265914.50 },
  { nome:'Cob 904', tipo:'cobertura',   m2:126.28, ext:22.37, q:3, s:2, v:3, preco:2298496.23 },
  // 704 reservado sem m² — pulado
];
function atFotos(tipo) {
  if (tipo === 'garden')      return AT_GARDEN;
  if (tipo === 'cobertura')   return AT_COB;
  return AT_APT;
}

// ── SANTORINII — fotos ────────────────────────────────────────────────────
const SA_COND = ex([
  p(SA,'santorini-inicialjpg.jpeg'), p(SA,'Academia.jpeg'),
  p(SA,'Espaco_gourmet.jpeg'), p(SA,'Localizacao.jpeg'),
]);

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BAUMAC — 2 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');

  let TOKEN;
  const login = await api('/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email:EMAIL, password:SENHA }),
  });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Baumac',
        razao_social:'Baumac Incorporações e Empreendimentos', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  // ── 1. Edifício Atenas ───────────────────────────────────────────────────
  console.log('\n▓▓▓ [1/2] EDIFÍCIO ATENAS — Barroca, BH');
  const at = await criarOuBuscar(TOKEN, 'Edifício Atenas', {
    tipo:'apartamento', status:'lancamento',
    descricao:'O Edifício Atenas é um residencial sofisticado na Barroca, BH. Apartamentos tipo 3 quartos, área privativa garden e coberturas duplex. Academia, coworking, piscina, sauna, espaço gourmet e quadra poliesportiva. Entrega: junho/2027.',
    endereco:'Rua Herculano de Freitas', bairro:'Barroca', cidade:'Belo Horizonte', estado:'MG', cep:'30431-285',
    area_min:85.52, area_max:148.25, preco_min:1288350, preco_max:2298496,
    quartos_min:3, quartos_max:3, vagas:2, latitude:-19.9438, longitude:-43.9569,
  });
  console.log('  Unidades...');
  const atMap = await criarUnidades(TOKEN, at.id, AT_UNIDADES);

  const atDet = await api(`/empreendimentos/${at.slug ?? at.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((atDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${at.id}/midias/upload-local`, AT_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${AT_COND.length}`);
  } else { console.log('  ✓ fotos cond já existem'); }

  for (const u of AT_UNIDADES) {
    const unit = atMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ fotos ${u.nome}`); continue; }
    const fotos = atFotos(u.tipo); if (!fotos.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    const ok = await upLista(`/unidades/${unit.id}/midias/upload-local`, fotos, 'foto', TOKEN);
    console.log(`${ok} ✅`);
  }
  await api(`/empreendimentos/${at.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 2. Santorinii ─────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [2/2] SANTORINII — Gutierrez, BH (pronto)');
  const sa = await criarOuBuscar(TOKEN, 'Santorinii', {
    tipo:'apartamento', status:'pronto',
    descricao:'O Santorinii é um residencial entregue no Gutierrez, BH. Inspirado na arquitetura grega, com apartamentos tipo, garden e cobertura com terraço. Espaço gourmet, academia e localização privilegiada. Pronto para morar.',
    endereco:'Rua Ludgero Dolabela', bairro:'Gutierrez', cidade:'Belo Horizonte', estado:'MG', cep:'30430-130',
    area_min:110.77, area_max:190.54, preco_min:0, preco_max:0,
    quartos_min:2, quartos_max:3, vagas:2, latitude:-19.9460, longitude:-43.9530,
  });
  const saDet = await api(`/empreendimentos/${sa.slug ?? sa.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((saDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${sa.id}/midias/upload-local`, SA_COND, 'foto', TOKEN);
    console.log(`  📸 ${ok}/${SA_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  await api(`/empreendimentos/${sa.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  console.log('\n✨ BAUMAC concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
