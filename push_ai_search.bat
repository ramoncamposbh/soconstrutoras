@echo off
echo === Busca IA: deteccao de bairro + animacao mais lenta ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

del /f ".git\index.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

git add frontend/src/app/page.tsx
git add backend/src/empreendimentos/empreendimentos.service.ts
git diff --cached --name-only
git commit -m "fix: detectar 'no bairro X' na busca IA + animacao de progresso mais lenta"
git push origin main

echo.
echo === Pronto! Vercel vai rebuildar ===
pause
