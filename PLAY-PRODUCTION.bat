@echo off
title GRID PROTOCOL - PRODUCTION
cd /d "%~dp0"

echo.
echo   GRID PROTOCOL ============================================
echo   Production launcher: minified build, local server, app window
echo   ==========================================================
echo.

if not exist "dist\index.html" (
  echo [GRID] No production bundle found - building it now...
  call npm run build
  if errorlevel 1 goto :fail
)

echo [GRID] Serving production build on http://127.0.0.1:8777
start "GRID PROTOCOL - SERVER" /min cmd /c "python -m http.server 8777 --directory dist"
timeout /t 3 /nobreak >nul

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  echo [GRID] Opening the grid in an app window...
  start "" "%CHROME%" --app=http://127.0.0.1:8777/ --window-size=1600,900
) else (
  start "" "http://127.0.0.1:8777/"
)

echo.
echo [GRID] Running. The minimised "SERVER" window keeps it alive -
echo        close that window to shut the grid down.
echo.
timeout /t 6 /nobreak >nul
exit /b 0

:fail
echo [GRID] Build failed - run "npm install" then try again.
pause
exit /b 1
