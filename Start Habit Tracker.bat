@echo off
title Habit Tracker
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0"

rem Start the dev server on port 5174 (5173 is used by the trading journal)
start "Habit Tracker Server" /min cmd /c "npm run dev -- --port 5174"

rem Give the server a moment to boot, then open the browser
timeout /t 3 /nobreak >nul
start http://localhost:5174
