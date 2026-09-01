/**
 * cadastrar-lcg.js — LCG (2 empreendimentos)
 *   Denver      — Vale do Sereno, Nova Lima/MG  (5 unidades disponíveis)
 *   Dom Henrique — Vale do Sereno, Nova Lima/MG (sem unidades)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'lcg@soconstrutoras.com.br';
const SENHA = 'LCG@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\LCG';

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
async function criarUnidades(TOKEN, EMP_ID, unidades) {
  if (!unidades.length) return;
  const ur = await api(`/unidades/empreendimentos/${EMP_ID}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  const mp = {}; for (const u of (Array.isArray(ur.data) ? ur.data : [])) mp[u.nome] = u;
  for (const u of unidades) {
    if (mp[u.nome]) { console.log(`    ✓ ${u.nome}`); continue; }
    const res = await api(`/unidades/empreendimentos/${EMP_ID}`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}`},
      body: JSON.stringify({ nome:u.nome, tipo:u.tipo,
        metragem_privativa:u.m2, quartos:u.q, vagas:u.v, preco:u.preco, disponivel:true }),
    });
    if (res.data?.id) { mp[u.nome] = res.data; console.log(`    ✅ ${u.nome}`); }
    else console.log(`    ✗ ${u.nome}: ${JSON.stringify(res.data)}`);
    await sleep(300);
  }
}
async function uploadImagens(TOKEN, empId, dir, facade) {
  const det = await api(`/empreendimentos/${empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  if (!fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
  const all = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|jpg)$/i.test(f));
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
    method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`},
  });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome: 'Denver',
    dir:  path.join(BASE, '2026-08-18-Denver'),
    facade: 'Fachada.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Denver no Vale do Sereno, Nova Lima. Apartamentos de alto padrão de 208m², 4 quartos e 4 vagas. Lazer completo com piscina, beach tennis, fitness, gourmet, salão de festas e guarita. Localização privilegiada no Vale do Sereno.',
      endereco:'Rua das Acácias', bairro:'Vale do Sereno', cidade:'Nova Lima', estado:'MG', cep:'34000-000',
      area_min:208, area_max:208, preco_min:3525500, preco_max:4100000, quartos_min:4, quartos_max:4, vagas:4,
    },
    unidades:[
      { nome:'Apto 201',  tipo:'apartamento', m2:208, q:4, v:4, preco:3525500 },
      { nome:'Apto 202',  tipo:'apartamento', m2:208, q:4, v:4, preco:3525500 },
      { nome:'Apto 1601', tipo:'apartamento', m2:208, q:4, v:4, preco:3925000 },
      { nome:'Apto 2001', tipo:'apartamento', m2:208, q:4, v:4, preco:3950000 },
      { nome:'Apto 2501', tipo:'apartamento', m2:208, q:4, v:4, preco:4100000 },
    ],
  },
  {
    nome: 'Dom Henrique',
    dir:  path.join(BASE, '2026-08-18-Dom henrique'),
    facade: 'Fachada-Dom-Henrique-Residencial-886x1200.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Dom Henrique no Vale do Sereno, Nova Lima. Empreendimento de alto padrão entregue. Apartamentos sofisticados com piscina de raia coberta, quadra de tênis de saibro, fitness e lazer completo.',
      endereco:'Rua das Acácias', bairro:'Vale do Sereno', cidade:'Nova Lima', estado:'MG', cep:'34000-000',
      area_min:100, area_max:300, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:3,
    },
    unidades:[],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  LCG — 2 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'LCG',
        razao_social:'LCG Empreendimentos', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await criarUnidades(TOKEN, e.id, emp.unidades);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }

  console.log('\n✅ LCG concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
