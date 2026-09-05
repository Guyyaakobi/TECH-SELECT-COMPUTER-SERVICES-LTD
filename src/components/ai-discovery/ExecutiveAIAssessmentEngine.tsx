import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, ArrowRight, ArrowLeft, Bot, Sparkles, 
  Send, RefreshCw, Copy, Check, Building2, User, Mail,
  Phone, HelpCircle, Lightbulb, MessageSquare, FileText,
  CheckCircle2, Users, Lock, KeyRound, AlertCircle, ShieldAlert,
  ChevronRight, ExternalLink, LogOut, RotateCcw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AIExcellenceReport, AIDiscoveryFormData, AIConsultationMessage } from '../../types';
import { AIExcellenceReportView } from './AIExcellenceReportView';
import { generateExcellenceReport, normalizeAIReport, AI_DISCOVERY_PRESETS } from '../../data/aiDiscoveryPresets';
import { COMPANY_INFO } from '../../data/content';
import { sendLeadNotificationViaFormSubmit, sendReportEmailViaFormSubmit } from '../../utils/formSubmit';

interface ExecutiveAIAssessmentEngineProps {
  onNavigateToContact?: () => void;
  defaultMode?: 'guided' | 'chat';
}

export const ExecutiveAIAssessmentEngine: React.FC<ExecutiveAIAssessmentEngineProps> = ({
  onNavigateToContact,
  defaultMode = 'guided'
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  // Authentication & Security Gate State (Locked by default; requires verified OTP or active session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      // Purge old persistent localStorage so simulator is strictly locked upon visits
      localStorage.removeItem('tech_select_ai_session');

      // Check if verified via concierge bubble or active session in sessionStorage
      if (sessionStorage.getItem('tech_select_ceo_sim_verified') === 'true') {
        return true;
      }

      // Check if there is an active session in sessionStorage created within 30 minutes
      const saved = sessionStorage.getItem('tech_select_ai_session_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const [sessionToken, setSessionToken] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('tech_select_ai_session_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return parsed.token;
        }
      }
      return '';
    } catch {
      return '';
    }
  });

  // Access Gate inputs - Prepopulate from existing leads or user profile if stored
  const [gateFullName, setGateFullName] = useState(() => {
    try {
      const saved = localStorage.getItem('techselect_executive_lead_v3') || localStorage.getItem('techselect_simulator_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.fullName || parsed.name || '';
      }
    } catch {}
    return '';
  });
  const [gateCompanyName, setGateCompanyName] = useState(() => {
    try {
      const saved = localStorage.getItem('techselect_executive_lead_v3') || localStorage.getItem('techselect_simulator_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.companyName || parsed.company || '';
      }
    } catch {}
    return '';
  });
  const [gateEmail, setGateEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('techselect_executive_lead_v3') || localStorage.getItem('techselect_simulator_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.email || '';
      }
    } catch {}
    return '';
  });
  const [gatePhone, setGatePhone] = useState(() => {
    try {
      const saved = localStorage.getItem('techselect_executive_lead_v3') || localStorage.getItem('techselect_simulator_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.phone || '';
      }
    } catch {}
    return '';
  });
  const [gateCompanySize, setGateCompanySize] = useState('21-100');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [botTrap, setBotTrap] = useState(''); // Anti-bot honeypot

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Gate UI states
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateSuccessMsg, setGateSuccessMsg] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  // Main Simulator mode & view state
  const [mode, setMode] = useState<'guided' | 'chat'>(defaultMode);
  const [viewState, setViewState] = useState<'input' | 'generating' | 'report'>('input');

  // Lead / Company info in simulator
  const [companyName, setCompanyName] = useState<string>('הארגון שלכם');
  const [companySize, setCompanySize] = useState<string>('21-100');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Form input text
  const [inputText, setInputText] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<AIConsultationMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: isHe
        ? `שלום! אני **ארכיטקט ה-AI הראשי של TECH-SELECT** המחובר למודל הדגל המתקדם של Google Gemini.

במה נוכל לסייע היום? ספר לי על מערכות המידע בארגון, תהליכים עתירי זמן שתרצו לאטמט, או יעדים עסקיים. 

בכל שלב ניתן ללחוץ על **"הפק דוח מנהלים וארכיטקטורת AI"** לקבלת ניתוח מפורט.`
        : `Hello! I am TECH-SELECT's **Chief Enterprise AI Architect** powered by Google Gemini Flagship reasoning.

Tell me about your IT infrastructure, high-friction manual workflows, or strategic AI goals. Click **"Generate Report"** whenever you are ready.`,
      timestamp: new Date().toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Report state
  const [generatedReport, setGeneratedReport] = useState<AIExcellenceReport | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (mode === 'chat' && viewState === 'input') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, mode, viewState]);

  // Handle Request Access Code
  const handleRequestAccessCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGateError(null);
    setGateSuccessMsg(null);

    if (!gateEmail.trim() && !gatePhone.trim()) {
      setGateError(isHe ? 'נא להזין כתובת מייל או מספר טלפון לקבלת קוד הגישה' : 'Please enter email or phone to receive access code');
      return;
    }

    setIsRequestingCode(true);

    try {
      const res = await fetch('/api/ai-discovery/request-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: gateFullName.trim() || 'מנהל בארגון',
          companyName: gateCompanyName.trim() || 'חברה בבדיקה',
          email: gateEmail.trim(),
          phone: gatePhone.trim(),
          companySize: gateCompanySize,
          botTrap
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        if (data.challengeToken) {
          setChallengeToken(data.challengeToken);
          try {
            sessionStorage.setItem('tech_select_ai_challenge', data.challengeToken);
          } catch {}
        }
        setCodeRequested(true);

        const targetDestination = gateEmail.trim() || gatePhone.trim();
        setAccessCodeInput('');
        setOtpDigits(['', '', '', '']);
        setGateSuccessMsg(
          isHe
            ? `קוד אימות בן 4 ספרות נשלח כעת בהצלחה אל ${targetDestination}. אנא בדוק את תיבת הדואר הנכנס (כולל ספאם/קידומי מכירות) והקלד את 4 הספרות בתיבות למטה:`
            : `A 4-digit verification code was sent to ${targetDestination}. Please check your inbox (including spam) and enter the 4 digits below:`
        );
        setTimeout(() => {
          otpInputRefs[0]?.current?.focus();
        }, 150);

        // Direct browser dispatch to guarantee Guy receives the lead immediately
        sendLeadNotificationViaFormSubmit({
          name: gateFullName.trim() || 'מנהל בארגון',
          company: gateCompanyName.trim() || 'חברה בבדיקה',
          email: gateEmail.trim(),
          phone: gatePhone.trim(),
          subject: `🚨 [ליד חדש בסימולטור AI] ${gateCompanyName.trim() || 'חברה'} - ${gateFullName.trim() || 'מנהל'} (${gatePhone.trim() || 'ללא טלפון'})`,
          message: `ליד חדש הזין פרטים וביקש קוד גישה לסימולטור ה-AI Excellence של Tech-Select.\nגודל ארגון: ${gateCompanySize}`,
          extraData: {
            גודל_ארגון: gateCompanySize,
            סטטוס_אימות: 'קוד נשלח למייל - ממתין להזנת המשתמש'
          }
        }).catch(() => {});

        return;
      } else {
        setGateError(data.error || (isHe ? 'שגיאה בהפקת קוד אימות' : 'Failed to request access code'));
      }
    } catch {
      setGateError(isHe ? 'שגיאת תקשורת עם השרת. אנא נסה שוב מאוחר יותר.' : 'Network error. Please try again.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  // Handle single digit changes with auto-focus & auto-submit
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    const combined = newDigits.join('');
    setAccessCodeInput(combined);

    if (cleanVal && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }

    if (cleanVal && index === 3) {
      if (combined.length === 4) {
        handleVerifyAccessCode(combined);
      }
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs[index - 1].current?.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        setAccessCodeInput(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasted) return;
    const digits = pasted.slice(0, 4).split('');
    const newDigits = ['', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 4) newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    const combined = newDigits.join('');
    setAccessCodeInput(combined);
    if (digits.length >= 4) {
      handleVerifyAccessCode(combined);
    } else if (digits.length > 0 && digits.length < 4) {
      otpInputRefs[digits.length]?.current?.focus();
    }
  };

  // Handle Verify Access Code
  const handleVerifyAccessCode = async (overrideCode?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifyingCode) return;
    setGateError(null);

    const rawCode = overrideCode || accessCodeInput || otpDigits.join('');
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
      setGateError(isHe ? 'נא להזין את 4 ספרות קוד האימות' : 'Please enter the 4-digit access code');
      return;
    }

    const effectiveToken = challengeToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('tech_select_ai_challenge') : '') || '';

    setIsVerifyingCode(true);

    try {
      const res = await fetch('/api/ai-discovery/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          challengeToken: effectiveToken || undefined,
          email: gateEmail.trim(),
          phone: gatePhone.trim(),
          companyName: gateCompanyName.trim(),
          fullName: gateFullName.trim(),
          companySize: gateCompanySize,
          botTrap
        })
      });

      const data = await res.json().catch(() => ({}));

      const finalToken = data.sessionToken || data.token;
      if (res.ok && data.success && finalToken) {
        setSessionToken(finalToken);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('tech_select_ceo_sim_verified', 'true');
          const sessionPayload = {
            token: finalToken,
            timestamp: Date.now(),
            companyName: data.lead?.companyName || gateCompanyName.trim(),
            fullName: data.lead?.fullName || gateFullName.trim(),
            email: data.lead?.email || gateEmail.trim(),
            phone: data.lead?.phone || gatePhone.trim(),
            companySize: data.lead?.companySize || gateCompanySize
          };
          sessionStorage.setItem('tech_select_ai_session_data', JSON.stringify(sessionPayload));
        } catch {}

        if (data.lead?.companyName) setCompanyName(data.lead.companyName);
        if (data.lead?.fullName) setFullName(data.lead.fullName);
        if (data.lead?.email) setEmail(data.lead.email);
        if (data.lead?.phone) setPhone(data.lead.phone);
        if (data.lead?.companySize) setCompanySize(data.lead.companySize);
        return;
      } else {
        setGateError(data.error || (isHe ? 'קוד אימות שגוי או שפג תוקפו. אנא בדוק את תיבת המייל ונסה שוב.' : 'Invalid or expired access code. Please check your email and try again.'));
      }
    } catch {
      setGateError(isHe ? 'שגיאת תקשורת באימות הקוד. אנא נסה שוב.' : 'Communication error verifying access code. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Handle Logout / Reset Simulator (Locks the simulator and wipes session state)
  const handleLogoutOrReset = () => {
    try {
      localStorage.removeItem('tech_select_ai_session');
      localStorage.removeItem('tech_select_ai_verified_user');
      localStorage.removeItem('techselect_simulator_lead');
      localStorage.removeItem('techselect_executive_lead_v3');
      sessionStorage.removeItem('tech_select_ai_session');
      sessionStorage.removeItem('tech_select_ai_session_data');
      sessionStorage.removeItem('tech_select_ai_challenge');
      sessionStorage.removeItem('tech_select_ceo_sim_verified');
      sessionStorage.removeItem('tech_select_ai_verified_user');
    } catch {}

    setIsAuthenticated(false);
    setSessionToken('');
    setCodeRequested(false);
    setGateError(null);
    setGateSuccessMsg(null);
    setAccessCodeInput('');
    setOtpDigits(['', '', '', '']);
    setChallengeToken(null);
    setViewState('input');
    setGeneratedReport(null);
    setInputText('');
    setSelectedPresetId(null);
    setChatInput('');
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: isHe
          ? `שלום! אני **ארכיטקט ה-AI הראשי של TECH-SELECT** המחובר למודל הדגל המתקדם של Google Gemini.

במה נוכל לסייע היום? ספר לי על מערכות המידע בארגון, תהליכים עתירי זמן שתרצו לאטמט, או יעדים עסקיים. 

בכל שלב ניתן ללחוץ על **"הפק דוח מנהלים וארכיטקטורת AI"** לקבלת ניתוח מפורט.`
          : `Hello! I am TECH-SELECT's **Chief Enterprise AI Architect** powered by Google Gemini Flagship reasoning.

Tell me about your IT infrastructure, high-friction manual workflows, or strategic AI goals. Click **"Generate Report"** whenever you are ready.`,
        timestamp: new Date().toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Preset auto-fill
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = AI_DISCOVERY_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const pData = preset.data;
    setCompanyName(preset.nameHe.split(' ')[0] || 'הארגון לדוגמה');
    setCompanySize(pData.companySize || '21-100');

    const filledText = isHe
      ? `1. אנו ארגון בתחום ${pData.industry} עם ${pData.companySize} עובדים. הפעילות המרכזית כוללת: ${pData.mainProcesses.join(', ')}.
2. היעד העיקרי בשילוב AI: ${pData.dreamGoalTomorrow || 'חיסכון בשעות עבודה, שיפור שירות לקוחות ואוטומציה עסקית'}.
3. מערכות מידע ותשתיות פעילות: ${pData.erpCrmDetails || 'Priority ERP, M365, SharePoint'}.
4. צוואר הבקבוק המרכזי: ${pData.customPainPoints || pData.timeWastingActivities.join(', ')}.`
      : `1. Organization in ${pData.industry} with ${pData.companySize} employees. Core activities: ${pData.mainProcesses.join(', ')}.
2. Primary AI objective: ${pData.dreamGoalTomorrow || 'Labor hours reduction and workflow automation'}.
3. Active IT systems: ${pData.erpCrmDetails || 'Priority ERP, M365, SharePoint'}.
4. Main bottleneck: ${pData.customPainPoints || pData.timeWastingActivities.join(', ')}.`;

    setInputText(filledText);
  };

  // Chat message send handler
  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || isTyping) return;

    const userMsg: AIConsultationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai-discovery/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionToken ? `Bearer ${sessionToken}` : '',
          'X-Session-Token': sessionToken || '',
        },
        body: JSON.stringify({
          messages: updated.map(m => ({ 
            role: m.role === 'user' ? 'user' : 'model', 
            content: m.content,
            text: m.content 
          })),
          companyContext: {
            companyName,
            companySize,
            language: isHe ? 'he' : 'en'
          },
          sessionToken
        })
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data?.reply || data?.response || data?.text;
        if (replyText) {
          const aiMsg: AIConsultationMessage = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: replyText,
            timestamp: new Date().toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          };
          setMessages([...updated, aiMsg]);
          setIsTyping(false);
          return;
        }
      }
      throw new Error('API reply unavailable');
    } catch {
      setTimeout(() => {
        const fallbackReply = isHe
          ? `קיבלתי את הדברים עבור **${companyName}**. בהתבסס על ניסיון מעשי בעשרות ארגונים, ניתן להשיג חיסכון מוערך של כ-20% בשעות עבודה שבועיות באמצעות הטמעת שער AI מאובטח (Private AI Gateway) ומנוע RAG מחובר למערכות המידע שלכם.

תוכל ללחוץ בכל שלב על **"הפק דוח מנהלים וארכיטקטורת AI"** להפקת מפת דרכים מלאה ומפורטת.`
          : `Noted for **${companyName}**. Based on practical enterprise deployments, you can achieve ~20% labor time reduction with a Private AI Gateway and connected RAG knowledge engine.

Click **"Generate Executive Report"** to produce the full blueprint.`;

        const aiMsg: AIConsultationMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...updated, aiMsg]);
        setIsTyping(false);
      }, 500);
    }
  };

  // Generate Executive Report
  const handleGenerateReport = async () => {
    setViewState('generating');
    setGenerationProgress(20);

    const timer = setInterval(() => {
      setGenerationProgress((prev) => (prev < 90 ? prev + 25 : prev));
    }, 400);

    const finalCompany = companyName.trim() || (isHe ? 'הארגון שלכם' : 'Your Enterprise');
    const finalContact = fullName.trim() || gateFullName.trim() || (isHe ? 'הנהלת הארגון' : 'Executive Leadership');
    const finalEmail = email.trim() || gateEmail.trim() || 'contact@organization.co.il';
    const finalPhone = phone.trim() || gatePhone.trim() || '050-0000000';
    const finalRole = isHe ? 'הנהלה בכירה' : 'Executive Management';

    const userTextSummary = mode === 'chat'
      ? messages.filter(m => m.role === 'user').map(m => m.content).join('\n')
      : (inputText.trim() || 'מעוניינים באפיון שילוב כלי AI, חיבור למערכות ERP/CRM ואוטומציית מסמכים מאובטחת.');

    const formData: AIDiscoveryFormData = {
      fullName: finalContact,
      companyName: finalCompany,
      email: finalEmail,
      phone: finalPhone,
      role: 'executive',
      department: isHe ? 'הנהלה וחדשנות' : 'Management',
      companySize: (companySize as any) || '21-100',
      aiFamiliarity: 4,
      currentAITools: ['Private AI Gateway'],
      industry: isHe ? 'שירותים עסקיים, פיננסים ותעשייה' : 'Business Services & Industry',
      mainProcesses: [
        isHe ? 'אוטומציית מסמכים ומידע' : 'Documents & Knowledge Automation',
        isHe ? 'חיבור למערכות ליבה' : 'Core Systems Integration'
      ],
      docStorage: ['SharePoint/OneDrive', 'Local Server'],
      hasM365: true,
      hasERP_CRM: true,
      erpCrmDetails: 'Priority ERP / M365 / Salesforce',
      sensitiveDataNature: ['Financial', 'Customer Data'],
      regulatoryRestrictions: 'ISO 27001, חוק הגנת הפרטיות',
      timeWastingActivities: [
        'Document search & filing',
        'Manual data entry'
      ],
      customPainPoints: userTextSummary,
      estimatedDailyWastedHoursPerEmployee: 1.8,
      errorProneProcesses: isHe ? 'הקלדת נתונים מ-PDF והפקת מסמכים' : 'Manual PDF data entry and documentation',
      dreamGoalTomorrow: isHe ? 'פורטל AI מאובטח לייעול העבודה הארגונית.' : 'Secure enterprise AI portal.',
      tasksToStopDoing: ['הקלדת נתונים כפולה'],
      decisionMetricsNeeded: ['חיסכון שעות', 'ROI שנתי'],
      allowCloudExport: 'with_dpa_sso',
      complianceNeeds: ['ISO 27001', 'Zero Data Retention'],
      budgetHorizon: 'quarterly_roadmap'
    };

    const baseReport = generateExcellenceReport(formData);

    // Try Gemini API with verified session
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const res = await fetch('/api/ai-discovery/generate-tailored-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionToken ? `Bearer ${sessionToken}` : '',
          'X-Session-Token': sessionToken || '',
        },
        signal: controller.signal,
        body: JSON.stringify({
          formData,
          chatHistory: mode === 'chat' ? messages : [{ role: 'user', content: userTextSummary }],
          sessionToken
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.report) {
          const finalReport = normalizeAIReport(data.report, baseReport);
          clearInterval(timer);
          setGeneratedReport(finalReport);
          setViewState('report');

          // Send prestigious branded report to Guy (and CC client if provided)
          sendReportEmailViaFormSubmit({
            report: finalReport,
            companyName: finalCompany,
            contactPerson: finalContact,
            role: finalRole,
            phone: finalPhone,
            email: finalEmail,
            companySize
          }).catch(() => {});

          // Also trigger server-side dispatch
          fetch('/api/ai-discovery/send-email-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': sessionToken ? `Bearer ${sessionToken}` : '',
              'X-Session-Token': sessionToken || '',
            },
            body: JSON.stringify({
              report: finalReport,
              sessionToken,
              lead: {
                companyName: finalCompany,
                fullName: finalContact,
                role: finalRole,
                phone: finalPhone,
                email: finalEmail,
                companySize
              }
            })
          }).catch(() => {});

          return;
        }
      }
    } catch {}

    // Fallback to high-quality baseReport
    clearInterval(timer);
    setGeneratedReport(baseReport);
    setViewState('report');

    // Send prestigious branded report to Guy (and CC client if provided) for fallback report
    sendReportEmailViaFormSubmit({
      report: baseReport,
      companyName: finalCompany,
      contactPerson: finalContact,
      role: finalRole,
      phone: finalPhone,
      email: finalEmail,
      companySize
    }).catch(() => {});

    fetch('/api/ai-discovery/send-email-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': sessionToken ? `Bearer ${sessionToken}` : '',
        'X-Session-Token': sessionToken || '',
      },
      body: JSON.stringify({
        report: baseReport,
        sessionToken,
        lead: {
          companyName: finalCompany,
          fullName: finalContact,
          role: finalRole,
          phone: finalPhone,
          email: finalEmail,
          companySize
        }
      })
    }).catch(() => {});
  };

  // WhatsApp quick request URL
  const getWhatsAppRequestUrl = () => {
    const text = encodeURIComponent(
      `היי גיא, הגעתי לסימולטור ה-AI של TECH-SELECT עבור חברת "${gateCompanyName || 'הארגון שלי'}" (${gateFullName || 'מנהל'}). אשמח לקבל קוד גישה מנהלים לאפיון ארכיטקטורת AI.`
    );
    return `https://wa.me/972503900903?text=${text}`;
  };

  // =========================================================================
  // VIEW 1: SECURITY & ACCESS LOCK SCREEN (TOKEN PROTECTION GATE)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-2xl mx-auto my-6 px-4" dir={isHe ? 'rtl' : 'ltr'}>
        <div className={`rounded-3xl border p-6 sm:p-9 shadow-2xl transition-all relative overflow-hidden ${
          isDark ? 'bg-[#090e1a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          
          {/* Top Security Banner */}
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 text-cyan-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white">
                  {isHe ? 'שער כניסה מאובטח לאפיון AI' : 'Enterprise AI Architecture Access Gate'}
                </h3>
                <span className="text-[11px] text-cyan-500 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Gemini Flagship Model • Token Protection Active</span>
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Gate Active</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
            {isHe 
              ? 'בשל הגבלות אבטחת מידע ומניעת ניצול טוקנים על ידי בוטים, השימוש במנוע ה-AI וסימולטור המנהלים מוגן באמצעות אימות פרטי הארגון וקוד גישה ייעודי.'
              : 'To protect compute resources and prevent bot abuse, enterprise AI access requires organization verification and a one-time access passcode.'}
          </p>

          {/* Hidden Honeypot for Bots */}
          <input
            type="text"
            value={botTrap}
            onChange={(e) => setBotTrap(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isHe ? 'שם מלא *' : 'Full Name *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input
                    type="text"
                    value={gateFullName}
                    onChange={(e) => setGateFullName(e.target.value)}
                    placeholder={isHe ? 'ישראל ישראלי' : 'Jane Doe'}
                    className={`w-full py-2.5 pr-9 pl-3 text-xs sm:text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-[#060a14] border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isHe ? 'שם הארגון / החברה *' : 'Company Name *'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input
                    type="text"
                    value={gateCompanyName}
                    onChange={(e) => setGateCompanyName(e.target.value)}
                    placeholder={isHe ? 'חברת טכנולוגיות בע"מ' : 'Enterprise Ltd.'}
                    className={`w-full py-2.5 pr-9 pl-3 text-xs sm:text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-[#060a14] border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isHe ? 'גודל ארגון' : 'Company Size'}
                </label>
                <select
                  value={gateCompanySize}
                  onChange={(e) => setGateCompanySize(e.target.value)}
                  className={`w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border outline-none cursor-pointer ${
                    isDark ? 'bg-[#060a14] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="1-20" className="bg-slate-900 text-white">1-20 עובדים</option>
                  <option value="21-100" className="bg-slate-900 text-white">21-100 עובדים</option>
                  <option value="101-500" className="bg-slate-900 text-white">101-500 עובדים</option>
                  <option value="500+" className="bg-slate-900 text-white">500+ עובדים</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isHe ? 'דוא"ל עסקי *' : 'Business Email *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input
                    type="email"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    placeholder="ceo@company.co.il"
                    className={`w-full py-2.5 pr-9 pl-3 text-xs sm:text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-[#060a14] border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isHe ? 'טלפון נייד *' : 'Phone *'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input
                    type="tel"
                    value={gatePhone}
                    onChange={(e) => setGatePhone(e.target.value)}
                    placeholder="050-1234567"
                    className={`w-full py-2.5 pr-9 pl-3 text-xs sm:text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-[#060a14] border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Notification messages */}
            {gateError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gateError}</span>
              </div>
            )}

            {gateSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{gateSuccessMsg}</span>
              </div>
            )}

            {/* Actions: Request Code or Direct Verify */}
            <div className="pt-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleRequestAccessCode}
                  disabled={isRequestingCode}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isRequestingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isHe ? 'מפיק קוד מאובטח...' : 'Generating Code...'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{isHe ? 'הפק קוד סודי (4 ספרות) / קוד גישה' : 'Request 4-Digit Passcode (OTP)'}</span>
                    </>
                  )}
                </button>

                <a
                  href={getWhatsAppRequestUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isHe ? 'בקש אישור ב-WhatsApp' : 'Instant WhatsApp VIP'}</span>
                </a>
              </div>

              {/* Passcode Input Section */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#060a14] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <label className="text-xs sm:text-sm font-bold text-slate-200">
                    {isHe ? 'אימות קוד 4 ספרות (OTP):' : 'Enter 4-Digit Verification Code:'}
                  </label>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] sm:text-xs text-slate-400 text-center">
                    {isHe
                      ? 'הזן את 4 ספרות קוד האימות שנשלח לתיבת המייל שלך לפתיחת הסימולטור:'
                      : 'Enter the 4-digit verification code sent to your email to unlock the simulator:'}
                  </p>

                  <div className="flex flex-col items-center justify-center gap-2" dir="ltr">
                    <input
                      ref={otpInputRefs[0]}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={4}
                      value={accessCodeInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setAccessCodeInput(val);
                        setGateError(null);
                        if (val.length === 4) {
                          handleVerifyAccessCode(val);
                        }
                      }}
                      placeholder="••••"
                      className={`w-44 sm:w-52 py-3 text-center text-3xl sm:text-4xl font-mono font-black tracking-[0.45em] rounded-2xl border-2 transition-all outline-none ${
                        accessCodeInput
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/30'
                          : isDark
                          ? 'bg-[#090e1a] border-slate-700 text-white focus:border-cyan-500 focus:bg-cyan-500/5'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-blue-50'
                      }`}
                    />
                    <span className="text-[11px] text-cyan-400/80 font-mono">
                      {accessCodeInput.length > 0 ? `${accessCodeInput.length}/4 ספרות` : '4 ספרות נדרשות'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyAccessCode(accessCodeInput)}
                    disabled={isVerifyingCode || accessCodeInput.length < 4}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all"
                  >
                    {isVerifyingCode ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isHe ? 'אימות 4 ספרות וכניסה לסימולטור המנהלים' : 'Verify 4 Digits & Open Executive Simulator'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: GENERATING REPORT (SPINNER & PROGRESS)
  // =========================================================================
  if (viewState === 'generating') {
    return (
      <div className="w-full max-w-2xl mx-auto my-12" dir={isHe ? 'rtl' : 'ltr'}>
        <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-6 shadow-2xl transition-all ${
          isDark ? 'bg-[#090e1a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black font-heading">
              {isHe ? `מפיק דוח מנהלים וארכיטקטורת AI עבור ${companyName}...` : 'Generating Executive AI Architecture Report...'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
              {isHe 
                ? 'מעבד נתונים באמצעות מודל הדגל של Google Gemini: מחשב מדדי ROI כמותיים, סוכני אוטומציה מומלצים, מפת דרכים רבעונית וארכיטקטורת 4 שכבות מאובטחת.'
                : 'Processing via Google Gemini Flagship reasoning: Calculating ROI metrics, recommended AI agents, implementation roadmap, and 4-tier security architecture.'}
            </p>
          </div>

          <div className="w-full bg-slate-800/40 rounded-full h-2 overflow-hidden max-w-md mx-auto border border-slate-700/50">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Data Retention • Enterprise ISO 27001 • AES-256</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: REPORT VIEW
  // =========================================================================
  if (viewState === 'report' && generatedReport) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4" dir={isHe ? 'rtl' : 'ltr'}>
        <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border ${
          isDark ? 'bg-[#090e1a] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewState('input')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-md"
            >
              {isHe ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isHe ? 'חזרה לשאלות האפיון' : 'Back to Assessment'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutOrReset}
              title={isHe ? 'התנתקות מוחלטת ונעילת הסימולטור' : 'Logout & Lock Simulator'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-300'
                  : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHe ? 'התנתק מהסימולטור' : 'Logout of Simulator'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold">{isHe ? 'דוח מנהלים מוכן' : 'Executive Report Ready'}</span>
          </div>
        </div>

        <AIExcellenceReportView
          report={generatedReport}
          onRetake={() => setViewState('input')}
          onOpenEmployeeSurvey={() => {}}
          onBookConsultation={onNavigateToContact || (() => {})}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: MAIN INPUT SCREEN (EXACT SCREENSHOT LAYOUT - VERIFIED ACTIVE)
  // =========================================================================
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" dir={isHe ? 'rtl' : 'ltr'}>

      {/* ================= TOP ROW: Company Card + Security Badge + Mode Switch ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Company Card with quick editable pop */}
        <div className={`flex items-center gap-3 p-2 px-3.5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#090e1a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={isHe ? 'שם הארגון' : 'Company Name'}
              className="text-sm font-black font-heading bg-transparent border-b border-dashed border-slate-500/50 outline-none w-28 sm:w-36 text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-400">|</span>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="text-xs font-medium bg-transparent outline-none text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <option value="1-20" className="bg-slate-900 text-white">1-20 עובדים</option>
              <option value="21-100" className="bg-slate-900 text-white">21-100 עובדים</option>
              <option value="101-500" className="bg-slate-900 text-white">101-500 עובדים</option>
              <option value="500+" className="bg-slate-900 text-white">500+ עובדים</option>
            </select>
          </div>
        </div>

        {/* Security Badge + Switch Mode + Logout Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{isHe ? 'שער אבטחה מאומת' : 'Security Gate Verified'}</span>
          </div>

          <button
            type="button"
            onClick={() => setMode(mode === 'guided' ? 'chat' : 'guided')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900/80 border-slate-700 hover:border-cyan-500 text-slate-200' 
                : 'bg-white border-slate-300 hover:border-blue-600 text-slate-700 shadow-sm'
            }`}
          >
            {mode === 'guided' ? (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isHe ? 'עבור למצב צ\'אט' : 'Switch to Chat'}</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isHe ? 'עבור לשאלות מנחות' : 'Switch to Questions'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogoutOrReset}
            title={isHe ? 'התנתקות ונעילת הסימולטור מחדש (התחלה מחדש)' : 'Disconnect and lock simulator (Start Fresh)'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDark 
                ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-300 hover:border-rose-400' 
                : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700 hover:border-rose-300 shadow-sm'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isHe ? 'התנתק / התחל מחדש' : 'Logout / Reset'}</span>
          </button>
        </div>
      </div>

      {/* ================= CHAT MODE ================= */}
      {mode === 'chat' && (
        <div className={`rounded-2xl border overflow-hidden flex flex-col h-[550px] max-h-[70vh] transition-all shadow-xl ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">{isHe ? 'ארכיטקט AI ראשי (Gemini Expert)' : 'Chief AI Architect (Gemini Expert)'}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online • Private Mode • Verified Session</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHe ? 'הפק דוח מנהלים' : 'Generate Report'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-2xl ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isAi ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white' : 'bg-slate-700 text-white'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : 'ME'}
                  </div>
                  <div className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isAi
                      ? isDark ? 'bg-[#0f172a] border border-slate-800 text-slate-200' : 'bg-slate-100 text-slate-900'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-[10px] text-slate-400 mt-1.5">{msg.timestamp}</div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 mr-auto p-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>{isHe ? 'מנתח ארכיטקטורה עסקית ב-Gemini...' : 'Analyzing architecture in Gemini...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-3 border-t flex gap-2 ${
            isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder={isHe ? 'כתוב שאלה, צורך עסקי או אתגר ארגוני...' : 'Type your question...'}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                isDark ? 'bg-[#070b14] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={handleSendChatMessage}
              disabled={!chatInput.trim() || isTyping}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {isHe ? 'שלח' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* ================= GUIDED FORM MODE (SCREENSHOT) ================= */}
      {mode === 'guided' && (
        <div className="space-y-6">
          {/* Main Question Title with Help Circle */}
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-cyan-500 shrink-0" />
            <h2 className="text-lg sm:text-xl font-black font-heading text-slate-900 dark:text-white">
              {isHe ? 'שאלות מנחות לאפיון צרכי ה-AI של הארגון:' : 'Guiding Questions for Enterprise AI Assessment:'}
            </h2>
          </div>

          {/* 4 Guiding Questions Box */}
          <div className={`rounded-2xl border p-5 sm:p-6 space-y-3.5 shadow-sm transition-all ${
            isDark 
              ? 'bg-[#090e1a]/90 border-slate-800/90 text-slate-200' 
              : 'bg-slate-50/90 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-cyan-500 shrink-0">1.</span>
              <p>
                {isHe 
                  ? 'ספרו לנו בקצרה על הארגון והפעילות: מה תחום הפעילות, מה מייצר או מספק הארגון ומה גודל הצוות?'
                  : 'Briefly describe your company & operations: Industry domain, products/services delivered, and team size.'}
              </p>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-cyan-500 shrink-0">2.</span>
              <p>
                {isHe 
                  ? 'לאן תרצו להגיע? מה היעד העיקרי בשילוב AI? (חיסכון בשעות עבודה, שיפור שירות לקוחות, קיצור זמני תגובה או אוטומציה עסקית)'
                  : 'What is your primary AI objective? (Labor hours savings, customer service acceleration, SLA improvement, or business automation)'}
              </p>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-cyan-500 shrink-0">3.</span>
              <p>
                {isHe 
                  ? 'באילו מערכות מידע ותשתיות אתם משתמשים כיום? (מערכות ERP כגון Priority/SAP, מערכות CRM, שרתי קבצים, SharePoint, M365, שרתים מקומיים)'
                  : 'What IT systems and infrastructure are active today? (ERP such as Priority/SAP, CRM, File servers, SharePoint, M365, On-Prem servers)'}
              </p>
            </div>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-cyan-500 shrink-0">4.</span>
              <p>
                {isHe 
                  ? 'מהו צוואר הבקבוק המרכזי שתרצו לפתור כבר מחר בבוקר? (חיפוש מסמכים ידני, הקלדת נתונים כפולה, מענה על שאלות חוזרות, מיון חשבוניות)'
                  : 'What is the top operational bottleneck you want solved first? (Manual document search, double data entry, repetitive inquiry handling, invoice parsing)'}
              </p>
            </div>
          </div>

          {/* Quick Scenario Fill Buttons */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>{isHe ? 'או בחר תרחיש ארגוני לדוגמה למילוי מהיר:' : 'Or select an enterprise scenario for instant quick-fill:'}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {AI_DISCOVERY_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 shadow-sm ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : isDark
                          ? 'bg-[#090e1a] border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:text-slate-900'
                    }`}
                  >
                    {isHe ? preset.nameHe : preset.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single-Window Textarea */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200 mb-2">
              {isHe ? 'תשובות ופירוט צרכי הארגון (חלון יחיד) *' : 'Your Answers & Enterprise Needs (Single Window) *'}
            </label>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder={
                isHe
                  ? `כתוב כאן בחופשיות את התשובות לשאלות שלמעלה...
לדוגמה: אנו חברה בת 60 עובדים בתחום ההנדסה והשירות. אנו משתמשים ב-Priority ERP וב-SharePoint. צוואר הבקבוק העיקרי הוא חיפוש ידני של מפרטים טכניים והקלדת הזמנות רכש...`
                  : `Type your answers freely here...
Example: We are a 60-employee engineering and service firm using Priority ERP and SharePoint. Our main bottleneck is manual technical spec searches and purchase order data entry...`
              }
              className={`w-full rounded-2xl border p-4 text-xs sm:text-sm leading-relaxed outline-none transition-all shadow-inner resize-y ${
                isDark 
                  ? 'bg-[#060a14] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />
          </div>

          {/* Optional inline contact details */}
          <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
            isDark ? 'bg-[#090e1a]/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isHe ? 'שם איש קשר' : 'Contact Person'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isHe ? 'ישראל ישראלי' : 'Jane Doe'}
                className={`w-full py-2 px-3 text-xs rounded-xl border outline-none ${
                  isDark ? 'bg-[#060a14] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isHe ? 'מייל למשלוח הדוח' : 'Email for Report'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="executive@company.co.il"
                className={`w-full py-2 px-3 text-xs rounded-xl border outline-none ${
                  isDark ? 'bg-[#060a14] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isHe ? 'טלפון' : 'Phone'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                className={`w-full py-2 px-3 text-xs rounded-xl border outline-none ${
                  isDark ? 'bg-[#060a14] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerateReport}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isHe ? (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>הפק דוח מנהלים וארכיטקטורת AI</span>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Generate Executive AI Architecture Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isHe ? 'הפקה מיידית • Google Gemini Expert • DPA' : 'Instant Generation • Google Gemini Expert • DPA'}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
