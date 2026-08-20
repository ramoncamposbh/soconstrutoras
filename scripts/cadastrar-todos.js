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
  // ── Grupo original ──────────────────────────────────────────────
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
  // ── Grupo 1 ─────────────────────────────────────────────────────
  { nome: 'COB',             script: 'cadastrar-cob'                },
  { nome: 'COLLEM',          script: 'cadastrar-collem'             },
  { nome: 'BERTI',           script: 'cadastrar-berti'              },
  { nome: 'GETTA',           script: 'cadastrar-getta'              },
  { nome: 'GRANCORP',        script: 'cadastrar-grancorp'           },
  { nome: 'PLANO',           script: 'cadastrar-plano'              },
  // ── Grupo 2 ─────────────────────────────────────────────────────
  { nome: 'EVOLUIR',         script: 'cadastrar-evoluir'            },
  { nome: 'DMC',             script: 'cadastrar-dmc'                },
  { nome: 'FIBRA',           script: 'cadastrar-fibra'              },
  { nome: 'FORÇA',           script: 'cadastrar-forca'              },
  // ── Grupo 3 ─────────────────────────────────────────────────────
  { nome: 'CONUP',           script: 'cadastrar-conup'              },
  { nome: 'CONCRETO',        script: 'cadastrar-concreto'           },
  { nome: 'CONTTI',          script: 'cadastrar-contti'             },
  { nome: 'CASTOR',          script: 'cadastrar-castor'             },
  // ── Grupo 4 ─────────────────────────────────────────────────────
  { nome: 'CAPANEMA',        script: 'cadastrar-capanema'           },
  { nome: 'CIMOS',           script: 'cadastrar-cimos'              },
  { nome: 'GARCIA',          script: 'cadastrar-garcia'             },
  { nome: 'FURTADO ARAÚJO',  script: 'cadastrar-furtadoaraujo'      },
  { nome: 'EPO',             script: 'cadastrar-epo'                },
  { nome: 'F2 + LUME',       script: 'cadastrar-f2'                 },
  // ── Grupo 5 ─────────────────────────────────────────────────────
  { nome: 'INTACTA',         script: 'cadastrar-intacta'            },
  { nome: 'JANEIRO',         script: 'cadastrar-janeiro'            },
  { nome: 'LATO',            script: 'cadastrar-lato'               },
  { nome: 'LCG',             script: 'cadastrar-lcg'                },
  { nome: 'LBX',             script: 'cadastrar-lbx'                },
  { nome: 'LASO ENGENHARIA', script: 'cadastrar-laso'               },
  { nome: 'VOLUME',          script: 'cadastrar-volume'             },
  // ── Grupo 6 ─────────────────────────────────────────────────────
  { nome: 'LAGE',            script: 'cadastrar-lage'               },
  { nome: 'M MPO',           script: 'cadastrar-mmpo'               },
  { nome: 'M. MATOS',        script: 'cadastrar-mmatos'             },
  // ── Grupo 7 ─────────────────────────────────────────────────────
  { nome: 'MCF',             script: 'cadastrar-mcf'                },
  { nome: 'MENDES FERRAZ',   script: 'cadastrar-mendesferraz'       },
  { nome: 'MINAS BRISA',     script: 'cadastrar-minasbrisa'         },
  { nome: 'MIP',             script: 'cadastrar-mip'                },
  { nome: 'MODERNIZAR',      script: 'cadastrar-modernizar'         },
  { nome: 'MONTERRE',        script: 'cadastrar-monterre'           },
  { nome: 'MRV',             script: 'cadastrar-mrv'                },
  { nome: 'NATUS E BELO VALE',script: 'cadastrar-natusebelovale'   },
  { nome: 'NOVOLAR',         script: 'cadastrar-novolar'            },
  { nome: 'ORKHESTRA',       script: 'cadastrar-orkhestra'          },
  { nome: 'PARCELAR',        script: 'cadastrar-parcelar'           },
  { nome: 'PARDINI NASSIF',  script: 'cadastrar-pardinassif'        },
  { nome: 'PATRIMAR',        script: 'cadastrar-patrimar'           },
  { nome: 'PHV',             script: 'cadastrar-phv'                },
  { nome: 'PRISBEL',         script: 'cadastrar-prisbel'            },
  { nome: 'PRODOMO',         script: 'cadastrar-prodomo'            },
  { nome: 'PROTEMPO',        script: 'cadastrar-protempo'           },
  { nome: 'RICAM',           script: 'cadastrar-ricam'              },
];

async function main() {
  const total = CONSTRUTORAS.length;
  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  SóConstrutoras — Cadastro em Massa               ║`);
  console.log(`║  ${String(total).padEnd(2)} construtoras                                ║`);
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
