/**
 * cadastrar-mip.js — MIP (7 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'mip@soconstrutoras.com.br';
const SENHA = 'MIP@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\MIP';

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

const EMPS = [
  {
    nome: 'Alvarenga 594',
    dir:  path.join(BASE, '2026-08-19-Alvarenga 594'),
    facade: 'Fachada_15.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Alvarenga 594, MIP em Belo Horizonte. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Rua Alvarenga, 594', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
  {
    nome: 'Aura by MIP',
    dir:  path.join(BASE, '2026-08-19-Aura by MIP'),
    facade: '23018_MIP_Paracatu_02_FachadaNoturna_R01_alta.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Aura by MIP na Rua Paracatu, Savassi, Belo Horizonte. Apartamentos de alto padrão entregues com fachada noturna. Unidades esgotadas.',
      endereco:'Rua Paracatu', bairro:'Savassi', cidade:'Belo Horizonte', estado:'MG', cep:'30140-040',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
  {
    nome: 'Fazendas Terras de Minas',
    dir:  path.join(BASE, '2026-08-19-Fazendas Terras de Minas'),
    facade: '25022_MIP_TerrasDeMinasII_01_Entrada_Guarita_R02_alta.jpeg',
    body: { tipo:'apartamento', status:'lancamento', descricao:'Fazendas Terras de Minas, MIP. Condomínio de fazendas em Minas Gerais com entrada e guarita monumental. Área de lazer completa em meio à natureza.',
      endereco:'Minas Gerais', bairro:'Zona Rural', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:1000, area_max:5000, preco_min:null, preco_max:null, quartos_min:null, quartos_max:null, vagas:null },
  },
  {
    nome: 'Lourdes 1580',
    dir:  path.join(BASE, '2026-08-19-Lourdes 1580'),
    facade: 'Apartamento_tipo_01_-_4_ao_11_pavimentos.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Lourdes 1580, MIP no Lourdes, Belo Horizonte. Apartamentos de alto padrão entregues em localização nobre. Unidades esgotadas.',
      endereco:'Lourdes, 1580', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30170-000',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
  {
    nome: 'Martim 440',
    dir:  path.join(BASE, '2026-08-19-Martim 440'),
    facade: 'Adega_com_Wine_Locker.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Martim 440, MIP em Belo Horizonte. Apartamentos de altíssimo padrão com adega, wine locker e lazer exclusivo. Unidades esgotadas.',
      endereco:'Rua Martim de Carvalho, 440', bairro:'Santo Agostinho', cidade:'Belo Horizonte', estado:'MG', cep:'30190-050',
      area_min:100, area_max:400, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:3 },
  },
  {
    nome: 'S1ON by MIP',
    dir:  path.join(BASE, '2026-08-19-S1ON by MIP'),
    facade: 'Fachada_aproximada.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'S1ON by MIP em Belo Horizonte. Apartamentos de alto padrão entregues com fachada contemporânea. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
  {
    nome: 'Savassi 1022',
    dir:  path.join(BASE, '2026-08-19-Savassi 1022'),
    facade: 'Fachada_Savassi.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Savassi 1022, MIP no Savassi, Belo Horizonte. Apartamentos de alto padrão entregues na melhor localização do Savassi. Unidades esgotadas.',
      endereco:'Savassi, 1022', bairro:'Savassi', cidade:'Belo Horizonte', estado:'MG', cep:'30140-110',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MIP — 7 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'MIP', razao_social:'MIP Incorporações e Construções', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ MIP concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
