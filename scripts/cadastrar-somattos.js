/**
 * cadastrar-somattos.js — SOMATTOS (21 empreendimentos — todos vendidos)
 *   Nomes com conflito (Patrimar): sufixo SOMATTOS
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'somattos@soconstrutoras.com.br';
const SENHA = 'SOMATTOS@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\SOMATTOS';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}
async function uploadFoto(ep, file, tipo, TOKEN) {
  if (!fs.existsSync(file)) return null;
  const ext  = path.extname(file).slice(1).toLowerCase();
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
async function uploadImagens(TOKEN, empId, dir, facade) {
  const det = await api(`/empreendimentos/${empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) { console.log('  ✓ fotos já existem'); return; }
  if (!dir || !fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
  const all    = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|jpg)$/i.test(f));
  if (!all.length) { console.log('  ⚠ sem imagens'); return; }
  const plantas = all.filter(f => f.toLowerCase().includes('planta'));
  const fotos   = all.filter(f => !f.toLowerCase().includes('planta'));
  const ordered = facade ? [facade, ...fotos.filter(f => f !== facade)] : fotos;
  let ok = 0;
  for (const f of ordered) { if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir,f), 'foto', TOKEN)) ok++; await sleep(400); }
  for (const f of plantas) { if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir,f), 'planta', TOKEN)) ok++; await sleep(400); }
  console.log(`  📸 ${ok}/${all.length}`);
}
async function publicar(TOKEN, empId) {
  const r = await api(`/empreendimentos/${empId}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const bd = (desc, bairro, cep, q1=2, q2=4) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:50, area_max:300, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:2,
});

const EMPS = [
  // Aura T1/T2/T3 — sufixo SOMATTOS para evitar conflito com Patrimar
  { nome:'Aura T1 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Aura T1'), facade: '02_AURA_TORREA1_FACHADA.jpeg',
    body: bd('Aura Torre 1, SOMATTOS em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Aura T2 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Aura T2'), facade: '03_AURA_TORREA2_FACHADA.jpeg',
    body: bd('Aura Torre 2, SOMATTOS em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Aura T3 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Aura T3'), facade: '04_AURA_TORREA3_FACHADA.jpeg',
    body: bd('Aura Torre 3, SOMATTOS em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Brisea Moema',
    dir: path.join(BASE,'2026-08-20-Brisea Moema'), facade: 'SOMATTOS_MOEMA_FACHADA.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Brisea Moema, SOMATTOS em São Paulo. Apartamentos de alto padrão entregues em Moema. Unidades esgotadas.',
      endereco:'Moema', bairro:'Moema', cidade:'São Paulo', estado:'SP', cep:'04571-000',
      area_min:60, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Casa Aleixo',
    dir: path.join(BASE,'2026-08-20-Casa Aleixo'), facade: 'SOMATTOS_CASAALEIXO_FACHADA.jpeg',
    body: bd('Casa Aleixo, SOMATTOS em BH. Apartamentos de alto padrão entregues com academia. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Diamond Jardins',
    dir: path.join(BASE,'2026-08-20-Diamond Jardins'), facade: '67_SOMATTOS_DIAMOND_FACHADA1.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Diamond Jardins, SOMATTOS em São Paulo. Apartamentos de alto padrão entregues nos Jardins. Unidades esgotadas.',
      endereco:'Jardins', bairro:'Jardins', cidade:'São Paulo', estado:'SP', cep:'01401-000',
      area_min:60, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Diamond Studios',
    dir: path.join(BASE,'2026-08-20-Diamond Studios'), facade: null,
    body: { tipo:'studio', status:'pronto', descricao:'Diamond Studios, SOMATTOS em São Paulo. Studios de alto padrão entregues. Unidades esgotadas.',
      endereco:'São Paulo', bairro:'São Paulo', cidade:'São Paulo', estado:'SP', cep:'01000-000',
      area_min:25, area_max:60, preco_min:null, preco_max:null, quartos_min:1, quartos_max:1, vagas:1 } },
  // Duo Cortona — sufixo SOMATTOS para evitar conflito com Patrimar
  { nome:'Duo Cortona SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Duo Cortona'), facade: '00_DUO_FACHADA_-_COLOCAR_ESSA_COMO_FOTO_DO_PERFIL_LA_EM_CIMA.jpeg',
    body: bd('Duo Cortona, SOMATTOS em BH. Empreendimento duplo de alto padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'EDGE',
    dir: path.join(BASE,'2026-08-20-EDGE'), facade: 'SOMATTOS_EDGE_FACHADA_baixa.jpeg',
    body: bd('EDGE, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  // Epic — sufixo SOMATTOS para evitar conflito com Patrimar
  { nome:'Epic SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Epic'), facade: '308_EPC_01_Fachada_EF_V2_29-05-2019.jpeg',
    body: bd('Epic, SOMATTOS em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Evolution',
    dir: path.join(BASE,'2026-08-20-Evolution'), facade: null,
    body: bd('Evolution, SOMATTOS em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Flow',
    dir: path.join(BASE,'2026-08-20-Flow'), facade: null,
    body: bd('Flow, SOMATTOS em BH. Apartamentos com garden entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Hub',
    dir: path.join(BASE,'2026-08-20-Hub'), facade: null,
    body: bd('Hub, SOMATTOS em BH. Apartamentos com garden de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Legacy',
    dir: path.join(BASE,'2026-08-20-Legacy'), facade: 'Fachada.jpeg',
    body: bd('Legacy, SOMATTOS em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Lúmina',
    dir: path.join(BASE,'2026-08-20-Lúmina'), facade: 'Fachada(2).jpeg',
    body: bd('Lúmina, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues com garden. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Mirá',
    dir: path.join(BASE,'2026-08-20-Mirá'), facade: 'SOMATOS_MIRA_FACHADA.jpeg',
    body: bd('Mirá, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Momento',
    dir: path.join(BASE,'2026-08-20-Momento'), facade: 'Fachada.jpeg',
    body: bd('Momento, SOMATTOS em BH. Apartamentos de alto padrão entregues com área de lazer. Unidades esgotadas.','Belo Horizonte','30000-000') },
  // Unique e Étoile — sufixo SOMATTOS para evitar conflito com Patrimar
  { nome:'Unique Nord T2 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Unique Nord - T2'), facade: null,
    body: bd('Unique Nord Torre 2, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Unique Sud T1 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Unique Sud - T1'), facade: null,
    body: bd('Unique Sud Torre 1, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Étoile Nord T2 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Étoile Nord - T2'), facade: '1_-_Fachada_torres.jpeg',
    body: bd('Étoile Nord Torre 2, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Étoile Sud T1 SOMATTOS',
    dir: path.join(BASE,'2026-08-20-Étoile Sud - T1'), facade: '1_-_Fachada_torres.jpeg',
    body: bd('Étoile Sud Torre 1, SOMATTOS em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SOMATTOS — 21 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'SOMATTOS', razao_social:'SOMATTOS Incorporações e Construções', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ SOMATTOS concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
