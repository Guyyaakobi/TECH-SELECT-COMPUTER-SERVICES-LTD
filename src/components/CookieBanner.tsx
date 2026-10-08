import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tech_select_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    } else {
      setHasInteracted(true);
    }
  }, []);

  // Listen for Concierge window toggle to ensure cookie banner NEVER overlaps the chat prompt
  useEffect(() => {
    const handleConciergeToggle = (e: any) => {
      if (e?.detail && typeof e.detail.isOpen === 'boolean') {
        setIsConciergeOpen(e.detail.isOpen);
      }
    };
    window.addEventListener('tech-select-concierge-toggle', handleConciergeToggle);
    return () => {
      window.removeEventListener('tech-select-concierge-toggle', handleConciergeToggle);
    };
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
      {/* Floating Persistent Cookie Icon Toggle Button - Stacked cleanly above Accessibility Toolbar on the bottom-left */}
      {hasInteracted && !isVisible && !isConciergeOpen && (
        <button
          onClick={handleResetCookieNotice}
          className={`fixed bottom-20 left-6 z-40 p-2.5 rounded-full shadow-lg backdrop-blur-xl transition-all hover:scale-110 cursor-pointer group border ${
            isDark 
              ? 'bg-[#070b12]/95 hover:bg-[#0c121e] text-amber-400 border-white/[0.08]' 
              : 'bg-white hover:bg-slate-50 text-amber-500 border-slate-300/80 shadow-slate-900/10'
          }`}
          title={isHe ? 'הגדרות עוגיות ופרטיות' : 'Cookie & Privacy Settings'}
          aria-label={isHe ? 'הגדרות עוגיות' : 'Cookie Settings'}
        >
          <Cookie className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Main Cookie Consent Popup Banner - positioned cleanly above the bottom toolbar */}
      {isVisible && !isConciergeOpen && (
        <div
          className="fixed bottom-20 left-4 right-4 md:right-auto md:left-6 md:bottom-20 md:max-w-md z-[70] animate-in slide-in-from-bottom-8 duration-500 ease-out pointer-events-auto"
        >
          <div className={`backdrop-blur-2xl rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 border shadow-2xl transition-colors duration-200 ${
            isDark 
              ? 'bg-[#070b12]/98 border-white/[0.08] text-white' 
              : 'bg-white/98 border-slate-300/80 text-slate-900 shadow-slate-900/15'
          }`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between gap-3 border-b pb-2.5 ${
              isDark ? 'border-white/[0.08]' : 'border-slate-100'
            }`}>
              <div className={`flex items-center gap-2.5 font-bold text-sm font-heading ${
                isDark ? 'text-cyan-300' : 'text-slate-900'
              }`}>
                <div className={`p-1.5 rounded-lg border ${
                  isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
                }`}>
                  <Cookie className="w-4 h-4 animate-pulse" />
                </div>
                <span>{isHe ? 'מדיניות עוגיות (Cookies) ואבטחת מידע' : 'Cookie Policy & Data Security'}</span>
              </div>

              <button
                onClick={handleDecline}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                aria-label="סגירה"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className={`text-xs leading-relaxed font-normal ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {isHe ? (
                <>
                  באתר TECH-SELECT אנו משתמשים בקובצי Cookies ובטכנולוגיות ניטור מאובטחות לצורך שיפור חוויית הגלישה, התאמת נגישות, אבטחת מידע וניתוח תעבורה ארגונית. אנו שומרים על פרטיותך באופן המחמיר ביותר.
                </>
              ) : (
                <>
                  TECH-SELECT uses essential cookies to guarantee cybersecurity, accessibility compliance, and optimized portal performance. No sensitive private data is shared.
                </>
              )}
            </p>

            {/* Privacy Link */}
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={onOpenPrivacy}
                className={`underline font-sans text-[11px] font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {isHe ? 'קריאת מדיניות הפרטיות המלאה' : 'Read Full Privacy Policy'}
              </button>
              <span className={`text-[10px] font-sans flex items-center gap-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>SSL Encrypted</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAccept}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isHe ? 'אישור כל העוגיות' : 'Accept All'}</span>
              </button>

              <button
                onClick={handleDecline}
                className={`py-2 px-3 rounded-xl text-xs font-sans font-medium transition-colors border cursor-pointer ${
                  isDark 
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {isHe ? 'הכרחיות בלבד' : 'Essential Only'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
