/**
 * cadastrar-prodomo.js — PRODOMO (17 empreendimentos — todos vendidos)
 *   Mix residencial + comercial
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'prodomo@soconstrutoras.com.br';
const SENHA = 'PRODOMO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\PRODOMO';

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
  if (!fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
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
  const r = await api(`/empreendimentos/${empId}/publicar`, { method:'POST', headers:{Authorization:`Bearer ${TOKEN}`} });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const apto = (desc, bairro, cep, q1=2, q2=4) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:50, area_max:300, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:1,
});
const comercial = (desc, bairro, cep) => ({
  tipo:'comercial', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:30, area_max:200, preco_min:null, preco_max:null, quartos_min:null, quartos_max:null, vagas:1,
});

const EMPS = [
  { nome:'Casa em condomínio fechado - Buritis', dir: path.join(BASE,'2026-08-19-Casa em condomínio fechado - Buritis'), facade:'Garden_(1).jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Casa em condomínio fechado no Buritis, PRODOMO. Casas com garden entregues em condomínio fechado. Unidades esgotadas.',
      endereco:'Buritis', bairro:'Buritis', cidade:'Belo Horizonte', estado:'MG', cep:'30575-280',
      area_min:100, area_max:400, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:2 } },
  { nome:'EXTREMUS COMERCIAL', dir: path.join(BASE,'2026-08-19-EXTREMUS COMERCIAL'), facade:'Fachada_1.jpeg',
    body: comercial('Extremus Comercial, PRODOMO em BH. Salas comerciais de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Evidence', dir: path.join(BASE,'2026-08-19-Evidence'), facade:'Fachada.jpeg',
    body: apto('Evidence, PRODOMO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Hórus', dir: path.join(BASE,'2026-08-19-Hórus'), facade:'FACHADA_01-680x850.jpeg',
    body: apto('Hórus, PRODOMO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'LATOUR COMERCIAL', dir: path.join(BASE,'2026-08-19-LATOUR COMERCIAL'), facade:'5e2f42dd-d7ce-4518-a4fe-787cd8f4f6ef.jpeg',
    body: comercial('Latour Comercial, PRODOMO em BH. Salas comerciais de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Latour', dir: path.join(BASE,'2026-08-19-Latour'), facade:'Fachada.jpeg',
    body: apto('Latour, PRODOMO em BH. Apartamentos de alto padrão entregues com jardim externo. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Luxus Residence', dir: path.join(BASE,'2026-08-19-Luxus Residence'), facade:'Fachada.jpeg',
    body: apto('Luxus Residence, PRODOMO em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'MOMENTUM COMERCIAL', dir: path.join(BASE,'2026-08-19-MOMENTUM COMERCIAL'), facade:'Momentum_(0).jpeg',
    body: comercial('Momentum Comercial, PRODOMO em BH. Salas e lojas comerciais entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Momentum Residence', dir: path.join(BASE,'2026-08-19-Momentum Residence'), facade:'Fachada_02_Quartos_com_suite.jpeg',
    body: apto('Momentum Residence, PRODOMO em BH. Apartamentos de 2 quartos com suíte entregues. Unidades esgotadas.','Belo Horizonte','30000-000',2,2) },
  { nome:'ORB Residence', dir: path.join(BASE,'2026-08-19-ORB Residence'), facade:'Orb_-_Fachada.jpeg',
    body: apto('ORB Residence, PRODOMO em BH. Apartamentos de alto padrão entregues com hall de entrada e locker. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'ORB. COMERCIAL', dir: path.join(BASE,'2026-08-19-ORB. COMERCIAL'), facade:'ORB_1.jpeg',
    body: comercial('ORB Comercial, PRODOMO em BH. Salas comerciais de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Omnium Residence', dir: path.join(BASE,'2026-08-19-Omnium Residence'), facade:'1(2).jpeg',
    body: apto('Omnium Residence, PRODOMO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'PULSE COMERCIAL', dir: path.join(BASE,'2026-08-19-PULSE COMERCIAL'), facade:'Pulse_1.jpeg',
    body: comercial('Pulse Comercial, PRODOMO em BH. Salas e lojas comerciais entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Province Di Martini', dir: path.join(BASE,'2026-08-19-Province Di Martini'), facade:'Fachada.jpeg',
    body: apto('Province Di Martini, PRODOMO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Pulse Residence', dir: path.join(BASE,'2026-08-19-Pulse Residence'), facade:'FACHADA_PULSE02.jpeg',
    body: apto('Pulse Residence, PRODOMO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Station Tower Residence', dir: path.join(BASE,'2026-08-19-Station Tower Residence'), facade:'4.jpeg',
    body: apto('Station Tower Residence, PRODOMO em BH. Empreendimento de alto padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Versato', dir: path.join(BASE,'2026-08-19-Versato'), facade:'Apartamento_tipo_-_finais_01_02_05_e_06.jpeg',
    body: apto('Versato, PRODOMO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PRODOMO — 17 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'PRODOMO', razao_social:'PRODOMO Incorporações e Construções', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ PRODOMO concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
