import React from 'react';
import { Lock, Key, FileCheck, CheckCircle2, ArrowLeft, Radio, ShieldAlert } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

export const DefenseSection: React.FC = () => {
  const defenseHighlights = [
    {
      title: 'צוות IT בעל סיווג ביטחוני בתוקף',
      desc: 'כל הטכנאים, מנהלי הרשת ויועצי הסייבר שלנו בעלי סיווג ביטחוני מתאים לעבודה במתקנים מסווגים ובמערכות רגישות.',
      icon: Key,
      badge: 'סיווג ביטחוני'
    },
    {
      title: 'רשתות מבודדות (Air-Gapped Systems)',
      desc: 'תכנון, הקמה ותחזוקה של רשתות תקשורת ומחשוב המנותקות לחלוטין מאינטרנט ציבורי למניעת זליגת מידע מסווג.',
      icon: Radio,
      badge: 'הפרדה הרמטית'
    },
    {
      title: 'תקני משרד הביטחון & CMMC / ISO 27001',
      desc: 'הקשחת עמדות קצה, ניהול הרשאות קפדני לפי עיקרון Minimal Privilege ועמידה בביקורות אבטחת מידע ביטחוניות.',
      icon: FileCheck,
      badge: 'רגולציה ביטחונית'
    },
    {
      title: 'הגנת DLP & הצפנת חומרה מלאה',
      desc: 'חסימת התקנים ניידים, הצפנה ברמת הדיסק (BitLocker/Hardware HSM) וניטור הדוק על כל תנועת קבצים ברשת.',
      icon: Lock,
      badge: 'DLP & Encryption'
    }
  ];

  return (
    <section id="defense" className="py-20 bg-[#0b0c10] text-slate-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Top Eyebrow Badge */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold">
            <ShieldAlert className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>CORE SPECIALIZATION: DEFENSE & CLASSIFIED IT SERVICES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight text-white leading-tight">
            תשתיות מחשוב ו-IT מסווגות<br />
            <span className="gemini-text-gradient">
              לחברות ביטחוניות ולספקי מערכת הביטחון
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            תחום הפעילות המרכזי של TECH-SELECT מתמחה במתן מענה IT היקפי לתעשיות ביטחוניות, ספקים מורשים של מערכת הביטחון ומתקנים הדורשים סיווג אבטחה גבוה.
          </p>
        </div>

        {/* 4 Cyber Defense Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {defenseHighlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <SpotlightCard
                key={index}
                className="gemini-card p-6 flex flex-col justify-between text-right"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-heading mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    מאושר ביטחונית
                  </span>
                  <span className="text-slate-400">100% COMPLIANT</span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Defense Callout Banner */}
        <div className="gemini-card p-8 sm:p-10 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center text-right">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-medium rounded-full">
                  ISO 27001 & CMMC READY
                </span>
                <span className="text-xs text-slate-400 font-mono">סיווג ביטחוני בתוקף</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                זקוקים למענה IT מאובטח למתקן מסווג או לפרויקט ביטחוני?
              </h3>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                אנו מבינים את הרגישות העליונה, נהלי העבודה מול מנב"ט והרגולציה המחמירה של מערכת הביטחון. צוות המומחים המסווג שלנו עומד לרשותכם בדיסקרטיות מלאה.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <a
                href="#contact"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium py-3.5 px-6 rounded-full text-xs shadow-xl shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <span>תיאום פגישה במתקן מסווג</span>
                <ArrowLeft className="w-4 h-4" />
              </a>

              <a
                href="https://wa.me/972503900903?text=%D7%94%D7%99%D7%99%2C%20%D7%90%D7%A0%D7%99%20%D7%A4%D7%95%D7%A0%D7%94%20%D7%91%D7%A0%D7%95%D7%A9%D7%90%20%D7%A4%D7%A8%D7%95%D7%99%D7%A7%D7%90%D7%9C%20%D7%91%D7%99%D7%90%D7%97%D7%95%D7%A0%D7%99"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold py-3 px-6 rounded-full text-xs transition-all cursor-pointer"
              >
                <span>פנייה ישירה ב-WhatsApp</span>
              </a>

              {/* MOD Authorized Badge */}
              <div className="pt-2 flex items-center justify-center">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/30 text-white text-xs font-mono shadow-md">
                  <div className="bg-white/95 p-1 rounded-md shrink-0">
                    <img src="/mod-logo.svg" alt="משרד הביטחון - Ministry of Defence" className="h-6 w-auto object-contain" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-cyan-300 block leading-tight">ספק מורשה משרד הביטחון</span>
                    <span className="text-[9px] text-slate-400 block font-sans leading-tight">MOD Authorized Defense Supplier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
