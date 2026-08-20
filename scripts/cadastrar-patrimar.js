/**
 * cadastrar-patrimar.js — Patrimar (18 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'patrimar@soconstrutoras.com.br';
const SENHA = 'PATRIMAR@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Patrimar';

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

const bd = (desc, bairro, cep, q1=2, q2=4) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:60, area_max:400, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:2,
});

const EMPS = [
  { nome:'Aura T1',        dir: path.join(BASE,'2026-08-19-Aura T1'),       facade:'02_AURA_TORREA1_FACHADA.jpeg',
    body: bd('Aura Torre 1, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Aura T2',        dir: path.join(BASE,'2026-08-19-Aura T2'),       facade:'03_AURA_TORREA2_FACHADA.jpeg',
    body: bd('Aura Torre 2, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Aura T3',        dir: path.join(BASE,'2026-08-19-Aura T3'),       facade:'04_AURA_TORREA3_FACHADA.jpeg',
    body: bd('Aura Torre 3, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Brickell',       dir: path.join(BASE,'2026-08-19-Brickell'),      facade:'01_-_Fachada_noturna.jpeg',
    body: bd('Brickell, Patrimar em BH. Apartamentos de alto padrão entregues com fachada noturna. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Duo Cortona',    dir: path.join(BASE,'2026-08-19-Duo Cortona'),   facade:'00_DUO_FACHADA_-_COLOCAR_ESSA_COMO_FOTO_DO_PERFIL_LA_EM_CIMA.jpeg',
    body: bd('Duo Cortona, Patrimar em BH. Empreendimento duplo de alto padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Epic',           dir: path.join(BASE,'2026-08-19-Epic'),          facade:'308_EPC_01_Fachada_EF_V2_29-05-2019.jpeg',
    body: bd('Epic, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'José Torres Franco', dir: path.join(BASE,'2026-08-19-José Torres Franco'), facade:'2_Pavimento(2).jpeg',
    body: bd('José Torres Franco, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Le Sommet',      dir: path.join(BASE,'2026-08-19-Le Sommet'),     facade:'1_-_Fachada.jpeg',
    body: bd('Le Sommet, Patrimar em BH. Apartamentos de altíssimo padrão entregues com fachada elegante. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Madison Square', dir: path.join(BASE,'2026-08-19-Madison Square'),facade:'01_-_FACHADA.jpeg',
    body: bd('Madison Square, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Montano Antilia',dir: path.join(BASE,'2026-08-19-Montano Antilia'),facade:'01__Fachada_noturna.jpeg',
    body: bd('Montano Antilia, Patrimar em BH. Apartamentos de altíssimo padrão entregues com fachada noturna. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Place Dauphine', dir: path.join(BASE,'2026-08-19-Place Dauphine'),facade:'1__Fachada_diurna.jpeg',
    body: bd('Place Dauphine, Patrimar em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Place Vendôme',  dir: path.join(BASE,'2026-08-19-Place Vendôme'), facade:'4__Fachada_diurna.jpeg',
    body: bd('Place Vendôme, Patrimar em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Skyline',        dir: path.join(BASE,'2026-08-19-Skyline'),       facade:'FACHADA_NOTURNA.jpeg',
    body: bd('Skyline, Patrimar em BH. Apartamentos de alto padrão entregues com fachada noturna e garden. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Unique Nord - T2',dir: path.join(BASE,'2026-08-19-Unique Nord - T2'),facade:'Acesso_ao_apartamento(2).jpeg',
    body: bd('Unique Nord Torre 2, Patrimar em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Unique Sud - T1', dir: path.join(BASE,'2026-08-19-Unique Sud - T1'), facade:'Apartamento_tipo_-_torre_NORD.jpeg',
    body: bd('Unique Sud Torre 1, Patrimar em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Vision',          dir: path.join(BASE,'2026-08-19-Vision'),       facade:'PATRIMAR_MARQUESDEMARICA_FACHADADIAjpg.jpeg',
    body: bd('Vision, Patrimar em BH. Apartamentos de alto padrão entregues na Rua Marquês de Maricá. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Étoile Nord - T2',dir: path.join(BASE,'2026-08-19-Étoile Nord - T2'),facade:'1_-_Fachada_torres.jpeg',
    body: bd('Étoile Nord Torre 2, Patrimar em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Étoile Sud - T1', dir: path.join(BASE,'2026-08-19-Étoile Sud - T1'), facade:'1_-_Fachada_torres.jpeg',
    body: bd('Étoile Sud Torre 1, Patrimar em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Patrimar — 18 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Patrimar', razao_social:'Patrimar Empreendimentos Imobiliários', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ Patrimar concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
