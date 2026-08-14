/**
 * cadastrar-canopus.js — CANOPUS
 *   1. Cidade Jardim Flat  — Cidade Jardim, BH (pronto 2022)    — 1 unidade
 *   2. History             — Funcionários, BH  (pronto)         — sem unidades
 *   3. History Corporate   — Funcionários, BH  (entregue 2024)  — 3 salas comerciais
 *   4. Infinity Art Res.   — Santo Antônio, BH (pronto 2021)    — sem unidades
 *   5. PERFETTO            — Prado, BH         (pronto 2017)    — 1 unidade
 *   6. The Place           — Santo Agostinho, BH (entrega 08/27) — 8 unidades
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'canopus@soconstrutoras.com.br';
const SENHA = 'CANOPUS@2026';
const ROOT  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CANOPUS';

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
async function uploadAndPublish(TOKEN, empId, fotos, empSlug) {
  const det = await api(`/empreendimentos/${empSlug ?? empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${empId}/midias/upload-local`, fotos, 'foto', TOKEN);
    console.log(`  📸 ${ok}/${fotos.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  await api(`/empreendimentos/${empId}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CIDADE JARDIM FLAT
// ═══════════════════════════════════════════════════════════════════════════
const CJF = p(ROOT, '2026-08-14-CIDADE JARDIM FLAT');
// flat com fotos WhatsApp — usar todas
const CJF_ALL = (() => {
  try {
    return require('fs').readdirSync(CJF)
      .filter(f => /\.(jpe?g|png)$/i.test(f))
      .map(f => p(CJF, f));
  } catch { return []; }
})();

// ═══════════════════════════════════════════════════════════════════════════
// 2. HISTORY
// ═══════════════════════════════════════════════════════════════════════════
const HI = p(ROOT, '2026-08-14-History');
const HI_COND = ex([
  p(HI,'Pilotis.jpeg'), p(HI,'Terreo.jpeg'),
  p(HI,'Apartamento_tipo_2_suites_-_6_ao_14_pavimento.jpeg'),
  p(HI,'Apartamento_tipo_2_suites_-_15_ao_22_pavimento.jpeg'),
  p(HI,'Apartamento_tipo_2_suites_-_6_ao_22_pavimento.jpeg'),
  p(HI,'Apartamento_tipo_3_suites_-_23_ao_32_pavimento.jpeg'),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 3. HISTORY CORPORATE
// ═══════════════════════════════════════════════════════════════════════════
const HC = p(ROOT, '2026-08-14-History Corporate');
const HC_COND = ex([
  p(HC,'Fachada.jpeg'), p(HC,'Fachada_corporativo.jpeg'),
  p(HC,'Hall_de_entrada.jpeg'), p(HC,'Hall_de_entrada(2).jpeg'), p(HC,'Hall_de_entrada(3).jpeg'),
  p(HC,'Hall_de_entrada(4).jpeg'), p(HC,'Hall_de_entrada(5).jpeg'),
  p(HC,'Elevadores.jpeg'), p(HC,'Elevadores(2).jpeg'),
  p(HC,'Terreo.jpeg'), p(HC,'Vista.jpeg'), p(HC,'Vista_para_igreja_boa_viagem.jpeg'),
  p(HC,'Banheiros_comuns.jpeg'),
]);
const HC_SALA = ex([
  p(HC,'Andar_corrido.jpeg'), p(HC,'Andar_corrido(2).jpeg'),
  p(HC,'Planta_tipo_2_ao_3_andar.jpeg'), p(HC,'Planta_tipo_5_andar.jpeg'),
  p(HC,'Planta_tipo_6_ao_10_andar.jpeg'), p(HC,'Planta_tipo_11_andar.jpeg'),
]);
const HC_UNIDADES = [
  { nome:'Sala 200', tipo:'comercial', m2:583.00, q:0, v:11, preco:11557483.30 },
  { nome:'Sala 300', tipo:'comercial', m2:583.00, q:0, v:11, preco:11688306.25 },
  { nome:'Sala 900', tipo:'comercial', m2:684.00, q:0, v:11, preco:14466806.53 },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. INFINITY ART RESIDENCES
// ═══════════════════════════════════════════════════════════════════════════
const INF = p(ROOT, '2026-08-14-Infinity Art Residences');
const INF_COND = ex([
  p(INF,'Academia.jpeg'), p(INF,'Area_Gourmet.jpeg'),
  p(INF,'Espaco_Gourmet_1_d61903b460.jpeg'), p(INF,'Espaco_Gourmet_2_510956f397.jpeg'),
  p(INF,'Espaco_Zen_b48e799358.jpeg'), p(INF,'Lounge_Festas_1535d4c0a9.jpeg'),
  p(INF,'Piscina.jpeg'), p(INF,'Piscina_984c6276d4.jpeg'),
  p(INF,'img69.jpeg'), p(INF,'img78.jpeg'), p(INF,'img83.jpeg'), p(INF,'img85.jpeg'),
  p(INF,'img87.jpeg'), p(INF,'img89.jpeg'), p(INF,'img96.jpeg'), p(INF,'img98.jpeg'),
  p(INF,'img100.jpeg'), p(INF,'img105.jpeg'),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 5. PERFETTO
// ═══════════════════════════════════════════════════════════════════════════
const PF = p(ROOT, '2026-08-14-PERFETTO');
const PF_COND = ex([
  p(PF,'FACHADA.jpeg'), p(PF,'Academia.jpeg'), p(PF,'Acesso.jpeg'), p(PF,'Bangalo.jpeg'),
  p(PF,'Brinquedoteca.jpeg'), p(PF,'Espaco_descanso.jpeg'), p(PF,'Hall_acesso.jpeg'),
  p(PF,'Lobby_de_Acesso.jpeg'), p(PF,'Localizacao.jpeg'), p(PF,'Piscina_com_raia.jpeg'),
  p(PF,'Playground_infantil_externo.jpeg'), p(PF,'Quadra_Poliesportiva.jpeg'),
  p(PF,'Redario.jpeg'), p(PF,'Salao_de_Festa.jpeg'), p(PF,'Salao_de_Festa(2).jpeg'),
]);
const PF_APT = ex([
  p(PF,'WhatsApp_Image_2026-03-15_at_140753.jpeg'),
  p(PF,'WhatsApp_Image_2026-03-15_at_140753_(1).jpeg'),
  p(PF,'WhatsApp_Image_2026-03-15_at_140753_(2).jpeg'),
  p(PF,'WhatsApp_Image_2026-03-15_at_140754.jpeg'),
  p(PF,'WhatsApp_Image_2026-03-15_at_140754_(1).jpeg'),
  p(PF,'WhatsApp_Image_2026-03-15_at_140845.jpeg'),
  p(PF,'WhatsApp_Image_2026-03-15_at_141021.jpeg'),
]);
const PF_PLANTA = ex([ p(PF,'PLANTA_DA_UNIDADE_203_TORRE_2.jpeg') ]);
const PF_UNIDADES = [
  { nome:'Apto 203', tipo:'apartamento', m2:75.00, ext:23.00, q:3, s:1, v:2, preco:965000.00 },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6. THE PLACE
// ═══════════════════════════════════════════════════════════════════════════
const TP = p(ROOT, '2026-08-14-The Place');
const TP_COND = ex([
  p(TP,'Perspectiva_da_fachada.jpeg'), p(TP,'Perspectiva_da_fachada(2).jpeg'),
  p(TP,'Perspectiva_da_fachada(3).jpeg'), p(TP,'Pilotis.jpeg'), p(TP,'Terreo.jpeg'),
  p(TP,'Entrada.jpeg'), p(TP,'Hall_social.jpeg'), p(TP,'Espaco_gourmet.jpeg'),
  p(TP,'Grill_gourmet_externo.jpeg'), p(TP,'Salao_de_festas.jpeg'),
  p(TP,'Terraco_do_salao_de_festas.jpeg'), p(TP,'Piscina_com_deck_molhado.jpeg'),
  p(TP,'Academia_externa.jpeg'), p(TP,'Fitness.jpeg'), p(TP,'Espaco_kids_interno.jpeg'),
  p(TP,'Espaco_massagem.jpeg'), p(TP,'Playground.jpeg'), p(TP,'Lockers_para_delivery.jpeg'),
  p(TP,'Mercado_autonomo.jpeg'), p(TP,'Garagem_-_2_pavimento.jpeg'), p(TP,'Area_de_lazer.jpeg'),
]);
const TP_APT = ex([
  p(TP,'Apartamento_4_quartos_-_final_01.jpeg'), p(TP,'Apartamento_4_quartos_-_final_01(2).jpeg'),
  p(TP,'Apartamento_3_suites_c_closet_ampliado_-_final_01.jpeg'),
  p(TP,'Apartamento_3_suites_c_sala_ampliada_-_final_01.jpeg'),
  p(TP,'Apto_4_quartos_-_cozinha.jpeg'), p(TP,'Apto_4_quartos_-_sala_de_estar.jpeg'),
  p(TP,'Suite_master.jpeg'), p(TP,'Suite_master(2).jpeg'), p(TP,'Pavimento_tipo.jpeg'),
]);
const TP_UNIDADES = [
  { nome:'Apto 602',  tipo:'apartamento', m2:143.10, q:4, s:2, v:2, preco:2995455.62 },
  { nome:'Apto 1001', tipo:'apartamento', m2:142.80, q:4, s:2, v:2, preco:3111334.18 },
  { nome:'Apto 1702', tipo:'apartamento', m2:143.10, q:4, s:2, v:2, preco:3270508.08 },
  { nome:'Apto 1901', tipo:'apartamento', m2:142.80, q:4, s:2, v:2, preco:3453672.10 },
  { nome:'Apto 2102', tipo:'apartamento', m2:143.10, q:4, s:2, v:2, preco:3540113.17 },
  { nome:'Apto 2201', tipo:'apartamento', m2:142.80, q:4, s:2, v:2, preco:3590126.49 },
  { nome:'Apto 2301', tipo:'apartamento', m2:142.80, q:4, s:2, v:2, preco:3636798.71 },
  { nome:'Apto 2302', tipo:'apartamento', m2:143.10, q:4, s:2, v:2, preco:3625582.61 },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CANOPUS — 6 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Canopus',
        razao_social:'Canopus Incorporações e Construções', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  // ── 1. CIDADE JARDIM FLAT ────────────────────────────────────────────────
  console.log('\n▓▓▓ [1/6] CIDADE JARDIM FLAT — Cidade Jardim, BH');
  const cjf = await criarOuBuscar(TOKEN, 'Cidade Jardim Flat', {
    tipo:'apartamento', status:'pronto',
    descricao:'Cidade Jardim Flat: residencial flat pronto para morar em localização privilegiada. Studios com acabamento de alto padrão, spa e área de convivência. Ideal para investimento e moradia.',
    endereco:'Rua Professor Antônio Aleixo', bairro:'Cidade Jardim', cidade:'Belo Horizonte', estado:'MG', cep:'30380-260',
    area_min:40.00, area_max:40.00, preco_min:460000, preco_max:460000,
    quartos_min:1, quartos_max:1, vagas:1, latitude:-19.9600, longitude:-43.9630,
  });
  const cjfUnidades = [
    { nome:'Flat tipo', tipo:'studio', m2:40.00, q:1, s:0, v:1, preco:460000.00 },
  ];
  const cjfMap = await criarUnidades(TOKEN, cjf.id, cjfUnidades);
  await uploadAndPublish(TOKEN, cjf.id, CJF_ALL.slice(0, 20), cjf.slug ?? cjf.id);

  // ── 2. HISTORY ───────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [2/6] HISTORY — Funcionários, BH (pronto)');
  const hi = await criarOuBuscar(TOKEN, 'History', {
    tipo:'apartamento', status:'pronto',
    descricao:'History é um empreendimento residencial entregue no bairro Funcionários, BH. Torres com apartamentos de 2 e 3 suítes do 6º ao 32º pavimento, piscina no pilotis e terraço. Alto padrão Canopus.',
    endereco:'Rua Alagoas', bairro:'Funcionários', cidade:'Belo Horizonte', estado:'MG', cep:'30130-160',
    area_min:80.00, area_max:180.00, preco_min:0, preco_max:0,
    quartos_min:2, quartos_max:3, vagas:2, latitude:-19.9310, longitude:-43.9400,
  });
  await uploadAndPublish(TOKEN, hi.id, HI_COND, hi.slug ?? hi.id);

  // ── 3. HISTORY CORPORATE ─────────────────────────────────────────────────
  console.log('\n▓▓▓ [3/6] HISTORY CORPORATE — Funcionários, BH (salas comerciais)');
  const hc = await criarOuBuscar(TOKEN, 'History Corporate', {
    tipo:'comercial', status:'pronto',
    descricao:'History Corporate é uma torre corporativa exclusiva em Funcionários, BH. Andares corridos de 460 a 1.031 m², com pé-direito triplo no hall, fachada em pele de vidro, controle de acesso com catracas e elevadores de alta velocidade. Praça Memorial com 2.700 m² de área de convivência.',
    endereco:'Rua Alagoas, 135', bairro:'Funcionários', cidade:'Belo Horizonte', estado:'MG', cep:'30130-168',
    area_min:583.00, area_max:684.00, preco_min:11557483, preco_max:14466806,
    quartos_min:0, quartos_max:0, vagas:11, latitude:-19.9300, longitude:-43.9410,
  });
  const hcMap = await criarUnidades(TOKEN, hc.id, HC_UNIDADES);
  const hcDet = await api(`/empreendimentos/${hc.slug ?? hc.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((hcDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${hc.id}/midias/upload-local`, HC_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${HC_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of HC_UNIDADES) {
    const unit = hcMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, HC_SALA, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${hc.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 4. INFINITY ART RESIDENCES ───────────────────────────────────────────
  console.log('\n▓▓▓ [4/6] INFINITY ART RESIDENCES — Santo Antônio, BH (pronto)');
  const inf = await criarOuBuscar(TOKEN, 'Infinity Art Residences', {
    tipo:'apartamento', status:'pronto',
    descricao:'Infinity Art Residences é um empreendimento de alto padrão em Santo Antônio, BH. Ampla área de lazer com academia, piscina, espaço gourmet, espaço zen e lounge festas. Design contemporâneo e localização privilegiada. Pronto para morar.',
    endereco:'Rua São Domingos do Prata', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30350-040',
    area_min:80.00, area_max:200.00, preco_min:0, preco_max:0,
    quartos_min:2, quartos_max:3, vagas:2, latitude:-19.9570, longitude:-43.9460,
  });
  await uploadAndPublish(TOKEN, inf.id, INF_COND, inf.slug ?? inf.id);

  // ── 5. PERFETTO ──────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [5/6] PERFETTO — Prado, BH (pronto)');
  const pf = await criarOuBuscar(TOKEN, 'PERFETTO', {
    tipo:'apartamento', status:'pronto',
    descricao:'PERFETTO é um condomínio pronto no Prado, BH. Apartamento tipo (75m² + 23m² varanda) com 3 quartos, 2 vagas. Academia, brinquedoteca, piscina com raia, bangalô, redário, quadra poliesportiva e salão de festas. Imóvel pronto para morar.',
    endereco:'Rua dos Pampas', bairro:'Prado', cidade:'Belo Horizonte', estado:'MG', cep:'30410-080',
    area_min:75.00, area_max:98.00, preco_min:965000, preco_max:965000,
    quartos_min:3, quartos_max:3, vagas:2, latitude:-19.9490, longitude:-43.9720,
  });
  const pfMap = await criarUnidades(TOKEN, pf.id, PF_UNIDADES);
  const pfDet = await api(`/empreendimentos/${pf.slug ?? pf.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((pfDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${pf.id}/midias/upload-local`, PF_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${PF_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of PF_UNIDADES) {
    const unit = pfMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    process.stdout.write(`  ${u.nome}... `);
    const ok = await upLista(`/unidades/${unit.id}/midias/upload-local`, PF_APT, 'foto', TOKEN);
    console.log(`${ok} ✅`);
    // planta
    for (const f of PF_PLANTA) await uploadFoto(`/unidades/${unit.id}/midias/upload-local`, f, 'planta', TOKEN);
  }
  await api(`/empreendimentos/${pf.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  // ── 6. THE PLACE ─────────────────────────────────────────────────────────
  console.log('\n▓▓▓ [6/6] THE PLACE — Santo Agostinho, BH');
  const tp = await criarOuBuscar(TOKEN, 'The Place', {
    tipo:'apartamento', status:'lancamento',
    descricao:'The Place Santo Agostinho: 38 unidades residenciais de 4 quartos (142-143m²) com 2 suítes e 2 semissuítes no coração do Santo Agostinho, BH. Piscina com deck molhado, academia interna e externa, espaço gourmet, churrasqueira, salão de festas, brinquedoteca, sala de massagem, playground e mini market. Entrega: agosto/2027.',
    endereco:'Rua Alvarenga Peixoto, 1240', bairro:'Santo Agostinho', cidade:'Belo Horizonte', estado:'MG', cep:'30180-120',
    area_min:142.80, area_max:143.10, preco_min:2995455, preco_max:3636798,
    quartos_min:4, quartos_max:4, vagas:2, latitude:-19.9410, longitude:-43.9410,
  });
  const tpMap = await criarUnidades(TOKEN, tp.id, TP_UNIDADES);
  const tpDet = await api(`/empreendimentos/${tp.slug ?? tp.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((tpDet.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${tp.id}/midias/upload-local`, TP_COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${TP_COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }
  for (const u of TP_UNIDADES) {
    const unit = tpMap[u.nome]; if (!unit?.id) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ ${u.nome}`); continue; }
    process.stdout.write(`  ${u.nome}... `);
    console.log(`${await upLista(`/unidades/${unit.id}/midias/upload-local`, TP_APT, 'foto', TOKEN)} ✅`);
  }
  await api(`/empreendimentos/${tp.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('  🚀 Publicado');

  console.log('\n✨ CANOPUS concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
