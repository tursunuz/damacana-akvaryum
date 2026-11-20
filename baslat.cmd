@echo off
setlocal
cd /d "%~dp0"
set "AQUARIUM_NODE=%~dp0oyun\runtime\node.exe"
if not exist "%AQUARIUM_NODE%" set "AQUARIUM_NODE=node.exe"
"%AQUARIUM_NODE%" --version >nul 2>&1
if errorlevel 1 (
  echo Node.js 24+ is required. Download the Windows ZIP or install Node.js.
  pause
  exit /b 1
)
set "PORT=8787"
echo Yonetim / Admin: http://127.0.0.1:8787/admin
start "" "http://127.0.0.1:8787/admin"
"%AQUARIUM_NODE%" oyun\server.mjs
pause
