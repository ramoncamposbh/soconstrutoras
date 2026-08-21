/**
 * cadastrar-prisbel.js — PRISBEL (5 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'prisbel@soconstrutoras.com.br';
const SENHA = 'PRISBEL@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\PRISBEL';

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
  const r = await api(`/empreendimentos/${empId}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome: 'Arbo Residence e Mall PRISBEL',
    dir:  path.join(BASE, '2026-08-19-Arbo Residence & Mall'),
    facade: 'PRISMA_ARBO_FACHADA_NOITE_grama.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Arbo Residence & Mall, PRISBEL em BH. Empreendimento mixed-use com residencial e mall entregue. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1 },
  },
  {
    nome: 'Downtown PRISBEL',
    dir:  path.join(BASE, '2026-08-19-Downtown'),
    facade: '22015_PRI_Curitiba_01_FachadaNoturna_R03_alta.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Downtown PRISBEL na Rua Curitiba, Belo Horizonte. Apartamentos de alto padrão entregues com fachada noturna. Unidades esgotadas.',
      endereco:'Rua Curitiba', bairro:'Centro', cidade:'Belo Horizonte', estado:'MG', cep:'30170-120',
      area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:1, quartos_max:3, vagas:1 },
  },
  {
    nome: 'Oásis Vale do Sereno PRISBEL',
    dir:  path.join(BASE, '2026-08-19-Oásis Vale do Sereno'),
    facade: '04-Cascata-800x450.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Oásis Vale do Sereno, PRISBEL em Nova Lima. Condomínio fechado com cascata, parrilla e área de lazer completa. Unidades esgotadas.',
      endereco:'Vale do Sereno', bairro:'Vale do Sereno', cidade:'Nova Lima', estado:'MG', cep:'34000-000',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:2 },
  },
  {
    nome: 'Paradiso PRISBEL',
    dir:  path.join(BASE, '2026-08-19-Paradiso'),
    facade: 'PRISBEL_PARADISO_FACHADA02.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Paradiso, PRISBEL em BH. Apartamentos de alto padrão entregues com fachada contemporânea. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
  {
    nome: 'Uptown Savassi PRISBEL',
    dir:  path.join(BASE, '2026-08-19-Uptown Savassi'),
    facade: 'PRISBEL_UPTOWN_FACHADA2.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Uptown Savassi, PRISBEL no Savassi, Belo Horizonte. Apartamentos de alto padrão entregues na melhor localização. Unidades esgotadas.',
      endereco:'Rua dos Inconfidentes', bairro:'Savassi', cidade:'Belo Horizonte', estado:'MG', cep:'30140-120',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PRISBEL — 5 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'PRISBEL', razao_social:'PRISBEL Empreendimentos Imobiliários', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ PRISBEL concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
