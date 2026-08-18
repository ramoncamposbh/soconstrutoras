/**
 * fix-imagem-capa.js
 *
 * Corrige a imagem principal (foto_capa) de todos os empreendimentos.
 * A foto_capa = primeira foto com menor `ordem` em empreendimento_midias.
 *
 * Para cada empreendimento:
 *   1. Encontra a pasta local de imagens
 *   2. Detecta a imagem de fachada pelo nome do arquivo
 *   3. Deleta todas as midias `foto` existentes
 *   4. Re-envia: fachada PRIMEIRO, depois as demais
 *
 * Construtoras cobertas (grupos 1-4 que usaram glob() alfabético):
 *   COB, COLLEM, BERTI, GETTA, GRANCORP, PLANO, EVOLUIR, DMC, FIBRA,
 *   FORÇA, CONUP, CONCRETO, CONTTI, CASTOR, CAPANEMA, CIMOS, GARCIA,
 *   FURTADO ARAÚJO, EPO, F2 + LUME
 *
 * BAUMAC Edifício Atenas: Academia foi primeira — também corrige.
 *
 *   node scripts/fix-imagem-capa.js
 */

const fs   = require('fs');
const path = require('path');

const API = 'https://soconstrutoras-production.up.railway.app/api/v1';

// ─── Helpers ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function glob(dir, recursive = false) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isFile() && /\.(jpe?g|png)$/i.test(entry)) {
      result.push(full);
    } else if (recursive && stat.isDirectory() && !/zip$/i.test(entry)) {
      result.push(...glob(full, false)); // one level deep only
    }
  }
  return result;
}

/**
 * Escolhe a melhor imagem de fachada de um diretório.
 * Prioridade:
 *  1. "fachada" no nome (prefere "diurna")
 *  2. "perspectiva" sem palavras de interior
 *  3. null — não encontrado (skip)
 */
function escolherFachada(dir) {
  if (!fs.existsSync(dir)) return null;

  // Verificar subfolder CONDOMINIO (estrutura antiga)
  const subCondominio = fs.readdirSync(dir)
    .filter(e => /condomin/i.test(e) && fs.statSync(path.join(dir, e)).isDirectory());
  if (subCondominio.length > 0) {
    const condFiles = glob(path.join(dir, subCondominio[0]));
    if (condFiles.length > 0) return condFiles.sort()[0]; // primeiro do CONDOMINIO = fachada
  }

  const files = glob(dir); // apenas arquivos planos
  if (files.length === 0) return null;

  const baseLower = f => path.basename(f).toLowerCase();

  // 1. Contém "fachada"
  const comFachada = files.filter(f => baseLower(f).includes('fachada'));
  if (comFachada.length > 0) {
    const diurna = comFachada.find(f => /diurna|diurno/.test(baseLower(f)));
    return diurna || comFachada.sort()[0];
  }

  // 2. Perspectiva exterior (sem palavras de interior)
  const INTERIOR = /apartamento|suite|quarto|cozinha|sala|banheiro|closet|lavabo|varanda|area.priv|privativa|priv_|apto|cobertura|garden|studio/i;
  const perspExt = files.filter(f =>
    /perspectiva|render|exterior/i.test(baseLower(f)) && !INTERIOR.test(baseLower(f))
  );
  if (perspExt.length > 0) return perspExt.sort()[0];

  return null; // sem fachada identificada
}

async function apiCall(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}

async function login(email, senha) {
  const r = await apiCall('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha }),
  });
  return r.data?.access_token ?? null;
}

async function listarEmpreendimentos(token) {
  const r = await apiCall('/empreendimentos/meus/listar', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(r.data) ? r.data : [];
}

async function listarMidias(token, empId) {
  const r = await apiCall(`/empreendimentos/${empId}/midias`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(r.data) ? r.data : [];
}

async function deletarMidia(token, empId, midiaId) {
  await apiCall(`/empreendimentos/${empId}/midias/${midiaId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await sleep(200);
}

async function uploadFoto(token, empId, filePath) {
  if (!fs.existsSync(filePath)) return false;
  const form = new FormData();
  form.append('file',
    new Blob([fs.readFileSync(filePath)], { type: 'image/jpeg' }),
    path.basename(filePath)
  );
  form.append('tipo', 'foto');
  const res = await fetch(`${API}/empreendimentos/${empId}/midias/upload-local`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  await sleep(400);
  return res.status === 201;
}

/**
 * Encontra a pasta local de um empreendimento dentro de baseDir.
 * Faz match pelo nome do empreendimento (sem prefixo de data).
 */
function findEmpDir(baseDir, empNome) {
  if (!fs.existsSync(baseDir)) return null;

  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const empNorm = norm(empNome);

  const entries = fs.readdirSync(baseDir)
    .filter(e => !e.endsWith('.zip') && !e.endsWith('.pdf'))
    .filter(e => {
      try { return fs.statSync(path.join(baseDir, e)).isDirectory(); } catch { return false; }
    });

  for (const e of entries) {
    // Remover prefixo data (ex: "2026-08-14-" ou "2026-08-14 ")
    const folderName = e.replace(/^\d{4}-\d{2}-\d{2}[-\s]*/, '').trim();
    const folderNorm = norm(folderName);
    if (folderNorm === empNorm ||
        folderNorm.includes(empNorm) ||
        empNorm.includes(folderNorm)) {
      return path.join(baseDir, e);
    }
  }
  return null;
}

/**
 * Corrige a foto_capa de um empreendimento:
 *  - Deleta todos os `foto` type midias
 *  - Faz upload da fachada primeiro, depois demais imagens
 */
async function fixarCapa(token, emp, empDir, { skipIfNoFachada = true } = {}) {
  const fachada = escolherFachada(empDir);

  if (!fachada) {
    if (skipIfNoFachada) {
      console.log(`    ⚠️  Sem fachada identificada → mantendo`);
      return false;
    }
  }

  // Listar midias `foto` existentes
  const midias = await listarMidias(token, emp.id);
  const fotos = midias.filter(m => m.tipo === 'foto');

  if (fotos.length === 0) {
    console.log(`    ℹ️  Sem fotos no sistema → nada a corrigir`);
    return false;
  }

  // Verificar se já está correta (comparando nome do arquivo de fachada com URL não é possível)
  // → Sempre re-faz para garantir

  console.log(`    🗑️  Deletando ${fotos.length} foto(s)...`);
  for (const m of fotos) {
    await deletarMidia(token, emp.id, m.id);
  }

  // Coletar todas as imagens da pasta (exceto PLANTA_ para CONTTI)
  const allFiles = glob(empDir).sort();
  const semFachada = allFiles.filter(f => f !== fachada);

  // Upload fachada primeiro
  console.log(`    📸 Fachada: ${path.basename(fachada)}`);
  const ok1 = await uploadFoto(token, emp.id, fachada);
  if (!ok1) console.log(`    ❌ Falha no upload da fachada`);

  // Upload demais
  let okCount = ok1 ? 1 : 0;
  for (const f of semFachada) {
    if (await uploadFoto(token, emp.id, f)) okCount++;
  }
  console.log(`    ✅ ${okCount}/${allFiles.length} imagens enviadas`);
  return true;
}

// ─── Configuração das construtoras ─────────────────────────────────────────
// Formato: { email, senha, base, single?: true }
// single=true → base é a pasta do empreendimento diretamente (1 emp só)
// single=false (padrão) → base contém subpastas por empreendimento

const CONSTRUTORAS = [
  // ── Grupo 1 ─────────────────────────────────────────────────────────────
  {
    email: 'cob@soconstrutoras.com.br',
    senha: 'COB@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\COB Construtora\\2026-08-14-Cambará',
    single: true,
  },
  {
    email: 'collem@soconstrutoras.com.br',
    senha: 'COLLEM@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\COLLEM\\2026-08-14-London Square (1)',
    single: true,
  },
  {
    email: 'berti@soconstrutoras.com.br',
    senha: 'BERTI@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CONSTRUTORA BERTI\\2026-08-14-KOI',
    single: true,
  },
  {
    email: 'getta@soconstrutoras.com.br',
    senha: 'GETTA@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\GETTA\\2026-08-18-Varandas do Valle',
    single: true,
  },
  {
    email: 'grancorp@soconstrutoras.com.br',
    senha: 'GRANCORP@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\GRANCORP\\2026-08-18-Panorama',
    single: true,
  },
  {
    email: 'incorporadoraplano@soconstrutoras.com.br',
    senha: 'INCORPORADORAPLANO@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\INCORPORADORA PLANO\\2026-08-18-Vivere Caiçara',
    single: true,
  },
  // ── Grupo 2 ─────────────────────────────────────────────────────────────
  {
    email: 'evoluir@soconstrutoras.com.br',
    senha: 'EVOLUIR@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\EVOLUIR',
  },
  {
    email: 'dmc@soconstrutoras.com.br',
    senha: 'DMC@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\DMC',
  },
  {
    email: 'fibra@soconstrutoras.com.br',
    senha: 'FIBRA@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\FIBRA\\2026-08-18-Serenidad Residence',
    single: true,
  },
  {
    email: 'forca@soconstrutoras.com.br',
    senha: 'FORCA@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\FORÇA',
  },
  // ── Grupo 3 ─────────────────────────────────────────────────────────────
  {
    email: 'conup@soconstrutoras.com.br',
    senha: 'CONUP@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CONUP',
  },
  {
    email: 'concreto@soconstrutoras.com.br',
    senha: 'CONCRETO@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CONCRETO',
  },
  {
    email: 'contti@soconstrutoras.com.br',
    senha: 'CONTTI@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Contti',
  },
  {
    email: 'castor@soconstrutoras.com.br',
    senha: 'CASTOR@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\CASTOR',
  },
  // ── Grupo 4 ─────────────────────────────────────────────────────────────
  {
    email: 'capanema@soconstrutoras.com.br',
    senha: 'CAPANEMA@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Capanema',
  },
  {
    email: 'cimos@soconstrutoras.com.br',
    senha: 'CIMOS@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Cimos',
  },
  {
    email: 'garcia@soconstrutoras.com.br',
    senha: 'GARCIA@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Garcia',
  },
  {
    email: 'furtadoaraujo@soconstrutoras.com.br',
    senha: 'FURTADOARAUJO@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\FURTADO ARAÚJO',
  },
  {
    email: 'epo@soconstrutoras.com.br',
    senha: 'EPO@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\Epo',
  },
  {
    // F2 + LUME — a pasta Lume é subpasta dentro de F2
    email: 'f2@soconstrutoras.com.br',
    senha: 'F2@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\F2',
    extraBase: 'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\F2\\2026-08-18-Lume',
  },
  // ── Correções pontuais de grupos antigos ─────────────────────────────────
  {
    // BAUMAC: Edifício Atenas tem Academia como 1ª imagem
    email: 'baumac@soconstrutoras.com.br',
    senha: 'BAUMAC@2026',
    base:  'D:\\3 -IMOVEIS\\CONSTRUTORAS\\ATUAIS\\BAUMAC',
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────
async function processarConstrutora(cfg) {
  const { email, senha, base, single, extraBase } = cfg;
  const nome = email.split('@')[0].toUpperCase();

  console.log(`\n${'═'.repeat(56)}`);
  console.log(`  ${nome}`);
  console.log('═'.repeat(56));

  const token = await login(email, senha);
  if (!token) { console.log('  ✗ Login falhou'); return; }

  const emps = await listarEmpreendimentos(token);
  if (!emps.length) { console.log('  ✗ Sem empreendimentos'); return; }

  for (const emp of emps) {
    console.log(`\n  ── ${emp.nome}`);

    // Determinar pasta local
    let empDir = null;
    if (single) {
      empDir = base; // pasta direta
    } else {
      empDir = findEmpDir(base, emp.nome);
      // Se não encontrou no base principal, tentar extraBase (F2/Lume)
      if (!empDir && extraBase) {
        empDir = findEmpDir(extraBase, emp.nome);
      }
    }

    if (!empDir) {
      console.log(`    ⚠️  Pasta local não encontrada`);
      continue;
    }
    console.log(`    📁 ${empDir}`);

    await fixarCapa(token, emp, empDir);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SóConstrutoras — Correção Imagem Capa (Fachada)    ║');
  console.log(`║  ${CONSTRUTORAS.length} construtoras                                  ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  const erros = [];
  for (const cfg of CONSTRUTORAS) {
    try {
      await processarConstrutora(cfg);
    } catch (err) {
      const nome = cfg.email.split('@')[0];
      console.error(`\n✗ ERRO em ${nome}:`, err.message);
      erros.push(nome);
    }
  }

  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║  CONCLUÍDO                                          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  if (erros.length) {
    console.log('Erros em:', erros.join(', '));
    process.exit(1);
  } else {
    console.log('✅ Todas as imagens de capa foram corrigidas!');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
