@echo off
cd /d "c:\Users\Cesar Victor\Desktop\AchadoCerto.Vip\AchadoCerto.VIP\backend"
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak
node server.js
pause
