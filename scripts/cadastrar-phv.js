/**
 * cadastrar-phv.js — PHV (17 empreendimentos — todos vendidos)
 *   Mix residencial + comercial
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'phv@soconstrutoras.com.br';
const SENHA = 'PHV@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\PHV';

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
  { nome:'Almir',           dir: path.join(BASE,'2026-08-19-Almir'),           facade:'Captura_de_tela_2026-03-02_155749.jpeg',
    body: apto('Almir, PHV em BH. Apartamentos entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Alto belvedere',  dir: path.join(BASE,'2026-08-19-Alto belvedere'),  facade:'1_(1).jpeg',
    body: apto('Alto Belvedere, PHV em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belvedere','30000-000') },
  { nome:'Alto da Serra',   dir: path.join(BASE,'2026-08-19-Alto da Serra'),   facade:'WhatsApp_Image_2026-07-17_at_161741.jpeg',
    body: apto('Alto da Serra, PHV em BH. Apartamentos entregues com vista da serra. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Burle Marx',      dir: path.join(BASE,'2026-08-19-Burle Marx'),      facade:'Burle_Marx_fachada_Av_Cristiano_Machado.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Burle Marx, PHV na Av. Cristiano Machado, BH. Apartamentos entregues em localização privilegiada. Unidades esgotadas.',
      endereco:'Avenida Cristiano Machado', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'31170-000',
      area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1 } },
  { nome:'Centauro',        dir: path.join(BASE,'2026-08-19-Centauro'),        facade:'PHV_FACHADA_VIEW01_(2).jpeg',
    body: apto('Centauro, PHV em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Ed. Minas Comercial', dir: path.join(BASE,'2026-08-19-Ed. Minas Comercial'), facade:'Captura_de_tela_2026-02-23_160128.jpeg',
    body: comercial('Ed. Minas Comercial, PHV em BH. Salas comerciais entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Ed. Átria',       dir: path.join(BASE,'2026-08-19-Ed. Átria'),       facade:'Captura_de_tela_2026-02-23_153340.jpeg',
    body: comercial('Ed. Átria, PHV em BH. Salas comerciais de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Falls',           dir: path.join(BASE,'2026-08-19-Falls'),           facade:'PHV_FALLS_FACHADA_BARCELONA.jpeg',
    body: apto('Falls, PHV em BH. Apartamentos de alto padrão entregues com fachada Barcelona. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Gaia',            dir: path.join(BASE,'2026-08-19-Gaia'),            facade:'Fachada_Gaia_02.jpeg',
    body: apto('Gaia, PHV em BH. Apartamentos entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Maria Emília Salles', dir: path.join(BASE,'2026-08-19-Maria Emília Salles'), facade:'PHV_FACHADA_01.jpeg',
    body: apto('Maria Emília Salles, PHV em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Palazzo Torquetti',dir: path.join(BASE,'2026-08-19-Palazzo Torquetti'),facade:'301_e_303.jpeg',
    body: apto('Palazzo Torquetti, PHV em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Primavera',       dir: path.join(BASE,'2026-08-19-Primavera'),       facade:'PHV_PRIMAVERA_FACHADARESIDENCIAL_wide.jpeg',
    body: apto('Primavera, PHV em BH. Apartamentos residenciais entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Quintas do Camboeiro',dir: path.join(BASE,'2026-08-19-Quintas do Camboeiro'),facade:'Captura_de_tela_2026-03-27_164134(2).jpeg',
    body: apto('Quintas do Camboeiro, PHV em BH. Apartamentos entregues em condomínio. Unidades esgotadas.','Camboeiro','30000-000') },
  { nome:'Sinval Junior',   dir: path.join(BASE,'2026-08-19-Sinval Junior'),   facade:'Fachada_-_Sinval_Junior.jpeg',
    body: apto('Sinval Junior, PHV em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Unique Santa Lúcia',dir: path.join(BASE,'2026-08-19-Unique Santa Lúcia'),facade:'21008_PHV_Unique_01_Fachada_Diurna_R05_alta.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Unique Santa Lúcia, PHV em BH. Apartamentos de altíssimo padrão entregues em Santa Lúcia. Unidades esgotadas.',
      endereco:'Santa Lúcia', bairro:'Santa Lúcia', cidade:'Belo Horizonte', estado:'MG', cep:'30360-120',
      area_min:80, area_max:400, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:2 } },
  { nome:'Villa Almeida Ramos',dir: path.join(BASE,'2026-08-19-Villa Almeida Ramos'),facade:'VAR_-_FACHADA_OK.jpeg',
    body: apto('Villa Almeida Ramos, PHV em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Vista',           dir: path.join(BASE,'2026-08-19-Vista'),           facade:'Fachada_Frontal___Vista_-_PHV_Engenharia.jpeg',
    body: apto('Vista, PHV Engenharia em BH. Apartamentos de alto padrão entregues com vista frontal. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PHV — 17 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'PHV', razao_social:'PHV Engenharia e Incorporações', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ PHV concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
