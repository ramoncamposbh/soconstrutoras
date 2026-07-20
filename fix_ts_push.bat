@echo off
echo === Fix TypeScript + Git Push ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"
echo Removendo index.lock...
del /f ".git\index.lock" 2>nul
echo Adicionando page.tsx corrigido...
git add frontend/src/app/page.tsx
echo Commitando...
git commit -m "fix: TypeScript error PesquisaRapida type"
echo Fazendo push...
git push origin main
echo.
echo === Concluido! Vercel vai redeployar ===
pause
