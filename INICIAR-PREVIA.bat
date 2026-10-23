@echo off
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
  echo Instale o Node.js 24 em https://nodejs.org e abra este arquivo novamente.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Preparando a primeira execucao. E necessario acesso a internet.
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
  call npm run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Abra http://127.0.0.1:4180 no navegador e mantenha esta janela aberta.
node preview-local.mjs
pause
