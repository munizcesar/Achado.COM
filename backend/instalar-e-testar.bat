@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   🚀 ACHADOCERTO - INSTALADOR AUTOMÁTICO                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
echo 🔍 Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ NODE.JS NÃO ENCONTRADO!
    echo.
    echo 📥 Baixe em: https://nodejs.org/ (versão LTS)
    echo.
    echo Após instalar, execute este arquivo novamente.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado: 
node -v

REM Ir para a pasta do backend
cd /d "%~dp0"
echo.
echo 📂 Pasta: %cd%

REM Verificar se package.json existe
if not exist "package.json" (
    echo.
    echo ❌ Erro: Arquivo package.json não encontrado!
    pause
    exit /b 1
)

REM Instalar dependências
echo.
echo 📦 Instalando dependências... (isso pode levar 1-2 minutos)
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

echo.
echo ✅ Dependências instaladas com sucesso!
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        🎉 INSTALAÇÃO CONCLUÍDA!                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Iniciando servidor...
echo.
echo 📡 O servidor estará rodando em: http://localhost:3001
echo.
echo 💡 PRÓXIMO PASSO:
echo    1. Abra outra aba do PowerShell
echo    2. Cole este comando:
echo       node teste.js
echo.
echo    OU abra no navegador:
echo       file:///c:/Users/Cesar Victor/Desktop/AchadoCerto.Vip/AchadoCerto.VIP/backend/teste.html
echo.
pause

REM Iniciar o servidor
call npm start
