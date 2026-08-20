/**
 * cadastrar-novolar.js — Novolar (10 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'novolar@soconstrutoras.com.br';
const SENHA = 'NOVOLAR@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Novolar';

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

const bd = (desc, bairro, cep, q1=2, q2=3) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:50, area_max:250, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:1,
});

const EMPS = [
  { nome:'Alta vista',              dir: path.join(BASE,'2026-08-19-Alta vista'),              facade:'02_-_Fachada_Diurna.jpeg',
    body: bd('Alta Vista Novolar em BH. Apartamentos entregues com fachada diurna moderna. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Grand Resort Jaraguá - T1', dir: path.join(BASE,'2026-08-19-Grand Resort Jaraguá - T1'), facade:'Apartamento_2_quartos_(Final_03).jpeg',
    body: bd('Grand Resort Jaraguá Torre 1, Novolar. Condomínio resort entregue com lazer completo. Unidades esgotadas.','Jaraguá','30000-000',2,3) },
  { nome:'Grand Resort Jaraguá - T2', dir: path.join(BASE,'2026-08-19-Grand Resort Jaraguá - T2'), facade:'Academia.jpeg',
    body: bd('Grand Resort Jaraguá Torre 2, Novolar. Condomínio resort entregue com academia e lazer. Unidades esgotadas.','Jaraguá','30000-000',2,3) },
  { nome:'Grand Resort Jaraguá - T3', dir: path.join(BASE,'2026-08-19-Grand Resort Jaraguá - T3'), facade:'Academia.jpeg',
    body: bd('Grand Resort Jaraguá Torre 3, Novolar. Condomínio resort entregue. Unidades esgotadas.','Jaraguá','30000-000',2,3) },
  { nome:'Grand Resort Jaraguá - T4', dir: path.join(BASE,'2026-08-19-Grand Resort Jaraguá - T4'), facade:'Apartamento_1_quarto_com_Area_privativa_(Final_03).jpeg',
    body: bd('Grand Resort Jaraguá Torre 4, Novolar. Condomínio resort entregue. Unidades esgotadas.','Jaraguá','30000-000',1,3) },
  { nome:'Mirante Estoril - T1', dir: path.join(BASE,'2026-08-19-Mirante Estoril - T1'), facade:'03_-_Fachada_Vertical.jpeg',
    body: bd('Mirante Estoril Torre 1, Novolar. Apartamentos entregues com vista privilegiada. Unidades esgotadas.','Estoril','30000-000') },
  { nome:'Mirante Estoril - T2', dir: path.join(BASE,'2026-08-19-Mirante Estoril - T2'), facade:'03_-_Fachada_Vertical.jpeg',
    body: bd('Mirante Estoril Torre 2, Novolar. Apartamentos entregues com vista privilegiada. Unidades esgotadas.','Estoril','30000-000') },
  { nome:'Mirante Estoril - T3', dir: path.join(BASE,'2026-08-19-Mirante Estoril - T3'), facade:'03_-_Fachada_Vertical.jpeg',
    body: bd('Mirante Estoril Torre 3, Novolar. Apartamentos entregues. Unidades esgotadas.','Estoril','30000-000') },
  { nome:'Mirante Estoril - T4', dir: path.join(BASE,'2026-08-19-Mirante Estoril - T4'), facade:'03_-_Fachada_Vertical.jpeg',
    body: bd('Mirante Estoril Torre 4, Novolar. Apartamentos entregues. Unidades esgotadas.','Estoril','30000-000') },
  { nome:'Mirante Jambreiro', dir: path.join(BASE,'2026-08-19-Mirante Jambreiro'), facade:'1_Fachada_Casa_Colina.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Mirante Jambreiro, Novolar. Casas em condomínio fechado entregues na Serra do Jambreiro. Unidades esgotadas.',
      endereco:'Serra do Jambreiro', bairro:'Zona Rural', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:100, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:2 } },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Novolar — 10 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Novolar', razao_social:'Novolar Empreendimentos Imobiliários', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ Novolar concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
