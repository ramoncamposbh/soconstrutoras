/**
 * cadastrar-lage.js — LAGE (12 empreendimentos)
 *   Todos entregues e esgotados (status: 'pronto', preco_min: null)
 *   Casa Rubaiyat, Chicago, Edifício Copenhagen, Invicto, Jardim da Torre,
 *   Living Cidade Nova, Mandala, Millennial, Portofino, Riviera Sion,
 *   Rooftop Cidade Nova, Unique Santo Antônio
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'lage@soconstrutoras.com.br';
const SENHA = 'LAGE@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\LAGE';

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
    nome:   'Casa Rubaiyat',
    dir:    path.join(BASE, '2026-08-18-Casa Rubaiyat'),
    facade: 'Fachada_R_Laranjal.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Casa Rubaiyat na Rua Laranjal, Anchieta, Belo Horizonte. Empreendimento de alto padrão LAGE entregue com apartamentos, duplex e cobertura. Lazer exclusivo, acabamento superior. Unidades esgotadas.',
      endereco:'Rua Laranjal', bairro:'Anchieta', cidade:'Belo Horizonte', estado:'MG', cep:'30310-490',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Chicago',
    dir:    path.join(BASE, '2026-08-18-Chicago'),
    facade: 'Pilotis.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Chicago na Rua Cardeal Stepinac, Cidade Nova, Belo Horizonte. Apartamentos de 3 e 4 quartos com cobertura. Lazer completo com piscina, espaço gourmet e fitness. Unidades esgotadas.',
      endereco:'Rua Cardeal Stepinac', bairro:'Cidade Nova', cidade:'Belo Horizonte', estado:'MG', cep:'31170-120',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Edifício Copenhagen',
    dir:    path.join(BASE, '2026-08-18-Edifício Copenhagen'),
    facade: 'LAGE_12_IMG_A_FOTOINSERCAO_V01.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Edifício Copenhagen na Rua Professor Lincoln Continentino, Cidade Nova, Belo Horizonte. Apartamentos de alto padrão LAGE entregues com design contemporâneo. Lazer exclusivo. Unidades esgotadas.',
      endereco:'Rua Professor Lincoln Continentino', bairro:'Cidade Nova', cidade:'Belo Horizonte', estado:'MG', cep:'31170-120',
      area_min:70, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Invicto',
    dir:    path.join(BASE, '2026-08-18-Invicto'),
    facade: 'fachada_blow.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Invicto na Rua Angustura, Serra, Belo Horizonte. Empreendimento LAGE de alto padrão entregue com apartamentos de 2 a 4 quartos e coberturas. Localização privilegiada na Serra. Unidades esgotadas.',
      endereco:'Rua Angustura', bairro:'Serra', cidade:'Belo Horizonte', estado:'MG', cep:'30220-160',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Jardim da Torre',
    dir:    path.join(BASE, '2026-08-18-Jardim da Torre'),
    facade: 'fachada_jardim_da_torre.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Jardim da Torre na Rua Conselheiro Lafaiete, 1940, Sagrada Família, Belo Horizonte. Apartamentos de alto padrão LAGE entregues com lazer completo e acabamento superior. Unidades esgotadas.',
      endereco:'Rua Conselheiro Lafaiete, 1940', bairro:'Sagrada Família', cidade:'Belo Horizonte', estado:'MG', cep:'31035-050',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Living Cidade Nova',
    dir:    path.join(BASE, '2026-08-18-Living Cidade Nova'),
    facade: 'LAGE_24_IMG_FACHADA_01_V04.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Living Cidade Nova na Rua Pimenta da Veiga, 90, Cidade Nova, Belo Horizonte. Apartamentos LAGE entregues com piscina, espaço gourmet e fitness. Localização estratégica na Cidade Nova. Unidades esgotadas.',
      endereco:'Rua Pimenta da Veiga, 90', bairro:'Cidade Nova', cidade:'Belo Horizonte', estado:'MG', cep:'31170-170',
      area_min:60, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:2,
    },
  },
  {
    nome:   'Mandala',
    dir:    path.join(BASE, '2026-08-18-Mandala'),
    facade: 'Pilotis.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Mandala na Rua Nelson Soares de Faria, 175, Cidade Nova, Belo Horizonte. Apartamentos com área privativa e cobertura LAGE entregues. Lazer com piscina, sauna e espaço gourmet. Unidades esgotadas.',
      endereco:'Rua Nelson Soares de Faria, 175', bairro:'Cidade Nova', cidade:'Belo Horizonte', estado:'MG', cep:'31170-120',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Millennial',
    dir:    path.join(BASE, '2026-08-18-Millennial'),
    facade: 'Portaria.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Millennial na Avenida Bandeirantes, Belo Horizonte. Apartamentos de 2 quartos com área privativa, LAGE entregues. Lazer com piscina, fitness e espaço gourmet. Unidades esgotadas.',
      endereco:'Avenida Bandeirantes', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30350-170',
      area_min:60, area_max:150, preco_min:null, preco_max:null, quartos_min:2, quartos_max:2, vagas:2,
    },
  },
  {
    nome:   'Portofino',
    dir:    path.join(BASE, '2026-08-18-Portofino'),
    facade: 'IMG_7407.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Portofino na Rua São Claret, Silveira, Belo Horizonte. Empreendimento LAGE de alto padrão entregue com apartamentos tipo e coberturas. Lazer exclusivo com piscina e área gourmet. Unidades esgotadas.',
      endereco:'Rua São Claret', bairro:'Silveira', cidade:'Belo Horizonte', estado:'MG', cep:'31140-220',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Riviera Sion',
    dir:    path.join(BASE, '2026-08-18-Riviera Sion'),
    facade: 'Fachada_diurna.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Riviera Sion na Rua Pium-I, Cruzeiro, Belo Horizonte. Empreendimento LAGE de alto padrão entregue, com apartamentos e coberturas em um dos bairros mais valorizados de BH. Unidades esgotadas.',
      endereco:'Rua Pium-I', bairro:'Cruzeiro', cidade:'Belo Horizonte', estado:'MG', cep:'30310-020',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Rooftop Cidade Nova',
    dir:    path.join(BASE, '2026-08-18-Rooftop Cidade Nova'),
    facade: 'achada_rooftop.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Rooftop Cidade Nova na Rua Dr. Júlio Otaviano Ferreira, Cidade Nova, Belo Horizonte. Apartamentos com área privativa e cobertura LAGE entregues. Destaque para o rooftop exclusivo com piscina e espaço gourmet. Unidades esgotadas.',
      endereco:'Rua Doutor Júlio Otaviano Ferreira', bairro:'Cidade Nova', cidade:'Belo Horizonte', estado:'MG', cep:'31170-120',
      area_min:70, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:2,
    },
  },
  {
    nome:   'Unique Santo Antônio',
    dir:    path.join(BASE, '2026-08-18-Unique Santo Antônio'),
    facade: 'LAGE_22_IMG_FACHADA_02_FINAL_(1).jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Unique Santo Antônio no bairro Santo Antônio, Belo Horizonte. Empreendimento LAGE de alto padrão entregue com apartamentos e coberturas em uma das regiões mais valorizadas da cidade. Unidades esgotadas.',
      endereco:'Santo Antônio', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30330-240',
      area_min:80, area_max:350, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  LAGE — 12 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'LAGE',
        razao_social:'LAGE Empreendimentos Imobiliários', role:'construtora' }),
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

  console.log('\n✅ LAGE concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
