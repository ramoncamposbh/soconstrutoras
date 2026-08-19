/**
 * cadastrar-intacta.js — INTACTA (3 empreendimentos)
 *   Dopodomani        — Grajaú, BH  (6 unidades disponíveis)
 *   Ed. Bello Tramonto — Grajaú, BH  (sem unidades)
 *   Vero Residencial  — Grajaú, BH  (sem unidades)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'intacta@soconstrutoras.com.br';
const SENHA = 'INTACTA@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Intacta';

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
    method:'POST', headers:{Authorization:`Bearer ${TOKEN}`},
  });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome: 'Dopodomani',
    dir:  path.join(BASE, '2026-08-18-Dopodomani'),
    facade: 'FACHADA_PREDIO.jpeg',
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Dopodomani no Grajaú, Belo Horizonte. Apartamentos de 2 quartos com 63-67m² e 2 vagas. Lazer completo com academia, pet spa, salão de festas, coworking e espaço gourmet. Localização privilegiada no Grajaú.',
      endereco:'Rua Viamão', bairro:'Grajaú', cidade:'Belo Horizonte', estado:'MG', cep:'30431-420',
      area_min:63.73, area_max:67.10, preco_min:850000, preco_max:999000, quartos_min:2, quartos_max:2, vagas:2,
    },
    unidades:[
      { nome:'Apto 701',  tipo:'apartamento', m2:67.05, q:2, v:2, preco:850000  },
      { nome:'Apto 702',  tipo:'apartamento', m2:67.09, q:2, v:2, preco:990000  },
      { nome:'Apto 704',  tipo:'apartamento', m2:67.10, q:2, v:2, preco:955000  },
      { nome:'Apto 1004', tipo:'apartamento', m2:63.73, q:2, v:2, preco:955000  },
      { nome:'Apto 1102', tipo:'apartamento', m2:63.73, q:2, v:2, preco:970000  },
      { nome:'Apto 1202', tipo:'apartamento', m2:63.73, q:2, v:2, preco:999000  },
    ],
  },
  {
    nome: 'Ed. Bello Tramonto',
    dir:  path.join(BASE, '2026-08-18-Ed. Bello Tramonto'),
    facade: 'Maquete_Area_de_Lazer.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Ed. Bello Tramonto em Belo Horizonte. Empreendimento de alto padrão com coberturas e apartamentos tipo. Lazer completo com piscina, academia, spa, espaço gourmet, pet spa e coworking.',
      endereco:'Belo Horizonte', bairro:'Grajaú', cidade:'Belo Horizonte', estado:'MG', cep:'30430-000',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:2,
    },
    unidades:[],
  },
  {
    nome: 'Vero Residencial',
    dir:  path.join(BASE, '2026-08-18-Vero Residencial'),
    facade: 'Vero_-_Fachada_Noturna-min.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Vero Residencial na Rua Pilar, Grajaú, Belo Horizonte. Empreendimento de alto padrão com apartamentos de 2 e 3 quartos. Lazer completo com academia, espaço gourmet, piscina, pet spa, locker e espaço kids.',
      endereco:'Rua Pilar', bairro:'Grajaú', cidade:'Belo Horizonte', estado:'MG', cep:'30431-150',
      area_min:61, area_max:120, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:2,
    },
    unidades:[],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  INTACTA — 3 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'Intacta',
        razao_social:'Intacta Empreendimentos', role:'construtora' }),
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

  console.log('\n✅ INTACTA concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
