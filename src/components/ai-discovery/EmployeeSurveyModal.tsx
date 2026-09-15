import React, { useState } from 'react';
import { X, Users, Copy, Check, Send, Sparkles, Bot, ThumbsUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface EmployeeSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyId?: string;
  onAddEmployeeFeedback?: (wish: string) => void;
}

export const EmployeeSurveyModal: React.FC<EmployeeSurveyModalProps> = ({
  isOpen,
  onClose,
  companyName,
  companyId = 'ABC123',
  onAddEmployeeFeedback,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Quick Employee Survey Form State
  const [empRole, setEmpRole] = useState('');
  const [empPain, setEmpPain] = useState('');
  const [empAITools, setEmpAITools] = useState<string[]>(['Enterprise AI']);
  const [empWish, setEmpWish] = useState('');

  if (!isOpen) return null;

  const shareableUrl = `https://tech-select.co.il/ai-discovery/company/${companyId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (empWish.trim() && onAddEmployeeFeedback) {
      onAddEmployeeFeedback(empWish.trim());
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 relative shadow-2xl ${
        isDark ? 'bg-slate-900 border-white/15 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              {isHe ? 'סקר עובדים (Employee 360)' : 'Employee 360 Survey'}
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-heading">
              {isHe ? `איסוף רעיונות וכאבים מצוות ${companyName}` : `Collect Insights from ${companyName} Staff`}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          {isHe
            ? 'האפיון המדויק ביותר משלב את חזון ההנהלה יחד עם הצרכים האמיתיים של העובדים בשטח. שלח להם את הקישור הייעודי או התנסה במענה כעובד לדוגמה:'
            : 'Combine top-down management vision with bottom-up employee workflow realities. Share this dedicated survey link with your team:'}
        </p>

        {/* Shareable Link Box */}
        <div className="mb-6 p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-cyan-300 truncate direction-ltr select-all">
            {shareableUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isHe ? 'הועתק!' : 'Copied!') : (isHe ? 'העתק קישור' : 'Copy Link')}</span>
          </button>
        </div>

        {/* Quick Simulator / Employee Feedback Submission */}
        {submitted ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in zoom-in-95">
            <ThumbsUp className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-emerald-400">
              {isHe ? 'תודה! התשובות שוקללו בהצלחה בדוח הארגוני' : 'Thank you! Employee response aggregated into report'}
            </h3>
            <p className="text-xs text-slate-400">
              {isHe ? 'התובנה נוספה לדוח ה-AI Excellence של החברה.' : 'Feedback recorded into AI Excellence score.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-white/10">
            <span className="text-xs font-bold text-slate-300 block">
              {isHe ? 'התנסות במענה על שאלון עובד (4 שאלות קצרות):' : 'Interactive Employee Survey Sample:'}
            </span>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isHe ? '1. מה התפקיד והמחלקה שלך?' : '1. What is your role & team?'}
              </label>
              <input
                type="text"
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value)}
                placeholder={isHe ? 'לדוגמה: מנהל לקוחות / מהנדס פיתוח / רפרנט כספים' : 'e.g. Account Executive / Support Specialist'}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isHe ? '2. איזה תהליך גוזל ממך הכי הרבה זמן או מעצבן אותך?' : '2. What routine task frustrates you the most?'}
              </label>
              <input
                type="text"
                value={empPain}
                onChange={(e) => setEmpPain(e.target.value)}
                placeholder={isHe ? 'לדוגמה: העתקת נתונים ידנית מקבצי PDF למערכת הניהול' : 'e.g. Copying customer orders from email to ERP'}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isHe ? '3. מה היית רוצה ש-AI יעשה עבורך בעבודה ביום-יום?' : '3. What is 1 thing you wish AI did for you daily?'}
              </label>
              <input
                type="text"
                required
                value={empWish}
                onChange={(e) => setEmpWish(e.target.value)}
                placeholder={isHe ? 'לדוגמה: שיסכם עבורי מיילים ארוכים ויכין הצעת טיוטה מוכנה' : 'e.g. Summarize long threads & draft response'}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                {isHe ? 'סגור' : 'Close'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isHe ? 'שלח משוב עובד' : 'Submit Employee Feedback'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
