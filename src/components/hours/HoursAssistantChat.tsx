import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Square,
  Send,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  Trash2,
  ChevronDown,
  X,
  ExternalLink,
  Plus,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  MessageSquare,
  History,
  BarChart3,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import {
  apiAssistantChat,
  HoursAssistantEntryDraft,
  WrittenEntryResult,
  AssistantChatResponse,
} from "../../services/hoursApiClient";
import { HoursEntryCard } from "./HoursEntryCard";

export interface SavedChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
  messages: ChatMessage[];
  activeDrafts?: HoursAssistantEntryDraft[];
  writtenEntries?: WrittenEntryResult[];
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  isVoice?: boolean;
  drafts?: HoursAssistantEntryDraft[];
  writtenEntries?: WrittenEntryResult[];
  timestamp: string;
}

interface HoursAssistantChatProps {
  currentUser: {
    name: string;
    email: string;
    isAdmin?: boolean;
  };
  onOpenTodaySummary?: () => void;
}

function getFriendlyHebrewErrorMessage(err: any): string {
  const originalMsg = String(err?.message || err || "").trim();
  const raw = originalMsg.toLowerCase();

  if (raw.includes("unauthorized") || raw.includes("401") || raw.includes("אימות") || raw.includes("token")) {
    return "לא זוהתה הרשאת גישה פעילה או שפג תוקף החיבור מול Microsoft 365. נא לרענן את העמוד כדי להתחבר מחדש.";
  }
  if (raw.includes("aadsts700016") || raw.includes("unauthorized_client") || raw.includes("not found in the directory")) {
    return "שגיאת אימות מול Microsoft Graph (קוד 400): מזהה האפליקציה (Client ID) שהוגדר אינו קיים ב-Azure Entra ID.\n\nשים לב: יש לוודא שב-HOURS_GRAPH_CLIENT_ID מוגדר ה-Application (client) ID ממסך ה-Overview של האפליקציה ב-Azure, ולא ה-Secret ID ממסך Certificates & Secrets. ב-HOURS_GRAPH_CLIENT_SECRET יש להגדיר את ערך הסיסמה (Value).";
  }
  if (raw.includes("aadsts7000215") || raw.includes("invalid_client") || raw.includes("invalid client secret")) {
    return "שגיאת סיסמת אפליקציה (קוד 401): מפתח הסיסמה (Client Secret) שהוגדר עבור Microsoft Graph אינו תקין או שפג תוקפו. יש לוודא שהוזן ערך ה-Value מתוך מסך Certificates & Secrets ב-Azure Entra ID.";
  }
  if (raw.includes("forbidden") || raw.includes("403") || raw.includes("accessdenied") || raw.includes("access denied") || raw.includes("גישה נדחתה")) {
    return "גישה נדחתה (403 Access Denied) לאתר SharePoint של הלקוחות (techselectltd.sharepoint.com:/sites/Customers).\n\nיש לוודא שהאפליקציה ב-Azure Entra ID קיבלה הרשאת Application מסוג 'Sites.Read.All' או 'Sites.ReadWrite.All' ב-Microsoft Graph עם אישור מנהל (Admin Consent).";
  }
  if (raw.includes("abort") || raw.includes("timeout") || raw.includes("ארכה זמן רב") || raw.includes("504")) {
    return "הבקשה לשרת ארכה זמן רב מהרגיל עקב עומס בשרתי Microsoft. נא לנסות שוב.";
  }
  if (raw.includes("עתידי") || raw.includes("בעתיד")) {
    return "לא ניתן לדווח שעות עבור תאריך עתידי.";
  }
  if (raw.includes("0.25") || raw.includes("12 שעות")) {
    return "משך הזמן המדווח חייב להיות בין 15 דקות ל-12 שעות (0.25 - 12 שעות).";
  }
  if (raw.includes("10 דקות") || raw.includes("מרגע הכתיבה")) {
    return "חלפו יותר מ-10 דקות מרגע הכתיבה, לא ניתן לבטל את השורה באופן אוטומטי.";
  }
  if (raw.includes("עובד אחר")) {
    return "לא ניתן לבטל שורה זו: השורה שייכת לעובד אחר.";
  }
  if (raw.includes("עודכנו") || raw.includes("שונו")) {
    return "תוכן השורה ב-Excel עודכן או שונה מאז כתיבתה, ולכן לא ניתן לבטלה.";
  }
  if (raw.includes("קובץ excel תקין") || raw.includes(".xlsx")) {
    return "קובץ היעד שנמצא ב-SharePoint אינו קובץ Excel תקין (.xlsx).";
  }
  if (raw.includes("locked") || raw.includes("423") || raw.includes("resourceislocked")) {
    return "קובץ השעות נעול כרגע לעריכה על ידי משתמש אחר ב-SharePoint. נא להמתין מספר שניות ולנסות שוב.";
  }
  if (raw.includes("לא נמצא קובץ שעות")) {
    return "לא נמצא קובץ שעות מתאים עבור הלקוח לחודש המבוקש ב-SharePoint.";
  }
  if (raw.includes("subrequest") || raw.includes("too many subrequests") || raw.includes("תת-בקשות")) {
    return "זוהתה פעולה כבדה המכילה ריבוי בקשות. המערכת מנתבת פעולות כבדות לתור מנות מבוקר (Job Queue) כדי למנוע עומס תעבורה.";
  }
  if (raw.includes("אישור מפורש")) {
    return "נדרש אישור מפורש לפני הזנת הנתונים לקובץ.";
  }
  // If the error message already has Hebrew descriptive text (e.g. from server exceptions), display it directly
  if (/[\u0590-\u05FF]/.test(originalMsg) && originalMsg.length > 8) {
    return originalMsg;
  }
  // Distinguish Gemini AI rate limits vs Microsoft Graph rate limits
  if (
    raw.includes("gemini") ||
    raw.includes("resource_exhausted") ||
    raw.includes("quota") ||
    raw.includes("google")
  ) {
    return "עומס זמני בשירות ה-AI של Google Gemini (מגבלת קצב 429). המערכת ממתינה מספר שניות לאיפוס המכסה. נא לנסות שוב.";
  }
  if (raw.includes("429") || raw.includes("throttled") || raw.includes("too many requests")) {
    return "עומס בקשות זמני מול שרתי Microsoft 365 (מגבלת קצב 429 ב-SharePoint/Excel). נא להמתין כ-10 שניות ולנסות שוב.";
  }
  return originalMsg ? `אירעה שגיאה בביצוע הפעולה מול קובץ השעות: ${originalMsg}` : "אירעה שגיאה בביצוע הפעולה מול קובץ השעות. נא לנסות שוב.";
}

export const HoursAssistantChat: React.FC<HoursAssistantChatProps> = ({
  currentUser,
  onOpenTodaySummary,
}) => {
  const isGuyOrAdmin = Boolean(
    currentUser.isAdmin ||
    currentUser.email?.toLowerCase() === "g@tech-select.co.il"
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("מעבד בקשה...");

  // Active Drafts currently pending confirmation in the session
  const [activeDrafts, setActiveDrafts] = useState<HoursAssistantEntryDraft[]>([]);
  // Written entries in this session (with 10-minute undo window)
  const [writtenEntries, setWrittenEntries] = useState<WrittenEntryResult[]>([]);

  // History & Collapsible Left Sidebar (Gemini Style - strictly 5 recent sessions)
  const MAX_SAVED_SESSIONS = 5;
  const historyStorageKey = `tech_select_hours_history_v1_${currentUser?.email || "user"}`;

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tech_select_hours_sidebar_open");
      if (saved !== null) return saved === "true";
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `sess_${Date.now()}`);

  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(historyStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, MAX_SAVED_SESSIONS);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return [];
  });

  // Automatically keep 5 recent sessions updated in localStorage
  useEffect(() => {
    if (messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.role === "user");
    let title = "שיחת דיווח";
    if (firstUserMsg?.text) {
      const clean = firstUserMsg.text.replace(/[\r\n]+/g, " ").trim();
      title = clean.length > 30 ? clean.slice(0, 30) + "..." : clean;
    }

    setSavedSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      const updatedItem: SavedChatSession = {
        id: currentSessionId,
        title,
        preview: firstUserMsg?.text || "",
        createdAt: existingIdx >= 0 ? prev[existingIdx].createdAt : Date.now(),
        updatedAt: Date.now(),
        messages,
        activeDrafts,
        writtenEntries,
      };

      let updatedList: SavedChatSession[];
      if (existingIdx >= 0) {
        const remaining = prev.filter((s) => s.id !== currentSessionId);
        updatedList = [updatedItem, ...remaining].slice(0, MAX_SAVED_SESSIONS);
      } else {
        updatedList = [updatedItem, ...prev].slice(0, MAX_SAVED_SESSIONS);
      }

      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(updatedList));
      } catch (err) {
        console.error("Failed to update localStorage history", err);
      }

      return updatedList;
    });
  }, [messages, activeDrafts, writtenEntries, currentSessionId, historyStorageKey]);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [micPermissionError, setMicPermissionError] = useState<{
    title: string;
    details: string;
    instructions: string[];
    openInNewTabUrl?: string;
  } | null>(null);

  // Chat scroll container
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeDrafts, writtenEntries, loading]);

  // Audio Recording: Start
  const startRecording = async () => {
    setMicPermissionError(null);
    try {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setMicPermissionError({
          title: "נדרש חיבור מאובטח (HTTPS)",
          details: "דפדפנים מודרניים דורשים חיבור HTTPS מאובטח כדי לאפשר גישה למיקרופון.",
          instructions: [
            "ודא שכתובת האתר מתחילה ב-https://.",
            "באפשרותך להקליד את הדיווח ישירות בתיבת הטקסט משמאל.",
          ],
        });
        return;
      }

      if (!navigator?.mediaDevices || !navigator?.mediaDevices?.getUserMedia) {
        setMicPermissionError({
          title: "הדפדפן אינו תומך בהקלטת שמע",
          details: "סביבת הדפדפן הנוכחית אינה תומכת בממשק MediaDevices.",
          instructions: [
            "פתח את המערכת בחלון דפדפן נפרד ועדכני.",
            "ניתן להקליד את פרטי העבודה בתיבת הטקסט למטה.",
          ],
          openInNewTabUrl: typeof window !== "undefined" ? window.location.href : undefined,
        });
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (advancedErr) {
        console.warn("[HoursVoice] Advanced audio constraints failed, trying basic audio: true", advancedErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      audioChunksRef.current = [];

      // Determine mimeType supported by browser
      let mimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(recordingTimerRef.current);
        setRecordingSeconds(0);
        setIsRecording(false);

        if (audioBlob.size < 100) {
          console.warn("[HoursVoice] Audio blob too small, likely empty.");
          return;
        }

        // Convert audioBlob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string)?.split(",")?.[1];
          if (base64Data) {
            handleSendAudio(base64Data, mimeType);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      // Start recording cleanly without small timeslice chunk fragmentation
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 119) {
            // Auto stop recording at 2 minutes (120 seconds max)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                mediaRecorderRef.current.stop();
              } catch (_) {}
            }
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("[HoursVoice] Mic access error:", err);
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);

      const isEmbedded = typeof window !== "undefined" && window.self !== window.top;

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        if (isEmbedded) {
          setMicPermissionError({
            title: "המיקרופון חסום בתוך מסגרת תצוגה (iframe)",
            details:
              "הדפדפן חוסם בקשות מיקרופון מתוך מסגרת מוטמעת (חלון תצוגה מקדימה), ולכן שאלת האישור (Prompt) כלל אינה מופיעה על המסך. כדי להקליט, פתח את המערכת בלשונית מלאה.",
            instructions: [
              "לחץ על הכפתור 'פתח בלשונית נפרדת' למטה.",
              "בלשונית המלאה, הדפדפן יקפיץ מיד את שאלת האישור ותוכל לאשר.",
              "באפשרותך גם להקליד כרגיל בתיבת הטקסט כאן — אין הכרח במיקרופון.",
            ],
            openInNewTabUrl: typeof window !== "undefined" ? window.location.href : undefined,
          });
        } else {
          setMicPermissionError({
            title: "הרשאת המיקרופון נדחתה או חסומה",
            details:
              "הדפדפן או מערכת ההפעלה חוסמים את הגישה למיקרופון. אם הדפדפן מוגדר על 'שאל לפני' אך לא שואל, ייתכן שקיים מחסום ברמת מערכת ההפעלה או הגדרות האתר.",
            instructions: [
              "לחץ על סמל המנעול 🔒 או סמל הכוונון 🎛️ ליד שורת הכתובת בראש הדפדפן -> העבר את 'מיקרופון' למצב 'אפשר' (Allow).",
              "ב-macOS: עבור אל הגדרות מערכת -> פרטיות ואבטחה -> מיקרופון -> ודא שהדפדפן שלך מסומן ב-V.",
              "ב-Windows: עבור אל הגדרות -> פרטיות ואבטחה -> מיקרופון -> ודא ש'אפשר ליישומים לגשת למיקרופון' מופעל.",
              "לאחר שינוי ההגדרה, רענן את העמוד ונסה שוב.",
              "ניתן להקליד את הדיווח בתיבת הטקסט ללא צורך במיקרופון.",
            ],
          });
        }
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setMicPermissionError({
          title: "לא זוהה מיקרופון מחובר",
          details: "הדפדפן לא מצא התקן קלט שמע פעיל במחשב או בטלפון שלך.",
          instructions: [
            "ודא שהמיקרופון או האוזניות מחוברים כראוי.",
            "בדוק בהגדרות מערכת ההפעלה שהמיקרופון מוגדר ופועל.",
            "באפשרותך להקליד את פרטי העבודה ישירות בתיבת הטקסט.",
          ],
        });
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setMicPermissionError({
          title: "המיקרופון תפוס על ידי תוכנה אחרת",
          details: "תוכנה אחרת במחשב (כגון Teams, Zoom או שיחה פעילה) תופסת את המיקרופון באופן בלעדי.",
          instructions: [
            "סגור יישומים אחרים המשתמשים במיקרופון.",
            "לחץ שוב על כפתור המיקרופון כדי לנסות מחדש.",
          ],
        });
      } else {
        setMicPermissionError({
          title: "לא ניתן לגשת למיקרופון",
          details: err?.message || "אירעה שגיאה בלתי צפויה בעת פתיחת המיקרופון.",
          instructions: [
            "בדוק את הרשאות הדפדפן שלך או רענן את העמוד.",
            "באפשרותך להקליד את הפעילות בחופשיות בתיבת הטקסט.",
          ],
        });
      }
    }
  };

  // Audio Recording: Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Format recording timer: 00:07 / 02:00
  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? "0" + mins : mins}:${remainder < 10 ? "0" + remainder : remainder} / 02:00`;
  };

  // Send Audio payload to backend
  const handleSendAudio = async (base64Audio: string, mimeType: string) => {
    let stepTimer1: any = null;
    let stepTimer2: any = null;

    // Immediately display user's voice message in UI so user has immediate feedback
    const voiceMsgId = `voice_${Date.now()}`;
    const userVoiceMessage: ChatMessage = {
      id: voiceMsgId,
      role: "user",
      text: "🎙️ הקלטה קולית... מעבד ומפענח",
      isVoice: true,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userVoiceMessage]);

    try {
      setLoading(true);
      setLoadingStep("מתמלל ומפענח הקלטה קולית...");

      stepTimer1 = setTimeout(() => {
        setLoadingStep("מאתר לקוחות ותיקיות ב-SharePoint...");
      }, 3000);

      stepTimer2 = setTimeout(() => {
        setLoadingStep("בודק כפילויות ומכין כרטיס דיווח...");
      }, 6500);

      // Prepare conversation history (exclude welcome and current pending voice msg)
      const history = messages
        .filter((m) => m.id !== "welcome" && m.id !== voiceMsgId)
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await apiAssistantChat({
        user: currentUser,
        audio: {
          data: base64Audio,
          mimeType,
        },
        history,
        activeDrafts,
        writtenEntries,
      });

      handleChatResponse(res, true, voiceMsgId);
    } catch (err: any) {
      console.error("[handleSendAudio] Error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === voiceMsgId
            ? { ...m, text: "🎙️ הקלטה קולית (אירעה שגיאה בעיבוד)" }
            : m
        )
      );
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: friendlyMsg,
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      if (stepTimer1) clearTimeout(stepTimer1);
      if (stepTimer2) clearTimeout(stepTimer2);
      setLoading(false);
    }
  };

  // Send Text payload to backend
  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText("");

    // Add user message to UI immediately
    const userMsgId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);

    let stepTimer1: any = null;
    let stepTimer2: any = null;
    let stepTimer3: any = null;

    try {
      setLoading(true);
      setLoadingStep("מנתח הודעה ובודק נתונים...");

      stepTimer1 = setTimeout(() => {
        setLoadingStep("מאתר לקוחות ותיקיות ב-SharePoint...");
      }, 3000);

      stepTimer2 = setTimeout(() => {
        setLoadingStep("בודק קובץ Excel וכפילויות...");
      }, 7000);

      stepTimer3 = setTimeout(() => {
        setLoadingStep("מכין כרטיס סיכום להזנה...");
      }, 14000);

      // Prepare conversation history (prior turns only, current turn is in 'message')
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await apiAssistantChat({
        user: currentUser,
        message: text,
        history,
        activeDrafts,
        writtenEntries,
      });

      handleChatResponse(res, false);
    } catch (err: any) {
      console.error("[handleSendText] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: friendlyMsg,
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      if (stepTimer1) clearTimeout(stepTimer1);
      if (stepTimer2) clearTimeout(stepTimer2);
      if (stepTimer3) clearTimeout(stepTimer3);
      setLoading(false);
    }
  };

  // Common response handler
  const handleChatResponse = (res: AssistantChatResponse, fromVoice: boolean, voiceMsgId?: string) => {
    // If voice recording, update or add the user message with the decoded transcript
    if (fromVoice) {
      const transcriptText = res.transcript ? `🎙️ "${res.transcript}"` : "🎙️ הקלטה קולית";
      if (voiceMsgId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === voiceMsgId ? { ...m, text: transcriptText } : m))
        );
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `user_trans_${Date.now()}`,
            role: "user",
            text: transcriptText,
            isVoice: true,
            timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    }

    // Update active drafts
    if (res.drafts) {
      setActiveDrafts(res.drafts);
    }

    // Update written entries
    if (res.writtenEntries && res.writtenEntries.length > 0) {
      setWrittenEntries((prev) => {
        const merged = [...res.writtenEntries];
        for (const existing of prev) {
          if (!merged.some((m) => m.id === existing.id)) {
            merged.push(existing);
          }
        }
        return merged;
      });
    }

    // Remove undone entries from both writtenEntries state and message cards
    if (res.undoneCardIds && res.undoneCardIds.length > 0) {
      setWrittenEntries((prev) => prev.filter((w) => !res.undoneCardIds.includes(w.id)));
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.writtenEntries) return msg;
          const remaining = msg.writtenEntries.filter((w) => !res.undoneCardIds.includes(w.id));
          return {
            ...msg,
            writtenEntries: remaining.length > 0 ? remaining : undefined,
          };
        })
      );
    }

    // Add model response message
    if (res.reply) {
      setMessages((prev) => [
        ...prev,
        {
          id: `model_${Date.now()}`,
          role: "model",
          text: res.reply,
          drafts: res.drafts && res.drafts.length > 0 ? res.drafts : undefined,
          writtenEntries:
            res.writtenEntries && res.writtenEntries.length > 0 ? res.writtenEntries : undefined,
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  // Direct Card Confirmation Handler
  const handleConfirmEntry = async (cardId: string) => {
    try {
      setLoading(true);
      setLoadingStep("רושם שורה בגיליון ה-Excel...");

      const res = await apiAssistantChat({
        user: currentUser,
        action: "confirm_entry",
        cardId,
        activeDrafts,
        writtenEntries,
      });

      handleChatResponse(res, false);
    } catch (err: any) {
      console.error("[handleConfirmEntry] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: friendlyMsg,
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Direct Card Undo Handler
  const handleUndoEntry = async (cardId: string, directEntry?: WrittenEntryResult) => {
    try {
      setLoading(true);
      setLoadingStep("מבטל שורה מגיליון ה-Excel...");

      // 1. Resolve target entry from direct argument, writtenEntries state, or any message card
      const targetEntry =
        directEntry ||
        writtenEntries.find((w) => w.id === cardId || w.entryId === cardId || w.fileId === cardId) ||
        messages
          .flatMap((m) => m.writtenEntries || [])
          .find((w) => w.id === cardId || w.entryId === cardId || w.fileId === cardId);

      const undoData = targetEntry
        ? {
            driveId: targetEntry.driveId,
            itemId: targetEntry.itemId || targetEntry.fileId,
            fileId: targetEntry.fileId,
            rowAddress: targetEntry.rowAddress,
            writtenValues: targetEntry.writtenValues,
            writtenAt: targetEntry.writtenAt,
            sheetName: targetEntry.sheetName,
            customerName: targetEntry.customerName,
          }
        : undefined;

      const mergedWritten = [
        ...(targetEntry ? [targetEntry] : []),
        ...writtenEntries,
        ...messages.flatMap((m) => m.writtenEntries || []),
      ].filter((w, idx, arr) => arr.findIndex((x) => x.id === w.id) === idx);

      const res = await apiAssistantChat({
        user: currentUser,
        action: "undo_entry",
        cardId: targetEntry?.id || cardId,
        activeDrafts,
        undoData,
        writtenEntries: mergedWritten,
      });

      handleChatResponse(res, false);
    } catch (err: any) {
      console.error("[handleUndoEntry] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: friendlyMsg,
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Update in-line draft
  const handleUpdateDraft = (updated: HoursAssistantEntryDraft) => {
    setActiveDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  // Helper for human time-of-day greeting (e.g. בוקר טוב, צהריים טובים, ערב טוב)
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "בוקר טוב";
    } else if (hour >= 12 && hour < 17) {
      return "צהריים טובים";
    } else if (hour >= 17 && hour < 21) {
      return "ערב טוב";
    } else {
      return "לילה טוב";
    }
  };

  const handleNewChat = () => {
    const newId = `sess_${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages([]);
    setActiveDrafts([]);
    setWrittenEntries([]);
    setInputText("");
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = (session: SavedChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setActiveDrafts(session.activeDrafts || []);
    setWrittenEntries(session.writtenEntries || []);
    setInputText("");
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSavedSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleClearAllHistory = () => {
    setSavedSessions([]);
    try {
      localStorage.removeItem(historyStorageKey);
    } catch {}
    handleNewChat();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tech_select_hours_sidebar_open", String(next));
      } catch {}
      return next;
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `היום, ${timeStr}`;
    if (isYesterday) return `אתמול, ${timeStr}`;
    return `${date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}, ${timeStr}`;
  };

  const firstName = (currentUser.name || "").split(" ")[0] || currentUser.name || "עובד";
  const greeting = getTimeBasedGreeting();

  return (
    <div className="w-full h-full flex flex-row overflow-hidden relative bg-[#f8fafd]" dir="ltr">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR: Gemini Conversation History (Save 5, Collapsible, Subtle Hovers) */}
      <aside
        dir="rtl"
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          ${isSidebarOpen ? "w-72 border-r border-slate-200/90" : "w-0 border-r-0"}
          bg-[#f0f4f9]
          transition-all duration-300 ease-in-out
          flex flex-col shrink-0 overflow-hidden
          shadow-xl md:shadow-none
        `}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 pb-2.5 border-b border-slate-200/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-2xs">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 leading-tight">היסטוריית שיחות</h2>
              <span className="text-[10px] text-slate-400">שמירה של 5 אחרונות</span>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="btn-icon-subtle p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 cursor-pointer"
            title="צמצם היסטוריה"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleNewChat}
            className="btn-hover-subtle w-full py-2.5 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-blue-600 shadow-2xs flex items-center justify-between text-xs font-semibold cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span>שיחה חדשה</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>

        {/* Recent Sessions List Header */}
        <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0">
          <span>שיחות אחרונות</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-600 text-[10px]">
            {savedSessions.length}/5
          </span>
        </div>

        {/* Sessions List (Max 5) */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          {savedSessions.length === 0 ? (
            <div className="py-8 px-3 text-center text-slate-400 flex flex-col items-center">
              <MessageSquare className="w-6 h-6 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-medium text-slate-500">אין עדיין שיחות שמורות</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
                שיחות שיתועדו יישמרו כאן אוטומטית (עד 5 אחרונות).
              </p>
            </div>
          ) : (
            savedSessions.map((sess) => {
              const isActive = currentSessionId === sess.id && messages.length > 0;
              return (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess)}
                  role="button"
                  className={`
                    history-item-subtle w-full p-2.5 rounded-xl border text-right cursor-pointer flex items-center justify-between gap-2 group
                    ${
                      isActive
                        ? "bg-blue-50/90 border-blue-200/90 text-blue-900 shadow-2xs font-medium"
                        : "bg-white/80 hover:bg-white border-slate-200/70 text-slate-700 hover:text-slate-900 shadow-2xs"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:text-blue-600"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate font-medium">{sess.title || "שיחת דיווח"}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatRelativeTime(sess.updatedAt || sess.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    className="btn-icon-subtle p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                    title="מחק שיחה זו"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/70 bg-white/40 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">נשמרות 5 שיחות</span>
          </div>

          {savedSessions.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="btn-hover-subtle text-[10px] text-slate-400 hover:text-red-500 cursor-pointer underline px-1 py-0.5 rounded"
            >
              נקה הכל
            </button>
          )}
        </div>
      </aside>

      {/* MAIN GEMINI CHAT CANVAS */}
      <div dir="rtl" className="flex-1 h-full flex flex-col justify-between overflow-hidden relative text-right">
        {/* Top Status Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200/60 bg-white/70 backdrop-blur-xs flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="btn-icon-subtle p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1.5 border border-slate-200/80 shadow-2xs"
              title={isSidebarOpen ? "צמצם היסטוריה" : "פתח היסטוריית שיחות (5 אחרונות)"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-blue-600" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-slate-600" />
              )}
              <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
                {isSidebarOpen ? "צמצם" : "היסטוריה"}
              </span>
            </button>

            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-2xs">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-700">עוזר דיווח שעות</span>
            {activeDrafts.length > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>{activeDrafts.length} טיוטות</span>
              </span>
            )}

            {/* Manager Today Hours Summary Quick Button */}
            {isGuyOrAdmin && onOpenTodaySummary && (
              <button
                onClick={onOpenTodaySummary}
                className="btn-hover-subtle text-xs px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs mr-1"
                title="דוח וריכוז שעות עבודה יומי לכל העובדים"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                <span>שעות היום</span>
              </button>
            )}
          </div>

          <button
            onClick={handleNewChat}
            className="btn-hover-subtle flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 cursor-pointer shadow-xs"
            title="שיחה חדשה"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>שיחה חדשה</span>
          </button>
        </div>

        {/* Content Area: If empty -> Greeting, else -> Message Feed */}
        {messages.length === 0 && activeDrafts.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto my-auto px-4 overflow-y-auto relative">
            {/* Soft Ethereal Glow in the Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[22rem] bg-gradient-to-tr from-sky-200/35 via-purple-100/30 to-indigo-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Sparkles Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            {/* Big Gemini Headline */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-3">
                <span className="bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] bg-clip-text text-transparent">
                  {greeting}, {firstName}
                </span>
              </h1>
              <p className="text-base sm:text-xl font-normal text-slate-500 mb-6">
                איך אוכל לעזור לך לתעד או לבדוק שעות היום?
              </p>

              {/* Quick Starter Suggestion Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                {isGuyOrAdmin ? (
                  <>
                    <button
                      onClick={() => handleSendText("כמה אנשים תיעדו היום?")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>כמה אנשים תיעדו היום?</span>
                    </button>
                    <button
                      onClick={() => handleSendText("ריכוז שבועי")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ריכוז שבועי</span>
                    </button>
                    <button
                      onClick={() => handleSendText("כמה שעות נרשמו היום?")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>כמה שעות נרשמו היום?</span>
                    </button>
                    <button
                      onClick={() => handleSendText("דוח שעות לאתמול")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>דוח שעות לאתמול</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setInputText("הייתי היום שעתיים בביקור אצל ")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer"
                    >
                      🚗 ביקור פיזי אצל לקוח
                    </button>
                    <button
                      onClick={() => setInputText("שעה תמיכה מרחוק וטלפון עם ")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer"
                    >
                      💻 תמיכה מרחוק וטיקטים
                    </button>
                    <button
                      onClick={() => handleSendText("כמה שעות רשמתי היום?")}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer"
                    >
                      ⏱️ כמה שעות רשמתי היום?
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Messages Feed: Full Viewport Width, Comfortable Centered Max-Width Reading Column */
          <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === "user";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-start" : "items-stretch"} space-y-2.5`}
                  >
                    {/* User Message Bubble */}
                    {isUser ? (
                      <div className="bg-[#f0f4f9] text-slate-900 rounded-3xl px-5 py-3.5 text-sm sm:text-base leading-relaxed max-w-[85%] shadow-xs">
                        {msg.isVoice && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1.5 font-semibold pb-1 border-b border-slate-200">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>תמלול קולי</span>
                          </div>
                        )}
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <div className="text-[10px] text-slate-400 mt-1.5 text-left">
                          {msg.timestamp}
                        </div>
                      </div>
                    ) : (
                      /* Model / Assistant Message: Gemini Canvas Style */
                      <div className="flex items-start gap-3 w-full">
                        {/* Gemini Sparkles Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                            <p className="whitespace-pre-line">{msg.text}</p>
                          </div>

                          {/* Render Cards attached to this turn */}
                          {msg.drafts && msg.drafts.length > 0 && (
                            <div className="w-full space-y-2 pt-1">
                              {msg.drafts.map((d) => (
                                <HoursEntryCard
                                  key={d.id}
                                  draft={activeDrafts.find((ad) => ad.id === d.id) || d}
                                  onConfirm={handleConfirmEntry}
                                  onUpdateDraft={handleUpdateDraft}
                                  isConfirming={loading}
                                />
                              ))}
                            </div>
                          )}

                          {/* Render Written Entries */}
                          {msg.writtenEntries && msg.writtenEntries.length > 0 && (
                            <div className="w-full space-y-2 pt-1">
                              {msg.writtenEntries.map((w) => (
                                <HoursEntryCard
                                  key={w.id}
                                  written={w}
                                  onUndo={(id, entry) => handleUndoEntry(id, entry || w)}
                                  isUndoing={loading}
                                />
                              ))}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400">
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Global Active Drafts if not in the last message */}
              {activeDrafts.length > 0 &&
                !messages[messages.length - 1]?.drafts?.length && (
                  <div className="w-full space-y-2 pt-2 pr-11">
                    <div className="text-xs text-blue-600 font-semibold mb-1">
                      טיוטות ממתינות לאישורך:
                    </div>
                    {activeDrafts.map((d) => (
                      <HoursEntryCard
                        key={d.id}
                        draft={d}
                        onConfirm={handleConfirmEntry}
                        onUpdateDraft={handleUpdateDraft}
                        isConfirming={loading}
                      />
                    ))}
                  </div>
                )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 max-w-[75%] shadow-xs animate-pulse pr-11">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{loadingStep}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Docked Floating Pill Input at the Bottom */}
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2 shrink-0">
          {/* Active Audio Recording Bar */}
          {isRecording && (
            <div className="mb-2 flex items-center justify-between p-3.5 rounded-2xl bg-red-50 border border-red-200 animate-pulse shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-red-700">מקליט...</span>
                <span className="font-mono text-xs text-red-900 bg-white px-2 py-0.5 rounded-lg border border-red-200">
                  {formatRecordingTime(recordingSeconds)}
                </span>
              </div>

              <button
                onClick={stopRecording}
                className="btn-hover-subtle py-1 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>עצור ושלח</span>
              </button>
            </div>
          )}

          {/* Microphone Permission Error Banner */}
          {micPermissionError && (
            <div className="mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                  <MicOff className="w-4 h-4" /> {micPermissionError.title}
                </span>
                <button
                  onClick={() => setMicPermissionError(null)}
                  className="btn-icon-subtle text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p>{micPermissionError.details}</p>
            </div>
          )}

          {/* Quick Manager Audit Pills for Guy & Admins */}
          {isGuyOrAdmin && messages.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1">
              <button
                type="button"
                onClick={() => handleSendText("כמה אנשים תיעדו היום?")}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Users className="w-3 h-3 text-blue-600" />
                <span>כמה אנשים תיעדו היום?</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendText("ריכוז שבועי")}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <BarChart3 className="w-3 h-3 text-indigo-600" />
                <span>ריכוז שבועי</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendText("לבדוק תיעודים מהיום")}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>תיעודים מהיום</span>
              </button>
              <button
                type="button"
                onClick={() => setInputText("כמה שעות נעשו היום אצל לקוח ")}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-purple-600" />
                <span>שעות לפי לקוח...</span>
              </button>
            </div>
          )}

          {/* Floating Pill Input Bar */}
          <div className="w-full rounded-3xl bg-[#f0f4f9] hover:bg-[#e9eef6] focus-within:bg-white focus-within:shadow-xl border border-slate-200/90 transition-all p-2.5 pl-4 flex items-center gap-3">
            {/* Plus icon on right (start) */}
            <button
              type="button"
              onClick={handleNewChat}
              className="btn-icon-subtle w-9 h-9 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs cursor-pointer"
              title="נקה ופתח שיחה חדשה"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              disabled={loading || isRecording}
              placeholder={
                isRecording
                  ? "מקליט כעת (עד 2 דקות)..."
                  : isGuyOrAdmin
                  ? "שאל על שעות, בדוק תיעודי עובדים, בקש ריכוז שבועי או הזן דיווח..."
                  : "הזן דיווח טכני מפורט או הקלט הודעה קולית..."
              }
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none py-1.5"
            />

            {/* Microphone icon */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              className={`btn-icon-subtle w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-slate-500 hover:text-blue-600 hover:bg-white"
              }`}
              title={isRecording ? "עצור הקלטה" : "הקלט הודעה קולית"}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send icon if text */}
            {inputText.trim() && (
              <button
                onClick={() => handleSendText()}
                disabled={loading}
                className="btn-primary-subtle w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 -scale-x-100" />
              </button>
            )}
          </div>

          <div className="text-center mt-2 text-[11px] text-slate-400">
            Tech-Select Assistant &middot; דיווח שעות מקצועי מסונכרן ישירות ל-SharePoint ו-Excel
          </div>
        </div>
      </div>
    </div>
  );
};
