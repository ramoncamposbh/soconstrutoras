@echo off
echo === Pagina do imovel: faixa de preco + modal de unidades ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

del /f ".git\index.lock" 2>nul
del /f ".git\HEAD.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

git add frontend/src/app/imoveis/
git add frontend/src/components/unidades/SecaoUnidades.tsx

git diff --cached --name-only
git commit -m "feat: pagina do imovel com faixa de preco das unidades + botao/modal de unidades"
git push origin main

echo.
echo === Pronto! Vercel vai rebuildar ===
pause
