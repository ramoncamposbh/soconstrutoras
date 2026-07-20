@echo off
echo === Matando processos git travados ===
taskkill /f /im git.exe 2>nul
timeout /t 1 /nobreak >nul

cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

echo === Removendo locks ===
del /f ".git\index.lock" 2>nul
del /f ".git\HEAD.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

echo === Commitando fix do listarPublico ===
git add backend/src/unidades/unidades.service.ts
git diff --cached --name-only
git commit -m "fix: listarPublico unidades sem filtro publicado"
git push origin main

echo.
echo === Pronto! Railway vai rebuildar o backend ===
pause
