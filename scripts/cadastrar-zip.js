const fs   = require('fs');
const path = require('path');
const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'zip@soconstrutoras.com.br';
const SENHA = 'ZIP@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Zip Incorporadora';
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
  area_min:50, area_max:300, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:1,
});
const EMPS = [
  { nome:'ALDEA BARROCA', dir: path.join(BASE,'2026-08-20-ALDEA BARROCA'), facade: '5401-EXT-01-Fachada_A-R07-HR.jpeg',
    body: bd('ALDEA BARROCA, Zip Incorporadora em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Benvindo', dir: path.join(BASE,'2026-08-20-Benvindo'), facade: 'SQUAD-ZIP-JARAGUA-IMG-FACHADA-2-R08-scaled.jpeg',
    body: bd('Benvindo, Zip Incorporadora em BH. Apartamentos com área privativa entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Hello! Residence', dir: path.join(BASE,'2026-08-20-Hello! Residence'), facade: 'SQUAD_CONSTRUTORA_SUDOESTE_ED_TUPIS_IMG_FACHADA_R00.jpeg',
    body: bd('Hello! Residence, Zip Incorporadora em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000',1,3) },
  { nome:'Hey! Residence', dir: path.join(BASE,'2026-08-20-Hey! Residence'), facade: null,
    body: bd('Hey! Residence, Zip Incorporadora em BH. Apartamentos com área privativa entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Raízes Residence', dir: path.join(BASE,'2026-08-20-Raízes Residence'), facade: '2Fachada.jpeg',
    body: bd('Raízes Residence, Zip Incorporadora em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('  Zip Incorporadora');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Zip Incorporadora', razao_social:'Zip Incorporadora Ltda', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ Zip Incorporadora concluído');
}
module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
