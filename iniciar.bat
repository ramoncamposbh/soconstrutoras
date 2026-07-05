@echo off
title SoConstrutoras - Iniciando...
echo.
echo ======================================
echo   SoConstrutoras - Ambiente Local
echo ======================================
echo.

REM Inicia o backend em nova janela
echo [1/2] Iniciando Backend (NestJS - porta 3000)...
start "Backend - NestJS" cmd /k "cd /d "%~dp0backend" && npm run start:dev"

REM Aguarda 3 segundos antes de iniciar frontend
timeout /t 3 /nobreak >nul

REM Inicia o frontend em nova janela (instala deps se necessário)
echo [2/2] Iniciando Frontend (Next.js - porta 3001)...
start "Frontend - Next.js" cmd /k "cd /d "%~dp0frontend" && if not exist node_modules (echo Instalando dependencias... && npm install) && npm run dev -- --port 3001"

echo.
echo ======================================
echo  Aguarde ~30s e acesse:
echo  http://localhost:3001
echo ======================================
echo.
pause
