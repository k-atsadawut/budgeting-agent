import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

function getSavedProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '500kb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'universal-project-agent-api', timestamp: new Date().toISOString() });
});

// Project Persistence CRUD Endpoints
app.get('/api/projects', (_req, res) => {
  const projects = getSavedProjects();
  res.json({ ok: true, projects });
});

app.post('/api/projects', (req, res) => {
  const { projectName, projectType, description, budget, timeline, qualityTier, report, engineUsed, id } = req.body || {};
  if (!projectName?.trim() || !report?.trim()) {
    return res.status(400).json({ error: 'ต้องการชื่อโครงการและเนื้อหารายงาน' });
  }

  const projects = getSavedProjects();
  const projectId = id || crypto.randomUUID();
  const existingIdx = projects.findIndex((p) => p.id === projectId);

  const projectRecord = {
    id: projectId,
    projectName: projectName.trim(),
    projectType: projectType || 'ทั่วไป',
    description: (description || '').trim(),
    budget: budget != null ? Number(budget) : null,
    timeline: timeline || 'ไม่ระบุ',
    qualityTier: qualityTier || 'Standard',
    engineUsed: engineUsed || 'auto',
    report: report.trim(),
    updatedAt: new Date().toISOString(),
    createdAt: existingIdx >= 0 ? projects[existingIdx].createdAt : new Date().toISOString()
  };

  if (existingIdx >= 0) {
    projects[existingIdx] = projectRecord;
  } else {
    projects.unshift(projectRecord);
  }

  saveProjects(projects);
  res.json({ ok: true, project: projectRecord });
});

app.get('/api/projects/:id', (req, res) => {
  const projects = getSavedProjects();
  const found = projects.find((p) => p.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'ไม่พบโครงการนี้' });
  res.json({ ok: true, project: found });
});

app.delete('/api/projects/:id', (req, res) => {
  let projects = getSavedProjects();
  const initialLength = projects.length;
  projects = projects.filter((p) => p.id !== req.params.id);
  if (projects.length === initialLength) {
    return res.status(404).json({ error: 'ไม่พบโครงการที่ต้องการลบ' });
  }
  saveProjects(projects);
  res.json({ ok: true, message: 'ลบโครงการเรียบร้อยแล้ว' });
});

/**
 * Call n8n Workflow (supports Chat Trigger, Webhook Trigger, and n8n AI Agents)
 */
async function callN8n(payload) {
  const webhookUrl = (process.env.N8N_WEBHOOK_URL || '').trim();
  if (!webhookUrl) throw new Error('ยังไม่ได้ตั้งค่า N8N_WEBHOOK_URL ใน backend/.env');

  const headers = { 'content-type': 'application/json' };
  if (process.env.N8N_API_KEY) {
    headers['x-agent-key'] = process.env.N8N_API_KEY;
    headers['authorization'] = `Bearer ${process.env.N8N_API_KEY}`;
  }

  // Format rich chatInput string so n8n Chat Trigger ($json.chatInput) receives full context
  const chatInput = [
    `ชื่อโครงการ: ${payload.projectName}`,
    `ประเภท: ${payload.projectType || 'ไม่ระบุ'}`,
    `งบประมาณ: ${payload.budget != null ? `${Number(payload.budget).toLocaleString('th-TH')} บาท` : 'ไม่ได้ระบุ'}`,
    `ระยะเวลา: ${payload.timeline || 'ไม่ได้ระบุ'}`,
    `ระดับงบประมาณที่ต้องการ: ${payload.qualityTier || 'Standard'}`,
    `รายละเอียดโครงการและเป้าหมาย:`,
    payload.description
  ].join('\n');

  const bodyToSend = {
    ...payload,
    chatInput,
    message: chatInput,
    text: chatInput
  };

  const upstream = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyToSend),
    signal: AbortSignal.timeout(180000) // 3 minutes timeout for multi-call workflows
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    throw new Error(`n8n HTTP ${upstream.status}: ${raw.slice(0, 300)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }

  // Extract report from common n8n return shapes
  if (Array.isArray(parsed) && parsed.length > 0) {
    const item = parsed[0]?.json || parsed[0];
    return item?.output ?? item?.text ?? item?.report ?? item?.response ?? JSON.stringify(item, null, 2);
  }
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed.output ?? parsed.text ?? parsed.report ?? parsed.response ?? parsed.data ?? JSON.stringify(parsed, null, 2);
  }
  return String(parsed);
}

/**
 * Call Gemini API directly (Standalone 5-Stage Project Analysis Pipeline)
 */
async function callGemini(payload) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน backend/.env');

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const budgetDisplay = payload.budget != null && payload.budget > 0
    ? `${Number(payload.budget).toLocaleString('th-TH')} บาท (Top-Down)`
    : 'ไม่ระบุ (Bottom-Up BOM Cost Sheet)';

  const systemInstruction = `คุณคือ Senior Project Management & Smart Budgeting AI Agent ผู้เชี่ยวชาญระดับสากล
หน้าที่ของคุณคือวิเคราะห์โครงการและจัดทำรายงานแผนงานและงบประมาณฉบับสมบูรณ์ครอบคลุมทั้ง 5 ขั้นตอน (5 Stages) ตามมาตรฐาน PMI, Agile, และ Smart Budgeting

กฎเหล็กสำคัญ:
1. ห้ามแต่งตัวเลขข้อเท็จจริง (ราคา วันที่ งบ จำนวนคน) ที่ผู้ใช้ไม่ได้ให้ หากไม่ทราบให้ใส่ [รอระบุ]
2. ห้ามใส่ API Token / รหัสผ่าน / Secrets ใดๆ ในเอกสาร
3. ผลการทดสอบทุกข้อใน Test Plan ต้องเริ่มต้นเป็นสถานะ Not Run และระบุหลักฐานที่ต้องเก็บ
4. ห้ามประกาศว่า "เสร็จสมบูรณ์ / พร้อมใช้งาน" หากยังไม่มีผลการทดสอบ
5. ตอบเป็นภาษาไทย จัดรูปแบบด้วย Markdown อย่างสวยงาม ชัดเจน และใช้ตารางเมื่อเหมาะสม`;

  const userPrompt = `โปรดวิเคราะห์โครงการต่อไปนี้ และสร้างรายงานฉบับสมบูรณ์ครบทั้ง 5 ขั้นตอน:

=== ข้อมูลโครงการ ===
- ชื่อโครงการ: ${payload.projectName}
- ประเภทโครงการ: ${payload.projectType || 'ทั่วไป'}
- รายละเอียดและเป้าหมาย: ${payload.description}
- งบประมาณตั้งต้น: ${budgetDisplay}
- ระยะเวลาที่ต้องการ: ${payload.timeline || 'ไม่ระบุ'}
- ระดับแพ็กเกจคุณภาพ: ${payload.qualityTier || 'Standard'}

---
โปรดจัดทำเอกสารรายงาน Markdown โดยต้องมีหัวข้อหลักและเนื้อหาครบถ้วนดังต่อไปนี้:

# ${payload.projectName} — แผนกลยุทธ์โครงการและการจัดสรรงบประมาณอัจฉริยะ

## 📌 บทสรุปข้อมูลตั้งต้น (Intake & Project Profiling)
- **ประเภทโครงการ**: (จำแนกเป็น IT / IoT, Event / Construction หรือ Creative / Marketing พร้อมเหตุผล)
- **Framework ที่เหมาะสม**: (Bimodal, Waterfall, หรือ Agile ตามธรรมชาติของงาน)
- **เป้าหมายหลัก (Core Goal)**: 1 ประโยคสรุปชัดเจน
- **แนวทางงบประมาณ**: ${payload.budget ? 'Top-Down Budgeting (แบ่งสัดส่วนตามหมวดงานจากงบตั้งต้น)' : 'Bottom-Up Cost Sheet (ถอดรายการทรัพยากรจาก WBS)'}
- **ข้อมูลสำคัญที่ยังขาด / สมมติฐานหลัก**: ระบุเป็นข้อๆ
- **คำถามสำคัญที่ต้องยืนยันกับผู้ว่าจ้าง (Questions)**: 3-4 ข้อ

---

## 🏗️ Stage 2: Project Charter, WBS และ Acceptance Test Plan
### 1) Project Charter
- วัตถุประสงค์เชิงกลยุทธ์
- ขอบเขตงานชัดเจน: **In Scope** (สิ่งที่ต้องทำ) vs **Out of Scope** (สิ่งที่ไม่รวม)
- กลุ่มผู้มีส่วนได้ส่วนเสีย (Stakeholders) และข้อจำกัดหลัก (Constraints)

### 2) โครงสร้างการแบ่งงาน WBS 3 ระดับ (Phase -> Task -> Sub-task)
จัดทำเป็นตาราง Markdown:
| Phase | Task (WBS Code) | Sub-task | ผู้รับผิดชอบ (Role) | ความขึ้นต่อกัน (Dependency) | กรอบเวลา | ผลงานส่งมอบ (Deliverable) |
|---|---|---|---|---|---|---|
(เขียนแจกแจงขั้นตอนอย่างสมบูรณ์ตาม Framework ที่เลือก)

### 3) Test Plan & เกณฑ์การตรวจรับมอบงาน (Acceptance Criteria)
จัดทำเป็นตาราง Markdown:
| ID | รายการทดสอบ / เกณฑ์ตรวจรับ | วิธีการและเงื่อนไขผ่าน | หลักฐานที่ต้องแนบ (Artifacts) | สถานะเริ่มต้น |
|---|---|---|---|---|
| TC-01 | ... | ... | ... | Not Run |
(อย่างน้อย 4-5 รายการหลัก ทุกข้อสถานะเริ่มต้นเป็น Not Run)

---

## 💰 Stage 3: Smart Budgeting & การจัดสรรงบประมาณ 3 ระดับ
### 1) ตารางจำแนกต้นทุน (Cost Breakdown Structure)
| หมวดค่าใช้จ่าย | รายการทรัพยากร | ประเภท (CapEx / OpEx / Reserve) | จำนวน | ราคาประเมินต่อหน่วย | รวม (บาท) |
|---|---|---|---|---|---|
(จำแนกแยก CapEx, OpEx ให้เห็นชัดเจน ตัวเลขที่ไม่มีให้ใส่ [รอระบุ])

### 2) สรุปสัดส่วนงบประมาณและการสำรองความเสี่ยง
- **CapEx (Capital Expenditure)**: ทรัพย์สินถาวร / อุปกรณ์ / ค่าจัดทำเริ่มต้น
- **OpEx (Operational Expenditure)**: ค่าแรง / ค่าบริการรายเดือน / ค่าดำเนินการ
- **Contingency Buffer (10-15%)**: งบสำรองฉุกเฉินสำหรับความเสี่ยงที่ระบุได้

### 3) การจำลองแพ็กเกจงบประมาณ 3 ระดับ (3-Tier Simulation)
- **แผนประหยัด (Lean / MVP)**: สิ่งที่ได้รับ, สิ่งที่ตัดออก, กรอบงบประมาณ
- **แผนมาตรฐาน (Standard - แนะนำ)**: สเปกที่สมดุลระหว่างฟังก์ชัน ความคุ้มค่า และเวลา
- **แผนจัดเต็ม (Premium)**: สิ่งที่เพิ่มพิเศษ, ความทนทาน, บริการเสริมและ SLA

---

## 🛡️ Stage 4: การบริหารความเสี่ยง และการควบคุมการเปลี่ยนแปลง (Risk & Change Control)
### 1) ทะเบียนความเสี่ยง (Risk Register)
| ความเสี่ยง | โอกาสเกิด (L 1-5) | ผลกระทบ (I 1-5) | คะแนน (L×I) | สัญญาณเตือนล่วงหน้า (Early Warning) | แผนป้องกัน / ทางรับมือ | ผลต่องบและเวลา |
|---|---|---|---|---|---|---|
(ระบุความเสี่ยงด้านเทคนิค, งบประมาณ, เวลา, และบุคลากร อย่างน้อย 4 ข้อ)

### 2) ระเบียบการควบคุมการเปลี่ยนแปลง (Change Request Workflow)
- ข้อกำหนด Change Request (CR Template & Process)
- การวิเคราะห์ผลกระทบตามสามเหลี่ยมบริหารโครงการ (Scope vs Cost vs Time vs Quality)
- กฎ Sign-off บังคับก่อนเริ่มงานนอกขอบเขต

### 3) ขั้นตอนการวิเคราะห์หาสาเหตุที่แท้จริง (Root Cause Analysis - RCA)
- การแยก "ข้อเท็จจริง (Facts)" ออกจาก "สมมติฐาน (Assumptions)"
- Log และหลักฐานที่ต้องบันทึกเพื่อตรวจสอบ

---

## 📊 Stage 5: รายงานฉบับสมบูรณ์สำหรับผู้บริหาร (Executive Reports)
### 1) Operational Status Report
- สถานะภาพรวม: ⚪ ยังไม่เริ่ม (พร้อมเกณฑ์การขยับสถานะเป็น Green / Amber / Red)
- สรุปงานค้างและขั้นตอนถัดไป (Next Immediate Actions)

### 2) Financial & Burn Rate Management
- แผนการเบิกจ่ายและแนวทางติดตามงบประมาณจริง (Planned vs Actual Spend)
- สูตรและเกณฑ์แจ้งเตือน Overbudget

### 3) Quality & Verification Summary
- สรุปภาพรวมการตรวจรับ (Ready for UAT / Launch Gate)

### 4) Executive Decision & Confirmation (สรุปสำหรับผู้บริหาร)
- สรุปจุดสำคัญ 3-4 บรรทัด (สำหรับนำขึ้นสไลด์ผู้บริหาร)
- **ประเด็นที่ต้องตัดสินใจทันที (Immediate Decision Needed)**
- **คำถาม 3 ข้อที่ต้องยืนยันก่อนเริ่มโครงการจริง**`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192
    }
  };

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(120000)
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    console.error('Gemini API Error:', upstream.status, raw.slice(0, 500));
    let errMessage = `Gemini API HTTP ${upstream.status}`;
    try {
      const errObj = JSON.parse(raw);
      if (errObj.error?.message) errMessage += `: ${errObj.error.message}`;
    } catch {}
    throw new Error(errMessage);
  }

  const data = JSON.parse(raw);
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!text) throw new Error('Gemini ไม่ส่งข้อความกลับมา');
  return text;
}

// Main Analyze Endpoint
app.post('/api/analyze', async (req, res) => {
  const { projectName, projectType, description, budget, timeline, qualityTier, engine = 'auto' } = req.body || {};

  if (!projectName?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อโครงการและรายละเอียดโครงการ' });
  }

  const payload = {
    projectName: projectName.trim(),
    projectType: projectType || 'ไม่ระบุ',
    description: description.trim(),
    budget: budget === '' || budget == null ? null : Number(budget),
    timeline: timeline || 'ไม่ระบุ',
    qualityTier: qualityTier || 'Standard',
    requestedAt: new Date().toISOString(),
    source: 'universal-project-agent-web'
  };

  const n8nConfigured = Boolean(process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL.trim());
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

  let targetEngine = engine;
  if (targetEngine === 'auto') {
    if (n8nConfigured) {
      targetEngine = 'n8n';
    } else if (geminiConfigured) {
      targetEngine = 'gemini';
    } else {
      return res.status(503).json({
        error: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ AI Engine ใน backend/.env',
        setupHint: 'กรุณากำหนด N8N_WEBHOOK_URL สำหรับเชื่อมต่อ n8n หรือ GEMINI_API_KEY สำหรับรันแบบ Standalone Direct ในไฟล์ backend/.env'
      });
    }
  }

  try {
    let report = '';
    let usedEngine = targetEngine;

    if (targetEngine === 'n8n') {
      try {
        report = await callN8n(payload);
      } catch (n8nErr) {
        // Fallback to Gemini if configured
        if (geminiConfigured) {
          console.warn('n8n failed, falling back to Gemini API directly:', n8nErr.message);
          report = await callGemini(payload);
          usedEngine = 'gemini-fallback';
        } else {
          throw n8nErr;
        }
      }
    } else if (targetEngine === 'gemini') {
      report = await callGemini(payload);
    } else {
      return res.status(400).json({ error: `ไม่รู้จัก engine: ${targetEngine}` });
    }

    // Auto-save to persistent history
    let savedProject = null;
    try {
      const projects = getSavedProjects();
      savedProject = {
        id: crypto.randomUUID(),
        projectName: payload.projectName,
        projectType: payload.projectType,
        description: payload.description,
        budget: payload.budget,
        timeline: payload.timeline,
        qualityTier: payload.qualityTier,
        engineUsed: usedEngine,
        report: report,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      projects.unshift(savedProject);
      saveProjects(projects);
    } catch (saveErr) {
      console.warn('Auto-save failed:', saveErr.message);
    }

    return res.json({
      ok: true,
      report,
      engineUsed: usedEngine,
      project: savedProject || payload
    });
  } catch (error) {
    console.error('Analysis failed:', error.message);
    const isTimeout = error.name === 'TimeoutError' || error.message.includes('timeout');
    return res.status(502).json({
      error: `การวิเคราะห์โครงการไม่สำเร็จ (${targetEngine})`,
      details: isTimeout ? 'กระบวนการใช้เวลานานเกินกำหนด กรุณาลองใหม่อีกครั้ง' : error.message
    });
  }
});

// Serve production static frontend if built (All-in-one fullstack deploy)
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(port, () => console.log(`Project Pilot API listening at http://localhost:${port}`));
