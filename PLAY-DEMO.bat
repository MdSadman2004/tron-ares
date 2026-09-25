@echo off
title GRID PROTOCOL - AUTONOMOUS DEMO
cd /d "%~dp0"

echo.
echo   GRID PROTOCOL - AUTONOMOUS DEMO ==========================
echo   TouchDrive autopilot + auto-fire drive the machine.
echo   Watch it fight, transform and derezz on its own.
echo   ==========================================================
echo.

if not exist "dist\index.html" (
  echo [GRID] Building production bundle...
  call npm run build
  if errorlevel 1 goto :fail
)

start "GRID PROTOCOL - SERVER" /min cmd /c "python -m http.server 8777 --directory dist"
timeout /t 3 /nobreak >nul

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" --app="http://127.0.0.1:8777/?auto=1" --window-size=1600,900
) else (
  start "" "http://127.0.0.1:8777/?auto=1"
)

echo.
echo [GRID] Autonomous run started - it restarts itself after every derezz.
echo        Press V or B in the window to take the controls back.
timeout /t 6 /nobreak >nul
exit /b 0

:fail
echo [GRID] Build failed.
pause
exit /b 1
