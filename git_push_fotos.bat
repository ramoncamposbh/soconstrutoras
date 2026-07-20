@echo off
echo === Git Push - Fotos Empreendimentos Sudoeste ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"
echo Removendo index.lock...
del /f ".git\index.lock" 2>nul
echo Adicionando arquivos...
git add frontend/public/empreendimentos/ frontend/src/app/page.tsx
echo Commitando...
git commit -m "feat: empreendimentos Sudoeste + layout mobile clean"
echo Fazendo push...
git push origin main
echo.
echo === Concluido! Vercel vai redeployar automaticamente ===
pause
