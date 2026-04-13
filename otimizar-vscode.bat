@echo off
chcp 65001 >nul
setlocal

set "SCRIPT=%~dp0scripts\otimizar-vscode.ps1"

if not exist "%SCRIPT%" (
  echo ERRO: script nao encontrado em:
  echo %SCRIPT%
  pause
  exit /b 1
)

echo ===== OTIMIZAR VS CODE =====
echo.
echo 1 - Limpeza rapida ^(cache, logs, history, cache de extensoes^)
echo 2 - Limpeza profunda ^(inclui workspaceStorage antigo e chats locais antigos^)
echo.
set /p OPCAO=Escolha uma opcao [1/2]: 

if "%OPCAO%"=="2" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Deep -KeepWorkspaceCount 1 -KeepChatSessions 5
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
)

echo.
echo ===== PROCESSO FINALIZADO =====
pause
