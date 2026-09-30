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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: `שלום ${currentUser.name}, אני עוזר ה-AI לתיעוד שעות ב-Tech-Select.\nתוכל להקליט הודעה קולית או להקליד מה ביצעת (למשל: "דיברתי עכשיו עם כהן רבע שעה, איפסתי סיסמה למייל"), ואכין עבורך כרטיס סיכום מדויק להזנה ישירה לקובץ ה-Excel.`,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

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

  // Quick Action Chips
  const quickChips = [
    "טיקטים: דיברתי עכשיו עם כהן חצי שעה, טיפלתי ב-VPN",
    "ביקור באתר: הייתי שעתיים אצל אלקטרה, בדיקת שרתים פיזית",
    "פרוייקטים: 3 שעות הקמת תשתית ענן חדשה",
    "כן, מאשר להזין",
  ];

  return (
    <div className="w-full flex flex-col h-[78vh] sm:h-[82vh] max-h-[850px] bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative text-right">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-36 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">עוזר AI לתיעוד שעות</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Stage 3 פעיל
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              זיהוי קולי וטקסט &middot; עובד: <span className="text-slate-200">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeDrafts.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{activeDrafts.length} טיוטות</span>
            </span>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 z-10 selection:bg-blue-600 selection:text-white">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-start" : "items-end"} space-y-2`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-xs"
                    : "bg-white/[0.06] border border-white/10 text-slate-100 rounded-bl-xs"
                }`}
              >
                {/* Voice badge if message came from voice */}
                {msg.isVoice && (
                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-200 mb-1 font-semibold pb-1 border-b border-white/20">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>תמלול קולי</span>
                  </div>
                )}

                <p className="whitespace-pre-line">{msg.text}</p>

                <div
                  className={`text-[10px] mt-1.5 flex items-center ${
                    isUser ? "text-blue-200 justify-start" : "text-slate-400 justify-end"
                  }`}
                >
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {/* Render Cards attached to this turn or global active drafts */}
              {!isUser && msg.drafts && msg.drafts.length > 0 && (
                <div className="w-full sm:max-w-[85%] space-y-2 mt-1">
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
                <div className="w-full sm:max-w-[85%] space-y-2 mt-1">
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
            <div className="w-full sm:max-w-[85%] mr-auto space-y-2 pt-2">
              <div className="text-[11px] text-cyan-300 font-semibold mb-1">
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
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 max-w-[75%] mr-auto animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
            <span className="text-xs text-slate-300">{loadingStep}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-10">
        <span className="text-[10px] text-slate-400 flex-shrink-0">הצעות מהירות:</span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendText(chip)}
            disabled={loading || isRecording}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Bottom Input Area: Big Microphone + Text Box (Mobile First) */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-black/60 backdrop-blur-md z-10 flex flex-col gap-2.5">
        {/* Microphone Permission Diagnostic & Guidance Banner */}
        {micPermissionError && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col gap-2 relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <MicOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{micPermissionError.title}</span>
              </div>
              <button
                onClick={() => setMicPermissionError(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="סגור הודעה"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-amber-100/90 leading-relaxed">
              {micPermissionError.details}
            </p>

            <div className="bg-black/30 p-2.5 rounded-xl border border-amber-500/20 text-[11px] space-y-1">
              <span className="font-semibold text-amber-300 block">כיצד לאפשר:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {micPermissionError.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
              <span className="text-[11px] text-slate-400">
                💡 תוכל להמשיך להקליד כרגיל בתיבת הטקסט שלמטה
              </span>
              <div className="flex items-center gap-2">
                {micPermissionError.openInNewTabUrl && (
                  <a
                    href={micPermissionError.openInNewTabUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow"
                  >
                    <span>פתח בלשונית נפרדת</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={startRecording}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  נסה שוב
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Audio Recording Bar */}
        {isRecording && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-red-950/40 border border-red-500/40 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-red-200">מקליט...</span>
              <span className="font-mono text-xs text-white bg-black/40 px-2 py-0.5 rounded-lg border border-red-500/30">
                {formatRecordingTime(recordingSeconds)}
              </span>
            </div>

            <button
              onClick={stopRecording}
              className="py-1 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>עצור ושלח</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Big Microphone Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl flex-shrink-0 active:scale-95 ${
              isRecording
                ? "bg-red-600 text-white ring-4 ring-red-500/40 animate-bounce"
                : "bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/30"
            }`}
            title={isRecording ? "לחץ לעצירה ושליחה" : "הקלט הודעה קולית (לחץ להתחלה)"}
          >
            {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input Box */}
          <div className="flex-1 relative flex items-center">
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
              placeholder={isRecording ? "מקליט כעת..." : "תאר פעילות... (או הקלט במיקרופון)"}
              className="w-full py-3 sm:py-3.5 pr-4 pl-12 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50"
            />

            {/* Send Button inside Input */}
            <button
              onClick={() => handleSendText()}
              disabled={!inputText.trim() || loading || isRecording}
              className="absolute left-2 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
