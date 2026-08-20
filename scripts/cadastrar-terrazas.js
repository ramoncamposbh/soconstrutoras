const fs   = require('fs');
const path = require('path');
const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'terrazas@soconstrutoras.com.br';
const SENHA = 'TERRAZAS@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Terrazas';
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
  const all = fs.readdirSync(dir).filter(f => {
    const full = path.join(dir, f);
    return /\.(jpe?g|png|jpg)$/i.test(f) && fs.statSync(full).isFile();
  });
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
  { nome:'Absoluto', dir: path.join(BASE,'2026-08-20-Absoluto'), facade: null,
    body: bd('Absoluto, Terrazas em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Art House', dir: path.join(BASE,'2026-08-20-Art House'), facade: null,
    body: bd('Art House, Terrazas em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Atmosfera', dir: path.join(BASE,'2026-08-20-Atmosfera'), facade: null,
    body: bd('Atmosfera, Terrazas em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Iconic', dir: path.join(BASE,'2026-08-20-Iconic'), facade: 'Fachada.jpeg',
    body: bd('Iconic, Terrazas em BH. Apartamentos de 3 quartos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000',3,4) },
  { nome:'Origem Luxury Residence', dir: path.join(BASE,'2026-08-20-Origem Luxury Residence'), facade: 'fachada.jpeg',
    body: bd('Origem Luxury Residence, Terrazas em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Prime Terrazas', dir: path.join(BASE,'2026-08-20-Prime'), facade: null,
    body: bd('Prime, Terrazas em BH. Apartamentos com área privativa entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Quadra', dir: path.join(BASE,'2026-08-20-Quadra'), facade: null,
    body: bd('Quadra, Terrazas em BH. Apartamentos com área privativa entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Savassi by Pininfarina', dir: path.join(BASE,'2026-08-20-Savassi by Pininfarina'), facade: 'fachada.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Savassi by Pininfarina, Terrazas no Savassi, BH. Empreendimento de altíssimo padrão assinado pela Pininfarina. Unidades esgotadas.',
      endereco:'Savassi', bairro:'Savassi', cidade:'Belo Horizonte', estado:'MG', cep:'30140-000',
      area_min:80, area_max:400, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Singular', dir: path.join(BASE,'2026-08-20-Singular'), facade: null,
    body: bd('Singular, Terrazas em BH. Apartamentos de 4 quartos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000',3,4) },
];

async function main() {
  console.log('  Terrazas');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Terrazas', razao_social:'Terrazas Incorporações', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ Terrazas concluído');
}
module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
