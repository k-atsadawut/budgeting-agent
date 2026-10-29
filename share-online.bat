@echo off
title Sharing Budgeting Agent Online
echo ========================================================
echo สร้างลิงก์สาธารณะ HTTPS สำหรับแชร์ให้คนอื่นใช้งานทันที
echo ========================================================
set PATH=%PATH%;C:\Program Files\nodejs

echo [!] โปรดตรวจสอบว่าเซิร์ฟเวอร์ (Backend Port 3001) กำลังเปิดอยู่
echo กำลังเชื่อมต่อเครือข่ายอินเทอร์เน็ตสาธารณะ...
echo.
npx --yes localtunnel --port 3001
pause
