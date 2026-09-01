/**
 * cadastrar-pendentes-coworking.js
 * Roda os scripts das construtoras com coworking usando child_process
 * (evita problemas de require() em CIFS mount).
 *
 *   node scripts/cadastrar-pendentes-coworking.js
 */

const { spawnSync } = require('child_process');
const path = require('path');

const DIR = __dirname; // pasta scripts/

const CONSTRUTORAS = [
  { nome: 'ALTTI',          script: 'cadastrar-altti.js'         },
  { nome: 'BAUMAC',         script: 'cadastrar-baumac.js'        },
  { nome: 'BORGESI&WALLOO', script: 'cadastrar-borgesiwalloo.js' },
  { nome: 'BOTELHO',        script: 'cadastrar-botelho.js'       },
  { nome: 'CASA GRANDE',    script: 'cadastrar-casagrande.js'    },
  { nome: 'INTACTA',        script: 'cadastrar-intacta.js'       },
  { nome: 'JANEIRO',        script: 'cadastrar-janeiro.js'       },
  { nome: 'LATO',           script: 'cadastrar-lato.js'          },
  { nome: 'VOLUME',         script: 'cadastrar-volume.js'        },
];

const total = CONSTRUTORAS.length;
console.log('╔══════════════════════════════════════════════════╗');
console.log('║  SóConstrutoras — Construtoras c/ Coworking       ║');
console.log(`║  ${String(total).padEnd(2)} construtoras                                ║`);
console.log('╚══════════════════════════════════════════════════╝\n');

const resultados = [];

for (let i = 0; i < CONSTRUTORAS.length; i++) {
  const { nome, script } = CONSTRUTORAS[i];
  const scriptPath = path.join(DIR, script);

  console.log(`\n${'▓'.repeat(52)}`);
  console.log(`[${i + 1}/${total}] ${nome}`);
  console.log('▓'.repeat(52));

  const inicio = Date.now();
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    encoding: 'utf8',
  });
  const seg = ((Date.now() - inicio) / 1000).toFixed(1);

  if (result.status === 0) {
    resultados.push({ nome, ok: true, seg });
  } else {
    const erro = result.stderr || (result.error && result.error.message) || `exit ${result.status}`;
    console.error(`  ✗ ERRO: ${erro}`);
    resultados.push({ nome, ok: false, seg, erro: String(erro).slice(0, 40) });
  }
}

console.log('\n\n╔══════════════════════════════════════════════════╗');
console.log('║  RESUMO                                          ║');
console.log('╠══════════════════════════════════════════════════╣');
for (const r of resultados) {
  const status = r.ok ? '✅' : '✗ ';
  const pad    = r.nome.padEnd(20);
  console.log(`║  ${status}  ${pad}  ${r.seg}s${r.erro ? ` — ${r.erro}` : ''}`.padEnd(51) + '║');
}
console.log('╚══════════════════════════════════════════════════╝');

const ok   = resultados.filter(r => r.ok).length;
const fail = resultados.filter(r => !r.ok).length;
console.log(`\n  ${ok} OK  |  ${fail} com erro`);
if (fail > 0) process.exit(1);
