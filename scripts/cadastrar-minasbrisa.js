/**
 * cadastrar-minasbrisa.js — MINAS BRISA (10 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'minasbrisa@soconstrutoras.com.br';
const SENHA = 'MINASBRISA@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\MINAS BRISA';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}
async function uploadFoto(ep, file, tipo, TOKEN) {
  if (!fs.existsSync(file)) return null;
  const ext = path.extname(file).slice(1).toLowerCase();
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

const body = (desc, bairro, cep, qmin=2, qmax=4) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:60, area_max:300, preco_min:null, preco_max:null, quartos_min:qmin, quartos_max:qmax, vagas:2,
});

const EMPS = [
  { nome:'Brisa Diamond',       dir: path.join(BASE,'2026-08-19-Brisa Diamond'),       facade:'Fachada_diurna.jpeg',
    body: body('Brisa Diamond, MINAS BRISA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Brisa Fleming - T1',  dir: path.join(BASE,'2026-08-19-Brisa Fleming - T1'),  facade:'2cd90506-85b7-4990-a1f1-b62e216c8506.jpeg',
    body: body('Brisa Fleming Torre 1, MINAS BRISA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Brisa Fleming - T2',  dir: path.join(BASE,'2026-08-19-Brisa Fleming - T2'),  facade:'053f91ad-8c72-4505-8bf7-788291b6a227.jpeg',
    body: body('Brisa Fleming Torre 2, MINAS BRISA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Brisa Gutierrez',     dir: path.join(BASE,'2026-08-19-Brisa Gutierrez'),     facade:'MB_AG_FACHADA_NOTURNA_EF_web.jpeg',
    body: body('Brisa Gutierrez, MINAS BRISA no Gutierrez, BH. Apartamentos de alto padrão entregues com fachada noturna. Unidades esgotadas.','Gutierrez','30430-110') },
  { nome:'Brisa Savassi',       dir: path.join(BASE,'2026-08-19-Brisa Savassi'),       facade:'Academia.jpeg',
    body: body('Brisa Savassi, MINAS BRISA no Savassi, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Savassi','30140-110') },
  { nome:'Brisa Unique',        dir: path.join(BASE,'2026-08-19-Brisa Unique'),        facade:'1.jpeg',
    body: body('Brisa Unique, MINAS BRISA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Brisa do Buritis',    dir: path.join(BASE,'2026-08-19-Brisa do Buritis'),    facade:'Fachada(2).jpeg',
    body: body('Brisa do Buritis, MINAS BRISA no Buritis, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Buritis','30575-280') },
  { nome:'Brisa do luxemburgo', dir: path.join(BASE,'2026-08-19-Brisa do luxemburgo'), facade:'Apartamento_tipo_2_quartos.jpeg',
    body: body('Brisa do Luxemburgo, MINAS BRISA no Luxemburgo, BH. Apartamentos de 2 quartos entregues. Unidades esgotadas.','Luxemburgo','30380-490',2,2) },
  { nome:'Double Prime',        dir: path.join(BASE,'2026-08-19-Double Prime'),        facade:'541_p04_posteriortorre1_alta.jpeg',
    body: body('Double Prime, MINAS BRISA em BH. Empreendimento duplex de alto padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Uptown',              dir: path.join(BASE,'2026-08-19-Uptown'),              facade:'6_UP_TOWN_FOTO_FUNDO.jpeg',
    body: body('Uptown, MINAS BRISA em BH. Apartamentos de alto padrão entregues com vista privilegiada. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MINAS BRISA — 10 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'MINAS BRISA', razao_social:'MINAS BRISA Empreendimentos Imobiliários', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ MINAS BRISA concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
