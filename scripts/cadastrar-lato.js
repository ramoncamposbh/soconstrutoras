/**
 * cadastrar-lato.js — LATO Participações (1 empreendimento)
 *   Ofélia Freitas — Santo Antônio, BH  (3 unidades disponíveis)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'lato@soconstrutoras.com.br';
const SENHA = 'LATO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\LATO';

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
        metragem_privativa:u.m2, metragem_total: u.ext ? u.m2+u.ext : undefined,
        quartos:u.q, vagas:u.v, preco:u.preco, disponivel:true }),
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
    nome: 'Ofélia Freitas',
    dir:  path.join(BASE, '2026-08-18-Ofélia Freitas'),
    facade: 'Fachada.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Ofélia Freitas na Rua Coletor Celso Werneck, Santo Antônio, Belo Horizonte. Apartamentos e coberturas com área privativa de 82 a 106m², 3 quartos e 2 vagas. Lazer completo com academia, espaço gourmet, coworking, jardim noturno e pet place.',
      endereco:'Rua Coletor Celso Werneck, 130', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30330-070',
      area_min:82.46, area_max:163.53, preco_min:1298745, preco_max:2042089, quartos_min:3, quartos_max:3, vagas:2,
    },
    unidades:[
      // 201: 82.46 int + 55.87 ext = 138.33 total (garden — área privativa)
      { nome:'Apto 201', tipo:'garden',      m2:82.46, ext:55.87, q:3, v:2, preco:1612341 },
      // 202: 82.46 sem área ext (apartamento tipo)
      { nome:'Apto 202', tipo:'apartamento', m2:82.46, q:3, v:2, preco:1298745 },
      // 402: 106.72 int + 56.81 ext = 163.53 total (garden)
      { nome:'Apto 402', tipo:'garden',      m2:106.72, ext:56.81, q:3, v:2, preco:2042089 },
    ],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  LATO Participações — 1 empreendimento');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Lato Participações',
        razao_social:'Lato Participações Empreendimentos', role:'construtora' }),
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

  console.log('\n✅ LATO concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
