@echo off
echo === Push do commit pendente para o GitHub ===
cd /d "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

del /f ".git\index.lock" 2>nul

git log --oneline -3
echo.
git push origin main

echo.
echo === Pronto! Railway e Vercel vao rebuildar ===
pause
