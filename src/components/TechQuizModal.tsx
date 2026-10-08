import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/content';
import { X, Shield, RotateCcw, Send, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TechQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechQuizModal: React.FC<TechQuizModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentQ = QUIZ_QUESTIONS[currentStep];

  const handleSelectOption = (points: number) => {
    const updated = [...answers, points];
    setAnswers(updated);

    if (currentStep + 1 < QUIZ_QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
    }
  };

  const totalScore = answers.reduce((a, b) => a + b, 0);
  const maxScore = QUIZ_QUESTIONS.length * 3;
  const scorePercent = Math.round((totalScore / maxScore) * 100);

  const getRiskLevel = () => {
    if (scorePercent >= 80) return { title: 'רמת אבטחה גבוהה', color: 'text-emerald-500', desc: 'המערכות שלכם מאובטחות היטב! מומלץ להמשיך לבצע מבדקי חדירות תקופתיים.' };
    if (scorePercent >= 50) return { title: 'רמת אבטחה בינונית', color: 'text-amber-500', desc: 'קיימות פירצות אבטחה וסיכונים מוגברים למתקפות כופר. מומלץ לחזק את הגיבוי וה-MFA.' };
    return { title: 'רמת סיכון קריטית!', color: 'text-rose-500', desc: 'מערך ה-IT שלכם חשוף מאוד! מומלץ לבצע סקר סיכונים מיידי למניעת השבתת העסק.' };
  };

  const riskInfo = getRiskLevel();

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setIsFinished(false);
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl border rounded-2xl overflow-hidden p-6 text-right transition-all duration-200 backdrop-blur-2xl ${
        isDark 
          ? 'bg-[#0a1122]/85 border-white/[0.14] text-slate-100 shadow-[0_20px_60px_0_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.14)]' 
          : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-[0_20px_50px_0_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.95)]'
      }`}>
        
        {/* Top Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 font-bold text-sm font-heading ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            <Shield className="w-5 h-5" />
            <span>שאלון בדיקת מוכנות IT וסייבר</span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white bg-white/[0.04] border-white/[0.08]' 
                : 'text-slate-500 hover:text-slate-900 bg-slate-100 border-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {!isFinished && (
          <div className="my-4 space-y-1">
            <div className={`flex justify-between text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>שאלה {currentStep + 1} מתוך {QUIZ_QUESTIONS.length}</span>
              <span>{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {!isFinished ? (
          <div className="space-y-4 py-2">
            <h3 className={`text-base font-bold font-heading leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentQ.question}
            </h3>

            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option.points)}
                  className={`w-full text-right p-3.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer backdrop-blur-md ${
                    isDark 
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-200 hover:border-cyan-500/50' 
                      : 'bg-white/70 hover:bg-blue-50/60 border-slate-200/80 text-slate-800 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-6 text-center">
            <div className="space-y-2">
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>ציון מוכנות IT כולל:</span>
              <div className={`text-4xl sm:text-5xl font-black font-sans ${isDark ? 'gemini-text-gradient' : 'text-blue-600'}`}>
                {scorePercent}%
              </div>
              <div className={`text-lg font-bold ${riskInfo.color}`}>
                {riskInfo.title}
              </div>
              <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {riskInfo.desc}
              </p>
            </div>

            {!submitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className={`p-4 rounded-xl border space-y-3 text-right backdrop-blur-md ${
                  isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white/70 border-slate-200/80'
                }`}
              >
                <div className={`text-xs font-bold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                  מעוניינים בדו"ח סיכונים מפורט והמלצות יישום ללא עלות?
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-xs outline-none border transition-colors ${
                      isDark 
                        ? 'bg-[#05070c] text-white border-white/[0.08] focus:border-blue-500' 
                        : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500'
                    }`}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="מספר טלפון"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-xs outline-none border transition-colors font-sans ${
                      isDark 
                        ? 'bg-[#05070c] text-white border-white/[0.08] focus:border-blue-500' 
                        : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>שליחת בקשה לקבלת הדו"ח</span>
                </button>
              </form>
            ) : (
              <div className={`p-4 rounded-xl border text-xs font-medium ${
                isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                תודה {name}! מומחה מערכות מ-TECH-SELECT יצור עמך קשר להצגת הניתוח והמלצות לשיפור.
              </div>
            )}

            <button
              onClick={resetQuiz}
              className={`inline-flex items-center gap-1.5 text-xs font-sans transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ביצוע השאלון מחדש</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
