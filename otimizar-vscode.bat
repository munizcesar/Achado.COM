@echo off
chcp 65001 >nul
echo ===== Diagnóstico VS Code Batch =====
echo.
echo Testando se o comando code existe no PATH...
where code
if errorlevel 1 (
  echo ERRO: comando 'code' NAO encontrado no PATH!
  echo Corrija o PATH ou reinstale o VS Code com "Add to PATH".
  goto FIM
)
echo.
echo Testando code --version:
code --version
echo.
echo Testando code --list-extensions:
code --list-extensions
echo.
echo Testando abrir VS Code sem extensoes:
code --disable-extensions
echo.
:FIM
echo.
echo ===== FIM DO TESTE =====
pause
