/**
 * cadastrar-volume.js — VOlume (1 empreendimento)
 *   Edifício Carbon — Santo Antônio, BH  (sem unidades — consulte valores)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'volume@soconstrutoras.com.br';
const SENHA = 'VOLUME@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\VOlume';

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
async function uploadImagens(TOKEN, empId, dir, facade, skip) {
  const det = await api(`/empreendimentos/${empId}`, { headers:{Authorization:`Bearer ${TOKEN}`} });
  if ((det.data?.midias ?? []).filter(m => m.tipo==='foto').length > 0) {
    console.log('  ✓ fotos já existem'); return;
  }
  if (!fs.existsSync(dir)) { console.log('  ⚠ dir não encontrado'); return; }
  const all = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|jpg)$/i.test(f));
  const skipSet = new Set(skip || []);
  const plantas = all.filter(f => f.toLowerCase().includes('planta'));
  const fotos   = all.filter(f => !f.toLowerCase().includes('planta') && !skipSet.has(f));
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
  console.log(`  📸 ${ok}/${all.length - skipSet.size}`);
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
    nome: 'Edifício Carbon',
    dir:  path.join(BASE, 'Carbon Sao romeo sao pedro'),
    facade: 'VOLUME_CARBON_FACHADA_FRONTAL.jpg',
    skip:   ['Sem logo.jpg'], // logo — não faz sentido como foto do empreendimento
    body: {
      tipo:'apartamento', status:'lancamento',
      descricao:'Edifício Carbon na Rua São Romão, 386, Santo Antônio, Belo Horizonte. Apartamentos de 2 e 3 quartos com 2 vagas. Coberturas de 2 e 3 quartos. Lazer com fitness, bicicletário e hall moderno. Diferenciais: espaço bike, gourmet zone, coworking, mini market e sistema de câmera e alarme.',
      endereco:'Rua São Romão, 386', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30330-190',
      area_min:60, area_max:200, preco_min:null, preco_max:null, quartos_min:2, quartos_max:3, vagas:2,
    },
    unidades:[],
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  VOlume — 1 empreendimento');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'VOlume',
        razao_social:'VOlume Empreendimentos', role:'construtora' }),
    });
    if (!reg.data?.access_token) throw new Error('Auth falhou: ' + JSON.stringify(reg.data));
    TOKEN = reg.data.access_token; console.log('✅ Conta criada');
  }

  for (const emp of EMPS) {
    console.log(`\n── ${emp.nome} ──`);
    const e = await criarOuBuscar(TOKEN, emp.nome, emp.body);
    await uploadImagens(TOKEN, e.id, emp.dir, emp.facade, emp.skip);
    await publicar(TOKEN, e.id);
  }

  console.log('\n✅ VOlume concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
