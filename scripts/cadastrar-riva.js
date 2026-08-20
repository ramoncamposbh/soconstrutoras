/**
 * cadastrar-riva.js — RIVA (29 empreendimentos — todos vendidos)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'riva@soconstrutoras.com.br';
const SENHA = 'RIVA@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\RIVA';

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
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) { console.log('  ✓ fotos já existem'); return; }
  if (!dir || !fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
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
  const r = await api(`/empreendimentos/${empId}/publicar`, { method:'PATCH', headers:{Authorization:`Bearer ${TOKEN}`} });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const bd = (desc, bairro, cep, q1=2, q2=4) => ({
  tipo:'apartamento', status:'pronto', descricao: desc,
  endereco:'Belo Horizonte', bairro, cidade:'Belo Horizonte', estado:'MG', cep,
  area_min:50, area_max:300, preco_min:null, preco_max:null, quartos_min:q1, quartos_max:q2, vagas:2,
});

const EMPS = [
  { nome:'Essenza Home',
    dir: path.join(BASE,'2026-08-19  Essenza Home'), facade: null,
    body: bd('Essenza Home, RIVA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Alto Gutierrez RIVA',
    dir: path.join(BASE,'2026-08-19-Alto Gutierrez'), facade: 'fachada-Gutierrez-Riva.jpeg',
    body: bd('Alto Gutierrez, RIVA em BH. Apartamentos de alto padrão entregues no Gutierrez. Unidades esgotadas.','Gutierrez','30430-000') },
  { nome:'Be Easy',
    dir: path.join(BASE,'2026-08-19-Be Easy'), facade: '02_-_FACHADA.jpeg',
    body: bd('Be Easy, RIVA em BH. Apartamentos compactos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000',1,2) },
  { nome:'Be Up Silva Lobo Residence',
    dir: path.join(BASE,'2026-08-19-Be Up Silva Lobo Residence'), facade: 'fachada-be-up-riva.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Be Up Silva Lobo Residence, RIVA na Rua Silva Lobo, BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.',
      endereco:'Rua Silva Lobo', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:60, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'CITTÀ BENE',
    dir: path.join(BASE,'2026-08-19-CITTÀ BENE'), facade: null,
    body: bd('Città Bene, RIVA em BH. Apartamentos de alto padrão entregues com academia. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Citta Primo',
    dir: path.join(BASE,'2026-08-19-Citta Primo'), facade: 'fachada-citta-primo-riva-residencejpg.jpeg',
    body: bd('Citta Primo, RIVA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Eleva',
    dir: path.join(BASE,'2026-08-19-Eleva'), facade: 'Fachada.jpeg',
    body: bd('Eleva, RIVA em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Elo Paradise',
    dir: path.join(BASE,'2026-08-19-Elo Paradise'), facade: 'OBRA710_PE_FACHADA_2024_05_23.jpeg',
    body: bd('Elo Paradise, RIVA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Exclusive Montreal - A',
    dir: path.join(BASE,'2026-08-19-Exclusive Montreal - A'), facade: '3_Fachada.jpeg',
    body: bd('Exclusive Montreal Torre A, RIVA em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Exclusive Montreal - B',
    dir: path.join(BASE,'2026-08-19-Exclusive Montreal - B'), facade: '3_Fachada.jpeg',
    body: bd('Exclusive Montreal Torre B, RIVA em BH. Apartamentos de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Get Easy',
    dir: path.join(BASE,'2026-08-19-Get Easy'), facade: 'Fachada.jpeg',
    body: bd('Get Easy, RIVA em BH. Apartamentos compactos entregues. Unidades esgotadas.','Belo Horizonte','30000-000',1,2) },
  { nome:'Life 360 Residencial Clube - T1',
    dir: path.join(BASE,'2026-08-19-Life 360 Residencial Clube - T1'), facade: 'CARBEL_PE_FACHADA_2023_05_29.jpeg',
    body: bd('Life 360 Residencial Clube Torre 1, RIVA em BH. Condomínio clube de alto padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Life 360 Residencial Clube - T2',
    dir: path.join(BASE,'2026-08-19-Life 360 Residencial Clube - T2'), facade: 'CARBEL_PE_FACHADA_2023_05_29.jpeg',
    body: bd('Life 360 Residencial Clube Torre 2, RIVA em BH. Condomínio clube de alto padrão entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Neo Pampulha Residence - T1',
    dir: path.join(BASE,'2026-08-19-Neo Pampulha Residence - T1'), facade: '01_-_FACHADA.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Neo Pampulha Residence Torre 1, RIVA na Pampulha, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Pampulha', bairro:'Pampulha', cidade:'Belo Horizonte', estado:'MG', cep:'31275-000',
      area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1 } },
  { nome:'Neo Pampulha Residence - T2',
    dir: path.join(BASE,'2026-08-19-Neo Pampulha Residence - T2'), facade: '01_-_FACHADA.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Neo Pampulha Residence Torre 2, RIVA na Pampulha, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Pampulha', bairro:'Pampulha', cidade:'Belo Horizonte', estado:'MG', cep:'31275-000',
      area_min:50, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:1 } },
  { nome:'Reserva dos Buritis - T1',
    dir: path.join(BASE,'2026-08-19-Reserva dos Buritis - T1'), facade: 'SQUAD-RIVA_INCORPORADORA-ALTO_BURITIS-IMG-FACHADA-R04.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Reserva dos Buritis Torre 1, RIVA no Alto Buritis, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Alto Buritis', bairro:'Buritis', cidade:'Belo Horizonte', estado:'MG', cep:'30575-280',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Reserva dos Buritis - T2',
    dir: path.join(BASE,'2026-08-19-Reserva dos Buritis - T2'), facade: 'SQUAD-RIVA_INCORPORADORA-ALTO_BURITIS-IMG-FACHADA-R04.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Reserva dos Buritis Torre 2, RIVA no Alto Buritis, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Alto Buritis', bairro:'Buritis', cidade:'Belo Horizonte', estado:'MG', cep:'30575-280',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Reserva dos Buritis - T3',
    dir: path.join(BASE,'2026-08-19-Reserva dos Buritis - T3'), facade: 'SQUAD-RIVA_INCORPORADORA-ALTO_BURITIS-IMG-FACHADA-R04.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Reserva dos Buritis Torre 3, RIVA no Alto Buritis, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Alto Buritis', bairro:'Buritis', cidade:'Belo Horizonte', estado:'MG', cep:'30575-280',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Reserva dos Buritis - T4',
    dir: path.join(BASE,'2026-08-19-Reserva dos Buritis - T4'), facade: 'SQUAD-RIVA_INCORPORADORA-ALTO_BURITIS-IMG-FACHADA-R04.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Reserva dos Buritis Torre 4, RIVA no Alto Buritis, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Alto Buritis', bairro:'Buritis', cidade:'Belo Horizonte', estado:'MG', cep:'30575-280',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Reserva dos Buritis - T5',
    dir: path.join(BASE,'2026-08-19-Reserva dos Buritis - T5'), facade: 'SQUAD-RIVA_INCORPORADORA-ALTO_BURITIS-IMG-FACHADA-R04.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Reserva dos Buritis Torre 5, RIVA no Alto Buritis, BH. Apartamentos de alto padrão entregues. Unidades esgotadas.',
      endereco:'Alto Buritis', bairro:'Buritis', cidade:'Belo Horizonte', estado:'MG', cep:'30575-280',
      area_min:60, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'Reserva dos Pássaros - T1',
    dir: path.join(BASE,'2026-08-19-Reserva dos Pássaros - T1'), facade: 'Fachada-Reserva-dos-Passaros-Riva.jpeg',
    body: bd('Reserva dos Pássaros Torre 1, RIVA em BH. Condomínio com área privativa entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Reserva dos Pássaros - T2',
    dir: path.join(BASE,'2026-08-19-Reserva dos Pássaros - T2'), facade: 'Fachada-Reserva-dos-Passaros-Riva.jpeg',
    body: bd('Reserva dos Pássaros Torre 2, RIVA em BH. Condomínio com área privativa entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Reserva dos Pássaros - T3',
    dir: path.join(BASE,'2026-08-19-Reserva dos Pássaros - T3'), facade: 'Fachada-Reserva-dos-Passaros-Riva.jpeg',
    body: bd('Reserva dos Pássaros Torre 3, RIVA em BH. Condomínio com área privativa entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Reserva dos Pássaros - T4',
    dir: path.join(BASE,'2026-08-19-Reserva dos Pássaros - T4'), facade: 'Fachada-Reserva-dos-Passaros-Riva.jpeg',
    body: bd('Reserva dos Pássaros Torre 4, RIVA em BH. Condomínio com área privativa entregue. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Sky Raja Residence',
    dir: path.join(BASE,'2026-08-19-Sky Raja Residence'), facade: 'OBRA635-RAJA_PE_FACHADA_2023_07_25.jpeg',
    body: bd('Sky Raja Residence, RIVA em BH. Apartamentos de alto padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Sun Raja',
    dir: path.join(BASE,'2026-08-19-Sun Raja'), facade: null,
    body: bd('Sun Raja, RIVA em BH. Apartamentos de alto padrão entregues com academia. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Vivence Lagoa',
    dir: path.join(BASE,'2026-08-19-Vivence Lagoa'), facade: 'Perspectiva-Fachada02-VivenceLagoaRiva.jpeg',
    body: { tipo:'apartamento', status:'pronto', descricao:'Vivence Lagoa, RIVA em BH. Apartamentos de altíssimo padrão entregues com vista para a Lagoa. Unidades esgotadas.',
      endereco:'Lagoa', bairro:'Lagoa', cidade:'Belo Horizonte', estado:'MG', cep:'31275-000',
      area_min:60, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2 } },
  { nome:'ÁPICE',
    dir: path.join(BASE,'2026-08-19-ÁPICE'), facade: 'P01_Fachada_Residencial_Baixa.jpeg',
    body: bd('Ápice, RIVA em BH. Apartamentos residenciais de altíssimo padrão entregues. Unidades esgotadas.','Belo Horizonte','30000-000') },
  { nome:'Be You Barro Preto Residence',
    dir: path.join(BASE,'Be You Barro Preto Residence'), facade: null,
    body: { tipo:'studio', status:'pronto', descricao:'Be You Barro Preto Residence, RIVA no Barro Preto, BH. Studios de alto padrão entregues. Unidades esgotadas.',
      endereco:'Barro Preto', bairro:'Barro Preto', cidade:'Belo Horizonte', estado:'MG', cep:'30180-000',
      area_min:25, area_max:60, preco_min:null, preco_max:null, quartos_min:1, quartos_max:1, vagas:1 } },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  RIVA — 29 empreendimentos');
  console.log('═══════════════════════════════════════════════════\n');
  let TOKEN;
  const login = await api('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:EMAIL, password:SENHA }) });
  if (login.data?.access_token) { TOKEN = login.data.access_token; console.log('✅ Login OK'); }
  else {
    const reg = await api('/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'RIVA', razao_social:'RIVA Incorporadora', role:'construtora' }) });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }
  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade);
    await publicar(TOKEN, e.id);
  }
  console.log('\n✅ RIVA concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
