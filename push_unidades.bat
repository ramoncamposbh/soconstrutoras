@echo off
echo === Modulo de Unidades: backend + dashboard ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

del /f ".git\index.lock" 2>nul
del /f ".git\refs\heads\main.lock" 2>nul

git add backend/src/unidades/
git add backend/src/app.module.ts
git add frontend/src/app/dashboard/empreendimentos/
git add frontend/src/components/unidades/
git add frontend/src/lib/api.ts
git add frontend/src/types/index.ts

git diff --cached --name-only
git commit -m "feat: modulo de unidades (tipos, fotos, limite por plano) no dashboard"
git push origin main

echo.
echo === IMPORTANTE: execute add_unidades.sql no Neon SQL Editor ===
echo === Railway e Vercel vao rebuildar automaticamente ===
pause
