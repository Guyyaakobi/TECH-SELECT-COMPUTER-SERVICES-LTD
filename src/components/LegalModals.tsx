import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { useTheme } from '../context/ThemeContext';

interface LegalModalProps {
  type: 'privacy' | 'accessibility' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const { isDark } = useTheme();
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl p-6 text-right max-h-[85vh] flex flex-col transition-colors duration-200 ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 font-bold text-base font-heading ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            <span>{type === 'privacy' ? 'מדיניות פרטיות - TECH-SELECT' : 'הצהרת נגישות היקפית'}</span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white bg-slate-950 border-slate-800' 
                : 'text-slate-500 hover:text-slate-900 bg-slate-100 border-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className={`py-4 overflow-y-auto space-y-4 text-xs leading-relaxed font-normal ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {type === 'privacy' ? (
            <>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>1. כללי:</strong> חברת {COMPANY_INFO.hebrewFullName} ("החברה") מכבדת את פרטיות המשתמשים באתר האינטרנט שלה. מסמך זה מפרט את מדיניות הפרטיות הנהוגה באתר.
              </p>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>2. איסוף מידע:</strong> הנתונים שנמסרים על ידך בטופסי יצירת הקשר (שם, טלפון, דוא"ל, שם חברה) נאספים אך ורק לצורך מתן מענה לפנייתך, מתן הצעת מחיר ויצירת קשר מקצועי.
              </p>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>3. אבטחת מידע:</strong> החברה מפעילה מערכות אבטחת מידע מתקדמות ביותר (SSL, EDR, הצפנה) להגנה על המידע שנמסר באתר.
              </p>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>4. אי מציאת ספאם:</strong> הפרטים שנמסרים על ידך לא יועברו לצדדים שלישיים ללא הסכמתך המפורשת, למעט ככל שיידרש על פי חוק.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>הצהרת נגישות:</strong> {COMPANY_INFO.hebrewFullName} רואה חשיבות עליונה במתן שירות שוויוני, מכבד ונגיש לכלל האזרחים ובכללם אנשים עם מוגבלות.
              </p>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>התאמות הנגישות באתר:</strong> האתר נבנה בהתאם להנחיות הנגישות בתקן הישראלי (ת"י 5568) ברמה AA והנחיות WCAG 2.1 הבינלאומיות.
              </p>
              <p className="space-y-1">
                • תמיכה בניווט מקלדת מלא.<br />
                • התאמת ניגודיות ושינוי גודל פונט דרך סרגל הנגישות.<br />
                • תיוג תמונות ואלמנטים ויזואליים עבור קוראי מסך.
              </p>
              <p>
                <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>רכז נגישות:</strong> ככל שנתקלתם בקושי בנגישות האתר, נשמח שתפנו אלינו בדוא"ל {COMPANY_INFO.email} ונטפל בפנייתכם בהקדם.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`pt-4 border-t flex justify-end shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
              isDark 
                ? 'bg-slate-950 hover:bg-slate-800 text-white border-slate-800' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            סגור מסמך
          </button>
        </div>

      </div>
    </div>
  );
};
