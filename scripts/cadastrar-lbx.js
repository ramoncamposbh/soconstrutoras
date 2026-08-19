/**
 * cadastrar-lbx.js — LBX Gestão de Negócios (2 empreendimentos)
 *   Serra Morena         — Jaboticatubas/MG  (loteamento, sem unidades residenciais)
 *   Vila Castela 2ª Fase — Nova Lima/MG      (condomínio de casas, sem unidades)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'lbx@soconstrutoras.com.br';
const SENHA = 'LBX@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\LBX Gestão de Negócios';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}
async function uploadFoto(ep, file, tipo, TOKEN) {
  if (!fs.existsSync(file)) return null;
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], { type: 'image/jpeg' }), path.basename(file));
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
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  if (!fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
  const all = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|jpg)$/i.test(f));
  // Exclude mp4 videos (glob only images)
  const plantas = all.filter(f => f.toLowerCase().includes('planta'));
  const fotos   = all.filter(f => !f.toLowerCase().includes('planta'));
  const ordered = facade ? [facade, ...fotos.filter(f => f !== facade)] : fotos;
  let ok = 0;
  for (const f of ordered) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir,f), 'foto', TOKEN)) ok++;
    await sleep(400);
  }
  for (const f of plantas) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir,f), 'planta', TOKEN)) ok++;
    await sleep(400);
  }
  console.log(`  📸 ${ok}/${all.length}`);
}
async function publicar(TOKEN, empId) {
  const r = await api(`/empreendimentos/${empId}/publicar`, {
    method:'POST', headers:{Authorization:`Bearer ${TOKEN}`},
  });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome: 'Serra Morena',
    dir:  path.join(BASE, '2026-08-18-Serra Morena'),
    facade: 'Lagoa45.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Serra Morena na Rodovia MG-020 km 56, Jaboticatubas/MG. Loteamento com lotes a partir de 1.000m² em meio à natureza. Área de lazer com churrasqueira, playground, quadra, salão de festas e academia ao ar livre. Vista para lagoa e montanhas.',
      endereco:'Rodovia MG 020, km 56', bairro:'Zona Rural', cidade:'Jaboticatubas', estado:'MG', cep:'33060-000',
      area_min:1000, area_max:1600, preco_min:207000, preco_max:322000, quartos_min:null, quartos_max:null, vagas:null,
    },
    unidades:[],
  },
  {
    nome: 'Vila Castela 2ª Fase',
    dir:  path.join(BASE, '2026-08-18-Vila Castela 2ª Fase'),
    facade: 'Clube_Vila_Catela_1-_Fachada_Frontal.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Vila Castela 2ª Fase em Nova Lima, um dos bairros mais valorizados de Minas Gerais. Condomínio de casas com clube completo: piscina, quadra, playground, portaria com acesso controlado. Fácil acesso à MG-030.',
      endereco:'Condomínio Vila Castela', bairro:'Vila Castela', cidade:'Nova Lima', estado:'MG', cep:'34006-490',
      area_min:150, area_max:500, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:2,
    },
    unidades:[],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  LBX Gestão de Negócios — 2 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');

  let TOKEN;
  const login = await api('/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email:EMAIL, password:SENHA }),
  });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'LBX Gestão de Negócios',
        razao_social:'LBX Gestão de Negócios Empreendimentos', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }

  console.log('\n✅ LBX concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
