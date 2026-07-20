@echo off
echo === Dashboard: cards clicaveis + thumbnail empreendimentos ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

del /f ".git\index.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

git add frontend/src/app/dashboard/page.tsx
git add frontend/src/app/dashboard/empreendimentos/page.tsx
git diff --cached --name-only
git commit -m "feat: cards dashboard clicaveis + thumbnail na lista de empreendimentos"
git push origin main

echo.
echo === Pronto! Vercel vai rebuildar ===
pause
