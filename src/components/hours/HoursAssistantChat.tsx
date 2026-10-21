import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ListChecks,
  Pencil,
  Check,
  Layers,
} from "lucide-react";
import {
  apiAssistantChat,
  HoursAssistantEntryDraft,
  WrittenEntryResult,
  AssistantChatResponse,
} from "../../services/hoursApiClient";
import { HoursEntryCard } from "./HoursEntryCard";
import { HoursErrorBoundary } from "./HoursErrorBoundary";

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
    id?: string;
    oid?: string;
    username?: string;
    upn?: string;
    isAdmin?: boolean;
  };
  onOpenTodaySummary?: () => void;
  onOpenMyLoggedHours?: () => void;
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
  if (raw.includes("אישור מפורש")) {
    return "נדרש אישור מפורש לפני הזנת הנתונים לקובץ.";
  }
  if (/[\u0590-\u05FF]/.test(originalMsg) && originalMsg.length > 8) {
    return originalMsg;
  }
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
  onOpenMyLoggedHours,
}) => {
  const isGuyOrAdmin = Boolean(
    currentUser.isAdmin ||
    currentUser.email?.toLowerCase() === "g@tech-select.co.il"
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  // Per-session loading map so multiple sessions can run concurrently in the background
  const [sessionLoadingMap, setSessionLoadingMap] = useState<
    Record<string, { loading: boolean; step: string }>
  >({});
  const [savingEditCardId, setSavingEditCardId] = useState<string | null>(null);

  // Active Drafts currently pending confirmation in the current session
  const [activeDrafts, setActiveDrafts] = useState<HoursAssistantEntryDraft[]>([]);
  // Written entries in the current session
  const [writtenEntries, setWrittenEntries] = useState<WrittenEntryResult[]>([]);

  // History & Collapsible Left Sidebar (10 recent sessions)
  const MAX_SAVED_SESSIONS = 10;
  const historyStorageKey = `tech_select_hours_history_v1_${currentUser?.email || "user"}`;

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) return false;
      const saved = localStorage.getItem("tech_select_hours_sidebar_open");
      if (saved !== null) return saved === "true";
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `sess_${Date.now()}`);
  const currentSessionIdRef = useRef<string>(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

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

  // Inline editing state for user messages in the chat feed
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>("");

  // Inline editing state for sidebar history items (10 recent documentations)
  const [editingSidebarSessionId, setEditingSidebarSessionId] = useState<string | null>(null);
  const [sidebarEditHours, setSidebarEditHours] = useState<number>(1);
  const [sidebarEditText, setSidebarEditText] = useState<string>("");
  const [isSavingSidebarEdit, setIsSavingSidebarEdit] = useState<boolean>(false);

  // Derived loading state for the currently viewed session
  const loading = Boolean(sessionLoadingMap[currentSessionId]?.loading);
  const loadingStep = sessionLoadingMap[currentSessionId]?.step || "מעבד בקשה...";

  // Count how many background sessions are currently processing
  const backgroundRunningSessions = Object.entries(sessionLoadingMap).filter(
    ([sessId, state]) => state?.loading && sessId !== currentSessionId
  );

  const setSessionLoading = useCallback((sessionId: string, isLoading: boolean, stepText?: string) => {
    setSessionLoadingMap((prev) => {
      if (!isLoading) {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      }
      return {
        ...prev,
        [sessionId]: {
          loading: true,
          step: stepText || prev[sessionId]?.step || "מעבד בקשה...",
        },
      };
    });
  }, []);

  // Helper to build a SavedChatSession object from messages/drafts/writtenEntries
  const buildSessionItem = useCallback(
    (
      sessionId: string,
      msgs: ChatMessage[],
      drafts: HoursAssistantEntryDraft[],
      written: WrittenEntryResult[],
      existingCreatedAt?: number
    ): SavedChatSession => {
      const firstUserMsg = msgs.find((m) => m.role === "user");
      let title = "שיחת דיווח";
      if (written && written.length > 0) {
        const lastW = written[written.length - 1];
        const cust = lastW.customerName || "לקוח";
        const hrs = lastW.durationHours ?? "";
        title = `${cust}${hrs ? ` (${hrs} ש׳)` : ""}`;
      } else if (drafts && drafts.length > 0) {
        const lastD = drafts[drafts.length - 1];
        const cust = lastD.customerName || "טיוטה";
        const hrs = lastD.durationHours ?? "";
        title = `${cust}${hrs ? ` (${hrs} ש׳)` : ""}`;
      } else if (firstUserMsg?.text) {
        const clean = firstUserMsg.text.replace(/[\r\n]+/g, " ").trim();
        title = clean.length > 32 ? clean.slice(0, 32) + "..." : clean;
      }

      return {
        id: sessionId,
        title,
        preview: firstUserMsg?.text || "",
        createdAt: existingCreatedAt || Date.now(),
        updatedAt: Date.now(),
        messages: msgs,
        activeDrafts: drafts,
        writtenEntries: written,
      };
    },
    []
  );

  // Scoped session state updater: updates either the foreground state (if targetSessionId is active)
  // AND/OR the background session in savedSessions so background requests never overwrite a newly opened '+' session
  const updateSessionState = useCallback(
    (
      targetSessionId: string,
      updater: (prev: {
        messages: ChatMessage[];
        activeDrafts: HoursAssistantEntryDraft[];
        writtenEntries: WrittenEntryResult[];
      }) => {
        messages: ChatMessage[];
        activeDrafts: HoursAssistantEntryDraft[];
        writtenEntries: WrittenEntryResult[];
      }
    ) => {
      setSavedSessions((prevSessions) => {
        const existingIdx = prevSessions.findIndex((s) => s.id === targetSessionId);
        const existingSession =
          existingIdx >= 0
            ? prevSessions[existingIdx]
            : {
                id: targetSessionId,
                title: "שיחת דיווח",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: [],
                activeDrafts: [],
                writtenEntries: [],
              };

        const nextState = updater({
          messages: existingSession.messages || [],
          activeDrafts: existingSession.activeDrafts || [],
          writtenEntries: existingSession.writtenEntries || [],
        });

        // If this session is currently displayed in the foreground, sync foreground states too
        if (currentSessionIdRef.current === targetSessionId) {
          setMessages(nextState.messages);
          setActiveDrafts(nextState.activeDrafts);
          setWrittenEntries(nextState.writtenEntries);
        }

        if (
          nextState.messages.length === 0 &&
          nextState.activeDrafts.length === 0 &&
          nextState.writtenEntries.length === 0
        ) {
          return prevSessions;
        }

        const updatedItem = buildSessionItem(
          targetSessionId,
          nextState.messages,
          nextState.activeDrafts,
          nextState.writtenEntries,
          existingSession.createdAt
        );

        let updatedList: SavedChatSession[];
        if (existingIdx >= 0) {
          const copy = [...prevSessions];
          copy[existingIdx] = updatedItem;
          // Move updated foreground session to top, or keep order if background
          if (currentSessionIdRef.current === targetSessionId) {
            const remaining = prevSessions.filter((s) => s.id !== targetSessionId);
            updatedList = [updatedItem, ...remaining].slice(0, MAX_SAVED_SESSIONS);
          } else {
            updatedList = copy.slice(0, MAX_SAVED_SESSIONS);
          }
        } else {
          updatedList = [updatedItem, ...prevSessions].slice(0, MAX_SAVED_SESSIONS);
        }

        try {
          localStorage.setItem(historyStorageKey, JSON.stringify(updatedList));
        } catch (err) {
          console.error("Failed to update localStorage history", err);
        }

        return updatedList;
      });
    },
    [buildSessionItem, historyStorageKey]
  );

  // Keep current foreground session synced to localStorage (up to 10 recent sessions)
  useEffect(() => {
    if (messages.length === 0 && activeDrafts.length === 0 && writtenEntries.length === 0) return;

    setSavedSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      const updatedItem = buildSessionItem(
        currentSessionId,
        messages,
        activeDrafts,
        writtenEntries,
        existingIdx >= 0 ? prev[existingIdx].createdAt : Date.now()
      );

      let updatedList: SavedChatSession[];
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedItem;
        updatedList = copy.slice(0, MAX_SAVED_SESSIONS);
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
  }, [messages, activeDrafts, writtenEntries, currentSessionId, historyStorageKey, buildSessionItem]);

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
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Gemini-style auto-expanding textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(scrollH, 24), 160)}px`;
  }, [inputText]);

  const scrollToBottom = () => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({
        top: feedContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 120);
    return () => clearTimeout(timer);
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
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(recordingTimerRef.current);
        setRecordingSeconds(0);
        setIsRecording(false);

        if (audioBlob.size < 100) {
          console.warn("[HoursVoice] Audio blob too small, likely empty.");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string)?.split(",")?.[1];
          if (base64Data) {
            handleSendAudio(base64Data, mimeType);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 119) {
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

  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? "0" + mins : mins}:${remainder < 10 ? "0" + remainder : remainder} / 02:00`;
  };

  // Scoped response handler that updates `targetSessionId` whether it is foreground or running in background
  const handleChatResponseForSession = useCallback(
    (
      targetSessionId: string,
      res: AssistantChatResponse,
      fromVoice: boolean,
      voiceMsgId?: string
    ) => {
      updateSessionState(targetSessionId, (prev) => {
        let nextMessages = [...prev.messages];
        let nextDrafts = [...prev.activeDrafts];
        let nextWritten = [...prev.writtenEntries];

        if (fromVoice) {
          const transcriptText = res.transcript ? `🎙️ "${res.transcript}"` : "🎙️ הקלטה קולית";
          if (voiceMsgId) {
            nextMessages = nextMessages.map((m) =>
              m.id === voiceMsgId ? { ...m, text: transcriptText } : m
            );
          } else {
            nextMessages.push({
              id: `user_trans_${Date.now()}`,
              role: "user",
              text: transcriptText,
              isVoice: true,
              timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
            });
          }
        }

        const existingWrittenIds = new Set<string>([
          ...nextWritten.map((w) => w.id),
          ...nextMessages.flatMap((m) => (m.writtenEntries || []).map((w) => w.id)),
        ]);
        const newlyWrittenThisTurn = (res.writtenEntries || []).filter(
          (w) => !existingWrittenIds.has(w.id)
        );

        if (res.isConfirmed) {
          nextDrafts = res.drafts || [];
        } else if (res.drafts && res.drafts.length > 0) {
          const incomingCustomers = new Set(
            res.drafts.map((d) => (d.customerName || "").trim().toLowerCase())
          );
          const incomingIds = new Set(res.drafts.map((d) => d.id));
          const keptPrev = nextDrafts.filter(
            (p) =>
              !incomingIds.has(p.id) &&
              !incomingCustomers.has((p.customerName || "").trim().toLowerCase())
          );
          nextDrafts = [...keptPrev, ...res.drafts];
        }

        if (newlyWrittenThisTurn.length > 0) {
          for (const item of newlyWrittenThisTurn) {
            if (!nextWritten.some((m) => m.id === item.id)) {
              nextWritten.push(item);
            }
          }
        }

        // Also sync updated written entries if an existing entry was edited
        if (res.writtenEntries && res.writtenEntries.length > 0 && newlyWrittenThisTurn.length === 0) {
          const updatedMap = new Map(res.writtenEntries.map((w) => [w.id, w]));
          nextWritten = nextWritten.map((w) => updatedMap.get(w.id) || w);
          nextMessages = nextMessages.map((msg) => {
            if (!msg.writtenEntries) return msg;
            return {
              ...msg,
              writtenEntries: msg.writtenEntries.map((w) => updatedMap.get(w.id) || w),
            };
          });
        }

        if (res.undoneCardIds && res.undoneCardIds.length > 0) {
          nextWritten = nextWritten.filter((w) => !res.undoneCardIds.includes(w.id));
          nextMessages = nextMessages.map((msg) => {
            if (!msg.writtenEntries) return msg;
            const remaining = msg.writtenEntries.filter((w) => !res.undoneCardIds.includes(w.id));
            return {
              ...msg,
              writtenEntries: remaining.length > 0 ? remaining : undefined,
            };
          });
        }

        if (res.reply) {
          const cleanedPrev = nextMessages.map((m) =>
            m.drafts ? { ...m, drafts: undefined } : m
          );
          nextMessages = [
            ...cleanedPrev,
            {
              id: `model_${Date.now()}`,
              role: "model",
              text: res.reply,
              writtenEntries:
                newlyWrittenThisTurn.length > 0 ? newlyWrittenThisTurn : undefined,
              timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
            },
          ];
        }

        return {
          messages: nextMessages,
          activeDrafts: nextDrafts,
          writtenEntries: nextWritten,
        };
      });
    },
    [updateSessionState]
  );

  // Send Audio payload to backend (scoped to targetSessionId so it can complete in background)
  const handleSendAudio = async (base64Audio: string, mimeType: string) => {
    const targetSessionId = currentSessionIdRef.current;
    let stepTimer1: any = null;
    let stepTimer2: any = null;

    const voiceMsgId = `voice_${Date.now()}`;
    const userVoiceMessage: ChatMessage = {
      id: voiceMsgId,
      role: "user",
      text: "🎙️ הקלטה קולית... מעבד ומפענח",
      isVoice: true,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };

    const snapshotHistory = messages
      .filter((m) => m.id !== "welcome" && m.id !== voiceMsgId)
      .slice(-8)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));
    const snapshotDrafts = [...activeDrafts];
    const snapshotWritten = [...writtenEntries];

    updateSessionState(targetSessionId, (prev) => ({
      ...prev,
      messages: [...prev.messages, userVoiceMessage],
    }));

    try {
      setSessionLoading(targetSessionId, true, "מתמלל ומפענח הקלטה קולית...");

      stepTimer1 = setTimeout(() => {
        setSessionLoading(targetSessionId, true, "מאתר לקוחות ותיקיות ב-SharePoint...");
      }, 3000);

      stepTimer2 = setTimeout(() => {
        setSessionLoading(targetSessionId, true, "בודק כפילויות ומכין כרטיס דיווח...");
      }, 6500);

      const res = await apiAssistantChat({
        user: currentUser,
        audio: {
          data: base64Audio,
          mimeType,
        },
        history: snapshotHistory,
        activeDrafts: snapshotDrafts,
        writtenEntries: snapshotWritten,
      });

      handleChatResponseForSession(targetSessionId, res, true, voiceMsgId);
    } catch (err: any) {
      console.error("[handleSendAudio] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      updateSessionState(targetSessionId, (prev) => ({
        ...prev,
        messages: [
          ...prev.messages.map((m) =>
            m.id === voiceMsgId
              ? { ...m, text: "🎙️ הקלטה קולית (אירעה שגיאה בעיבוד)" }
              : m
          ),
          {
            id: `err_${Date.now()}`,
            role: "model",
            text: friendlyMsg,
            timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    } finally {
      if (stepTimer1) clearTimeout(stepTimer1);
      if (stepTimer2) clearTimeout(stepTimer2);
      setSessionLoading(targetSessionId, false);
    }
  };

  // Send Text payload to backend (scoped to targetSessionId so parallel sessions run in background)
  const handleSendText = async (textToSend?: string, overrideSessionId?: string) => {
    const targetSessionId = overrideSessionId || currentSessionIdRef.current;
    const isTargetLoading = Boolean(sessionLoadingMap[targetSessionId]?.loading);
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || isTargetLoading) return;

    if (!overrideSessionId && textToSend === undefined) {
      setInputText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }

    const userMsgId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };

    const targetSessObj = savedSessions.find((s) => s.id === targetSessionId);
    const baseMessages =
      targetSessionId === currentSessionIdRef.current
        ? messages
        : targetSessObj?.messages || [];
    const baseDrafts =
      targetSessionId === currentSessionIdRef.current
        ? activeDrafts
        : targetSessObj?.activeDrafts || [];
    const baseWritten =
      targetSessionId === currentSessionIdRef.current
        ? writtenEntries
        : targetSessObj?.writtenEntries || [];

    const history = baseMessages
      .filter((m) => m.id !== "welcome")
      .slice(-8)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    updateSessionState(targetSessionId, (prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    let stepTimer1: any = null;
    let stepTimer2: any = null;
    let stepTimer3: any = null;

    try {
      setSessionLoading(targetSessionId, true, "מנתח הודעה ובודק נתונים...");

      stepTimer1 = setTimeout(() => {
        setSessionLoading(targetSessionId, true, "מאתר לקוחות ותיקיות ב-SharePoint...");
      }, 3000);

      stepTimer2 = setTimeout(() => {
        setSessionLoading(targetSessionId, true, "בודק קובץ Excel וכפילויות...");
      }, 7000);

      stepTimer3 = setTimeout(() => {
        setSessionLoading(targetSessionId, true, "מכין כרטיס סיכום להזנה...");
      }, 14000);

      const res = await apiAssistantChat({
        user: currentUser,
        message: text,
        history,
        activeDrafts: baseDrafts,
        writtenEntries: baseWritten,
      });

      handleChatResponseForSession(targetSessionId, res, false);
    } catch (err: any) {
      console.error("[handleSendText] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      updateSessionState(targetSessionId, (prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `err_${Date.now()}`,
            role: "model",
            text: friendlyMsg,
            timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    } finally {
      if (stepTimer1) clearTimeout(stepTimer1);
      if (stepTimer2) clearTimeout(stepTimer2);
      if (stepTimer3) clearTimeout(stepTimer3);
      setSessionLoading(targetSessionId, false);
    }
  };

  // Direct Card Confirmation Handler (scoped to targetSessionId)
  const handleConfirmEntry = async (cardId: string, directDraft?: HoursAssistantEntryDraft) => {
    const targetSessionId = currentSessionIdRef.current;
    try {
      setSessionLoading(targetSessionId, true, "רושם שורה בגיליון ה-Excel וב-Lists...");

      const targetDraft =
        directDraft ||
        activeDrafts.find((d) => d.id === cardId) ||
        messages.flatMap((m) => m.drafts || []).find((d) => d.id === cardId);

      const mergedActiveDrafts = activeDrafts.map((d) =>
        d.id === cardId && targetDraft ? targetDraft : d
      );
      if (targetDraft && !mergedActiveDrafts.some((d) => d.id === cardId)) {
        mergedActiveDrafts.push(targetDraft);
      }

      const res = await apiAssistantChat({
        user: currentUser,
        action: "confirm_entry",
        cardId,
        draftData: targetDraft,
        activeDrafts: mergedActiveDrafts,
        writtenEntries,
      });

      handleChatResponseForSession(targetSessionId, res, false);
    } catch (err: any) {
      console.error("[handleConfirmEntry] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      updateSessionState(targetSessionId, (prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `err_${Date.now()}`,
            role: "model",
            text: friendlyMsg,
            timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    } finally {
      setSessionLoading(targetSessionId, false);
    }
  };

  // Direct Card Undo Handler (scoped to targetSessionId)
  const handleUndoEntry = async (cardId: string, directEntry?: WrittenEntryResult) => {
    const targetSessionId = currentSessionIdRef.current;
    try {
      setSessionLoading(targetSessionId, true, "מבטל שורה מגיליון ה-Excel...");

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
            listItemId: targetEntry.listItemId,
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

      handleChatResponseForSession(targetSessionId, res, false);
    } catch (err: any) {
      console.error("[handleUndoEntry] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      updateSessionState(targetSessionId, (prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `err_${Date.now()}`,
            role: "model",
            text: friendlyMsg,
            timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    } finally {
      setSessionLoading(targetSessionId, false);
    }
  };

  // Direct Written Card Edit Handler (Updates Microsoft Lists + SharePoint Excel)
  const handleEditWrittenEntry = async (
    cardId: string,
    updates: {
      durationHours: number;
      description: string;
      startTime?: string;
      endTime?: string;
      workType?: string;
    },
    entry?: WrittenEntryResult,
    targetSessionOverride?: string
  ) => {
    const targetSessionId = targetSessionOverride || currentSessionIdRef.current;
    try {
      setSavingEditCardId(cardId);
      setSessionLoading(targetSessionId, true, "מעדכן שעות ותיעוד ב-Lists וב-Excel...");

      const targetSessObj = savedSessions.find((s) => s.id === targetSessionId);
      const sessWritten =
        targetSessionId === currentSessionIdRef.current
          ? writtenEntries
          : targetSessObj?.writtenEntries || [];
      const sessMessages =
        targetSessionId === currentSessionIdRef.current
          ? messages
          : targetSessObj?.messages || [];

      const targetEntry =
        entry ||
        sessWritten.find((w) => w.id === cardId || w.entryId === cardId) ||
        sessMessages
          .flatMap((m) => m.writtenEntries || [])
          .find((w) => w.id === cardId || w.entryId === cardId);

      const mergedWritten = [
        ...(targetEntry ? [targetEntry] : []),
        ...sessWritten,
        ...sessMessages.flatMap((m) => m.writtenEntries || []),
      ].filter((w, idx, arr) => arr.findIndex((x) => x.id === w.id) === idx);

      const res = await apiAssistantChat({
        user: currentUser,
        action: "edit_entry",
        cardId: targetEntry?.id || cardId,
        editData: {
          cardId: targetEntry?.id || cardId,
          listItemId: targetEntry?.listItemId,
          driveId: targetEntry?.driveId,
          itemId: targetEntry?.itemId || targetEntry?.fileId,
          fileId: targetEntry?.fileId,
          sheetName: targetEntry?.sheetName,
          rowAddress: targetEntry?.rowAddress,
          targetRow: targetEntry?.targetRow,
          customerName: targetEntry?.customerName,
          date: targetEntry?.date,
          employeeName: targetEntry?.employeeName || currentUser.name,
          durationHours: updates.durationHours,
          description: updates.description,
          startTime: updates.startTime ?? targetEntry?.startTime,
          endTime: updates.endTime ?? targetEntry?.endTime,
          workType: updates.workType ?? targetEntry?.workType,
        },
        writtenEntries: mergedWritten,
      });

      handleChatResponseForSession(targetSessionId, res, false);
    } catch (err: any) {
      console.error("[handleEditWrittenEntry] Error:", err);
      const friendlyMsg = getFriendlyHebrewErrorMessage(err);
      updateSessionState(targetSessionId, (prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `err_${Date.now()}`,
            role: "model",
            text: friendlyMsg,
            timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    } finally {
      setSavingEditCardId(null);
      setSessionLoading(targetSessionId, false);
    }
  };

  // Update in-line draft
  const handleUpdateDraft = (updated: HoursAssistantEntryDraft) => {
    updateSessionState(currentSessionIdRef.current, (prev) => ({
      ...prev,
      activeDrafts: prev.activeDrafts.map((d) => (d.id === updated.id ? updated : d)),
      messages: prev.messages.map((msg) => ({
        ...msg,
        drafts: msg.drafts?.map((d) => (d.id === updated.id ? updated : d)),
      })),
    }));
  };

  // Save edited user message in the chat feed and re-run assistant analysis
  const handleSaveEditedUserMessage = async (msgId: string) => {
    const trimmed = editingMsgText.trim();
    if (!trimmed) return;
    setEditingMsgId(null);

    updateSessionState(currentSessionIdRef.current, (prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === msgId ? { ...m, text: trimmed } : m)),
    }));

    // If this session already has a written entry, or if user wants to re-evaluate the message, send updated prompt
    await handleSendText(`עדכון לדיווח: ${trimmed}`);
  };

  // Open inline editor for one of the 10 recent sessions in the sidebar
  const handleOpenSidebarEdit = (e: React.MouseEvent, sess: SavedChatSession) => {
    e.stopPropagation();
    if (editingSidebarSessionId === sess.id) {
      setEditingSidebarSessionId(null);
      return;
    }

    const allWritten = [
      ...(sess.writtenEntries || []),
      ...(sess.messages || []).flatMap((m) => m.writtenEntries || []),
    ];
    const lastWritten = allWritten[allWritten.length - 1];
    const lastDraft = (sess.activeDrafts || [])[(sess.activeDrafts || []).length - 1];
    const firstUserMsg = (sess.messages || []).find((m) => m.role === "user");

    setEditingSidebarSessionId(sess.id);
    if (lastWritten) {
      setSidebarEditHours(lastWritten.durationHours || 1);
      setSidebarEditText(lastWritten.description || firstUserMsg?.text || "");
    } else if (lastDraft) {
      setSidebarEditHours(lastDraft.durationHours || 1);
      setSidebarEditText(lastDraft.description || firstUserMsg?.text || "");
    } else {
      setSidebarEditHours(1);
      setSidebarEditText(firstUserMsg?.text || sess.preview || "");
    }
  };

  // Save inline edit from the sidebar (updates WrittenEntry in Lists/Excel, or Draft, or User Message)
  const handleSaveSidebarSessionEdit = async (e: React.MouseEvent, sess: SavedChatSession) => {
    e.stopPropagation();
    const cleanText = sidebarEditText.trim();
    if (!cleanText) return;

    setIsSavingSidebarEdit(true);
    try {
      const allWritten = [
        ...(sess.writtenEntries || []),
        ...(sess.messages || []).flatMap((m) => m.writtenEntries || []),
      ];
      const lastWritten = allWritten[allWritten.length - 1];
      const lastDraft = (sess.activeDrafts || [])[(sess.activeDrafts || []).length - 1];

      if (lastWritten) {
        await handleEditWrittenEntry(
          lastWritten.id,
          {
            durationHours: Number(sidebarEditHours) || lastWritten.durationHours || 1,
            description: cleanText,
          },
          lastWritten,
          sess.id
        );
      } else if (lastDraft) {
        const updatedDraft: HoursAssistantEntryDraft = {
          ...lastDraft,
          durationHours: Number(sidebarEditHours) || lastDraft.durationHours || 1,
          description: cleanText,
        };
        updateSessionState(sess.id, (prev) => ({
          ...prev,
          activeDrafts: prev.activeDrafts.map((d) =>
            d.id === updatedDraft.id ? updatedDraft : d
          ),
          messages: prev.messages.map((m, idx) =>
            idx === 0 && m.role === "user" ? { ...m, text: cleanText } : m
          ),
        }));
      } else {
        // Edit user message and re-process in that session
        updateSessionState(sess.id, (prev) => ({
          ...prev,
          messages: prev.messages.map((m, idx) =>
            idx === 0 && m.role === "user" ? { ...m, text: cleanText } : m
          ),
        }));
        handleSelectSession(sess);
        setTimeout(() => {
          handleSendText(cleanText, sess.id);
        }, 50);
      }
      setEditingSidebarSessionId(null);
    } finally {
      setIsSavingSidebarEdit(false);
    }
  };

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

  // Opens a brand new parallel session while keeping any running session alive in the background
  const handleNewChat = () => {
    const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    currentSessionIdRef.current = newId;
    setCurrentSessionId(newId);
    setMessages([]);
    setActiveDrafts([]);
    setWrittenEntries([]);
    setInputText("");
    setEditingMsgId(null);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = (session: SavedChatSession) => {
    currentSessionIdRef.current = session.id;
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setActiveDrafts(session.activeDrafts || []);
    setWrittenEntries(session.writtenEntries || []);
    setInputText("");
    setEditingMsgId(null);
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

      {/* LEFT SIDEBAR: Gemini Conversation History (Save 10, Inline Edit, Parallel Status) */}
      <aside
        dir="rtl"
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          ${isSidebarOpen ? "w-80 border-r border-slate-200/90" : "w-0 border-r-0"}
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
              <h2 className="text-xs font-bold text-slate-800 leading-tight">היסטוריית תיעודים</h2>
              <span className="text-[10px] text-slate-500">10 תיעודים אחרונים · ניתן לעריכה</span>
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

        {/* New Parallel Session Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleNewChat}
            className="btn-hover-subtle w-full py-2.5 px-3.5 rounded-2xl bg-white hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 text-slate-700 hover:text-blue-700 shadow-2xs flex items-center justify-between text-xs font-semibold cursor-pointer group"
            title="פתח סשן תיעוד חדש במקביל (הסשן הקודם ימשיך לרוץ ברקע)"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <span className="block">סשן תיעוד חדש (+)</span>
                <span className="block text-[10px] font-normal text-slate-400 group-hover:text-blue-500">
                  פתיחת תיעוד במקביל ברקע
                </span>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>

        {/* Recent Sessions List Header */}
        <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 shrink-0">
          <span>10 תיעודים אחרונים</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
            {savedSessions.length}/10
          </span>
        </div>

        {/* Sessions List (Max 10) */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          {savedSessions.length === 0 ? (
            <div className="py-8 px-3 text-center text-slate-400 flex flex-col items-center">
              <MessageSquare className="w-6 h-6 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-medium text-slate-500">אין עדיין תיעודים שמורים</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[190px]">
                שיחות ותיעודים יישמרו כאן אוטומטית (עד 10 אחרונים) עם אפשרות עריכה.
              </p>
            </div>
          ) : (
            savedSessions.map((sess) => {
              const isActive = currentSessionId === sess.id;
              const isSessLoading = Boolean(sessionLoadingMap[sess.id]?.loading);
              const hasDrafts = (sess.activeDrafts || []).length > 0;
              const allWritten = [
                ...(sess.writtenEntries || []),
                ...(sess.messages || []).flatMap((m) => m.writtenEntries || []),
              ];
              const lastWritten = allWritten[allWritten.length - 1];
              const lastDraft = (sess.activeDrafts || [])[(sess.activeDrafts || []).length - 1];
              const displayHours = lastWritten?.durationHours ?? lastDraft?.durationHours;
              const isEditingThis = editingSidebarSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess)}
                  role="button"
                  className={`
                    history-item-subtle w-full p-2.5 rounded-xl border text-right cursor-pointer flex flex-col gap-1.5 group transition-all
                    ${
                      isActive
                        ? "bg-blue-50/95 border-blue-300 text-blue-950 shadow-2xs font-medium"
                        : "bg-white/85 hover:bg-white border-slate-200/80 text-slate-700 hover:text-slate-900 shadow-2xs"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSessLoading
                            ? "bg-amber-100 text-amber-700"
                            : isActive
                            ? "bg-blue-600 text-white"
                            : lastWritten
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500 group-hover:text-blue-600"
                        }`}
                      >
                        {isSessLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : lastWritten ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs truncate font-semibold">
                            {sess.title || "שיחת דיווח"}
                          </p>
                          {displayHours !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-100/80 text-blue-800 text-[10px] font-bold shrink-0">
                              {displayHours} ש׳
                            </span>
                          )}
                        </div>

                        {sess.preview && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {sess.preview}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(sess.updatedAt || sess.createdAt)}
                          </span>
                          {isSessLoading && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-semibold animate-pulse">
                              רץ ברקע...
                            </span>
                          )}
                          {!isSessLoading && hasDrafts && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-semibold">
                              ממתין לאישור
                            </span>
                          )}
                          {!isSessLoading && !hasDrafts && lastWritten && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              נרשם ב-Lists
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenSidebarEdit(e, sess)}
                        className="btn-icon-subtle p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-100/70 transition-colors cursor-pointer"
                        title="ערוך שעות או הודעה שתיעדת"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="btn-icon-subtle p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="מחק שיחה זו"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Edit Drawer inside Sidebar Item */}
                  {isEditingThis && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 pt-2 border-t border-slate-200/90 bg-white rounded-xl p-2.5 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-blue-600" />
                          <span>
                            {lastWritten
                              ? "עריכת שעות / תיעוד (Lists + Excel)"
                              : "עריכת שעות / הודעת תיעוד"}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSidebarSessionId(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {(lastWritten || lastDraft) && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            כמות שעות לחיוב:
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                              type="number"
                              step="0.25"
                              min="0.25"
                              max="12"
                              value={sidebarEditHours}
                              onChange={(e) => setSidebarEditHours( parseFloat(e.target.value) || 0.25 )}
                              className="w-20 px-2 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-center"
                            />
                            {[0.5, 1, 1.5, 2, 3].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setSidebarEditHours(preset)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                                  Number(sidebarEditHours) === preset
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {preset} ש׳
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          תיאור הפעילות / ההודעה שתועדה:
                        </label>
                        <textarea
                          rows={2}
                          value={sidebarEditText}
                          onChange={(e) => setSidebarEditText(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                          placeholder="עדכן את תיאור העבודה או ההודעה..."
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSidebarSessionId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          ביטול
                        </button>
                        <button
                          type="button"
                          disabled={isSavingSidebarEdit}
                          onClick={(e) => handleSaveSidebarSessionEdit(e, sess)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          {isSavingSidebarEdit ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>{lastWritten ? "שמור ועדכן ב-Lists" : "שמור שינויים"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/70 bg-white/40 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">נשמרות 10 שיחות אחרונות</span>
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
      <div dir="rtl" className="flex-1 h-full flex flex-col justify-between overflow-hidden relative text-right min-w-0">
        {/* Top Status Bar */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b border-slate-200/60 bg-white/80 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="btn-icon-subtle px-2 py-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1.5 border border-slate-200/80 shadow-2xs shrink-0"
              title={isSidebarOpen ? "צמצם היסטוריה" : "פתח היסטוריית שיחות (10 אחרונות)"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                {isSidebarOpen ? "צמצם" : `היסטוריה (${savedSessions.length}/10)`}
              </span>
            </button>

            <div className="hidden sm:flex w-6 h-6 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] items-center justify-center text-white shadow-2xs shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 whitespace-nowrap">
              שעות לחיוב לקוח
            </span>

            {activeDrafts.length > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                <span>{activeDrafts.length} טיוטות</span>
              </span>
            )}

            {/* Background Running Sessions Indicator Pill */}
            {backgroundRunningSessions.length > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 animate-pulse">
                <RefreshCw className="w-3 h-3 text-amber-600 animate-spin shrink-0" />
                <span>{backgroundRunningSessions.length} סשנים רצים ברקע</span>
              </span>
            )}

            {/* Per-User "כמה תיעדתי היום" Quick Button */}
            {onOpenMyLoggedHours && (
              <button
                onClick={onOpenMyLoggedHours}
                className="hidden sm:flex btn-hover-subtle text-xs px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold items-center gap-1 cursor-pointer transition-colors shadow-2xs mr-1 whitespace-nowrap shrink-0"
                title="בדוק וערוך כמה תיעדת היום ובכל יום לפי Microsoft Lists"
              >
                <ListChecks className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>כמה תיעדתי היום</span>
              </button>
            )}

            {/* Manager Today Hours Summary Quick Button */}
            {isGuyOrAdmin && onOpenTodaySummary && (
              <button
                onClick={onOpenTodaySummary}
                className="hidden sm:flex btn-hover-subtle text-xs px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold items-center gap-1 cursor-pointer transition-colors shadow-2xs mr-1 whitespace-nowrap shrink-0"
                title="דוח וריכוז שעות עבודה יומי לכל העובדים"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>שעות היום (מנהל)</span>
              </button>
            )}
          </div>

          <button
            onClick={handleNewChat}
            className="btn-hover-subtle flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full bg-blue-600 hover:bg-blue-700 text-[11px] sm:text-xs text-white font-semibold cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="פתח סשן תיעוד חדש במקביל (הסשן הקודם ימשיך לרוץ ברקע)"
          >
            <Plus className="w-3.5 h-3.5 text-white shrink-0" />
            <span>סשן חדש במקביל</span>
          </button>
        </div>

        {/* Parallel Multi-Session Switcher Bar (Allows switching between active/background sessions easily) */}
        {(savedSessions.length > 0 || backgroundRunningSessions.length > 0) && (
          <div className="px-3 sm:px-6 py-1.5 bg-slate-100/80 border-b border-slate-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 shrink-0 ml-1">
              <Layers className="w-3 h-3 text-blue-600" />
              <span>סשנים במקביל:</span>
            </span>

            {/* Current New/Unsaved Session Tab if empty */}
            {!savedSessions.some((s) => s.id === currentSessionId) && (
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>סשן נוכחי (חדש)</span>
              </button>
            )}

            {savedSessions.slice(0, 6).map((sess) => {
              const isCurrent = sess.id === currentSessionId;
              const isRunning = Boolean(sessionLoadingMap[sess.id]?.loading);
              const pendingDraftsCount = (sess.activeDrafts || []).length;

              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => handleSelectSession(sess)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                    isCurrent
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : isRunning
                      ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                      : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
                  }`}
                >
                  {isRunning && (
                    <RefreshCw
                      className={`w-3 h-3 animate-spin ${
                        isCurrent ? "text-white" : "text-amber-600"
                      }`}
                    />
                  )}
                  <span className="max-w-[120px] truncate">{sess.title || "שיחת דיווח"}</span>
                  {pendingDraftsCount > 0 && !isRunning && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        isCurrent ? "bg-white/25 text-white" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {pendingDraftsCount} לאישור
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleNewChat}
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-600 border border-dashed border-blue-300 flex items-center gap-1 shrink-0 cursor-pointer"
              title="פתח סשן נוסף במקביל"
            >
              <Plus className="w-3 h-3" />
              <span>+</span>
            </button>
          </div>
        )}

        {/* Content Area: If empty -> Greeting, else -> Message Feed */}
        {messages.length === 0 && activeDrafts.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto my-auto px-4 py-4 overflow-y-auto relative">
            {/* Soft Ethereal Glow in the Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] sm:w-[34rem] h-[16rem] sm:h-[22rem] bg-gradient-to-tr from-sky-200/35 via-purple-100/30 to-indigo-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Sparkles Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-3.5 sm:mb-5 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>

            {/* Big Gemini Headline */}
            <div className="text-center w-full max-w-xl">
              <h1 className="text-2xl sm:text-5xl font-bold sm:font-medium tracking-tight mb-2 sm:mb-3">
                <span className="bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] bg-clip-text text-transparent">
                  {greeting}, {firstName}
                </span>
              </h1>
              <p className="text-sm sm:text-xl font-normal text-slate-500 mb-5 sm:mb-6 px-2">
                איך אוכל לעזור לך לתעד שעות לחיוב לקוח היום?
              </p>

              {/* Quick Starter Suggestion Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                {onOpenMyLoggedHours && (
                  <button
                    onClick={onOpenMyLoggedHours}
                    className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-1.5 rounded-2xl sm:rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/90 text-xs text-emerald-900 font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <ListChecks className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                    <span>כמה תיעדתי היום (וצפייה/עריכה ב-Lists)</span>
                  </button>
                )}
                {isGuyOrAdmin ? (
                  <>
                    <button
                      onClick={() => handleSendText("כמה אנשים תיעדו היום?")}
                      className="px-3.5 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>כמה אנשים תיעדו היום?</span>
                    </button>
                    <button
                      onClick={() => handleSendText("ריכוז שבועי")}
                      className="px-3.5 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>ריכוז שבועי</span>
                    </button>
                    <button
                      onClick={() => handleSendText("כמה שעות נרשמו היום?")}
                      className="px-3.5 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>כמה שעות נרשמו היום?</span>
                    </button>
                    <button
                      onClick={() => handleSendText("דוח שעות לאתמול")}
                      className="px-3.5 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>דוח שעות לאתמול</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto justify-center">
                    <button
                      onClick={() => setInputText("הייתי היום שעתיים בביקור אצל ")}
                      className="px-3.5 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer text-center"
                    >
                      🚗 ביקור פיזי אצל לקוח
                    </button>
                    <button
                      onClick={() => setInputText("שעה תמיכה מרחוק וטלפון עם ")}
                      className="px-3.5 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer text-center"
                    >
                      💻 תמיכה מרחוק וטיקטים
                    </button>
                    <button
                      onClick={() => setInputText("3 שעות בפרויקט שדרוג אצל ")}
                      className="px-3.5 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-2xs cursor-pointer text-center"
                    >
                      📁 פרויקט והקמה
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Messages Feed: Full Viewport Width, Comfortable Centered Max-Width Reading Column */
          <div ref={feedContainerRef} className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-4 sm:py-6 scroll-smooth">
            <div className="max-w-3xl mx-auto w-full space-y-4 sm:space-y-6">
              {(() => {
                const seenWrittenIds = new Set<string>();
                return messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const uniqueWrittenForMsg = (msg.writtenEntries || []).filter((w) => {
                    if (seenWrittenIds.has(w.id)) return false;
                    seenWrittenIds.add(w.id);
                    return true;
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-start" : "items-stretch"} space-y-2`}
                    >
                      {/* User Message Bubble (with Inline Edit option) */}
                      {isUser ? (
                        <div className="bg-[#f0f4f9] text-slate-900 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base leading-relaxed max-w-[92%] sm:max-w-[85%] shadow-2xs group relative">
                          {msg.isVoice && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1.5 font-semibold pb-1 border-b border-slate-200">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>תמלול קולי</span>
                            </div>
                          )}

                          {editingMsgId === msg.id ? (
                            <div className="space-y-2 min-w-[240px] sm:min-w-[340px]">
                              <textarea
                                rows={2}
                                value={editingMsgText}
                                onChange={(e) => setEditingMsgText(e.target.value)}
                                className="w-full p-2 text-sm bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
                                >
                                  ביטול
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedUserMessage(msg.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>עדכן ושלח</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-line break-words">{msg.text}</p>
                              <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-slate-200/60">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMsgId(msg.id);
                                    setEditingMsgText(msg.text.replace(/^🎙️\s*"?|"?$/g, ""));
                                  }}
                                  className="text-[11px] text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                  title="ערוך את ההודעה שתיעדת"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>ערוך הודעה</span>
                                </button>
                                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Model / Assistant Message: Gemini Canvas Style */
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-3 w-full min-w-0">
                          {/* Gemini Sparkles Avatar */}
                          <div className="flex items-center gap-2 sm:block shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] text-white flex items-center justify-center shrink-0 shadow-2xs sm:mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 sm:hidden">עוזר שעות לחיוב</span>
                          </div>

                          <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
                            <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal px-0.5 sm:px-0">
                              <p className="whitespace-pre-line break-words">{msg.text}</p>
                            </div>

                            {/* Render Confirmed Written Entries for this turn (with Edit & Undo support) */}
                            {uniqueWrittenForMsg.length > 0 && (
                              <div className="w-full space-y-2 pt-1">
                                {uniqueWrittenForMsg.map((w) => (
                                  <HoursErrorBoundary key={w.id} fallbackTitle="שגיאה בטעינת כרטיס שורה שנרשמה">
                                    <HoursEntryCard
                                      written={w}
                                      currentUser={currentUser}
                                      onUndo={(id, entry) => handleUndoEntry(id, entry || w)}
                                      onEditWritten={(cardId, updates, entry) =>
                                        handleEditWrittenEntry(cardId, updates, entry || w)
                                      }
                                      isSavingWrittenEdit={savingEditCardId === w.id}
                                      isUndoing={loading}
                                    />
                                  </HoursErrorBoundary>
                                ))}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 px-0.5 sm:px-0">
                              {msg.timestamp}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Pending Active Drafts ALWAYS pinned at the VERY BOTTOM of the feed */}
              {activeDrafts.length > 0 && (
                <div className="w-full space-y-3 pt-1 sm:pt-2 pr-0 sm:pr-11">
                  {activeDrafts.length > 1 && (
                    <div className="text-xs text-blue-600 font-semibold mb-1">
                      טיוטות לחיוב לקוח ממתינות לאישורך ({activeDrafts.length}):
                    </div>
                  )}
                  {activeDrafts.map((d) => (
                    <HoursErrorBoundary key={d.id} fallbackTitle="שגיאה בטעינת כרטיס הדיווח">
                      <HoursEntryCard
                        draft={d}
                        currentUser={currentUser}
                        onConfirm={handleConfirmEntry}
                        onUpdateDraft={handleUpdateDraft}
                        isConfirming={loading}
                      />
                    </HoursErrorBoundary>
                  ))}
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 max-w-full sm:max-w-[80%] shadow-xs animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                    <span className="text-xs text-slate-700 font-medium">{loadingStep}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="פתח תיעוד נוסף במקביל בזמן שהבקשה הזו ממשיכה לרוץ ברקע"
                  >
                    <Plus className="w-3 h-3" />
                    <span>תעד עוד במקביל</span>
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Docked Floating Pill Input at the Bottom */}
        <div className="w-full max-w-3xl mx-auto px-2.5 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-4 pt-1.5 sm:pt-2 shrink-0 bg-gradient-to-t from-[#f8fafd] via-[#f8fafd] to-transparent">
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

          {/* Floating Pill Input Bar (Gemini Style - Clean & Auto-expanding) */}
          <div className="w-full rounded-[28px] sm:rounded-[32px] bg-[#f0f4f9] hover:bg-[#e9eef6] focus-within:bg-white focus-within:shadow-xl focus-within:border-slate-300 border border-slate-200/90 transition-all p-2 sm:p-2.5 pl-3 sm:pl-3.5 flex items-end gap-2 sm:gap-2.5 shadow-2xs">
            {/* Plus icon on right (start) - Always enabled so user can open a parallel session anytime */}
            <button
              type="button"
              onClick={handleNewChat}
              className="btn-icon-subtle w-9 h-9 rounded-full bg-white hover:bg-blue-600 hover:text-white flex items-center justify-center text-blue-600 border border-blue-200 shrink-0 shadow-xs cursor-pointer self-end mb-0.5 transition-colors"
              title="פתח סשן תיעוד חדש במקביל (+ הסשן הנוכחי ימשיך לרוץ ברקע)"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Text Input - Gemini Auto-expanding & Clean, never clipped */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              disabled={loading || isRecording}
              dir="rtl"
              rows={1}
              placeholder={
                isRecording
                  ? "מקליט כעת (עד 2 דקות)..."
                  : loading
                  ? "מעבד בסשן זה... לחץ על + מימין לפתיחת תיעוד נוסף במקביל"
                  : isGuyOrAdmin
                  ? "שאל על שעות, בדוק תיעודי עובדים, בקש ריכוז שבועי או הזן דיווח..."
                  : "הזן דיווח טכני מפורט או הקלט הודעה קולית..."
              }
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-[15px] leading-relaxed focus:outline-none py-1.5 px-2 resize-none overflow-y-auto max-h-40 min-h-[28px] box-border"
            />

            {/* Actions Group (Microphone & Send) - Pinned cleanly at bottom */}
            <div className="flex items-center gap-1.5 shrink-0 self-end mb-0.5">
              {/* Microphone icon */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`btn-icon-subtle w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-slate-500 hover:text-blue-600 hover:bg-white shadow-2xs"
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
                  className="btn-primary-subtle w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-all animate-in fade-in zoom-in-90 duration-150"
                  title="שלח דיווח"
                >
                  <Send className="w-4 h-4 -scale-x-100" />
                </button>
              )}
            </div>
          </div>

          <div className="text-center mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate px-2">
            שעות לחיוב לקוח &middot; לחיצה על + פותחת סשן במקביל &middot; סנכרון ל-Lists ו-Excel
          </div>
        </div>
      </div>
    </div>
  );
};
