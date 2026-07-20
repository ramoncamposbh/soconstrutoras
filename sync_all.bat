@echo off
echo === Sync: commita todas as mudancas pendentes ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

del /f ".git\index.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

git add backend/src/app.module.ts
git add backend/src/empreendimentos/empreendimentos.service.ts
git add backend/src/unidades/
git add frontend/src/app/page.tsx
git add frontend/src/app/dashboard/empreendimentos/
git add frontend/src/components/unidades/
git add frontend/src/lib/api.ts
git add frontend/src/types/index.ts

echo.
echo === Arquivos que serao commitados: ===
git diff --cached --name-only

git commit -m "feat: busca IA completa + modulo de unidades por empreendimento"
git push origin main

echo.
echo === Pronto! Railway e Vercel vao rebuildar ===
pause
