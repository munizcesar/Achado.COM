@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║               🌐 TESTADOR DE SITE                        ║
echo ║               AchadoCerto.VIP - Testes                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo 🔍 Verificando arquivos...
echo.

if not exist "index.html" (
    echo ❌ Arquivo index.html não encontrado!
    pause
    exit /b 1
)

if not exist "blog\jbl-wave-buds-2.html" (
    echo ❌ Arquivo blog\jbl-wave-buds-2.html não encontrado!
    pause
    exit /b 1
)

echo ✅ Arquivos encontrados!
echo.

echo 🚀 Abrindo site para teste...
echo.

REM Abrir homepage
echo 📄 Abrindo Homepage (index.html)...
start "" "index.html"

REM Aguardar
ping 127.0.0.1 -n 2 > nul

REM Abrir post do JBL
echo 📄 Abrindo Post JBL (com widget)...
start "" "blog\jbl-wave-buds-2.html"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ TESTES ABERTOS!                   ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 🌐 Homepage: index.html                                  ║
echo ║ 📱 Post JBL: blog/jbl-wave-buds-2.html                  ║
echo ║                                                          ║
echo ║ 🎯 PROCURE POR:                                          ║
echo ║ • Homepage: seção "SISTEMA AUTOMÁTICO"                  ║
echo ║ • Post JBL: widget azul do Motorola                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 💡 DICAS DE TESTE:
echo.
echo ✅ Widget funcionando = Mostra preço + botão
echo 🔄 Widget carregando = Spinner + "Buscando preço..."  
echo 🔗 Widget fallback = "Verificando preço no ML..."
echo.

pause