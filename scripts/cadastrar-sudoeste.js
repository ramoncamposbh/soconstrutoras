const fs   = require('fs');
const path = require('path');
const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'sudoeste@soconstrutoras.com.br';
const SENHA = 'SUDOESTE@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\SUDOESTE';
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

const bd = (desc, bairro, cep, q1=1, q2=3) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:40, area_max:250, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:1,
});
const EMPS = [
  { nome:'Aldea Bias Fortes',
    dir: path.join(BASE,'ALDEAS BIAS FORTES','2026-07-20-Aldea Bias Fortes'),
    facade: 'Perspectiva_da_fachada.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Aldea Bias Fortes, SUDOESTE na Rua Bias Fortes, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Rua Bias Fortes', bairro:'Centro', cidade:'Belo Horizonte', estado:'MG', cep:'30170-010',
      area_min:40, area_max:200, preco_min:null, preco_max:null, quartos_min:1, quartos_max:3, vagas:1 } },
  { nome:'Aldea Vale do Sereno',
    dir: path.join(BASE,'ALDEAS VALE DO SERENO','2026-07-20-Aldea Vale do Sereno'),
    facade: 'ima-sudoeste-vale-do-sereno-fachada-diurna-baixa-1638x2048-1.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Aldea Vale do Sereno, SUDOESTE em Nova Lima. Apartamentos de alto padrão entregues no Vale do Sereno. Unidades esgotadas.',
      endereco:'Vale do Sereno', bairro:'Vale do Sereno', cidade:'Nova Lima', estado:'MG', cep:'34000-000',
      area_min:40, area_max:250, preco_min:null, preco_max:null, quartos_min:1, quartos_max:3, vagas:1 } },
  { nome:'Aldea Contorno',
    dir: path.join(BASE,'ALDEAS CONTORNO'),
    facade: 'IMA-SUDOESTE_VALE_DO_SERENO-FACHADA-DIURNA-BAIXA-scaled.jpg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Aldea Contorno, SUDOESTE em BH. Apartamentos de alto padrão na Avenida do Contorno. Unidades esgotadas.',
      endereco:'Avenida do Contorno', bairro:'Centro', cidade:'Belo Horizonte', estado:'MG', cep:'30110-080',
      area_min:40, area_max:200, preco_min:null, preco_max:null, quartos_min:1, quartos_max:3, vagas:1 } },
  { nome:'Aldea Pernambuco',
    dir: path.join(BASE,'Aldeas pernambuco','4. Imagens','04. FACHADAS - FINAIS'),
    facade: '01-Sudoeste Construtora - Aldea Pernambuco-Fachada Rua Pernambuco-R08A (1).jpg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Aldea Pernambuco, SUDOESTE na Rua Pernambuco, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Rua Pernambuco', bairro:'Savassi', cidade:'Belo Horizonte', estado:'MG', cep:'30130-150',
      area_min:40, area_max:250, preco_min:null, preco_max:null, quartos_min:1, quartos_max:3, vagas:1 } },
  { nome:'BIOS SUDOESTE', dir: path.join(BASE,'BIOS','Imagens'), facade: 'BIOS_FACHADA.jpg',
    body: bd('BIOS, SUDOESTE em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'JOY SUDOESTE', dir: path.join(BASE,'JOY','Fotos'), facade: null,
    body: bd('JOY, SUDOESTE em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'LODZ SUDOESTE', dir: path.join(BASE,'LODZ'), facade: 'Fachada.JPG',
    body: bd('LODZ, SUDOESTE em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Perlage SUDOESTE', dir: path.join(BASE,'PERLAGE','mARKETING'), facade: null,
    body: bd('Perlage, SUDOESTE em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'SOLUM SUDOESTE', dir: path.join(BASE,'SOLUM'), facade: '26_SOLLUM_FACHADA_NOTURNA_2K.jpg',
    body: bd('SOLUM, SUDOESTE em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Trend Lourdes SUDOESTE', dir: path.join(BASE,'TREND LOURDES'), facade: null,
    body: { tipo:'apartamento', status:'pronto', descricao:'Trend Lourdes, SUDOESTE no Lourdes, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Lourdes', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30180-000',
      area_min:50, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:1 } },
];

async function main() {
  console.log('  SUDOESTE');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'SUDOESTE', razao_social:'SUDOESTE Construtora e Incorporadora', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ SUDOESTE concluído');
}
module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
