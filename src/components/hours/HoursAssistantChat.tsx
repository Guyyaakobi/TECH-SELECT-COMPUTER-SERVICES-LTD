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
  LogOut,
  Trophy,
  Flame,
  Coffee,
  Rocket,
  Star,
} from "lucide-react";
import {
  apiAssistantChat,
  apiGetMyListsDailySummary,
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
  onLogout?: (e?: React.MouseEvent) => void;
  quotaRefreshTrigger?: number;
}

const MAX_SAVED_SESSIONS = 10;
const DAILY_QUOTA_HOURS = 7;

function getNormalizedUserKey(user?: {
  email?: string;
  upn?: string;
  username?: string;
}): string {
  const raw = (user?.email || user?.upn || user?.username || "user")
    .trim()
    .toLowerCase();
  return raw || "user";
}

function getCanonicalHistoryKey(userKey: string): string {
  return `tech_select_hours_history_v2_${userKey}`;
}

/**
 * Strips heavy transient arrays (like 200+ SharePoint customer folder candidates)
 * before saving to localStorage so 10 sessions stay tiny (~15KB) and never hit QuotaExceededError.
 */
function compactDraftForStorage(d: HoursAssistantEntryDraft): HoursAssistantEntryDraft {
  return {
    ...d,
    candidates: d.candidates ? d.candidates.slice(0, 5) : undefined,
    duplicateWarning: d.duplicateWarning
      ? {
          isDuplicate: d.duplicateWarning.isDuplicate,
          existingRows: (d.duplicateWarning.existingRows || []).slice(0, 2),
        }
      : undefined,
  };
}

function compactSessionForStorage(s: SavedChatSession): SavedChatSession {
  return {
    ...s,
    messages: (s.messages || []).slice(-20).map((m) => ({
      ...m,
      drafts: m.drafts ? m.drafts.map(compactDraftForStorage) : undefined,
    })),
    activeDrafts: (s.activeDrafts || []).map(compactDraftForStorage),
    writtenEntries: (s.writtenEntries || []).slice(-10),
  };
}

/**
 * Purges all history keys (v1, v2, any casing) from localStorage and sessionStorage
 */
function purgeAllHistoryKeysFromBrowser(userKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("tech_select_hours_history")) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
    localStorage.setItem(`tech_select_hours_cleared_${userKey}`, "1");
  } catch (e) {
    console.error("Failed to purge history keys from localStorage", e);
  }

  try {
    const sessKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("tech_select_hours_history")) {
        sessKeysToRemove.push(k);
      }
    }
    for (const k of sessKeysToRemove) {
      sessionStorage.removeItem(k);
    }
  } catch {}
}

/**
 * Persists up to 10 sessions into localStorage with automatic quota recovery
 */
function persistSessionsToStorage(userKey: string, sessions: SavedChatSession[]): void {
  if (typeof window === "undefined") return;
  const canonicalKey = getCanonicalHistoryKey(userKey);
  const compacted = sessions.slice(0, MAX_SAVED_SESSIONS).map(compactSessionForStorage);

  try {
    if (compacted.length > 0) {
      localStorage.removeItem(`tech_select_hours_cleared_${userKey}`);
    }
    // Clean any legacy v1 keys so old 5-session lists never linger
    const legacyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("tech_select_hours_history_v1_")) {
        legacyKeys.push(k);
      }
    }
    for (const k of legacyKeys) {
      localStorage.removeItem(k);
    }

    localStorage.setItem(canonicalKey, JSON.stringify(compacted));
  } catch (err) {
    console.warn("[HoursHistory] Quota exceeded or storage error, freeing space and retrying...", err);
    try {
      // Free space from non-auth cached images or legacy keys
      const removableKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith("tech_select_member_img_") ||
            k.startsWith("tech_select_hours_history_v1_") ||
            (k.startsWith("tech_select_hours_history_") && k !== canonicalKey))
        ) {
          removableKeys.push(k);
        }
      }
      for (const k of removableKeys) {
        localStorage.removeItem(k);
      }
      localStorage.setItem(canonicalKey, JSON.stringify(compacted));
    } catch (retryErr) {
      console.error("[HoursHistory] Retry save failed:", retryErr);
    }
  }
}

/**
 * Loads up to 10 sessions for the user, migrating and removing any stuck v1 keys
 */
function loadSessionsFromStorage(userKey: string): SavedChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const canonicalKey = getCanonicalHistoryKey(userKey);
    const wasExplicitlyCleared =
      localStorage.getItem(`tech_select_hours_cleared_${userKey}`) === "1";

    // 1. Check canonical v2 key first
    const rawV2 = localStorage.getItem(canonicalKey);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_SAVED_SESSIONS);
      }
    }

    // If user clicked "נקה הכל", do not re-import old v1 keys
    if (wasExplicitlyCleared) {
      return [];
    }

    // 2. Otherwise migrate from any legacy v1 keys matching this user (case-insensitive)
    const collected: SavedChatSession[] = [];
    const seenIds = new Set<string>();
    const legacyKeysToClean: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("tech_select_hours_history_")) continue;
      if (k === canonicalKey) continue;

      const kLower = k.toLowerCase();
      if (
        kLower.endsWith(`_${userKey}`) ||
        kLower.endsWith("_user") ||
        k.startsWith("tech_select_hours_history_v1_")
      ) {
        legacyKeysToClean.push(k);
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item && item.id && !seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  collected.push(item);
                }
              }
            }
          }
        } catch {}
      }
    }

    collected.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const finalSessions = collected.slice(0, MAX_SAVED_SESSIONS).map(compactSessionForStorage);

    // Save to v2 and remove legacy v1 keys
    if (finalSessions.length > 0 || legacyKeysToClean.length > 0) {
      for (const oldKey of legacyKeysToClean) {
        try {
          localStorage.removeItem(oldKey);
        } catch {}
      }
      if (finalSessions.length > 0) {
        persistSessionsToStorage(userKey, finalSessions);
      }
    }

    return finalSessions;
  } catch (e) {
    console.error("Failed to load chat history", e);
    return [];
  }
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
  onLogout,
  quotaRefreshTrigger = 0,
}) => {
  const isGuyOrAdmin = Boolean(
    currentUser.isAdmin ||
    currentUser.email?.toLowerCase() === "g@tech-select.co.il"
  );

  // Daily 7-Hour Quota state fetched directly from Microsoft Lists for the current employee
  const [todayQuota, setTodayQuota] = useState<{
    todayHours: number;
    todayEntriesCount: number;
    todayDisplayDate: string;
    loading: boolean;
    loaded: boolean;
  }>({
    todayHours: 0,
    todayEntriesCount: 0,
    todayDisplayDate: "",
    loading: true,
    loaded: false,
  });

  const fetchTodayQuotaStatus = useCallback(
    async (silent = false) => {
      if (!currentUser?.name && !currentUser?.email) return;
      try {
        if (!silent) {
          setTodayQuota((prev) => ({ ...prev, loading: true }));
        }
        const summary = await apiGetMyListsDailySummary({
          employeeName: currentUser.name,
          employeeEmail: currentUser.email,
        });
        setTodayQuota({
          todayHours: Math.round((Number(summary.todayHours) || 0) * 100) / 100,
          todayEntriesCount: Number(summary.todayEntriesCount) || 0,
          todayDisplayDate: summary.todayDisplayDate || "",
          loading: false,
          loaded: true,
        });
      } catch (err) {
        console.warn("[HoursAssistantChat] Could not fetch daily quota summary:", err);
        setTodayQuota((prev) => ({ ...prev, loading: false, loaded: true }));
      }
    },
    [currentUser.name, currentUser.email]
  );

  useEffect(() => {
    fetchTodayQuotaStatus();
  }, [fetchTodayQuotaStatus, quotaRefreshTrigger]);

  const normalizedUserKey = getNormalizedUserKey(currentUser);
  const normalizedUserKeyRef = useRef<string>(normalizedUserKey);
  useEffect(() => {
    normalizedUserKeyRef.current = normalizedUserKey;
  }, [normalizedUserKey]);

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

  // Refs for latest foreground state so async/background handlers never use stale closures
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const activeDraftsRef = useRef<HoursAssistantEntryDraft[]>(activeDrafts);
  activeDraftsRef.current = activeDrafts;
  const writtenEntriesRef = useRef<WrittenEntryResult[]>(writtenEntries);
  writtenEntriesRef.current = writtenEntries;

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) return false;
      const saved = localStorage.getItem("tech_select_hours_sidebar_open");
      if (saved !== null) return saved === "true";
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  );
  const currentSessionIdRef = useRef<string>(currentSessionId);
  currentSessionIdRef.current = currentSessionId;

  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>(() =>
    loadSessionsFromStorage(normalizedUserKey)
  );
  const savedSessionsRef = useRef<SavedChatSession[]>(savedSessions);
  savedSessionsRef.current = savedSessions;

  // Reload sessions if normalizedUserKey changes after initial auth resolution
  const prevUserKeyRef = useRef<string>(normalizedUserKey);
  useEffect(() => {
    if (prevUserKeyRef.current !== normalizedUserKey) {
      prevUserKeyRef.current = normalizedUserKey;
      const loaded = loadSessionsFromStorage(normalizedUserKey);
      savedSessionsRef.current = loaded;
      setSavedSessions(loaded);
    }
  }, [normalizedUserKey]);

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
      const allWritten = [
        ...(written || []),
        ...(msgs || []).flatMap((m) => m.writtenEntries || []),
      ];
      if (allWritten.length > 0) {
        const lastW = allWritten[allWritten.length - 1];
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

  // Pure, deterministic session state updater:
  // Computes nextState ONCE, updates foreground state if active, and persists up to 10 sessions to localStorage.
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
      const isForeground = currentSessionIdRef.current === targetSessionId;
      const currentSessions = savedSessionsRef.current;
      const existingIdx = currentSessions.findIndex((s) => s.id === targetSessionId);
      const existingSession = existingIdx >= 0 ? currentSessions[existingIdx] : undefined;

      const prevState = isForeground
        ? {
            messages: messagesRef.current,
            activeDrafts: activeDraftsRef.current,
            writtenEntries: writtenEntriesRef.current,
          }
        : {
            messages: existingSession?.messages || [],
            activeDrafts: existingSession?.activeDrafts || [],
            writtenEntries: existingSession?.writtenEntries || [],
          };

      const nextState = updater(prevState);

      if (isForeground) {
        messagesRef.current = nextState.messages;
        activeDraftsRef.current = nextState.activeDrafts;
        writtenEntriesRef.current = nextState.writtenEntries;
        setMessages(nextState.messages);
        setActiveDrafts(nextState.activeDrafts);
        setWrittenEntries(nextState.writtenEntries);
      }

      if (
        nextState.messages.length === 0 &&
        nextState.activeDrafts.length === 0 &&
        nextState.writtenEntries.length === 0
      ) {
        return;
      }

      const updatedItem = buildSessionItem(
        targetSessionId,
        nextState.messages,
        nextState.activeDrafts,
        nextState.writtenEntries,
        existingSession?.createdAt
      );

      let updatedList: SavedChatSession[];
      if (existingIdx >= 0) {
        if (isForeground) {
          const remaining = currentSessions.filter((s) => s.id !== targetSessionId);
          updatedList = [updatedItem, ...remaining].slice(0, MAX_SAVED_SESSIONS);
        } else {
          const copy = [...currentSessions];
          copy[existingIdx] = updatedItem;
          updatedList = copy.slice(0, MAX_SAVED_SESSIONS);
        }
      } else {
        updatedList = [updatedItem, ...currentSessions].slice(0, MAX_SAVED_SESSIONS);
      }

      savedSessionsRef.current = updatedList;
      setSavedSessions(updatedList);
      persistSessionsToStorage(normalizedUserKeyRef.current, updatedList);
    },
    [buildSessionItem]
  );

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

        // Sync updated written entries if an existing entry was edited
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

    const snapshotHistory = messagesRef.current
      .filter((m) => m.id !== "welcome" && m.id !== voiceMsgId)
      .slice(-8)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));
    const snapshotDrafts = [...activeDraftsRef.current];
    const snapshotWritten = [...writtenEntriesRef.current];

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

    const targetSessObj = savedSessionsRef.current.find((s) => s.id === targetSessionId);
    const baseMessages =
      targetSessionId === currentSessionIdRef.current
        ? messagesRef.current
        : targetSessObj?.messages || [];
    const baseDrafts =
      targetSessionId === currentSessionIdRef.current
        ? activeDraftsRef.current
        : targetSessObj?.activeDrafts || [];
    const baseWritten =
      targetSessionId === currentSessionIdRef.current
        ? writtenEntriesRef.current
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

      const currentDrafts = activeDraftsRef.current;
      const currentMsgs = messagesRef.current;

      const targetDraft =
        directDraft ||
        currentDrafts.find((d) => d.id === cardId) ||
        currentMsgs.flatMap((m) => m.drafts || []).find((d) => d.id === cardId);

      const mergedActiveDrafts = currentDrafts.map((d) =>
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
        writtenEntries: writtenEntriesRef.current,
      });

      handleChatResponseForSession(targetSessionId, res, false);
      fetchTodayQuotaStatus(true);
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

      const currentWritten = writtenEntriesRef.current;
      const currentMsgs = messagesRef.current;

      const targetEntry =
        directEntry ||
        currentWritten.find((w) => w.id === cardId || w.entryId === cardId || w.fileId === cardId) ||
        currentMsgs
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
        ...currentWritten,
        ...currentMsgs.flatMap((m) => m.writtenEntries || []),
      ].filter((w, idx, arr) => arr.findIndex((x) => x.id === w.id) === idx);

      const res = await apiAssistantChat({
        user: currentUser,
        action: "undo_entry",
        cardId: targetEntry?.id || cardId,
        activeDrafts: activeDraftsRef.current,
        undoData,
        writtenEntries: mergedWritten,
      });

      handleChatResponseForSession(targetSessionId, res, false);
      fetchTodayQuotaStatus(true);
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

      const targetSessObj = savedSessionsRef.current.find((s) => s.id === targetSessionId);
      const sessWritten =
        targetSessionId === currentSessionIdRef.current
          ? writtenEntriesRef.current
          : targetSessObj?.writtenEntries || [];
      const sessMessages =
        targetSessionId === currentSessionIdRef.current
          ? messagesRef.current
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
      fetchTodayQuotaStatus(true);
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
    messagesRef.current = [];
    activeDraftsRef.current = [];
    writtenEntriesRef.current = [];
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
    messagesRef.current = session.messages || [];
    activeDraftsRef.current = session.activeDrafts || [];
    writtenEntriesRef.current = session.writtenEntries || [];
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
    const filtered = savedSessionsRef.current.filter((s) => s.id !== sessionId);
    savedSessionsRef.current = filtered;
    setSavedSessions(filtered);
    if (filtered.length === 0) {
      purgeAllHistoryKeysFromBrowser(normalizedUserKeyRef.current);
    } else {
      persistSessionsToStorage(normalizedUserKeyRef.current, filtered);
    }

    if (currentSessionIdRef.current === sessionId) {
      handleNewChat();
    }
  };

  const handleClearAllHistory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    savedSessionsRef.current = [];
    setSavedSessions([]);
    setEditingSidebarSessionId(null);
    purgeAllHistoryKeysFromBrowser(normalizedUserKeyRef.current);
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

  // Compute Autonomy-First Documentation Progress (7 hours as a billable documentation reference point, never a workday clock)
  const loggedHoursToday = Math.max(0, todayQuota.todayHours);
  const remainingRefHours = Math.max(0, Math.round((DAILY_QUOTA_HOURS - loggedHoursToday) * 100) / 100);
  const quotaPercent = Math.min(100, Math.round((loggedHoursToday / DAILY_QUOTA_HOURS) * 100));
  const isQuotaReached = loggedHoursToday >= DAILY_QUOTA_HOURS;

  const getDocumentationProgressStatus = () => {
    if (isQuotaReached) {
      return {
        headline: `תיעוד מלא ומסודר להיום — ${loggedHoursToday} שעות לחיוב לקוח`,
        subtext: `כל הפעילויות שתיעדת היום מסונכרנות ב-Microsoft Lists ובקובצי הלקוחות.`,
      };
    }
    if (loggedHoursToday === 0) {
      return {
        headline: `מעקב תיעוד פעילויות לחיוב לקוח`,
        subtext: `כאן מתעדכנות השעות לחיוב לקוח שתיעדת היום, כדי ששום פעילות שביצעת לא תתפספס.`,
      };
    }
    if (loggedHoursToday < 4) {
      return {
        headline: `תועדו היום ${loggedHoursToday} שעות לחיוב לקוח`,
        subtext: `התיעוד שלך מתקדם מצוין · עוד ${remainingRefHours} ש׳ לנקודת הייחוס היומית לתיעוד (7 ש׳).`,
      };
    }
    return {
      headline: `רצף תיעוד מעולה — ${loggedHoursToday} שעות לחיוב לקוח היום`,
      subtext: `רוב הפעילויות להיום כבר מתועדות · עוד ${
        remainingRefHours === 1 ? "שעה אחת" : `${remainingRefHours} ש׳`
      } להשלמת רצף של 7 שעות מתועדות.`,
    };
  };

  const docProgress = getDocumentationProgressStatus();

  return (
    <div className="w-full h-full flex flex-row overflow-hidden relative bg-[#F8FAFC]" dir="ltr">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-[#172B4D]/30 backdrop-blur-xs z-30 transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR: Minimalist Conversation History with Blue Tints */}
      <aside
        dir="rtl"
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          ${isSidebarOpen ? "w-76 sm:w-80 border-r border-[#DBEAFE]" : "w-0 border-r-0"}
          bg-[#F8FAFC]
          transition-all duration-300 ease-in-out
          flex flex-col shrink-0 overflow-hidden
          shadow-xl md:shadow-none
        `}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-[#DBEAFE]/80 bg-white/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2563EB]" />
            <div>
              <h2 className="text-xs font-semibold text-[#172B4D] leading-tight">היסטוריית תיעודים</h2>
              <span className="text-[10px] text-slate-400">10 אחרונים · ניתן לעריכה</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-[#EFF6FF] text-slate-500 hover:text-[#2563EB] cursor-pointer transition-colors"
            title="צמצם היסטוריה"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Parallel Session Button (Primary Blue) */}
        <div className="p-3 shrink-0">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-2xs flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
            title="פתח סשן תיעוד חדש במקביל (הסשן הקודם ימשיך לרוץ ברקע)"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              <span>סשן תיעוד חדש</span>
            </div>
            <span className="text-[10px] text-[#DBEAFE]">במקביל</span>
          </button>
        </div>

        {/* Recent Sessions List Header + Clear All */}
        <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400 shrink-0">
          <span>אחרונים ({savedSessions.length}/10)</span>

          {savedSessions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="px-2 py-0.5 rounded-md hover:bg-[#EFF6FF] text-slate-500 hover:text-[#2563EB] text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="מחק את כל היסטוריית התיעודים השמורה בדפדפן"
            >
              <Trash2 className="w-3 h-3" />
              <span>נקה הכל</span>
            </button>
          )}
        </div>

        {/* Sessions List (Max 10) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-1">
          {savedSessions.length === 0 ? (
            <div className="py-10 px-3 text-center text-slate-400 flex flex-col items-center">
              <MessageSquare className="w-5 h-5 text-[#DBEAFE] mb-2 stroke-1.5" />
              <p className="text-xs font-medium text-[#172B4D]/70">אין תיעודים שמורים</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                עשרת התיעודים האחרונים יופיעו כאן
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
                    w-full p-2.5 rounded-xl border text-right cursor-pointer flex flex-col gap-1 group transition-all
                    ${
                      isActive
                        ? "bg-[#EFF6FF] border-[#DBEAFE] text-[#172B4D] shadow-2xs"
                        : "bg-white/60 hover:bg-white border-transparent hover:border-[#DBEAFE] text-slate-600 hover:text-[#172B4D]"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0 text-[#2563EB]">
                        {isSessLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                        ) : lastWritten ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]/70" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs truncate font-medium text-[#172B4D]">
                            {sess.title || "שיחת דיווח"}
                          </p>
                          {displayHours !== undefined && (
                            <span className="px-1.5 py-0.2 rounded bg-white border border-[#DBEAFE] text-[#2563EB] text-[10px] font-medium shrink-0">
                              {displayHours} ש׳
                            </span>
                          )}
                        </div>

                        {sess.preview && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {sess.preview}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] text-slate-400">
                          <span>{formatRelativeTime(sess.updatedAt || sess.createdAt)}</span>
                          {isSessLoading && (
                            <span className="text-[#06B6D4] font-medium animate-pulse">
                              · מעבד ברקע...
                            </span>
                          )}
                          {!isSessLoading && hasDrafts && (
                            <span className="text-[#2563EB] font-medium">
                              · ממתין לאישור
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenSidebarEdit(e, sess)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-white transition-colors cursor-pointer"
                        title="ערוך שעות או הודעה שתיעדת"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                      className="mt-1.5 pt-2 border-t border-[#DBEAFE] bg-white rounded-xl p-2.5 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#172B4D]">
                          {lastWritten ? "עריכת שעות ותיעוד" : "עריכת הודעה"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSidebarSessionId(null);
                          }}
                          className="text-slate-400 hover:text-[#172B4D] p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {(lastWritten || lastDraft) && (
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            שעות לחיוב:
                          </label>
                          <div className="flex items-center gap-1 flex-wrap">
                            <input
                              type="number"
                              step="0.25"
                              min="0.25"
                              max="12"
                              value={sidebarEditHours}
                              onChange={(e) => setSidebarEditHours(parseFloat(e.target.value) || 0.25)}
                              className="w-16 px-2 py-1 text-[16px] sm:text-xs font-semibold border border-[#DBEAFE] rounded-lg focus:outline-none focus:border-[#2563EB] text-center text-[#172B4D]"
                            />
                            {[0.5, 1, 1.5, 2, 3].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setSidebarEditHours(preset)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border cursor-pointer transition-colors ${
                                  Number(sidebarEditHours) === preset
                                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                                    : "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE] hover:bg-[#DBEAFE]/70"
                                }`}
                              >
                                {preset} ש׳
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <textarea
                          rows={2}
                          value={sidebarEditText}
                          onChange={(e) => setSidebarEditText(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[16px] sm:text-xs border border-[#DBEAFE] rounded-lg focus:outline-none focus:border-[#2563EB] resize-none leading-relaxed text-[#172B4D]"
                          placeholder="עדכן את תיאור העבודה..."
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSidebarSessionId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#DBEAFE] text-[11px] font-medium text-[#172B4D] hover:bg-[#EFF6FF] cursor-pointer"
                        >
                          ביטול
                        </button>
                        <button
                          type="button"
                          disabled={isSavingSidebarEdit}
                          onClick={(e) => handleSaveSidebarSessionEdit(e, sess)}
                          className="px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingSidebarEdit ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>שמור</span>
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
        <div className="p-3 border-t border-[#DBEAFE]/80 bg-white/80 flex flex-col gap-2 text-[11px] text-slate-500 shrink-0">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#EFF6FF] text-[#172B4D] hover:text-[#2563EB] border border-[#DBEAFE] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>התנתק מהחשבון</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CHAT CANVAS */}
      <div dir="rtl" className="flex-1 h-full flex flex-col justify-between overflow-hidden relative text-right min-w-0 bg-white">
        {/* Single Sleek Sub-Header Bar */}
        <div className="px-3 sm:px-6 py-2 border-b border-[#DBEAFE]/70 bg-white/95 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar">
            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="px-2.5 py-1 rounded-full bg-[#EFF6FF]/60 hover:bg-[#EFF6FF] text-[#172B4D] hover:text-[#2563EB] cursor-pointer flex items-center gap-1.5 border border-[#DBEAFE] transition-colors shrink-0"
              title={isSidebarOpen ? "צמצם היסטוריה" : "היסטוריית תיעודים (10 אחרונים)"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              )}
              <span className="text-[11px] font-medium whitespace-nowrap">
                {isSidebarOpen ? "הסתר" : `היסטוריה (${savedSessions.length})`}
              </span>
            </button>

            {/* Autonomy-First Documentation Progress Pill */}
            <button
              type="button"
              onClick={onOpenMyLoggedHours}
              className="px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors bg-[#EFF6FF] hover:bg-[#DBEAFE]/70 text-[#2563EB] border border-[#DBEAFE]"
              title="מעקב תיעוד פעילויות לחיוב לקוח היום"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isQuotaReached ? "text-[#06B6D4]" : "text-[#2563EB]"}`} />
              <span>
                {todayQuota.loading && !todayQuota.loaded
                  ? "מעדכן תיעוד..."
                  : `תועדו היום: ${loggedHoursToday} ש׳ לחיוב`}
              </span>
            </button>

            {/* Parallel Running Sessions Indicator */}
            {backgroundRunningSessions.length > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#06B6D4] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                <span>{backgroundRunningSessions.length} ברקע</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-[11px] text-white font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0"
            title="פתח סשן תיעוד חדש במקביל"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>סשן חדש</span>
          </button>
        </div>

        {/* Minimal Parallel Session Switcher */}
        {(savedSessions.length > 1 || backgroundRunningSessions.length > 0) && (
          <div className="px-3 sm:px-6 py-1 bg-[#F8FAFC] border-b border-[#DBEAFE]/60 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {!savedSessions.some((s) => s.id === currentSessionId) && (
              <button
                type="button"
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#2563EB] text-white flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>סשן חדש</span>
              </button>
            )}

            {savedSessions.slice(0, 5).map((sess) => {
              const isCurrent = sess.id === currentSessionId;
              const isRunning = Boolean(sessionLoadingMap[sess.id]?.loading);
              const pendingDraftsCount = (sess.activeDrafts || []).length;

              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => handleSelectSession(sess)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer border ${
                    isCurrent
                      ? "bg-[#2563EB] text-white border-[#2563EB]"
                      : "bg-white text-[#172B4D] border-[#DBEAFE] hover:bg-[#EFF6FF]"
                  }`}
                >
                  {isRunning && <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#06B6D4]" />}
                  <span className="max-w-[110px] truncate">{sess.title || "שיחה"}</span>
                  {pendingDraftsCount > 0 && !isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area: Empty State OR Message Feed */}
        {messages.length === 0 && activeDrafts.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 py-4 overflow-y-auto">
            <div className="text-center w-full space-y-5">
              {/* Minimalist Executive Greeting */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#172B4D] tracking-tight">
                  {greeting}, {firstName}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 font-normal">
                  תעד פעילות שבוצעה עבור לקוח בטקסט או בהקלטה קולית
                </p>
              </div>

              {/* Autonomy-First Documentation Progress Card (Positive billable logging tracker, no workday supervision) */}
              <div
                onClick={onOpenMyLoggedHours}
                role="button"
                className="w-full max-w-lg mx-auto p-4 rounded-2xl bg-[#EFF6FF]/60 hover:bg-[#EFF6FF] border border-[#DBEAFE] text-right transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0">
                      <CheckCircle2 className={`w-4 h-4 ${isQuotaReached ? "text-[#06B6D4]" : "text-[#2563EB]"}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-[#172B4D] truncate">
                        {docProgress.headline}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {docProgress.subtext}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-[#2563EB] font-mono bg-white border border-[#DBEAFE] px-2.5 py-1 rounded-xl">
                      {loggedHoursToday} ש׳
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchTodayQuotaStatus();
                      }}
                      className="p-1.5 rounded-xl hover:bg-white text-[#2563EB]/70 hover:text-[#2563EB] cursor-pointer transition-colors"
                      title="רענן נתוני תיעוד"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${todayQuota.loading ? "animate-spin text-[#06B6D4]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Single Sleek Blue Progress Bar (7h billable documentation reference) */}
                <div className="w-full h-1.5 rounded-full bg-[#DBEAFE] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isQuotaReached ? "bg-[#06B6D4]" : "bg-[#2563EB]"
                    }`}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>

              {/* Interactive Quick-Action Chips with Subtle Blue Presence */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-1">
                {isGuyOrAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendText("כמה אנשים תיעדו היום?")}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172B4D] hover:text-[#2563EB] font-medium transition-colors cursor-pointer"
                    >
                      כמה אנשים תיעדו היום?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendText("ריכוז שבועי")}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172B4D] hover:text-[#2563EB] font-medium transition-colors cursor-pointer"
                    >
                      ריכוז שבועי
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendText("כמה שעות נרשמו היום?")}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172B4D] hover:text-[#2563EB] font-medium transition-colors cursor-pointer"
                    >
                      כמה שעות נרשמו היום?
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setInputText("הייתי היום שעתיים בביקור אצל ")}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172B4D] hover:text-[#2563EB] font-medium transition-colors cursor-pointer"
                    >
                      ביקור באתר לקוח
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText("שעה תמיכה מרחוק וטיפול בטיקט אצל ")}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172B4D] hover:text-[#2563EB] font-medium transition-colors cursor-pointer"
                    >
                      תמיכה מרחוק / טיקט
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText("3 שעות עבודה על פרויקט אצל ")}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#172B4D] hover:text-[#2563EB] font-medium transition-colors cursor-pointer"
                    >
                      עבודת פרויקט
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Messages Feed: Clean Centered Reading Column */
          <div ref={feedContainerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 scroll-smooth">
            <div className="max-w-2xl mx-auto w-full space-y-5">
              {(() => {
                const seenWrittenIds = new Set<string>();
                return messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const uniqueWrittenForMsg = (msg.writtenEntries || []).filter((w) => {
                    if (seenWrittenIds.has(w.id)) return false;
                    seenWrittenIds.add(w.id);
                    return true;
                  });
                  const isAuthErrorMsg =
                    !isUser &&
                    (msg.text.includes("הרשאת גישה") ||
                      msg.text.includes("פג תוקף החיבור") ||
                      msg.text.includes("401"));

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-start" : "items-stretch"} space-y-2`}
                    >
                      {/* User Message Bubble (Clean Blue Tint Pill) */}
                      {isUser ? (
                        <div className="bg-[#EFF6FF] border border-[#DBEAFE] text-[#172B4D] rounded-2xl px-4 py-2.5 text-sm sm:text-[15px] leading-relaxed max-w-[90%] sm:max-w-[80%] group relative">
                          {msg.isVoice && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#2563EB] mb-1 font-medium">
                              <Volume2 className="w-3 h-3" />
                              <span>תמלול קולי</span>
                            </div>
                          )}

                          {editingMsgId === msg.id ? (
                            <div className="space-y-2 min-w-[240px] sm:min-w-[320px]">
                              <textarea
                                rows={2}
                                value={editingMsgText}
                                onChange={(e) => setEditingMsgText(e.target.value)}
                                className="w-full p-2 text-[16px] sm:text-sm bg-white border border-[#DBEAFE] rounded-xl focus:outline-none focus:border-[#2563EB] resize-none text-[#172B4D]"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#172B4D] hover:bg-white cursor-pointer"
                                >
                                  ביטול
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedUserMessage(msg.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>עדכן</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-line break-words">{msg.text}</p>
                              <div className="flex items-center justify-between gap-3 mt-1 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMsgId(msg.id);
                                    setEditingMsgText(msg.text.replace(/^🎙️\s*"?|"?$/g, ""));
                                  }}
                                  className="text-[11px] text-[#2563EB]/70 hover:text-[#2563EB] font-normal flex items-center gap-1 cursor-pointer transition-colors"
                                  title="ערוך הודעה"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                  <span>ערוך</span>
                                </button>
                                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Assistant Message: Minimalist Clean Layout with AI Accent */
                        <div className="flex items-start gap-3 w-full min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#06B6D4] flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2.5">
                            <div className="text-sm sm:text-[15px] text-[#172B4D] leading-relaxed font-normal">
                              <p className="whitespace-pre-line break-words">{msg.text}</p>
                              {isAuthErrorMsg && onLogout && (
                                <button
                                  type="button"
                                  onClick={onLogout}
                                  className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>התנתק והתחבר מחדש</span>
                                </button>
                              )}
                            </div>

                            {/* Confirmed Written Entries */}
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
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Pending Active Drafts ALWAYS pinned at the VERY BOTTOM of the feed */}
              {activeDrafts.length > 0 && (
                <div className="w-full space-y-3 pt-1">
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

              {/* Minimal Loading Indicator */}
              {loading && (
                <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-2xl bg-[#EFF6FF]/60 border border-[#DBEAFE] max-w-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#06B6D4] border-t-transparent animate-spin flex-shrink-0" />
                    <span className="text-xs text-[#172B4D] font-medium">{loadingStep}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>במקביל</span>
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Docked iPhone-Optimized Floating Composer Bar */}
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:pb-4 pt-1.5 shrink-0 bg-white">
          {/* Active Audio Recording Bar */}
          {isRecording && (
            <div className="mb-2 flex items-center justify-between p-3 rounded-2xl bg-[#2563EB] text-white shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-xs font-medium">מקליט דיווח קולי...</span>
                <span className="font-mono text-xs text-[#DBEAFE]">
                  {formatRecordingTime(recordingSeconds)}
                </span>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="py-1 px-3 rounded-xl bg-white text-[#2563EB] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-[#2563EB]" />
                <span>סיום ושליחה</span>
              </button>
            </div>
          )}

          {/* Microphone Permission Error Banner */}
          {micPermissionError && (
            <div className="mb-2.5 p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#172B4D] text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-[#2563EB]">
                  <MicOff className="w-3.5 h-3.5" /> {micPermissionError.title}
                </span>
                <button
                  type="button"
                  onClick={() => setMicPermissionError(null)}
                  className="text-slate-400 hover:text-[#172B4D] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600">{micPermissionError.details}</p>
            </div>
          )}

          {/* Composer Pill */}
          <div className="w-full rounded-[26px] bg-[#F8FAFC] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#2563EB]/40 focus-within:border-[#2563EB] border border-[#DBEAFE] transition-all p-1.5 sm:p-2 flex items-end gap-2 shadow-2xs">
            {/* Plus icon for parallel session */}
            <button
              type="button"
              onClick={handleNewChat}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] border border-[#DBEAFE] shrink-0 cursor-pointer self-end transition-colors"
              title="פתח סשן תיעוד חדש במקביל"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Text Input - text-[16px] on mobile prevents iOS Safari auto-zoom on focus */}
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
                  ? "מקליט כעת..."
                  : loading
                  ? "מעבד... לחץ + לפתיחת תיעוד נוסף במקביל"
                  : "תאר את הפעילות והלקוח, או הקלט..."
              }
              className="flex-1 bg-transparent text-[#172B4D] placeholder-slate-400 text-[16px] sm:text-[15px] leading-relaxed focus:outline-none py-1.5 px-1.5 resize-none overflow-y-auto max-h-36 min-h-[28px] box-border"
            />

            {/* Microphone & Send Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-end">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "text-[#2563EB] hover:bg-[#EFF6FF]"
                }`}
                title={isRecording ? "עצור הקלטה" : "הקלט הודעה קולית"}
              >
                {isRecording ? <Square className="w-3.5 h-3.5 fill-white" /> : <Mic className="w-4 h-4" />}
              </button>

              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => handleSendText()}
                  disabled={loading}
                  className="w-9 h-9 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 cursor-pointer transition-all"
                  title="שלח"
                >
                  <Send className="w-4 h-4 -scale-x-100" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
