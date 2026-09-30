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
        setRecordingSeconds((prev) => prev + 1);
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

  // Format recording timer: 00:07
  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? "0" + mins : mins}:${remainder < 10 ? "0" + remainder : remainder}`;
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
      });

      handleChatResponse(res, true);
    } catch (err: any) {
      console.error("[handleSendAudio] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: `שגיאה בעיבוד ההקלטה: ${err?.message || "נא לנסות שוב"}`,
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
      });

      handleChatResponse(res, false);
    } catch (err: any) {
      console.error("[handleSendText] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: `שגיאה: ${err?.message || "נא לנסות שוב"}`,
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
      });

      handleChatResponse(res, false);
    } catch (err: any) {
      console.error("[handleConfirmEntry] Error:", err);
      alert(`שגיאה בהזנת שורה: ${err?.message || "נא לנסות שוב"}`);
    } finally {
      setLoading(false);
    }
  };

  // Direct Card Undo Handler
  const handleUndoEntry = async (cardId: string) => {
    try {
      setLoading(true);
      setLoadingStep("מבטל שורה מגיליון ה-Excel...");

      const res = await apiAssistantChat({
        action: "undo_entry",
        cardId,
        activeDrafts,
      });

      handleChatResponse(res, false);
    } catch (err: any) {
      console.error("[handleUndoEntry] Error:", err);
      alert(`שגיאה בביטול שורה: ${err?.message || "נא לנסות שוב"}`);
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
      prompt: "הייתי שעה וחצי באסיו תיקון שרת",
      tag: "שעות עבודה",
    },
    {
      icon: <Compass className="w-4 h-4 text-blue-500" />,
      prompt: "שעתיים בטיקטים עבור שחר שירותי תוכנה",
      tag: "טיקטים",
    },
    {
      icon: <FileText className="w-4 h-4 text-purple-500" />,
      prompt: "ביקור באתר מנורה מבטחים, 3 שעות",
      tag: "ביקור באתר",
    },
  ];

  const handleResetChat = () => {
    setMessages([]);
    setActiveDrafts([]);
    setInputText("");
  };

  // Unified Render: Full viewport height, no nested boxed cube, mobile-native layout
  return (
    <div className="w-full h-full flex flex-col flex-1 relative overflow-hidden bg-transparent">
      {/* Soft Ethereal Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[42rem] h-[20rem] sm:h-[28rem] bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-indigo-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Scrollable Canvas / Feed */}
      <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-32 flex flex-col">
        {/* Empty Start View (Clean, spacious, matching the video) */}
        {messages.length === 0 && activeDrafts.length === 0 && !loading ? (
          <div className="my-auto py-6 sm:py-12 flex flex-col items-center justify-center text-center">
            {/* Big Calm Heading */}
            <h1 className="text-2xl sm:text-4xl font-normal text-slate-800 tracking-tight mb-2">
              Where should we start?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6 sm:mb-8">
              מה תרצה לתעד היום? הקלד או הקלט בקולך
            </p>

            {/* Microphone Permission Error Banner */}
            {micPermissionError && (
              <div className="w-full max-w-lg mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-2 text-right">
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

            {/* 3 Prompt Suggestions (Clean touch-friendly pills for mobile) */}
            <div className="w-full max-w-lg space-y-2.5 text-right">
              {quickSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendText(item.prompt)}
                  className="w-full p-3 sm:p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs text-right flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 truncate">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium truncate">
                      {item.prompt}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60 shrink-0">
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Stream */
          <div className="w-full space-y-4">
            {/* Top Stream Bar */}
            <div className="w-full flex items-center justify-between py-1 px-1 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">שיחה פעילה</span>
                {activeDrafts.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    {activeDrafts.length} טיוטות
                  </span>
                )}
              </div>

              <button
                onClick={handleResetChat}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                title="התחל שיחה חדשה"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>שיחה חדשה</span>
              </button>
            </div>

            {/* Messages Feed */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-start" : "items-end"} space-y-2`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-blue-600 text-white rounded-br-xs self-start"
                        : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs self-end"
                    }`}
                  >
                    {/* Voice badge if message came from voice */}
                    {msg.isVoice && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-200 mb-1 font-semibold pb-1 border-b border-white/20">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>תמלול קולי</span>
                      </div>
                    )}

                    <p className="whitespace-pre-line text-right">{msg.text}</p>

                    <div
                      className={`text-[10px] mt-1.5 flex items-center ${
                        isUser ? "text-blue-100 justify-start" : "text-slate-400 justify-end"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Render Cards attached to this turn */}
                  {!isUser && msg.drafts && msg.drafts.length > 0 && (
                    <div className="w-full space-y-2 mt-1">
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
                  {!isUser && msg.writtenEntries && msg.writtenEntries.length > 0 && (
                    <div className="w-full space-y-2 mt-1">
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
                </div>
              );
            })}

            {/* Global Active Drafts if not in the last message */}
            {activeDrafts.length > 0 &&
              !messages[messages.length - 1]?.drafts?.length && (
                <div className="w-full space-y-2 pt-2">
                  <div className="text-[11px] text-blue-600 font-semibold mb-1 text-right">
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
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 max-w-[80%] sm:max-w-[70%] mr-auto shadow-2xs animate-pulse">
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                <span className="text-xs text-slate-700 font-medium">{loadingStep}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Floating Pill Input Bar Fixed at the Bottom (Always docked, Mobile First) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pb-3 sm:pb-5 pt-4 bg-gradient-to-t from-[#fafafc] via-[#fafafc]/95 to-transparent">
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pointer-events-auto flex flex-col gap-2">
          {/* Active Audio Recording Bar */}
          {isRecording && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50 border border-red-200 animate-pulse shadow-sm">
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

          {/* Floating Center Pill */}
          <div className="w-full rounded-full bg-white border border-slate-200/90 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-slate-300 transition-all p-1.5 sm:p-2 pr-3.5 sm:pr-4 flex items-center gap-2 sm:gap-2.5">
            {/* Plus icon on right (start) */}
            <button
              type="button"
              onClick={handleResetChat}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="שיחה חדשה"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Text Input - text-base prevents iOS Safari zoom on focus */}
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
              placeholder={isRecording ? "מקליט כעת..." : "Ask Gemini..."}
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-base sm:text-sm focus:outline-none py-1 text-right"
              dir="rtl"
            />

            {/* Tag on sm+ */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600 shrink-0">
              <span>Tech-Select</span>
            </div>

            {/* Microphone icon */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-slate-500 hover:text-blue-600 hover:bg-slate-100"
              }`}
              title={isRecording ? "עצור הקלטה" : "הקלט הודעה קולית"}
            >
              {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </button>

            {/* Send icon if text */}
            {inputText.trim() && (
              <button
                onClick={() => handleSendText()}
                disabled={loading}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 -scale-x-100" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
