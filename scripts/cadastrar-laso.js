/**
 * cadastrar-laso.js — Laso Engenharia (3 empreendimentos)
 *   Dorion Residences  — Palmares, BH    (3 lojas disponíveis)
 *   Painite            — BH              (sem unidades — vendido)
 *   Solarium Pampulha  — Paquetá, BH    (sem unidades — vendido)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'laso@soconstrutoras.com.br';
const SENHA = 'LASO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Laso Engenharia';

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
  const plantas = all.filter(f => f.toLowerCase().includes('planta') || f.toLowerCase().includes('mapa_planta'));
  const fotos   = all.filter(f => !plantas.includes(f));
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
    nome: 'Dorion Residences',
    dir:  path.join(BASE, '2026-08-18-Dorion Residences'),
    facade: 'DO_FINAL_Fachada_-_HORIZONTAL_02-min.jpeg',
    body: {
      tipo:'comercial', status:'lancamento',
      descricao:'Dorion Residences na Rua Nestor Soares de Melo, Palmares, Belo Horizonte. Lojas comerciais de 73 a 123m² disponíveis. Empreendimento misto com unidades residenciais entregues e lojas no térreo. Cobertura com piscina e espaço gourmet.',
      endereco:'Rua Nestor Soares de Melo', bairro:'Palmares', cidade:'Belo Horizonte', estado:'MG', cep:'30870-040',
      area_min:73.20, area_max:123.46, preco_min:639277, preco_max:1069560, quartos_min:0, quartos_max:0, vagas:0,
    },
    unidades:[
      { nome:'Loja 1', tipo:'comercial', m2:103.65, q:0, v:0, preco:897447  },
      { nome:'Loja 2', tipo:'comercial', m2:123.46, q:0, v:0, preco:1069560 },
      { nome:'Loja 3', tipo:'comercial', m2:73.20,  q:0, v:0, preco:639277  },
    ],
  },
  {
    nome: 'Painite',
    dir:  path.join(BASE, '2026-08-18-Painite'),
    facade: '1.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Painite na Rua Arapé, 290, Belo Horizonte. Empreendimento de alto padrão entregue com duplex, área privativa e cobertura. Garagem dupla, lazer exclusivo. Unidades esgotadas.',
      endereco:'Rua Arapé, 290', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'31170-000',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
    unidades:[],
  },
  {
    nome: 'Solarium Pampulha',
    dir:  path.join(BASE, '2026-08-18-Solarium Pampulha'),
    facade: '2021-058-IMAGEM_c_1_-_NOVA.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Solarium Pampulha na Avenida Presidente Tancredo Neves, Paquetá, Belo Horizonte. Empreendimento de alto padrão entregue com apartamentos tipo, área privativa e cobertura duplex. Localização privilegiada na Pampulha.',
      endereco:'Avenida Presidente Tancredo Neves', bairro:'Paquetá', cidade:'Belo Horizonte', estado:'MG', cep:'31330-370',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
    unidades:[],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Laso Engenharia — 3 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Laso Engenharia',
        razao_social:'Laso Engenharia Empreendimentos', role:'construtora' }),
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

  console.log('\n✅ Laso Engenharia concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
