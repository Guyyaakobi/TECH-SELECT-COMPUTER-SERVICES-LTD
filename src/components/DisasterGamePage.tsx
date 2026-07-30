import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Server,
  Users,
  Building2,
  Cpu,
  Clock,
  DollarSign,
  Activity,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Terminal,
  Lock,
  Unlock,
  ShieldCheck,
  Send,
  Zap,
  Radio,
  FileSpreadsheet,
  Copy,
  Check,
  X,
  FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO } from '../data/content';

interface CompanyProfile {
  employees: 'small' | 'medium' | 'large' | 'enterprise'; // 1-15, 15-50, 50-250, 250+
  servers: 'few' | 'moderate' | 'heavy'; // 1-3, 4-10, 10+
  branches: 'single' | 'multi' | 'global'; // 1, 2-5, 5+
  industry: 'logistics' | 'finance' | 'hitech' | 'retail' | 'defense';
}

const INDUSTRY_LABELS = {
  he: {
    logistics: 'תעשייה ולוגיסטיקה',
    finance: 'פיננסים, משפטים וייעוץ',
    hitech: 'היי-טק, תוכנה וסייבר',
    retail: 'מסחר, קמעונאות ורשתות',
    defense: 'ביטחון ותשתיות קריטיות'
  },
  en: {
    logistics: 'Industry & Logistics',
    finance: 'Finance & Legal',
    hitech: 'Hi-Tech & Software',
    retail: 'Retail & Commerce',
    defense: 'Defense & Infrastructure'
  }
};

interface Step1Choice {
  id: 1 | 2 | 3;
  textHe: string;
  textEn: string;
  damageMultiplier: number; // base loss multiplier
  downtimeHours: number;
  stressIncrease: number;
  resultTitleHe: string;
  resultTitleEn: string;
  resultBodyHe: string;
  resultBodyEn: string;
  status: 'critical' | 'warning' | 'optimal';
}

interface Step2Choice {
  id: 1 | 2 | 3;
  textHe: string;
  textEn: string;
  damageMultiplier: number;
  downtimeHours: number;
  stressFinal: number;
  dataLossPercent: number;
  resultTitleHe: string;
  resultTitleEn: string;
  resultBodyHe: string;
  resultBodyEn: string;
  status: 'critical' | 'warning' | 'optimal';
}

export const DisasterGamePage: React.FC<{
  onNavigateToContact: () => void;
  onBackToHome?: () => void;
}> = ({ onNavigateToContact, onBackToHome }) => {
  const { isHe } = useLanguage();

  // Audio effect generator using Web Audio API
  const playAlertSound = (type: 'alarm' | 'success' | 'click' = 'click') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'alarm') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // Audio fallback
    }
  };

  // Game state
  const [gameState, setGameState] = useState<'setup' | 'step1' | 'step1_feedback' | 'step2' | 'step2_feedback' | 'summary'>('setup');

  // Ransomware Screen Modal state
  const [isRansomModalOpen, setIsRansomModalOpen] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [ransomTime, setRansomTime] = useState({ hours: 23, minutes: 59, seconds: 48 });

  // Ticking countdown timer for ransomware screen
  useEffect(() => {
    const timer = setInterval(() => {
      setRansomTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Company Profile
  const [profile, setProfile] = useState<CompanyProfile>({
    employees: 'medium',
    servers: 'moderate',
    branches: 'single',
    industry: 'logistics'
  });

  // Chosen responses
  const [chosenStep1, setChosenStep1] = useState<Step1Choice | null>(null);
  const [chosenStep2, setChosenStep2] = useState<Step2Choice | null>(null);

  // SIEM logs feed
  const [siemLogs, setSiemLogs] = useState<string[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Calculate base financial scale from profile
  const getBaseScaleMultiplier = () => {
    let mult = 1;
    if (profile.employees === 'small') mult *= 0.6;
    if (profile.employees === 'medium') mult *= 1;
    if (profile.employees === 'large') mult *= 2.2;
    if (profile.employees === 'enterprise') mult *= 4.5;

    if (profile.branches === 'multi') mult *= 1.3;
    if (profile.branches === 'global') mult *= 2.0;

    return mult;
  };

  // Add SIEM log
  const addSiemLog = (text: string) => {
    const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
    setSiemLogs((prev) => [...prev, `[${time} SOC_SIEM] ${text}`]);
  };

  // Auto scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [siemLogs]);

  // Step 1 Choices Data
  const step1Choices: Step1Choice[] = [
    {
      id: 1,
      textHe: '"תרסטו את השרתים מייד ותנתקו מהחשמל! אולי זה יעצור את ההצפנה!"',
      textEn: '"Hard reboot and unplug the servers immediately! Maybe it stops the encryption!"',
      damageMultiplier: 80000,
      downtimeHours: 12,
      stressIncrease: 75,
      status: 'critical',
      resultTitleHe: 'קריסת Database וחבלה פנימית',
      resultTitleEn: 'Database Corruption & Disk Damage',
      resultBodyHe: 'הניתוק האלים באמצע פעולת הצפנה השחית את מסד הנתונים (DB) ברמת הדיסק. עכשיו המידע לא רק מוצפן – הוא גם מרוסק לחלוטין.',
      resultBodyEn: 'Unplugging during active encryption corrupted the database at disk level. Your data is now both encrypted and permanently corrupted.'
    },
    {
      id: 2,
      textHe: '"תתקשרו לאיש הסיסטם / הטכנאי שיתחיל לבדוק מה קורה."',
      textEn: '"Call the freelance technician / IT guy to inspect what is happening."',
      damageMultiplier: 35000,
      downtimeHours: 4,
      stressIncrease: 50,
      status: 'warning',
      resultTitleHe: 'עיכוב בתגובה והתפשטות רוחבית',
      resultTitleEn: 'Response Delay & Lateral Movement',
      resultBodyHe: 'הטכנאי בפקקים, מגיע ב-08:30, מגלה שאין לו גישה מרוחקת מאובטחת, ואין תיעוד מעודכן של הרשת. הנוזקה הספיקה להתפשט בינתיים לתחנות העבודה של חדר יציאה למשלוחים.',
      resultBodyEn: 'The IT guy is stuck in traffic, arrives at 08:30, has no safe remote access or updated network diagram. Malware propagated across operational workstations.'
    },
    {
      id: 3,
      textHe: '"תפעילו נוהל חירום סגר רשת (Isolation) ותקפיצו את צוות ה-IT/אבטחה לניטור הענן."',
      textEn: '"Execute Network Isolation protocol & alert Cloud IT/Security team immediately."',
      damageMultiplier: 0,
      downtimeHours: 0,
      stressIncrease: 5,
      status: 'optimal',
      resultTitleHe: 'סגר רשת מושלם ובלימה מיידית',
      resultTitleEn: 'Complete Network Isolation & Rapid Containment',
      resultBodyHe: 'תוך 90 שניות השרת הנגוע נשלף מהרשת באופן אוטומטי (Automated Containment). ההתפשטות נבלמה לחלוטין. כל שאר תחנות העבודה והסניפים ממשיכים לעבוד בצורה רציפה.',
      resultBodyEn: 'Within 90 seconds, infected servers were automatically isolated. Malware spread was completely contained while all other branch endpoints remain operational.'
    }
  ];

  // Step 2 Choices Data
  const step2Choices: Step2Choice[] = [
    {
      id: 1,
      textHe: '"תחברו את כונן הגיבוי החיצוני/ה-NAS המקומי שבחדר השרתים ותשחזרו מאתמול."',
      textEn: '"Plug in the local external backup NAS drive in the server room and restore yesterday\'s state."',
      damageMultiplier: 100000,
      downtimeHours: 36,
      stressFinal: 100,
      dataLossPercent: 40,
      status: 'critical',
      resultTitleHe: 'הגיבוי המקומי מוצפן ואינו שמיש',
      resultTitleEn: 'Local Backup Encrypted & Unusable',
      resultBodyHe: 'הגיבוי המקומי היה מחובר ברשת (Network Share) – התוקפים הצפינו גם אותו שלושה ימים מראש. הגיבוי המקומי אינו שמיש לחלוטין!',
      resultBodyEn: 'The local NAS was reachable over SMB network share—the attackers secretly encrypted it 3 days prior. Local backups are useless.'
    },
    {
      id: 2,
      textHe: '"אין ברירה, תשלמו את הכופר – יום עבודה שמתבטל עולה לנו יותר."',
      textEn: '"We have no choice, pay the ransom – a lost workday costs us way more."',
      damageMultiplier: 240000,
      downtimeHours: 60,
      stressFinal: 100,
      dataLossPercent: 55,
      status: 'critical',
      resultTitleHe: 'תשלום כפול, מפתח תקול וסימון ברשת האפלה',
      resultTitleEn: 'Ransom Paid, Broken Decryptor & Marked Target',
      resultBodyHe: 'שילמתם $50,000 בביטקוין. ההאקרים שלחו מפתח פענוח תקול. חלק מהקבצים נהרסו לצמיתות, וכעת העסק שלכם מסומן ברשת האפלה כ"מטרה שמשלמת".',
      resultBodyEn: 'Paid $50,000 in Bitcoin. Attackers provided a corrupt decryption key. Files were corrupted, and your business is marked as a paying target on the Dark Web.'
    },
    {
      id: 3,
      textHe: '"תפעילו שחזור מוצפן מהענן (Immutable Cloud Backup) מהגיבוי של 02:00 בלילה."',
      textEn: '"Spin up an Immutable Cloud Snapshot restore from the 02:00 AM backup."',
      damageMultiplier: 0,
      downtimeHours: 0.6, // 35 min
      stressFinal: 10,
      dataLossPercent: 0,
      status: 'optimal',
      resultTitleHe: 'שחזור מוצפן מהענן בתוך 35 דקות',
      resultTitleEn: 'Immutable Cloud Restore in 35 Minutes',
      resultBodyHe: 'הענן הנעול לא הושפע מההצפנה (Write-Once-Read-Many). המערכת מעלה שרת וירטואלי חלופי בענן בתוך 35 דקות. העסק עובד מלא, והצוות מנקה את השרת המקומי ברקע.',
      resultBodyEn: 'Immutable Cloud Storage remained untouched. Virtual cloud server spun up in 35 minutes flat. Operations run normally while cleaning local servers in background.'
    }
  ];

  // Calculate accumulated metrics
  const scale = getBaseScaleMultiplier();

  const totalDamage = Math.round(
    ((chosenStep1?.damageMultiplier || 0) + (chosenStep2?.damageMultiplier || 0)) * scale
  );

  const totalDowntimeHours = Math.round(
    ((chosenStep1?.downtimeHours || 0) + (chosenStep2?.downtimeHours || 0)) * 10
  ) / 10;

  const currentStress = Math.min(
    100,
    10 + (chosenStep1 ? chosenStep1.stressIncrease : 0) + (chosenStep2 ? chosenStep2.stressFinal - chosenStep1!.stressIncrease : 0)
  );

  const isOptimalPath = chosenStep1?.id === 3 && chosenStep2?.id === 3;

  // Handlers
  const handleStartGame = () => {
    playAlertSound('alarm');
    setGameState('step1');
    setSiemLogs([
      `06:45:00 [SIEM_CRITICAL] Ransomware executable triggered on SRV-ERP-PRIMARY.`,
      `06:45:04 [ALERT] Encrypted file extension .LOCKED detected on \\\\192.168.1.50\\ERP_DATA.`,
      `06:45:10 [SOC_MONITOR] Ransom note generated: 'PAY 50,000 USD IN BITCOIN WITHIN 24 HOURS'.`,
      `06:45:12 [SMS_GATEWAY] Dispatching high-priority alert to Operations Manager phone.`
    ]);
  };

  const handleSelectStep1 = (choice: Step1Choice) => {
    playAlertSound('click');
    setChosenStep1(choice);
    setGameState('step1_feedback');

    if (choice.id === 1) {
      addSiemLog('CRITICAL: Server power cut ungracefully. RAID volume unmounted with active transaction write.');
      addSiemLog('SYSTEM_ERROR: Database disk block corrupt. Restore from bare metal mandatory.');
    } else if (choice.id === 2) {
      addSiemLog('WARNING: IT engineer contacted via phone. ETA 08:30 AM.');
      addSiemLog('SECURITY_ALERT: Malware spreading laterally over SMB port 445 to desktop hosts.');
    } else {
      addSiemLog('SUCCESS: Microsegmentation Isolation trigger fired. Firewall port block applied in 90s.');
      addSiemLog('CONTAINED: Ransomware contained to isolated VLAN sandbox.');
    }
  };

  const handleSelectStep2 = (choice: Step2Choice) => {
    playAlertSound('click');
    setChosenStep2(choice);
    setGameState('step2_feedback');

    if (choice.id === 1) {
      addSiemLog('FAIL: Local NAS device detected encrypted headers. Ransom note found on backup share.');
    } else if (choice.id === 2) {
      addSiemLog('TRANSACTION: $50,000 BTC transferred. Received broken decryptor key. 55% data corrupted.');
    } else {
      addSiemLog('CLOUD_RECOVERY: Mounting Immutable Object Store Snapshot (02:00 AM).');
      addSiemLog('SUCCESS: Cloud VM operational. RTO achieved in 35 minutes. Zero data loss.');
    }
  };

  const handleRestart = () => {
    playAlertSound('click');
    setChosenStep1(null);
    setChosenStep2(null);
    setGameState('setup');
    setSiemLogs([]);
  };

  const generateWhatsAppMessage = () => {
    const text = isHe
      ? `היי, ביצעתי את סימולציית הסייבר 'Choose Your Own Disaster' באתר. תוצאת המענה שלי: זמן השבתה ${totalDowntimeHours} שעות, נזק מוערך ₪${totalDamage.toLocaleString()}. אשמח לתאם שיחת אבחון ארכיטקטורה וענן עם צוות TECH-SELECT.`
      : `Hi, I ran the 'Choose Your Own Disaster' simulation. My result: ${totalDowntimeHours}h downtime, estimated ₪${totalDamage.toLocaleString()} loss. I'd like to schedule an architecture assessment with TECH-SELECT.`;
    return `https://wa.me/972503900903?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 py-8 px-4 sm:px-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-[#05070d] to-[#05070d] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest">
                  SIEM / SOC SIMULATOR
                </span>
                <span className="text-xs text-slate-400 font-mono">Incident Simulation v2.6</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-heading text-white">
                Choose Your Own Disaster – {isHe ? 'סימולטור מוכנות IT' : 'IT Readiness Simulator'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playAlertSound('alarm');
                setIsRansomModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-red-100 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/60 animate-pulse"
              title={isHe ? 'צפה במסך הכופרה שנפרץ בשרת' : 'Inspect Infected Ransomware Screen'}
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>{isHe ? '☠️ מסך הכופרה' : '☠️ Ransomware Screen'}</span>
            </button>

            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{isHe ? 'חזרה לאתר' : 'Back to Home'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Gauges Bar (Always visible during gameplay) */}
        {gameState !== 'setup' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Financial Damage */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[11px] text-slate-400 font-mono block">💸 {isHe ? 'נזק כספי מוערך' : 'Estimated Loss'}</span>
                <span className={`text-lg font-mono font-bold ${totalDamage > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  ₪{totalDamage.toLocaleString()}
                </span>
              </div>
              <DollarSign className={`w-5 h-5 ${totalDamage > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>

            {/* Downtime Hours */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[11px] text-slate-400 font-mono block">⏱️ {isHe ? 'זמן השבתה מצטבר' : 'Accumulated Downtime'}</span>
                <span className={`text-lg font-mono font-bold ${totalDowntimeHours > 0.6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {totalDowntimeHours === 0.6 ? '35 min' : `${totalDowntimeHours} ${isHe ? 'שעות' : 'hours'}`}
                </span>
              </div>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>

            {/* Stress Level */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>📉 {isHe ? 'מד סטרס תפעולי' : 'Operational Stress'}</span>
                <span className="font-bold text-white">{currentStress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    currentStress < 30 ? 'bg-emerald-500' : currentStress < 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${currentStress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* GAME CONTENT CONTAINER */}

        {/* STATE 0: SETUP / COMPANY PROFILER */}
        {gameState === 'setup' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>{isHe ? 'שלב 0: הגדרת פרופיל הארגון' : 'Step 0: Company Profiling'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                {isHe ? 'בוא נכיר את העסק שלך' : 'Let\'s Profile Your Business'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isHe
                  ? 'לפני שננחית אותך בתוך חמ"ל הסייבר ביום ראשון בבוקר – בחר את הנתונים המשקפים את העסק שלך. נתוני התרחיש והנזקים הכספיים יותאמו במיוחד לגודל ולמורכבות של הארגון.'
                  : 'Before dropping you into the Cyber SOC on a Sunday morning – choose parameters reflecting your enterprise. Damage metrics will dynamically scale.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {/* Employee Count */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold flex items-center gap-2 text-sm font-sans">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{isHe ? 'כמה עובדים בחברה?' : 'Number of Employees'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'small', label: '1 - 15' },
                    { id: 'medium', label: '15 - 50' },
                    { id: 'large', label: '50 - 250' },
                    { id: 'enterprise', label: '250+' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, employees: opt.id as CompanyProfile['employees'] }))}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                        profile.employees === opt.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Count */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold flex items-center gap-2 text-sm font-sans">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>{isHe ? 'שרתים ומערכות ליבה' : 'Servers & Core Systems'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'few', label: '1-3' },
                    { id: 'moderate', label: '4-10' },
                    { id: 'heavy', label: '10+' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, servers: opt.id as CompanyProfile['servers'] }))}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                        profile.servers === opt.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branches */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold flex items-center gap-2 text-sm font-sans">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>{isHe ? 'סניפים / מיקומים פיזיים' : 'Branches & Locations'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'single', label: isHe ? 'סניף יחיד' : '1 Location' },
                    { id: 'multi', label: isHe ? '2-5 סניפים' : '2-5 Sites' },
                    { id: 'global', label: isHe ? '5+ גלובלי' : '5+ Global' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, branches: opt.id as CompanyProfile['branches'] }))}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                        profile.branches === opt.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold flex items-center gap-2 text-sm font-sans">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>{isHe ? 'תחום הפעילות העיקרי' : 'Industry Sector'}</span>
                </label>
                <select
                  value={profile.industry}
                  onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value as CompanyProfile['industry'] }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-mono font-bold outline-none focus:border-cyan-400"
                >
                  {Object.entries(INDUSTRY_LABELS[isHe ? 'he' : 'en']).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5 animate-bounce" />
                <span>{isHe ? 'שגר תרחיש חירום – 06:45 בבוקר ➔' : 'Launch Emergency Scenario – 06:45 AM ➔'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 1: STEP 1 QUESTIONS */}
        {gameState === 'step1' && (
          <div className="bg-slate-900/90 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn relative">
            {/* Alarm Sound Notification */}
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 text-xs sm:text-sm">
                <span className="font-mono font-bold text-red-400 block uppercase tracking-wider">
                  🎮 {isHe ? 'תרחיש אמת: "יום ראשון, 06:45 בבוקר"' : 'Live Scenario: "Sunday, 06:45 AM"'}
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {isHe ? (
                    <>
                      <strong>המצב:</strong> חצי שעה לפני שהעובדים מגיעים למשרד והמשלוחים של הבוקר צריכים לצאת.
                      <br />
                      <strong>ההודעה:</strong> הנייד שלך רוטט. מנהל התפעול שולח תמונת מסך: כל קובצי ה-ERP ושרת הקבצים המרכזי מוצפנים. על המסך מופיע פתק כופר עם שעון עצר: <strong>24 שעות לתשלום $50,000 בביטקוין</strong>.
                    </>
                  ) : (
                    <>
                      <strong>Situation:</strong> 30 minutes before employees arrive and morning shipments dispatch.
                      <br />
                      <strong>Alert:</strong> Your phone vibrates. Operations Manager sends a screenshot: ERP files and central file server are encrypted with ransom note: <strong>24 hours to pay $50,000 in Bitcoin</strong>.
                    </>
                  )}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playAlertSound('alarm');
                      setIsRansomModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-900/90 hover:bg-red-800 border border-red-400/60 text-red-100 text-xs font-mono font-bold transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
                  >
                    <Lock className="w-4 h-4 text-red-400 animate-bounce shrink-0" />
                    <span>{isHe ? '📸 לחץ לצפייה במסך הכופרה שנפרץ בשרת בזמן אמת' : '📸 Click to inspect the original Ransomware Screen'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>{isHe ? 'שלב 1: העובדים בדרך, המערכות למטה. מה ההנחיה הראשונה שלך?' : 'Step 1: Workers arriving, systems down. What is your first command?'}</span>
              </h3>

              <div className="space-y-3">
                {step1Choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectStep1(choice)}
                    className="w-full text-right p-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer group flex items-start gap-3 shadow-md"
                  >
                    <span className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      0{choice.id}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-200 group-hover:text-white font-medium leading-relaxed">
                      {isHe ? choice.textHe : choice.textEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATE 1 FEEDBACK */}
        {gameState === 'step1_feedback' && chosenStep1 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div
              className={`p-5 rounded-2xl border ${
                chosenStep1.status === 'optimal'
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : chosenStep1.status === 'warning'
                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                  : 'bg-red-950/50 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-3 font-bold text-base mb-2">
                {chosenStep1.status === 'optimal' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                )}
                <h4>{isHe ? chosenStep1.resultTitleHe : chosenStep1.resultTitleEn}</h4>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-sans">
                {isHe ? chosenStep1.resultBodyHe : chosenStep1.resultBodyEn}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setGameState('step2')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isHe ? 'המשך לשלב 2: גיבוי והתאוששות ➔' : 'Proceed to Step 2: Backup & Recovery ➔'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: STEP 2 QUESTIONS */}
        {gameState === 'step2' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-slate-200 space-y-1 text-xs">
              <span className="font-mono font-bold text-cyan-400 block uppercase">
                📍 {isHe ? 'שלב 2: התאוששות מאסון ושחזור נתונים' : 'Step 2: Disaster Recovery & Data Restore'}
              </span>
              <p className="text-slate-300">
                {isHe
                  ? 'מנהל התשתיות מדווח שחייבים להחזיר את ה-ERP והמסמכים לפעילות עבודה תקינה. באיזה מנגנון שחזור תשתמש?'
                  : 'Infrastructure lead reports core ERP must be restored immediately. Which recovery mechanism will you trigger?'}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>{isHe ? 'שאלה: איך אתם משחזרים את המידע העסקי?' : 'Question: How do you restore corporate data?'}</span>
              </h3>

              <div className="space-y-3">
                {step2Choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectStep2(choice)}
                    className="w-full text-right p-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer group flex items-start gap-3 shadow-md"
                  >
                    <span className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      0{choice.id}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-200 group-hover:text-white font-medium leading-relaxed">
                      {isHe ? choice.textHe : choice.textEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATE 2 FEEDBACK */}
        {gameState === 'step2_feedback' && chosenStep2 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div
              className={`p-5 rounded-2xl border ${
                chosenStep2.status === 'optimal'
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/50 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-3 font-bold text-base mb-2">
                {chosenStep2.status === 'optimal' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                )}
                <h4>{isHe ? chosenStep2.resultTitleHe : chosenStep2.resultTitleEn}</h4>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-sans">
                {isHe ? chosenStep2.resultBodyHe : chosenStep2.resultBodyEn}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setGameState('summary')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isHe ? '🏆 הצג דוח סיכון תפעולי מסכם ➔' : '🏆 View Executive Summary Report ➔'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: FINAL SUMMARY & SCOREBOARD */}
        {gameState === 'summary' && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fadeIn relative">
            <div className="text-center space-y-2 border-b border-slate-800 pb-6">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold uppercase">
                {isHe ? '🏆 דוח סיכון תפעולי סופי' : '🏆 Final Risk Assessment Report'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                {isHe ? 'תוצאות סימולציית הסייבר הארגונית' : 'Simulation Executive Summary'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {isHe
                  ? `הדוח מותאם לפרופיל חברה בת ${profile.employees} עובדים במגזר ${INDUSTRY_LABELS.he[profile.industry]}`
                  : `Report calculated for ${profile.employees} employees in ${INDUSTRY_LABELS.en[profile.industry]}`}
              </p>
            </div>

            {/* Comparison Scoreboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 font-mono text-slate-400 text-[11px]">
                    <th className="p-3 font-bold">{isHe ? 'מדד תפעולי' : 'Metric'}</th>
                    <th className="p-3 text-emerald-400 font-bold">{isHe ? 'תרחיש מוגן (TECH-SELECT)' : 'Protected Scenario'}</th>
                    <th className="p-3 text-red-400 font-bold">{isHe ? 'התוצאה במסלול שנבחר' : 'Your Selected Path'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  <tr>
                    <td className="p-3 font-bold text-slate-200 font-sans">{isHe ? 'זמן השבתה כולל' : 'Total Downtime'}</td>
                    <td className="p-3 text-emerald-400 font-bold">35 {isHe ? 'דקות' : 'minutes'}</td>
                    <td className={`p-3 font-bold ${totalDowntimeHours <= 0.6 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalDowntimeHours === 0.6 ? '35 min' : `${totalDowntimeHours} ${isHe ? 'שעות' : 'hours'}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-200 font-sans">{isHe ? 'פגיעה כספית ישירה' : 'Direct Financial Loss'}</td>
                    <td className="p-3 text-emerald-400 font-bold">₪0</td>
                    <td className={`p-3 font-bold ${totalDamage === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ₪{totalDamage.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-200 font-sans">{isHe ? 'אובדן מידע עסקי' : 'Data Loss Risk'}</td>
                    <td className="p-3 text-emerald-400 font-bold">0%</td>
                    <td className={`p-3 font-bold ${(chosenStep2?.dataLossPercent || 0) === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {chosenStep2?.dataLossPercent || 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Takeaway Quote */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{isHe ? '💡 בשורה התחתונה:' : '💡 Bottom Line:'}</span>
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans italic">
                {isHe ? (
                  <>
                    "בחיים האמיתיים, <strong>אין כפתור Restart</strong>. התקפת סייבר או קריסת תשתית הן לא שאלה של 'אם', אלא של 'מתי'. כשארכיטקטורת הענן, הגיבויים הנעולים ונוהלי התגובה בנויים נכון – אירוע קטסטרופלי הופך למטרד קל של 35 דקות בלבד."
                  </>
                ) : (
                  <>
                    "In real life, <strong>there is no Restart button</strong>. Cyber attacks are not a matter of 'if', but 'when'. With proper cloud architecture and immutable backups, a catastrophe becomes a 35-minute minor event."
                  </>
                )}
              </blockquote>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isHe ? 'הרצים סימולציה מחדש' : 'Restart Simulation'}</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <a
                  href={generateWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>{isHe ? 'שלח תוצאות ב-WhatsApp' : 'Send Score on WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={onNavigateToContact}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isHe ? 'תזמן שיחת אבחון ארכיטקטורה ללא עלות ➔' : 'Schedule Free Architecture Audit ➔'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIEM Console Log Output at bottom */}
        {siemLogs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-300">TECH-SELECT SIEM SOC Real-time Console</span>
              </div>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">LIVE FEED</span>
            </div>
            <div ref={logsContainerRef} className="max-h-28 overflow-y-auto space-y-1 text-slate-300 leading-tight">
              {siemLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold shrink-0">&gt;</span>
                  <span className={log.includes('FAIL') || log.includes('CRITICAL') ? 'text-red-400 font-bold' : log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RANSOMWARE SCREEN MODAL (Realistic LockBit / WannaCry Cyber Attack UI) */}
        {isRansomModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-lg animate-fadeIn">
            <div className="w-full max-w-4xl bg-[#090202] border-2 border-red-600 rounded-2xl shadow-[0_0_100px_rgba(239,68,68,0.6)] overflow-hidden flex flex-col max-h-[94vh]">
              
              {/* Header bar - Dark Red Threat Header */}
              <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-4 py-3 border-b border-red-600/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 text-black rounded-lg font-black animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold uppercase bg-red-600 text-black px-2 py-0.5 rounded font-bold tracking-wider">
                        CRITICAL SECURITY INCIDENT
                      </span>
                      <span className="text-[11px] font-mono text-red-400 font-bold">LOCKBIT_v3.0_ENTERPRISE_PAYLOAD</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-mono font-extrabold text-white tracking-wide">
                      {isHe ? 'YOUR NETWORK HAS BEEN COMPROMISED & ENCRYPTED' : 'YOUR NETWORK HAS BEEN COMPROMISED & ENCRYPTED'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsRansomModalOpen(false)}
                  className="p-1.5 rounded-lg bg-red-950/90 hover:bg-red-800 text-red-200 border border-red-500/50 transition-all cursor-pointer"
                  title={isHe ? 'סגור' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Dual-Column Authentic Ransomware Screen */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 font-mono text-xs text-slate-200">
                
                {/* System Technical Header Box */}
                <div className="bg-black/90 p-3 rounded-xl border border-red-900/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block">{isHe ? 'מארח שנפרץ:' : 'Compromised Host:'}</span>
                    <span className="text-red-400 font-bold">DC-PRIMARY-SRV</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isHe ? 'כתובת IP:' : 'Target IP:'}</span>
                    <span className="text-red-400 font-bold">192.168.1.50</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isHe ? 'אלגוריתם הצפנה:' : 'Encryption:'}</span>
                    <span className="text-amber-400 font-bold">RSA-4096 + AES-256</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isHe ? 'מזהה תקיפה:' : 'Victim ID:'}</span>
                    <span className="text-cyan-400 font-bold">IL-TECH-882910</span>
                  </div>
                </div>

                {/* Two-Column Authentic Ransomware Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Column: Red Alert Box & Dual Ticking Timers */}
                  <div className="lg:col-span-5 bg-red-950/30 border border-red-600/70 p-4 rounded-xl space-y-4 shadow-inner flex flex-col justify-between">
                    
                    <div className="text-center space-y-2">
                      <div className="inline-flex p-3 bg-red-600/20 border border-red-500 rounded-full text-red-500 animate-pulse">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-extrabold text-red-400 uppercase tracking-wider">
                        {isHe ? 'דרישת כופר פעילה' : 'ACTIVE RANSOM DEMAND'}
                      </h4>
                      <p className="text-[11px] text-red-200 leading-relaxed font-sans">
                        {isHe
                          ? 'כל מסדי הנתונים, הגיבויים המקומיים וקובצי ה-ERP הוצפנו. אי תשלום בתוך הזמן הקצוב יוביל להכפלת הסכום ולפרסום המידע הסודי ברשת האפלה (DarkWeb).'
                          : 'All databases, local backups, and ERP files encrypted. Failure to pay within time limit doubles price and releases stolen confidential files to DarkWeb.'}
                      </p>
                    </div>

                    {/* Dual Countdown Timers */}
                    <div className="space-y-2 pt-2 border-t border-red-900/60">
                      
                      <div className="bg-black/90 p-2.5 rounded-lg border border-red-600/60 text-center">
                        <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold block">
                          {isHe ? 'זמן נותר לפני הכפלת הכופר' : 'TIME BEFORE PRICE DOUBLES'}
                        </span>
                        <div className="text-2xl font-black text-red-500 tracking-wider font-mono drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] my-1">
                          {String(ransomTime.hours).padStart(2, '0')}:{String(ransomTime.minutes).padStart(2, '0')}:{String(ransomTime.seconds).padStart(2, '0')}
                        </div>
                      </div>

                      <div className="bg-black/90 p-2.5 rounded-lg border border-red-900 text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                          {isHe ? 'זמן נותר למחיקת מפתח הפענוח' : 'TIME BEFORE DECRYPTION KEY DESTRUCTION'}
                        </span>
                        <div className="text-lg font-bold text-amber-500 font-mono my-0.5">
                          71:59:{String(ransomTime.seconds).padStart(2, '0')}
                        </div>
                      </div>

                    </div>

                    {/* Bitcoin Amount Box */}
                    <div className="bg-black p-3 rounded-xl border border-red-600/80 text-center">
                      <span className="text-[10px] text-slate-400 uppercase block">{isHe ? 'סכום כופר נדרש:' : 'REQUIRED RANSOM AMOUNT:'}</span>
                      <div className="text-xl font-extrabold text-amber-400 my-0.5">$50,000 USD</div>
                      <span className="text-[10px] text-slate-400 block font-mono">1.082491 BTC</span>
                    </div>

                  </div>

                  {/* Right Column: Encrypted File Audit & Bitcoin Payment Instructions */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Encrypted Files Audit */}
                    <div className="bg-black/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-red-400 font-bold border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span>{isHe ? 'קובצים מוצפנים בזמן אמת (Sample .LOCKED):' : 'Encrypted File Tree (.LOCKED):'}</span>
                        </div>
                        <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800">
                          184,920 Files Locked
                        </span>
                      </div>

                      <div className="space-y-1 font-mono text-[11px] max-h-36 overflow-y-auto pr-1">
                        <div className="text-red-400/90 flex items-center justify-between bg-red-950/40 px-2 py-1 rounded border border-red-900/30">
                          <span className="truncate">\\192.168.1.50\ERP_DATA\MSSQL_MAIN.MDF.LOCKED</span>
                          <span className="text-[9px] bg-red-900 text-red-100 px-1 py-0.5 rounded shrink-0 font-bold">LOCKED</span>
                        </div>
                        <div className="text-red-400/90 flex items-center justify-between bg-red-950/30 px-2 py-1 rounded border border-red-900/30">
                          <span className="truncate">\\SRV-FILE\FINANCE\PAYROLL_Q3_2026.XLSX.LOCKED</span>
                          <span className="text-[9px] bg-red-900 text-red-100 px-1 py-0.5 rounded shrink-0 font-bold">LOCKED</span>
                        </div>
                        <div className="text-red-400/90 flex items-center justify-between bg-red-950/30 px-2 py-1 rounded border border-red-900/30">
                          <span className="truncate">\\SRV-FILE\CUSTOMERS\LEGAL_CONTRACTS.PDF.LOCKED</span>
                          <span className="text-[9px] bg-red-900 text-red-100 px-1 py-0.5 rounded shrink-0 font-bold">LOCKED</span>
                        </div>
                        <div className="text-red-400/90 flex items-center justify-between bg-red-950/30 px-2 py-1 rounded border border-red-900/30">
                          <span className="truncate">C:\Users\Administrator\Documents\LOCAL_NAS_BACKUP.ZIP.LOCKED</span>
                          <span className="text-[9px] bg-red-900 text-red-100 px-1 py-0.5 rounded shrink-0 font-bold">LOCKED</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Wallet Copy Box */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-red-900/80 space-y-2">
                      <span className="text-[11px] text-slate-300 font-bold block">{isHe ? 'כתובת ארנק ביטקוין לתשלום:' : 'Bitcoin Deposit Wallet:'}</span>
                      <div className="flex items-center gap-2 bg-black p-2 rounded-lg border border-slate-800 text-cyan-400 text-xs font-mono">
                        <span className="flex-1 select-all font-bold truncate">bc1q9x382f0a1l8zp9q3m4k2v8x9a7b6c5d4e3f21</span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText('bc1q9x382f0a1l8zp9q3m4k2v8x9a7b6c5d4e3f21');
                            setCopiedWallet(true);
                            setTimeout(() => setCopiedWallet(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-sans flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                        >
                          {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedWallet ? (isHe ? 'הועתק!' : 'Copied!') : (isHe ? 'העתק' : 'Copy')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Real CISO Security Advisory from TECH-SELECT */}
                    <div className="bg-gradient-to-r from-blue-950/80 via-slate-950 to-blue-950/80 p-3.5 rounded-xl border border-cyan-500/50 space-y-1.5 font-sans">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{isHe ? 'הנחיית CISO ממומחי TECH-SELECT:' : 'CISO Security Briefing from TECH-SELECT:'}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isHe
                          ? 'כך נראית מתקפת LockBit אמיתית בתוך שרת ארגוני. ארגונים העובדים עם TECH-SELECT מוגנים בגיבוי ענן מוצפן (Immutable WORM) ובבידוד רשת אוטומטי (Automated Isolation). בלחיצת כפתור אחת, המערכת חוזרת לחיים בתוך 35 דקות בלבד!'
                          : 'This is what an authentic LockBit cyber incident looks like inside an enterprise server. TECH-SELECT clients recover in 35 minutes using Immutable Cloud Snapshots and Automated Microsegmentation!'}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  TECH-SELECT Incident Simulation Engine
                </span>
                <button
                  onClick={() => setIsRansomModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/30"
                >
                  <X className="w-4 h-4" />
                  <span>{isHe ? 'סגור מסך כופרה וחזור לסימולטור ➔' : 'Close Screen & Return to Simulator ➔'}</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
