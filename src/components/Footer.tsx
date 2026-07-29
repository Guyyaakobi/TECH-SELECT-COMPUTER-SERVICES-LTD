import React from 'react';
import { COMPANY_INFO } from '../data/content';
import { TechSelectLogo } from './TechSelectLogo';
import { MapPin, Navigation, ArrowUp, ShieldAlert, Eye } from 'lucide-react';

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
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHe = lang === 'he';

  return (
    <footer className="bg-[#07080b] text-slate-300 pt-16 pb-8 relative overflow-hidden border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/5">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4 space-y-4 text-right">
            <TechSelectLogo theme="dark" size="md" />

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-normal">
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
                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isHe ? 'ניווט ב-Waze' : 'Navigate Waze'}</span>
              </a>

              <a
                href={COMPANY_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{isHe ? 'מפות Google' : 'Google Maps'}</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="lg:col-span-2 space-y-3 text-xs text-right">
            <h4 className="text-sm font-bold text-white font-heading">{isHe ? 'ניווט מהיר' : 'Navigation'}</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><a href="#defense" className="hover:text-cyan-300 transition-colors flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-cyan-400" /> {isHe ? 'חברות ביטחוניות' : 'Defense Sector'}</a></li>
              <li><a href="#disaster-game" className="hover:text-red-400 transition-colors text-red-400 font-mono font-bold flex items-center gap-1"><span>🎮</span> <span>{isHe ? 'סימולטור SOC (Choose Disaster)' : 'Choose Your Own Disaster'}</span></a></li>
              <li><a href="#services" className="hover:text-cyan-300 transition-colors">{isHe ? 'שירותי IT, ענן & פיתוח' : 'IT & Cloud Services'}</a></li>
              <li><a href="#delivery" className="hover:text-cyan-300 transition-colors">{isHe ? 'מודל Delivery' : 'Delivery Model'}</a></li>
              <li><a href="#managed" className="hover:text-cyan-300 transition-colors">{isHe ? 'מנהל IT מנוהל' : 'Managed IT'}</a></li>
              <li><a href="#sectors" className="hover:text-cyan-300 transition-colors">{isHe ? 'פתרונות למגזרים' : 'Industries'}</a></li>
              <li><a href="#knowledge" className="hover:text-cyan-300 transition-colors">{isHe ? 'מרכז הידע' : 'Knowledge Base'}</a></li>
              <li><a href="#contact" className="hover:text-cyan-300 transition-colors">{isHe ? 'צור קשר' : 'Contact Us'}</a></li>
            </ul>
          </div>

          {/* Col 3: Selected Services */}
          <div className="lg:col-span-3 space-y-3 text-xs text-right">
            <h4 className="text-sm font-bold text-white font-heading">{isHe ? 'התמחויות ביטחוניות & IT' : 'Defense & IT Expertise'}</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><a href="#defense" className="hover:text-cyan-300 transition-colors">{isHe ? 'תשתיות מסווגות & Air-Gap Networks' : 'Classified & Air-Gap Networks'}</a></li>
              <li><a href="#defense" className="hover:text-cyan-300 transition-colors">{isHe ? 'עמידה בתקני משרד הביטחון & CMMC' : 'Defense & CMMC Compliance'}</a></li>
              <li><a href="#services" className="hover:text-cyan-300 transition-colors">{isHe ? 'אבטחת מידע, EDR & הקשחת עמדות' : 'Cyber Security & EDR'}</a></li>
              <li><a href="#services" className="hover:text-cyan-300 transition-colors">{isHe ? 'פתרונות ענן M365 & Azure Gold' : 'M365 & Azure Cloud'}</a></li>
              <li><a href="#services" className="hover:text-cyan-300 transition-colors">{isHe ? 'פיתוח מערכות תוכנה מורכבות & API' : 'Complex Software Dev & APIs'}</a></li>
            </ul>

            {/* Ministry of Defence Authorized Supplier Logo Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/30 text-white text-xs font-mono shadow-md">
                <div className="bg-white/95 p-1 rounded-md shrink-0">
                  <img src="/mod-logo.svg" alt="משרד הביטחון - Ministry of Defence" className="h-6 w-auto object-contain" />
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-cyan-300 block leading-tight">{isHe ? 'ספק מורשה משרד הביטחון' : 'Ministry of Defence Supplier'}</span>
                  <span className="text-[9px] text-slate-400 block font-sans leading-tight">Defense Contractor Compliance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Hours */}
          <div className="lg:col-span-3 space-y-3 text-xs text-right">
            <h4 className="text-sm font-bold text-white font-heading">{isHe ? 'יצירת קשר ושעות' : 'Contact & Hours'}</h4>
            <div className="space-y-2 text-slate-400 font-medium">
              <div>WhatsApp: <a href={COMPANY_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold underline">{isHe ? 'פנייה ישירה ב-WhatsApp' : 'Direct WhatsApp Chat'}</a></div>
              <div>{isHe ? 'אימייל:' : 'Email:'} <a href={`mailto:${COMPANY_INFO.email}`} className="text-cyan-300 hover:text-cyan-200 font-mono font-bold" dir="ltr">{COMPANY_INFO.email}</a></div>
              <div className="text-slate-300 pt-1">{COMPANY_INFO.address}</div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              <span className="text-white font-bold block mb-1">{isHe ? 'שעות פעילות מוקד:' : 'Working Hours:'}</span>
              <div className="font-mono">{isHe ? 'א\'-ה\': 08:30 - 18:00 | תמיכה 24/7 למנויים' : 'Sun-Thu: 08:30 - 18:00 | 24/7 SLA'}</div>
            </div>
          </div>

        </div>

        {/* Bottom Rights & Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} TECH-SELECT computer services LTD · {COMPANY_INFO.hebrewFullName}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenAccessibility} className="hover:text-cyan-300 transition-colors cursor-pointer text-cyan-400 font-semibold">
              {isHe ? 'סרגל נגישות ותצוגה' : 'Accessibility Toolbar'}
            </button>
            <span className="text-slate-800">|</span>
            <button onClick={onOpenLegalAccessibility || onOpenAccessibility} className="hover:text-cyan-300 transition-colors cursor-pointer">
              {isHe ? 'הצהרת נגישות' : 'Accessibility Statement'}
            </button>
            <span className="text-slate-800">|</span>
            <button onClick={onOpenPrivacy} className="hover:text-cyan-300 transition-colors cursor-pointer">
              {isHe ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </button>
            <span className="text-slate-800">|</span>
            <button
              onClick={scrollToTop}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-cyan-400 transition-colors cursor-pointer"
              aria-label={isHe ? 'לראש הדף' : 'Scroll to top'}
            >
              <ArrowUp className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Floating Dark-Glass Accessibility Widget */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={onOpenAccessibility}
          className="bg-[#090d18]/90 hover:bg-[#0e1628] text-cyan-300 hover:text-white border-2 border-cyan-500/50 hover:border-cyan-300 px-3.5 py-3 rounded-full sm:rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] backdrop-blur-md transition-all duration-300 group flex items-center gap-2 cursor-pointer active:scale-95"
          aria-label={isHe ? 'פתיחת תפריט נגישות ותצוגה' : 'Open Accessibility Toolbar'}
          title={isHe ? 'התאמות נגישות ותצוגה' : 'Accessibility Toolbar'}
        >
          <div className="p-1 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-200 transition-colors">
            <Eye className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline text-xs font-bold font-mono tracking-wide">
            {isHe ? 'סרגל נגישות' : 'Accessibility'}
          </span>
        </button>
      </div>
    </footer>
  );
};
