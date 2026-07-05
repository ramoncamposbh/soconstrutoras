# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci

# Copia código e compila TypeScript
COPY . .
RUN npm run build

# ── Stage 2: produção (imagem mínima) ───────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copia o build gerado
COPY --from=builder /app/dist ./dist

# Health check do Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/v1/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main"]
