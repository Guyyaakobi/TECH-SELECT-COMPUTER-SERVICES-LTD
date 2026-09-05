import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, Send, X, Bot, Copy, Check, 
  Ticket, CheckCircle2, AlertCircle,
  RefreshCw, ArrowRight, ArrowLeft,
  KeyRound, ShieldCheck, Lock, Unlock, Mail, User, LogOut, Loader2, Shield,
  Cpu, Zap, Play
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { detectIncognito } from '../utils/incognitoDetector';

interface FloatingAIConciergeProps {
  onNavigateToSimulator?: () => void;
  onNavigateToContact?: () => void;
}

export type ViewMode = 'chat' | 'open_ticket' | 'check_status';

export interface LiveTicket {
  id: number | string;
  title: string;
  status: string;
  statusHe: string;
  customerName: string;
  contactName?: string;
  contactEmail?: string;
  lastComment?: string;
  createdDate?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  displayedText?: string;
  time: string;
  isStreaming?: boolean;
  type?: 'text' | 'otp_required' | 'ticket_verified' | 'ticket_created' | 'error' | 'ceo_simulator_gate' | 'ceo_simulator_unlocked';
  maskedEmail?: string;
  pendingLookupValue?: string;
  ticket?: LiveTicket;
  createdTicketId?: string | number;
}

export const FloatingAIConcierge: React.FC<FloatingAIConciergeProps> = ({
  onNavigateToSimulator,
  onNavigateToContact,
}) => {
  const { lang, isHe } = useLanguage();
  const { isDark } = useTheme();

  // Assistant Open State
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open chat window after 3 seconds from opening the website
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Atera Customer vs. Guest Status
  const [customerInfo, setCustomerInfo] = useState<{
    checked: boolean;
    isCustomer: boolean;
    companyName?: string;
    contactName?: string;
    technician: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('tech_select_atera_status');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // CEO Simulator OTP Gate (Requires 4-digit OTP verification before launching)
  const [ceoSimGate, setCeoSimGate] = useState<{
    isOpen: boolean;
    otpSent: boolean;
    otpCode: string;
    verified: boolean;
    loading: boolean;
    error: string;
  }>(() => {
    try {
      const saved = sessionStorage.getItem('tech_select_ceo_sim_verified');
      if (saved === 'true') {
        return { isOpen: false, otpSent: false, otpCode: '', verified: true, loading: false, error: '' };
      }
    } catch {}
    return { isOpen: false, otpSent: false, otpCode: '', verified: false, loading: false, error: '' };
  });

  // 4-Digit OTP Gate State: Locked until verified!
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('tech_select_ai_verified_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && parsed?.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  const [verifiedUser, setVerifiedUser] = useState<{ email: string; fullName: string; sessionToken: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem('tech_select_ai_verified_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed;
      }
    } catch {}
    return null;
  });

  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'success'>('email');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus appropriate input when window opens or step changes
  useEffect(() => {
    if (isOpen && !isVerified) {
      setTimeout(() => {
        if (authStep === 'email') {
          emailInputRef.current?.focus();
        } else if (authStep === 'otp') {
          otpInputRef.current?.focus();
        }
      }, 250);
    }
  }, [isOpen, isVerified, authStep]);

  // Mobile/Tablet background scroll lock & ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // On mobile & tablet (< 1024px), lock background body scroll for seamless chatting
    const originalOverflow = document.body.style.overflow;
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Assigned Technician & Incognito State (Deterministic once on mount - Guy Yaakobi)
  const [assignedTech, setAssignedTech] = useState<{ he: string; en: string }>({
    he: 'גיא יעקובי',
    en: 'Guy Yaakobi',
  });
  const [isIncognito, setIsIncognito] = useState(false);

  useEffect(() => {
    detectIncognito().then((res) => {
      if (res.isIncognito) setIsIncognito(true);
    }).catch(() => {});
  }, []);

  // Dynamic Trigger Placeholder Animation State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const rotatingPlaceholders = useMemo(() => {
    if (isHe) {
      return [
        'LET THE AI WORK...',
        'LET THE AI WORK... תאר תקלה או שאל שאלה',
        'LET THE AI WORK... פתיחת קריאת שירות מהירה',
        'LET THE AI WORK... בדיקת סטטוס קריאה במערכת',
        'LET THE AI WORK... ייעוץ מחשוב ענן וסייבר',
      ];
    }
    return [
      'LET THE AI WORK...',
      'LET THE AI WORK... Describe an issue or ask',
      'LET THE AI WORK... Open a fast service ticket',
      'LET THE AI WORK... Check ticket live status',
      'LET THE AI WORK... Cloud & Cyber consultation',
    ];
  }, [isHe]);

  // Rotate placeholder text every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % rotatingPlaceholders.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [rotatingPlaceholders.length]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingTimerRef = useRef<any>(null);

  // Broadcast concierge toggle so CookieBanner & other overlays never overlap the prompt
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tech-select-concierge-toggle', { detail: { isOpen } }));
  }, [isOpen]);

  // Focus input when window opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, isOpen]);

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
    };
  }, []);

  // Helper to build appropriate greeting based on Atera status
  const buildWelcomeGreeting = (
    info: { checked: boolean; isCustomer: boolean; companyName?: string; contactName?: string; technician: string } | null,
    targetTech: { he: string; en: string },
    userName?: string
  ): string => {
    const techDisplayName = isHe ? (info?.technician || targetTech.he) : (info?.technician || targetTech.en);

    if (info?.checked) {
      if (!info.isCustomer) {
        // Guest user wording - strict adherence to user request:
        return isHe
          ? `היי, אני העוזר של ${techDisplayName}. אני רואה שאתה עדיין לא לקוח שלנו, אבל לא נורא, שאל מה שאתה צריך ואני אראה מה אני יכול לעשות.`
          : `Hi, I am the assistant of ${techDisplayName}. I see that you are not yet our client, but no worries! Feel free to ask whatever you need, and I'll see what I can do for you.`;
      } else {
        // Active Atera client wording - strict adherence to user request:
        const clientName = info.contactName || userName || (isHe ? 'לקוח יקר' : 'Valued Client');
        const company = info.companyName || (isHe ? 'טק-סלקט' : 'Tech-Select');
        return isHe
          ? `שלום ${clientName}! אני העוזר של ${techDisplayName} מחברת טק-סלקט. זיהיתי אותך כלקוח קיים במערכת השירות (${company}). אני כאן כדי להעניק לך שירות מצוין, לפתוח קריאה במידת הצורך או לענות על כל שאלה. במה אוכל לעזור לך היום?`
          : `Hello ${clientName}! I am the assistant of ${techDisplayName} from Tech-Select. I recognized you as an existing client in our service desk (${company}). I am here to provide you with excellent service, open a ticket if needed, or answer any question. How may I help you today?`;
      }
    }

    // Default standard greeting
    const techFirstName = techDisplayName.split(' ')[0] || techDisplayName;
    return isHe
      ? `שלום! אני העוזר הווירטואלי של **${techDisplayName}** מחברת **טק-סלקט**.\n\nאני מחובר ישירות למאגרי הידע של חברת **טק-סלקט** שנאספו לאורך שנים של פעילות הנדסית, ניהול רשתות ותשתיות, ענן וסייבר בארגונים מובילים.\n\nאני כאן כדי לסייע לך בפתרון בעיות, במענה מקצועי, בבדיקת סטטוס פנייה, או בפתיחת קריאת שירות שתועבר ישירות ל${techFirstName} לבדיקה מעמיקה ולהמשך טיפול אישי.\n\nאיך אוכל לעזור לך היום?`
      : `Hello! I am the AI assistant of **${techDisplayName}** at **Tech-Select**.\n\nI am connected directly to Tech-Select's enterprise knowledge base, accumulated over years of advanced IT management, cloud solutions, and cybersecurity support.\n\nI am here to assist with technical inquiries, ticket status checks, or opening a service ticket directly forwarded to ${techFirstName} for deep review.\n\nHow may I assist you today?`;
  };

  // Check customer status in Atera API
  const checkCustomerStatusInAtera = async (email: string, initialTechName?: string) => {
    try {
      const currentTech = initialTechName || (isHe ? assignedTech.he : assignedTech.en);
      const res = await fetch('/api/atera/check-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, technician: currentTech }),
      });
      const data = await res.json();
      if (data && data.success) {
        let finalTech = data.technician || (isHe ? 'גיא יעקובי' : 'Guy Yaakobi');
        if (!data.isCustomer) {
          const guy = { he: 'גיא יעקובי', en: 'Guy Yaakobi' };
          setAssignedTech(guy);
          finalTech = isHe ? guy.he : guy.en;
        }

        const info = {
          checked: true,
          isCustomer: Boolean(data.isCustomer),
          companyName: data.companyName,
          contactName: data.contactName,
          technician: finalTech,
        };
        setCustomerInfo(info);
        try {
          sessionStorage.setItem('tech_select_atera_status', JSON.stringify(info));
        } catch {}
        return info;
      }
    } catch (e) {
      console.warn('Atera check error:', e);
    }
    return null;
  };

  // Initial Gemini-style welcome message or updated Atera-based greeting
  useEffect(() => {
    const welcomeText = buildWelcomeGreeting(customerInfo, assignedTech, verifiedUser?.fullName);

    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: 'welcome',
            sender: 'ai',
            text: welcomeText,
            displayedText: welcomeText,
            time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            isStreaming: false,
          },
        ];
      }
      // If only welcome message exists, update its text to reflect Atera status and assignedTech
      if (prev.length === 1 && (prev[0].id === 'welcome' || prev[0].id === 'welcome-verified')) {
        return [
          {
            ...prev[0],
            text: welcomeText,
            displayedText: welcomeText,
          },
        ];
      }
      return prev;
    });
  }, [isHe, assignedTech, customerInfo, verifiedUser]);

  // Background Atera check for already-verified session
  useEffect(() => {
    if (isVerified && verifiedUser?.email && (!customerInfo || !customerInfo.checked)) {
      checkCustomerStatusInAtera(verifiedUser.email, assignedTech.he).then((info) => {
        if (info) {
          const updatedGreeting = buildWelcomeGreeting(info, assignedTech, verifiedUser.fullName);
          setMessages((prev) => {
            if (prev.length === 1 && (prev[0].id === 'welcome' || prev[0].id === 'welcome-verified')) {
              return [
                {
                  ...prev[0],
                  text: updatedGreeting,
                  displayedText: updatedGreeting,
                },
              ];
            }
            return prev;
          });
        }
      });
    }
  }, [isVerified, verifiedUser]);

  // Open Concierge Trigger for Chat Bubble
  const handleOpenConcierge = () => {
    setIsOpen(true);
  };

  // CEO Simulator Trigger & Verification Gate
  const handleTriggerCeoSimulator = async () => {
    if (ceoSimGate.verified) {
      if (onNavigateToSimulator) {
        onNavigateToSimulator();
        setIsOpen(false);
      }
      return;
    }

    const targetEmail = verifiedUser?.email || authEmail.trim().toLowerCase();
    if (!targetEmail) {
      setAuthStep('email');
      return;
    }

    setCeoSimGate((prev) => ({ ...prev, isOpen: true, loading: true, error: '', otpSent: false }));

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          fullName: verifiedUser?.fullName || undefined,
          action: 'כניסה מאובטחת לסימולטור מנכ"לים (CEO Simulator)',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHe ? 'שגיאה בשליחת קוד אימות' : 'Failed to send verification code'));
      }

      setCeoSimGate((prev) => ({ ...prev, loading: false, otpSent: true, error: '' }));

      const gateMsgId = 'ceo-gate-' + Date.now();
      const promptText = isHe
        ? `🔐 **דרישת אימות: סימולטור מנכ"לים (CEO Simulator)**\n\nלפני תחילת העבודה והפעלת הסימולטור, חובה לאמת את זהותך באמצעות קוד חד-פעמי בן 4 ספרות.\nשלחנו כעת את הקוד למייל שלך (${targetEmail}).\n\nאנא הקלד את 4 הספרות להפעלת הסימולטור:`
        : `🔐 **Security Gate: CEO Simulator**\n\nA 4-digit verification code was sent to your email (${targetEmail}) before starting the simulator.\nPlease enter the 4 digits below:`;

      setMessages((prev) => [
        ...prev,
        {
          id: gateMsgId,
          sender: 'ai',
          text: promptText,
          displayedText: promptText,
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          type: 'ceo_simulator_gate',
        },
      ]);
    } catch (err: any) {
      setCeoSimGate((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleVerifyCeoSimulatorOtp = async (codeOverride?: string) => {
    const code = (codeOverride || ceoSimGate.otpCode).trim();
    if (code.length < 4) {
      setCeoSimGate((prev) => ({ ...prev, error: isHe ? 'נא להזין 4 ספרות' : 'Please enter 4 digits' }));
      return;
    }

    setCeoSimGate((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const targetEmail = verifiedUser?.email || authEmail.trim().toLowerCase();
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHe ? 'קוד אימות שגוי או שפג תוקפו' : 'Invalid code'));
      }

      setCeoSimGate({
        isOpen: false,
        otpSent: false,
        otpCode: '',
        verified: true,
        loading: false,
        error: '',
      });
      try {
        sessionStorage.setItem('tech_select_ceo_sim_verified', 'true');
      } catch {}

      const successText = isHe
        ? `✅ **אימות 4 הספרות הושלם בהצלחה!**\nסימולטור המנכ"לים (CEO Simulator) מורשה כעת ופתוח לשימושך.\nתוכל להפעיל אותו מיידית בלחיצה על הכפתור מטה:`
        : `✅ **Verification Successful!**\nThe CEO Simulator is now unlocked. Click below to launch it:`;

      const unlockMsgId = 'ceo-unlocked-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: unlockMsgId,
          sender: 'ai',
          text: successText,
          displayedText: successText,
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          type: 'ceo_simulator_unlocked',
        },
      ]);
    } catch (err: any) {
      setCeoSimGate((prev) => ({ ...prev, loading: false, error: err.message || (isHe ? 'קוד שגוי' : 'Invalid code') }));
    }
  };

  // Typewriter streaming helper
  const streamAIMessage = (fullText: string, msgId: string) => {
    if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
    let currentIndex = 0;
    const chunkSize = 4;
    const speed = 14;

    streamingTimerRef.current = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= fullText.length) {
        clearInterval(streamingTimerRef.current);
        streamingTimerRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, displayedText: fullText, isStreaming: false } : m
          )
        );
      } else {
        const partial = fullText.slice(0, currentIndex);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, displayedText: partial, isStreaming: true } : m
          )
        );
      }
    }, speed);
  };

  // Copy message text helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 4-Digit OTP Gate Handlers
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    const cleanEmail = authEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAuthError(isHe ? 'אנא הזן כתובת דוא״ל תקינה' : 'Please enter a valid email address');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          fullName: authName.trim() || undefined,
          action: isHe ? 'פתיחת מוקד השירות וה-AI של טק-סלקט' : 'Tech-Select AI Concierge Access',
        }),
      });
      const rawText = await res.text().catch(() => '');
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || (isHe ? 'שגיאה בתקשורת עם השרת' : 'Invalid server response') };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHe ? 'שגיאה בשליחת קוד אימות' : 'Failed to send verification code'));
      }
      setMaskedEmail(data.maskedEmail || cleanEmail);
      setAuthStep('otp');
      setCountdown(60);
      setAuthOtp('');
    } catch (err: any) {
      setAuthError(err.message || (isHe ? 'אירעה שגיאה, אנא נסה שוב' : 'An error occurred, please try again'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    setAuthError('');
    const targetCode = (codeToVerify || authOtp).trim();
    if (!targetCode || targetCode.length < 4) {
      setAuthError(isHe ? 'יש להזין 4 ספרות' : 'Please enter 4 digits');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          code: targetCode,
          fullName: authName.trim() || undefined,
        }),
      });
      const rawText = await res.text().catch(() => '');
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || (isHe ? 'שגיאה בתקשורת עם השרת' : 'Invalid server response') };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHe ? 'קוד אימות שגוי או שפג תוקפו' : 'Invalid verification code'));
      }

      const verifiedRecord = {
        email: authEmail.trim().toLowerCase(),
        fullName: authName.trim() || data?.lead?.fullName || '',
        sessionToken: data.sessionToken || data.token || '',
        timestamp: Date.now(),
      };

      try {
        sessionStorage.setItem('tech_select_ai_verified_user', JSON.stringify(verifiedRecord));
      } catch {}
      setVerifiedUser(verifiedRecord);
      setAuthStep('success');

      // Check Atera status immediately and build greeting according to customer vs guest
      const ateraInfo = await checkCustomerStatusInAtera(verifiedRecord.email, assignedTech.he);
      const verifiedWelcome = buildWelcomeGreeting(ateraInfo, assignedTech, verifiedRecord.fullName);

      setMessages([
        {
          id: 'welcome-verified',
          sender: 'ai',
          text: verifiedWelcome,
          displayedText: verifiedWelcome,
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          isStreaming: false,
        },
      ]);

      setTimeout(() => {
        setIsVerified(true);
      }, 600);
    } catch (err: any) {
      setAuthError(err.message || (isHe ? 'קוד שגוי או שפג תוקפו' : 'Invalid or expired code'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('tech_select_ai_verified_user');
    } catch {}
    setVerifiedUser(null);
    setIsVerified(false);
    setAuthStep('email');
    setAuthOtp('');
    setAuthError('');
  };

  // Submit Free-text AI Chat Query (Zero UI - Single Natural Language Stream)
  const handleSendChat = async (textOverride?: string) => {
    const q = (textOverride !== undefined ? textOverride : inputQuestion).trim();
    if (!q || isLoading) return;

    // Guard: lock check
    if (!isVerified) {
      setAuthStep('email');
      return;
    }

    // CEO Simulator gate check in chat
    const isCeoQuery = /(?:סימולטור|מנכ["״]?ל|מנכלי?ם|ceo|simulator)/i.test(q);
    const isFourDigitCode = /^\d{4}$/.test(q);

    if (isFourDigitCode && ceoSimGate.otpSent && !ceoSimGate.verified) {
      setInputQuestion('');
      const timeNow = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { id: 'user-' + Date.now(), sender: 'user', text: q, time: timeNow }]);
      await handleVerifyCeoSimulatorOtp(q);
      return;
    }

    if (isCeoQuery && !ceoSimGate.verified) {
      setInputQuestion('');
      const timeNow = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { id: 'user-' + Date.now(), sender: 'user', text: q, time: timeNow }]);
      await handleTriggerCeoSimulator();
      return;
    }

    setInputQuestion('');
    const timeNow = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const userMsgId = 'user-' + Date.now();

    const newMsgs: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: q, time: timeNow },
    ];
    setMessages(newMsgs);
    setIsLoading(true);

    try {
      const response = await fetch('/api/site-ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          assignedTech: isHe ? assignedTech.he : assignedTech.en,
          sessionToken: verifiedUser?.sessionToken,
          verifiedEmail: verifiedUser?.email,
          history: newMsgs.slice(-8).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          })),
        }),
      });

      const rawText = await response.text().catch(() => '');
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { reply: rawText };
      }

      if (response.status === 401 || data?.requiresVerification) {
        setIsVerified(false);
        setAuthStep('email');
        setAuthError(isHe ? 'נדרש אימות 4 ספרות מחדש' : '4-digit OTP verification required');
        return;
      }

      const replyText = data?.reply || (isHe
        ? 'טק-סלקט שירותי מחשוב וענן – אני כאן לרשותך. האם תרצה לפתוח קריאה, לבדוק סטטוס, או לקבל מידע על פתרונות מחשוב וסייבר?'
        : 'Tech-Select IT & Cloud Services – How else may I assist you today?');

      // Check if reply indicates ticket creation or verification
      let detectedTicketId: string | number | undefined;
      const ticketMatch = replyText.match(/(?:קריאה|טיקט|#)\s*#?([0-9]{4,7})/i);
      if (ticketMatch && (replyText.includes('נפתחה בהצלחה') || replyText.includes('מספר הקריאה'))) {
        detectedTicketId = ticketMatch[1];
      }

      const aiMsgId = 'ai-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: replyText,
          displayedText: '',
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true,
          createdTicketId: detectedTicketId,
          type: detectedTicketId ? 'ticket_created' : 'text',
        },
      ]);
      streamAIMessage(replyText, aiMsgId);
    } catch (err) {
      const errId = 'err-' + Date.now();
      const fallback = isHe
        ? 'טק-סלקט שירותי מחשוב בע"מ – מוקד המומחים שלנו עומד לרשותך בניהול IT, אבטחת מידע וסייבר, וענן Microsoft 365. תוכל לרשום לי את פרטי התקלה לפתיחה מהירה או לשאול כל שאלה.'
        : 'Tech-Select IT Services – Our team is ready to assist with Cloud, Cyber and Managed Services. Feel free to describe your request or ask any question.';

      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          sender: 'ai',
          text: fallback,
          displayedText: fallback,
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          isStreaming: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick suggestion prompts
  const suggestionChips = useMemo(() => {
    if (isHe) {
      return [
        { label: '🚀 סימולטור מנכ"לים (CEO)', prompt: 'אני רוצה להפעיל את סימולטור המנכ"לים' },
        { label: '⚡ פתיחת קריאת שירות', prompt: 'אני רוצה לפתוח קריאת שירות חדשה' },
        { label: '🔍 בדיקת סטטוס קריאה', prompt: 'אני רוצה לבדוק סטטוס קריאה במערכת' },
        { label: '🛡️ שירותי ענן וסייבר M365', prompt: 'אילו שירותי אבטחת מידע וענן אתם מציעים?' },
        { label: '🤖 הטמעת AI ארגוני', prompt: 'ספר לי על שירותי האוטומציה וה-AI שלכם לארגונים' },
      ];
    }
    return [
      { label: '🚀 CEO Simulator', prompt: 'I want to launch the CEO Simulator' },
      { label: '⚡ Open Service Ticket', prompt: 'I would like to open a service ticket' },
      { label: '🔍 Check Ticket Status', prompt: 'I want to check ticket status in the system' },
      { label: '🛡️ Cloud & Cyber M365', prompt: 'What cloud and cybersecurity services do you provide?' },
      { label: '🤖 Enterprise AI', prompt: 'Tell me about your enterprise AI and automation solutions' },
    ];
  }, [isHe]);

  // Markdown rendering helper
  const renderMessageText = (text: string) => {
    // Bold patterns: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-sky-400 dark:text-sky-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. The Floating Pill Trigger (Gemini Capsule) */}
      {!isOpen && (
        <div
          id="floating-ai-concierge-trigger"
          className={`fixed bottom-6 ${isHe ? 'right-6' : 'left-6'} z-[9990] print:hidden max-w-[calc(100vw-3rem)]`}
        >
          <div
            onClick={handleOpenConcierge}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleOpenConcierge()}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition-all duration-300 shadow-2xl backdrop-blur-2xl border active:scale-98 ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800/95 border-white/10 hover:border-sky-500/50 shadow-black/60 shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.12)]'
                : 'bg-white/95 hover:bg-white border-slate-200 hover:border-sky-400 shadow-slate-900/15 shadow-[0_10px_35px_rgba(14,165,233,0.15)]'
            }`}
            title={
              !isVerified
                ? isHe
                  ? 'עוזר ה-AI נעול - לחץ לאימות 4 ספרות במייל'
                  : 'AI Concierge Locked - Click to verify with 4-digit code'
                : isHe
                ? 'פתח עוזר וירטואלי חכם | TECH-SELECT AI'
                : 'Open AI Assistant'
            }
            aria-label={isHe ? 'עוזר וירטואלי חכם' : 'AI Assistant'}
          >
            {/* Status Icon with Dynamic Active AI Glow */}
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-8 h-8 rounded-full p-[1.5px] shadow-sm bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600">
                <div className={`w-full h-full rounded-full flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                  <Sparkles className="w-4 h-4 text-sky-400 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-12" />
                </div>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-emerald-500">
                <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-emerald-400" />
              </span>
            </div>

            {/* Dynamic Rotating Animated Text (Always Runs: LET THE AI WORK...) */}
            <div className="flex-1 min-w-0 pr-1 pl-1">
              <div className="h-5 overflow-hidden flex items-center">
                <span
                  key={placeholderIndex}
                  className="block text-xs sm:text-[13px] font-medium tracking-wide whitespace-nowrap truncate animate-in fade-in slide-in-from-bottom-2 duration-300 text-slate-700 dark:text-slate-200"
                >
                  {rotatingPlaceholders[placeholderIndex]}
                </span>
              </div>
            </div>

            {/* Action Arrow Icon Button */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-[-2px] ${
              isDark ? 'bg-white/5 text-slate-400 group-hover:text-sky-400 group-hover:bg-sky-500/20' : 'bg-slate-100 text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50'
            }`}>
              {isHe ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modern Gemini-Style Assistant Window (Full-Screen on Mobile & Tablet, Floating on Desktop) */}
      {isOpen && (
        <div
          id="floating-ai-concierge-window"
          className={`fixed z-[9999] flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in duration-200 transition-all ${
            /* Mobile & Tablet (< 1024px): Full-screen immersive chat experience with safe-area spacing */
            'inset-0 w-full h-[100dvh] max-w-none max-h-none rounded-none border-0'
          } ${
            /* Desktop (>= 1024px): Preserved sleek floating corner assistant card */
            `lg:inset-auto lg:bottom-6 ${isHe ? 'lg:right-6' : 'lg:left-6'} lg:w-[460px] lg:max-w-[490px] lg:h-[660px] lg:max-h-[90vh] lg:rounded-3xl lg:border lg:shadow-2xl`
          } ${
            isDark
              ? 'bg-slate-950 lg:bg-slate-950/96 border-slate-800/90 text-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(56,189,248,0.1)]'
              : 'bg-white lg:bg-white/98 border-slate-200 text-slate-900 shadow-[0_20px_60px_-15px_rgba(14,165,233,0.15)]'
          }`}
        >
          {/* Header */}
          <div className={`px-4 sm:px-6 lg:px-4 py-3 sm:py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800/80 bg-slate-900/60 lg:bg-slate-900/40' : 'border-slate-100 bg-slate-50/90 lg:bg-slate-50/70'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-2xl p-[1.5px] shadow-sm ${
                  !isVerified
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-600'
                    : 'bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600'
                }`}>
                  <div className={`w-full h-full rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                    {!isVerified ? (
                      <Lock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-950 ${
                  !isVerified ? 'bg-amber-500' : 'bg-emerald-500'
                }`}>
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                    !isVerified ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm lg:text-sm leading-tight text-slate-900 dark:text-white">
                    {!isVerified
                      ? isHe
                        ? 'אימות זהות מאובטח (4 ספרות)'
                        : 'Secure 4-Digit Identity Gate'
                      : isHe
                      ? `העוזר של ${assignedTech.he}`
                      : `Assistant of ${assignedTech.en}`}
                  </h3>
                  {!isVerified ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                      🔒 {isHe ? 'נעול לאימות' : 'Locked'}
                    </span>
                  ) : isIncognito ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20" title={isHe ? 'גלישה בסתר זוהתה - שכבת אבטחה פעילה' : 'Private browsing detected'}>
                      {isHe ? '🛡️ סתר מאובטח' : '🛡️ Incognito'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isHe ? 'מאומת' : 'Verified'}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs lg:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {!isVerified
                    ? isHe
                      ? 'טק-סלקט שירותי מחשוב בע"מ'
                      : 'Tech-Select Computer Services LTD'
                    : isHe
                    ? 'מוקד תמיכה טכנולוגי | Tech-Select'
                    : 'Tech Support Desk | Tech-Select'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-1">
              {isVerified && (
                <>
                  {messages.length > 1 && (
                    <button
                      onClick={() => setMessages([messages[0]])}
                      className="p-2 sm:p-2.5 lg:p-2 rounded-full lg:rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      title={isHe ? 'איפוס שיחה' : 'Reset Conversation'}
                      aria-label={isHe ? 'איפוס שיחה' : 'Reset Conversation'}
                    >
                      <RefreshCw className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-4 lg:h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 sm:p-2.5 lg:p-2 rounded-full lg:rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title={isHe ? 'נעילה מחדש והתנתקות' : 'Lock & Sign Out'}
                    aria-label={isHe ? 'נעילה מחדש' : 'Lock'}
                  >
                    <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-4 lg:h-4" />
                  </button>
                </>
              )}
              {/* Close Button: Noticeable, ergonomic touch target on mobile/tablet */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95 shrink-0"
                title={isHe ? 'סגור חלון' : 'Close'}
                aria-label={isHe ? 'סגור חלון' : 'Close'}
              >
                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>

          {!isVerified ? (
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center overflow-y-auto">
              {authStep === 'email' && (
                <form onSubmit={handleSendOtp} className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 p-[2px] shadow-lg shadow-sky-500/20">
                      <div className={`w-full h-full rounded-3xl flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                        <Sparkles className="w-7 h-7 text-sky-500" />
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow">
                      OTP
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {isHe ? 'אימות מהיר להפעלת העוזר החכם' : 'Quick Verification to Start AI'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5 leading-relaxed max-w-xs">
                    {isHe
                      ? 'כדי לאבטח את השירות ולחבר אותך למאגרי הידע של טק-סלקט, יש להזין כתובת אימייל לקבלת קוד אימות חד-פעמי (4 ספרות).'
                      : 'To secure service access and connect you to Tech-Select\'s enterprise knowledge base, please enter your email to receive a 4-digit code.'}
                  </p>

                  <div className="w-full space-y-3 text-right">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        {isHe ? 'שם מלא (אופציונלי)' : 'Full Name (Optional)'}
                      </label>
                      <div className="relative">
                        <User className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${isHe ? 'right-3' : 'left-3'} text-slate-400`} />
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder={isHe ? 'לדוגמה: ישראל ישראלי' : 'e.g. John Doe'}
                          className={`w-full py-2.5 ${isHe ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} text-xs sm:text-sm rounded-xl border transition-all ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        {isHe ? 'כתובת דוא״ל לקבלת הקוד *' : 'Email Address *'}
                      </label>
                      <div className="relative">
                        <Mail className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${isHe ? 'right-3' : 'left-3'} text-slate-400`} />
                        <input
                          ref={emailInputRef}
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="name@company.co.il"
                          className={`w-full py-2.5 ${isHe ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} text-xs sm:text-sm rounded-xl border transition-all ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {authError && (
                    <div className="w-full mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 text-right">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading || !authEmail.trim()}
                    className={`w-full mt-5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      authEmail.trim() && !authLoading
                        ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isHe ? 'שולח קוד אימות...' : 'Sending code...'}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{isHe ? 'שלח קוד 4 ספרות למייל' : 'Send 4-Digit Code'}</span>
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{isHe ? 'הקוד נשלח ישירות מ-support@tech-select.co.il' : 'Sent securely from support@tech-select.co.il'}</span>
                  </div>
                </form>
              )}

              {authStep === 'otp' && (
                <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-blue-600 p-[2px] shadow-lg shadow-sky-500/10">
                      <div className={`w-full h-full rounded-3xl flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                        <KeyRound className="w-7 h-7 text-sky-400" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {isHe ? 'הזן קוד בן 4 ספרות' : 'Enter 4-Digit Code'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5 leading-relaxed">
                    {isHe ? 'שלחנו קוד חד-פעמי למייל: ' : 'Verification code sent to: '}
                    <span className="font-semibold text-sky-500 dark:text-sky-400" dir="ltr">{maskedEmail || authEmail}</span>
                  </p>

                  {/* 4-Digit Input */}
                  <div className="w-full mb-4">
                    <input
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={authOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setAuthOtp(val);
                        if (val.length === 4) {
                          handleVerifyOtp(val);
                        }
                      }}
                      placeholder="••••"
                      className={`w-full py-3 text-center text-3xl font-mono font-bold tracking-[0.6em] rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>

                  {authError && (
                    <div className="w-full mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 text-right">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={authLoading || authOtp.length < 4}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      authOtp.length === 4 && !authLoading
                        ? 'bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white shadow-emerald-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isHe ? 'מאמת קוד...' : 'Verifying...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isHe ? 'אמת ופתח את מוקד ה-AI' : 'Verify & Unlock AI Concierge'}</span>
                      </>
                    )}
                  </button>

                  <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('email');
                        setAuthError('');
                      }}
                      className="text-sky-500 hover:underline cursor-pointer"
                    >
                      {isHe ? 'שינוי כתובת מייל' : 'Change Email'}
                    </button>

                    {countdown > 0 ? (
                      <span className="text-[11px] opacity-70">
                        {isHe ? `שליחה חוזרת בעוד ${countdown} שניות` : `Resend in ${countdown}s`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-sky-500 hover:underline cursor-pointer"
                      >
                        {isHe ? 'שלח קוד שוב' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {authStep === 'success' && (
                <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {isHe ? 'אימות הושלם בהצלחה!' : 'Identity Verified!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isHe ? 'פותח את מוקד ה-AI של טק-סלקט...' : 'Unlocking Tech-Select AI Concierge...'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Main Chat Stream Area */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-4 space-y-4 text-sm sm:text-base lg:text-[13px]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative max-w-[92%] sm:max-w-[80%] lg:max-w-[85%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 lg:px-4 lg:py-3 leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-xs'
                          : isDark
                            ? 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-bl-xs'
                            : 'bg-slate-100/90 text-slate-800 border border-slate-200/60 rounded-bl-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-line text-sm sm:text-[15px] lg:text-[13px] leading-relaxed">
                        {renderMessageText(msg.displayedText || msg.text)}
                      </div>

                      {/* Rich Ticket Created Card (Rendered naturally in stream) */}
                      {msg.type === 'ticket_created' && msg.createdTicketId && (
                        <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-500">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{isHe ? 'מספר קריאה במערכת המוקד:' : 'Ticket Number:'}</span>
                          </div>
                          <div className="text-xl sm:text-2xl font-mono font-black text-white mt-1 tracking-wider">
                            #{msg.createdTicketId}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-300 mt-1">
                            {isHe ? 'אישור נשלח למייל. המהנדסים שלנו כבר מעודכנים ופועלים לטיפול בה.' : 'Confirmation sent to email. Support team notified.'}
                          </div>
                        </div>
                      )}

                      {/* Interactive CEO Simulator OTP Verification Gate Card */}
                      {msg.type === 'ceo_simulator_gate' && !ceoSimGate.verified && (
                        <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 text-amber-300 space-y-3">
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-400">
                            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{isHe ? 'הזנת 4 ספרות לפתיחת סימולטור מנכ"לים:' : 'Enter 4-Digit Code for CEO Simulator:'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={ceoSimGate.otpCode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                setCeoSimGate((prev) => ({ ...prev, otpCode: val, error: '' }));
                                if (val.length === 4) {
                                  handleVerifyCeoSimulatorOtp(val);
                                }
                              }}
                              placeholder="••••"
                              className={`w-28 py-2 text-center text-xl font-mono font-bold tracking-[0.3em] rounded-xl border transition-all ${
                                isDark
                                  ? 'bg-slate-950 border-amber-500/40 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                                  : 'bg-white border-amber-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyCeoSimulatorOtp()}
                              disabled={ceoSimGate.loading || ceoSimGate.otpCode.length < 4}
                              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                ceoSimGate.otpCode.length === 4 && !ceoSimGate.loading
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                                  : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                              }`}
                            >
                              {ceoSimGate.loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>{isHe ? 'אמת והפעל' : 'Verify & Run'}</span>
                            </button>
                          </div>

                          {ceoSimGate.error && (
                            <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{ceoSimGate.error}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTriggerCeoSimulator()}
                            className="text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
                          >
                            {isHe ? 'שלח קוד שוב למייל' : 'Resend Code'}
                          </button>
                        </div>
                      )}

                      {/* CEO Simulator Unlocked Launcher Card */}
                      {msg.type === 'ceo_simulator_unlocked' && (
                        <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-sky-500/15 to-transparent border border-emerald-500/40 text-emerald-300 space-y-3">
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-400">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{isHe ? 'סימולטור המנכ"לים (CEO Simulator) מורשה כעת' : 'CEO Simulator Unlocked'}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {isHe
                              ? 'האימות עבר בהצלחה. כל תרחישי ההשבתה, חוסן הסייבר והמדדים הפיננסיים פתוחים לבדיקתך.'
                              : 'Authentication verified. Full cyber outage scenarios, resilience tests, and financial impact metrics are available.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToSimulator) {
                                onNavigateToSimulator();
                                setIsOpen(false);
                              }
                            }}
                            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Cpu className="w-4 h-4" />
                            <span>{isHe ? '🚀 הפעל את סימולטור המנכ"לים עכשיו ➔' : '🚀 Launch CEO Simulator Now ➔'}</span>
                          </button>
                        </div>
                      )}

                      {/* Message Timestamp & Copy Button */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-black/5 dark:border-white/5 opacity-60 text-[10px] sm:text-[11px] lg:text-[10px]">
                        <span>{msg.time}</span>
                        {msg.sender === 'ai' && !msg.isStreaming && (
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="hover:opacity-100 transition-opacity flex items-center gap-0.5 cursor-pointer p-1"
                            title={isHe ? 'העתק תשובה' : 'Copy'}
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Suggestion Chips under initial welcome message */}
                    {msg.id === 'welcome' && messages.length === 1 && (
                      <div className="mt-3 flex flex-wrap gap-2 w-full max-w-2xl">
                        {suggestionChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendChat(chip.prompt)}
                            className={`text-xs sm:text-sm lg:text-xs py-2 px-3.5 sm:py-2.5 sm:px-4 lg:py-1.5 lg:px-3 rounded-full border transition-all cursor-pointer text-left active:scale-95 ${
                              isDark
                                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-sky-500/40'
                                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-sky-400 shadow-xs'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 max-w-[90px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce" />
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Floating Input Bar (Gemini Experience, Safe for Mobile & Tablet) */}
              <div className={`p-3 sm:p-4 lg:p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t shrink-0 ${
                isDark ? 'border-slate-800/70 bg-slate-900/70 lg:bg-slate-900/50' : 'border-slate-100 bg-slate-50/95 lg:bg-slate-50/80'
              }`}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="relative max-w-4xl mx-auto w-full"
                >
                  <div className={`flex items-center gap-2 p-1.5 pl-2 pr-3 sm:p-2 sm:pl-3 sm:pr-4 lg:p-1.5 lg:pl-2 lg:pr-3 rounded-full border shadow-inner transition-all ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-700/80 focus-within:border-sky-500/70 focus-within:ring-2 focus-within:ring-sky-500/20'
                      : 'bg-white border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
                  }`}>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-7 lg:h-7 rounded-full bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 text-sky-500">
                      <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-3.5 lg:h-3.5" />
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      value={inputQuestion}
                      onChange={(e) => setInputQuestion(e.target.value)}
                      placeholder="LET THE AI WORK... תאר תקלה או שאל שאלה..."
                      disabled={isLoading}
                      className={`flex-1 py-1.5 px-2 bg-transparent text-base lg:text-[13px] focus:outline-none ${
                        isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                      }`}
                    />

                    <button
                      type="submit"
                      disabled={isLoading || !inputQuestion.trim()}
                      className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        inputQuestion.trim()
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md hover:scale-105 active:scale-95'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                      }`}
                      aria-label={isHe ? 'שלח הודעה' : 'Send message'}
                    >
                      <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-3.5 lg:h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Discreet subtext */}
                <div className="text-center mt-2">
                  <span className="text-[10px] sm:text-[11px] lg:text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                    {isHe
                      ? 'מופעל באמצעות Gemini • Zero UI • אימות OTP מאובטח'
                      : 'Powered by Gemini • Zero UI • Secure OTP Verification'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
