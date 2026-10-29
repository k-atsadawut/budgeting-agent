@echo off
title Frontend UI (Port 5173)
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0frontend"
echo Starting Frontend UI at http://localhost:5173 ...
npm run dev
