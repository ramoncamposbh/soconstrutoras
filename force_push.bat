@echo off
echo === Force push: atualiza index e commita mudancas pendentes ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

:: Remove locks antigos
del /f ".git\index.lock" 2>nul
del /f ".git\HEAD.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

:: Forca o git a re-examinar todos os arquivos (ignora cache de mtime)
git update-index --really-refresh 2>nul

:: Adiciona os arquivos com mudancas reais
git add "frontend/src/app/imoveis/[slug]/page.tsx"
git add "frontend/src/components/unidades/SecaoUnidades.tsx"

echo.
echo === Arquivos staged: ===
git diff --cached --name-only

echo.
echo === Status: ===
git status --short

git commit -m "fix: page imovel com faixa de preco das unidades + botao acesso unidades"
git push origin main

echo.
echo === Pronto! Vercel vai rebuildar ===
pause
