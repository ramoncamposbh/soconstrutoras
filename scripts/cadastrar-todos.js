/**
 * cadastrar-todos.js
 * Roda todos os scripts de construtoras em sequência.
 * Idempotente — pula o que já existe.
 *
 *   node cadastrar-todos.js
 *
 * Para adicionar uma nova construtora: crie o script e adicione à lista abaixo.
 */

const CONSTRUTORAS = [
  { nome: 'ALTHOUSE',        script: 'cadastrar-terrazzo-belvedere' },
  { nome: 'ALTTI',           script: 'cadastrar-altti'              },
  { nome: 'ÂNIMA SIGNATURE', script: 'cadastrar-animasignature'     },
  { nome: 'ÁQUILA',          script: 'cadastrar-aquila'             },
  { nome: 'ACBR',            script: 'cadastrar-acbr'               },
  { nome: 'SANDRO PIMENTA',  script: 'cadastrar-sandropimenta'      },
  { nome: 'BECKER',          script: 'cadastrar-becker'             },
  { nome: 'AUDAZ',           script: 'cadastrar-audaz'              },
  { nome: 'BAUMAC',          script: 'cadastrar-baumac'             },
  { nome: 'BOTELHO',         script: 'cadastrar-botelho'            },
  { nome: 'BORGESI & WALLOO',script: 'cadastrar-borgesiwalloo'      },
  { nome: 'CANOPUS',         script: 'cadastrar-canopus'            },
  { nome: 'CASA GRANDE',     script: 'cadastrar-casagrande'         },
  { nome: 'CASAMIRADOR',     script: 'cadastrar-casamirador'        },
];

async function main() {
  const total = CONSTRUTORAS.length;
  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  SóConstrutoras — Cadastro em Massa               ║`);
  console.log(`║  ${total} construtoras                                  ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  const resultados = [];

  for (let i = 0; i < CONSTRUTORAS.length; i++) {
    const { nome, script } = CONSTRUTORAS[i];
    console.log(`\n${'▓'.repeat(52)}`);
    console.log(`[${i + 1}/${total}] ${nome}`);
    console.log('▓'.repeat(52));

    const inicio = Date.now();
    try {
      const mod = require(`./${script}`);
      await mod.main();
      const seg = ((Date.now() - inicio) / 1000).toFixed(1);
      resultados.push({ nome, ok: true, seg });
    } catch (err) {
      const seg = ((Date.now() - inicio) / 1000).toFixed(1);
      console.error(`  ✗ ERRO em ${nome}:`, err.message);
      resultados.push({ nome, ok: false, seg, erro: err.message });
    }
  }

  // Resumo final
  console.log('\n\n╔══════════════════════════════════════════════════╗');
  console.log('║  RESUMO                                          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  for (const r of resultados) {
    const status = r.ok ? '✅' : '✗ ';
    const pad    = r.nome.padEnd(22);
    console.log(`║  ${status}  ${pad}  ${r.seg}s${r.erro ? ` — ${r.erro.slice(0,20)}` : ''}`.padEnd(51) + '║');
  }
  console.log('╚══════════════════════════════════════════════════╝');

  const ok   = resultados.filter(r => r.ok).length;
  const fail = resultados.filter(r => !r.ok).length;
  console.log(`\n  ${ok} OK  |  ${fail} com erro`);
  if (fail > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
