import React, { useState, useEffect } from 'react';
import { 
  Bot, Sparkles, Send, Shield, Building2, User, Phone, Mail, 
  CheckCircle2, ArrowLeft, ArrowRight, RefreshCw, Zap, Lightbulb, 
  Target, Database, Lock, Clock, HelpCircle, Layers, Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AIDiscoveryFormData, AIConsultationMessage } from '../../types';

interface AIConsultationChatProps {
  formData: AIDiscoveryFormData;
  onChangeFormData: (data: AIDiscoveryFormData) => void;
  onGenerateReport: (messages: AIConsultationMessage[], customData?: AIDiscoveryFormData) => void;
  onSwitchToWizard?: () => void;
  onBackToHero?: () => void;
  isGenerating?: boolean;
}

const STORAGE_KEY_LEAD = 'techselect_simulator_lead';

interface GuidedQuestion {
  id: string;
  stepNumber: number;
  titleHe: string;
  titleEn: string;
  subtitleHe: string;
  subtitleEn: string;
  field: 'companyStory' | 'primaryGoal' | 'mainSystems' | 'biggestBottleneck';
  placeholderHe: string;
  placeholderEn: string;
  presetsHe: string[];
  presetsEn: string[];
}

const GUIDED_QUESTIONS: GuidedQuestion[] = [
  {
    id: 'companyStory',
    stepNumber: 1,
    titleHe: 'ספרו לנו בקצרה על הארגון והפעילות',
    titleEn: 'Tell us briefly about your organization and operations',
    subtitleHe: 'מה תחום הפעילות, מה מייצר או מספק הארגון ומה גודל הצוות?',
    subtitleEn: 'What is your industry, what do you deliver, and what is your team size?',
    field: 'companyStory',
    placeholderHe: 'לדוגמה: "אנו חברת שירותים והנדסה בת 65 עובדים, מנהלים עשרות פרויקטים ומטפלים במאות פניות לקוחות בחודש..."',
    placeholderEn: 'e.g., "We are an engineering services firm with 65 staff managing ongoing projects and large client request volumes..."',
    presetsHe: [
      'חברת שירותים עסקיים / מקצועיים (30-80 עובדים), מנהלים תיקי לקוחות ופרויקטים מורכבים.',
      'מפעל תעשייתי / יצרני (50-200 עובדים) עם מערך רכש, לוגיסטיקה ושירות לקוחות.',
      'משרד פיננסי / עורכי דין / ייעוץ (20-60 עובדים) המטפל במסמכים רגישים ובחוזים רבים.',
      'חברת מסחר והפצה עם קטלוג מוצרים גדול, מוקד שירות ומערך הזמנות יומי.'
    ],
    presetsEn: [
      'Professional services firm (30-80 staff) managing ongoing client accounts and projects.',
      'Industrial/manufacturing plant (50-200 staff) with procurement, logistics, and support.',
      'Financial/legal/consulting office (20-60 staff) handling heavy sensitive contracts.',
      'Commercial distribution company with large product catalog and high order volume.'
    ]
  },
  {
    id: 'primaryGoal',
    stepNumber: 2,
    titleHe: 'לאן תרצו להגיע? מה היעד העיקרי בשילוב AI?',
    titleEn: 'What is your primary goal with AI adoption?',
    subtitleHe: 'חיסכון בשעות עבודה, שיפור שירות לקוחות, קיצור זמני תגובה או אוטומציה עסקית?',
    subtitleEn: 'Labor hours savings, superior response time, customer service, or automated workflows?',
    field: 'primaryGoal',
    placeholderHe: 'לדוגמה: "היעד הוא לחסוך 2-3 שעות עבודה ביום לכל עובד, להאיץ הפקת הצעות מחיר מ-3 ימים לשעה אחת, ולמנוע טעויות אנוש..."',
    placeholderEn: 'e.g., "The goal is saving 2-3 daily hours per staff member, speeding quotes from 3 days to 1 hour, and eliminating manual mistakes..."',
    presetsHe: [
      'חיסכון מסיבי בשעות עבודה ידניות (תיוק, מיון מיילים, הזנת נתונים כפולה והפקת סיכומים).',
      'קיצור דרמטי בזמני הפקת הצעות מחיר, מענה למכרזים והרכבת מפרטים טכניים מורכבים.',
      'פורטל ידע פנימי מאובטח (RAG) שמאפשר לכל עובד לשלוף מידע מחוזי עבר ומסמכים בשניות.',
      'סוכני AI אוטונומיים שמבצעים משימות שגרתיות במערכת ה-ERP/CRM ומייצרים דוחות להנהלה.'
    ],
    presetsEn: [
      'Massive manual labor savings (document filing, email sorting, redundant data entry).',
      'Dramatic acceleration of quote creation, RFP replies, and complex technical spec drafting.',
      'Private internal knowledge portal (RAG) allowing staff to retrieve past contract data in seconds.',
      'Autonomous AI agents executing routine ERP/CRM tasks and generating management digests.'
    ]
  },
  {
    id: 'mainSystems',
    stepNumber: 3,
    titleHe: 'באילו מערכות מידע ותשתיות אתם משתמשים כיום?',
    titleEn: 'Which business systems and data infrastructure do you currently use?',
    subtitleHe: 'מערכות ERP, CRM, שרתי קבצים, דוא"ל או מאגרי נתונים ייעודיים',
    subtitleEn: 'ERP, CRM, file servers, cloud mail, and specialized internal databases',
    field: 'mainSystems',
    placeholderHe: 'לדוגמה: "Priority ERP, Microsoft 365, SharePoint, OneDrive, שרת קבצים פנימי מקומי ו-Salesforce..."',
    placeholderEn: 'e.g., "Priority ERP, Microsoft 365, SharePoint, OneDrive, local on-prem file server, and Salesforce..."',
    presetsHe: [
      'Priority ERP + Microsoft 365 (SharePoint / Outlook / OneDrive)',
      'Salesforce CRM + Google Workspace + שרת קבצים מקומי (Local Server)',
      'SAP Business One + M365 + מאגרי PDF ו-Excel מרובים',
      'מערכת ERP ייעודית פנימית + שרתי אחסון מקומיים וסביבה מעורבת'
    ],
    presetsEn: [
      'Priority ERP + Microsoft 365 (SharePoint / Outlook / OneDrive)',
      'Salesforce CRM + Google Workspace + Local on-premises file server',
      'SAP Business One + M365 + extensive PDF & Excel stores',
      'Custom proprietary ERP + local network storage and hybrid cloud'
    ]
  },
  {
    id: 'biggestBottleneck',
    stepNumber: 4,
    titleHe: 'מהו צוואר הבקבוק או האתגר המרכזי ביותר שמכביד עליכם?',
    titleEn: 'What is the biggest operational bottleneck or pain point slowing you down?',
    subtitleHe: 'באיזה תהליך מתבזבז הכי הרבה זמן או קיים חשש מאבטחת מידע וזליגה?',
    subtitleEn: 'Where is the most time lost, or what are your security & compliance concerns?',
    field: 'biggestBottleneck',
    placeholderHe: 'לדוגמה: "העובדים מוצפים במאות מיילים וקובצי PDF, מבזבזים זמן בחיפוש מסמכים ישנים, ויש חשש שעובדים משתמשים ב-ChatGPT חינמי עם מידע רגיש..."',
    placeholderEn: 'e.g., "Staff is overwhelmed with emails & PDFs, losing hours searching old docs, with risk of employees using free ChatGPT with sensitive data..."',
    presetsHe: [
      'עומס מיילים אדיר, מענה ידני חוזר על שאלות לקוחות וחיפוש מתיש בשרתי קבצים.',
      'תהליכי הקלדה והזנה כפולה מ-PDF/חשבוניות לתוך ה-ERP שגוזלים ימים שלמים.',
      'חשש משימוש של עובדים בכלים חינמיים ציבוריים (Shadow AI) ודליפת סודות מסחריים.',
      'חוסר יכולת לקבל תמונת מצב ניהולית מהירה מתוך אלפי נתונים ומסמכים מפוזרים.'
    ],
    presetsEn: [
      'Heavy email overload, repetitive manual customer inquiries, and sluggish doc retrieval.',
      'Manual double-entry from PDFs/invoices into ERP consuming full workdays.',
      'Risk of employees using public shadow AI tools leaking confidential customer trade secrets.',
      'Inability to extract rapid executive insights from thousands of fragmented documents.'
    ]
  }
];

export const AIConsultationChat: React.FC<AIConsultationChatProps> = ({
  formData,
  onChangeFormData,
  onGenerateReport,
  isGenerating = false,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  // Lead / Company identity
  const [leadForm, setLeadForm] = useState({
    fullName: formData.fullName || '',
    companyName: formData.companyName || '',
    email: formData.email || '',
    phone: formData.phone || '',
    companySize: formData.companySize || '21-100',
    role: formData.role || 'מנכ"ל / הנהלה',
  });

  // 4 Structured Questionnaire Answers
  const [answers, setAnswers] = useState({
    companyStory: formData.industry ? `${formData.industry} - ${formData.department || ''}` : '',
    primaryGoal: formData.dreamGoalTomorrow || '',
    mainSystems: formData.erpCrmDetails || 'Priority ERP / M365 SharePoint',
    biggestBottleneck: formData.customPainPoints || '',
  });

  // Current Active Step in the Guided Diagnostic Flow (0: Identity -> 1,2,3,4: Questions -> 5: Review & Send)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [botTrap, setBotTrap] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved contact details from storage
  useEffect(() => {
    try {
      const savedLeadStr = localStorage.getItem(STORAGE_KEY_LEAD);
      if (savedLeadStr) {
        const savedLead = JSON.parse(savedLeadStr);
        if (savedLead && typeof savedLead === 'object') {
          setLeadForm((prev) => ({
            fullName: prev.fullName || savedLead.fullName || '',
            companyName: prev.companyName || savedLead.companyName || '',
            email: prev.email || savedLead.email || '',
            phone: prev.phone || savedLead.phone || '',
            companySize: prev.companySize || savedLead.companySize || '21-100',
            role: prev.role || savedLead.role || 'מנכ"ל / הנהלה',
          }));
        }
      }
    } catch {}
  }, []);

  // Validate step 0 (Contact & Company details)
  const validateIdentityStep = () => {
    const errs: { [key: string]: string } = {};

    if (botTrap) {
      errs.fullName = 'Bot detected';
      return false;
    }

    if (!leadForm.fullName.trim() || leadForm.fullName.trim().length < 2) {
      errs.fullName = isHe ? 'נא להזין שם מלא' : 'Full name required';
    }
    if (!leadForm.companyName.trim() || leadForm.companyName.trim().length < 2) {
      errs.companyName = isHe ? 'נא להזין שם ארגון / חברה' : 'Company name required';
    }
    if (!leadForm.phone.trim() || leadForm.phone.trim().replace(/\D/g, '').length < 7) {
      errs.phone = isHe ? 'נא להזין טלפון ישיר תקין' : 'Valid direct phone required';
    }
    if (!leadForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email.trim())) {
      errs.email = isHe ? 'נא להזין כתובת דוא"ל עסקית תקינה' : 'Valid business email required';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStartQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIdentityStep()) return;

    try {
      localStorage.setItem(STORAGE_KEY_LEAD, JSON.stringify(leadForm));
    } catch {}

    setCurrentStep(1);
    
    // 1. Direct notification to ensure instant email delivery when starting simulator
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: leadForm.fullName,
        company: leadForm.companyName,
        phone: leadForm.phone,
        email: leadForm.email,
        message: `🚨 ליד חם התחיל את סימולטור ה-AI באתר!\nחברה: ${leadForm.companyName}\nאיש קשר: ${leadForm.fullName}\nטלפון: ${leadForm.phone}\nדוא"ל: ${leadForm.email}\nגודל ארגון: ${leadForm.companySize}`,
        service: "סימולטור AI Discovery",
      }),
    }).catch(() => {});

    fetch('https://formsubmit.co/ajax/support@tech-select.co.il', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: leadForm.fullName,
        company: leadForm.companyName,
        phone: leadForm.phone,
        email: leadForm.email,
        companySize: leadForm.companySize,
        role: leadForm.role,
        message: `🚨 ליד חם התחיל את סימולטור ה-AI באתר!\nחברה: ${leadForm.companyName}\nאיש קשר: ${leadForm.fullName}\nטלפון: ${leadForm.phone}\nדוא"ל: ${leadForm.email}\nגודל ארגון: ${leadForm.companySize}`,
        _subject: `🔥 ליד חדש התחיל את סימולטור ה-AI: ${leadForm.companyName} (${leadForm.fullName} | ${leadForm.phone})`,
        _captcha: 'false',
        _template: 'table',
        _cc: 'g@tech-select.co.il',
        _replyto: leadForm.email || undefined,
        timestamp: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
      }),
    }).catch((e) => console.warn('Direct start FormSubmit error:', e));

    // 2. Server-side activity logging
    fetch('/api/simulator/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityType: 'unlock_ai_simulator',
        title: `🔥 ליד חם בסימולטור AI: ${leadForm.companyName} (${leadForm.fullName} | ${leadForm.phone}) פתח/ה את הסימולטור!`,
        formData: leadForm,
      }),
    }).catch(() => {});
  };

  const handleNextQuestion = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(5); // Review & Submit Step
    }
  };

  const handlePrevQuestion = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Final submit: send data, generate executive report, dispatch directly to email
  const handleSubmitFullAssessment = async () => {
    if (isSubmitting || isGenerating) return;
    setIsSubmitting(true);

    const fName = leadForm.fullName.trim();
    const cName = leadForm.companyName.trim();
    const emailVal = leadForm.email.trim();
    const phoneVal = leadForm.phone.trim();

    const compiledBrief = `
🏢 פרופיל הארגון והפעילות:
${answers.companyStory || 'חברה עסקית'}

🎯 יעד ומטרת העל בשילוב AI:
${answers.primaryGoal || 'חיסכון בשעות עבודה ואוטומציה מאובטחת'}

💻 מערכות מידע ותשתיות קיימות:
${answers.mainSystems || 'Priority ERP / M365'}

⚠️ צוואר הבקבוק והאתגר המרכזי:
${answers.biggestBottleneck || 'עומס ידני וצורך באבטחת מידע קשיחה'}
    `.trim();

    const updatedData: AIDiscoveryFormData = {
      ...formData,
      fullName: fName,
      companyName: cName,
      email: emailVal,
      phone: phoneVal,
      companySize: leadForm.companySize,
      role: leadForm.role,
      customPainPoints: compiledBrief,
      dreamGoalTomorrow: answers.primaryGoal,
      erpCrmDetails: answers.mainSystems,
      mainProcesses: [answers.companyStory.substring(0, 100), answers.primaryGoal.substring(0, 100)],
    };

    onChangeFormData(updatedData);

    // Formulate clean structured synthetic consultation history for the report engine
    const syntheticMessages: AIConsultationMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: isHe ? 'שלום, נאסוף את כל הנתונים שלכם לאפיון מלא. ספרו לנו על הארגון.' : 'Welcome. Tell us about your organization.',
        timestamp: '10:00',
      },
      {
        id: 'msg-2',
        role: 'user',
        content: `ארגון: ${answers.companyStory}`,
        timestamp: '10:01',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: isHe ? 'מה היעד העיקרי שלכם בשילוב AI?' : 'What is your primary AI goal?',
        timestamp: '10:02',
      },
      {
        id: 'msg-4',
        role: 'user',
        content: `יעד: ${answers.primaryGoal}`,
        timestamp: '10:03',
      },
      {
        id: 'msg-5',
        role: 'assistant',
        content: isHe ? 'באילו מערכות ERP/CRM ותשתיות אתם משתמשים?' : 'Which ERP/CRM systems do you use?',
        timestamp: '10:04',
      },
      {
        id: 'msg-6',
        role: 'user',
        content: `מערכות: ${answers.mainSystems}`,
        timestamp: '10:05',
      },
      {
        id: 'msg-7',
        role: 'assistant',
        content: isHe ? 'מהו צוואר הבקבוק או האתגר המרכזי?' : 'What is your biggest operational bottleneck?',
        timestamp: '10:06',
      },
      {
        id: 'msg-8',
        role: 'user',
        content: `אתגר: ${answers.biggestBottleneck}`,
        timestamp: '10:07',
      },
    ];

    // Asynchronously log full diagnostic submission
    fetch('/api/simulator/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityType: 'complete_simulator_form',
        title: `🔥 דוח אפיון מלא מוכן לעיבוד: ${cName} (${fName} | ${phoneVal})`,
        formData: {
          ...leadForm,
          answers,
        },
        botTrap,
        details: compiledBrief,
      }),
    }).catch(() => {});

    setIsSubmitting(false);
    // Direct call to process data and generate report without recurring AI questions
    onGenerateReport(syntheticMessages, updatedData);
  };

  const activeQuestion = GUIDED_QUESTIONS.find((q) => q.stepNumber === currentStep);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 transition-all">
      <div className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all relative ${
        isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        
        {/* ==================================================== */}
        {/* TOP STATUS & STEP PROGRESS BAR */}
        {/* ==================================================== */}
        <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/25 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {isHe ? 'סימולטור אבחון ואיסוף נתוני AI' : 'AI Diagnostic & Discovery Collector'}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {isHe ? 'דוח מנהלים ישיר' : 'Zero-Loop Executive Report'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHe ? 'איסוף מידע מובנה ➔ עיבוד אלגוריתמי ➔ הפקת דוח ומשלוח ישיר למייל' : 'Structured Data Collection ➔ Processing ➔ Report Dispatched'}
              </p>
            </div>
          </div>

          {/* Step Badges (0 to 5) */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {[
              { num: 0, labelHe: 'פרטי ארגון', labelEn: 'Contact' },
              { num: 1, labelHe: 'אופי החברה', labelEn: 'Company' },
              { num: 2, labelHe: 'מטרת AI', labelEn: 'Goals' },
              { num: 3, labelHe: 'מערכות', labelEn: 'Systems' },
              { num: 4, labelHe: 'צוואר בקבוק', labelEn: 'Bottlenecks' },
              { num: 5, labelHe: 'עיבוד ודוח', labelEn: 'Report' },
            ].map((st) => {
              const isPast = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => {
                    // Only allow jumping back or to completed steps
                    if (st.num < currentStep || (st.num === 0) || (leadForm.fullName && leadForm.companyName)) {
                      setCurrentStep(st.num);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isPast
                        ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                        : isDark ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isPast ? <Check className="w-3 h-3" /> : <span>{st.num + 1}</span>}
                  <span className="hidden md:inline">{isHe ? st.labelHe : st.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================== */}
        {/* STEP 0: CONTACT & COMPANY IDENTITY (MANDATORY) */}
        {/* ==================================================== */}
        {currentStep === 0 && (
          <form onSubmit={handleStartQuestions} className="p-6 sm:p-8 space-y-6 animate-fadeIn">
            {/* Anti-bot trap */}
            <input
              type="text"
              name="bot_trap"
              value={botTrap}
              onChange={(e) => setBotTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="opacity-0 absolute -top-[9999px] left-0 h-0 w-0 pointer-events-none"
              aria-hidden="true"
            />

            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                {isHe ? 'שלב 1 מתוך 5: פרטי הארגון ואיש הקשר' : 'Step 1 of 5: Organization & Contact Details'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {isHe
                  ? 'נא למלא את פרטי הארגון. לאחר 4 שאלות מנחות קצרות נפיק דוח אפיון והטמעת AI מלא (AI Excellence Report) הכולל תחשיב ROI ו-Roadmap, וישוגר ישירות למייל שלך.'
                  : 'Enter your business details. After 4 quick guided questions, we will generate your tailored AI Excellence Report and dispatch it to your email.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-200">
                  {isHe ? 'שם מלא *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={leadForm.fullName}
                  onChange={(e) => {
                    setLeadForm({ ...leadForm, fullName: e.target.value });
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                  }}
                  placeholder={isHe ? 'ישראל ישראלי' : 'Jane Doe'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all ${
                    formErrors.fullName 
                      ? 'border-red-500 bg-red-500/10' 
                      : isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                {formErrors.fullName && <p className="text-[11px] text-red-400 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-200">
                  {isHe ? 'שם החברה / ארגון *' : 'Company Name *'}
                </label>
                <input
                  type="text"
                  value={leadForm.companyName}
                  onChange={(e) => {
                    setLeadForm({ ...leadForm, companyName: e.target.value });
                    if (formErrors.companyName) setFormErrors({ ...formErrors, companyName: '' });
                  }}
                  placeholder={isHe ? 'שם החברה בע"מ' : 'Acme Ltd'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all ${
                    formErrors.companyName 
                      ? 'border-red-500 bg-red-500/10' 
                      : isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                {formErrors.companyName && <p className="text-[11px] text-red-400 mt-1">{formErrors.companyName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-200">
                  {isHe ? 'טלפון ישיר *' : 'Direct Phone *'}
                </label>
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => {
                    setLeadForm({ ...leadForm, phone: e.target.value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                  }}
                  placeholder={isHe ? '050-1234567' : '+972-50-1234567'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all ${
                    formErrors.phone 
                      ? 'border-red-500 bg-red-500/10' 
                      : isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                {formErrors.phone && <p className="text-[11px] text-red-400 mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-200">
                  {isHe ? 'דוא"ל עסקי (למשלוח הדוח) *' : 'Business Email (For Report Dispatch) *'}
                </label>
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => {
                    setLeadForm({ ...leadForm, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  placeholder="ceo@company.co.il"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all ${
                    formErrors.email 
                      ? 'border-red-500 bg-red-500/10' 
                      : isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                {formErrors.email && <p className="text-[11px] text-red-400 mt-1">{formErrors.email}</p>}
              </div>
            </div>

            {/* Company Size */}
            <div className="max-w-2xl mx-auto">
              <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-200">
                {isHe ? 'גודל הארגון' : 'Company Size'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['1-20', '21-100', '101-500', '500+'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLeadForm({ ...leadForm, companySize: s })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      leadForm.companySize === s
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : isDark ? 'bg-slate-950 border-white/10 text-slate-300 hover:bg-white/5' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s} {isHe ? 'עובדים' : 'Staff'}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Continue */}
            <div className="max-w-2xl mx-auto pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{isHe ? 'המשך ל-4 שאלות האפיון המנחות' : 'Continue to 4 Guided Diagnostic Questions'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* STEPS 1, 2, 3, 4: GUIDED FIXED ASSESSMENT QUESTIONS */}
        {/* ==================================================== */}
        {currentStep >= 1 && currentStep <= 4 && activeQuestion && (
          <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
            
            {/* Header info for active question */}
            <div className="flex items-start justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-600 text-white">
                    {isHe ? `שאלה מנחה ${activeQuestion.stepNumber} מתוך 4` : `Question ${activeQuestion.stepNumber} of 4`}
                  </span>
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold font-mono">
                    {leadForm.companyName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black font-heading text-slate-900 dark:text-white">
                  {isHe ? activeQuestion.titleHe : activeQuestion.titleEn}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isHe ? activeQuestion.subtitleHe : activeQuestion.subtitleEn}
                </p>
              </div>

              <div className="text-left rtl:text-right shrink-0">
                <span className="text-xs font-mono text-slate-400 block">{isHe ? 'התקדמות' : 'Progress'}</span>
                <span className="text-lg font-black text-cyan-500 font-mono">
                  {Math.round((activeQuestion.stepNumber / 4) * 100)}%
                </span>
              </div>
            </div>

            {/* Question Text Area */}
            <div className="space-y-3">
              <textarea
                rows={4}
                value={answers[activeQuestion.field]}
                onChange={(e) => setAnswers({ ...answers, [activeQuestion.field]: e.target.value })}
                placeholder={isHe ? activeQuestion.placeholderHe : activeQuestion.placeholderEn}
                className={`w-full p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-sans shadow-inner ${
                  isDark ? 'bg-slate-950/80 border-white/15 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />

              {/* Presets / Fast Clicks */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHe ? 'תשובות נפוצות לבחירה מהירה:' : 'Quick answer presets:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(isHe ? activeQuestion.presetsHe : activeQuestion.presetsEn).map((preset, idx) => {
                    const isSelected = answers[activeQuestion.field] === preset;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [activeQuestion.field]: preset })}
                        className={`text-right p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer flex items-start gap-2 ${
                          isSelected
                            ? 'bg-blue-600/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold ring-1 ring-cyan-500/30'
                            : isDark
                              ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={handlePrevQuestion}
                className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                {isHe ? '➔ חזור' : '➔ Back'}
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-98"
              >
                <span>{currentStep === 4 ? (isHe ? 'סיום ובדיקת הדוח ➔' : 'Review & Finish ➔') : (isHe ? 'לשאלה הבאה ➔' : 'Next Question ➔')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 5: REVIEW & DISPATCH TO EMAIL (NO RECURRING CHAT) */}
        {/* ==================================================== */}
        {currentStep === 5 && (
          <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                {isHe ? 'כל נתוני הארגון נאספו במלואם!' : 'All Organizational Data Collected!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {isHe
                  ? `הדוח המלא מוכן לעיבוד אלגוריתמי עמוק. בלחיצה על הכפתור יופק ה-AI Excellence Report וישוגר ישירות לתיבת המייל שלך (${leadForm.email}).`
                  : `Your full dossier is ready. Clicking below will synthesize your tailored AI Excellence Report and dispatch it to (${leadForm.email}).`}
              </p>
            </div>

            {/* Summary Review Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="font-bold text-cyan-500 block">1. {isHe ? 'פרופיל החברה' : 'Company Profile'}:</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{answers.companyStory || leadForm.companyName}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="font-bold text-blue-500 block">2. {isHe ? 'יעד ה-AI המרכזי' : 'Primary Goal'}:</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{answers.primaryGoal || (isHe ? 'חיסכון בשעות ואוטומציה' : 'Automation & Efficiency')}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="font-bold text-purple-500 block">3. {isHe ? 'מערכות ותשתיות' : 'Current Systems'}:</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{answers.mainSystems || 'Priority ERP / M365'}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="font-bold text-amber-500 block">4. {isHe ? 'צוואר בקבוק עיקרי' : 'Bottlenecks'}:</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{answers.biggestBottleneck || (isHe ? 'עומס משימות ידניות' : 'Manual task overload')}</p>
              </div>
            </div>

            {/* Dispatch CTA */}
            <div className="max-w-2xl mx-auto pt-2 space-y-3">
              <button
                type="button"
                disabled={isSubmitting || isGenerating}
                onClick={handleSubmitFullAssessment}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting || isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{isHe ? 'מנוע ה-AI מעבד את הנתונים ומפיק דוח...' : 'Synthesizing AI Report & Dispatching...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-cyan-200" />
                    <span>{isHe ? 'שלח לעיבוד ➔ הפק AI Excellence Report ושלח למייל שלי' : 'Send to Process ➔ Generate Report & Dispatch to Email'}</span>
                    {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="hover:underline cursor-pointer"
                >
                  {isHe ? '➔ חזור לעריכת שאלות' : '➔ Back to Edit'}
                </button>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isHe ? 'Zero Data Retention | נתונים מאובטחים' : 'Zero Data Retention | Secure'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
