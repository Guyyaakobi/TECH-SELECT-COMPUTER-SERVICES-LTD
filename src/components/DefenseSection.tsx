import React from 'react';
import { Lock, Key, FileCheck, CheckCircle2, ArrowLeft, ArrowRight, Radio, ShieldAlert } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const DefenseSection: React.FC = () => {
  const { isDark } = useTheme();
  const { isHe } = useLanguage();

  const defenseHighlights = [
    {
      title: isHe ? 'צוות IT בעל סיווג ביטחוני בתוקף' : 'Cleared Engineering Personnel',
      desc: isHe 
        ? 'כל הטכנאים, מנהלי הרשת ויועצי הסייבר שלנו בעלי סיווג ביטחוני מתאים לעבודה במתקנים מסווגים ובמערכות רגישות.'
        : 'All engineers, architects, and sysadmins hold active security clearances for classified facilities and sensitive defense networks.',
      icon: Key,
      badge: isHe ? 'סיווג ביטחוני' : 'ACTIVE CLEARANCE'
    },
    {
      title: isHe ? 'רשתות מבודדות (Air-Gapped Systems)' : 'Isolated Air-Gapped Networks',
      desc: isHe
        ? 'תכנון, הקמה ותחזוקה של רשתות תקשורת ומחשוב המנותקות לחלוטין מאינטרנט ציבורי למניעת זליגת מידע מסווג.'
        : 'Design, deployment, and ongoing maintenance of physical networks completely detached from public internet to eliminate data exfiltration.',
      checkmark: isHe
        ? 'הטמעת סביבות AI סגורות לחלוטין למערכים מסווגים – יכולות ניתוח נתונים ו-LLM ללא שום חיבור לאינטרנט.'
        : 'Deploying fully isolated Air-Gapped AI environments for classified units – advanced data analytics and on-prem LLMs with zero internet connectivity.',
      icon: Radio,
      badge: isHe ? 'הפרדה הרמטית' : 'HERMETIC AIR-GAP'
    },
    {
      title: isHe ? 'תקני משרד הביטחון & CMMC / ISO 27001' : 'Defense & CMMC / ISO 27001 Standards',
      desc: isHe
        ? 'הקשחת עמדות קצה, ניהול הרשאות קפדני לפי עיקרון Minimal Privilege ועמידה בביקורות אבטחת מידע ביטחוניות.'
        : 'Endpoint hardening, strict Least Privilege access control, and comprehensive audit readiness for defense security mandates.',
      icon: FileCheck,
      badge: isHe ? 'רגולציה ביטחונית' : 'DEFENSE REGULATION'
    },
    {
      title: isHe ? 'הגנת DLP & הצפנת חומרה מלאה' : 'DLP & Full Hardware Encryption',
      desc: isHe
        ? 'חסימת התקנים ניידים, הצפנה ברמת הדיסק (BitLocker/Hardware HSM) וניטור הדוק על כל תנועת קבצים ברשת.'
        : 'Removable media blocking, BitLocker/HSM hardware encryption, and continuous file movement surveillance.',
      icon: Lock,
      badge: 'DLP & ENCRYPTION'
    }
  ];

  return (
    <section id="defense" className={`py-20 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#05070c] text-slate-100' : 'bg-white text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Top Eyebrow Badge */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border ${
            isDark 
              ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' 
              : 'bg-slate-100 border-slate-200 text-blue-800 shadow-xs'
          }`}>
            <ShieldAlert className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>CORE SPECIALIZATION: DEFENSE & CLASSIFIED IT SERVICES</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-extrabold font-heading tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-slate-950'
          }`}>
            {isHe ? (
              <>
                תשתיות מחשוב ו-IT מסווגות<br />
                <span className="gemini-text-gradient">
                  לחברות ביטחוניות ולספקי מערכת הביטחון
                </span>
              </>
            ) : (
              <>
                Classified IT & Infrastructure<br />
                <span className="gemini-text-gradient">
                  For Defense Contractors & Critical Facilities
                </span>
              </>
            )}
          </h2>

          <p className={`text-base sm:text-lg leading-relaxed font-normal ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {isHe
              ? 'תחום הפעילות המרכזי של TECH-SELECT מתמחה במתן מענה IT היקפי לתעשיות ביטחוניות, ספקים מורשים של מערכת הביטחון ומתקנים הדורשים סיווג אבטחה גבוה.'
              : 'TECH-SELECT specializes in enterprise-grade IT infrastructure, security hardening, and ongoing SLA support for defense suppliers and classified environments.'}
          </p>
        </div>

        {/* 4 Cyber Defense Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {defenseHighlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <SpotlightCard
                key={index}
                className={`p-6 flex flex-col justify-between ${isHe ? 'text-right' : 'text-left'} border rounded-2xl transition-all duration-300 shadow-sm ${
                  isDark
                    ? 'bg-[#090d16]/85 border-white/[0.08] hover:border-cyan-400/40 hover:bg-[#0c1220]'
                    : 'bg-white border-slate-300/80 hover:border-blue-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-400' : 'bg-blue-50 border-blue-100 text-blue-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                      isDark
                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/20'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold font-heading mb-2 ${
                    isDark ? 'text-white' : 'text-slate-950'
                  }`}>
                    {item.title}
                  </h3>

                  <p className={`text-xs leading-relaxed font-normal ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {item.desc}
                  </p>

                  {item.checkmark && (
                    <div className={`mt-3 p-2.5 rounded-xl border flex items-start gap-2 text-[11px] font-medium leading-relaxed ${
                      isDark 
                        ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' 
                        : 'bg-blue-50/90 border-blue-200 text-blue-900'
                    }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                      <span>{item.checkmark}</span>
                    </div>
                  )}
                </div>

                <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans ${
                  isDark ? 'border-white/[0.08]' : 'border-slate-100'
                }`}>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isHe ? 'מאושר ביטחונית' : 'Defense Approved'}
                  </span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>100% COMPLIANT</span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* Defense Callout Banner */}
        <div className={`p-8 sm:p-10 rounded-2xl relative overflow-hidden shadow-lg border transition-all duration-300 ${
          isDark
            ? 'bg-[#090d16]/90 border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-slate-50 border-slate-300/80 shadow-xs'
        }`}>
          <div className={`grid lg:grid-cols-12 gap-8 items-center ${isHe ? 'text-right' : 'text-left'} relative z-10`}>
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-sans font-bold border ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' : 'bg-white border-blue-200 text-blue-800'
                }`}>
                  ISO 27001 & CMMC READY
                </span>
                <span className={`text-xs font-sans font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe ? 'סיווג ביטחוני בתוקף' : 'Active Clearances'}
                </span>
              </div>

              <h3 className={`text-2xl sm:text-3xl font-extrabold font-heading ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {isHe
                  ? 'זקוקים למענה IT מאובטח למתקן מסווג או לפרויקט ביטחוני?'
                  : 'Require cleared IT management for a classified defense site?'}
              </h3>

              <p className={`text-xs sm:text-sm leading-relaxed font-normal ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {isHe
                  ? 'אנו מבינים את הרגישות העליונה, נהלי העבודה מול מנב"ט והרגולציה המחמירה של מערכת הביטחון. צוות המומחים המסווג שלנו עומד לרשותכם בדיסקרטיות מלאה.'
                  : 'We understand defense protocols, security officer compliance, and strict regulations. Our cleared engineers are ready to support your organization discreetly.'}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <a
                href="#contact"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-full text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <span>{isHe ? 'תיאום פגישה במתקן מסווג' : 'Schedule Defense Meeting'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>

              <a
                href="https://wa.me/972503900903?text=%D7%94%D7%99%D7%99%2C%20%D7%90%D7%A0%D7%99%20%D7%A4%D7%95%D7%A0%D7%94%20%D7%91%D7%A0%D7%95%D7%A9%D7%90%20%D7%A4%D7%A8%D7%95%D7%99%D7%A7%D7%98%20%D7%91%D7%99%D7%98%D7%97%D7%95%D7%A0%D7%99"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full inline-flex items-center justify-center gap-2 border font-semibold py-3 px-6 rounded-full text-xs transition-all cursor-pointer ${
                  isDark
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                <span>{isHe ? 'פנייה ישירה ב-WhatsApp' : 'Direct WhatsApp'}</span>
              </a>

              {/* MOD Authorized Badge */}
              <div className="pt-2 flex items-center justify-center">
                <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs shadow-xs ${
                  isDark
                    ? 'bg-[#05070c] border-white/[0.1] text-white'
                    : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}>
                  <div className="bg-white p-1 rounded-md shrink-0 border border-slate-200/50">
                    <img src="/mod-logo.svg" alt="משרד הביטחון - Ministry of Defence" width="24" height="24" loading="lazy" decoding="async" className="h-6 w-auto object-contain" />
                  </div>
                  <div className={isHe ? 'text-right' : 'text-left'}>
                    <span className={`text-[11px] font-bold block leading-tight ${
                      isDark ? 'text-cyan-300' : 'text-blue-700'
                    }`}>
                      {isHe ? 'ספק מורשה משרד הביטחון' : 'MOD Authorized Supplier'}
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
          </div>
        </div>

      </div>
    </section>
  );
};
