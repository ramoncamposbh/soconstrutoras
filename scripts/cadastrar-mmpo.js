/**
 * cadastrar-mmpo.js — M MPO (3 empreendimentos)
 *   Eurico           — Belo Horizonte     (sem unidades — vendido)
 *   Monte Vizcaya    — Santa Lúcia, BH   (sem unidades — vendido)
 *   TERRARO          — Santo Antônio, BH  (sem unidades — vendido)
 */
const fs   = require('fs');
const path = require('path');

const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const EMAIL = 'mmpo@soconstrutoras.com.br';
const SENHA = 'MMPO@2026';
const BASE  = 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\M MPO';

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
    method:'POST', headers:{Authorization:`Bearer ${TOKEN}`},
  });
  if (r.data?.publicado || r.status === 200) console.log('  🌐 publicado');
  else console.log('  ⚠ publicar:', JSON.stringify(r.data));
}

const EMPS = [
  {
    nome:   'Eurico',
    dir:    path.join(BASE, '2026-08-19-Eurico'),
    facade: 'IMG_4646.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Eurico, empreendimento M MPO em Belo Horizonte. Apartamentos de alto padrão entregues com lazer completo e acabamento superior. Unidades esgotadas.',
      endereco:'Belo Horizonte', bairro:'Belo Horizonte', cidade:'Belo Horizonte', estado:'MG', cep:'30000-000',
      area_min:70, area_max:250, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'Monte Vizcaya',
    dir:    path.join(BASE, '2026-08-19-Monte Vizcaya'),
    facade: 'PHOTO-2024-06-13-16-20-35.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'Monte Vizcaya na Rua Eclipse, 130, Santa Lúcia, Belo Horizonte. Empreendimento M MPO de alto padrão entregue com apartamentos amplos, academia, área de serviço e banheiro suite. Unidades esgotadas.',
      endereco:'Rua Eclipse, 130', bairro:'Santa Lúcia', cidade:'Belo Horizonte', estado:'MG', cep:'30360-490',
      area_min:80, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
  {
    nome:   'TERRARO',
    dir:    path.join(BASE, '2026-08-19-TERRARO'),
    facade: '211104_P01_FachadaEsquerda2.jpeg',
    body: {
      tipo:'apartamento', status:'pronto',
      descricao:'TERRARO na Rua Rafael Magalhães, 265, Santo Antônio, Belo Horizonte. Empreendimento M MPO de alto padrão entregue com fachada contemporânea e acabamento superior. Unidades esgotadas.',
      endereco:'Rua Rafael Magalhães, 265', bairro:'Santo Antônio', cidade:'Belo Horizonte', estado:'MG', cep:'30330-270',
      area_min:70, area_max:300, preco_min:null, preco_max:null, quartos_min:2, quartos_max:4, vagas:2,
    },
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  M MPO — 3 empreendimentos');
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
      body: JSON.stringify({ email:EMAIL, password:SENHA, nome:'M MPO',
        razao_social:'M MPO Empreendimentos Imobiliários', role:'construtora' }),
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

  console.log('\n✅ M MPO concluído');
}

module.exports = { main };
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
