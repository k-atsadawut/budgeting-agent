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
  History,
  User,
  UserCheck,
  LogOut,
  Lock,
  X
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

  // User Authentication & Multi-Tenancy State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('projectpilot_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('projectpilot_token') || '');
  const [guestId] = useState(() => {
    let gid = localStorage.getItem('projectpilot_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('projectpilot_guest_id', gid);
    }
    return gid;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '', displayName: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleAuthAvailable, setGoogleAuthAvailable] = useState(false);

  // Fetch Auth & Google Config on mount
  useEffect(() => {
    fetch(`${API}/api/auth/config`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.googleClientId) {
          setGoogleClientId(data.googleClientId);
          if (!document.getElementById('google-client-script')) {
            const script = document.createElement('script');
            script.id = 'google-client-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => setGoogleAuthAvailable(true);
            document.body.appendChild(script);
          } else {
            setGoogleAuthAvailable(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Helper to build headers with Authorization token or Guest ID
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': currentUser ? currentUser.id : guestId
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Saved Projects Persistence State
  const [savedProjects, setSavedProjects] = useState([]);
  const [searchHistory, setSearchHistory] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // Load saved projects from backend filtered by authenticated user / guest device
  const loadSavedProjects = async (overrideToken, overrideUserId) => {
    try {
      const uid = overrideUserId || (currentUser ? currentUser.id : guestId);
      const token = overrideToken !== undefined ? overrideToken : authToken;
      const headers = { 'x-user-id': uid };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/projects`, { headers });
      const data = await res.json();
      if (data.ok && Array.isArray(data.projects)) {
        setSavedProjects(data.projects);
        localStorage.setItem(`saved_budget_projects_${uid}`, JSON.stringify(data.projects));
      }
    } catch {
      const uid = overrideUserId || (currentUser ? currentUser.id : guestId);
      const local = localStorage.getItem(`saved_budget_projects_${uid}`);
      if (local) {
        try { setSavedProjects(JSON.parse(local)); } catch {}
      }
    }
  };

  useEffect(() => {
    loadSavedProjects();
  }, [currentUser, authToken]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'การดำเนินการไม่สำเร็จ');
      }

      setCurrentUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem('projectpilot_user', JSON.stringify(data.user));
      localStorage.setItem('projectpilot_token', data.token);

      setAuthModalOpen(false);
      setAuthForm({ username: '', password: '', displayName: '' });
      loadSavedProjects(data.token, data.user.id);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const res = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');

      setCurrentUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem('projectpilot_user', JSON.stringify(data.user));
      localStorage.setItem('projectpilot_token', data.token);

      setAuthModalOpen(false);
      loadSavedProjects(data.token, data.user.id);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDirectGoogleLogin = async (email) => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const name = email.split('@')[0];
      const res = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          sub: 'google_sim_' + Math.random().toString(36).slice(2, 10),
          picture: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=6366f1`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');

      setCurrentUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem('projectpilot_user', JSON.stringify(data.user));
      localStorage.setItem('projectpilot_token', data.token);

      setAuthModalOpen(false);
      loadSavedProjects(data.token, data.user.id);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const demoEmail = prompt('กรอกอีเมล Google เพื่อเข้าสู่ระบบด่วน:', 'user.project@gmail.com');
            if (demoEmail && demoEmail.includes('@')) handleDirectGoogleLogin(demoEmail);
          }
        });
      } catch {
        const demoEmail = prompt('กรอกอีเมล Google เพื่อเข้าสู่ระบบด่วน:', 'user.project@gmail.com');
        if (demoEmail && demoEmail.includes('@')) handleDirectGoogleLogin(demoEmail);
      }
    } else {
      const demoEmail = prompt('เข้าสู่ระบบด้วย Google Account (กรอก Gmail ของคุณ):', 'user.google@gmail.com');
      if (demoEmail && demoEmail.includes('@')) {
        handleDirectGoogleLogin(demoEmail);
      }
    }
  };

  // Initialize Google Button when modal opens
  useEffect(() => {
    if (authModalOpen && googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse
        });
        const btnContainer = document.getElementById('google-btn-rendered');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320
          });
        }
      } catch (e) {
        console.warn('Google GIS error:', e);
      }
    }
  }, [authModalOpen, googleClientId, googleAuthAvailable]);

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('projectpilot_user');
    localStorage.removeItem('projectpilot_token');
    setUserDropdownOpen(false);
    loadSavedProjects('', guestId);
  };

  const handleSaveCurrentProject = async () => {
    if (!report) return;
    try {
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetch(`${API}/api/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');
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
        headers: getAuthHeaders(),
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
          <span className="avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="user-avatar-img" />
            ) : currentUser ? (
              (currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()
            ) : (
              'PM'
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser ? currentUser.displayName || currentUser.username : 'ผู้เยี่ยมชม (Guest)'}
            </strong>
            <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser ? `@${currentUser.username} · ส่วนตัว` : 'ข้อมูลแยกเฉพาะเครื่องนี้'}
            </small>
          </div>
          {currentUser ? (
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-auth-action-btn"
              title="ออกจากระบบ"
            >
              <LogOut size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
              className="sidebar-auth-action-btn primary"
              title="เข้าสู่ระบบ"
            >
              <UserCheck size={15} />
            </button>
          )}
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

            {/* User Account / Profile Control */}
            {currentUser ? (
              <div className="user-profile-container">
                <button
                  type="button"
                  className="user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  title="บัญชีของคุณ"
                >
                  <span className="user-avatar-circle">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="user-avatar-img" />
                    ) : (
                      (currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="user-name-label">{currentUser.displayName || currentUser.username}</span>
                  <ChevronDown size={13} className={userDropdownOpen ? 'rotate-180' : ''} />
                </button>
                {userDropdownOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <strong>{currentUser.displayName || currentUser.username}</strong>
                      <small>@{currentUser.username}</small>
                    </div>
                    <div className="user-menu-stat">
                      <span>โครงการในบัญชี:</span>
                      <strong>{savedProjects.length} โครงการ</strong>
                    </div>
                    <button className="user-logout-btn" onClick={handleLogout}>
                      <LogOut size={14} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="guest-auth-container">
                <button
                  type="button"
                  className="topbar-auth-btn"
                  onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
                  title="เข้าสู่ระบบหรือสมัครสมาชิกเพื่อแยกข้อมูลโครงการส่วนตัว"
                >
                  <User size={14} />
                  <span>เข้าสู่ระบบ / สมัคร</span>
                </button>
              </div>
            )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="step">PROJECT ARCHIVE</span>
                  {currentUser ? (
                    <span className="badge badge-purple">
                      <User size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      บัญชี: {currentUser.displayName || currentUser.username}
                    </span>
                  ) : (
                    <span className="badge badge-blue">
                      โหมดผู้เยี่ยมชม (เฉพาะเครื่องนี้)
                    </span>
                  )}
                </div>
                <h2>ประวัติโครงการที่บันทึกไว้</h2>
                <p>
                  {currentUser
                    ? `โครงการส่วนตัวของคุณ (${savedProjects.length} รายการ) — แยกข้อมูลเป็นส่วนตัว 100% ไม่ปะปนกับผู้ใช้อื่น`
                    : `โครงการที่บันทึกไว้บนอุปกรณ์นี้ (${savedProjects.length} รายการ) — แยกเฉพาะอุปกรณ์นี้`}
                </p>
                {!currentUser && (
                  <div className="history-guest-notice">
                    <span>💡 ต้องการบันทึกถาวรและเปิดดูจากอุปกรณ์อื่นได้ด้วย?</span>
                    <button
                      type="button"
                      className="history-guest-login-btn"
                      onClick={() => { setAuthTab('register'); setAuthModalOpen(true); }}
                    >
                      สมัครสมาชิก / ล็อกอินฟรี
                    </button>
                  </div>
                )}
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

        <button
          type="button"
          className="mobile-nav-btn"
          onClick={() => {
            if (currentUser) {
              setUserDropdownOpen(!userDropdownOpen);
            } else {
              setAuthTab('login');
              setAuthModalOpen(true);
            }
          }}
        >
          <User size={20} />
          <span>{currentUser ? (currentUser.displayName || currentUser.username).slice(0, 5) : 'บัญชี'}</span>
        </button>
      </nav>

      {/* Authentication Modal Dialog */}
      {authModalOpen && (
        <div className="modal-backdrop" onClick={() => setAuthModalOpen(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setAuthModalOpen(false)}
              title="ปิดหน้าต่าง"
            >
              <X size={18} />
            </button>

            <div className="auth-modal-header">
              <div className="brand-mark sm" style={{ margin: '0 auto 12px auto' }}>
                <Sparkles size={18} />
              </div>
              <h2>{authTab === 'login' ? 'เข้าสู่ระบบ ProjectPilot' : 'สร้างบัญชีผู้ใช้งานใหม่'}</h2>
              <p>แยกพื้นที่จัดเก็บและประวัติโครงการเป็นของคุณคนเดียว ปลอดภัย 100%</p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
              >
                เข้าสู่ระบบ (Login)
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
              >
                สมัครสมาชิก (Register)
              </button>
            </div>

            {/* One-Click Google Sign-In */}
            <div className="google-auth-section">
              <button
                type="button"
                className="google-signin-btn"
                onClick={handleGoogleSignInClick}
                disabled={authLoading}
                title="คลิกเพื่อเข้าสู่ระบบด้วยบัญชี Google ของคุณ"
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
              <div id="google-btn-rendered" style={{ display: 'none' }}></div>

              <div className="auth-divider">
                <span>หรือดำเนินการต่อด้วยบัญชีผู้ใช้</span>
              </div>
            </div>

            {authError && (
              <div className="auth-error-banner">
                <ShieldAlert size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authTab === 'register' && (
                <div className="form-group">
                  <label>ชื่อที่ต้องการให้แสดง (Display Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น อัษฎาวุฒิ หรือ Somchai P."
                    value={authForm.displayName}
                    onChange={(e) => setAuthForm({ ...authForm, displayName: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>ชื่อผู้ใช้งาน (Username)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="เช่น user123 (ภาษาอังกฤษหรือตัวเลข)"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  required
                  placeholder="รหัสผ่านอย่างน้อย 4 ตัวอักษร"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <LoaderCircle size={16} className="spin" /> กำลังดำเนินการ...
                  </>
                ) : authTab === 'login' ? (
                  'เข้าสู่ระบบ'
                ) : (
                  'สร้างบัญชีและเข้าสู่ระบบ'
                )}
              </button>
            </form>

            <div className="auth-modal-footer">
              <small>
                {authTab === 'login' ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีอยู่แล้ว? '}
                <a
                  href="#switch"
                  onClick={(e) => {
                    e.preventDefault();
                    setAuthTab(authTab === 'login' ? 'register' : 'login');
                    setAuthError('');
                  }}
                >
                  {authTab === 'login' ? 'สมัครสมาชิกฟรีที่นี่' : 'คลิกเพื่อเข้าสู่ระบบ'}
                </a>
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
