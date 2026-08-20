/**
 * cadastrar-mrv.js — MRV (9 empreendimentos — todos vendidos)
 *   Villa d'Oro tem apenas PDFs (sem fotos disponíveis)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'mrv@soconstrutoras.com.br';
const SENHA = 'MRV@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\MRV';

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

const bd = (desc, end, bairro, cep) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco: end, bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:45, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1,
});

const EMPS = [
  { nome:"Villa d'Oro",          dir: path.join(BASE,"2026-08-19- Villa d'Oro"),          facade: null,
    body: bd("Villa d'Oro MRV em BH. Apartamentos com área privativa entregues. Unidades esgotadas.", "Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Cachoeira dos Anjos',   dir: path.join(BASE,'2026-08-19-Cachoeira dos Anjos'),   facade:'Apartamento_com_area_privativa_-_ponta.jpeg',
    body: bd('Cachoeira dos Anjos MRV em BH. Apartamentos com área privativa e ponta entregues. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Mata Das Castanheiras', dir: path.join(BASE,'2026-08-19-Mata Das Castanheiras'), facade:'MATA_DAS_CASTANHEIRAS_PPC_FACHADA_202516012cdda1b6-0b1c-4f8f-999e-f9006d023382.jpeg',
    body: bd('Mata das Castanheiras MRV em BH. Condomínio fechado com fachada verde entregue. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Mata das Orquídeas',    dir: path.join(BASE,'2026-08-19-Mata das Orquídeas'),    facade:'MRV_MTA_D_ORQUIDEAS_FACHADA_20260305.jpeg',
    body: bd('Mata das Orquídeas MRV em BH. Condomínio verde entregue. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Mirante do Castelo',    dir: path.join(BASE,'2026-08-19-Mirante do Castelo'),    facade:'Apartamento_terreo_-_ponta.jpeg',
    body: bd('Mirante do Castelo MRV em BH. Apartamentos térrea e ponta entregues. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Moradas Do Sol',        dir: path.join(BASE,'2026-08-19-Moradas Do Sol'),        facade:'Apartamento_com_area_privativa.jpeg',
    body: bd('Moradas do Sol MRV em BH. Apartamentos com área privativa entregues. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Parque Canoas',         dir: path.join(BASE,'2026-08-19-Parque Canoas'),         facade:'PPC_FACHADA_GUARITA_PARQUE_CANOAS_20240409c9ce6e78-f184-41f4-bdbe-a017c15bbad4.jpeg',
    body: bd('Parque Canoas MRV em BH. Condomínio fechado com guarita e lazer entregue. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Residencial Montana',   dir: path.join(BASE,'2026-08-19-Residencial Montana'),   facade:'Apartamento_com_area_privativa.jpeg',
    body: bd('Residencial Montana MRV em BH. Apartamentos com área privativa entregues. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
  { nome:'Villa Fiori',           dir: path.join(BASE,'2026-08-19-Villa Fiori'),           facade:'Apartamento_com_area_privativa_-_meio.jpeg',
    body: bd('Villa Fiori MRV em BH. Apartamentos com área privativa entregues. Unidades esgotadas.',"Belo Horizonte","Belo Horizonte","30000-000") },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MRV — 9 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'MRV', razao_social:'MRV Engenharia e Participações', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ MRV concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
