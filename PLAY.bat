@echo off
title TRON: ARES - PROTOCOL OVERRIDE
cd /d "%~dp0"

if not exist node_modules (
  echo [ARES] First run - installing dependencies...
  call npm install
)

echo [ARES] Booting grid protocol...
echo [ARES] The game will open in your default browser at http://127.0.0.1:5173
echo [ARES] Press Ctrl+C in this window to shut the grid down.
call npm run dev -- --host 127.0.0.1 --port 5173 --open
