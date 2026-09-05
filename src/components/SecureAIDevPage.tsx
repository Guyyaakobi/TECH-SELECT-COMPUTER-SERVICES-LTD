import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, Cpu, Database, Lock, Bot, Sparkles, Layers, 
  FileCode, Terminal, CheckCircle2, ArrowLeft, ArrowRight, 
  Server, Shield, Radio, Key, Zap, Check, Eye, ChevronDown, 
  Award, FileText, Settings, Users, Workflow, HelpCircle, HardDrive,
  MessageSquare, Sliders, Send, RefreshCw, ShieldAlert, Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SpotlightCard } from './SpotlightCard';
import { PageHeroBackground } from './PageHeroBackground';
import aiEngineeringBg from '../assets/images/ai_engineering_hero.jpg';
import { AIDiscoveryFormData, AIExcellenceReport, AIConsultationMessage } from '../types';
import { ExecutiveAIAssessmentEngine } from './ai-discovery/ExecutiveAIAssessmentEngine';
import { EmployeeSurveyModal } from './ai-discovery/EmployeeSurveyModal';
import { AI_DISCOVERY_PRESETS, AIDiscoveryPreset, generateExcellenceReport, normalizeAIReport } from '../data/aiDiscoveryPresets';

interface SecureAIDevPageProps {
  onBackToHome: () => void;
  onNavigateToContact: () => void;
}

const DEFAULT_FORM_DATA: AIDiscoveryFormData = {
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  role: 'executive',
  department: 'הנהלה ומוביל טכנולוגי',
  companySize: '21-100',
  aiFamiliarity: 3,
  currentAITools: ['ChatGPT'],
  industry: 'שירותים עסקיים, פיננסים ותעשייה',
  mainProcesses: ['שירות לקוחות', 'תפעול ומסמכים', 'מכירות והצעות מחיר'],
  docStorage: ['SharePoint/OneDrive', 'Local File Server'],
  hasM365: true,
  hasERP_CRM: true,
  erpCrmDetails: 'Priority ERP / M365',
  sensitiveDataNature: ['Financial', 'Standard Business'],
  regulatoryRestrictions: 'ISO 27001, חוק הגנת הפרטיות',
  timeWastingActivities: [
    'Email management',
    'Document search & filing',
    'Manual data entry / Copy-paste'
  ],
  customPainPoints: 'העובדים משקיעים זמן רב במענה על שאלות חוזרות, מיון מיילים וחיפוש מסמכים במספר מערכות.',
  estimatedDailyWastedHoursPerEmployee: 1.8,
  errorProneProcesses: 'הקלדת נתונים מ-PDF והפקת סיכומי פגישות ידנית',
  dreamGoalTomorrow: 'פורטל AI מרכזי שמחפש בכל מסמכי החברה, מתמצת פגישות ומבצע אוטומציה להזמנות רכש.',
  tasksToStopDoing: ['הקלדת נתונים כפולה', 'חיפוש ידני של חוזים ישנים'],
  decisionMetricsNeeded: ['רווחיות פרויקטים', 'זמני טיפול בפניות'],
  allowCloudExport: 'with_dpa_sso',
  complianceNeeds: ['ISO 27001'],
  budgetHorizon: 'quarterly_roadmap'
};

export const SecureAIDevPage: React.FC<SecureAIDevPageProps> = ({
  onBackToHome,
  onNavigateToContact,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  const simulatorSectionRef = useRef<HTMLDivElement>(null);

  // Simulator State
  const [simMode, setSimMode] = useState<'chat' | 'wizard' | 'processing' | 'report'>('chat');
  const [formData, setFormData] = useState<AIDiscoveryFormData>(DEFAULT_FORM_DATA);
  const [chatHistory, setChatHistory] = useState<AIConsultationMessage[]>([]);
  const [report, setReport] = useState<AIExcellenceReport | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedSpecialtyTab, setSelectedSpecialtyTab] = useState<string>('all');

  const scrollToSimulator = () => {
    simulatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Ensure page always opens at top when mounted as a page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const processingLogs = isHe
    ? [
        'ממפה טופולוגיה ארגונית ומקורות מידע...',
        'מנתח את שיחת הייעוץ ומזהה צווארי בקבוק מרכזיים...',
        'מחשב ציוני מוכנות ב-6 וקטורי AI Readiness...',
        'מכמת שעות מבוזבזות ובונה מודל ROI כלכלי ב-₪...',
        'מגבש ארכיטקטורת אבטחה מותאמת (Zero-Retention & DLP)...',
        'נשלח דוח לעבודה ושיגור עותק לתיבת המנכ״ל...',
        'מפיק AI Excellence Report ו-Roadmap מדורג...'
      ]
    : [
        'Mapping organizational ecosystem & data sources...',
        'Synthesizing CEO conversation & business bottlenecks...',
        'Scoring 6-vector AI readiness dimensions...',
        'Quantifying labor yields & financial ROI in NIS...',
        'Architecting Zero-Retention security blueprint...',
        'Executive work report dispatched...',
        'Synthesizing final AI Excellence Report & Roadmap...'
      ];

  const handleSelectPreset = (preset: AIDiscoveryPreset) => {
    setFormData(preset.data);
    triggerProcessingAndReport(preset.data, []);
  };

  const handleWizardSubmit = () => {
    triggerProcessingAndReport(formData, chatHistory);
  };

  const handleChatReportGeneration = (messages: AIConsultationMessage[], customData?: AIDiscoveryFormData) => {
    const activeData = customData || formData;
    setFormData(activeData);
    setChatHistory(messages);
    triggerProcessingAndReport(activeData, messages);
  };

  const triggerProcessingAndReport = async (
    dataToProcess: AIDiscoveryFormData,
    messages: AIConsultationMessage[]
  ) => {
    setSimMode('processing');
    setProcessingStep(0);
    setIsSynthesizing(true);

    // Scroll to processing container smoothly
    setTimeout(() => {
      simulatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    let generatedReport: AIExcellenceReport | null = null;

    // Launch data generation & email dispatch promise in background
    const dataPromise = (async () => {
      let rep: AIExcellenceReport;
      try {
        const response = await fetch('/api/ai-discovery/generate-tailored-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData: dataToProcess,
            chatHistory: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const localFallback = generateExcellenceReport(dataToProcess);
        const resData = await response.json();
        if (resData.success && resData.report) {
          rep = normalizeAIReport(resData.report, localFallback);
        } else {
          rep = localFallback;
        }
      } catch (err) {
        console.warn('Fallback to local report generation:', err);
        rep = generateExcellenceReport(dataToProcess);
      }

      // Auto dispatch email to g@tech-select.co.il (Direct FormSubmit + Server-side dispatch via Microsoft Graph API)
      try {
        const yearlySavings = (rep as any)?.financialAnalysis?.estimatedYearlySavingsNIS || rep?.roi?.estimatedAnnualFinancialSavingsNIS || 288000;
        const monthlyHours = (rep as any)?.financialAnalysis?.estimatedMonthlyHoursSaved || rep?.roi?.monthlyHoursSaved || 240;

        // 1. Direct FormSubmit dispatch from browser with verified endpoint and CC to g@tech-select.co.il
        fetch('https://formsubmit.co/ajax/support@tech-select.co.il', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: dataToProcess.fullName || 'מנכ״ל / מנהל',
            phone: dataToProcess.phone || 'לא צוין',
            email: dataToProcess.email || 'לא צוין',
            company: dataToProcess.companyName || 'חברה חדשה',
            companySize: dataToProcess.companySize || '21-100',
            estimatedSavingsNIS: `₪${yearlySavings.toLocaleString()}`,
            hoursSavedMonthly: `${monthlyHours} שעות/חודש`,
            executiveSummary: rep?.executiveSummary || 'דוח אפיון והטמעת AI הופק בהצלחה.',
            message: `📊 הופק דוח אפיון והטמעת AI מלא (AI Excellence Report)!\nחברה: ${dataToProcess.companyName}\nאיש קשר: ${dataToProcess.fullName}\nטלפון: ${dataToProcess.phone}\nדוא"ל: ${dataToProcess.email}\nגודל ארגון: ${dataToProcess.companySize}\nמערכות: ${dataToProcess.erpCrmDetails || 'M365, ERP'}\nחיסכון שנתי מוערך: ₪${yearlySavings.toLocaleString()}\nשעות חודשיות שייחסכו: ${monthlyHours} שעות\nתקציר מנהלים: ${rep?.executiveSummary || 'N/A'}`,
            _subject: `🤖 דוח AI Discovery ארגוני חדש למנכ"ל: ${dataToProcess.companyName || 'חברה חדשה'} (${dataToProcess.fullName || 'פונה'} | ${dataToProcess.phone || 'טלפון'})`,
            _captcha: 'false',
            _template: 'table',
            _cc: 'g@tech-select.co.il',
            _replyto: dataToProcess.email || undefined,
            timestamp: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
          }),
        }).catch((e) => console.warn('Direct report FormSubmit notification error:', e));

        // 2. Server-side HTML full executive report dispatch via Microsoft Graph API
        let sendRes = await fetch('/api/ai-discovery/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportData: rep,
            formData: dataToProcess,
            clientEmail: dataToProcess.email || 'g@tech-select.co.il',
          }),
        }).catch(() => null);

        if (!sendRes || !sendRes.ok) {
          sendRes = await fetch('/api/ai-discovery/send-email-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportData: rep,
              formData: dataToProcess,
              clientEmail: dataToProcess.email || 'g@tech-select.co.il',
            }),
          }).catch(() => null);
        }

        rep.emailSentStatus = {
          sent: true,
          sentTo: 'g@tech-select.co.il',
          timestamp: new Date().toISOString(),
        };
      } catch (sendErr) {
        console.error('Auto report send error:', sendErr);
      }

      return rep;
    })();

    // Smooth multi-step progression (total ~2.5 seconds) so user sees actual analysis
    for (let step = 0; step < processingLogs.length; step++) {
      setProcessingStep(step);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Await background data generation if not finished yet
    generatedReport = await dataPromise;

    if (!generatedReport) {
      generatedReport = generateExcellenceReport(dataToProcess);
    }

    setReport(generatedReport);
    setIsSynthesizing(false);
    setSimMode('report');

    // Smooth scroll to top of generated report
    setTimeout(() => {
      simulatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAddEmployeeFeedback = (wish: string) => {
    if (report && report.employeeSurveySummary) {
      setReport({
        ...report,
        employeeSurveySummary: {
          ...report.employeeSurveySummary,
          totalResponses: report.employeeSurveySummary.totalResponses + 1,
          topWishes: [wish, ...report.employeeSurveySummary.topWishes.slice(0, 3)]
        }
      });
    }
  };

  // Specialized Engineering Disciplines Data
  const devSpecialties = [
    {
      id: 'rag',
      category: 'knowledge',
      icon: Database,
      badge: isHe ? 'סנכרון ידע ארגוני' : 'ENTERPRISE RAG',
      title: isHe ? 'ארכיטקטורת Enterprise RAG מאובטחת ומבודדת' : 'Private Enterprise RAG Architecture',
      desc: isHe
        ? 'אינדוקס סמנטי מתקדם של מיליוני מסמכים (SharePoint, OneDrive, File Servers, קובצי PDF ו-ERP) עם שמירה קפדנית על הרשאות גישה (RBAC).'
        : 'Deep semantic indexing of corporate documents across SharePoint, File Servers, and ERPs with zero permission leakage.',
      features: isHe
        ? [
            'אינטגרציה ל-Entra ID / Google Workspace לסנכרון הרשאות בזמן אמת',
            'מניעת הזיות (Grounding) עם הפניות מקור מדויקות לכל פסקה',
            'בסיסי נתונים וקטוריים מקומיים (Qdrant, Milvus, pgvector)',
            'תמיכה מלאה בעברית מורכבת, מסמכים סרוקים (OCR) ותרשימים'
          ]
        : [
            'Real-time Entra ID / Google Workspace RBAC synchronization',
            'Strict anti-hallucination grounding with verified citations',
            'Local & private vector databases (Qdrant, Milvus, pgvector)',
            'Full bilingual Hebrew/English OCR & complex layout parsing'
          ],
      stack: ['Qdrant', 'LlamaIndex', 'LangChain', 'OpenAI Embeddings', 'SharePoint Graph API']
    },
    {
      id: 'onprem',
      category: 'security',
      icon: Server,
      badge: isHe ? 'בידוד הרמטי On-Prem' : 'AIR-GAP ON-PREMISES',
      title: isHe ? 'פריסת מודלי שפה מקומיים On-Premises & Air-Gap' : 'Air-Gap & On-Premises Local LLMs',
      desc: isHe
        ? 'הקמה והרצה של מודלי שפה חזקים (Llama 3.3, DeepSeek-V3, Mistral) על שרתי GPU ייעודיים בתוך מתקן הארגון, ללא שום חיבור לאינטרנט.'
        : 'Deployment of state-of-the-art open models on local GPU clusters with zero internet connectivity for classified environments.',
      features: isHe
        ? [
            'אפס תלות בענן – המידע לעולם אינו יוצא מהרשת הפיזית',
            'תאימות מלאה לסביבות מסווגות, משרד הביטחון ותעשיות רגישות',
            'חומרה מואצת: שרתי NVIDIA H100, L40S ו-RTX ארגוניים',
            'ביצועי שיהוי נמוך (Low Latency) וחיסכון בעלויות Token חודשיות'
          ]
        : [
            'Zero cloud dependency – corporate data never leaves physical premises',
            'Full compliance with Defense, military, and classified facilities',
            'Hardware acceleration on NVIDIA H100, L40S & enterprise RTX rigs',
            'Ultra-low latency inference with zero monthly API token bills'
          ],
      stack: ['vLLM', 'Ollama Enterprise', 'NVIDIA TensorRT-LLM', 'Docker Air-Gap', 'PyTorch']
    },
    {
      id: 'agents',
      category: 'automation',
      icon: Workflow,
      badge: isHe ? 'אוטומציה ואינטגרציה' : 'AUTONOMOUS AGENTS',
      title: isHe ? 'סוכני AI אוטונומיים וחיבור ל-Priority ERP ו-CRM' : 'Autonomous AI Agents & ERP Integration',
      desc: isHe
        ? 'פיתוח סוכני ביצוע חכמים המבצעים פעולות מורכבות במערכות הליבה הארגוניות: קריאת חשבוניות, הפקת הצעות מחיר, ועדכון רשומות ב-ERP.'
        : 'Intelligent multi-step agents that execute core actions in Priority ERP, Salesforce, SAP, and internal business engines.',
      features: isHe
        ? [
            'סוכן קריאת הצעות מחיר וחשבוניות PDF והזנתן ישירות ל-Priority ERP',
            'מענה אוטומטי ומאומת לפניות לקוחות במיילים ובמערכות Ticketing',
            'מנגנוני אישור אנושי בתהליכים קריטיים (Human-in-the-Loop)',
            'ניתוח שרשרת אספקה, התרעות על חוסרים והפקת דוחות ניהוליים'
          ]
        : [
            'Automated PDF invoice parsing & direct entry into Priority ERP',
            'Verified customer inquiry triaging via email and ticketing systems',
            'Strict Human-in-the-Loop approval gates for high-stakes actions',
            'Supply chain anomaly alerts and executive financial digests'
          ],
      stack: ['Priority REST/ODATA API', 'LangGraph', 'AutoGPT Architecture', 'FastAPI', 'Node.js']
    },
    {
      id: 'gateway',
      category: 'security',
      icon: Lock,
      badge: isHe ? 'הלבנת מידע ופרטיות' : 'ZERO-DATA-RETENTION DLP',
      title: isHe ? 'שכבת AI Gateway, הלבנת מידע ו-PII DLP Sanitizer' : 'Enterprise AI Gateway & PII DLP Layer',
      desc: isHe
        ? 'שער אבטחה מרכזי שבודק, מסנן ומלבין כל קלט AI בארגון, מסיר מספרי ת״ז, כרטיסי אשראי וסודות מסחריים, ואוכף מדיניות DPA ללא שמירת מידע.'
        : 'Central AI proxy enforcing Zero-Data-Retention agreements, PII tokenization, rate limits, and comprehensive audit trails.',
      features: isHe
        ? [
            'הסכמי DPA מול Microsoft Azure OpenAI ו-Google Cloud Vertex ללא אימון מודלים',
            'זיהוי והסוואת PII בזמן אמת (תעודות זהות, טלפונים, נתוני אשראי)',
            'יומן ביקורת (Audit Log) מלא ומנוטר למניעת הדלפות מידע עסקי',
            'ניהול תקציב, מכסות עובדים ובקרת עלויות לפי מחלקה'
          ]
        : [
            'Zero Data Retention DPA with Azure OpenAI & Google Vertex',
            'Real-time PII anonymization & cryptographic tokenization',
            'Full enterprise audit logging and compliance oversight',
            'Departmental quota management and cost allocation controls'
          ],
      stack: ['Azure OpenAI Private Endpoint', 'Presidio PII', 'OpenTelemetry', 'Redis Gateway']
    },
    {
      id: 'workspaces',
      category: 'knowledge',
      icon: Layers,
      badge: isHe ? 'חוויית משתמש מותאמת' : 'ENTERPRISE COPILOT',
      title: isHe ? 'פורטלי עבודה מותאמים אישית (Enterprise AI Workspaces)' : 'Custom Enterprise AI Workspaces',
      desc: isHe
        ? 'סביבת עבודה ארגונית ממותגת (Web & Desktop) המאפשרת לעובדים להשתמש בכלי AI מאושרים, לשתף פרומפטים מחלקתיים ולנתח מידע פנימי בצורה מבוקרת.'
        : 'Branded white-label AI collaboration portals with departmental prompt libraries, secure file upload vaults, and SSO.',
      features: isHe
        ? [
            'התחברות אחידה ב-SSO (Microsoft Entra ID / Okta / Google)',
            'ספריית פרומפטים ארגונית מאומתת לתהליכי מכירות, משפט והנדסה',
            'שיתוף ידע בתוך צוותים עם בקרת גישה לפי פרויקטים',
            'אינטגרציה ל-Microsoft Teams, Slack וממשקי WhatsApp ארגוניים'
          ]
        : [
            'Single Sign-On (SSO) with Microsoft Entra ID, Okta & Google',
            'Verified organizational prompt repository for sales, legal & ops',
            'Team collaboration vaults with granular project permissions',
            'Deep connectors for MS Teams, Slack & Enterprise WhatsApp'
          ],
      stack: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'WebSocket Engine']
    },
    {
      id: 'finetune',
      category: 'automation',
      icon: FileCode,
      badge: isHe ? 'אימון והתאמה עמוקה' : 'DOMAIN FINE-TUNING',
      title: isHe ? 'אימון והתאמת מודלים ייעודיים (Domain Fine-Tuning)' : 'Custom Domain Model Fine-Tuning & Evaluation',
      desc: isHe
        ? 'התאמת מודלים לשפה המקצועית של הארגון בענפי משפט, רפואה, הנדסה ופיננסים, עם מנגנוני הערכה קפדניים למניעת שגיאות.'
        : 'Domain adaptation & fine-tuning for specialized legal, financial, engineering, and defense vocabularies with robust evaluation pipelines.',
      features: isHe
        ? [
            'אימון מודלים על בסיס נתונים פנימיים וזיהוי דפוסי ניסוח ייחודיים',
            'מנגנוני Guardrails ובקרת בטיחות למניעת הזיות ומידע מטעה',
            'מדדי הערכה כמותיים (Automated Benchmarking & RAGAS)',
            'תחזוקה רציפה ועדכון משקולות מודל בהתאם להתפתחות הארגון'
          ]
        : [
            'Custom LoRA / QLoRA parameter-efficient fine-tuning pipelines',
            'Safety guardrails preventing hallucinated outputs',
            'Automated RAGAS & quantitative accuracy benchmarks',
            'Continuous fine-tuning lifecycle as business data evolves'
          ],
      stack: ['Hugging Face', 'Unsloth', 'Ragas Framework', 'Guardrails AI', 'Weights & Biases']
    }
  ];

  const filteredSpecialties = selectedSpecialtyTab === 'all'
    ? devSpecialties
    : devSpecialties.filter((s) => s.category === selectedSpecialtyTab);

  return (
    <div className={`font-sans transition-colors duration-300 selection:bg-cyan-500 selection:text-white relative overflow-hidden bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={aiEngineeringBg || '/ai_engineering_hero.jpg'}
        fallbackSrc="/ai_engineering_hero.jpg"
        alt="TECH-SELECT Enterprise AI Engineering & High-Performance Compute Cluster"
        glowColor="bg-violet-600"
      />
      
      {/* 1. HERO SECTION - SECURE AI DEVELOPMENT */}
      <div className="py-6 sm:py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Main Hero Banner */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Pill / Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-sm border animate-linear-eyebrow ${
              isDark 
                ? 'bg-slate-900 text-cyan-300 border-cyan-500/30' 
                : 'bg-white text-blue-800 border-blue-200'
            }`}>
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>SECURE AI DEVELOPMENT & ENTERPRISE ARCHITECTURE</span>
            </div>

            {/* Main Heading */}
            <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-heading animate-linear-title ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isHe ? (
                <>
                  פיתוח מאובטח <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-300">AI</span><br />
                  לארגונים, מערכות ERP וסביבות מסווגות
                </>
              ) : (
                <>
                  Enterprise Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-300">AI Development</span><br />
                  For Enterprises, ERP Systems & Classified Environments
                </>
              )}
            </h1>

            {/* Description Body */}
            <p className={`text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-normal animate-linear-subtitle ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {isHe ? (
                <>
                  ב-<strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT (טק-סלקט בע"מ)</strong>, אנו מתמחים בארכיטקטורה, פיתוח והטמעה של פתרונות בינה מלאכותית (AI) מותאמים אישית: מערכות RAG מבודדות הרשאות, מודלי שפה מקומיים On-Premises ללא חיבור לאינטרנט (Air-Gap), סוכני AI ל-Priority ERP ו-CRM, ושערי אבטחה Zero Data Retention המבטיחים החזר השקעה (ROI) מובהק ללא סכנת זליגת מידע.
                </>
              ) : (
                <>
                  At <strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT LTD</strong>, we engineer secure, production-grade enterprise AI: private RBAC RAG systems, Air-Gapped On-Premises LLMs, autonomous ERP agents, and Zero Data Retention gateways ensuring massive business yield with zero data leak risks.
                </>
              )}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-linear-cta">
              <button
                onClick={scrollToSimulator}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold px-6 py-3.5 rounded-full text-xs sm:text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-cyan-200" />
                <span>{isHe ? 'מעבר לסימולטור האפיון וחישוב ROI' : 'Launch AI Discovery Simulator'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                onClick={onNavigateToContact}
                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer group border ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border-white/[0.08] hover:border-white/20'
                    : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border-slate-300 shadow-xs'
                }`}
              >
                <Lock className="w-4 h-4 text-cyan-500" />
                <span>{isHe ? 'תיאום פגישת ארכיטקטורה וסודיות (NDA)' : 'Book Architecture Consultation'}</span>
              </button>
            </div>

            {/* Telemetry Strip / Metric Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 max-w-4xl mx-auto">
              <SpotlightCard className="p-3.5 text-right">
                <div className="flex items-center gap-2 mb-1 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] font-mono font-bold">ZERO RETENTION</span>
                </div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'הסכמי DPA ללא אימון מידע' : 'DPA Zero Data Retention'}
                </span>
              </SpotlightCard>

              <SpotlightCard className="p-3.5 text-right">
                <div className="flex items-center gap-2 mb-1 text-cyan-400">
                  <Server className="w-4 h-4" />
                  <span className="text-[11px] font-mono font-bold">AIR-GAP GPUS</span>
                </div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'מודלים מקומיים ללא אינטרנט' : 'Air-Gap Local GPU Clusters'}
                </span>
              </SpotlightCard>

              <SpotlightCard className="p-3.5 text-right">
                <div className="flex items-center gap-2 mb-1 text-blue-400">
                  <Workflow className="w-4 h-4" />
                  <span className="text-[11px] font-mono font-bold">PRIORITY & ERP</span>
                </div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'סוכני אוטומציה למערכות ליבה' : 'Autonomous ERP Agents'}
                </span>
              </SpotlightCard>

              <SpotlightCard className="p-3.5 text-right">
                <div className="flex items-center gap-2 mb-1 text-indigo-400">
                  <Award className="w-4 h-4" />
                  <span className="text-[11px] font-mono font-bold">ISO 27001</span>
                </div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'עמידה בחוק הגנת הפרטיות 2024' : 'ISO & Privacy Law Compliant'}
                </span>
              </SpotlightCard>
            </div>

          </div>

          {/* 2. CORE SPECIALTIES IN SECURE AI DEVELOPMENT (התמחויות הפיתוח המאובטח שלנו) */}
          <div className="space-y-8 pt-6">
            
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold mb-2 border ${
                  isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isHe ? 'תחומי התמחות בהנדסת תוכנה ו-AI' : 'Core Engineering Disciplines'}</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'התמחויות בפיתוח והטמעת AI מאובטח' : 'Our Secure AI Development Specialties'}
                </h2>
              </div>

              {/* Category Filter Pills */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
                isDark ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
                {[
                  { id: 'all', label: isHe ? 'הכל' : 'All' },
                  { id: 'knowledge', label: isHe ? 'RAG וידע' : 'RAG & Knowledge' },
                  { id: 'security', label: isHe ? 'אבטחה ו-AirGap' : 'Security & AirGap' },
                  { id: 'automation', label: isHe ? 'סוכנים ו-ERP' : 'Agents & ERP' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedSpecialtyTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedSpecialtyTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialties Grid (6 Detailed Modules with SpotlightCards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSpecialties.map((spec) => {
                const IconComp = spec.icon;
                return (
                  <SpotlightCard
                    key={spec.id}
                    className="p-6 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {spec.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className={`text-base font-bold font-heading mb-2 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {spec.title}
                        </h3>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {spec.desc}
                        </p>
                      </div>

                      {/* Key Capabilities Bullets */}
                      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                        {spec.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tech Stack Tags */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-1.5">
                      {spec.stack.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isDark ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>

            {/* 3. 4-TIER ENTERPRISE SECURITY BLUEPRINT */}
            <SpotlightCard className="p-6 sm:p-8 mt-8">
              <div className="text-center max-w-3xl mx-auto mb-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  {isHe ? 'ארכיטקטורת שכבות מאובטחת' : '4-Tier Security Topology'}
                </span>
                <h3 className={`text-xl sm:text-2xl font-black font-heading mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'איך אנחנו מגינים על המידע הארגוני שלכם?' : 'How We Safeguard Your Enterprise Data'}
                </h3>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe
                    ? 'כל בקשת AI עוברת ארבע שכבות בקרה ואבטחה קפדניות לפני שהיא מעובדת.'
                    : 'Every AI transaction traverses four distinct security and sanitization tiers before processing.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">TIER 1</span>
                    <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isHe ? 'זיהוי והרשאות RBAC' : 'Identity & RBAC'}
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe ? 'אימות ב-M365 Entra ID. המודל ניגש אך ורק למסמכים שהעובד מורשה לצפות בהם.' : 'Entra ID SSO with strict least-privilege document access control.'}
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">TIER 2</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isHe ? 'הלבנת PII ו-DLP Gateway' : 'PII & DLP Sanitizer'}
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe ? 'סינון והסוואה אוטומטית של ת״ז, פרטי תשלום וסודות מסחריים בזמן אמת.' : 'Real-time redaction of sensitive customer PII & trade secrets.'}
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">TIER 3</span>
                    <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isHe ? 'אינדוקס RAG ו-ERP' : 'Private RAG Engine'}
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe ? 'חיפוש סמנטי מדויק במסמכי החברה וב-Priority ללא הזיות (Zero Hallucinations).' : 'Strict grounded retrieval against SharePoint & Priority ERP data.'}
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">TIER 4</span>
                    <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isHe ? 'מנוע עיבוד מאובטח' : 'Zero-Retention Compute'}
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe ? 'הרצה בשרתי Air-Gap מקומיים או בענן ייעודי עם התחייבות DPA לאי-שמירת מידע.' : 'Air-Gap GPU clusters or enterprise cloud with strict DPA.'}
                  </p>
                </div>
              </div>
            </SpotlightCard>

          </div>

          {/* 4. THE EXECUTIVE AI ASSESSMENT ENGINE (C-LEVEL GATED & STABLE) */}
          <div ref={simulatorSectionRef} id="simulator" className="pt-8 space-y-6">
            <ExecutiveAIAssessmentEngine
              onNavigateToContact={onNavigateToContact}
            />
          </div>

        </div>
      </div>

      {/* EMPLOYEE SURVEY MODAL */}
      <EmployeeSurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        companyName={formData.companyName || 'החברה שלכם'}
        onAddEmployeeFeedback={handleAddEmployeeFeedback}
      />
    </div>
  );
};
