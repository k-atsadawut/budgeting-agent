import { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  FileText,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  Cpu,
  Layers,
  RefreshCw,
  Zap,
  HelpCircle,
  ChevronDown,
  FileSpreadsheet,
  Table,
  Trash2,
  Eye,
  Bookmark,
  Search,
  History
} from 'lucide-react';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location) {
    // If running in Vite dev server (port 5173), target backend at port 3001
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    // In production or when served by backend, use same origin
    return '';
  }
  return 'http://localhost:3001';
};
const API = getApiBaseUrl();

// Sample templates for 1-click testing
const SAMPLES = [
  {
    label: '🛒 เว็บไซต์ E-Commerce',
    projectName: 'ระบบร้านค้าออนไลน์ & จัดการคลังสินค้า',
    projectType: 'Software / เว็บไซต์',
    budget: '75000',
    timeline: '45 วัน',
    qualityTier: 'Standard',
    description: 'ต้องการสร้างเว็บไซต์ขายสินค้าออนไลน์ พร้อมระบบชำระเงินผ่าน QR Code / บัตรเครดิต, ระบบตัดสต็อกสินค้าอัตโนมัติ, ระบบสะสมคะแนนลูกค้า, และหลังบ้านสำหรับดูรายงานยอดขาย'
  },
  {
    label: '🌱 IoT Smart Farm',
    projectName: 'ระบบควบคุมโรงเรือนเกษตรอัจฉริยะ',
    projectType: 'IT Infrastructure / Hardware',
    budget: '120000',
    timeline: '60 วัน',
    qualityTier: 'Standard',
    description: 'ติดตั้งระบบเซ็นเซอร์วัดอุณหภูมิ ความชื้นในดิน แสงแดด พร้อมกล่องคอนโทรลเลอร์สั่งเปิด-ปิดวาล์วน้ำและพัดลมอัตโนมัติ ดูข้อมูลและสั่งการผ่านแอปพลิเคชันมือถือ'
  },
  {
    label: '🎪 งานสัมมนาวิชาการ',
    projectName: 'งานประชุมวิชาการนวัตกรรมและเทคโนโลยี 2026',
    projectType: 'อีเวนต์ / กิจกรรม',
    budget: '250000',
    timeline: '90 วัน',
    qualityTier: 'Premium',
    description: 'จัดงานประชุมสัมมนาวิชาการ 2 วัน ผู้เข้าร่วม 300 คน ประกอบด้วยห้องประชุมใหญ่ ห้องสัมมนาย่อย 3 ห้อง บูธนิทรรศการ 20 บูธ พร้อมระบบลงทะเบียนและถ่ายทอดสด Live Streaming'
  }
];

// Helper to format inline markdown (bold, code, badges)
function formatInline(text) {
  if (!text) return '';
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const content = token.slice(2, -2);
      // Auto-badge key terms
      if (/Not Run/i.test(content)) {
        parts.push(<span key={match.index} className="badge badge-gray">{content}</span>);
      } else if (/Pass/i.test(content)) {
        parts.push(<span key={match.index} className="badge badge-green">{content}</span>);
      } else if (/Fail/i.test(content)) {
        parts.push(<span key={match.index} className="badge badge-red">{content}</span>);
      } else if (/Lean|MVP/i.test(content)) {
        parts.push(<span key={match.index} className="badge badge-blue">{content}</span>);
      } else if (/Standard/i.test(content)) {
        parts.push(<span key={match.index} className="badge badge-purple">{content}</span>);
      } else if (/Premium/i.test(content)) {
        parts.push(<span key={match.index} className="badge badge-gold">{content}</span>);
      } else {
        parts.push(<strong key={match.index}>{content}</strong>);
      }
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index}>{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length ? parts : text;
}

// Custom Markdown Renderer that renders clean tables, headers, and callouts
function MarkdownView({ content, filterSection }) {
  const blocks = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const result = [];
    let currentTable = null;
    let currentQuote = null;
    let currentList = null;

    const flushTable = () => {
      if (currentTable) {
        result.push({ type: 'table', headers: currentTable.headers, rows: currentTable.rows });
        currentTable = null;
      }
    };
    const flushQuote = () => {
      if (currentQuote) {
        result.push({ type: 'quote', lines: currentQuote });
        currentQuote = null;
      }
    };
    const flushList = () => {
      if (currentList) {
        result.push({ type: 'list', items: currentList });
        currentList = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Table row
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushQuote();
        flushList();
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        const isDivider = cells.every((c) => /^:?-+:?$/.test(c) || c === '');

        if (!currentTable) {
          currentTable = { headers: cells, rows: [] };
        } else if (isDivider) {
          // ignore separator line
        } else {
          currentTable.rows.push(cells);
        }
        continue;
      } else {
        flushTable();
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        flushList();
        const text = trimmed.replace(/^>\s?/, '');
        if (!currentQuote) currentQuote = [text];
        else currentQuote.push(text);
        continue;
      } else {
        flushQuote();
      }

      // Unordered list
      if (/^[-*]\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[-*]\s+/, '');
        if (!currentList) currentList = [text];
        else currentList.push(text);
        continue;
      } else {
        flushList();
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        result.push({ type: 'h3', text: trimmed.slice(4) });
      } else if (trimmed.startsWith('## ')) {
        result.push({ type: 'h2', text: trimmed.slice(3) });
      } else if (trimmed.startsWith('# ')) {
        result.push({ type: 'h1', text: trimmed.slice(2) });
      } else if (trimmed === '---' || trimmed === '***') {
        result.push({ type: 'hr' });
      } else if (trimmed.length > 0) {
        result.push({ type: 'p', text: trimmed });
      }
    }

    flushTable();
    flushQuote();
    flushList();
    return result;
  }, [content]);

  // Section filtering if active
  const filteredBlocks = useMemo(() => {
    if (!filterSection || filterSection === 'all') return blocks;
    const output = [];
    let capture = false;

    for (const b of blocks) {
      if (b.type === 'h2') {
        if (filterSection === 'intake' && (b.text.includes('Intake') || b.text.includes('ข้อมูลตั้งต้น'))) {
          capture = true;
        } else if (filterSection === 'wbs' && (b.text.includes('Stage 2') || b.text.includes('WBS') || b.text.includes('Charter'))) {
          capture = true;
        } else if (filterSection === 'budget' && (b.text.includes('Stage 3') || b.text.includes('Budget') || b.text.includes('งบประมาณ'))) {
          capture = true;
        } else if (filterSection === 'risk' && (b.text.includes('Stage 4') || b.text.includes('Risk') || b.text.includes('ความเสี่ยง'))) {
          capture = true;
        } else if (filterSection === 'summary' && (b.text.includes('Stage 5') || b.text.includes('Executive') || b.text.includes('ผู้บริหาร') || b.text.includes('รายงานฉบับสมบูรณ์'))) {
          capture = true;
        } else {
          capture = false;
        }
      }
      if (capture) {
        output.push(b);
      }
    }
    return output.length > 0 ? output : blocks;
  }, [blocks, filterSection]);

  return (
    <div className="markdown-render">
      {filteredBlocks.map((b, idx) => {
        if (b.type === 'h1') return <h1 key={idx} className="doc-h1">{formatInline(b.text)}</h1>;
        if (b.type === 'h2') return <h2 key={idx} className="doc-h2">{formatInline(b.text)}</h2>;
        if (b.type === 'h3') return <h3 key={idx} className="doc-h3">{formatInline(b.text)}</h3>;
        if (b.type === 'hr') return <hr key={idx} className="doc-hr" />;
        if (b.type === 'quote') {
          return (
            <div key={idx} className="doc-quote">
              {b.lines.map((l, li) => (
                <p key={li}>{formatInline(l)}</p>
              ))}
            </div>
          );
        }
        if (b.type === 'list') {
          return (
            <ul key={idx} className="doc-list">
              {b.items.map((it, ii) => (
                <li key={ii}>{formatInline(it)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === 'table') {
          return (
            <div key={idx} className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    {b.headers.map((h, hi) => (
                      <th key={hi}>{formatInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{formatInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={idx} className="doc-p">{formatInline(b.text)}</p>;
      })}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({
    projectName: '',
    projectType: 'Software / เว็บไซต์',
    description: '',
    budget: '50000',
    timeline: '30 วัน',
    qualityTier: 'Standard',
    engine: 'auto'
  });

  const [report, setReport] = useState('');
  const [engineUsed, setEngineUsed] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState('new');
  const [status, setStatus] = useState({ n8nConfigured: false, geminiConfigured: false });
  const [filterSection, setFilterSection] = useState('all');
  const [copied, setCopied] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [exportDropdown, setExportDropdown] = useState(null); // 'topbar' | 'report' | null
  const toggleExport = (id) => setExportDropdown((prev) => (prev === id ? null : id));

  // Saved Projects Persistence State
  const [savedProjects, setSavedProjects] = useState([]);
  const [searchHistory, setSearchHistory] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // Load saved projects from backend / local storage
  const loadSavedProjects = async () => {
    try {
      const res = await fetch(`${API}/api/projects`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.projects)) {
        setSavedProjects(data.projects);
        localStorage.setItem('saved_budget_projects', JSON.stringify(data.projects));
      }
    } catch {
      const local = localStorage.getItem('saved_budget_projects');
      if (local) {
        try { setSavedProjects(JSON.parse(local)); } catch {}
      }
    }
  };

  useEffect(() => {
    loadSavedProjects();
  }, []);

  const handleSaveCurrentProject = async () => {
    if (!report) return;
    try {
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentProjectId,
          projectName: form.projectName,
          projectType: form.projectType,
          description: form.description,
          budget: form.budget ? Number(form.budget) : null,
          timeline: form.timeline,
          qualityTier: form.qualityTier,
          engineUsed: engineUsed || form.engine,
          report
        })
      });
      const data = await res.json();
      if (data.ok) {
        setCurrentProjectId(data.project.id);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        loadSavedProjects();
      }
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteProject = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('คุณต้องการลบโครงการนี้ออกจากประวัติใช่หรือไม่?')) return;
    try {
      await fetch(`${API}/api/projects/${id}`, { method: 'DELETE' });
      loadSavedProjects();
      if (currentProjectId === id) setCurrentProjectId(null);
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    }
  };

  const handleOpenProject = (proj) => {
    setForm({
      projectName: proj.projectName || '',
      projectType: proj.projectType || 'Software / เว็บไซต์',
      description: proj.description || '',
      budget: proj.budget != null ? String(proj.budget) : '',
      timeline: proj.timeline || '',
      qualityTier: proj.qualityTier || 'Standard',
      engine: proj.engineUsed || 'auto'
    });
    setReport(proj.report || '');
    setEngineUsed(proj.engineUsed || 'auto');
    setCurrentProjectId(proj.id);
    setActive('report');
    setFilterSection('all');
  };

  // Close export dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.export-dropdown-container')) {
        setExportDropdown(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Check backend server status & engine readiness on mount
  useEffect(() => {
    fetch(`${API}/api/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus({
            n8nConfigured: Boolean(data.n8nConfigured),
            geminiConfigured: Boolean(data.geminiConfigured),
            geminiModel: data.geminiModel
          });
        }
      })
      .catch(() => {
        // backend might be starting or not yet up
      });
  }, []);

  // Cycle progress stages during analysis
  useEffect(() => {
    let timer;
    if (busy) {
      setActiveStageIndex(0);
      timer = setInterval(() => {
        setActiveStageIndex((prev) => (prev < 4 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [busy]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const loadSample = (sample) => {
    setForm({
      ...form,
      projectName: sample.projectName,
      projectType: sample.projectType,
      budget: sample.budget,
      timeline: sample.timeline,
      qualityTier: sample.qualityTier,
      description: sample.description
    });
  };

  async function analyze(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setReport('');
    setEngineUsed('');

    try {
      const response = await fetch(`${API}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details ? `${data.error} (${data.details})` : data.error || 'วิเคราะห์ไม่สำเร็จ');
      }
      setReport(typeof data.report === 'string' ? data.report : JSON.stringify(data.report, null, 2));
      setEngineUsed(data.engineUsed || form.engine);
      if (data.project?.id) setCurrentProjectId(data.project.id);
      setActive('report');
      setFilterSection('all');
      loadSavedProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const copyReport = () => {
    const { text } = getExportData();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getSafeFileName = () => (form.projectName || 'project-plan').replace(/[^a-zA-Z0-9ก-๙]/g, '_');

  // Smart Export Data: works at ANY time (Full Report or Project Brief Specification)
  const getExportData = () => {
    if (report && report.trim()) {
      return {
        isFull: true,
        title: form.projectName || 'รายงานวิเคราะห์โครงการฉบับสมบูรณ์',
        text: report
      };
    }

    const budgetDisplay = form.budget
      ? `${Number(form.budget).toLocaleString('th-TH')} บาท`
      : 'ไม่ระบุ (ประเมินแบบ Bottom-Up)';

    const briefText = [
      `# ข้อกำหนดและขอบเขตโครงการ: ${form.projectName || 'โครงการใหม่'}`,
      `> เอกสารสรุปข้อมูลตั้งต้นของโครงการ (Project Intake & Charter Brief)`,
      '',
      `## 📌 ข้อมูลตั้งต้นของโครงการ`,
      `| ข้อมูลโครงการ | รายละเอียด |`,
      `|---|---|`,
      `| ชื่อโครงการ | ${form.projectName || '[ยังไม่ได้ระบุชื่อโครงการ]'} |`,
      `| ประเภทโครงการ | ${form.projectType || 'ทั่วไป'} |`,
      `| งบประมาณตั้งต้น | ${budgetDisplay} |`,
      `| ระยะเวลาดำเนินการ | ${form.timeline || '[ยังไม่ได้ระบุ]'} |`,
      `| ระดับคุณภาพงบประมาณ | ${form.qualityTier || 'Standard'} |`,
      `| วันที่จัดทำเอกสาร | ${new Date().toLocaleDateString('th-TH')} |`,
      '',
      `## 📝 รายละเอียดและเป้าหมายโครงการ`,
      form.description ? form.description : '(ยังไม่ได้กรอกรายละเอียดโครงการ)',
      '',
      `---`,
      `*จัดทำผ่าน ProjectPilot AI — Universal Project Analyzer & Smart Budgeting Agent*`
    ].join('\n');

    return {
      isFull: false,
      title: form.projectName || 'ร่างข้อกำหนดโครงการ',
      text: briefText
    };
  };

  const exportMarkdown = () => {
    const { text, isFull } = getExportData();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getSafeFileName()}_${isFull ? 'Analysis_Report' : 'Project_Brief'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const { text, isFull } = getExportData();
    const lines = text.split('\n');
    const sections = [];
    let currentTitle = 'ตารางข้อมูล';
    let currentRows = [];
    let lastHeading = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#')) {
        lastHeading = line.replace(/^#+\s*/, '').trim();
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.slice(1, -1).split('|').map((c) => c.trim());
        const isDivider = cells.every((c) => /^:?-+:?$/.test(c) || c === '');

        if (!isDivider) {
          if (currentRows.length === 0) {
            currentTitle = lastHeading || 'ตารางข้อมูล';
          }
          currentRows.push(cells);
        }
      } else {
        if (currentRows.length > 0) {
          sections.push({ title: currentTitle, rows: currentRows });
          currentRows = [];
        }
      }
    }
    if (currentRows.length > 0) {
      sections.push({ title: currentTitle, rows: currentRows });
    }

    let csvContent = `\uFEFFโครงการ:,"${(form.projectName || '').replace(/"/g, '""')}"\n`;
    csvContent += `งบประมาณ:,"${form.budget ? `${Number(form.budget).toLocaleString('th-TH')} บาท` : 'Bottom-Up'}"\n`;
    csvContent += `ประเภทไฟล์:,"${isFull ? 'รายงานวิเคราะห์ฉบับสมบูรณ์ (5 Stages)' : 'บรีฟข้อมูลโครงการตั้งต้น'}"\n`;
    csvContent += `วันที่จัดทำ:,"${new Date().toLocaleDateString('th-TH')}"\n\n`;

    sections.forEach((sec, idx) => {
      csvContent += `[ส่วนที่ ${idx + 1}] "${sec.title.replace(/"/g, '""')}"\n`;
      sec.rows.forEach((row) => {
        const cleanRow = row.map((cell) => {
          const t = cell.replace(/\*\*/g, '').replace(/`/g, '').trim();
          if (t.includes(',') || t.includes('"') || t.includes('\n')) {
            return `"${t.replace(/"/g, '""')}"`;
          }
          return t;
        });
        csvContent += cleanRow.join(',') + '\n';
      });
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getSafeFileName()}_${isFull ? 'Budget_and_WBS' : 'Project_Brief'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportWord = () => {
    const { text, isFull } = getExportData();
    let htmlContent = text
      .replace(/^# (.*$)/gim, '<h1 style="color:#1e1b4b;border-bottom:2px solid #6366f1;padding-bottom:6px;font-size:22pt;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#312e81;margin-top:22px;border-left:4px solid #6366f1;padding-left:8px;font-size:17pt;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color:#4338ca;font-size:14pt;">$1</h3>')
      .replace(/^\> (.*$)/gim, '<div style="background:#f1f5f9;border-left:4px solid #6366f1;padding:10px;margin:12px 0;">$1</div>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\n\n/gim, '<p></p>');

    const lines = htmlContent.split('\n');
    let inTable = false;
    let newLines = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
        const isDivider = cells.every((c) => /^:?-+:?$/.test(c) || c === '');
        if (!isDivider) {
          if (!inTable) {
            newLines.push('<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin:16px 0;font-size:11pt;border-color:#cbd5e1;">');
            newLines.push('<tr style="background:#f1f5f9;font-weight:bold;">' + cells.map((c) => `<th>${c}</th>`).join('') + '</tr>');
            inTable = true;
          } else {
            newLines.push('<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>');
          }
        }
      } else {
        if (inTable) {
          newLines.push('</table>');
          inTable = false;
        }
        newLines.push(line);
      }
    }
    if (inTable) newLines.push('</table>');
    htmlContent = newLines.join('\n');

    const wordTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${form.projectName || 'Project Document'}</title>
        <style>
          body { font-family: 'TH Sarabun New', 'Angsana New', 'Cordia New', Arial, sans-serif; font-size: 14pt; line-height: 1.6; color: #1e293b; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 11pt; }
          th { background-color: #f1f5f9; font-weight: bold; padding: 6px 10px; border: 1px solid #cbd5e1; }
          td { padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
        </style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:25px;">
          <h1 style="color:#1e1b4b;margin-bottom:6px;">${isFull ? 'รายงานการวิเคราะห์โครงการและการบริหารงบประมาณ' : 'เอกสารสรุปข้อกำหนดโครงการ (Project Brief)'}</h1>
          <p style="color:#64748b;font-size:12pt;">จัดทำโดย ProjectPilot AI · วันที่ ${new Date().toLocaleDateString('th-TH')}</p>
        </div>
        <hr style="border:0;border-top:1px solid #cbd5e1;margin-bottom:20px;" />
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordTemplate], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getSafeFileName()}_${isFull ? 'Project_Document' : 'Project_Brief'}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const { isFull } = getExportData();
    const dataToExport = {
      project: form,
      isFullAnalysis: isFull,
      engineUsed: isFull ? engineUsed : null,
      generatedAt: new Date().toISOString(),
      report: report || null
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getSafeFileName()}_${isFull ? 'Full_Data' : 'Brief_Data'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  // Shared reusable Export Dropdown Component
  const renderExportMenu = () => {
    const { isFull } = getExportData();
    return (
      <div className="export-menu-dropdown">
        <div className="export-menu-header">
          <span>{isFull ? '📊 ส่งออกรายงานฉบับสมบูรณ์ (5 Stages)' : '📝 ส่งออกร่างข้อมูลโครงการ (Intake Brief)'}</span>
        </div>
        <button className="export-item" onClick={() => { exportCSV(); setExportDropdown(null); }}>
          <span className="export-icon-badge green"><FileSpreadsheet size={16} /></span>
          <div>
            <strong>Microsoft Excel (.csv)</strong>
            <small>{isFull ? 'ตาราง WBS และงบประมาณ (ฟอนต์ไทยสมบูรณ์)' : 'ตารางข้อมูลและงบประมาณตั้งต้น'}</small>
          </div>
        </button>
        <button className="export-item" onClick={() => { exportWord(); setExportDropdown(null); }}>
          <span className="export-icon-badge blue"><FileText size={16} /></span>
          <div>
            <strong>Microsoft Word (.doc)</strong>
            <small>{isFull ? 'รูปเล่มรายงานโครงการ เปิดใน Word / Docs' : 'เอกสารใบสรุปบรีฟโครงการ'}</small>
          </div>
        </button>
        <button className="export-item" onClick={() => { exportMarkdown(); setExportDropdown(null); }}>
          <span className="export-icon-badge purple"><FileText size={16} /></span>
          <div>
            <strong>Markdown (.md)</strong>
            <small>ไฟล์เอกสารมาตรฐานสำหรับ Notion / Obsidian</small>
          </div>
        </button>
        <button className="export-item" onClick={() => { exportJSON(); setExportDropdown(null); }}>
          <span className="export-icon-badge amber"><Layers size={16} /></span>
          <div>
            <strong>JSON Data (.json)</strong>
            <small>ข้อมูลโครงสร้างสำหรับเชื่อมต่อระบบ API</small>
          </div>
        </button>
      </div>
    );
  };

  const STAGES = [
    { title: 'Intake & Profiling', desc: 'วิเคราะห์ประเภท & เลือกระบบ Framework' },
    { title: 'Charter & WBS Plan', desc: 'สร้างโครงสร้าง WBS 3 ระดับ & Test Plan' },
    { title: 'Smart Budgeting', desc: 'ประเมินงบประมาณ CapEx/OpEx 3 แพ็กเกจ' },
    { title: 'Risk & Change Control', desc: 'จัดทำ Risk Register & แนวทางควบคุม' },
    { title: 'Executive Summary', desc: 'ประกอบรายงานฉบับสมบูรณ์สำหรับผู้บริหาร' }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>
          <div>
            <strong>ProjectPilot <span>AI</span></strong>
            <small>SMART BUDGETING & AGENT</small>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <button
          className={`nav-item ${active === 'new' ? 'selected' : ''}`}
          onClick={() => setActive('new')}
        >
          <BriefcaseBusiness size={18} /> สร้างโปรเจกต์ใหม่
        </button>
        <button
          className={`nav-item ${active === 'report' ? 'selected' : ''}`}
          onClick={() => setActive('report')}
        >
          <FileText size={18} /> รายงานการวิเคราะห์
          {report && <span className="nav-badge">พร้อม</span>}
        </button>
        <button
          className={`nav-item ${active === 'history' ? 'selected' : ''}`}
          onClick={() => setActive('history')}
        >
          <History size={18} /> ประวัติโครงการที่บันทึก
          {savedProjects.length > 0 && <span className="nav-count-badge">{savedProjects.length}</span>}
        </button>

        {/* Engine Connectivity Status */}
        <div className="engine-status-box">
          <span className="box-title">ENGINE STATUS</span>
          <div className="status-row">
            <span className="dot-name">
              <span className={`status-dot ${status.n8nConfigured ? 'green' : 'amber'}`} />
              n8n Workflow
            </span>
            <small>{status.n8nConfigured ? 'เชื่อมต่อแล้ว' : 'ยังไม่ตั้ง URL'}</small>
          </div>
          <div className="status-row">
            <span className="dot-name">
              <span className={`status-dot ${status.geminiConfigured ? 'green' : 'amber'}`} />
              Gemini Standalone
            </span>
            <small>{status.geminiConfigured ? 'พร้อมใช้งาน' : 'ยังไม่ใส่ Key'}</small>
          </div>
        </div>

        <div className="side-card">
          <div className="side-icon">
            <Bot size={20} />
          </div>
          <strong>Hybrid AI Architecture</strong>
          <p>รองรับทั้ง n8n Cloud Workflow เดิม และ Google Gemini API โดยตรงสำหรับการทำงานแบบ Standalone</p>
          <div className="online">
            <i /> ระบบพร้อมทำงาน
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="avatar">PM</span>
          <div>
            <strong>Project Workspace</strong>
            <small>Dual Engine · Full-Stack</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar no-print">
          <div className="mobile-brand-bar">
            <div className="brand-mark sm">
              <Sparkles size={16} />
            </div>
            <strong>ProjectPilot</strong>
          </div>
          <div className="breadcrumb desktop-breadcrumb">
            Workspace <span>/</span> <b>{active === 'history' ? 'ประวัติโครงการที่บันทึกไว้' : active === 'report' ? 'รายงานการวิเคราะห์ฉบับสมบูรณ์' : 'สร้างโปรเจกต์ใหม่'}</b>
          </div>
          <div className="topbar-actions">
            <div className="engine-indicator">
              <span className="pulse" />
              <span>โหมด: <strong>{form.engine === 'auto' ? 'อัตโนมัติ' : form.engine === 'n8n' ? 'n8n' : 'Gemini'}</strong></span>
            </div>

            {/* Quick Export in Topbar — ALWAYS accessible at ANY time */}
            <div className="export-dropdown-container">
              <button
                className="topbar-export-btn"
                onClick={() => toggleExport('topbar')}
                title="ส่งออกไฟล์ได้ทุกเมื่อ"
              >
                <Download size={14} />
                <span className="export-btn-label">ส่งออกไฟล์</span>
                <ChevronDown size={13} className={exportDropdown === 'topbar' ? 'rotate-180' : ''} />
              </button>
              {exportDropdown === 'topbar' && renderExportMenu()}
            </div>
          </div>
        </header>

        <section className="hero no-print">
          <div className="eyebrow">
            <Sparkles size={14} /> UNIVERSAL PROJECT ANALYZER & SMART BUDGETING
          </div>
          <h1>
            เปลี่ยนไอเดียให้เป็น<br />
            <em>แผนโครงการและงบประมาณที่ชัดเจน</em>
          </h1>
          <p>
            วิเคราะห์ WBS ขอบเขตงาน งบประมาณ 3 ระดับ ความเสี่ยง และเกณฑ์ตรวจรับงาน<br className="desktop-only" />
            ด้วย AI วิเคราะห์โครงการอัจฉริยะ รองรับทั้ง n8n Workflow และ Gemini Direct API
          </p>
          <div className="hero-stats">
            <div>
              <span className="stat-icon violet">
                <ChartNoAxesCombined size={18} />
              </span>
              <div>
                <b>WBS & Test Plan</b>
                <small>แยก Phase, Task, เกณฑ์ตรวจรับ</small>
              </div>
            </div>
            <div>
              <span className="stat-icon green">
                <CircleDollarSign size={18} />
              </span>
              <div>
                <b>3-Tier Smart Budget</b>
                <small>Lean · Standard · Premium</small>
              </div>
            </div>
            <div>
              <span className="stat-icon amber">
                <ShieldAlert size={18} />
              </span>
              <div>
                <b>Risk & Change Control</b>
                <small>Risk Matrix, RCA & Trade-off</small>
              </div>
            </div>
          </div>
        </section>

        {active === 'new' && (
          <div className="content-grid no-print">
            <section className="form-card">
              <div className="section-heading">
                <div>
                  <span className="step">STEP 01</span>
                  <h2>บอกเราเกี่ยวกับโปรเจกต์</h2>
                  <p>กรอกข้อมูล หรือคลิกเลือกตัวอย่างโครงการเพื่อเริ่มต้นได้ทันที</p>
                </div>
                <span className="required">* จำเป็น</span>
              </div>

              {/* Sample Templates Bar */}
              <div className="samples-bar">
                <span className="samples-label">ตัวอย่างด่วน:</span>
                {SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="sample-pill"
                    onClick={() => loadSample(s)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <form onSubmit={analyze}>
                <label>
                  ชื่อโครงการ <b>*</b>
                  <input
                    name="projectName"
                    value={form.projectName}
                    onChange={change}
                    placeholder="เช่น ระบบร้านค้าออนไลน์และจัดการคลังสินค้า"
                    required
                    maxLength="120"
                  />
                </label>

                <div className="field-row">
                  <label>
                    ประเภทโครงการ
                    <select name="projectType" value={form.projectType} onChange={change}>
                      <option>Software / เว็บไซต์</option>
                      <option>IT Infrastructure / Hardware / IoT</option>
                      <option>ธุรกิจ / การตลาด / Creative</option>
                      <option>อีเวนต์ / จัดงาน / ก่อสร้าง</option>
                      <option>งานสร้างสรรค์ / วิจัย</option>
                      <option>อื่น ๆ</option>
                    </select>
                  </label>
                  <label>
                    งบประมาณตั้งต้น (บาท)
                    <input
                      name="budget"
                      type="number"
                      min="0"
                      value={form.budget}
                      onChange={change}
                      placeholder="เช่น 50000 (เว้นว่างได้ถ้าต้องการ Bottom-Up)"
                    />
                  </label>
                </div>

                <label>
                  รายละเอียดและเป้าหมายโครงการ <b>*</b>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={change}
                    required
                    rows="5"
                    placeholder="ต้องการสร้างอะไร? มีฟังก์ชันหรือเป้าหมายอะไรบ้าง? ใครเป็นผู้ใช้งาน? มีข้อจำกัดอะไรบ้าง?"
                  />
                </label>

                <div className="field-row">
                  <label>
                    <span className="label-icon">
                      <Clock3 size={14} /> ระยะเวลาที่ต้องการ
                    </span>
                    <input
                      name="timeline"
                      value={form.timeline}
                      onChange={change}
                      placeholder="เช่น 30 วัน, 3 เดือน"
                    />
                  </label>
                  <label>
                    ระดับงบประมาณที่ต้องการ
                    <select name="qualityTier" value={form.qualityTier} onChange={change}>
                      <option value="Lean">Lean — ประหยัด (MVP ตัดสิ่งไม่จำเป็น)</option>
                      <option value="Standard">Standard — สมดุล (แนะนำ)</option>
                      <option value="Premium">Premium — จัดเต็ม (ฟังก์ชันและบริการครบวงจร)</option>
                    </select>
                  </label>
                </div>

                {/* Engine Selector */}
                <div className="engine-select-box">
                  <label>
                    <span className="label-icon">
                      <Zap size={14} /> เลือก AI Engine ในการวิเคราะห์
                    </span>
                    <div className="engine-options">
                      <label className={`engine-radio ${form.engine === 'auto' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="engine"
                          value="auto"
                          checked={form.engine === 'auto'}
                          onChange={change}
                        />
                        <div>
                          <strong>⚡ อัตโนมัติ (Hybrid)</strong>
                          <small>ใช้ n8n หากมี หรือสลับไป Gemini API ตรง</small>
                        </div>
                      </label>
                      <label className={`engine-radio ${form.engine === 'n8n' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="engine"
                          value="n8n"
                          checked={form.engine === 'n8n'}
                          onChange={change}
                        />
                        <div>
                          <strong>🔗 n8n Workflow</strong>
                          <small>ส่งเข้า 5-Call Pipeline n8n</small>
                        </div>
                      </label>
                      <label className={`engine-radio ${form.engine === 'gemini' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="engine"
                          value="gemini"
                          checked={form.engine === 'gemini'}
                          onChange={change}
                        />
                        <div>
                          <strong>🤖 Gemini Standalone</strong>
                          <small>วิเคราะห์ตรงผ่าน Gemini API</small>
                        </div>
                      </label>
                    </div>
                  </label>
                </div>

                <div className="privacy-note">
                  <ShieldAlert size={16} />
                  <span>ระบบไม่เปิดเผย API Secrets และข้อมูลต้นทุนที่ไม่มีการยืนยันจะถูกระบุเป็น [รอระบุ] ตามหลักธรรมาภิบาลโครงการ</span>
                </div>

                {error && <div className="error-box">{error}</div>}

                <button className="submit-btn" disabled={busy}>
                  {busy ? (
                    <>
                      <LoaderCircle className="spin" size={18} />
                      กำลังวิเคราะห์โครงการผ่าน 5 ขั้นตอน...
                    </>
                  ) : (
                    <>
                      วิเคราะห์โครงการและประเมินงบประมาณ <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </section>

            <aside className="right-column">
              {/* Dynamic Analysis Progress Card */}
              <div className="process-card">
                <div className="process-title">
                  <span className="sparkle-box">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <h3>5-Stage Analysis Pipeline</h3>
                    <small>กระบวนการวิเคราะห์มาตรฐานระดับสากล</small>
                  </div>
                </div>

                {STAGES.map((s, i) => {
                  const isCurrent = busy && activeStageIndex === i;
                  const isCompleted = busy && activeStageIndex > i;
                  return (
                    <div
                      className={`process-row ${isCurrent ? 'active-step' : ''} ${isCompleted ? 'done-step' : ''}`}
                      key={s.title}
                    >
                      <span className="process-num">0{i + 1}</span>
                      <div className="process-text">
                        <strong>{s.title}</strong>
                        <small>{s.desc}</small>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-green" />
                      ) : isCurrent ? (
                        <LoaderCircle size={16} className="spin text-purple" />
                      ) : (
                        <span className="step-idle-dot" />
                      )}
                    </div>
                  );
                })}

                <div className="pipeline-foot">
                  <span className="pulse" />
                  รองรับทั้ง n8n และ Gemini Standalone
                </div>
              </div>

              <div className="tip-card">
                <div className="tip-icon">
                  <Bot size={20} />
                </div>
                <div>
                  <strong>เคล็ดลับการระบุโจทย์</strong>
                  <p>ระบุทั้งเป้าหมายทางธุรกิจ, ฟังก์ชันสำคัญ, และสิ่งที่ไม่ต้องการ (Out of Scope) เพื่อให้ WBS และงบประมาณแม่นยำยิ่งขึ้น</p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Empty Report State */}
        {active === 'report' && !report && (
          <section className="empty-report-card no-print">
            <div className="empty-report-icon">
              <FileText size={38} />
            </div>
            <h2>ยังไม่มีข้อมูลรายงานการวิเคราะห์</h2>
            <p>กรุณากรอกข้อมูลโครงการและกดปุ่มวิเคราะห์โครงการ เพื่อให้ AI ช่วยวางแผน WBS และประเมินงบประมาณ</p>
            <button className="primary-action-btn" onClick={() => setActive('new')}>
              <BriefcaseBusiness size={16} /> ไปที่หน้าสร้างโปรเจกต์ใหม่
            </button>
          </section>
        )}

        {/* Full Report Presentation Section */}
        {active === 'report' && report && (
          <section className="report-container">
            {/* Action Bar */}
            <div className="report-action-bar no-print">
              <div className="report-title-area">
                <button className="back-btn" onClick={() => setActive('new')}>
                  ← แก้ไขข้อมูลโครงการ
                </button>
                <div className="project-badge-row">
                  <span className="badge badge-purple">{form.projectName}</span>
                  <span className="badge badge-blue">
                    {form.budget ? `งบประมาณ ${Number(form.budget).toLocaleString('th-TH')} บาท` : 'Bottom-Up'}
                  </span>
                  <span className="badge badge-green">
                    เครื่องยนต์: {engineUsed.includes('gemini') ? 'Gemini Direct AI' : 'n8n Workflow'}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button className="secondary-btn" onClick={copyReport}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                </button>
                <button className="secondary-btn" onClick={printReport}>
                  <Printer size={15} /> พิมพ์ / PDF
                </button>
                <button
                  className={`secondary-btn ${saveSuccess ? 'btn-saved-success' : ''}`}
                  onClick={handleSaveCurrentProject}
                  title="บันทึกโครงการนี้ลงในประวัติ"
                >
                  {saveSuccess ? <Check size={15} className="text-green" /> : <Bookmark size={15} />}
                  {saveSuccess ? 'บันทึกสำเร็จ!' : 'บันทึกงานนี้'}
                </button>

                {/* Export Dropdown Menu in Report Action Bar */}
                <div className="export-dropdown-container">
                  <button
                    className="primary-action-btn export-trigger-btn"
                    onClick={() => toggleExport('report')}
                  >
                    <Download size={15} /> ส่งออกไฟล์ (Export) <ChevronDown size={14} className={exportDropdown === 'report' ? 'rotate-180' : ''} />
                  </button>
                  {exportDropdown === 'report' && renderExportMenu()}
                </div>
              </div>
            </div>

            {/* Quick Section Tabs */}
            <div className="section-tabs no-print">
              {[
                { id: 'all', label: '📑 รายงานฉบับสมบูรณ์ทั้งหมด' },
                { id: 'intake', label: '📌 สรุปข้อมูลตั้งต้น (Stage 1)' },
                { id: 'wbs', label: '🏗️ WBS & Test Plan (Stage 2)' },
                { id: 'budget', label: '💰 งบประมาณ 3 ระดับ (Stage 3)' },
                { id: 'risk', label: '🛡️ ทะเบียนความเสี่ยง (Stage 4)' },
                { id: 'summary', label: '📊 สรุปผู้บริหาร (Stage 5)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${filterSection === tab.id ? 'active' : ''}`}
                  onClick={() => setFilterSection(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Rendered Document Body */}
            <div className="report-document-card printable">
              <div className="doc-watermark">PROJECT INTELLIGENCE REPORT</div>
              <MarkdownView content={report} filterSection={filterSection} />
            </div>
          </section>
        )}

        {/* Saved Projects History Section */}
        {active === 'history' && (
          <section className="history-container no-print">
            <div className="history-header-card">
              <div className="history-header-info">
                <span className="step">PROJECT ARCHIVE</span>
                <h2>ประวัติโครงการที่บันทึกไว้</h2>
                <p>รวมรายงานการวิเคราะห์และแผนงบประมาณที่บันทึกไว้ทั้งหมด ({savedProjects.length} รายการ)</p>
              </div>

              <div className="history-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ หรือประเภท..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                />
              </div>
            </div>

            {savedProjects.length === 0 ? (
              <div className="empty-history-card">
                <div className="empty-history-icon">
                  <Bookmark size={40} />
                </div>
                <h3>ยังไม่มีโครงการที่บันทึกไว้</h3>
                <p>เมื่อคุณกดวิเคราะห์โครงการ ระบบจะบันทึกผลการวิเคราะห์และแผนงบประมาณไว้ที่นี่ให้อัตโนมัติ</p>
                <button className="primary-action-btn" onClick={() => setActive('new')}>
                  <BriefcaseBusiness size={16} /> สร้างโปรเจกต์ใหม่
                </button>
              </div>
            ) : (
              <div className="history-grid">
                {savedProjects
                  .filter((p) => {
                    if (!searchHistory.trim()) return true;
                    const q = searchHistory.toLowerCase();
                    return (
                      (p.projectName || '').toLowerCase().includes(q) ||
                      (p.projectType || '').toLowerCase().includes(q) ||
                      (p.description || '').toLowerCase().includes(q)
                    );
                  })
                  .map((proj) => {
                    const formattedDate = proj.createdAt
                      ? new Date(proj.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'ไม่ระบุวันที่';

                    return (
                      <div key={proj.id} className="history-card" onClick={() => handleOpenProject(proj)}>
                        <div className="history-card-top">
                          <span className="badge badge-purple">{proj.projectType || 'ทั่วไป'}</span>
                          <span className="history-date">{formattedDate}</span>
                        </div>

                        <h3 className="history-card-title">{proj.projectName || 'โครงการไม่ระบุชื่อ'}</h3>

                        <p className="history-card-desc">
                          {proj.description || '(ไม่มีรายละเอียด)'}
                        </p>

                        <div className="history-card-tags">
                          <span className="badge badge-blue">
                            {proj.budget ? `งบ ฿${Number(proj.budget).toLocaleString('th-TH')}` : 'Bottom-Up'}
                          </span>
                          {proj.timeline && <span className="badge badge-gray">{proj.timeline}</span>}
                          {proj.qualityTier && (
                            <span className={`badge ${proj.qualityTier === 'Premium' ? 'badge-gold' : proj.qualityTier === 'Lean' ? 'badge-blue' : 'badge-purple'}`}>
                              {proj.qualityTier}
                            </span>
                          )}
                          <span className="badge badge-green">
                            {proj.engineUsed?.includes('gemini') ? 'Gemini AI' : 'n8n'}
                          </span>
                        </div>

                        <div className="history-card-footer">
                          <button
                            type="button"
                            className="history-open-btn"
                            onClick={() => handleOpenProject(proj)}
                          >
                            <Eye size={14} /> เปิดดูรายงานฉบับเต็ม
                          </button>
                          <button
                            type="button"
                            className="history-delete-btn"
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            title="ลบโครงการนี้"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        <footer className="no-print">
          PROJECTPILOT AI <span>·</span> Universal Project Analyzer & Smart Budgeting Agent
          <span className="footer-right">Dual-Engine Version 2.0 · Ready for Production</span>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible only on screens <= 768px) */}
      <nav className="mobile-bottom-nav no-print">
        <button
          type="button"
          className={`mobile-nav-btn ${active === 'new' ? 'active' : ''}`}
          onClick={() => { setActive('new'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <BriefcaseBusiness size={20} />
          <span>สร้างงาน</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${active === 'report' ? 'active' : ''}`}
          onClick={() => { setActive('report'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="mobile-icon-badge-wrap">
            <FileText size={20} />
            {report && <span className="mobile-pulse-dot" />}
          </div>
          <span>รายงานผล</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${active === 'history' ? 'active' : ''}`}
          onClick={() => { setActive('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="mobile-icon-badge-wrap">
            <History size={20} />
            {savedProjects.length > 0 && <span className="mobile-count-pill">{savedProjects.length}</span>}
          </div>
          <span>ประวัติงาน</span>
        </button>
      </nav>
    </div>
  );
}
