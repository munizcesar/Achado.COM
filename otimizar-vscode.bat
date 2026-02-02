@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              🚀 OTIMIZADOR VS CODE                       ║
echo ║              AchadoCerto.VIP - Performance                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Otimizando VS Code...
echo.

REM Fechar VS Code se estiver aberto
echo ⏹️  Fechando VS Code...
taskkill /f /im "Code.exe" >nul 2>&1

REM Aguardar um pouco
ping 127.0.0.1 -n 3 > nul

REM Limpar cache do VS Code
echo 🧹 Limpando cache...
if exist "%APPDATA%\Code\User\workspaceStorage" (
    echo Limpando workspace storage...
    rmdir /s /q "%APPDATA%\Code\User\workspaceStorage" >nul 2>&1
)

if exist "%APPDATA%\Code\CachedExtensions" (
    echo Limpando cache de extensões...
    rmdir /s /q "%APPDATA%\Code\CachedExtensions" >nul 2>&1
)

echo.
echo ⚡ Criando configurações otimizadas...

REM Criar configurações de performance
set VSCODE_CONFIG=%APPDATA%\Code\User\settings.json

REM Backup das configurações atuais
if exist "%VSCODE_CONFIG%" (
    copy "%VSCODE_CONFIG%" "%VSCODE_CONFIG%.backup" >nul 2>&1
    echo 💾 Backup criado: settings.json.backup
)

REM Escrever configurações otimizadas
echo { > "%VSCODE_CONFIG%"
echo   "files.watcherExclude": { >> "%VSCODE_CONFIG%"
echo     "**/node_modules/**": true, >> "%VSCODE_CONFIG%"
echo     "**/.git/**": true, >> "%VSCODE_CONFIG%"
echo     "**/backend/node_modules/**": true, >> "%VSCODE_CONFIG%"
echo     "**/*.log": true >> "%VSCODE_CONFIG%"
echo   }, >> "%VSCODE_CONFIG%"
echo   "search.exclude": { >> "%VSCODE_CONFIG%"
echo     "**/node_modules": true, >> "%VSCODE_CONFIG%"
echo     "**/backend/node_modules": true, >> "%VSCODE_CONFIG%"
echo     "**/.git": true >> "%VSCODE_CONFIG%"
echo   }, >> "%VSCODE_CONFIG%"
echo   "files.exclude": { >> "%VSCODE_CONFIG%"
echo     "**/node_modules": true, >> "%VSCODE_CONFIG%"
echo     "**/.git": true >> "%VSCODE_CONFIG%"
echo   }, >> "%VSCODE_CONFIG%"
echo   "extensions.autoUpdate": false, >> "%VSCODE_CONFIG%"
echo   "extensions.autoCheckUpdates": false, >> "%VSCODE_CONFIG%"
echo   "telemetry.telemetryLevel": "off", >> "%VSCODE_CONFIG%"
echo   "workbench.enableExperiments": false, >> "%VSCODE_CONFIG%"
echo   "workbench.settings.enableNaturalLanguageSearch": false, >> "%VSCODE_CONFIG%"
echo   "typescript.disableAutomaticTypeAcquisition": true, >> "%VSCODE_CONFIG%"
echo   "typescript.suggest.autoImports": "off", >> "%VSCODE_CONFIG%"
echo   "javascript.suggest.autoImports": "off", >> "%VSCODE_CONFIG%"
echo   "editor.quickSuggestions": false, >> "%VSCODE_CONFIG%"
echo   "editor.suggestOnTriggerCharacters": false, >> "%VSCODE_CONFIG%"
echo   "editor.acceptSuggestionOnCommitCharacter": false, >> "%VSCODE_CONFIG%"
echo   "editor.minimap.enabled": false, >> "%VSCODE_CONFIG%"
echo   "breadcrumbs.enabled": false, >> "%VSCODE_CONFIG%"
echo   "editor.renderWhitespace": "none", >> "%VSCODE_CONFIG%"
echo   "git.enabled": false, >> "%VSCODE_CONFIG%"
echo   "git.autorefresh": false >> "%VSCODE_CONFIG%"
echo } >> "%VSCODE_CONFIG%"

echo ✅ Configurações otimizadas aplicadas!
echo.

echo 🚀 Abrindo VS Code otimizado...
echo.

REM Abrir VS Code com apenas o arquivo necessário
cd /d "%~dp0"
start "" code index.html

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ CONCLUÍDO!                         ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ ⚡ VS Code otimizado para performance                    ║
echo ║ 🧹 Cache limpo                                           ║
echo ║ 🔧 Configurações aplicadas                              ║
echo ║ 📁 Abrindo apenas index.html                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

pause