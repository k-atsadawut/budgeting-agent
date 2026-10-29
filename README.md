# Universal Project Analyzer & Smart Budgeting Agent (Version 2.0)

ระบบเว็บแอปพลิเคชัน AI อัจฉริยะสำหรับวิเคราะห์โครงการ บริหารงบประมาณ (Smart Budgeting) แจกแจงโครงสร้างงาน (WBS) และประเมินความเสี่ยงตามมาตรฐานสากล (PMI / Agile / Bimodal)

---

## 🌟 จุดเด่นและการปรับปรุงใหม่ (Key Features)

### 1. สถาปัตยกรรมแบบไฮบริด (Hybrid Dual-Engine)
- **เครื่องยนต์ที่ 1: n8n Workflow**
  - รองรับเวิร์กโฟลว์ n8n ที่มีอยู่เดิม (`n8n/Universal-Project-Analyzer-5-Calls.json`)
  - รองรับทั้ง **Chat Trigger** (`chatInput`) และ **Webhook Trigger** (`body`) โดยอัตโนมัติ
- **เครื่องยนต์ที่ 2: Google Gemini API Direct (Standalone Mode)**
  - สามารถรันได้ทันทีโดยไม่ต้องเปิดเซิร์ฟเวอร์ n8n แค่ใส่ `GEMINI_API_KEY` ใน `.env`
  - วิเคราะห์โครงการครบทั้ง 5 ขั้นตอนด้วยความเร็วสูงและคุณภาพระดับ Senior Project Manager
- **โหมดอัตโนมัติ (Auto / Fallback)**
  - เลือกระบบที่พร้อมใช้งานอัตโนมัติ และสลับไป Gemini API ทันทีหาก n8n ไม่ตอบสนอง

### 2. กระบวนการวิเคราะห์มาตรฐาน 5 ขั้นตอน (5-Stage Pipeline)
1. **Stage 1: Intake & Framework Profiling**
   - จำแนกประเภทโครงการ (IT/IoT, Event, Creative/Marketing)
   - เลือกระบบบริหารจัดการที่เหมาะสม (Bimodal, Waterfall, Agile)
   - กำหนดวิธีคำนวณงบประมาณ: **Top-Down** (เมื่อระบุงบมา) หรือ **Bottom-Up BOM Cost Sheet** (เมื่อไม่ได้ระบุงบ)
   - ค้นหาข้อมูลสำคัญที่ยังขาด และสร้างคำถามยืนยันกับผู้ว่าจ้าง
2. **Stage 2: Project Charter, WBS 3 ระดับ และ Test Plan**
   - Project Charter (In Scope / Out of Scope / ข้อจำกัด)
   - ตาราง WBS 3 ระดับ: Phase -> Task -> Sub-task พร้อมกำหนด Deliverable และ Role
   - แผนการตรวจรับงาน (Acceptance Test Plan) สถานะเริ่มต้นเป็น `Not Run` ทุกข้อ
3. **Stage 3: Smart Budgeting & การจัดสรรงบประมาณ 3 แพ็กเกจ**
   - ตารางแจกแจงต้นทุน: CapEx, OpEx, และ Contingency Buffer (10-15%)
   - จำลองงบประมาณ 3 แพ็กเกจ: **Lean (MVP)**, **Standard (แนะนำ)**, และ **Premium**
4. **Stage 4: การบริหารความเสี่ยงและการเปลี่ยนแปลง (Risk & Change Control)**
   - ตารางทะเบียนความเสี่ยง (Risk Register) คำนวณคะแนน Likelihood × Impact
   - กระบวนการขอเปลี่ยนแปลงขอบเขตงาน (Change Request) และวิเคราะห์ Trade-off
   - ขั้นตอน Root Cause Analysis (RCA) แยกข้อเท็จจริงออกจากสมมติฐาน
5. **Stage 5: รายงานฉบับสมบูรณ์สำหรับผู้บริหาร (Executive Reports)**
   - Operational Status Report
   - Financial & Burn Rate Report
   - Quality & Verification Report
   - Executive Summary (จุดตัดสินใจ และ 3 คำถามสำคัญสำหรับสไลด์ผู้บริหาร)

### 3. หน้าบ้าน (Frontend UI) ที่ปรับปรุงใหม่
- **ระบบเลือกตัวอย่างด่วน (Quick Sample Presets)**: เลือกระบบ E-Commerce, IoT Smart Farm หรือ งานสัมมนาเพื่อทดสอบได้ใน 1 คลิก
- **Live 5-Stage Progress Tracker**: แสดงแถบความคืบหน้าระหว่าง AI กำลังวิเคราะห์
- **Markdown & Interactive Tables**: แสดงผลตาราง WBS, ตารางงบประมาณ และป้ายสถานะ (Badges) อย่างสวยงาม
- **แท็บคัดกรองเนื้อหา (Section Tabs)**: สามารถเลือกดูเฉพาะส่วนที่ต้องการ (WBS, งบประมาณ, ความเสี่ยง หรือภาพรวม)
- **เครื่องมือส่งออกครบครัน**:
  - 📋 คัดลอกรายงานเป็น Markdown ลงคลิปบอร์ด
  - 💾 ดาวน์โหลดไฟล์ `.md`
  - 🖨️ พิมพ์หรือบันทึกเป็น PDF (`Ctrl + P` หรือคลิกปุ่มพิมพ์) พร้อมจัดหน้าแบบมืออาชีพ

---

## 📁 โครงสร้างโปรเจกต์

```text
Budgeting Agent/
├── backend/
│   ├── src/
│   │   └── server.js            # Express API รองรับ n8n + Gemini Direct
│   ├── .env.example             # ตัวอย่างการตั้งค่า Environment Variables
│   ├── .env                     # ไฟล์คอนฟิกจริง
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # หน้าบ้าน React พร้อม Markdown Viewer & Tabs
│   │   ├── main.jsx
│   │   └── styles.css           # สไตล์โมเดิร์น Responsive พร้อม Print Stylesheet
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database/
│   └── schema.sql               # PostgreSQL Schema สำหรับจัดเก็บโปรเจกต์และรายงาน
├── n8n/
│   └── Universal-Project-Analyzer-5-Calls.json  # Workflow n8n 5 ขั้นตอน
└── README.md
```

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มต้นใช้งาน

### ข้อกำหนดของระบบ
- **Node.js**: เวอร์ชัน 18 ขึ้นไป (แนะนำ 20+)
- **NPM** หรือแพ็กเกจเมเนเจอร์ที่รองรับ

### ขั้นตอนที่ 1: ตั้งค่า Backend
1. เปิดไฟล์ `backend/.env` (หรือคัดลอกจาก `backend/.env.example`)
2. เลือกโหมดที่ต้องการ:

#### ทางเลือก ก: ใช้งานด้วย Google Gemini API (Standalone - สะดวกที่สุด)
รับ API Key ฟรีได้ที่ [Google AI Studio](https://aistudio.google.com/) แล้วนำมากรอก:
```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
DEFAULT_ENGINE=auto

GEMINI_API_KEY=AIzaSy...your-gemini-api-key...
GEMINI_MODEL=gemini-2.5-flash
```

#### ทางเลือก ข: ใช้งานร่วมกับ n8n Workflow
นำไฟล์ในโฟลเดอร์ `n8n/Universal-Project-Analyzer-5-Calls.json` ไป Import ใน n8n แล้วใส่ Webhook URL:
```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
DEFAULT_ENGINE=auto

N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/f78ba702-3e12-47ad-960c-e8c239ae57a9
# N8N_API_KEY=your-optional-secret
```

*(หมายเหตุ: สามารถใส่ทั้ง 2 ค่าร่วมกันได้ โดยระบบจะเชื่อมต่อ n8n เป็นหลัก และสลับไป Gemini API ให้อัตโนมัติหาก n8n มีปัญหา)*

---

### ขั้นตอนที่ 2: รัน Backend
เปิด Terminal ที่ 1:
```bash
cd backend
npm install
npm run dev
```
เซิร์ฟเวอร์จะเริ่มทำงานที่ `http://localhost:3001`

---

### ขั้นตอนที่ 3: รัน Frontend
เปิด Terminal ที่ 2:
```bash
cd frontend
npm install
npm run dev
```
เปิดบราวเซอร์ตามที่อยู่วีไอทีที่ปรากฏ (เช่น `http://localhost:5173`)

---

## 💡 คำแนะนำการใช้งาน
1. **ทดสอบรวดเร็ว**: คลิกที่ปุ่มตัวอย่างด่วน เช่น **🛒 เว็บไซต์ E-Commerce** ระบบจะกรอกรายละเอียดให้อัตโนมัติ
2. **การระบุงบประมาณ**:
   - หากใส่วงเงิน เช่น `50,000` บาท ระบบจะวิเคราะห์แบบ **Top-Down** แบ่งสัดส่วนตามหมวดงานและกันงบสำรอง 10-15%
   - หากเว้นว่างไว้ ระบบจะวิเคราะห์แบบ **Bottom-Up BOM Cost Sheet** และระบุสิ่งที่ไม่ทราบเป็น `[รอระบุ]`
3. **การส่งออกรายงาน**: เมื่อผลลัพธ์ปรากฏ สามารถคลิก **พิมพ์ / ส่งออก PDF** เพื่อบันทึกเป็นเอกสารนำเสนอผู้บริหารได้ทันที
