import React from 'react';
import { Check, ShieldCheck, Server, Cloud, Cpu, Lock, ArrowLeft, ArrowRight, TrendingDown, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO } from '../data/content';

export const ManagedITSection: React.FC = () => {
  const { isHe } = useLanguage();

  const items = isHe
    ? [
        'ניהול אסטרטגי, מסודר ומבוקר של כל תשתיות ה-IT והסייבר בארגון',
        'התאמת פתרונות מחשוב מאובטחים לרשתות גלויות ומבודדות (Air-Gap)',
        'צוות טכנאים ומנהלי רשת בעלי סיווג ביטחוני בתוקף',
        'תמיכה וטיפול מהיר בתקלות – מענה אנושי מהיר למשתמשים (SLA מובטח)',
        'ייעול העבודה היומיומית והגברת התפוקה הארגונית',
        'שירותי vCISO וליווי פגישות הנהלה לתכנון תקציבי ואבטחת מידע'
      ]
    : [
        'Strategic, organized & audited management of all company IT & cybersecurity',
        'Tailored IT infrastructure for clear and isolated Air-Gap networks',
        'Engineers and network administrators with valid active security clearances',
        'Fast guaranteed SLA support – live human helpdesk for all employees',
        'Streamlining daily operations & driving organizational output',
        'vCISO services & executive board advisory for budget & security roadmap'
      ];

  return (
    <section id="managed" className="py-24 bg-[#0b0c10] text-slate-100 relative overflow-hidden">
      {/* Radiant Glow Backdrop */}
      <div className="absolute top-1/2 -right-36 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text / Info Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>MANAGED IT & vCIO SERVICES</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight leading-tight">
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

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              {isHe ? (
                <>
                  עם ניסיון רב בניהול מערכי מחשוב בארגונים מובילים וחברות ביטחוניות, ב-<strong className="text-white font-bold">TECH-SELECT (טק-סלקט)</strong> אנחנו הופכים ל"מנהל מחלקת המחשוב" שלכם – בלי הצורך בהעסקת מנהל IT פנימי יקר!
                </>
              ) : (
                <>
                  With extensive experience managing IT operations for enterprise and defense sectors, <strong className="text-white font-bold">TECH-SELECT</strong> acts as your virtual Head of IT & vCIO – without the high cost of a full-time in-house executive.
                </>
              )}
            </p>

            {/* Checklist */}
            <div className="space-y-3 pt-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-1 rounded-full bg-cyan-950 text-cyan-300 shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-slate-200 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium px-7 py-3.5 rounded-full text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
              >
                <span>{isHe ? 'תיאום פגישת אפיון' : 'Schedule Assessment'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>

              <a
                href={COMPANY_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium px-6 py-3.5 rounded-full text-sm transition-all"
              >
                <span>{isHe ? 'פנייה ישירה ב-WhatsApp' : 'WhatsApp Support'}</span>
              </a>
            </div>
          </div>

          {/* Right Visual Orbit Diagram & Comparison */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Orbital Tech Visual Card */}
            <div className="relative p-8 rounded-3xl gemini-card flex flex-col items-center text-center overflow-hidden">
              <div className="relative z-10 w-24 h-24 rounded-full bg-white/5 border border-white/10 p-1 mb-6 flex items-center justify-center">
                <div className="w-full h-full bg-[#12141f] rounded-full flex flex-col items-center justify-center p-2">
                  <Server className="w-7 h-7 text-cyan-400" />
                  <span className="text-[10px] font-mono font-bold uppercase text-white tracking-widest mt-1">Managed IT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full text-xs text-slate-200 relative z-10 font-medium">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{isHe ? 'ענן & M365' : 'Cloud & M365'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{isHe ? 'אבטחת סייבר' : 'Cyber Security'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{isHe ? 'תשתיות & Air-Gap' : 'Air-Gap & Networks'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isHe ? 'תמיכה זמינה 24/7' : '24/7 SLA Support'}</span>
                </div>
              </div>
            </div>

            {/* Cost Comparison Box */}
            <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                <span>{isHe ? 'חיסכון כלכלי וארגוני ניכר' : 'Substantial Financial Savings'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHe ? (
                  <>
                    מנהל IT פנימי במשרה מלאה: כ-<strong>30,000 ₪</strong> בחודש + עלויות מעסיק.<br />
                    <strong className="text-white font-bold">שירות IT מנוהל ב-TECH-SELECT:</strong> תשלום חודשי קבוע ומוזל, ללא ימי מחלה/חופשה, עם צוות מומחים בעלי סיווג ביטחוני 24/7.
                  </>
                ) : (
                  <>
                    Full-time in-house IT Director: ~$10,000/mo + overhead.<br />
                    <strong className="text-white font-bold">TECH-SELECT Managed IT:</strong> Fixed flat monthly retainer, 24/7 cleared engineering team, zero employer tax burden.
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
