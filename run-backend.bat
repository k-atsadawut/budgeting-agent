@echo off
title Backend API (Port 3001)
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0backend"
echo Starting Backend API at http://localhost:3001 ...
npm run dev
