import React from 'react';
import { COMPANY_INFO } from '../data/content';
import { TechSelectLogo } from './TechSelectLogo';
import { MapPin, Navigation, ArrowUp, ShieldAlert, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenAccessibility: () => void;
  onOpenLegalAccessibility?: () => void;
  lang?: 'he' | 'en';
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenAccessibility,
  onOpenLegalAccessibility,
  lang = 'he',
}) => {
  const { isDark } = useTheme();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHe = lang === 'he';

  return (
    <footer className={`pt-16 pb-8 relative overflow-hidden border-t transition-colors duration-300 ${
      isDark 
        ? 'bg-[#04060a] text-slate-300 border-white/[0.08]' 
        : 'bg-slate-100 text-slate-700 border-slate-300/80'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Main Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
        }`}>
          
          {/* Col 1: Brand Info */}
          <div className={`lg:col-span-4 space-y-4 ${isHe ? 'text-right' : 'text-left'}`}>
            <TechSelectLogo theme={isDark ? 'dark' : 'light'} size="md" />

            <p className={`text-xs leading-relaxed max-w-sm font-normal ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {isHe
                ? 'פתרונות מחשוב, ענן, פיתוח מערכות תוכנה מורכבות, סייבר ותשתיות מסווגות לחברות ביטחוניות וארגונים בסטנדרטים המחמירים ביותר.'
                : 'Enterprise IT, cloud architecture, cybersecurity, complex software engineering and defense infrastructure.'}
            </p>

            {/* Quick Navigation Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <a
                href={COMPANY_INFO.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all border ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-cyan-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-blue-700 shadow-xs'
                }`}
              >
                <Navigation className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>{isHe ? 'ניווט ב-Waze' : 'Navigate Waze'}</span>
              </a>

              <a
                href={COMPANY_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all border ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>{isHe ? 'מפות Google' : 'Google Maps'}</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className={`lg:col-span-2 space-y-3 text-xs ${isHe ? 'text-right' : 'text-left'}`}>
            <h4 className={`text-sm font-bold font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isHe ? 'ניווט מהיר' : 'Navigation'}
            </h4>
            <ul className={`space-y-2 font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <li>
                <a href="#defense" className={`transition-colors flex items-center gap-1 ${
                  isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'
                }`}>
                  <ShieldAlert className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  {isHe ? 'חברות ביטחוניות' : 'Defense Sector'}
                </a>
              </li>
              <li>
                <a href="#disaster-game" className="hover:text-red-500 transition-colors text-red-500 font-sans font-bold flex items-center gap-1">
                  <span>🎮</span> <span>{isHe ? 'סימולטור SOC (Disaster)' : 'Choose Your Own Disaster'}</span>
                </a>
              </li>
              <li><a href="#services" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'שירותי IT, ענן & פיתוח' : 'IT & Cloud Services'}</a></li>
              <li><a href="#delivery" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'אודות (מי אנחנו)' : 'About Us'}</a></li>
              <li><a href="#managed" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'מנהל IT מנוהל' : 'Managed IT'}</a></li>
              <li><a href="#sectors" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'פתרונות למגזרים' : 'Industries'}</a></li>
              <li><a href="#knowledge" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'מרכז הידע' : 'Knowledge Base'}</a></li>
              <li><a href="#contact" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'צור קשר' : 'Contact Us'}</a></li>
            </ul>
          </div>

          {/* Col 3: Selected Services */}
          <div className={`lg:col-span-3 space-y-3 text-xs ${isHe ? 'text-right' : 'text-left'}`}>
            <h4 className={`text-sm font-bold font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isHe ? 'התמחויות ביטחוניות & IT' : 'Defense & IT Expertise'}
            </h4>
            <ul className={`space-y-2 font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <li><a href="#defense" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'תשתיות מסווגות & Air-Gap Networks' : 'Classified & Air-Gap Networks'}</a></li>
              <li><a href="#defense" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'עמידה בתקני משרד הביטחון & CMMC' : 'Defense & CMMC Compliance'}</a></li>
              <li><a href="#services" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'אבטחת מידע, EDR & הקשחת עמדות' : 'Cyber Security & EDR'}</a></li>
              <li><a href="#services" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'פתרונות ענן M365 & Azure Gold' : 'M365 & Azure Cloud'}</a></li>
              <li><a href="#services" className={`transition-colors ${isDark ? 'hover:text-cyan-300' : 'hover:text-blue-600'}`}>{isHe ? 'פיתוח מערכות תוכנה מורכבות & API' : 'Complex Software Dev & APIs'}</a></li>
            </ul>

            {/* Ministry of Defence Authorized Supplier Logo Badge */}
            <div className="pt-2">
              <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-sans shadow-xs ${
                isDark 
                  ? 'bg-slate-950 border-cyan-500/30 text-white' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="bg-white p-1 rounded-md shrink-0 border border-slate-200/50">
                  <img src="/mod-logo.svg" alt="משרד הביטחון - Ministry of Defence" width="24" height="24" loading="lazy" decoding="async" className="h-6 w-auto object-contain" />
                </div>
                <div className={isHe ? 'text-right' : 'text-left'}>
                  <span className={`text-[11px] font-bold block leading-tight ${
                    isDark ? 'text-cyan-300' : 'text-blue-700'
                  }`}>
                    {isHe ? 'ספק מורשה משרד הביטחון' : 'Ministry of Defence Supplier'}
                  </span>
                  <span className={`text-[9px] block font-sans leading-tight ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {isHe ? 'מספר ספק: 0011028306' : 'Supplier No. 0011028306'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Hours */}
          <div className={`lg:col-span-3 space-y-3 text-xs ${isHe ? 'text-right' : 'text-left'}`}>
            <h4 className={`text-sm font-bold font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isHe ? 'יצירת קשר ושעות' : 'Contact & Hours'}
            </h4>
            <div className={`space-y-2 font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <div>WhatsApp: <a href={COMPANY_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 dark:text-emerald-400 hover:underline font-bold">{isHe ? 'פנייה ישירה ב-WhatsApp' : 'Direct WhatsApp Chat'}</a></div>
              <div>{isHe ? 'אימייל:' : 'Email:'} <a href={`mailto:${COMPANY_INFO.email}`} className="text-blue-600 dark:text-cyan-300 hover:underline font-sans font-bold" dir="ltr">{COMPANY_INFO.email}</a></div>
              <div className={isDark ? 'text-slate-300 pt-1' : 'text-slate-700 pt-1'}>{COMPANY_INFO.address}</div>
            </div>

            <div className={`pt-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`font-bold block mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isHe ? 'שעות פעילות המשרד:' : 'Office Hours:'}
              </span>
              <div className="font-sans">{isHe ? 'א\'-ה\': 08:30 - 18:00 | מענה SLA בהתאם להסכם' : 'Sun-Thu: 08:30 - 18:00 | Enterprise SLA'}</div>
            </div>
          </div>

        </div>

        {/* Bottom Rights & Legal Bar */}
        <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <div>
            © {new Date().getFullYear()} TECH-SELECT computer services LTD · {COMPANY_INFO.hebrewFullName}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenAccessibility} className="hover:underline transition-colors cursor-pointer text-blue-600 dark:text-cyan-400 font-semibold">
              {isHe ? 'סרגל נגישות ותצוגה' : 'Accessibility Toolbar'}
            </button>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
            <button onClick={onOpenLegalAccessibility || onOpenAccessibility} className="hover:underline transition-colors cursor-pointer">
              {isHe ? 'הצהרת נגישות' : 'Accessibility Statement'}
            </button>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
            <button onClick={onOpenPrivacy} className="hover:underline transition-colors cursor-pointer">
              {isHe ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </button>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
            <button
              onClick={scrollToTop}
              className={`p-2.5 rounded-full transition-all cursor-pointer ${
                isDark 
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-cyan-400' 
                  : 'bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 shadow-xs'
              }`}
              aria-label={isHe ? 'לראש הדף' : 'Scroll to top'}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Floating Accessibility Widget */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={onOpenAccessibility}
          className={`px-3.5 py-3 rounded-full sm:rounded-2xl shadow-xl transition-all duration-300 group flex items-center gap-2 cursor-pointer active:scale-95 border ${
            isDark 
              ? 'bg-[#090d18] hover:bg-[#0e1628] text-cyan-300 hover:text-white border-white/[0.12] shadow-lg' 
              : 'bg-white hover:bg-slate-50 text-blue-700 hover:text-blue-800 border-slate-300 shadow-md'
          }`}
          aria-label={isHe ? 'פתיחת תפריט נגישות ותצוגה' : 'Open Accessibility Toolbar'}
          title={isHe ? 'התאמות נגישות ותצוגה' : 'Accessibility Toolbar'}
        >
          <div className={`p-1 rounded-full transition-colors ${
            isDark 
              ? 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-200' 
              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'
          }`}>
            <Eye className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline text-xs font-bold font-sans tracking-wide">
            {isHe ? 'סרגל נגישות' : 'Accessibility'}
          </span>
        </button>
      </div>
    </footer>
  );
};
