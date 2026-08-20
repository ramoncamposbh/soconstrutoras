/**
 * cadastrar-protempo.js — PROTEMPO (7 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'protempo@soconstrutoras.com.br';
const SENHA = 'PROTEMPO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\PROTEMPO';

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

const bd = (desc, bairro, cep) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:50, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
});

const EMPS = [
  { nome:'ATMO',              dir: path.join(BASE,'2026-08-19-ATMO'),             facade:'25004_PRO_Atmo_01_FachadaDiurna_R05_alta.jpeg',
    body: bd('ATMO, PROTEMPO em BH. Apartamentos de alto padrão entregues com fachada diurna. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Artha Ghar',        dir: path.join(BASE,'2026-08-19-Artha Ghar'),       facade:'Fachada_Artha_Gar.jpeg',
    body: bd('Artha Ghar, PROTEMPO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Jaya',              dir: path.join(BASE,'2026-08-19-Jaya'),             facade:'Fachada.jpeg',
    body: bd('Jaya, PROTEMPO em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'ONE',               dir: path.join(BASE,'2026-08-19-ONE'),              facade:'115-Fachada_Detalhe_R03.jpeg',
    body: bd('ONE, PROTEMPO em BH. Empreendimento de altíssimo padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Reserva Gutierrez', dir: path.join(BASE,'2026-08-19-Reserva Gutierrez'),facade:'23031_PRO_MarechalBitencourt_23_Fachada_R05_alta.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Reserva Gutierrez na Rua Marechal Bitencourt, 23, Gutierrez, Belo Horizonte. Empreendimento PROTEMPO de alto padrão entregue. Unidades esgotadas.',
      endereco:'Rua Marechal Bitencourt, 23', bairro:'Gutierrez', cidade:'Belo Horizonte', estado:'MG', cep:'30430-110',
      area_min:80, area_max:350, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Zafyr',             dir: path.join(BASE,'2026-08-19-Zafyr'),            facade:'25027_PRO_ZafyrAntonio_01_FachadaDiurna_R06_alta.jpeg',
    body: bd('Zafyr, PROTEMPO em BH. Apartamentos de alto padrão entregues com fachada diurna. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Éden Residence',    dir: path.join(BASE,'2026-08-19-Éden Residence'),   facade:'Eden_-_Imagem_-_Fachada_02_NOTURNA(2).jpeg',
    body: bd('Éden Residence, PROTEMPO em BH. Apartamentos de alto padrão entregues com fachada noturna. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PROTEMPO — 7 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'PROTEMPO', razao_social:'PROTEMPO Engenharia e Construções', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ PROTEMPO concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
