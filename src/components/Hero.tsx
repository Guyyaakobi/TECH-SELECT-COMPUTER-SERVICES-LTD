import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  ShieldCheck,
  Network,
  ChevronDown,
  Terminal,
  Cpu,
  Activity,
  Server,
  Code2,
  ExternalLink,
  Check,
  Building2,
  Target,
  ArrowUpRight,
  Database,
  Cloud
} from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import heroBgImage from '../assets/images/techselect_office_hero.jpg';

interface HeroProps {
  onOpenQuiz: () => void;
  onOpenTerminal?: () => void;
  onNavigateToDefense?: () => void;
  onOpenServicesIndex?: () => void;
  onNavigateToAIDiscovery?: () => void;
  lang?: 'he' | 'en';
}

export const Hero: React.FC<HeroProps> = ({
  onOpenQuiz,
  onOpenTerminal,
  onNavigateToDefense,
  onOpenServicesIndex,
  onNavigateToAIDiscovery,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [latency, setLatency] = useState(14);

  // Live Simulated Latency / Telemetry Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Math.floor(11 + Math.random() * 6));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const fitItems = isHe
    ? [
        {
          title: 'ארגונים שצריכים ניהול IT מלא ללא תקן פנימי מורכב',
          desc: 'שותף טכנולוגי בכיר (vCIO) שלוקח אחריות הנדסית מלאה על המערכות, המשתמשים והתקציב.',
        },
        {
          title: 'חברות עם פרויקטי תשתית, מיגרציות ואינטגרציות מורכבות',
          desc: 'מעברי משרדים, שדרוגי חוות שרתים, הקמת רשתות ומיגרציות ענן היברידי ללא השבתת פעילות.',
        },
        {
          title: 'ארגונים הדורשים פיתוח תוכנה ואוטומציות ייעודיות',
          desc: 'חיבורי API בין מערכות, פיתוח פורטלים ואפליקציות פנים-ארגוניות המותאמות בדיוק לצורכי העסק.',
        },
        {
          title: 'סביבות בעלות דרישות אבטחה, סיווג ורגולציה מחמירות',
          desc: 'מומחיות מוכחת בסביבות רגישות, הקשחת עמדות ורשתות מבודדות (ספק מורשה משרד הביטחון: 0011028306).',
        },
      ]
    : [
        {
          title: 'Enterprises needing complete IT leadership without internal overhead',
          desc: 'Senior vCIO partner taking full engineering accountability for systems, users, and tech budgets.',
        },
        {
          title: 'Companies executing complex infrastructure migrations & deployments',
          desc: 'Zero-downtime server migrations, hybrid cloud setups, and high-performance network engineering.',
        },
        {
          title: 'Organizations requiring custom software engineering & integrations',
          desc: 'Deep API integrations, custom business automation, and internal software portals.',
        },
        {
          title: 'Entities with strict security, classification, and compliance mandates',
          desc: 'Proven experience in high-security & Air-Gapped environments (MOD Defense Supplier: 0011028306).',
        },
      ];

  return (
    <section className="relative overflow-hidden transition-colors duration-300">
      
      {/* 1. Full-Screen Viewport Hero Fold */}
      <div className="relative min-h-screen flex flex-col items-center justify-between pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6 z-10 overflow-hidden">
        
        {/* Tel Aviv Ocean-View Architectural Enterprise Office Background (TECH-SELECT Headquarters) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden animate-linear-bg">
          <img
            src={heroBgImage || "/techselect_office_hero.jpeg"}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== '/techselect_office_hero.jpeg' && !target.src.includes('techselect_office_hero.jpeg')) {
                target.src = '/techselect_office_hero.jpeg';
              } else if (target.src !== '/techselect_office_hero.jpg' && !target.src.includes('techselect_office_hero.jpg')) {
                target.src = '/techselect_office_hero.jpg';
              }
            }}
            alt="TECH-SELECT Tel Aviv Enterprise Technology Headquarters"
            referrerPolicy="no-referrer"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-center scale-100 contrast-[1.10] brightness-[1.04] saturate-[1.14] transition-all duration-700 ease-out"
          />
          {/* Crisp, Balanced Tint Overlay allowing the office, sea horizon and architecture to be vividly visible & emphasized */}
          <div className={`absolute inset-0 transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-b from-[#080b12]/46 via-[#080b12]/16 to-[#080b12]/74'
              : 'bg-gradient-to-b from-white/46 via-white/12 to-[#f8fafc]/74'
          }`} />

          {/* Soft Central Radial Tint to Keep Focal Text Razor Sharp while highlighting the vibrant backdrop */}
          <div className={`absolute inset-0 ${
            isDark
              ? 'bg-[radial-gradient(ellipse_at_center,rgba(8,11,18,0.10)_0%,rgba(8,11,18,0.56)_100%)]'
              : 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,rgba(248,250,252,0.56)_100%)]'
          }`} />
        </div>

        {/* Ambient Luxury Spotlight Glow */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[480px] rounded-full blur-[140px] pointer-events-none z-[1] ${
          isDark 
            ? 'bg-blue-600/[0.12]'
            : 'bg-blue-600/[0.06]'
        }`} />

        {/* Main Center Content (Headline + Slogan + CTAs) */}
        <div className="relative z-10 text-center space-y-6 sm:space-y-8 max-w-5xl mx-auto my-auto py-6">
          
          {/* Eyebrow Badge & Live Telemetry Pill */}
          <div className="inline-flex items-center gap-3 animate-linear-eyebrow">
            <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border backdrop-blur-md transition-all ${
              isDark 
                ? 'bg-[#0a0e17]/85 border-white/[0.1] shadow-[0_4px_20px_rgba(0,0,0,0.5)]' 
                : 'bg-white/95 border-slate-300/80 shadow-xs'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className={`text-xs sm:text-sm font-semibold tracking-wider font-mono uppercase ${
                isDark ? 'text-cyan-300' : 'text-blue-800'
              }`}>
                ENTERPRISE IT & TECHNOLOGY ENGINEERING
              </p>
            </div>

            {/* Live Quick Terminal Trigger */}
            {onOpenTerminal && (
              <button
                onClick={onOpenTerminal}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-cyan-400'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-blue-700 shadow-2xs'
                }`}
                title="Launch TECH-SELECT Live Terminal"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>CLI</span>
              </button>
            )}
          </div>

          {/* Main Headline with Linear Cinematic Typography Reveal */}
          <h1 className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.25rem] font-black tracking-tight leading-[1.1] sm:leading-[1.12] font-heading animate-linear-title drop-shadow-sm ${
            isDark ? 'text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]' : 'text-slate-950 drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]'
          }`}>
            {isHe ? (
              <>
                שותף טכנולוגי כולל -<br className="hidden sm:inline" />
                <span className="gemini-text-gradient font-black block sm:inline mt-1 sm:mt-0">
                  {' '}ניהול IT, הנדסת מערכות מורכבות ופיתוח
                </span>
              </>
            ) : (
              <>
                Enterprise IT Partner -<br className="hidden sm:inline" />
                <span className="gemini-text-gradient font-black block sm:inline mt-1 sm:mt-0">
                  {' '}Managed IT, Complex Systems & Custom Software
                </span>
              </>
            )}
          </h1>

          {/* Subtitle with Calibrated Measure & Linear Stagger Reveal */}
          <p className={`text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto animate-linear-subtitle ${
            isDark ? 'text-slate-100 font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : 'text-slate-900 font-semibold drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]'
          }`}>
            {isHe
              ? 'טק-סלקט מספקת מעטפת טכנולוגית מלאה לארגונים: ניהול IT מקצה לקצה, פרויקטים מורכבים, פיתוח והתאמות תוכנה, ועמידה בסטנדרטים הגבוהים ביותר של אבטחה, זמינות ורציפות עסקית.'
              : 'TECH-SELECT delivers an end-to-end technology envelope: managed IT operations, complex infrastructure projects, custom software development, and strict security and continuity governance.'}
          </p>

          {/* Action CTAs with Linear Soft Scale Reveal */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 pb-3 animate-linear-cta">
            {/* Primary Sharp Enterprise CTA with Tactile Micro-interaction */}
            <a
              href="#contact"
              className="relative group inline-flex items-center gap-2.5 bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold px-8 py-3.5 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer border border-blue-500/60 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="relative z-10">{isHe ? 'תיאום שיחת אבחון IT' : 'Schedule IT Assessment'}</span>
              {isHe ? (
                <ArrowLeft className="relative z-10 w-4 h-4 text-blue-200 group-hover:-translate-x-1 transition-transform duration-200" />
              ) : (
                <ArrowRight className="relative z-10 w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform duration-200" />
              )}
            </a>

            {/* Secondary Sharp Solid Outline CTA */}
            <button
              onClick={onOpenServicesIndex}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer group border hover:-translate-y-0.5 active:scale-[0.98] ${
                isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border-slate-300 shadow-sm'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
              <span>{isHe ? 'מפת היכולות והשירותים' : 'Explore Capabilities & Services'}</span>
            </button>
          </div>

        </div>

        {/* Downward Scroll Indicator (Perfect Vertical Center Alignment) */}
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-10 pt-2 pb-1">
          <a
            href="#bento"
            className={`group inline-flex flex-col items-center justify-center gap-1.5 text-xs font-sans font-semibold transition-all ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span className="tracking-normal">{isHe ? 'גולל לגילוי מפת היכולות והארכיטקטורה' : 'Scroll to explore Capabilities & Architecture'}</span>
            <ChevronDown className="w-4 h-4 text-cyan-500 group-hover:translate-y-1 transition-transform animate-bounce" />
          </a>
        </div>

      </div>

      {/* 2. Modern 2026 Bento Grid Section: 5 Enterprise Capabilities */}
      <div id="bento" className={`max-w-6xl mx-auto px-4 sm:px-6 relative z-10 py-16 sm:py-24 border-t ${
        isDark ? 'border-white/[0.08]' : 'border-slate-300/80'
      }`}>
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14 max-w-2xl mx-auto">
          <span className={`text-xs font-sans font-bold px-3.5 py-1 rounded-full uppercase tracking-wider ${
            isDark 
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/20' 
              : 'text-blue-800 bg-blue-50 border border-blue-200'
          }`}>
            ENTERPRISE CAPABILITIES
          </span>
          <h2 className={`text-2xl sm:text-4xl font-extrabold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isHe ? 'חמשת עמודי התווך של TECH-SELECT' : 'The 5 Core Engineering Pillars'}
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isHe
              ? 'לקיחת אחריות טכנולוגית והנדסית מלאה על הארגון - מתשתיות שוטפות ועד לפרויקטים מורכבים ופיתוח תוכנה.'
              : 'Comprehensive technology leadership and engineering governance - from day-to-day operations to complex systems and software.'}
          </p>
        </div>

        {/* Dynamic Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
          
          {/* Bento Item 1: Large Featured Anchor Card (Span 2 on desktop) - Managed IT */}
          <div className="md:col-span-2">
            <SpotlightCard
              className={`p-7 sm:p-9 h-full flex flex-col justify-between transition-all duration-300 rounded-2xl border ${
                isDark
                  ? 'border-white/[0.08] bg-[#090d16]/85 hover:border-cyan-400/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
                  : 'border-slate-300/80 bg-white shadow-xs hover:border-blue-500/40 hover:shadow-md'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-sans font-bold uppercase tracking-wider block ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                        01. MANAGED IT & vCIO
                      </span>
                      <h3 className={`text-xl sm:text-2xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {isHe ? 'ניהול IT מקיף, תשתיות ותפעול שוטף' : 'Comprehensive Managed IT & vCIO'}
                      </h3>
                    </div>
                  </div>
                  <span className={`text-xs font-sans font-semibold px-3 py-1 rounded-full border ${
                    isDark ? 'bg-white/[0.04] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}>
                    {isHe ? 'אחריות שוטפת ב-SLA' : 'Enterprise SLA Operations'}
                  </span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe
                    ? 'ניהול כולל של תחנות עבודה, שרתים, משתמשים, סביבות Microsoft 365 ותקציב מחשוב. מענה הנדסי אישי ומהיר, ניטור תשתיות פרואקטיבי, וליווי אסטרטגי שמעניק להנהלה שקט תעשייתי מלא.'
                    : 'End-to-end management of workstations, servers, users, M365 environments, and tech budgeting. Dedicated senior engineering response, proactive infrastructure monitoring, and executive vCIO advisory.'}
                </p>

                {/* Visual Flow Steps */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className={`p-3 rounded-xl border text-center space-y-1 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block">01. AUDIT</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{isHe ? 'מיפוי וסקר' : 'Audit & Scoping'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center space-y-1 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] font-mono text-blue-400 font-bold block">02. STANDARDIZE</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{isHe ? 'יישור קו' : 'Standardize'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center space-y-1 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">03. MONITOR</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{isHe ? 'ניטור פרואקטיבי' : 'Proactive Monitoring'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center space-y-1 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">04. GOVERN</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{isHe ? 'ניהול ו-vCIO' : 'vCIO Roadmap'}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans font-semibold ${
                isDark ? 'border-white/[0.08] text-cyan-400' : 'border-slate-100 text-blue-700'
              }`}>
                <span>{isHe ? 'גורם הנדסי אחד אחראי' : 'Single Accountable Partner'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </SpotlightCard>
          </div>

          {/* Bento Item 2: Defense & High-Security IT (Span 1) */}
          <div className="md:col-span-1">
            <SpotlightCard
              className={`p-7 h-full flex flex-col justify-between transition-all duration-300 rounded-2xl border ${
                isDark
                  ? 'border-white/[0.08] bg-[#090d16]/85 hover:border-cyan-400/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
                  : 'border-slate-300/80 bg-white shadow-xs hover:border-blue-500/40 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'text-purple-300 bg-purple-950/40 border-purple-500/30' : 'text-purple-800 bg-purple-50 border-purple-200'
                  }`}>
                    02. HIGH-SECURITY
                  </span>
                </div>

                <h3 className={`text-lg font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isHe ? 'סביבות רגישות וספקי משרד הביטחון' : 'High-Security & Defense Mandates'}
                </h3>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe
                    ? 'תשתיות Air-Gap מבודדות לחלוטין, הקשחת עמדות קפדנית, סיווג ביטחוני בתוקף, ועמידה בדרישות הרגולציה הביטחונית (ספק משרד הביטחון: 0011028306).'
                    : 'Air-Gap isolated networks, strict endpoint hardening, active security clearances, and MOD supplier compliance (#0011028306).'}
                </p>
              </div>

              {onNavigateToDefense ? (
                <button
                  onClick={onNavigateToDefense}
                  className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans font-semibold cursor-pointer w-full transition-colors ${
                    isDark ? 'border-white/[0.08] text-purple-400 hover:text-purple-300' : 'border-slate-100 text-purple-700 hover:text-purple-900'
                  }`}
                >
                  <span>{isHe ? 'למידע על המעטפת הביטחונית ➔' : 'Explore Defense Division ➔'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans font-semibold ${
                  isDark ? 'border-white/[0.08] text-purple-400' : 'border-slate-100 text-purple-700'
                }`}>
                  <span>{isHe ? 'הפרדה והגנה הרמטית' : 'Hermetic Isolation'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </SpotlightCard>
          </div>

          {/* Bento Item 3: Complex Projects & Infrastructure (Span 1) */}
          <div className="md:col-span-1">
            <SpotlightCard
              className={`p-7 h-full flex flex-col justify-between transition-all duration-300 rounded-2xl border ${
                isDark
                  ? 'border-white/[0.08] bg-[#090d16]/85 hover:border-cyan-400/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
                  : 'border-slate-300/80 bg-white shadow-xs hover:border-blue-500/40 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                    <Network className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30' : 'text-indigo-800 bg-indigo-50 border-indigo-200'
                  }`}>
                    03. PROJECTS
                  </span>
                </div>

                <h3 className={`text-lg font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isHe ? 'פרויקטים מורכבים ומיגרציות' : 'Complex Projects & Deployments'}
                </h3>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe
                    ? 'תכנון והקמת רשתות ארגוניות, הקמת סניפים, מעברי משרדים, שדרוגי שרתים ואחסון (SAN/NAS), ופרויקטי יישור קו ללא השבתת פעילות.'
                    : 'Enterprise network architecture, branch rollouts, office relocations, server/SAN upgrades, and zero-downtime standardization projects.'}
                </p>
              </div>

              <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans font-semibold ${
                isDark ? 'border-white/[0.08] text-indigo-400' : 'border-slate-100 text-indigo-700'
              }`}>
                <span>{isHe ? 'דיוק הנדסי ותיעוד מלא' : 'Precision Architecture'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </SpotlightCard>
          </div>

          {/* Bento Item 4: Custom Software & System Development (Span 1) */}
          <div className="md:col-span-1">
            <SpotlightCard
              className={`p-7 h-full flex flex-col justify-between transition-all duration-300 rounded-2xl border ${
                isDark
                  ? 'border-white/[0.08] bg-[#090d16]/85 hover:border-cyan-400/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
                  : 'border-slate-300/80 bg-white shadow-xs hover:border-blue-500/40 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                    <Code2 className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'text-blue-300 bg-blue-950/40 border-blue-500/30' : 'text-blue-800 bg-blue-50 border-blue-200'
                  }`}>
                    04. SOFTWARE DEV
                  </span>
                </div>

                <h3 className={`text-lg font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isHe ? 'פיתוח תוכנה, אוטומציות ו-APIs' : 'Custom Software & Deep Integrations'}
                </h3>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe
                    ? 'פיתוח אפליקציות ופורטלים ארגוניים, כלי אוטומציה לחיסכון בזמן עבודה, ואינטגרציות API עמוקות המחברות בין מערכות ה-ERP, CRM וה-IT.'
                    : 'Custom enterprise software, workflow automation, and robust API bridge integrations connecting ERP, CRM, and IT stacks.'}
                </p>
              </div>

              <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans font-semibold ${
                isDark ? 'border-white/[0.08] text-blue-400' : 'border-slate-100 text-blue-700'
              }`}>
                <span>{isHe ? 'קוד איכותי ומאובטח' : 'Clean & Secure Codebase'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </SpotlightCard>
          </div>

          {/* Bento Item 5: Cloud & Business Continuity (Span 1) */}
          <div className="md:col-span-1">
            <SpotlightCard
              className={`p-7 h-full flex flex-col justify-between transition-all duration-300 rounded-2xl border ${
                isDark
                  ? 'border-white/[0.08] bg-[#090d16]/85 hover:border-cyan-400/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
                  : 'border-slate-300/80 bg-white shadow-xs hover:border-blue-500/40 hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    <Cloud className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  }`}>
                    05. CLOUD & DR
                  </span>
                </div>

                <h3 className={`text-lg font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isHe ? 'שירותי ענן, גיבוי נעול ורציפות (DRP)' : 'Cloud, Immutable Backup & DRP'}
                </h3>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe
                    ? 'מיגרציות Azure ו-M365, גיבויים נעולים חסיני כופרה (WORM Storage), בדיקות שחזור יזומות ותוכנית רציפות עסקית מלאה.'
                    : 'Azure & M365 hybrid cloud, ransomware-proof immutable backups (WORM), routine restore drills, and business continuity DRP.'}
                </p>
              </div>

              <div className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-sans font-semibold ${
                isDark ? 'border-white/[0.08] text-emerald-400' : 'border-slate-100 text-emerald-700'
              }`}>
                <span>{isHe ? 'רציפות עסקית מובטחת' : 'Zero-Downtime Guarantee'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </SpotlightCard>
          </div>

        </div>
      </div>

      {/* 3. "Who is TECH-SELECT for" Self-Selection Matrix */}
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pb-16 sm:pb-24 border-b ${
        isDark ? 'border-white/[0.08]' : 'border-slate-300/80'
      }`}>
        <div className={`p-8 sm:p-10 rounded-2xl border transition-all duration-300 ${
          isDark 
            ? 'bg-[#090d16]/90 border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-slate-50 border-slate-300/80 shadow-xs'
        }`}>
          <div className="max-w-3xl mb-8 space-y-2">
            <span className={`text-xs font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-block ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30' : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {isHe ? 'התאמה מדויקת לצורכי הארגון' : 'STRATEGIC FIT'}
            </span>
            <h3 className={`text-2xl sm:text-3xl font-extrabold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {isHe ? 'למי TECH-SELECT מתאימה?' : 'Who is TECH-SELECT Built For?'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isHe
                ? 'אנחנו השותף הטכנולוגי האידיאלי לארגונים שדורשים אחריות מקצועית, סטנדרט הנדסי קשיח ושקט תעשייתי.'
                : 'We are the ideal technology partner for organizations demanding rigorous engineering standards, accountability, and total peace of mind.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fitItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-xl border flex items-start gap-3.5 transition-colors ${
                  isDark ? 'bg-[#05070c]/80 border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Check className="w-4 h-4" />
                </div>
                <div className={`space-y-1 ${isHe ? 'text-right' : 'text-left'}`}>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Assessment CTA Strip */}
          <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-center ${
            isHe ? 'sm:text-right' : 'sm:text-left'
          } ${
            isDark ? 'border-white/[0.08]' : 'border-slate-200'
          }`}>
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isHe ? 'רוצים לבדוק אם מערך ה-IT והטכנולוגיה שלכם מנוהל נכון?' : 'Want to verify if your IT and technology are governed properly?'}
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isHe ? 'שיחת אבחון הנדסית קצרה עם מומחה בכיר - ללא עלות וללא התחייבות.' : 'A concise diagnostic session with a senior engineer - zero cost, zero commitment.'}
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-full text-xs shadow-md shadow-blue-600/20 transition-all whitespace-nowrap cursor-pointer"
            >
              <span>{isHe ? 'לתיאום שיחת אבחון' : 'Schedule Assessment'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

    </section>
  );
};
