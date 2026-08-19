/**
 * cadastrar-janeiro.js — JANEIRO Engenharia (4 empreendimentos)
 *   Carbon by Janeiro — Lourdes, BH  (4 studios disponíveis)
 *   Jade              — Lourdes, BH  (sem unidades)
 *   Jardins 156       — Lourdes, BH  (múltiplas unidades disponíveis)
 *   One View Luxemburgo — Luxemburgo, BH (sem unidades)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'janeiro@soconstrutoras.com.br';
const SENHA = 'JANEIRO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\JANEIRO';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}
async function uploadFoto(ep, file, tipo, TOKEN) {
  if (!fs.existsSync(file)) return null;
  const ext = path.extname(file).slice(1).toLowerCase().replace('jpg','jpeg');
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], { type: mime }), path.basename(file));
  form.append('tipo', tipo);
  const res = await fetch(`${API}${ep}`, { method:'POST', headers:{Authorization:`Bearer ${TOKEN}`}, body:form });
  return res.status === 201 ? res.json() : null;
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
  console.log(`  ✅ ${nome} criado`); return res.data;
}
async function criarUnidades(TOKEN, EMP_ID, unidades) {
  if (!unidades.length) return;
  const ur = await api(`/unidades/empreendimentos/${EMP_ID}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  const mp = {}; for (const u of (Array.isArray(ur.data) ? ur.data : [])) mp[u.nome] = u;
  for (const u of unidades) {
    if (mp[u.nome]) { console.log(`    ✓ ${u.nome}`); continue; }
    const res = await api(`/unidades/empreendimentos/${EMP_ID}`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
      body: JSON.stringify({ nome:u.nome, tipo:u.tipo,
        metragem_privativa:u.m2, metragem_total: u.ext ? u.m2+u.ext : undefined,
        quartos:u.q, vagas:u.v, preco:u.preco, disponivel:true }),
    });
    if (res.data?.id) { mp[u.nome] = res.data; console.log(`    ✅ ${u.nome}`); }
    else console.log(`    ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
    await sleep(300);
  }
}
async function uploadImagens(TOKEN, empId, dir, facade) {
  const det = await api(`/empreendimentos/${empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  if (!fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
  const all = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|jpg)$/i.test(f));
  const plantas = all.filter(f => f.toLowerCase().includes('planta'));
  const fotos   = all.filter(f => !f.toLowerCase().includes('planta'));
  const ordered = facade ? [facade, ...fotos.filter(f => f !== facade)] : fotos;
  let ok = 0;
  for (const f of ordered) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir,f), 'foto', TOKEN)) ok++;
    await sleep(400);
  }
  for (const f of plantas) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir,f), 'planta', TOKEN)) ok++;
    await sleep(400);
  }
  console.log(`  📸 ${ok}/${all.length}`);
}
async function publicar(TOKEN, empId) {
  const r = await api(`/empreendimentos/${empId}/publicar`, {
    method:'POST', headers:{Authorization:`Bearer ${TOKEN}`},
  });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome: 'Carbon by Janeiro',
    dir:  path.join(BASE, '2026-08-18-Carbon by Janeiro'),
    facade: 'carbon_fachada_noturna.jpeg',
    body: {
      tipo:'studio', status:'lancamento',
      descricao:'Carbon by Janeiro na Rua dos Guajajaras, Lourdes, Belo Horizonte. Studios de 29m² com lazer no rooftop, piscina, fitness, sports bar, minimarket, coworking e pet place. Sofisticação e valorização no Lourdes.',
      endereco:'Rua dos Guajajaras', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30112-020',
      area_min:29.55, area_max:29.55, preco_min:591814, preco_max:654543, quartos_min:1, quartos_max:1, vagas:0,
    },
    unidades:[
      { nome:'Studio 806',  tipo:'studio', m2:29.55, q:1, v:0, preco:591814 },
      { nome:'Studio 812',  tipo:'studio', m2:29.55, q:1, v:0, preco:595368 },
      { nome:'Studio 1107', tipo:'studio', m2:29.55, q:1, v:0, preco:615809 },
      { nome:'Studio 1707', tipo:'studio', m2:29.55, q:1, v:0, preco:654543 },
    ],
  },
  {
    nome: 'Jade',
    dir:  path.join(BASE, '2026-08-18-Jade'),
    facade: 'Fachada.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Jade no Lourdes, Belo Horizonte. Apartamentos de 1 a 3 quartos com 59 a 88m². Lazer no rooftop, piscina, fitness, market e espaços de conveniência. Um dos endereços mais desejados de BH, próximo ao Diamond Mall.',
      endereco:'Rua Curitiba', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30170-120',
      area_min:59, area_max:88, preco_min:null, preco_max:null, quartos_min:1, quartos_max:3, vagas:2,
    },
    unidades:[],
  },
  {
    nome: 'Jardins 156',
    dir:  path.join(BASE, '2026-08-18-Jardins 156'),
    facade: 'Entrada.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Jardins 156 na Rua Curitiba, Lourdes, Belo Horizonte. Complexo com apartamentos, casas e unidades terrace de 62 a 175m², 1 a 3 quartos e 1 a 2 vagas. Lazer completo com piscina, academia, espaço gourmet, playground, quadra de beach tennis e pet place.',
      endereco:'Rua Curitiba', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30170-120',
      area_min:62.19, area_max:175.10, preco_min:1028214, preco_max:2049668, quartos_min:1, quartos_max:3, vagas:2,
    },
    unidades:[
      // Bloco A — aptos tipo
      { nome:'Apto 501',  tipo:'apartamento', m2:84.68, q:3, v:2, preco:1589987 },
      { nome:'Apto 503',  tipo:'apartamento', m2:88.35, q:3, v:2, preco:1492604 },
      { nome:'Apto 601',  tipo:'apartamento', m2:84.43, q:3, v:2, preco:1477756 },
      { nome:'Apto 701',  tipo:'apartamento', m2:84.43, q:3, v:2, preco:1498196 },
      { nome:'Apto 801',  tipo:'apartamento', m2:84.43, q:3, v:2, preco:1539861 },
      { nome:'Apto 804',  tipo:'apartamento', m2:76.80, q:3, v:2, preco:1397539 },
      { nome:'Apto 904',  tipo:'apartamento', m2:76.80, q:3, v:2, preco:1391337 },
      { nome:'Apto 1001', tipo:'apartamento', m2:84.43, q:3, v:2, preco:1539073 },
      { nome:'Apto 1003', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1406349 },
      { nome:'Apto 1103', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1431722 },
      { nome:'Apto 1104', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1438953 },
      { nome:'Apto 1303', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1433914 },
      { nome:'Apto 1304', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1485909 },
      { nome:'Apto 1403', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1395968 },
      { nome:'Apto 1404', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1512976 },
      { nome:'Apto 1503', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1466120 },
      { nome:'Apto 1504', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1512417 },
      { nome:'Apto 1603', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1470352 },
      { nome:'Apto 1703', tipo:'apartamento', m2:76.80, q:3, v:2, preco:1529049 },
      { nome:'Apto 1803', tipo:'apartamento', m2:75.11, q:3, v:2, preco:1521765 },
      { nome:'Apto 2301', tipo:'apartamento', m2:63.54, q:1, v:0, preco:1028214 },
      // Casas
      { nome:'Casa 36',   tipo:'garden',      m2:175.10, q:3, v:2, preco:1804409 },
      { nome:'Casa 54',   tipo:'garden',      m2:175.10, q:3, v:2, preco:2049668 },
      // Bloco B — aptos e terrace
      { nome:'Área Priv 404',  tipo:'garden',    m2:141.16, q:3, v:2, preco:2011042 },
      { nome:'Terrace 502',    tipo:'cobertura', m2:98.53,  q:3, v:2, preco:1502624 },
      { nome:'Terrace 504',    tipo:'cobertura', m2:98.53,  q:3, v:2, preco:1565893 },
      { nome:'Apto B-602',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1304114 },
      { nome:'Apto B-604',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1358859 },
      { nome:'Apto B-702',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1308568 },
      { nome:'Apto B-704',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1363335 },
      { nome:'Apto B-802',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1313021 },
      { nome:'Apto B-804',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1367810 },
      { nome:'Apto B-902',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1317475 },
      { nome:'Apto B-904',     tipo:'apartamento', m2:79.65, q:3, v:2, preco:1372286 },
      { nome:'Terrace 1004',   tipo:'cobertura', m2:98.53,  q:3, v:2, preco:1591589 },
      { nome:'Apto B-1102',    tipo:'apartamento', m2:79.65, q:3, v:2, preco:1326382 },
      { nome:'Apto B-1104',    tipo:'apartamento', m2:79.65, q:3, v:2, preco:1381236 },
      { nome:'Apto B-1202',    tipo:'apartamento', m2:79.65, q:3, v:2, preco:1353818 },
      { nome:'Apto B-1301',    tipo:'apartamento', m2:79.05, q:3, v:2, preco:1402339 },
      { nome:'Apto B-1304',    tipo:'apartamento', m2:79.65, q:3, v:2, preco:1411986 },
      { nome:'Terrace 1402',   tipo:'cobertura', m2:101.34, q:2, v:2, preco:1597584 },
      { nome:'Apto B-1501',    tipo:'apartamento', m2:62.19, q:2, v:1, preco:1036892 },
      { nome:'Apto B-1503',    tipo:'apartamento', m2:62.19, q:2, v:1, preco:1071774 },
      { nome:'Apto B-1604',    tipo:'apartamento', m2:62.80, q:2, v:1, preco:1178916 },
      { nome:'Apto B-1702',    tipo:'apartamento', m2:62.80, q:2, v:2, preco:1091110 },
      { nome:'Apto B-1904',    tipo:'apartamento', m2:62.80, q:2, v:2, preco:1140151 },
      { nome:'Apto B-2101',    tipo:'apartamento', m2:62.19, q:2, v:2, preco:1133880 },
      { nome:'Terrace 2202',   tipo:'cobertura', m2:76.84,  q:2, v:2, preco:1234191 },
      { nome:'Apto B-2302',    tipo:'apartamento', m2:62.80, q:2, v:2, preco:1101717 },
    ],
  },
  {
    nome: 'One View Luxemburgo',
    dir:  path.join(BASE, '2026-08-18-One View Luxemburgo'),
    facade: 'one_view_04_edited-DVmz9f8j.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'One View Luxemburgo na Av. Raja Gabáglia, Luxemburgo, Belo Horizonte. Apartamentos de 2 quartos com vista para a Serra do Curral. Design contemporâneo em um dos bairros mais tradicionais da capital mineira, cercado por shoppings, hospitais e centros empresariais.',
      endereco:'Av. Raja Gabáglia, 1203', bairro:'Luxemburgo', cidade:'Belo Horizonte', estado:'MG', cep:'30380-620',
      area_min:62, area_max:101, preco_min:null, preco_max:null, quartos_min:2, quartos_max:2, vagas:2,
    },
    unidades:[],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  JANEIRO Engenharia — 4 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Janeiro Engenharia',
        razao_social:'Janeiro Engenharia Empreendimentos', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await criarUnidades(TOKEN, e.id, emp.unidades);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }

  console.log('\n✅ JANEIRO concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
