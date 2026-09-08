import React from 'react';
import { Cpu, DollarSign, Server, Sparkles, CheckCircle2, ArrowLeft, ArrowRight, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const StrategicDifferentiatorsBanner: React.FC = () => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  const pillars = [
    {
      id: 'offline-ai',
      badgeHe: 'מודל CAPEX וחיסכון בענן',
      badgeEn: 'CAPEX ROI & ZERO CLOUD RENT',
      titleHe: 'מנועי AI רצים ב-Offline',
      titleEn: 'Offline Air-Gapped AI Engines',
      highlightHe: 'מנועי LLM הרצים מקומית (Offline) ללא עלויות API חיצוניות. אתם משקיעים פעם אחת בחומרה – ומפסיקים לשלם שכירות אינסופית לענקיות הענן.',
      highlightEn: 'On-prem offline LLM engines with zero external API fees. Invest once in hardware—stop paying recurring rent to public cloud giants.',
      icon: Cpu,
      accentColor: isDark ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' : 'text-blue-700 border-blue-200 bg-blue-50',
      badgeColor: isDark ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30' : 'text-blue-900 bg-blue-100 border-blue-300'
    },
    {
      id: 'finops-licensing',
      badgeHe: 'FINOPS & ניהול תקציב IT',
      badgeEn: 'FINOPS & LICENSE GOVERNANCE',
      titleHe: 'אופטימיזציית רישוי וחיסכון כפול',
      titleEn: 'FinOps & License Optimization',
      highlightHe: 'אופטימיזציית רישוי ו-FinOps: ניהול קפדני של רכש מינויים ורישיונות תוכנה כדי למנוע כפל תשלומים, לאתר מנויים לא פעילים, ולמקסם כל שקל מתקציב ה-IT שלכם.',
      highlightEn: 'FinOps & License Optimization: Rigorous SaaS subscription governance to eliminate duplicate licensing, deactivate zombie accounts, and maximize your IT budget.',
      icon: DollarSign,
      accentColor: isDark ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' : 'text-emerald-700 border-emerald-200 bg-emerald-50',
      badgeColor: isDark ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30' : 'text-emerald-900 bg-emerald-100 border-emerald-300'
    },
    {
      id: 'physical-layer',
      badgeHe: 'אחריות עד רמת הברזלים',
      badgeEn: 'DOWN TO THE METAL & RMA',
      titleHe: 'אינטגרציה פיזית וניהול ספקים',
      titleEn: 'Physical Last-Mile Integration',
      highlightHe: 'אינטגרציה פיזית וניהול אחריות: אנחנו לא רק מספקים ציוד, אלא מבצעים את ההתקנה הפיזית באתר (Last Mile), מנהלים את האחריות מול היצרנים בזמן אמת (RMA), ומבטיחים עבודה רציפה – מסידור ארון התקשורת ועד לשורת הקוד.',
      highlightEn: 'Physical Integration & Direct RMA: We perform on-site physical deployment (Last Mile), manage real-time manufacturer warranties (RMA), and guarantee continuous uptime from rack cabling to codebase.',
      icon: Server,
      accentColor: isDark ? 'text-purple-400 border-purple-500/30 bg-purple-950/40' : 'text-purple-700 border-purple-200 bg-purple-50',
      badgeColor: isDark ? 'text-purple-300 bg-purple-950/60 border-purple-500/30' : 'text-purple-900 bg-purple-100 border-purple-300'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 py-10 sm:py-14">
      {/* Editorial Open Section (No heavy outer/inner boxes) */}
      <div className={`pt-8 pb-10 border-y ${
        isDark ? 'border-white/[0.08]' : 'border-slate-200'
      }`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-inherit">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-cyan-300' : 'text-blue-800'
              }`}>
                {isHe ? 'היתרון ההנדסי והכלכלי של TECH-SELECT' : 'THE TECH-SELECT ENGINEERING & ECONOMIC EDGE'}
              </span>
            </div>
            <h3 className={`text-2xl sm:text-3xl font-extrabold font-heading tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}>
              {isHe ? 'יותר טכנולוגיה לא הופכת עסק לטכנולוגי יותר. ניהול נכון כן.' : 'More Technology Doesn’t Make a Business Smarter. Proper Management Does.'}
            </h3>
          </div>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all self-start sm:self-auto cursor-pointer shadow-sm hover:shadow"
          >
            <span>{isHe ? 'בדיקת חיסכון לארגון' : 'Calculate IT Savings'}</span>
            {isHe ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </a>
        </div>

        {/* 3 Pillars - Open Editorial Columns with Hairline Dividers (No boxed cards) */}
        <div className={`grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x ${
          isHe ? 'md:divide-x-reverse' : ''
        } ${
          isDark ? 'divide-white/[0.08]' : 'divide-slate-200'
        } pt-6 sm:pt-8`}>
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className={`flex flex-col justify-between py-6 md:py-2 ${
                  idx === 0 
                    ? isHe ? 'md:pl-6' : 'md:pr-6'
                    : idx === 2
                      ? isHe ? 'md:pr-6' : 'md:pl-6'
                      : 'md:px-6'
                }`}
              >
                <div className="space-y-4">
                  {/* Clean Icon + Monospace Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <Icon className={`w-6 h-6 shrink-0 ${
                      isDark ? 'text-cyan-400' : 'text-blue-600'
                    }`} />
                    <span className={`text-[10.5px] font-mono font-semibold tracking-wider uppercase ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {isHe ? pillar.badgeHe : pillar.badgeEn}
                    </span>
                  </div>

                  <div>
                    <h4 className={`text-lg font-bold font-heading mb-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {isHe ? pillar.titleHe : pillar.titleEn}
                    </h4>
                    <p className={`text-sm leading-relaxed font-normal ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {isHe ? pillar.highlightHe : pillar.highlightEn}
                    </p>
                  </div>
                </div>

                <div className={`mt-6 pt-3 flex items-center justify-between text-xs font-mono ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isHe ? 'אחריות הנדסית מלאה' : 'Full Ownership'}</span>
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-cyan-400">100% ROI</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
