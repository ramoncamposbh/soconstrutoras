@echo off
echo === Fix build + scroll mobile + mapa mobile ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

echo Removendo index.lock...
del /f ".git\index.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

echo Resetando index...
git reset HEAD -- .

echo Adicionando arquivos corrigidos...
git add frontend/next.config.js
git add frontend/src/app/page.tsx
git add frontend/src/components/mapa/MapaEmpreendimentos.tsx

echo Conferindo o que vai ser commitado...
git diff --cached --name-only

echo Commitando...
git commit -m "fix: TypeScript + scroll mobile + mapa mobile centralizar"

echo Fazendo push...
git push origin main

echo.
echo === Pronto! Vercel vai rebuildar ===
pause
