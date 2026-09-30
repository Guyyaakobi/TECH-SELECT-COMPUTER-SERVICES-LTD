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
  Compass,
  Lightbulb,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  apiAssistantChat,
  HoursAssistantEntryDraft,
  WrittenEntryResult,
  AssistantChatResponse,
} from "../../services/hoursApiClient";
import { HoursEntryCard } from "./HoursEntryCard";

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
  };
}

function getFriendlyHebrewErrorMessage(err: any): string {
  const raw = String(err?.message || err || "").toLowerCase();
  if (raw.includes("unauthorized") || raw.includes("401") || raw.includes("אימות") || raw.includes("token")) {
    return "לא זוהתה הרשאת גישה פעילה או שפג תוקף החיבור מול Microsoft 365. נא לרענן את העמוד כדי להתחבר מחדש.";
  }
  if (raw.includes("forbidden") || raw.includes("403") || raw.includes("accessdenied")) {
    return "אין הרשאה מתאימה לביצוע הפעולה או לקריאת הקובץ ב-SharePoint.";
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
  if (raw.includes("429") || raw.includes("throttled") || raw.includes("too many requests")) {
    return "עומס בקשות זמני מול שרתי Microsoft. נא להמתין מספר שניות ולנסות שוב.";
  }
  if (raw.includes("לא נמצא קובץ שעות")) {
    return "לא נמצא קובץ שעות מתאים עבור הלקוח לחודש המבוקש ב-SharePoint.";
  }
  if (raw.includes("אישור מפורש")) {
    return "נדרש אישור מפורש לפני הזנת הנתונים לקובץ.";
  }
  return "אירעה שגיאה בביצוע הפעולה מול קובץ השעות. נא לנסות שוב.";
}

export const HoursAssistantChat: React.FC<HoursAssistantChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("מעבד בקשה...");

  // Active Drafts currently pending confirmation in the session
  const [activeDrafts, setActiveDrafts] = useState<HoursAssistantEntryDraft[]>([]);
  // Written entries in this session (with 10-minute undo window)
  const [writtenEntries, setWrittenEntries] = useState<WrittenEntryResult[]>([]);

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

        if (audioBlob.size < 500) {
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

      recorder.start(250); // Slice every 250ms
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

    try {
      setLoading(true);
      setLoadingStep("מתמלל הקלטה קולית...");

      stepTimer1 = setTimeout(() => {
        setLoadingStep("מאתר לקוחות ותיקיות ב-SharePoint...");
      }, 3500);

      stepTimer2 = setTimeout(() => {
        setLoadingStep("בודק כפילויות ומכין כרטיס דיווח...");
      }, 7500);

      // Prepare conversation history
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await apiAssistantChat({
        audio: {
          data: base64Audio,
          mimeType,
        },
        history,
        activeDrafts,
        writtenEntries,
      });

      handleChatResponse(res, true);
    } catch (err: any) {
      console.error("[handleSendAudio] Error:", err);
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
  const handleChatResponse = (res: AssistantChatResponse, fromVoice: boolean) => {
    // If voice recording returned a transcript, add user message with transcript
    if (fromVoice && res.transcript) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user_trans_${Date.now()}`,
          role: "user",
          text: res.transcript || "הקלטת קול",
          isVoice: true,
          timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
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

    // Remove undone entries
    if (res.undoneCardIds && res.undoneCardIds.length > 0) {
      setWrittenEntries((prev) => prev.filter((w) => !res.undoneCardIds.includes(w.id)));
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
  const handleUndoEntry = async (cardId: string) => {
    try {
      setLoading(true);
      setLoadingStep("מבטל שורה מגיליון ה-Excel...");

      const targetEntry = writtenEntries.find((w) => w.id === cardId);
      const undoData = targetEntry
        ? {
            driveId: targetEntry.driveId,
            itemId: targetEntry.itemId || targetEntry.fileId,
            fileId: targetEntry.fileId,
            rowAddress: targetEntry.rowAddress,
            writtenValues: targetEntry.writtenValues,
            writtenAt: targetEntry.writtenAt,
            sheetName: targetEntry.sheetName,
          }
        : undefined;

      const res = await apiAssistantChat({
        action: "undo_entry",
        cardId,
        activeDrafts,
        undoData,
        writtenEntries,
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

  // Quick Action Suggestions (as shown in the video)
  const quickSuggestions = [
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
      prompt: "שעתיים תמיכה מרחוק ופתרון תקלות",
      tag: "שעות עבודה",
    },
    {
      icon: <Compass className="w-4 h-4 text-blue-500" />,
      prompt: "שעה וחצי טיפול בתקלת שרת והגדרות אבטחה",
      tag: "טיקטים",
    },
    {
      icon: <FileText className="w-4 h-4 text-purple-500" />,
      prompt: "ביקור באתר, 3 שעות תחזוקת רשת",
      tag: "ביקור באתר",
    },
  ];

  const handleResetChat = () => {
    setMessages([]);
    setActiveDrafts([]);
    setInputText("");
  };

  const firstName = (currentUser.name || "").split(" ")[0] || currentUser.name || "עובד";

  // State 1: Empty Start Screen (Authentic Gemini Full-Window Workspace)
  if (messages.length === 0 && activeDrafts.length === 0 && !loading) {
    return (
      <div className="w-full h-full flex flex-col justify-between overflow-y-auto px-4 py-8 sm:py-12 relative bg-[#f8fafd] text-right">
        {/* Soft Ethereal Glow in the Center */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[24rem] bg-gradient-to-tr from-sky-200/35 via-purple-100/30 to-indigo-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Center Content: Gemini Greeting & Suggestion Cards */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto my-auto">
          {/* Sparkles Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-5">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          {/* Big Gemini Headline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-3">
              <span className="bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] bg-clip-text text-transparent">
                שלום, {firstName}
              </span>
            </h1>
            <p className="text-base sm:text-xl font-normal text-slate-500">
              איך אוכל לעזור לך לתעד שעות היום?
            </p>
          </div>

          {/* 3 Gemini Prompt Suggestions */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
            {quickSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendText(item.prompt)}
                className="p-4 rounded-2xl bg-white hover:bg-white/90 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all text-right flex flex-col justify-between gap-3 cursor-pointer group min-h-[110px]"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600 bg-slate-100 group-hover:bg-blue-50 px-2 py-0.5 rounded-full font-medium transition-colors">
                    {item.tag}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium leading-snug">
                  {item.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Docked Gemini Floating Prompt Pill */}
        <div className="w-full max-w-3xl mx-auto mt-auto">
          {/* Active Audio Recording Bar */}
          {isRecording && (
            <div className="mb-3 flex items-center justify-between p-3.5 rounded-2xl bg-red-50 border border-red-200 animate-pulse shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-red-700">מקליט כעת...</span>
                <span className="font-mono text-xs text-red-900 bg-white px-2 py-0.5 rounded-lg border border-red-200">
                  {formatRecordingTime(recordingSeconds)}
                </span>
              </div>

              <button
                onClick={stopRecording}
                className="py-1 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p>{micPermissionError.details}</p>
            </div>
          )}

          {/* Floating Pill Input Bar */}
          <div className="w-full rounded-3xl bg-[#f0f4f9] hover:bg-[#e9eef6] focus-within:bg-white focus-within:shadow-xl border border-slate-200/90 transition-all p-2.5 pl-4 flex items-center gap-3">
            {/* Plus / Reset */}
            <div
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-xs shrink-0 cursor-default"
              title="תיעוד חדש"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>

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
              placeholder={isRecording ? "מקליט כעת (עד 2 דקות)..." : "הזן דיווח טכני מפורט או הקלט הודעה קולית..."}
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none py-1.5"
            />

            {/* Microphone button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-slate-500 hover:text-blue-600 hover:bg-white"
              }`}
              title={isRecording ? "עצור הקלטה" : "הקלט הודעה קולית"}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send button */}
            {inputText.trim() && (
              <button
                onClick={() => handleSendText()}
                disabled={loading}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 -scale-x-100" />
              </button>
            )}
          </div>

          <div className="text-center mt-2.5 text-[11px] text-slate-400">
            Tech-Select Assistant &middot; דיווח שעות מקצועי מסונכרן ישירות ל-SharePoint ו-Excel דרך Microsoft Graph
          </div>
        </div>
      </div>
    );
  }

  // State 2: Active Chat State (Authentic Full-Window Gemini Conversation)
  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden relative bg-[#f8fafd] text-right">
      {/* Top Subtle Status Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200/60 bg-white/70 backdrop-blur-xs flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
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
        </div>

        <button
          onClick={handleResetChat}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          title="שיחה חדשה"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>שיחה חדשה</span>
        </button>
      </div>

      {/* Messages Feed: Full Viewport Width, Comfortable Centered Max-Width Reading Column */}
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
                              onUndo={handleUndoEntry}
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
              className="py-1 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>עצור ושלח</span>
            </button>
          </div>
        )}

        {/* Floating Pill Input Bar */}
        <div className="w-full rounded-3xl bg-[#f0f4f9] hover:bg-[#e9eef6] focus-within:bg-white focus-within:shadow-xl border border-slate-200/90 transition-all p-2.5 pl-4 flex items-center gap-3">
          {/* Plus icon on right (start) */}
          <button
            type="button"
            onClick={handleResetChat}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0 shadow-xs cursor-pointer"
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
            placeholder={isRecording ? "מקליט כעת (עד 2 דקות)..." : "הזן דיווח טכני מפורט או הקלט הודעה קולית..."}
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none py-1.5"
          />

          {/* Microphone icon */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
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
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer"
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
  );
};
