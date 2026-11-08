import React from 'react';
import { Sparkles, Shield, Cpu, Target, ArrowLeft, ArrowRight, CheckCircle2, FileText, Users, Bot, Zap, Play } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AI_DISCOVERY_PRESETS, AIDiscoveryPreset } from '../../data/aiDiscoveryPresets';

interface AIDiscoveryHeroProps {
  onStartDiscovery: () => void;
  onStartChat: () => void;
  onSelectPreset: (preset: AIDiscoveryPreset) => void;
  onOpenEmployeeSurvey: () => void;
}

export const AIDiscoveryHero: React.FC<AIDiscoveryHeroProps> = ({
  onStartDiscovery,
  onStartChat,
  onSelectPreset,
  onOpenEmployeeSurvey,
}) => {

  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  return (
    <section className="relative pt-28 sm:pt-32 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Breadcrumb / Top Tag */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-sans bg-blue-600/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 shadow-sm backdrop-blur-md">
          <Bot className="w-3.5 h-3.5" />
          <span>{isHe ? 'מתודולוגיית AI ארגונית מבית TECH-SELECT' : 'TECH-SELECT Enterprise AI Framework'}</span>
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
          <Shield className="w-3 h-3" />
          <span>{isHe ? 'Security-First & אפס דליפת מידע' : 'Zero-Data-Retention & DPA'}</span>
        </span>
      </div>

      {/* Main Headline */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.15]">
          <span className={isDark ? 'text-white' : 'text-slate-950'}>
            {isHe ? 'מיפוי והטמעת ' : 'Enterprise '}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400">
            {isHe ? 'AI בארגונים' : 'AI Discovery'}
          </span>
          <br className="hidden sm:inline" />
          <span className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            {isHe ? ' – מהאבחון ועד ליישום מעשי' : ' – From Diagnostic to Action Plan'}
          </span>
        </h1>

        <p className={`text-base sm:text-xl font-sans max-w-3xl mx-auto leading-relaxed ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {isHe
            ? 'לא עוד "צ׳אטבוט גנרי", אלא תהליך אפיון עסקי מקיף. אנו ממפים את צווארי הבקבוק בארגון שלכם, מאתרים היכן AI מייצר ROI כספי מיידי, ומפיקים AI Excellence Report עם תוכנית עבודה וארכיטקטורה מותאמת.'
            : 'Move beyond generic chatbots to enterprise-grade AI transformation. We diagnose operational bottlenecks, identify high-ROI opportunities, and generate a customized AI Roadmap with zero data leakage.'}
        </p>
      </div>

      {/* 6-Pillar Methodology Process */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-10 max-w-5xl mx-auto">
        {[
          { step: '01', titleHe: 'מיפוי וכאבים', titleEn: 'Discover', descHe: 'הבנת תפקיד וזמנים מבוזבזים', icon: Target },
          { step: '02', titleHe: 'ניתוח תהליכים', titleEn: 'Analyze', descHe: 'זיהוי משימות שגרתיות ו-ERP', icon: Cpu },
          { step: '03', titleHe: 'תעדוף ו-ROI', titleEn: 'Prioritize', descHe: 'מפת Quick Wins וחיסכון בשעות', icon: Zap },
          { step: '04', titleHe: 'אבטחה ופרטיות', titleEn: 'Secure', descHe: 'DPA, חסימת דליפות ו-Local AI', icon: Shield },
          { step: '05', titleHe: 'ארכיטקטורה', titleEn: 'Implement', descHe: 'M365, RAG וסוכנים חכמים', icon: Bot },
          { step: '06', titleHe: 'דוח ומדידה', titleEn: 'Measure', descHe: 'הפקת AI Roadmap ו-KPIs', icon: FileText },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center transition-all relative group ${
                isDark
                  ? 'bg-slate-900/60 border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/90'
                  : 'bg-white/80 border-slate-200/80 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="text-[10px] font-mono font-bold text-cyan-500 mb-1 tracking-wider">
                {item.step}
              </div>
              <div className={`w-8 h-8 mx-auto mb-2 rounded-xl flex items-center justify-center border transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 text-cyan-400 group-hover:bg-cyan-500/10'
                  : 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-100'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className={`text-xs font-bold font-heading mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isHe ? item.titleHe : item.titleEn}
              </h3>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHe ? item.descHe : item.titleEn}
              </p>
            </div>
          );
        })}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-3xl mx-auto">
        <button
          onClick={onStartChat}
          className="w-full sm:w-auto px-7 py-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 ring-2 ring-cyan-400/30"
        >
          <Bot className="w-5 h-5 text-cyan-200 animate-pulse" />
          <span>{isHe ? 'אפיון AI ישיר למנכ"ל' : 'Launch CEO AI Assessment'}</span>
          {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>

        <button
          onClick={onStartDiscovery}
          className={`w-full sm:w-auto px-6 py-4 rounded-full font-bold text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 border-white/20 text-slate-100 hover:text-white'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>{isHe ? 'טופס אפיון מובנה' : 'Structured Discovery Form'}</span>
        </button>

        <button
          onClick={onOpenEmployeeSurvey}
          className={`w-full sm:w-auto px-5 py-4 rounded-full font-bold text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          <span>{isHe ? 'סקר עובדים 360' : 'Employee Survey'}</span>
        </button>
      </div>


      {/* Instant Demo Presets Section */}
      <div className="mt-14 pt-10 border-t border-slate-200 dark:border-white/10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-500 uppercase tracking-wider block">
              {isHe ? 'סימולציות חיות לפי מגזר' : 'Instant Sector Scenarios'}
            </span>
            <h3 className={`text-sm sm:text-base font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isHe ? 'רוצים לראות דוח לדוגמה? לחצו על פרופיל ארגוני:' : 'Explore Real-World Industry Presets:'}
            </h3>
          </div>
          <span className="hidden sm:inline-block text-xs text-slate-400">
            {isHe ? 'הפעלת אבחון מלא ב-3 שניות' : '1-Click Instant Report'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AI_DISCOVERY_PRESETS.map((preset) => {
            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer group relative overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/70 border-white/10 hover:border-cyan-400/50 hover:bg-slate-900'
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    preset.id === 'defense_airgap'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                  }`}>
                    {isHe ? preset.badgeHe : preset.badgeEn}
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-transform group-hover:scale-110" />
                </div>
                <h4 className={`text-xs sm:text-sm font-bold font-heading mb-1 transition-colors ${
                  isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-700'
                }`}>
                  {isHe ? preset.nameHe : preset.nameEn}
                </h4>
                <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe ? preset.descriptionHe : preset.descriptionEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
