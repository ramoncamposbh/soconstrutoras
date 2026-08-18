/**
 * cadastrar-f2.js — F2 Incorporadora (conta única: f2@soconstrutoras.com.br)
 *
 * Empreendimentos F2:
 *   Alma Aramis     — Maraú/BA          (1 casa)
 *   Aura Leopoldina — Santo Antônio, BH (sem unidades)
 *   Aurum           — Serra, BH         (sem unidades)
 *   Casa Ferolla    — Santo Antônio, BH (sem unidades)
 *   Hércules        — Serra, BH         (6 unidades)
 *   ÂMBAR           — Serra, BH         (sem unidades)
 *
 * Empreendimentos LUME (sub-marca, mesma conta):
 *   La Place           — Santa Lúcia, BH     (sem unidades)
 *   Terrace Santa Lúcia— Santa Lúcia, BH     (4 unidades)
 *   Vietri (Lume)      — Santa Lúcia, BH     (1 unidade) [coproduçao com Capanema]
 *   Walk Funcionários  — Boa Viagem, BH      (sem unidades)
 *   Walk Lourdes       — Lourdes, BH         (8 unidades)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'f2@soconstrutoras.com.br';
const SENHA = 'F2@2026';
const BASE_F2   = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\F2';
const BASE_LUME = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\F2\\2026-08-18-Lume';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function glob(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f)).map(f => path.join(dir, f));
}
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
async function upLista(ep, files, tipo, TOKEN) {
  let ok = 0;
  for (const f of files) { if (await uploadFoto(ep, f, tipo, TOKEN)) ok++; await sleep(400); }
  return ok;
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
async function fotosEmp(TOKEN, empId, dir) {
  const det = await api(`/empreendimentos/${empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  const fotos = glob(dir);
  const ok = await upLista(`/empreendimentos/${empId}/midias/upload-local`, fotos, 'foto', TOKEN);
  console.log(`  📸 ${ok}/${fotos.length}`);
}

const EMPS = [
  // ─── F2 ───────────────────────────────────────────────────────────
  { nome:'Alma Aramis',       dir:path.join(BASE_F2,'2026-08-18-Alma Aramis'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'Alma Aramis na Praia do Cassange, Maraú, Bahia. Casa de 4 suítes com 303m² em empreendimento de alto padrão à beira-mar na Costa do Dendê. Exclusividade e natureza em harmonia.',
      endereco:'Praia do Cassange', bairro:'Cassange', cidade:'Maraú', estado:'BA', cep:'45520-000',
      area_min:303.12, area_max:303.12, preco_min:5454000, preco_max:5454000, quartos_min:4, quartos_max:4, vagas:2 },
    unidades:[
      { nome:'Casa 15', tipo:'apartamento', m2:303.12, q:4, v:2, preco:5454000 },
    ] },
  { nome:'Aura Leopoldina',   dir:path.join(BASE_F2,'2026-08-18-Aura Leopoldina'),
    body:{ tipo:'apartamento', status:'pronto',
      descricao:'Aura Leopoldina na Rua Leopoldina, Santo Antônio, BH. Empreendimento de alto padrão entregue. Apartamentos sofisticados com acabamento superior.',
      endereco:'Rua Leopoldina', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30330-230',
      area_min:80, area_max:200, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:3 },
    unidades:[] },
  { nome:'Aurum',             dir:path.join(BASE_F2,'2026-08-18-Aurum'),
    body:{ tipo:'apartamento', status:'pronto',
      descricao:'Aurum na Rua do Ouro, Serra, BH. Empreendimento de alto padrão entregue no bairro Serra. Apartamentos sofisticados com lazer completo.',
      endereco:'Rua do Ouro', bairro:'Serra', cidade:'Belo Horizonte', estado:'MG', cep:'30220-230',
      area_min:80, area_max:200, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:3 },
    unidades:[] },
  { nome:'Casa Ferolla',      dir:path.join(BASE_F2,'2026-08-18-Casa Ferolla'),
    body:{ tipo:'apartamento', status:'pronto',
      descricao:'Casa Ferolla na Rua São Domingos do Prata, Santo Antônio, BH. Apartamentos de 3 suítes com 187m² e 3 vagas. Ao lado do casarão tombado Casa Ferolla, entregue montado e decorado.',
      endereco:'Rua São Domingos do Prata', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30330-190',
      area_min:187.24, area_max:187.24, preco_min:null, preco_max:null, quartos_min:3, quartos_max:3, vagas:3 },
    unidades:[] },
  { nome:'Hércules',          dir:path.join(BASE_F2,'2026-08-18-Hércules'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'Hércules na Rua do Ouro, Serra, BH. Apartments de 1-2 quartos com 35-56m² e cobertura com área externa. 1-2 vagas. Lazer completo no bairro Serra.',
      endereco:'Rua do Ouro', bairro:'Serra', cidade:'Belo Horizonte', estado:'MG', cep:'30220-230',
      area_min:35.67, area_max:77.41, preco_min:650977, preco_max:1274169, quartos_min:1, quartos_max:2, vagas:2 },
    unidades:[
      { nome:'Apto 402',      tipo:'apartamento', m2:53.87,              q:2, v:1, preco:907709  },
      { nome:'Apto 504',      tipo:'apartamento', m2:55.31,              q:2, v:2, preco:984739  },
      { nome:'Apto 908',      tipo:'apartamento', m2:35.67,              q:1, v:0, preco:650977  },
      { nome:'Apto 1006',     tipo:'apartamento', m2:35.75,              q:1, v:0, preco:661375  },
      { nome:'Apto 1008',     tipo:'apartamento', m2:35.67,              q:1, v:0, preco:659895  },
      { nome:'Cobertura 1205',tipo:'cobertura',   m2:56.07, ext:21.34,   q:1, v:1, preco:1274169 },
    ] },
  { nome:'ÂMBAR',             dir:path.join(BASE_F2,'2026-08-18-ÂMBAR'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'ÂMBAR na Rua Bernardo Figueiredo, 63, Serra, BH. Apartamentos de 3 quartos com 90 a 180m² e 2 vagas. Entrega prevista julho/2027.',
      endereco:'Rua Bernardo Figueiredo, 63', bairro:'Serra', cidade:'Belo Horizonte', estado:'MG', cep:'30220-110',
      area_min:90, area_max:180, preco_min:null, preco_max:null, quartos_min:3, quartos_max:3, vagas:2 },
    unidades:[] },
  // ─── LUME ──────────────────────────────────────────────────────────
  { nome:'La Place',             dir:path.join(BASE_LUME,'2026-08-18-La Place'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'La Place na Rua Laplace, Santa Lúcia, BH. Empreendimento Lume de alto padrão em localização nobre. Apartamentos sofisticados com lazer completo.',
      endereco:'Rua Laplace', bairro:'Santa Lúcia', cidade:'Belo Horizonte', estado:'MG', cep:'30360-320',
      area_min:80, area_max:250, preco_min:null, preco_max:null, quartos_min:3, quartos_max:4, vagas:3 },
    unidades:[] },
  { nome:'Terrace Santa Lúcia',  dir:path.join(BASE_LUME,'2026-08-18-Terrace Santa Lúcia'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'Terrace Santa Lúcia na Rua Arrudas, Santa Lúcia, BH. Apartamentos de 3-4 quartos com 118-297m² e cobertura duplex com terraço de 116m². 2-3 vagas. Lume.',
      endereco:'Rua Arrudas', bairro:'Santa Lúcia', cidade:'Belo Horizonte', estado:'MG', cep:'30360-120',
      area_min:118.45, area_max:413.22, preco_min:2006723, preco_max:4848082, quartos_min:3, quartos_max:4, vagas:3 },
    unidades:[
      { nome:'Apto 501',     tipo:'apartamento', m2:121.62,              q:3, v:2, preco:2021346 },
      { nome:'Apto 802',     tipo:'apartamento', m2:154.27,              q:4, v:3, preco:2538775 },
      { nome:'Apto 1201',    tipo:'apartamento', m2:118.45,              q:3, v:2, preco:2006723 },
      { nome:'Cob 1402',     tipo:'cobertura',   m2:297.22, ext:116.80,  q:4, v:3, preco:4848082 },
    ] },
  { nome:'Vietri Lume',          dir:path.join(BASE_LUME,'2026-08-18-Vietri'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'Vietri Lume na Rua Planetóides, Santa Lúcia, BH. Apartamento de 4 quartos com 142m² e 3 vagas. Localização privilegiada em Santa Lúcia. Lume.',
      endereco:'Rua Planetóides', bairro:'Santa Lúcia', cidade:'Belo Horizonte', estado:'MG', cep:'30380-535',
      area_min:142.19, area_max:142.19, preco_min:2744000, preco_max:2744000, quartos_min:4, quartos_max:4, vagas:3 },
    unidades:[
      { nome:'Apto 302', tipo:'apartamento', m2:142.19, q:4, v:3, preco:2744000 },
    ] },
  { nome:'Walk Funcionários',    dir:path.join(BASE_LUME,'2026-08-18-Walk Funcionários'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'Walk Funcionários na Rua dos Aimorés, Boa Viagem, BH. Empreendimento Lume com localização privilegiada próximo ao Diamond Mall e Minas Tênis Clube.',
      endereco:'Rua dos Aimorés', bairro:'Boa Viagem', cidade:'Belo Horizonte', estado:'MG', cep:'30140-070',
      area_min:30, area_max:120, preco_min:null, preco_max:null, quartos_min:1, quartos_max:2, vagas:1 },
    unidades:[] },
  { nome:'Walk Lourdes',         dir:path.join(BASE_LUME,'2026-08-18-Walk Lourdes'),
    body:{ tipo:'apartamento', status:'lancamento',
      descricao:'Walk Lourdes na Rua Rio de Janeiro, Lourdes, BH. Studios de 27m² e apartamentos de 1-2 quartos com 34-60m². 1 vaga. A metros do Diamond Mall. Lume.',
      endereco:'Rua Rio de Janeiro', bairro:'Lourdes', cidade:'Belo Horizonte', estado:'MG', cep:'30160-040',
      area_min:27.54, area_max:60.90, preco_min:546817, preco_max:1140048, quartos_min:1, quartos_max:2, vagas:1 },
    unidades:[
      { nome:'Apto 705',  tipo:'studio',      m2:34.07, q:1, v:0, preco:662934  },
      { nome:'Apto 805',  tipo:'studio',      m2:34.07, q:1, v:0, preco:669698  },
      { nome:'Apto 1006', tipo:'studio',      m2:27.54, q:1, v:0, preco:546817  },
      { nome:'Apto 1601', tipo:'apartamento', m2:60.56, q:2, v:1, preco:1133683 },
      { nome:'Apto 1603', tipo:'apartamento', m2:60.90, q:2, v:1, preco:1140048 },
      { nome:'Apto 1701', tipo:'apartamento', m2:60.56, q:2, v:1, preco:1133683 },
      { nome:'Apto 1801', tipo:'apartamento', m2:60.56, q:2, v:1, preco:1133683 },
      { nome:'Apto 1901', tipo:'apartamento', m2:60.56, q:2, v:1, preco:1133683 },
    ] },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  F2 + LUME — 11 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'F2 Incorporadora',
        razao_social:'F2 Incorporadora e Construtora', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  for (const e of EMPS) {
    console.log(`\n── ${e.nome}`);
    const emp = await criarOuBuscar(TOKEN, e.nome, e.body);
    if (e.unidades.length) {
      console.log('  Unidades...');
      await criarUnidades(TOKEN, emp.id, e.unidades);
    }
    await fotosEmp(TOKEN, emp.id, e.dir);
    await api(`/empreendimentos/${emp.id}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
    console.log('  🚀 Publicado');
  }
  console.log('\n✨ F2 + LUME concluído!');
}

module.exports = { main };
if (require.main === module) main().catch(console.error);
