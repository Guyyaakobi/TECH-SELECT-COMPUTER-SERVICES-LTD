import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RefreshCw,
  X,
  Copy,
  Check,
  ShieldCheck,
  Settings2,
  Key,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Zap,
  Unlock,
  ChevronDown,
  Terminal,
  Code2,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface GeminiDebuggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  modelUsed?: string;
  latencyMs?: number;
  timestamp: string;
  isError?: boolean;
  liked?: boolean | null;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Recommended' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Ultra Fast' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', badge: 'Lightweight' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', badge: 'Latest' },
];

const SUGGESTED_CARDS = [
  {
    title: 'בדיקת ביצועים ו-API',
    desc: 'בצע בדיקת מהירות ותקשורת מול שרתי Google GenAI',
    prompt: 'בצע בדיקת ביצועים קצרה של ה-API, הצג את המודל שלך ואת זמן התגובה הצפוי.',
    icon: Zap,
    color: 'from-amber-500/20 to-orange-500/10 text-amber-400'
  },
  {
    title: 'עקרונות Zero-Trust',
    desc: 'ניתוח ארכיטקטורת אבטחה ארגונית מודרנית',
    prompt: 'מהם שלושת עקרונות הליבה של ארכיטקטורת Zero-Trust בארגון וכיצד מיישמים אותם?',
    icon: ShieldCheck,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400'
  },
  {
    title: 'הטמעת AI בארגונים',
    desc: 'כיצד Tech-Select מובילה תהליכי AI Discovery',
    prompt: 'כיצד Tech-Select מסייעת לארגונים לבצע מיפוי והטמעת כלי AI בצורה מאובטחת ומבוקרת?',
    icon: Code2,
    color: 'from-blue-500/20 to-cyan-500/10 text-blue-400'
  },
  {
    title: 'אבחון תשתיות ענן',
    desc: 'הערכת סיכונים ויציבות לסביבות היברידיות',
    prompt: 'אילו נקודות תורפה נפוצות קיימות בתשתיות ענן היברידיות וכיצד מנטרלים אותן?',
    icon: Terminal,
    color: 'from-purple-500/20 to-pink-500/10 text-purple-400'
  }
];

// Authentic Google Gemini 4-pointed Star Logo
export const GeminiStarIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-6 h-6",
  size = 24
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="gemini-star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="35%" stopColor="#9B72CF" />
        <stop offset="70%" stopColor="#D96570" />
        <stop offset="100%" stopColor="#F4B400" />
      </linearGradient>
    </defs>
    <path
      d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
      fill="url(#gemini-star-gradient)"
    />
  </svg>
);

export const GeminiDebuggerModal: React.FC<GeminiDebuggerModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Advanced settings drawer
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (!isUnlocked) {
        setTimeout(() => pinInputRef.current?.focus(), 150);
      } else {
        runHealthCheck();
        setTimeout(() => textareaRef.current?.focus(), 150);
      }
    }
  }, [isOpen, isUnlocked]);

  useEffect(() => {
    if (isUnlocked && isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isUnlocked, isOpen]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1981') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputText('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/ai-discovery/diagnostic', {
        headers: {
          Authorization: 'Bearer tech-select-dev-1981',
        },
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { status: 'error', raw: text };
      }
      setHealthStatus(data);
    } catch (e: any) {
      setHealthStatus({ status: 'offline', error: e.message });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      // Build conversation messages array in standard format for chat endpoints
      const formattedHistory = [
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
          text: m.text
        })),
        {
          role: 'user',
          content: query,
          text: query
        }
      ];

      // Primary: Call the dedicated AI Consultation Chat route
      let res = await fetch('/api/ai-discovery/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer tech-select-dev-1981',
          'X-Session-Token': 'tech-select-dev-1981',
        },
        body: JSON.stringify({
          messages: formattedHistory,
          model: selectedModel,
          prompt: query,
          companyContext: {
            companyName: 'Tech-Select Developer Console',
            role: 'Developer / Admin',
            erpCrm: 'Cloudflare Worker & Express Engine'
          },
          sessionToken: 'tech-select-dev-1981'
        }),
      });

      let responseText = await res.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { success: false, error: `שגיאת שרת (HTTP ${res.status}): ${responseText.slice(0, 150)}` };
      }

      // Seamless fallback: If chat route is unavailable (404/401), try diagnostic endpoint
      if (!res.ok && (res.status === 404 || res.status === 401 || !data?.reply)) {
        try {
          const diagRes = await fetch('/api/ai-discovery/diagnostic', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer tech-select-dev-1981',
            },
            body: JSON.stringify({
              prompt: query,
              model: selectedModel,
            }),
          });
          const diagText = await diagRes.text();
          const diagData = diagText ? JSON.parse(diagText) : {};
          if (diagData && (diagData.reply || diagData.response || diagData.success)) {
            data = diagData;
          }
        } catch {
          // Keep original error data
        }
      }

      const latencyMs = Date.now() - startTime;
      const replyContent = data.reply || data.response || data.text || data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if ((data.success || res.ok) && replyContent) {
        setMessages(prev => [
          ...prev,
          {
            id: `gemini-${Date.now()}`,
            sender: 'gemini',
            text: replyContent,
            modelUsed: data.modelUsed || data.model || selectedModel,
            latencyMs: data.totalLatencyMs || data.latencyMs || latencyMs,
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        const errorMsg = typeof data.error === 'object'
          ? (data.error?.message || JSON.stringify(data.error))
          : (data.error || 'לא התקבלה תגובה משרת המודל');

        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'gemini',
            text: `⚠️ שגיאה בתקשורת עם Gemini:\n${errorMsg}`,
            modelUsed: selectedModel,
            latencyMs,
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            isError: true
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'gemini',
          text: `⚠️ שגיאת רשת: לא ניתן להגיע לשרת.\n${err.message || String(err)}`,
          modelUsed: selectedModel,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLike = (id: string, liked: boolean) => {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, liked: m.liked === liked ? null : liked } : m)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[900px] bg-[#131314] border border-[#2d2f31] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#e3e3e3] font-sans">
        
        {/* PIN Authentication Screen (Gemini Workspace Security) */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-radial from-[#1e1f20]/50 to-[#131314]">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-[#1e1f20] border border-[#333537] flex items-center justify-center shadow-2xl">
                <GeminiStarIcon size={40} className="animate-pulse" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl -z-10" />
            </div>
            
            <h2 className="text-3xl font-semibold text-white tracking-tight mb-2 flex items-center gap-2.5">
              <span>Google Gemini Studio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#282a2c] text-[#c4c7c5] border border-[#3c4043] font-mono">
                Edge v3
              </span>
            </h2>
            <p className="text-[#8e918f] text-sm max-w-md mb-8 leading-relaxed">
              סביבת פיתוח ואבחון מקושרת בזמן אמת ל-Google GenAI API ותשתיות הענן של Tech-Select.
            </p>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-4">
              <div className="relative">
                <input
                  ref={pinInputRef}
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="הזן קוד גישה (PIN)"
                  className={`w-full px-5 py-3.5 rounded-full bg-[#1e1f20] border text-center text-lg tracking-[0.3em] text-white placeholder-[#8e918f] outline-none transition duration-200 ${
                    pinError
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-[#3c4043] focus:border-[#4285f4] focus:ring-2 focus:ring-[#4285f4]/20'
                  }`}
                />
                {pinError && (
                  <p className="text-red-400 text-xs mt-2 font-medium">קוד אבטחה שגוי. נסה שוב.</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#4285f4] via-[#9b72cf] to-[#d96570] hover:opacity-95 text-white font-medium shadow-lg shadow-blue-500/20 transition transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                כניסה ל-Gemini
              </button>
            </form>

            <button
              onClick={onClose}
              className="mt-8 text-xs text-[#8e918f] hover:text-[#c4c7c5] transition"
            >
              ביטול וחזרה לאתר
            </button>
          </div>
        ) : (
          /* Main Authentic Google Gemini Studio Interface */
          <>
            {/* Top Gemini Header Bar */}
            <header className="h-16 px-4 sm:px-6 border-b border-[#2d2f31] flex items-center justify-between bg-[#131314]/90 backdrop-blur shrink-0 select-none">
              {/* Left Brand Area (RTL: right side) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GeminiStarIcon size={26} />
                  <span className="font-medium text-white text-lg tracking-tight">Gemini</span>
                </div>

                {/* Model Selector Pill (Gemini Style) */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="appearance-none bg-[#1e1f20] hover:bg-[#282a2c] text-[#e3e3e3] text-xs font-medium py-1.5 pr-3 pl-8 rounded-full border border-[#3c4043] outline-none cursor-pointer focus:border-[#4285f4] transition"
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#1e1f20] text-white">
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-2">
                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  title="שיחה חדשה"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] text-xs text-[#e3e3e3] transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-[#4285f4]" />
                  <span className="hidden sm:inline">שיחה חדשה</span>
                </button>

                {/* Settings / Health Diagnostics Button */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="אבחון והגדרות שרת"
                  className={`p-2 rounded-full border transition ${
                    showSettings
                      ? 'bg-[#4285f4]/20 border-[#4285f4]/50 text-[#4285f4]'
                      : 'bg-[#1e1f20] border-[#3c4043] text-[#8e918f] hover:text-white hover:bg-[#282a2c]'
                  }`}
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#1e1f20] border border-[#3c4043] text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Advanced Settings Drawer (Diagnostics / Override) */}
            {showSettings && (
              <div className="p-4 bg-[#1e1f20] border-b border-[#2d2f31] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-xs animate-fadeIn">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-[#c4c7c5] mb-1.5 flex items-center gap-1.5 font-medium">
                    <Key className="w-3.5 h-3.5 text-[#4285f4]" />
                    הזנת מפתח API אישי זמני (אופציונלי):
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="השאר ריק כדי להשתמש במפתח המוגדר ב-Cloudflare (מומלץ)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#131314] border border-[#3c4043] text-[#e3e3e3] placeholder-[#8e918f] outline-none focus:border-[#4285f4] font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8e918f]">סטטוס שרת:</span>
                    {healthStatus?.hasApiKey ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" /> מפתח פעיל בענן
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#c4c7c5] bg-[#282a2c] px-2.5 py-1 rounded-full border border-[#3c4043]">
                        {healthStatus?.environment || 'Cloudflare Worker'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={runHealthCheck}
                    disabled={isCheckingHealth}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#333537] text-white font-medium transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin text-[#4285f4]' : ''}`} />
                    בדוק חיבור
                  </button>
                </div>
              </div>
            )}

            {/* Conversation or Gemini Hero Greeting Screen */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
              {messages.length === 0 ? (
                /* Authentic Gemini Greeting Screen */
                <div className="h-full flex flex-col justify-center max-w-3xl mx-auto py-6">
                  {/* Big Gradient Headline */}
                  <div className="mb-8">
                    <h1 className="text-3xl sm:text-5xl font-medium tracking-tight mb-2">
                      <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cf] to-[#d96570] bg-clip-text text-transparent">
                        שלום, במה אוכל לעזור היום?
                      </span>
                    </h1>
                    <p className="text-[#8e918f] text-base sm:text-lg font-normal">
                      שאל שאלות הנדסיות, בצע אבחון מהיר לתשתיות או בדוק את מנוע ה-AI של Tech-Select.
                    </p>
                  </div>

                  {/* 4 Google-Style Suggestion Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {SUGGESTED_CARDS.map((card, idx) => {
                      const IconComponent = card.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(card.prompt)}
                          disabled={isLoading}
                          className="group text-right p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#2d2f31] hover:border-[#3c4043] transition-all duration-200 flex flex-col justify-between h-32 text-slate-100 hover:shadow-lg"
                        >
                          <div>
                            <span className="block font-medium text-sm text-white group-hover:text-[#4285f4] transition">
                              {card.title}
                            </span>
                            <span className="block text-xs text-[#8e918f] mt-1 line-clamp-2 leading-relaxed">
                              {card.desc}
                            </span>
                          </div>
                          <div className="flex justify-end mt-2">
                            <div className="w-8 h-8 rounded-full bg-[#131314] flex items-center justify-center border border-[#333537] group-hover:border-[#4285f4]/50 transition">
                              <IconComponent className="w-4 h-4 text-[#c4c7c5] group-hover:text-[#4285f4] transition" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Chat Messages Flow */
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((msg) => {
                    const isGemini = msg.sender === 'gemini';
                    return (
                      <div key={msg.id} className="space-y-2">
                        {isGemini ? (
                          /* Gemini Response (Gemini Layout: Icon + Full Width Text) */
                          <div className="flex items-start gap-4 animate-fadeIn">
                            <div className="shrink-0 mt-1">
                              <GeminiStarIcon size={24} />
                            </div>

                            <div className="flex-1 space-y-2 min-w-0">
                              <div
                                className={`text-base leading-relaxed whitespace-pre-wrap select-text font-normal ${
                                  msg.isError ? 'text-red-300 bg-red-950/20 p-4 rounded-2xl border border-red-900/30' : 'text-[#e3e3e3]'
                                }`}
                              >
                                {msg.text}
                              </div>

                              {/* Gemini Action Bar (Copy, Feedback, Metadata) */}
                              {!msg.isError && (
                                <div className="flex items-center gap-3 pt-2 text-xs text-[#8e918f]">
                                  <button
                                    onClick={() => handleCopyText(msg.id, msg.text)}
                                    className="p-1.5 rounded-full hover:bg-[#282a2c] hover:text-white transition"
                                    title="העתק ללוח"
                                  >
                                    {copiedId === msg.id ? (
                                      <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleToggleLike(msg.id, true)}
                                    className={`p-1.5 rounded-full hover:bg-[#282a2c] transition ${
                                      msg.liked === true ? 'text-[#4285f4]' : 'hover:text-white'
                                    }`}
                                    title="תשובה טובה"
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleLike(msg.id, false)}
                                    className={`p-1.5 rounded-full hover:bg-[#282a2c] transition ${
                                      msg.liked === false ? 'text-rose-400' : 'hover:text-white'
                                    }`}
                                    title="תשובה לא מדויקת"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </button>

                                  <div className="h-3 w-px bg-[#333537] mx-1" />

                                  <span className="font-mono text-[11px] text-[#4285f4]">
                                    {msg.modelUsed}
                                  </span>

                                  {msg.latencyMs !== undefined && (
                                    <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                                      <Zap className="w-3 h-3" />
                                      {msg.latencyMs}ms
                                    </span>
                                  )}

                                  <span className="text-[11px] text-[#8e918f]">
                                    {msg.timestamp}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* User Prompt (Right-aligned dark bubble, Gemini Style) */
                          <div className="flex justify-start">
                            <div className="max-w-[85%] bg-[#282a2c] text-white px-5 py-3 rounded-3xl text-base leading-relaxed shadow-sm">
                              {msg.text}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Gemini Shimmering Thinking State */}
                  {isLoading && (
                    <div className="flex items-start gap-4 animate-fadeIn">
                      <div className="shrink-0 mt-1">
                        <GeminiStarIcon size={24} className="animate-spin" />
                      </div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#4285f4] animate-ping" />
                          <span className="text-sm font-medium bg-gradient-to-r from-[#4285f4] via-[#9b72cf] to-[#d96570] bg-clip-text text-transparent">
                            Gemini חושב ומעבד תשובה...
                          </span>
                        </div>
                        <div className="h-3.5 w-3/4 rounded-full bg-[#1e1f20] animate-pulse" />
                        <div className="h-3.5 w-1/2 rounded-full bg-[#1e1f20] animate-pulse" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Quick Suggestion Pills if already in conversation */}
            {messages.length > 0 && (
              <div className="px-4 sm:px-8 py-2 border-t border-[#2d2f31]/60 bg-[#131314] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-[#8e918f] shrink-0">המשך שיחה:</span>
                {SUGGESTED_CARDS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(c.prompt)}
                    disabled={isLoading}
                    className="shrink-0 text-xs px-3 py-1 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333537] transition whitespace-nowrap"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Input Area (The Iconic Gemini Pill) */}
            <footer className="p-4 sm:p-6 bg-[#131314] shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end bg-[#1e1f20] hover:bg-[#232527] focus-within:bg-[#232527] border border-[#3c4043] focus-within:border-[#4285f4]/80 focus-within:ring-2 focus-within:ring-[#4285f4]/20 rounded-[28px] p-2 transition duration-200 shadow-lg">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="שאל משהו, בקש אבחון או רשום פרומפט ל-Gemini..."
                    className="flex-1 px-4 py-2.5 bg-transparent text-base text-white placeholder-[#8e918f] resize-none outline-none leading-relaxed min-h-[44px] max-h-[140px]"
                  />

                  <div className="flex items-center gap-1 pl-1 pb-1">
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim() || isLoading}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4285f4] via-[#9b72cf] to-[#d96570] hover:opacity-90 disabled:opacity-30 disabled:hover:opacity-30 text-white shadow-md transition transform active:scale-95 flex items-center justify-center shrink-0"
                      title="שלח ל-Gemini"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 rotate-180" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Gemini Disclaimer */}
                <p className="text-center text-[11px] text-[#8e918f] mt-2.5 font-normal select-none">
                  Gemini עשוי להציג מידע לא מדויק, כולל לגבי אנשים. לכן יש לאמת את התשובות שלו.
                </p>
              </div>
            </footer>
          </>
        )}

      </div>
    </div>
  );
};
