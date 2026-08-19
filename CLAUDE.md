# CLAUDE.md — SóConstrutoras
> Leia este arquivo no início de TODA sessão antes de qualquer alteração.

---

## O QUE É ESTE PROJETO

**SóConstrutoras** é um portal imobiliário B2B/B2C que conecta construtoras, parceiros (imobiliárias/corretores) e compradores.

- Construtoras cadastram empreendimentos e unidades
- Parceiros recebem leads automaticamente por um engine de distribuição
- Compradores buscam imóveis por filtros tradicionais ou por busca em linguagem natural (IA + voz)

**URL produção:** https://soconstrutoras.vercel.app  
**Repositório:** https://github.com/ramoncamposbh/soconstrutoras  
**Owner:** Ramon (ramoncamposbh@gmail.com)

---

## STACK OFICIAL

| Camada | Tecnologia | Deploy |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Vercel |
| Backend | NestJS 10 + TypeScript | Railway (Docker) |
| Banco | PostgreSQL (Neon serverless) | Neon |
| Storage | AWS S3 / Cloudflare R2 | - |
| Auth | JWT + Google OAuth (passport-jwt) | - |
| Billing | Stripe | - |
| Voz/IA | Groq Whisper (whisper-large-v3-turbo) | - |
| E-mail | Nodemailer + Handlebars | - |
| Mapa | Leaflet + React-Leaflet | - |

---

## ARQUITETURA

```
soconstrutoras/
├── backend/          # NestJS — porta 3000 em produção
│   └── src/
│       ├── auth/           # JWT + Google OAuth
│       ├── construtoras/   # CRUD construtoras + admin
│       ├── empreendimentos/# CRUD empreendimentos + busca pública
│       ├── unidades/       # CRUD unidades por empreendimento
│       ├── parceiros/      # Parceiros/corretores
│       ├── leads/          # Captura e listagem de leads
│       ├── leads-engine.ts # Engine distribuição round-robin/percentual
│       ├── midias/         # Upload fotos S3/R2
│       ├── favoritos/      # Lista de favoritos do usuário
│       ├── lojas/          # Módulo lojas/parceiros público
│       ├── speech/         # Transcrição voz → Groq Whisper
│       ├── simulador/      # Simulador de financiamento
│       ├── billing/        # Stripe checkout + portal
│       ├── notifications/  # E-mail via Nodemailer
│       ├── storage/        # AWS S3 presigned URLs
│       ├── database/       # Pool pg (PG_POOL token)
│       └── common/guards/  # JwtAuthGuard, SubscriptionGuard
│
└── frontend/         # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── page.tsx              # Homepage + busca IA + voz
        │   ├── imoveis/[slug]/       # Detalhe do imóvel
        │   ├── parceiros/            # Lista e detalhe parceiros
        │   ├── favoritos/            # Lista de favoritos
        │   ├── simuladores/          # Simulador financiamento
        │   ├── planos/               # Planos de assinatura
        │   ├── auth/login/           # Login usuários
        │   ├── admin/login/          # Login admin
        │   └── dashboard/            # Painel construtora + admin
        │       ├── layout.tsx        # Nav lateral com roles
        │       ├── page.tsx          # Visão geral
        │       ├── empreendimentos/  # CRUD empreendimentos
        │       └── construtoras/     # Admin: 3 níveis
        │           ├── empreendimentos/           # L1: lista construtoras
        │           │   └── [construtoraId]/       # L2: empreendimentos
        │           │       └── [empreendimentoId]/# L3: unidades
        │           └── usuarios/                  # Admin: usuários
        ├── components/
        │   ├── empreendimentos/CardEmpreendimento.tsx
        │   └── mapa/MapaEmpreendimentos.tsx
        └── lib/
            ├── api.ts      # Todos os endpoints centralizados (adminApi, empreendimentosApi...)
            ├── auth.tsx    # Context de autenticação
            └── utils.ts    # Helpers
```

---

## VARIÁVEIS DE AMBIENTE

### Backend (Railway → Variables)
```
DATABASE_URL          # Neon connection string
JWT_SECRET            # Segredo JWT
FRONTEND_URL          # https://soconstrutoras.vercel.app
GROQ_API_KEY          # NUNCA committar — só Railway
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS
PORT                  # Railway define automaticamente
```

### Frontend (Vercel → Environment Variables)
```
NEXT_PUBLIC_API_URL           # https://soconstrutoras-production.up.railway.app/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID  # Google OAuth client ID
```

---

## PADRÕES DE CÓDIGO OBRIGATÓRIOS

### Backend (NestJS)
- Todo endpoint protegido usa `@UseGuards(JwtAuthGuard)`
- Role admin verificada inline: `if (req.user?.role !== 'admin') throw new ForbiddenException()`
- DTOs com `class-validator` decorators, whitelist ativado globalmente
- Injeção do pool: `@Inject(PG_POOL) private readonly pool: Pool`
- Queries com `$1, $2...` parametrizadas — NUNCA interpolação de strings
- Prefix global: `api/v1`

### Frontend (Next.js)
- `'use client'` obrigatório em componentes com hooks/estado
- Token JWT em cookie: `Cookies.get('token')` via js-cookie (chave: `token`)
- Todos os endpoints em `src/lib/api.ts` — nunca fetch direto nos componentes
- Rotas de admin verificam `user?.role === 'admin'` antes de renderizar

### Identidade Visual
```
Verde escuro (fundo):  #04241D / #0D2B22
Verde marca:           #0E8F6E
Verde claro (accent):  #4ade80 / #22D497
Gradiente padrão:      linear-gradient(90deg, #0E8F6E, #22D497)
Fonte UI:              sistema (sans-serif)
Border-radius cards:   1rem / 1.5rem (rounded-2xl / rounded-3xl)
```

---

## FLUXO GIT (CRÍTICO — AMBIENTE CIFS)

O repositório está montado via CIFS. Git locks falham com `update-ref`.  
**Solução obrigatória para commits:**

```bash
# 1. Editar arquivos normalmente com ferramentas de arquivo (Edit/Write/Read)
# 2. Para commitar, usar git plumbing:

export GIT_INDEX_FILE=/tmp/git_idx_$$
git read-tree HEAD

# Para cada arquivo alterado:
HASH=$(git hash-object -w "caminho/do/arquivo")
git update-index --add --cacheinfo "100644,$HASH,caminho/do/arquivo"

TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "mensagem do commit")

# Escreve direto no arquivo de ref (bypassa o lock):
echo "$COMMIT" > .git/refs/heads/main

rm -f /tmp/git_idx_$$
```

**Nunca usar** `git commit`, `git add`, `git update-ref` — travem com CIFS.  
**Push pelo usuário:** `git push origin main` no PowerShell do Windows.

---

## ROLES DO SISTEMA

| Role | Acesso |
|---|---|
| `construtora` | Dashboard próprio, CRUD seus empreendimentos/unidades/parceiros |
| `parceiro` | Recebe leads, vê empreendimentos vinculados |
| `admin` | Acesso total — painel `/dashboard/construtoras/*` |
| `cliente` | Busca pública, favoritos |

---

## MÓDULOS E ARQUIVOS PRINCIPAIS

| Módulo | Service | Controller | Rota base |
|---|---|---|---|
| Auth | auth.service.ts | auth.controller.ts | /auth |
| Construtoras | construtoras.service.ts | construtoras.controller.ts | /construtoras |
| Empreendimentos | empreendimentos.service.ts | empreendimentos.controller.ts | /empreendimentos |
| Unidades | unidades.service.ts | unidades.controller.ts | /unidades |
| Parceiros | parceiros.service.ts | parceiros.controller.ts | /parceiros |
| Leads | leads.service.ts | leads.controller.ts | /leads |
| Favoritos | favoritos.service.ts | favoritos.controller.ts | /favoritos |
| Speech | speech.service.ts | speech.controller.ts | /speech |
| Simulador | simulador.service.ts | simulador.controller.ts | /simulador |
| Billing | billing.service.ts | billing.controller.ts | /billing |
| Lojas | lojas.service.ts | lojas.controller.ts | /lojas |
| Mídias | midias.service.ts | midias.controller.ts | /empreendimentos/:id/midias |

---

## REGRAS DE NEGÓCIO CRÍTICAS

1. **Distribuição de leads:** engine round-robin ou percentual por `empreendimento_parceiros`. Arquivo: `leads-engine.ts`
2. **Limite parceiros:** com house_de_vendas = máx 2 externos; sem = máx 3. Validado por trigger no banco.
3. **Cascade delete construtoras:** manual no service (não FK CASCADE) — ordem: unidade_midias → unidades → leads → favoritos → empreendimento_midias → empreendimentos → parceiros → construtoras → users
4. **Publicação empreendimento:** campo `publicado = TRUE` + `publicado_em = NOW()`. Apenas publicados aparecem na busca pública.
5. **Assinatura ativa:** `SubscriptionGuard` verifica `subscription_status IN ('trial', 'ativa')` para rotas protegidas por plano.
6. **Busca por IA:** `parseAiQuery()` em `page.tsx` — extrai cidade, bairro, quartos, vagas, preço, lazer do texto natural. Filtro de lazer depende da `descricao` do empreendimento conter o termo.
7. **Admin auth:** `user.role === 'admin'` verificado inline em cada endpoint admin — não há guard separado.

---

## PADRÃO DE CADASTRO DE CONSTRUTORAS (scripts/)

Todo cadastro segue o mesmo padrão. Quando o usuário pedir para cadastrar uma nova construtora:

1. **Criar o arquivo** `scripts/cadastrar-[nomeconstrutora].js`
2. **Ler as pastas** de fotos e tabelas de vendas em `D:\3 -IMOVEIS\CONSTRUTORAS\ATUAIS\[Nome]\`
3. **O script faz tudo em sequência:** login/registro → empreendimentos → unidades → fotos → publicar
4. **Idempotente:** skip automático de tudo que já existe

### Credenciais padrão
| Campo | Valor |
|---|---|
| Email | `[nomedaconstrutora]@soconstrutoras.com.br` |
| Senha | `[NOMEDACONSTRUTORA]@2026` |
| Script | `scripts/cadastrar-[nomedaconstrutora].js` |

### Registro obrigatório — campos do body `/auth/register`
```json
{
  "email": "[nome]@soconstrutoras.com.br",
  "password": "[NOME]@2026",
  "nome": "[Nome Construtora]",
  "razao_social": "[Nome Construtora] Empreendimentos",
  "role": "construtora"
}
```
> ⚠️ **`razao_social` é obrigatório** no registro — sem ele o INSERT em `construtoras` falha com 500.

### Estrutura das pastas de fotos
```
D:\3 -IMOVEIS\CONSTRUTORAS\ATUAIS\[Construtora]\
└── [DATA]-[Empreendimento]\
    ├── PERSPECTIVAS\
    │   ├── CONDOMINIO\    → fotos tipo 'foto' do empreendimento
    │   ├── APARTAMENTO\   → fotos tipo 'foto' de unidades tipo apartamento
    │   ├── AREA PRIVATIVA\→ fotos tipo 'foto' de unidades tipo garden
    │   ├── COBERTURA\     → fotos tipo 'foto' de unidades tipo cobertura
    │   ├── SALAS\         → fotos tipo 'foto' de unidades tipo comercial
    │   └── STUDIO\        → fotos tipo 'foto' de unidades tipo studio
    ├── PLANTAS\           → fotos tipo 'planta' (por tipo de unidade)
    └── TABELAS\           → PDFs de tabela de vendas (ler para extrair unidades)
```

### Tipos válidos de unidade
`apartamento` | `cobertura` | `garden` | `duplex` | `studio` | `comercial`

### Construtoras cadastradas
| Construtora | Email | Script | Status |
|---|---|---|---|
| ALTHOUSE | althouse@soconstrutoras.com.br | cadastrar-terrazzo-belvedere.js | ✅ |
| ALTTI | altti@soconstrutoras.com.br | cadastrar-altti.js | ✅ |
| ÂNIMA SIGNATURE | animasignature@soconstrutoras.com.br | cadastrar-animasignature.js | ✅ |
| ÁQUILA | aquila@soconstrutoras.com.br | cadastrar-aquila.js | ✅ |
| ACBR | acbr@soconstrutoras.com.br | cadastrar-acbr.js | ✅ |
| SANDRO PIMENTA | sandropimenta@soconstrutoras.com.br | cadastrar-sandropimenta.js | ✅ |
| BECKER | becker@soconstrutoras.com.br | cadastrar-becker.js | ✅ |
| AUDAZ | audaz@soconstrutoras.com.br | cadastrar-audaz.js | ✅ |
| BAUMAC | baumac@soconstrutoras.com.br | cadastrar-baumac.js | ✅ |
| BOTELHO | botelho@soconstrutoras.com.br | cadastrar-botelho.js | ✅ |
| BORGESI & WALLOO | borgesiwalloo@soconstrutoras.com.br | cadastrar-borgesiwalloo.js | ✅ |
| CANOPUS | canopus@soconstrutoras.com.br | cadastrar-canopus.js | ✅ |
| CASA GRANDE | casagrande@soconstrutoras.com.br | cadastrar-casagrande.js | ✅ |
| CASAMIRADOR | casamirador@soconstrutoras.com.br | cadastrar-casamirador.js | ✅ |
| COB | cob@soconstrutoras.com.br | cadastrar-cob.js | ✅ |
| COLLEM | collem@soconstrutoras.com.br | cadastrar-collem.js | ✅ |
| BERTI | berti@soconstrutoras.com.br | cadastrar-berti.js | ✅ |
| GETTA | getta@soconstrutoras.com.br | cadastrar-getta.js | ✅ |
| GRANCORP | grancorp@soconstrutoras.com.br | cadastrar-grancorp.js | ✅ |
| PLANO | plano@soconstrutoras.com.br | cadastrar-plano.js | ✅ |
| EVOLUIR | evoluir@soconstrutoras.com.br | cadastrar-evoluir.js | ✅ |
| DMC | dmc@soconstrutoras.com.br | cadastrar-dmc.js | ✅ |
| FIBRA | fibra@soconstrutoras.com.br | cadastrar-fibra.js | ✅ |
| FORÇA | forca@soconstrutoras.com.br | cadastrar-forca.js | ✅ |
| CONUP | conup@soconstrutoras.com.br | cadastrar-conup.js | ✅ |
| CONCRETO | concreto@soconstrutoras.com.br | cadastrar-concreto.js | ✅ |
| CONTTI | contti@soconstrutoras.com.br | cadastrar-contti.js | ✅ |
| CASTOR | castor@soconstrutoras.com.br | cadastrar-castor.js | ✅ |
| CAPANEMA | capanema@soconstrutoras.com.br | cadastrar-capanema.js | ✅ |
| CIMOS | cimos@soconstrutoras.com.br | cadastrar-cimos.js | ✅ |
| GARCIA | garcia@soconstrutoras.com.br | cadastrar-garcia.js | ✅ |
| FURTADO ARAÚJO | furtadoaraujo@soconstrutoras.com.br | cadastrar-furtadoaraujo.js | ✅ |
| EPO | epo@soconstrutoras.com.br | cadastrar-epo.js | ✅ |
| F2 + LUME | f2@soconstrutoras.com.br | cadastrar-f2.js | ✅ |
| INTACTA | intacta@soconstrutoras.com.br | cadastrar-intacta.js | ✅ |
| JANEIRO | janeiro@soconstrutoras.com.br | cadastrar-janeiro.js | ✅ |
| LATO | lato@soconstrutoras.com.br | cadastrar-lato.js | ✅ |
| LCG | lcg@soconstrutoras.com.br | cadastrar-lcg.js | ✅ |
| LBX | lbx@soconstrutoras.com.br | cadastrar-lbx.js | ✅ |
| LASO ENGENHARIA | laso@soconstrutoras.com.br | cadastrar-laso.js | ✅ |
| VOLUME | volume@soconstrutoras.com.br | cadastrar-volume.js | ✅ |
| LAGE | lage@soconstrutoras.com.br | cadastrar-lage.js | ✅ |
| M MPO | mmpo@soconstrutoras.com.br | cadastrar-mmpo.js | ✅ |
| M. MATOS | mmatos@soconstrutoras.com.br | cadastrar-mmatos.js | ✅ |

---

## PONTOS DE ATENÇÃO / DÍVIDAS TÉCNICAS

- [ ] Filtro de lazer (piscina, quadra etc.) depende do texto da `descricao` — implementar campos estruturados no banco
- [ ] Busca de amenidades deveria ter checkboxes no cadastro da construtora
- [ ] Testes automatizados: não existem ainda
- [ ] `schema.sql` pode estar desatualizado — tabelas `unidades`, `unidade_midias`, `favoritos`, `lojas`, `parceiro_categorias` foram adicionadas posteriormente
- [ ] Task #38 pendente: cadastrar empreendimentos Sudoeste no banco
