import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';

interface LegalModalProps {
  type: 'privacy' | 'accessibility' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-right text-slate-100 max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-base font-heading">
            {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            <span>{type === 'privacy' ? 'מדיניות פרטיות – TECH-SELECT' : 'הצהרת נגישות היקפית'}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-lg transition-colors border border-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-normal">
          {type === 'privacy' ? (
            <>
              <p>
                <strong className="text-white font-bold">1. כללי:</strong> חברת {COMPANY_INFO.hebrewFullName} ("החברה") מכבדת את פרטיות המשתמשים באתר האינטרנט שלה. מסמך זה מפרט את מדיניות הפרטיות הנהוגה באתר.
              </p>
              <p>
                <strong className="text-white font-bold">2. איסוף מידע:</strong> הנתונים שנמסרים על ידך בטופסי יצירת הקשר (שם, טלפון, דוא"ל, שם חברה) נאספים אך ורק לצורך מתן מענה לפנייתך, מתן הצעת מחיר ויצירת קשר מקצועי.
              </p>
              <p>
                <strong className="text-white font-bold">3. אבטחת מידע:</strong> החברה מפעילה מערכות אבטחת מידע מתקדמות ביותר (SSL, EDR, הצפנה) להגנה על המידע שנמסר באתר.
              </p>
              <p>
                <strong className="text-white font-bold">4. אי מציאת ספאם:</strong> הפרטים שנמסרים על ידך לא יועברו לצדדים שלישיים ללא הסכמתך המפורשת, למעט ככל שיידרש על פי חוק.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-white font-bold">הצהרת נגישות:</strong> {COMPANY_INFO.hebrewFullName} רואה חשיבות עליונה במתן שירות שוויוני, מכבד ונגיש לכלל האזרחים ובכללם אנשים עם מוגבלות.
              </p>
              <p>
                <strong className="text-white font-bold">התאמות הנגישות באתר:</strong> האתר נבנה בהתאם להנחיות הנגישות בתקן הישראלי (ת"י 5568) ברמה AA והנחיות WCAG 2.1 הבינלאומיות.
              </p>
              <p className="space-y-1">
                • תמיכה בניווט מקלדת מלא.<br />
                • התאמת ניגודיות ושינוי גודל פונט דרך סרגל הנגישות.<br />
                • תיוג תמונות ואלמנטים ויזואליים עבור קוראי מסך.
              </p>
              <p>
                <strong className="text-white font-bold">רכז נגישות:</strong> ככל שנתקלתם בקושי בנגישות האתר, נשמח שתפנו אלינו בדוא"ל {COMPANY_INFO.email} או בטלפון {COMPANY_INFO.phoneLandline} ונטפל בפנייתכם בהקדם.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors border border-slate-800 cursor-pointer"
          >
            סגור מסמך
          </button>
        </div>

      </div>
    </div>
  );
};
