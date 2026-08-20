/**
 * cadastrar-apo.js — APO (1 empreendimento — estrutura antiga PERSPECTIVAS/)
 *   Tea Monde — Belo Horizonte (vendido)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'apo@soconstrutoras.com.br';
const SENHA = 'APO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\APO';

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
function getImagesRecursive(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    try {
      if (fs.statSync(full).isDirectory()) result.push(...getImagesRecursive(full));
      else if (/\.(jpe?g|png|jpg)$/i.test(f)) result.push(full);
    } catch {}
  }
  return result;
}
async function uploadImagensOld(TOKEN, empId, baseDir) {
  const det = await api(`/empreendimentos/${empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  const all    = getImagesRecursive(baseDir);
  const plantas = all.filter(f => f.toLowerCase().includes('planta'));
  const fotos   = all.filter(f => !f.toLowerCase().includes('planta'));
  const fi = fotos.findIndex(f => f.toLowerCase().includes('fachada'));
  if (fi > 0) { const [fac] = fotos.splice(fi, 1); fotos.unshift(fac); }
  let ok = 0;
  for (const f of fotos) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, f, 'foto', TOKEN)) ok++;
    await sleep(400);
  }
  for (const f of plantas) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, f, 'planta', TOKEN)) ok++;
    await sleep(400);
  }
  console.log(`  📸 ${ok}/${all.length}`);
}
async function publicar(TOKEN, empId) {
  const r = await api(`/empreendimentos/${empId}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome: 'Tea Monde',
    dir:  path.join(BASE, '2026-08-14-Tea Monde'),
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Tea Monde, empreendimento APO de alto padrão em Belo Horizonte. Apartamentos com área privativa, studio e cobertura. Lazer completo. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:50, area_max:300, preco_min:null, preco_max:null, quartos_min:1, quartos_max:4, vagas:2,
    },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  APO — 1 empreendimento');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'APO', razao_social:'APO Empreendimentos Imobiliários', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagensOld(TOKEN, e.id, emp.dir);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ APO concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
