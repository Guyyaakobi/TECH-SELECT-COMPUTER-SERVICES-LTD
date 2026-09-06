import React from 'react';
import { Check, ShieldCheck, Server, Cloud, Cpu, Lock, ArrowLeft, ArrowRight, TrendingDown, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { COMPANY_INFO } from '../data/content';
import { PageHeroBackground } from './PageHeroBackground';
import managedItBg from '../assets/images/managed_it_hero.jpg';

export const ManagedITSection: React.FC = () => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  const items = isHe
    ? [
        'ניהול אסטרטגי, מסודר ומבוקר של כל תשתיות ה-IT והסייבר בארגון',
        'אופטימיזציית רישוי ו-FinOps: ניהול קפדני של רכש מינויים ורישיונות תוכנה למניעת כפל תשלומים ויוזרים לא פעילים',
        'התאמת פתרונות מחשוב מאובטחים לרשתות גלויות ומבודדות (Air-Gap)',
        'צוות טכנאים ומנהלי רשת בעלי סיווג ביטחוני בתוקף',
        'תמיכה וטיפול מהיר בתקלות - מענה אנושי מהיר למשתמשים (SLA מובטח)',
        'שירותי vCISO וליווי פגישות הנהלה לתכנון תקציבי שנתי מדויק'
      ]
    : [
        'Strategic, organized & audited management of all company IT & cybersecurity',
        'FinOps & License Optimization: Rigorous SaaS subscription governance to prevent duplicate payments & inactive seats',
        'Tailored IT infrastructure for clear and isolated Air-Gap networks',
        'Engineers and network administrators with valid active security clearances',
        'Fast guaranteed SLA support - live human helpdesk for all employees',
        'vCISO services & executive board advisory for budget & security roadmap'
      ];

  return (
    <section id="managed" className={`py-8 sm:py-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={managedItBg || '/managed_it_hero.jpg'}
        fallbackSrc="/managed_it_hero.jpg"
        alt="TECH-SELECT Managed IT Operations & vCIO Control Center"
        glowColor="bg-blue-600"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text / Info Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border animate-linear-eyebrow ${
              isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' : 'bg-white border-slate-200 text-blue-800 shadow-xs'
            }`}>
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>MANAGED IT & vCIO SERVICES</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold font-heading tracking-tight leading-tight animate-linear-title ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}>
              {isHe ? (
                <>
                  מנהל מחלקת מחשוב <br />
                  <span className="gemini-text-gradient">
                    במתכונת שירות מנוהל (Managed IT & vCIO)
                  </span>
                </>
              ) : (
                <>
                  External Head of IT <br />
                  <span className="gemini-text-gradient">
                    Managed IT & vCIO Services
                  </span>
                </>
              )}
            </h2>

            <p className={`text-base sm:text-lg leading-relaxed font-normal animate-linear-subtitle ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {isHe ? (
                <>
                  עם ניסיון רב בניהול מערכי מחשוב בארגונים מובילים וחברות ביטחוניות, ב-<strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT (טק-סלקט)</strong> אנחנו הופכים ל"מנהל מחלקת המחשוב" שלכם - בלי הצורך בהעסקת מנהל IT פנימי יקר!
                </>
              ) : (
                <>
                  With extensive experience managing IT operations for enterprise and defense sectors, <strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT</strong> acts as your virtual Head of IT & vCIO - without the high cost of a full-time in-house executive.
                </>
              )}
            </p>

            {/* Checklist */}
            <div className="space-y-3 pt-2 animate-linear-cta">
              {items.map((item, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                  isDark 
                    ? 'bg-[#090d16]/80 border-white/[0.08] hover:border-white/[0.15]' 
                    : 'bg-white border-slate-300/80 hover:border-blue-400 shadow-xs'
                }`}>
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${
                    isDark ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/20' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <Check className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{item}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-4 animate-linear-cta">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-full text-sm shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <span>{isHe ? 'תיאום פגישת אפיון' : 'Schedule Assessment'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>

              <a
                href={COMPANY_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-full text-sm transition-all border ${
                  isDark
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                }`}
              >
                <span>{isHe ? 'פנייה ישירה ב-WhatsApp' : 'WhatsApp Support'}</span>
              </a>
            </div>
          </div>

          {/* Right Visual Orbit Diagram & Comparison */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Orbital Tech Visual Card */}
            <div className={`relative p-8 rounded-2xl flex flex-col items-center text-center overflow-hidden border ${
              isDark ? 'bg-[#090d16]/85 border-white/[0.08]' : 'bg-white border-slate-300/80 shadow-sm'
            }`}>
              <div className={`relative z-10 w-24 h-24 rounded-full p-1 mb-6 flex items-center justify-center border ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className={`w-full h-full rounded-full flex flex-col items-center justify-center p-2 ${
                  isDark ? 'bg-[#05070c]' : 'bg-white shadow-inner'
                }`}>
                  <Server className="w-7 h-7 text-cyan-400" />
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-widest mt-1 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>Managed IT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full text-xs relative z-10 font-medium">
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{isHe ? 'ענן & M365' : 'Cloud & M365'}</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{isHe ? 'אבטחת סייבר' : 'Cyber Security'}</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{isHe ? 'תשתיות & Air-Gap' : 'Air-Gap & Networks'}</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isHe ? 'אמנת שירות ו-SLA הנדסי' : 'Contractual Engineering SLA'}</span>
                </div>
              </div>
            </div>

            {/* Cost Comparison Box */}
            <div className={`p-6 rounded-2xl border space-y-2 ${
              isDark 
                ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-300' 
                : 'bg-emerald-50/80 border-emerald-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 font-bold text-sm">
                <TrendingDown className="w-5 h-5 text-emerald-500" />
                <span>{isHe ? 'חיסכון כלכלי וארגוני ניכר' : 'Substantial Financial Savings'}</span>
              </div>
              <p className="text-xs leading-relaxed">
                {isHe ? (
                  <>
                    מנהל IT פנימי במשרה מלאה: כ-<strong>30,000 ₪</strong> בחודש + עלויות מעסיק.<br />
                    <strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>שירות IT מנוהל ו-FinOps ב-TECH-SELECT:</strong> תשלום חודשי קבוע ומוזל, ניקוי רישיונות ומנויים כפולים, וחיבור ישיר של השכבה הפיזית והחומרה בארגון.
                  </>
                ) : (
                  <>
                    Full-time in-house IT Director: ~$10,000/mo + overhead.<br />
                    <strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT Managed IT & FinOps:</strong> Flat monthly retainer, elimination of redundant licensing, and direct physical infrastructure integration.
                  </>
                )}
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
