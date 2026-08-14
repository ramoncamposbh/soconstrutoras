/**
 * cadastrar-botelho.js — BOTELHO
 *   Hermes Residence — Estoril, BH  (entrega 31/12/2027) — 19 unidades
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'botelho@soconstrutoras.com.br';
const SENHA = 'BOTELHO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\BOTELHO\\2026-08-14-Hermes Residence';

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

// ── FOTOS DO EMPREENDIMENTO ───────────────────────────────────────────────
const COND = ex([
  p(BASE,'BOTELHO_04_IMG_FACHADA_01A_V06.jpeg'), p(BASE,'Pilotis.jpeg'),
  p(BASE,'Perspectiva_aerea.jpeg'), p(BASE,'Coworking.jpeg'),
  p(BASE,'Espaco_gourmet.jpeg'), p(BASE,'Terraco_do_gourmet.jpeg'),
  p(BASE,'Fitness.jpeg'), p(BASE,'Garagem_-_1_subsolo.jpeg'),
  p(BASE,'Garagem_-_2_subsolo.jpeg'), p(BASE,'Hall_de_entrada.jpeg'),
  p(BASE,'Lavanderia_OMO.jpeg'), p(BASE,'Pavimento_tipo.jpeg'),
]);
const APT = ex([
  p(BASE,'Apartamento_tipo_-_final_01.jpeg'), p(BASE,'Apartamento_tipo_-_final_02.jpeg'),
  p(BASE,'Apartamento_tipo_-_final_03.jpeg'), p(BASE,'Apartamento_tipo_-_final_04.jpeg'),
  p(BASE,'Apartamento_tipo_-_final_05.jpeg'), p(BASE,'Apartamento_tipo_-_final_06.jpeg'),
  p(BASE,'Apartamento_tipo_-_final_07.jpeg'), p(BASE,'Suite_master.jpeg'),
]);
const GARDEN = ex([
  p(BASE,'Garden_-_202.jpeg'), p(BASE,'Garden_202.jpeg'),
  p(BASE,'Garden_202(2).jpeg'), p(BASE,'Garden_202(3).jpeg'), p(BASE,'Garden_202(4).jpeg'),
]);
const TERRACE = ex([
  p(BASE,'Terrazzo_-_302.jpeg'), p(BASE,'Terrazzo_302.jpeg'),
  p(BASE,'Apartamento_tipo_-_final_01.jpeg'),
]);
const COB = ex([
  p(BASE,'Cobertura.jpeg'), p(BASE,'Sala_de_estar_-_cobertura.jpeg'),
  p(BASE,'Sala_de_estar_-_cobertura(2).jpeg'), p(BASE,'Terraco_-_cobertura.jpeg'),
  p(BASE,'Terraco_-_cobertura(2).jpeg'), p(BASE,'Suite_master.jpeg'),
]);
const LOJA = ex([ p(BASE,'Pilotis.jpeg'), p(BASE,'BOTELHO_04_IMG_FACHADA_01A_V06.jpeg') ]);

// ── UNIDADES ──────────────────────────────────────────────────────────────
const UNIDADES = [
  { nome:'Loja 01',    tipo:'comercial',   m2:203.59,            q:0, v:0, preco:2524516.00 },
  { nome:'Apto 201',   tipo:'apartamento', m2:45.67,             q:1, v:1, preco:707885.00  },
  { nome:'Garden 202', tipo:'garden',      m2:77.30,  ext:74.27, q:2, v:2, preco:1543505.50 },
  { nome:'Apto 204',   tipo:'apartamento', m2:31.07,             q:1, v:1, preco:529743.50  },
  { nome:'Apto 206',   tipo:'apartamento', m2:45.67,             q:1, v:1, preco:707885.00  },
  { nome:'Garden 207', tipo:'garden',      m2:63.91,  ext:35.98, q:2, v:2, preco:1157912.00 },
  { nome:'Apto 301',   tipo:'apartamento', m2:45.67,             q:1, v:1, preco:714963.85  },
  { nome:'Garden 302', tipo:'garden',      m2:38.35,  ext:40.07, q:1, v:1, preco:842364.24  },
  { nome:'Apto 304',   tipo:'apartamento', m2:31.07,             q:1, v:0, preco:534559.35  },
  { nome:'Garden 307', tipo:'garden',      m2:37.76,  ext:28.94, q:1, v:2, preco:780855.75  },
  { nome:'Apto 401',   tipo:'apartamento', m2:45.67,             q:1, v:2, preco:722042.70  },
  { nome:'Apto 406',   tipo:'apartamento', m2:45.67,             q:1, v:1, preco:722042.70  },
  { nome:'Apto 601',   tipo:'apartamento', m2:45.67,             q:1, v:2, preco:736200.40  },
  { nome:'Apto 602',   tipo:'apartamento', m2:43.26,             q:1, v:1, preco:697351.20  },
  { nome:'Apto 604',   tipo:'apartamento', m2:31.07,             q:1, v:1, preco:549006.90  },
  { nome:'Apto 606',   tipo:'apartamento', m2:45.67,             q:1, v:1, preco:736200.40  },
  { nome:'Apto 704',   tipo:'apartamento', m2:31.07,             q:1, v:2, preco:553822.75  },
  { nome:'Apto 706',   tipo:'apartamento', m2:45.67,             q:1, v:1, preco:743279.25  },
  { nome:'Cob 801',    tipo:'cobertura',   m2:65.58,  ext:63.22, q:2, v:2, preco:1596831.70 },
];

function fotos(tipo) {
  if (tipo === 'garden')    return GARDEN;
  if (tipo === 'cobertura') return COB;
  if (tipo === 'comercial') return LOJA;
  return APT;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BOTELHO — Hermes Residence');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Botelho',
        razao_social:'Botelho Incorporadora e Construtora', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  const emp = await criarOuBuscar(TOKEN, 'Hermes Residence', {
    tipo:'apartamento', status:'lancamento',
    descricao:'O Hermes Residence é um empreendimento exclusivo no Estoril, BH. Studios, lofts com terraço, garden duplex, apartamentos tipo e cobertura com terraço privativo. Coworking, espaço gourmet, fitness, lavanderia e garagem com 2 subsolos. Entrega: dezembro/2027.',
    endereco:'Rua Senador Lima Guimarães', bairro:'Estoril', cidade:'Belo Horizonte', estado:'MG', cep:'30494-060',
    area_min:31.07, area_max:203.59, preco_min:529743, preco_max:2524516,
    quartos_min:1, quartos_max:2, vagas:2, latitude:-19.9490, longitude:-43.9700,
  });

  console.log('  Unidades...');
  const uMap = await criarUnidades(TOKEN, emp.id, UNIDADES);

  // Fotos empreendimento
  const det = await api(`/empreendimentos/${emp.slug ?? emp.id}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length === 0) {
    const ok = await upLista(`/empreendimentos/${emp.id}/midias/upload-local`, COND, 'foto', TOKEN);
    console.log(`  📸 Cond: ${ok}/${COND.length}`);
  } else { console.log('  ✓ fotos já existem'); }

  // Fotos unidades
  for (const u of UNIDADES) {
    const unit = uMap[u.nome]; if (!unit?.id) continue;
    const fl = fotos(u.tipo); if (!fl.length) continue;
    if ((unit.midias ?? []).length > 0) { console.log(`  ✓ fotos ${u.nome}`); continue; }
    process.stdout.write(`  ${u.nome}... `);
    const ok = await upLista(`/unidades/${unit.id}/midias/upload-local`, fl, 'foto', TOKEN);
    console.log(`${ok} ✅`);
  }

  await api(`/empreendimentos/${emp.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  console.log('\n  🚀 Publicado\n✨ BOTELHO concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
