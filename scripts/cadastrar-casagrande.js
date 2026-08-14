/**
 * cadastrar-casagrande.js — CASA GRANDE
 *   1. Alma Residence       — Barreiro, BH (pronto 2025)      — sem unidades disponíveis
 *   2. Arbo Residence & Mall— Barreiro, BH (entrega 03/2028)  — 13 unidades (3 lojas + 7 aptos + 3 cob)
 *   3. Lisboa Residence     — Barreiro, BH (entrega 11/2027)  — 24 unidades
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'casagrande@soconstrutoras.com.br';
const SENHA = 'CASAGRANDE@2026';
const ROOT  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CASA GRANDE';

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

// ═══════════════════════════════════════════════════════════════════════════
// 1. ALMA RESIDENCE
// ═══════════════════════════════════════════════════════════════════════════
const AL = p(ROOT, '2026-08-14-Alma Residence');
const AL_COND = ex([
  p(AL,'22017_CGR_ResAlma_01_FachadaDiurna_R04_alta.jpeg'), p(AL,'Fachada.jpeg'),
  p(AL,'Pilotis.jpeg'), p(AL,'Pilotis_-_3D.jpeg'), p(AL,'Terreo.jpeg'),
  p(AL,'Espaco_gourmet.jpeg'), p(AL,'Piscina_com_deck.jpeg'),
  p(AL,'Salao_de_festas.jpeg'), p(AL,'Playground.jpeg'), p(AL,'Academia.jpeg'),
  p(AL,'Espaco_kids.jpeg'), p(AL,'Espaco_de_convivencia.jpeg'), p(AL,'Hall_de_entrada.jpeg'),
  p(AL,'Garagem_-_subsolo.jpeg'), p(AL,'Bicicletario.jpeg'), p(AL,'Oficina_compartilhada.jpeg'),
  p(AL,'Estacionamento.jpeg'),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 2. ARBO RESIDENCE & MALL
// ═══════════════════════════════════════════════════════════════════════════
const AR = p(ROOT, '2026-08-14-Arbo Residence & Mall');
const AR_COND = ex([
  p(AR,'PRISMA_ARBO_FACHADA_NOITE_grama.jpeg'), p(AR,'PRISMA_ARBO_HALL.jpeg'),
  p(AR,'PRISMA_ARBO_GOURMET.jpeg'), p(AR,'PRISMA_ARBO_PISCINA.jpeg'),
  p(AR,'PRISMA_ARBO_RAIA.jpeg'), p(AR,'PRISMA_ARBO_DECK.jpeg'),
  p(AR,'PRISMA_ARBO_ACADEMIA_NOITE.jpeg'), p(AR,'PRISMA_ARBO_QUADRA.jpeg'),
  p(AR,'PRISMA_ARBO_SALAODEFESTAS.jpeg'), p(AR,'PRISMA_ARBO_SAUNA.jpeg'),
  p(AR,'PRISMA_ARBO_PETPLACE.jpeg'), p(AR,'PRISMA_ARBO_PLAYGROUND.jpeg'),
  p(AR,'PRISMA_ARBO_FOGODECHAO.jpeg'), p(AR,'Pilotis.jpeg'), p(AR,'Lojas_Terreo.jpeg'),
]);
const AR_APT2 = ex([ p(AR,'Apartamento_PNE_-_2_Qts.jpeg'), p(AR,'Apartamento_tipo_-_2_Qts.jpeg') ]);
const AR_APT3 = ex([ p(AR,'Apartamento_tipo_-_3_Qts.jpeg') ]);
const AR_UNIDADES = [
  { nome:'Loja 02',   tipo:'comercial',   m2:202.49, ext:7.71,  q:0, v:1, preco:2105896.00 },
  { nome:'Loja 03',   tipo:'comercial',   m2:125.37, ext:6.85,  q:0, v:1, preco:1303848.00 },
  { nome:'Loja 05',   tipo:'comercial',   m2:227.91, ext:7.72,  q:0, v:1, preco:2370264.00 },
  { nome:'Apto 601',  tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:544099.50  },
  { nome:'Apto 707',  tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:550858.50  },
  { nome:'Apto 807',  tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:553111.50  },
  { nome:'Apto 1001', tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:555364.50  },
  { nome:'Apto 1007', tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:557617.50  },
  { nome:'Apto 1107', tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:559870.50  },
  { nome:'Apto 1501', tipo:'apartamento', m2:70.85,             q:3, s:1, v:2, preco:564376.50  },
  { nome:'Cob 1601',  tipo:'cobertura',   m2:92.85, ext:44.39,  q:3, s:2, v:2, preco:957525.00  },
  { nome:'Cob 1605',  tipo:'cobertura',   m2:79.17, ext:35.29,  q:2, s:1, v:2, preco:743490.00  },
  { nome:'Cob 1607',  tipo:'cobertura',   m2:92.85, ext:44.39,  q:3, s:2, v:2, preco:968790.00  },
];
function arFotos(tipo) {
  if (tipo === 'comercial') return AR_COND.slice(0, 2);
  if (tipo === 'cobertura') return AR_APT3;
  if (tipo === 'apartamento') {
    // alternates between 2q and 3q photos based on quartos
    return AR_APT3;
  }
  return AR_APT2;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. LISBOA RESIDENCE
// ═══════════════════════════════════════════════════════════════════════════
const LI = p(ROOT, '2026-08-14-Lisboa Residence');
const LI_COND = ex([
  p(LI,'23008_CG_Lisboa_01_FachadaDiurna_R05_alta.jpeg'), p(LI,'Fachada_noturna.jpeg'),
  p(LI,'Vista_lateral.jpeg'), p(LI,'Hall_de_entrada.jpeg'), p(LI,'Hall_de_entrada(2).jpeg'),
  p(LI,'Piscina.jpeg'), p(LI,'Piscina_com_deck.jpeg'), p(LI,'Espaco_gourmet.jpeg'),
  p(LI,'Espaco_gourmet(2).jpeg'), p(LI,'Salao_de_festas.jpeg'), p(LI,'Salao_de_festas(2).jpeg'),
  p(LI,'Coworking.jpeg'), p(LI,'Crossfit.jpeg'), p(LI,'Fitness.jpeg'),
  p(LI,'Espaco_kids.jpeg'), p(LI,'Mercado_autonomo.jpeg'), p(LI,'Sala_de_reuniao.jpeg'),
  p(LI,'Sauna.jpeg'), p(LI,'Sauna_com_descanso.jpeg'), p(LI,'Playground.jpeg'),
  p(LI,'Quadra_poliesportiva.jpeg'), p(LI,'Lounge.jpeg'), p(LI,'Lounge(2).jpeg'),
  p(LI,'Localizacao.jpeg'), p(LI,'Lazer_completo.jpeg'), p(LI,'Garagem_com_box_de_despejo.jpeg'),
  p(LI,'Lockers_para_delivery.jpeg'),
]);
const LI_APT = ex([
  p(LI,'Apartamento_tipo_-_final_01.jpeg'), p(LI,'Apartamento_tipo_-_final_02.jpeg'),
  p(LI,'Apartamento_tipo_-_final_03.jpeg'), p(LI,'Apartamento_tipo_-_final_04.jpeg'),
  p(LI,'Apartamento_tipo_-_final_05.jpeg'), p(LI,'Apartamento_tipo_-_final_06.jpeg'),
]);
const LI_GARDEN = ex([
  p(LI,'Apartamento_com_area_privativa_-_401.jpeg'),
  p(LI,'Apartamento_com_area_privativa_-_403.jpeg'),
  p(LI,'Apartamento_com_area_privativa_-_504.jpeg'),
  p(LI,'Apartamento_com_area_privativa_-_505.jpeg'),
  p(LI,'Apartamento_com_area_privativa_-_506.jpeg'),
]);
const LI_COB = ex([
  p(LI,'Cobertura_1_pavimento_-_1403.jpeg'), p(LI,'Cobertura_1_pavimento_-_1404.jpeg'),
  p(LI,'Cobertura_2_pavimento_-_1403.jpeg'), p(LI,'Cobertura_2_pavimento_-_1404.jpeg'),
]);
const LI_UNIDADES = [
  { nome:'Loja 1',    tipo:'comercial',   m2:183.53,             q:0, v:0, preco:1835300.00  },
  { nome:'Loja 3',    tipo:'comercial',   m2:224.46,             q:0, v:0, preco:2244600.00  },
  { nome:'Loja 4',    tipo:'comercial',   m2:122.19,             q:0, v:0, preco:1221900.00  },
  { nome:'Loja 5',    tipo:'comercial',   m2:121.67,             q:0, v:0, preco:1216700.00  },
  { nome:'Apto 501',  tipo:'apartamento', m2:83.99,              q:3, s:1, v:2, preco:866707.20  },
  { nome:'Garden 504',tipo:'garden',      m2:59.76, ext:26.27,   q:2, s:1, v:2, preco:857312.00  },
  { nome:'Garden 506',tipo:'garden',      m2:59.76, ext:26.27,   q:2, s:1, v:2, preco:857312.00  },
  { nome:'Apto 701',  tipo:'apartamento', m2:83.99,              q:3, s:1, v:2, preco:894892.80  },
  { nome:'Apto 703',  tipo:'apartamento', m2:83.99,              q:3, s:1, v:2, preco:900764.80  },
  { nome:'Apto 705',  tipo:'apartamento', m2:63.09,              q:2, s:1, v:1, preco:665884.80  },
  { nome:'Apto 801',  tipo:'apartamento', m2:83.99,              q:3, s:1, v:2, preco:903113.60  },
  { nome:'Apto 806',  tipo:'apartamento', m2:59.76,              q:2, s:1, v:1, preco:645920.00  },
  { nome:'Apto 905',  tipo:'apartamento', m2:63.09,              q:2, s:1, v:1, preco:671756.80  },
  { nome:'Apto 1004', tipo:'apartamento', m2:59.76,              q:2, s:1, v:1, preco:657664.00  },
  { nome:'Apto 1005', tipo:'apartamento', m2:63.09,              q:2, s:1, v:1, preco:677628.80  },
  { nome:'Apto 1101', tipo:'apartamento', m2:83.99,              q:3, s:1, v:2, preco:920729.60  },
  { nome:'Apto 1104', tipo:'apartamento', m2:59.76,              q:2, s:1, v:1, preco:663536.00  },
  { nome:'Apto 1106', tipo:'apartamento', m2:59.76,              q:2, s:1, v:1, preco:663536.00  },
  { nome:'Apto 1302', tipo:'apartamento', m2:62.89,              q:2, s:1, v:1, preco:692896.00  },
  { nome:'Apto 1304', tipo:'apartamento', m2:59.76,              q:2, s:1, v:1, preco:675280.00  },
  { nome:'Apto 1305', tipo:'apartamento', m2:63.09,              q:2, s:1, v:1, preco:695244.80  },
  { nome:'Cob 1404',  tipo:'cobertura',   m2:89.79, ext:27.04,   q:2, s:1, v:2, preco:1156784.00 },
  { nome:'Cob 1406',  tipo:'cobertura',   m2:89.79, ext:27.04,   q:2, s:1, v:2, preco:1156784.00 },
  { nome:'Apto 1505', tipo:'apartamento', m2:63.09,              q:2, s:1, v:1, preco:703465.60  },
];
function liFotos(tipo) {
  if (tipo === 'garden')    return LI_GARDEN;
  if (tipo === 'cobertura') return LI_COB;
  if (tipo === 'comercial') return LI_COND.slice(0,1);
  return LI_APT;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CASA GRANDE — 3 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Casa Grande',
        razao_social:'Casa Grande Construtora e Incorporadora', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  // ── 1. ALMA RESIDENCE ────────────────────────────────────────────────────
  console.log('\n▓▓▓ [1/3] ALMA RESIDENCE — Barreiro, BH (pronto)');
  const al = await criarOuBuscar(TOKEN, 'Alma Residence', {
    tipo:'apartamento', status:'pronto',
    descricao:'Alma Residence é um residencial moderno no Barreiro, BH. Piscina com deck, espaço gourmet, salão de festas, academia, espaço kids, coworking e playground. Apartamentos tipo, garden e coberturas. Pronto para morar desde 2025.',
    endereco:'Rua Rodolfo Jacob', bairro:'Barreiro', cidade:'Belo Horizonte', estado:'MG', cep:'30640-080',
    area_min:55.00, area_max:180.00, preco_min:0, preco_max:0,
    quartos_min:2, quartos_max:3, vagas:1, latitude:-19.9750, longitude:-44.0150,
  });
  const alDet = await api(`/empreendimentos/${al.slug ?? al.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((alDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${al.id}/midias/upload-local`, AL_COND, 'foto', TOKEN);
    console.log(`  📸 ${ok}/${AL_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  await api(`/empreendimentos/${al.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 2. ARBO RESIDENCE & MALL ─────────────────────────────────────────────
  console.log('\n▓▓▓ [2/3] ARBO RESIDENCE & MALL — Barreiro, BH');
  const ar = await criarOuBuscar(TOKEN, 'Arbo Residence & Mall', {
    tipo:'apartamento', status:'lancamento',
    descricao:'Arbo Residence & Mall é um empreendimento misto no Barreiro, BH. 3 lojas no térreo para investidores, 7 apartamentos de 3 quartos (70m²) e 3 coberturas (79-92m² + 35-44m² terraço). Piscina, sauna, gourmet, quadra, academia, pet place e salão de festas. Lojas: agosto/2027, Aptos: março/2028.',
    endereco:'Avenida Afonso Vaz de Melo', bairro:'Barreiro', cidade:'Belo Horizonte', estado:'MG', cep:'30640-170',
    area_min:70.85, area_max:227.91, preco_min:544099, preco_max:2370264,
    quartos_min:2, quartos_max:3, vagas:2, latitude:-19.9760, longitude:-44.0170,
  });
  const arMap = await criarUnidades(TOKEN, ar.id, AR_UNIDADES);
  const arDet = await api(`/empreendimentos/${ar.slug ?? ar.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((arDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${ar.id}/midias/upload-local`, AR_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${AR_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of AR_UNIDADES) {
    const unit = arMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    const fl = u.tipo==='comercial' ? AR_COND.slice(0,2)
             : u.tipo==='cobertura' ? AR_APT3
             : u.q === 2 ? AR_APT2 : AR_APT3;
    if (!fl.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${ar.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 3. LISBOA RESIDENCE ──────────────────────────────────────────────────
  console.log('\n▓▓▓ [3/3] LISBOA RESIDENCE — Barreiro, BH');
  const li = await criarOuBuscar(TOKEN, 'Lisboa Residence', {
    tipo:'apartamento', status:'lancamento',
    descricao:'Lisboa Residence é um empreendimento completo no Barreiro, BH. 4 lojas, 18 apartamentos (2 e 3 quartos, 59-83m²), 2 garden e 2 coberturas. Piscina, crossfit, fitness, espaço gourmet, coworking, sala de reunião, sauna, espaço kids, mercado autônomo, lockers, playground e quadra poliesportiva. Entrega: novembro/2027.',
    endereco:'Rua Flávio Marques Lisboa', bairro:'Barreiro', cidade:'Belo Horizonte', estado:'MG', cep:'30641-160',
    area_min:59.76, area_max:224.46, preco_min:645920, preco_max:2244600,
    quartos_min:2, quartos_max:3, vagas:2, latitude:-19.9780, longitude:-44.0130,
  });
  const liMap = await criarUnidades(TOKEN, li.id, LI_UNIDADES);
  const liDet = await api(`/empreendimentos/${li.slug ?? li.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((liDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${li.id}/midias/upload-local`, LI_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${LI_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of LI_UNIDADES) {
    const unit = liMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    const fl = liFotos(u.tipo); if (!fl.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${li.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  console.log('\n✨ CASA GRANDE concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
