import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/content';
import { X, Shield, RotateCcw, Send } from 'lucide-react';

interface TechQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechQuizModal: React.FC<TechQuizModalProps> = ({ isOpen, onClose }) => {
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
    if (scorePercent >= 80) return { title: 'רמת אבטחה גבוהה', color: 'text-emerald-400', desc: 'המערכות שלכם מאובטחות היטב! מומלץ להמשיך לבצע מבדקי חדירות תקופתיים.' };
    if (scorePercent >= 50) return { title: 'רמת אבטחה בינונית', color: 'text-amber-400', desc: 'קיימות פירצות אבטחה וסיכונים מוגברים למתקפות כופר. מומלץ לחזק את הגיבוי וה-MFA.' };
    return { title: 'רמת סיכון קריטית!', color: 'text-rose-400', desc: 'מערך ה-IT שלכם חשוף מאוד! מומלץ לבצע סקר סיכונים מיידי למניעת השבתת העסק.' };
  };

  const riskInfo = getRiskLevel();

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setIsFinished(false);
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-right text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm font-heading">
            <Shield className="w-5 h-5" />
            <span>שאלון בדיקת מוכנות IT וסייבר</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-lg transition-colors border border-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        {!isFinished && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono font-medium">
              <span>שאלה {currentStep + 1} מתוך {QUIZ_QUESTIONS.length}</span>
              <span>{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Question View */}
        {!isFinished ? (
          <div className="py-6 space-y-4">
            <h3 className="text-lg font-bold text-white font-heading">
              {currentQ.question}
            </h3>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt.points)}
                  className="w-full text-right p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400 text-slate-200 text-xs font-medium transition-all flex flex-col gap-1 active:scale-98 shadow-sm cursor-pointer"
                >
                  <span className="font-bold text-sm text-white">{opt.label}</span>
                  {opt.explanation && <span className="text-[11px] text-slate-400 font-normal">{opt.explanation}</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Finished Result View */
          <div className="py-6 space-y-6 text-center">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-mono uppercase text-slate-400 block font-bold">ציון מוכנות IT משוער</span>
              <div className="text-4xl font-extrabold font-mono text-cyan-400">
                {scorePercent} / 100
              </div>
              <div className={`text-lg font-bold ${riskInfo.color}`}>
                {riskInfo.title}
              </div>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed font-normal">
                {riskInfo.desc}
              </p>
            </div>

            {!submitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-3 text-right bg-slate-950/80 p-4 rounded-xl border border-slate-800"
              >
                <div className="text-xs font-bold text-white">קבלו דוח מפורט והמלצות לחיזוק ה-IT:</div>
                <input
                  type="text"
                  required
                  placeholder="שם מלא *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2 text-xs outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="מספר טלפון *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>קבלת ייעוץ אבטחה בחינם לתוצאות השאלון</span>
                </button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-bold">
                תודה {name}! יועץ אבטחה מ-TECH-SELECT ייצור איתך קשר בהקדם.
              </div>
            )}

            <button
              onClick={resetQuiz}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>התחל שאלון מחדש</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
