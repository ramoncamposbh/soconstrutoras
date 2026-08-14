/**
 * cadastrar-casamirador.js — CASAMIRADOR
 *   1. CATARINA   — Lourdes, BH    (pronto jan/2026)      — sem unidades
 *   2. UNO        — Savassi, BH    (entrega 01/07/2027)   — 10 unidades
 *   3. VIA LÁCTEA — Santa Lúcia, BH (entrega 31/07/2027)  — 12 unidades
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'casamirador@soconstrutoras.com.br';
const SENHA = 'CASAMIRADOR@2026';
const ROOT  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CASAMIRADOR';

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
// 1. CATARINA
// ═══════════════════════════════════════════════════════════════════════════
const CA = p(ROOT, '2026-08-14-CASAMIRADOR CATARINA');
const CA_COND = ex([
  p(CA,'Fachada.jpeg'), p(CA,'CATARINA_2.jpeg'), p(CA,'CATARINA_3.jpeg'),
  p(CA,'catarina_5.jpeg'), p(CA,'catarina_6.jpeg'), p(CA,'catarina_7.jpeg'),
  p(CA,'Cozinha.jpeg'), p(CA,'Estar.jpeg'), p(CA,'Suite.jpeg'),
  p(CA,'Loft_502_-_1_pavimento.jpeg'), p(CA,'Loft_502_-_2_pavimento.jpeg'),
  p(CA,'Terraco.jpeg'), p(CA,'Opcao_Home_Office.jpeg'),
  p(CA,'Loft_duplex_com_pe_direito_duplo.jpeg'),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 2. UNO
// ═══════════════════════════════════════════════════════════════════════════
const UN = p(ROOT, '2026-08-14-CASAMIRADOR UNO');
const UN_COND = ex([
  p(UN,'FINAL_CAM_01.jpeg'), p(UN,'FINAL_CAM_05.jpeg'),
  p(UN,'UNO_T5_CAM03.jpeg'), p(UN,'UNO_T5_CAM04.jpeg'), p(UN,'UNO_T5_CAM05.jpeg'),
  p(UN,'002-05-PREDIO_ESQUINA.jpeg'), p(UN,'002-05-PREDIO_TERREO_CONTORNO.jpeg'),
  p(UN,'002-05-PREDIO_TERREO_ESQUINA.jpeg'), p(UN,'002-05-ROOFTOP_GBA_NOTURNO_2_humanizada.jpeg'),
  p(UN,'LOJAS.jpeg'), p(UN,'IMPLANTACAO.jpeg'),
  p(UN,'002-05-unid_1001_LEO_MIRANDA_e_MARIANA_BELIZARIO_(2).jpeg'),
  p(UN,'002-05-unid_1001_LEO_MIRANDA_e_MARIANA_BELIZARIO_(3).jpeg'),
  p(UN,'002-05-unid_1001_LEO_MIRANDA_e_MARIANA_BELIZARIO_(4).jpeg'),
]);
// Studio photos por unidade
function unStudio(nome) {
  const num = nome.replace(/\D/g, '');
  return ex([
    p(UN, `STUDIO_${num}.jpeg`),
    p(UN, `STUDIO_${parseInt(num)+100}.jpeg`), // fallback viz
  ]);
}
const UN_UNIDADES = [
  // 4 lojas comerciais
  { nome:'Loja 01',    tipo:'comercial',   m2:31.97, q:0, v:0, preco:675127.37  },
  { nome:'Loja 02',    tipo:'comercial',   m2:38.52, q:0, v:0, preco:732102.46  },
  { nome:'Loja 03',    tipo:'comercial',   m2:25.99, q:0, v:0, preco:493960.10  },
  { nome:'Loja 04',    tipo:'comercial',   m2:52.11, q:0, v:0, preco:1100434.38 },
  // 2 garden (área privativa)
  { nome:'Garden 203', tipo:'garden',      m2:53.08, q:1, v:0, preco:907025.28  },
  { nome:'Garden 204', tipo:'garden',      m2:72.56, q:1, v:0, preco:1074628.76 },
  // studios
  { nome:'Studio 304', tipo:'studio',      m2:36.44, q:1, v:0, preco:773370.33  },
  { nome:'Studio 404', tipo:'studio',      m2:36.44, q:1, v:0, preco:777217.95  },
  { nome:'Studio 704', tipo:'studio',      m2:34.13, q:1, v:0, preco:738759.76  },
  { nome:'Studio 1402',tipo:'studio',      m2:37.79, q:1, v:0, preco:885814.84  },
];
function unFotos(u) {
  if (u.tipo === 'comercial') return ex([ p(UN,'LOJAS.jpeg') ]);
  // garden
  if (u.tipo === 'garden') {
    const num = u.nome.replace('Garden ','');
    return ex([ p(UN,`STUDIO_${num}.jpeg`), ...UN_COND.slice(11,14) ]);
  }
  // studio
  const num = u.nome.replace('Studio ','');
  const sp = ex([ p(UN,`STUDIO_${num}.jpeg`) ]);
  return sp.length ? sp : UN_COND.slice(11, 14);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. VIA LÁCTEA
// ═══════════════════════════════════════════════════════════════════════════
const VL = p(ROOT, '2026-08-14-CASAMIRADOR VIA LÁCTEA');
const VL_COND = ex([
  p(VL,'Fachada.jpeg'), p(VL,'Fachada(2).jpeg'),
  p(VL,'CASAMIRADOR-VIA-LACTEA-CENA-DIA-819x1024.jpeg'),
  p(VL,'CASAMIRADOR_VIA_LACTEA_VIA05B.jpeg'),
  p(VL,'vl_01.jpeg'), p(VL,'vl_02.jpeg'), p(VL,'vl_06.jpeg'),
  p(VL,'Espacos_amplos_e_arejados.jpeg'), p(VL,'Ambientes_conjugados.jpeg'),
  p(VL,'Pe_direito_duplo.jpeg'),
]);
const VL_UNIT_FOTOS = ex([
  p(VL,'Sala.jpeg'), p(VL,'Cozinha.jpeg'), p(VL,'Suite.jpeg'),
  p(VL,'Suite(2).jpeg'), p(VL,'Suite(3).jpeg'),
]);
const VL_LOJA_FOTOS = ex([
  p(VL,'PLANTAS_DAS_LOJAS.jpeg'), p(VL,'Fachada.jpeg'),
]);
const VL_DUPLEX_PLANTA = ex([
  p(VL,'LOFTS_DE_FINAL_01_-_PLANTA_TERREO.jpeg'),
  p(VL,'LOFTS_DE_FINAL_01_-_PLANTA_MEZANINO.jpeg'),
  p(VL,'LOFTS_DE_FINAL_02_-_PLANTA_TERREO.jpeg'),
  p(VL,'LOFTS_DE_FINAL_02_-_PLANTA_MEZANINO.jpeg'),
]);
const VL_UNIDADES = [
  // Lojas ground floor
  { nome:'Loja 001',    tipo:'comercial', m2:128.92,            q:0, v:0, preco:1992249.49 },
  { nome:'Loja 002',    tipo:'comercial', m2:128.16,            q:0, v:0, preco:1980504.92 },
  { nome:'Loja 003',    tipo:'comercial', m2:46.51,             q:0, v:0, preco:718736.61  },
  // Duplex ground floor (lofts residenciais)
  { nome:'Duplex 01',   tipo:'duplex',    m2:126.35, ext:3.12,  q:2, s:1, v:0, preco:2196268.42 },
  { nome:'Duplex 02',   tipo:'duplex',    m2:160.85, ext:5.85,  q:2, s:2, v:0, preco:2812085.54 },
  // Casa térrea
  { nome:'Casa 04',     tipo:'duplex',    m2:168.17, ext:309.13,q:3, s:2, v:1, preco:3302240.93 },
  // Duplex residenciais (andares)
  { nome:'Duplex 401',  tipo:'duplex',    m2:80.72,  ext:13.24, q:2, s:1, v:1, preco:1456738.43 },
  { nome:'Duplex 402',  tipo:'duplex',    m2:77.88,  ext:13.24, q:1, s:1, v:1, preco:1411065.12 },
  { nome:'Duplex 601',  tipo:'duplex',    m2:80.72,  ext:13.24, q:2, s:1, v:1, preco:1485873.20 },
  { nome:'Duplex 801',  tipo:'duplex',    m2:80.72,  ext:13.24, q:2, s:1, v:1, preco:1515007.97 },
  { nome:'Duplex 1002', tipo:'duplex',    m2:77.88,  ext:13.24, q:1, s:1, v:1, preco:1495729.02 },
  // Apto cobertura
  { nome:'Apto 1103',   tipo:'apartamento',m2:74.99,            q:1, s:1, v:0, preco:1311602.02 },
];
function vlFotos(tipo) {
  if (tipo === 'comercial') return VL_LOJA_FOTOS;
  return VL_UNIT_FOTOS;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CASAMIRADOR — 3 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Casamirador',
        razao_social:'Casamirador Empreendimentos Imobiliários', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  // ── 1. CATARINA ──────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [1/3] CASAMIRADOR CATARINA — Lourdes, BH (pronto)');
  const ca = await criarOuBuscar(TOKEN, 'Casamirador Catarina', {
    tipo:'apartamento', status:'pronto',
    descricao:'Casamirador Catarina é um empreendimento exclusivo no bairro Lourdes, BH. Lofts duplex com pé-direito duplo, terraço privativo e acabamento de alto padrão. Localização privilegiada a poucos passos da Savassi. Pronto para morar desde janeiro/2026.',
    endereco:'Rua Santa Catarina', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30170-080',
    area_min:60.00, area_max:120.00,
    quartos_min:1, quartos_max:2, vagas:1, latitude:-19.9350, longitude:-43.9320,
  });
  const caDet = await api(`/empreendimentos/${ca.slug ?? ca.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((caDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${ca.id}/midias/upload-local`, CA_COND, 'foto', TOKEN);
    console.log(`  📸 ${ok}/${CA_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  await api(`/empreendimentos/${ca.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 2. UNO ───────────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [2/3] CASAMIRADOR UNO — Savassi, BH');
  const un = await criarOuBuscar(TOKEN, 'Casamirador Uno', {
    tipo:'apartamento', status:'lancamento',
    descricao:'Casamirador Uno é um empreendimento inovador na Rua Piauí, Savassi, BH. Studios de 25 a 72m², garden duplex e 4 lojas no térreo. Rooftop com vista panorâmica, localização na melhor área da Savassi. Entrega: julho/2027.',
    endereco:'Rua Piauí, 2020', bairro:'Savassi', cidade:'Belo Horizonte', estado:'MG', cep:'30150-320',
    area_min:25.99, area_max:72.56, preco_min:493960, preco_max:1100434,
    quartos_min:1, quartos_max:1, vagas:0, latitude:-19.9340, longitude:-43.9310,
  });
  const unMap = await criarUnidades(TOKEN, un.id, UN_UNIDADES);
  const unDet = await api(`/empreendimentos/${un.slug ?? un.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((unDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${un.id}/midias/upload-local`, UN_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${UN_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of UN_UNIDADES) {
    const unit = unMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    const fl = unFotos(u); if (!fl.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${un.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 3. VIA LÁCTEA ────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [3/3] VIA LÁCTEA — Santa Lúcia, BH');
  const vl = await criarOuBuscar(TOKEN, 'Casamirador Via Láctea', {
    tipo:'apartamento', status:'lancamento',
    descricao:'Casamirador Via Láctea é um empreendimento único em Santa Lúcia, BH. 3 lojas, 2 lofts duplex (126-160m²), 1 casa exclusiva (168+309m²), 5 duplex residenciais (77-80m²) e 1 apartamento de alto padrão. Pé-direito duplo, ambientes amplos e arejados. Entrega: julho/2027.',
    endereco:'Rua Tatuhí', bairro:'Santa Lúcia', cidade:'Belo Horizonte', estado:'MG', cep:'30360-490',
    area_min:46.51, area_max:477.30, preco_min:718736, preco_max:3302240,
    quartos_min:1, quartos_max:3, vagas:1, latitude:-19.9610, longitude:-43.9420,
  });
  const vlMap = await criarUnidades(TOKEN, vl.id, VL_UNIDADES);
  const vlDet = await api(`/empreendimentos/${vl.slug ?? vl.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((vlDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${vl.id}/midias/upload-local`, VL_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${VL_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of VL_UNIDADES) {
    const unit = vlMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    const fl = vlFotos(u.tipo); if (!fl.length) continue;
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN)} ✅`);
    // plantas para duplex
    if (u.tipo === 'duplex' && VL_DUPLEX_PLANTA.length > 0) {
      const nm = u.nome.split(' ')[1];
      const plantaFils = nm === '01' ? VL_DUPLEX_PLANTA.slice(0,2)
                       : nm === '02' ? VL_DUPLEX_PLANTA.slice(2,4)
                       : VL_DUPLEX_PLANTA.slice(0,2);
      for (const f of plantaFils) await uploadFoto(`/unidades/${unit.id}/midias/upload-local`, f, 'planta', TOKEN);
    }
  }
  await api(`/empreendimentos/${vl.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  console.log('\n✨ CASAMIRADOR concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
