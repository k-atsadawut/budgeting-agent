@echo off
title Starting Budgeting Agent
echo ========================================================
echo Starting ProjectPilot AI - Universal Budgeting Agent
echo ========================================================
set PATH=%PATH%;C:\Program Files\nodejs

echo [1/2] Starting Backend Server on http://localhost:3001 ...
start "Backend API (Port 3001)" cmd /k "title Backend API (Port 3001) && set PATH=%%PATH%%;C:\Program Files\nodejs && cd /d ""%~dp0backend"" && npm run dev"

echo [2/2] Starting Frontend Web UI on http://localhost:5173 ...
start "Frontend UI (Port 5173)" cmd /k "title Frontend UI (Port 5173) && set PATH=%%PATH%%;C:\Program Files\nodejs && cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ========================================================
echo ทั้ง Backend และ Frontend กำลังเริ่มทำงานแล้ว!
echo หน้าต่างเบราว์เซอร์จะเปิดที่ http://localhost:5173
echo ========================================================
timeout /t 4 >nul
start http://localhost:5173
