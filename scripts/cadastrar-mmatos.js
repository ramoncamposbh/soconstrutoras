/**
 * cadastrar-mmatos.js — M. Matos (7 empreendimentos)
 *   Todos entregues e esgotados (status: 'pronto', preco_min: null)
 *   Ballesteros, ED. ALESSANDRA MATOS, ED. BRISA DE LUXEMBURGO - AVULSO,
 *   Eldorado Office, José Alípio, Premiatto, Rosa Gropen
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'mmatos@soconstrutoras.com.br';
const SENHA = 'MMATOS@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\M. Matos';

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
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  if (!fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
  const all    = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|jpg)$/i.test(f));
  const plantas = all.filter(f => f.toLowerCase().includes('planta'));
  const fotos   = all.filter(f => !f.toLowerCase().includes('planta'));
  const ordered = facade ? [facade, ...fotos.filter(f => f !== facade)] : fotos;
  let ok = 0;
  for (const f of ordered) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir, f), 'foto', TOKEN)) ok++;
    await sleep(400);
  }
  for (const f of plantas) {
    if (await uploadFoto(`/empreendimentos/${empId}/midias/upload-local`, path.join(dir, f), 'planta', TOKEN)) ok++;
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
    nome:   'Ballesteros',
    dir:    path.join(BASE, '2026-08-18-Ballesteros'),
    facade: 'Fachada.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Ballesteros na Rua Tupis, 1193, Centro, Belo Horizonte. Edifício residencial M. Matos com apartamentos de 1 quarto e lojas no térreo. Espaço gourmet e lazer. Localização central privilegiada. Unidades esgotadas.',
      endereco:'Rua Tupis, 1193', bairro:'Centro', cidade:'Belo Horizonte', estado:'MG', cep:'30190-060',
      area_min:30, area_max:100, preco_min:null, preco_max:null, quartos_min:1, quartos_max:2, vagas:1,
    },
  },
  {
    nome:   'ED. ALESSANDRA MATOS',
    dir:    path.join(BASE, '2026-08-18-ED. ALESSANDRA MATOS'),
    facade: 'Fachada_principal.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Edifício Alessandra Matos, empreendimento residencial M. Matos em Belo Horizonte. Apartamentos tipo com suite e hall social. Acabamento de qualidade. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:60, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1,
    },
  },
  {
    nome:   'ED. BRISA DE LUXEMBURGO - AVULSO',
    dir:    path.join(BASE, '2026-08-18-ED. BRISA DE LUXEMBURGO - AVULSO'),
    facade: 'ED_BRISA_DE_LUXEMBURGO(2).jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Edifício Brisa de Luxemburgo no bairro Luxemburgo, Belo Horizonte. Empreendimento M. Matos com apartamentos de alto padrão entregues. Lazer com piscina, pilotis e espaço gourmet. Unidades esgotadas.',
      endereco:'Luxemburgo', bairro:'Luxemburgo', cidade:'Belo Horizonte', estado:'MG', cep:'30380-490',
      area_min:70, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Eldorado Office',
    dir:    path.join(BASE, '2026-08-18-Eldorado Office'),
    facade: 'Fachada.jpeg',
    body: {
      tipo:'comercial', status:'pronto',
      descricao:'Eldorado Office, empreendimento comercial M. Matos em Belo Horizonte. Salas comerciais com garagem em subsolo e segundo pavimento. Localização estratégica para negócios. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:30, area_max:200, preco_min:null, preco_max:null, quartos_min:0, quartos_max:0, vagas:1,
    },
  },
  {
    nome:   'José Alípio',
    dir:    path.join(BASE, '2026-08-18-José Alípio'),
    facade: 'Fachada.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'José Alípio na Rua Maria Macêdo, 420, Belo Horizonte. Empreendimento M. Matos com apartamentos tipo e coberturas. Lazer com piscina com prainha, espaço gourmet, fitness, sauna e bicicletário. Unidades esgotadas.',
      endereco:'Rua Maria Macêdo, 420', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Premiatto',
    dir:    path.join(BASE, '2026-08-18-Premiatto'),
    facade: 'Fachada_Principal.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Premiatto na Rua Curitiba, 1677, Lourdes, Belo Horizonte. Empreendimento M. Matos de alto padrão com apartamentos por pavimento. Academia no pilotis e espaço gourmet. Localização nobre no Lourdes. Unidades esgotadas.',
      endereco:'Rua Curitiba, 1677', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30170-120',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Rosa Gropen',
    dir:    path.join(BASE, '2026-08-18-Rosa Gropen'),
    facade: 'fachada.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Rosa Gropen, empreendimento M. Matos de alto padrão em Belo Horizonte. Apartamentos tipo, sala de estar e cobertura com terraço. Lazer completo com fitness, sauna, piscina, espaço gourmet, kids e salão de festas. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:80, area_max:350, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  M. Matos — 7 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'M. Matos',
        razao_social:'M. Matos Empreendimentos Imobiliários', role:'construtora' }),
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

  console.log('\n✅ M. Matos concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
