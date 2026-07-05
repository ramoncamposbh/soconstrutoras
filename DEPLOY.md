# SóConstrutoras — Guia de Deploy

Sequência completa para colocar o sistema no ar pela primeira vez.
Tempo estimado: **45–60 minutos**.

---

## Pré-requisitos (instale antes)

- [Git](https://git-scm.com)
- [Node.js 20+](https://nodejs.org)
- Conta no [GitHub](https://github.com) (gratuito)
- Conta no [Railway](https://railway.app) (gratuito — login com GitHub)
- Conta no [Vercel](https://vercel.com) (gratuito — login com GitHub)
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito)
- Conta no [Cloudflare](https://cloudflare.com) para o R2 (storage de fotos)
- Conta no [Resend](https://resend.com) para e-mails (100 e-mails/dia grátis)

---

## Passo 1 — Banco de dados (Neon)

1. Acesse [neon.tech](https://neon.tech) → **New Project**
2. Nome: `soconstrutoras` | Região: `South America (São Paulo)`
3. Copie a **Connection String** no formato:
   ```
   postgresql://user:senha@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Abra um terminal e rode o schema:
   ```bash
   psql "sua_connection_string_aqui" -f schema.sql
   ```
   > Se não tiver psql instalado: use o **SQL Editor** do Neon e cole o conteúdo de `schema.sql`

---

## Passo 2 — Storage de fotos (Cloudflare R2)

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**
2. Nome do bucket: `soconstrutoras-midias`
3. Em **Settings** do bucket → **Public access** → habilite o **Custom Domain** ou o **R2.dev subdomain**
   - Anote a URL pública, ex: `https://pub-xxx.r2.dev`
4. Vá em **Manage R2 API tokens** → **Create API token**
   - Permissões: **Object Read & Write**
   - Anote: `Access Key ID` e `Secret Access Key`
5. O endpoint do R2 fica em: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - O `ACCOUNT_ID` aparece na URL do seu dashboard Cloudflare

---

## Passo 3 — E-mail transacional (Resend)

1. Acesse [resend.com](https://resend.com) → **Add Domain** (ou use o domínio sandbox para testes)
2. Vá em **API Keys** → **Create API Key**
3. Anote a chave: `re_xxxxxxxxx`
4. Para testes sem domínio próprio, o Resend aceita enviar para `delivered@resend.dev`

---

## Passo 4 — Subir o código no GitHub

```bash
# Na raiz do projeto SóConstrutoras
git init
git add .
git commit -m "feat: MVP inicial"

# Crie um repositório no GitHub (pode ser privado) e siga as instruções:
git remote add origin https://github.com/SEU_USUARIO/soconstrutoras.git
git push -u origin main
```

---

## Passo 5 — Deploy do Backend (Railway)

1. Acesse [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Selecione o repositório → escolha a pasta `/backend`
3. Railway detectará o `Dockerfile` automaticamente

### Variáveis de ambiente (Railway → Settings → Variables)

Cole todas as variáveis abaixo, substituindo os valores:

```
NODE_ENV=production
PORT=3000

# Banco (Neon)
DATABASE_URL=postgresql://user:senha@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require

# JWT — gere uma string segura com: openssl rand -hex 64
JWT_SECRET=cole_aqui_string_de_64_chars_minimo
JWT_EXPIRES_IN=7d

# Frontend (preencher após Passo 6)
FRONTEND_URL=https://seu-projeto.vercel.app

# Storage R2
STORAGE_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
STORAGE_BUCKET=soconstrutoras-midias
STORAGE_ACCESS_KEY=sua_access_key
STORAGE_SECRET_KEY=sua_secret_key
STORAGE_PUBLIC_URL=https://pub-xxx.r2.dev

# E-mail (Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxx
EMAIL_FROM=noreply@seudominio.com.br
```

4. Clique em **Deploy** e aguarde o build (~3 min)
5. Acesse a URL gerada (ex: `https://soconstrutoras-api.up.railway.app`) e teste:
   ```
   GET https://soconstrutoras-api.up.railway.app/api/v1/health
   ```
   Deve retornar: `{"status":"ok","database":"connected"}`

6. Anote a URL da API do Railway — você vai precisar no próximo passo.

---

## Passo 6 — Deploy do Frontend (Vercel)

1. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório GitHub
2. **Root Directory**: selecione `/frontend`
3. Framework: Next.js (detectado automaticamente)

### Variáveis de ambiente (Vercel → Settings → Environment Variables)

```
NEXT_PUBLIC_API_URL=https://soconstrutoras-api.up.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

4. Clique em **Deploy** (~2 min)
5. Anote a URL do Vercel e volte ao Railway para atualizar `FRONTEND_URL` com ela
6. No Railway, redeploy após atualizar a variável (Settings → Deploy → Redeploy)

---

## Passo 7 — Verificação final

Acesse sua URL do Vercel e teste o fluxo completo:

- [ ] Home carrega empreendimentos (vazia no início — normal)
- [ ] `/auth/register` — cadastre uma construtora de teste
- [ ] `/dashboard` — veja o painel
- [ ] Crie um empreendimento e publique
- [ ] Adicione um parceiro
- [ ] Vincule o parceiro ao empreendimento
- [ ] Acesse a URL pública do imóvel e envie um lead
- [ ] Verifique se o e-mail chegou ao parceiro

---

## Domínio personalizado (opcional)

### Frontend (Vercel)
1. Vercel → Project → Settings → Domains → **Add Domain**
2. Adicione `www.soconstrutoras.com.br`
3. Configure o DNS no seu registrador conforme as instruções do Vercel

### Backend (Railway)
1. Railway → Service → Settings → Networking → **Custom Domain**
2. Use `api.soconstrutoras.com.br`

---

## Atualizações futuras

Após o deploy inicial, qualquer `git push` para o branch `main` dispara redeploy automático tanto no Railway quanto no Vercel.

```bash
# Fluxo de atualização
git add .
git commit -m "fix: descrição da alteração"
git push origin main
# → Railway e Vercel fazem o deploy automaticamente
```

---

## Custos estimados (free tier)

| Serviço | Free tier | Quando pagar |
|---------|-----------|--------------|
| Railway | $5 crédito/mês | Quando ultrapassar o crédito |
| Vercel  | Ilimitado para projetos pessoais | Nunca (até escalar muito) |
| Neon    | 0.5 GB storage | Quando banco > 500 MB |
| R2      | 10 GB storage, 10M req | Quando ultrapassar |
| Resend  | 100 e-mails/dia | Quando volume crescer |

**Total inicial: R$ 0/mês**

---

## Suporte e próximos passos

Após validar o MVP com usuários reais, os próximos itens na sequência são:

1. **Billing** — Stripe para cobrar as construtoras mensalmente
2. **App Mobile** — React Native para o parceiro ver leads no celular
3. **WhatsApp** — Notificação via Z-API além do e-mail
4. **Admin** — Painel para você gerenciar a plataforma
