/**
 * cadastrar-borgesiwalloo.js — BORGESI & WALLOO ENGENHARIA
 *   1. Essenza Residenze  — Liberdade, BH   (entrega 01/03/2028) — 6 unidades
 *   2. Isaac Newton       — Pampulha, BH    (pronto 2023)        — sem unidades
 *   3. Primoh             — Ouro Preto, BH  (pronto 2025)        — 2 unidades
 *   4. Renaissance Residenze — Ouro Preto, BH (entrega 31/01/2028) — 1 unidade
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'borgesiwalloo@soconstrutoras.com.br';
const SENHA = 'BORGESIWALLOO@2026';
const ROOT  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Borgesi e Walloo';

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
  if (existe) { console.log(`  ✓ ${nome} já existe`); return existe; }
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
      body: JSON.stringify({ nome:u.nome, tipo:u.tipo,
        metragem_privativa:u.m2, metragem_total: u.ext ? u.m2+u.ext : undefined,
        quartos:u.q, suites:u.s, vagas:u.v, preco:u.preco, disponivel:u.disp ?? true }),
    });
    if (res.data?.id) { mp[u.nome] = res.data; console.log(`    ✅ ${u.nome}`); }
    else console.log(`    ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
    await sleep(300);
  }
  return mp;
}

// ══════════════════════════════════════════════════════════════════════════
// 1. ESSENZA RESIDENZE
// ══════════════════════════════════════════════════════════════════════════
const ES = p(ROOT, '2026-08-14-Essenza Residenze');
const ES_COND = ex([
  p(ES,'WA_ESSENZA_FACHADA_B.jpeg'), p(ES,'WA_ESSENZA_FACHADA_G.jpeg'),
  p(ES,'WA_ESSENZA_EMBASAMENTO_A.jpeg'), p(ES,'WA_ESSENZA_HALL.jpeg'),
  p(ES,'WA_ESSENZA_FITNESS.jpeg'), p(ES,'WA_ESSENZA_GOURMET_B.jpeg'),
  p(ES,'WA_ESSENZA_GOURMET_F.jpeg'), p(ES,'WA_ESSENZA_GARAGEM.jpeg'),
  p(ES,'WA_ESSENZA_KIDS.jpeg'), p(ES,'WA_ESSENZA_OFICINA.jpeg'), p(ES,'WA_ESSENZA_PETCARE.jpeg'),
]);
const ES_APT = ex([
  p(ES,'APTO_TIPO_F1.jpeg'), p(ES,'APTO_TIPO_F2.jpeg'),
  p(ES,'WA_ESSENZA_APTO_TIPO_SALA_A.jpeg'), p(ES,'WA_ESSENZA_APTO_TIPO_SALA_B.jpeg'),
]);
const ES_GARDEN = ex([
  p(ES,'APTO_PRIVATIVO_F1.jpeg'), p(ES,'APTO_PRIVATIVO_F2.jpeg'),
  p(ES,'WA_ESSENZA_PRIVATIVO_01.jpeg'), p(ES,'WA_ESSENZA_PRIVATIVO_02.jpeg'),
]);
const ES_COB = ex([
  p(ES,'COBERTURA_1_PVTO_F1.jpeg'), p(ES,'COBERTURA_1_PVTO_F2.jpeg'),
  p(ES,'COBERTURA_2_PVTO_F1.jpeg'), p(ES,'COBERTURA_2_PVTO_F2.jpeg'),
  p(ES,'WA_ESSENZA_APTO_COBERTURA_SUITE_A.jpeg'), p(ES,'WA_ESSENZA_COBERTURA_EXTERNA.jpeg'),
  p(ES,'WA_ESSENZA_COBERTURA_FINAL_02.jpeg'), p(ES,'WA_ESSENZA_COBERTURA_SALA_FINAL_01.jpeg'),
]);
const ES_UNIDADES = [
  { nome:'Garden 202', tipo:'garden',      m2:221.00, q:4, s:3, v:3, preco:2610000.00 },
  { nome:'Apto 301',   tipo:'apartamento', m2:155.00, q:4, s:3, v:3, preco:2043000.00 },
  { nome:'Apto 302',   tipo:'apartamento', m2:134.00, q:4, s:3, v:3, preco:1770000.00 },
  { nome:'Apto 401',   tipo:'apartamento', m2:155.00, q:4, s:3, v:3, preco:2091000.00 },
  { nome:'Cob 601',    tipo:'cobertura',   m2:311.00, q:4, s:4, v:4, preco:3744000.00 },
  { nome:'Cob 602',    tipo:'cobertura',   m2:290.00, q:4, s:4, v:4, preco:3504000.00 },
];
function esFotos(tipo) {
  if (tipo === 'garden')    return ES_GARDEN;
  if (tipo === 'cobertura') return ES_COB;
  return ES_APT;
}

// ══════════════════════════════════════════════════════════════════════════
// 2. ISAAC NEWTON
// ══════════════════════════════════════════════════════════════════════════
const IN = p(ROOT, '2026-08-14-Isaac Newton');
const IN_COND = ex([
  p(IN,'Fachada.jpeg'), p(IN,'Hall_de_entrada.jpeg'), p(IN,'Hall_de_entrada(2).jpeg'),
  p(IN,'Paisagismo.jpeg'), p(IN,'Paisagismo(2).jpeg'), p(IN,'Garagem.jpeg'),
  p(IN,'Sala_de_estar.jpeg'), p(IN,'Sala_de_estar(2).jpeg'), p(IN,'Suite_principal.jpeg'),
  p(IN,'Varanda.jpeg'), p(IN,'Sala_de_estar_-_301.jpeg'), p(IN,'Sala_de_estar_e_cozinha_-_301.jpeg'),
  p(IN,'Sala_de_estar_varanda_e_cozinha.jpeg'),
]);

// ══════════════════════════════════════════════════════════════════════════
// 3. PRIMOH
// ══════════════════════════════════════════════════════════════════════════
const PR = p(ROOT, '2026-08-14-Primoh');
const PR_COND = ex([
  p(PR,'fachada.jpeg'), p(PR,'Hall_de_entrada.jpeg'), p(PR,'Lounge.jpeg'),
  p(PR,'Paisagismo.jpeg'), p(PR,'Espaco_gourmet.jpeg'), p(PR,'Espaco_kids.jpeg'),
  p(PR,'Garage_design.jpeg'), p(PR,'Pet_care.jpeg'), p(PR,'Playground.jpeg'),
]);
const PR_APT = ex([
  p(PR,'Apartamento_tipo_-_final_01.jpeg'), p(PR,'Apartamento_tipo_-_final_02.jpeg'),
  p(PR,'Apartamento_tipo_opcao_2_-_final_01.jpeg'), p(PR,'Sala_de_estar.jpeg'),
  p(PR,'Sala_de_estar_e_cozinha.jpeg'), p(PR,'Suite_master.jpeg'),
  p(PR,'Terraco_da_area_privativa_-_201.jpeg'),
]);
const PR_COB = ex([
  p(PR,'Cobertura_1_pavimento_-_final_01.jpeg'), p(PR,'Cobertura_1_pavimento_-_final_02.jpeg'),
  p(PR,'Cobertura_2_pavimento_-_final_01.jpeg'), p(PR,'Cobertura_2_pavimento_-_final_02.jpeg'),
  p(PR,'Sala_de_estar_e_cozinha_cobertura_-_601.jpeg'),
  p(PR,'Terraco_com_gourmet_cobertura_-_601.jpeg'), p(PR,'Terraco_com_gourmet_cobertura_-_602.jpeg'),
]);
const PR_UNIDADES = [
  { nome:'Apto 401', tipo:'apartamento', m2:158.00, q:4, s:4, v:4, preco:2295000.00 },
  { nome:'Cob 602',  tipo:'cobertura',   m2:302.00, q:4, s:4, v:4, preco:3969000.00 },
];
function prFotos(tipo) { return tipo === 'cobertura' ? PR_COB : PR_APT; }

// ══════════════════════════════════════════════════════════════════════════
// 4. RENAISSANCE RESIDENZE
// ══════════════════════════════════════════════════════════════════════════
const RE = p(ROOT, '2026-08-14-Renaissance Residenze');
const RE_COND = ex([
  p(RE,'25003_WOO_Renaissance_02_FachadaNoturna_R04_alta.jpeg'), p(RE,'Pilotis.jpeg'),
  p(RE,'Area_de_lazer_-_3D.jpeg'), p(RE,'Piscina_com_deck_molhado.jpeg'),
  p(RE,'Espaco_gourmet.jpeg'), p(RE,'Coworking.jpeg'), p(RE,'Academia.jpeg'),
  p(RE,'Garagem_-_G1.jpeg'), p(RE,'Hall_social.jpeg'), p(RE,'Espaco_kids.jpeg'),
  p(RE,'Pet_place.jpeg'), p(RE,'Bicicletario.jpeg'), p(RE,'Salao_de_festas.jpeg'),
  p(RE,'Playground.jpeg'), p(RE,'Portaria.jpeg'), p(RE,'Vista_panoramica_para_a_lagoa.jpeg'),
]);
const RE_APT = ex([
  p(RE,'Apartamento_tipo_-_501.jpeg'), p(RE,'Sala_de_estar_e_cozinha.jpeg'),
  p(RE,'Suite_da_cobertura_com_closet.jpeg'),
]);
const RE_UNIDADES = [
  { nome:'Apto 501', tipo:'apartamento', m2:175.00, q:4, s:4, v:4, preco:2550000.00 },
];

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BORGESI & WALLOO — 4 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Borgesi e Walloo',
        razao_social:'Borgesi e Walloo Engenharia e Incorporações', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  // ── 1. ESSENZA RESIDENZE ─────────────────────────────────────────────────
  console.log('\n▓▓▓ [1/4] ESSENZA RESIDENZE — Liberdade, BH');
  const es = await criarOuBuscar(TOKEN, 'Essenza Residenze', {
    tipo:'apartamento', status:'lancamento',
    descricao:'O Essenza Residenze é um empreendimento de alto padrão no bairro Liberdade, BH. Apartamentos de 4 suítes, área privativa garden duplex e coberturas exclusivas de 290 a 311m². Fitness, espaço gourmet, pet care, kids e garagem com box. Entrega: março/2028.',
    endereco:'Rua José Soares Neto', bairro:'Liberdade', cidade:'Belo Horizonte', estado:'MG', cep:'31270-010',
    area_min:134.00, area_max:311.00, preco_min:1770000, preco_max:3744000,
    quartos_min:4, quartos_max:4, vagas:3, latitude:-19.9185, longitude:-43.9660,
  });
  const esMap = await criarUnidades(TOKEN, es.id, ES_UNIDADES);
  const esDet = await api(`/empreendimentos/${es.slug ?? es.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((esDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${es.id}/midias/upload-local`, ES_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${ES_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of ES_UNIDADES) {
    const unit = esMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    const fl = esFotos(u.tipo); if (!fl.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${es.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 2. ISAAC NEWTON ──────────────────────────────────────────────────────
  console.log('\n▓▓▓ [2/4] ISAAC NEWTON — Pampulha, BH (pronto)');
  const inObj = await criarOuBuscar(TOKEN, 'Isaac Newton Residence', {
    tipo:'apartamento', status:'pronto',
    descricao:'Isaac Newton Residence: empreendimento de alto luxo na Pampulha, BH. 2, 3 e 4 suítes de 93 a 228m². Apartamentos tipo, garden e coberturas com design sofisticado. Paisagismo exuberante, garagem e hall de entrada imponente. Pronto para morar.',
    endereco:'Av. Presidente Antônio Carlos', bairro:'Pampulha', cidade:'Belo Horizonte', estado:'MG', cep:'31310-270',
    area_min:93.00, area_max:228.00, preco_min:0, preco_max:0,
    quartos_min:2, quartos_max:4, vagas:2, latitude:-19.8660, longitude:-43.9710,
  });
  const inDet = await api(`/empreendimentos/${inObj.slug ?? inObj.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((inDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${inObj.id}/midias/upload-local`, IN_COND, 'foto', TOKEN);
    console.log(`  📸 ${ok}/${IN_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  await api(`/empreendimentos/${inObj.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 3. PRIMOH ────────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [3/4] PRIMOH — Ouro Preto, BH (pronto)');
  const pr = await criarOuBuscar(TOKEN, 'Primoh', {
    tipo:'apartamento', status:'pronto',
    descricao:'Primoh é um residencial de alto padrão em Ouro Preto, BH. Apartamento tipo 4 suítes (158m²) e cobertura duplex (302m²). Espaço gourmet, kids, pet care, garage design e playground. Pronto para morar.',
    endereco:'Rua José Moura Peçanha', bairro:'Ouro Preto', cidade:'Belo Horizonte', estado:'MG', cep:'31310-090',
    area_min:158.00, area_max:302.00, preco_min:2295000, preco_max:3969000,
    quartos_min:4, quartos_max:4, vagas:4, latitude:-19.9090, longitude:-43.9730,
  });
  const prMap = await criarUnidades(TOKEN, pr.id, PR_UNIDADES);
  const prDet = await api(`/empreendimentos/${pr.slug ?? pr.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((prDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${pr.id}/midias/upload-local`, PR_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${PR_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of PR_UNIDADES) {
    const unit = prMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    const fl = prFotos(u.tipo); if (!fl.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${pr.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 4. RENAISSANCE RESIDENZE ─────────────────────────────────────────────
  console.log('\n▓▓▓ [4/4] RENAISSANCE RESIDENZE — Ouro Preto, BH');
  const re = await criarOuBuscar(TOKEN, 'Renaissance Residenze', {
    tipo:'apartamento', status:'lancamento',
    descricao:'Renaissance Residenze é um empreendimento exclusivo em Ouro Preto, BH. Apartamentos de 4 suítes (175m²) com vista panorâmica para a lagoa. Piscina com deck molhado, espaço gourmet, coworking, academia, salão de festas e pet place. Entrega: janeiro/2028.',
    endereco:'Rua Sena Madureira', bairro:'Ouro Preto', cidade:'Belo Horizonte', estado:'MG', cep:'31310-120',
    area_min:175.00, area_max:175.00, preco_min:2550000, preco_max:2550000,
    quartos_min:4, quartos_max:4, vagas:4, latitude:-19.9100, longitude:-43.9740,
  });
  const reMap = await criarUnidades(TOKEN, re.id, RE_UNIDADES);
  const reDet = await api(`/empreendimentos/${re.slug ?? re.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((reDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${re.id}/midias/upload-local`, RE_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${RE_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of RE_UNIDADES) {
    const unit = reMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, RE_APT, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${re.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  console.log('\n✨ BORGESI & WALLOO concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
