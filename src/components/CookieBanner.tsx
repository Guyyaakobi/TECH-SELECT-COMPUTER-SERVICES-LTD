import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const { isHe } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tech_select_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    } else {
      setHasInteracted(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('tech_select_cookie_consent', 'accepted');
    setIsVisible(false);
    setHasInteracted(true);
  };

  const handleDecline = () => {
    localStorage.setItem('tech_select_cookie_consent', 'declined');
    setIsVisible(false);
    setHasInteracted(true);
  };

  const handleResetCookieNotice = () => {
    setIsVisible(true);
  };

  return (
    <>
      {/* Floating Persistent Cookie Icon Toggle Button */}
      {hasInteracted && !isVisible && (
        <button
          onClick={handleResetCookieNotice}
          className={`fixed bottom-6 ${isHe ? 'right-6' : 'left-6'} z-[140] p-3 rounded-full bg-[#0a0d18]/95 hover:bg-[#13192a] text-amber-400 border border-amber-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all hover:scale-110 cursor-pointer group ring-1 ring-amber-400/20`}
          title={isHe ? 'הגדרות עוגיות ופרטיות' : 'Cookie & Privacy Settings'}
          aria-label={isHe ? 'הגדרות עוגיות' : 'Cookie Settings'}
        >
          <Cookie className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Main Bottom Cookie Consent Popup Banner */}
      {isVisible && (
        <div
          className={`fixed bottom-4 inset-x-4 md:inset-x-auto ${
            isHe ? 'md:left-6' : 'md:right-6'
          } md:max-w-md z-[150] animate-in slide-in-from-bottom-8 duration-500 ease-out`}
        >
          <div className="bg-[#080b14]/98 backdrop-blur-2xl border-2 border-cyan-500/40 text-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-4 sm:p-5 flex flex-col gap-3.5 ring-1 ring-cyan-400/20">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm font-heading">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Cookie className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <span>{isHe ? 'מדיניות עוגיות (Cookies) ואבטחת מידע' : 'Cookie Policy & Data Security'}</span>
              </div>
              <button
                onClick={handleDecline}
                className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label={isHe ? 'סגירה' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {isHe
                ? 'אתר TECH-SELECT עושה שימוש בעוגיות (Cookies) ובטכנולוגיות אבטחה מתקדמות לשיפור חוויית הגלישה, התאמת תכנים ושמירה קפדנית על פרטיות הנתונים.'
                : 'TECH-SELECT uses cookies & security protocols to enhance browsing, personalize content, and uphold strict data privacy.'}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
              <button
                onClick={onOpenPrivacy}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                {isHe ? 'מדיניות פרטיות' : 'Privacy Policy'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecline}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all cursor-pointer"
                >
                  {isHe ? 'הכרחי בלבד' : 'Essential Only'}
                </button>
                <button
                  onClick={handleAccept}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isHe ? 'אישור עוגיות' : 'Accept Cookies'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
