/**
 * cadastrar-sensia.js — SENSIA (6 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'sensia@soconstrutoras.com.br';
const SENHA = 'SENSIA@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\SENSIA';

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

const bd = (desc, bairro, cep, q1=2, q2=3) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:1,
});

const EMPS = [
  {
    nome: 'Gran Bosque',
    dir:  path.join(BASE, '2026-08-20-Gran Bosque'),
    facade: null,
    body: bd('Gran Bosque, SENSIA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000'),
  },
  {
    nome: 'Sensia Paris',
    dir:  path.join(BASE, '2026-08-20-Sensia Paris'),
    facade: null,
    body: bd('Sensia Paris, SENSIA em BH. Apartamentos de alto padrão entregues com área privativa. Unidades esgotadas.','Belo Horizonte','30000-000'),
  },
  {
    nome: 'Sensia Serra',
    dir:  path.join(BASE, '2026-08-20-Sensia Serra'),
    facade: null,
    body: bd('Sensia Serra, SENSIA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000'),
  },
  {
    nome: 'Sensia Solarium',
    dir:  path.join(BASE, '2026-08-20-Sensia Solarium'),
    facade: null,
    body: bd('Sensia Solarium, SENSIA em BH. Apartamentos de alto padrão entregues com solarium. Unidades esgotadas.','Belo Horizonte','30000-000'),
  },
  {
    nome: 'Sensia Way',
    dir:  path.join(BASE, '2026-08-20-Sensia Way'),
    facade: null,
    body: bd('Sensia Way, SENSIA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000'),
  },
  {
    nome: 'Sensia Pampulha',
    dir:  path.join(BASE, 's2026-08-20 Sensiia pampulha'),  // nome do dir com typo
    facade: null,
    body: { tipo:'apartamento', status:'pronto', descricao:'Sensia Pampulha, SENSIA na Pampulha, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Pampulha', bairro:'Pampulha', cidade:'Belo Horizonte', estado:'MG', cep:'31275-000',
      area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1 },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SENSIA — 6 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'SENSIA', razao_social:'SENSIA Empreendimentos Imobiliários', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ SENSIA concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
