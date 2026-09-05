import React, { useState, useEffect } from 'react';
import { 
  Server, 
  ShieldCheck, 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  Linkedin,
  Mail,
  Cpu,
  Clock,
  Target,
  Cloud,
  Database,
  FileCheck,
  X,
  Sparkles,
  Building2
} from 'lucide-react';
import { GuyPortrait } from './GuyPortrait';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { TEAM_MEMBERS, TeamMember } from './LeadershipPage';
import { EnterpriseLogosMarquee } from './EnterpriseLogosMarquee';
import { PageHeroBackground } from './PageHeroBackground';
import heroBgImage from '../assets/images/techselect_office_hero.jpg';

interface DeliveryHubsSectionProps {
  onNavigateToContact?: () => void;
  onNavigateToServices?: () => void;
  onNavigateToDefense?: () => void;
  onNavigateToAIDiscovery?: () => void;
}

type TabType = 'all' | 'vision' | 'team' | 'expertise';

export const DeliveryHubsSection: React.FC<DeliveryHubsSectionProps> = ({
  onNavigateToContact,
  onNavigateToServices,
  onNavigateToDefense,
  onNavigateToAIDiscovery
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  // Active section tab: 'all' | 'vision' | 'team' | 'expertise'
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [memberImageSources, setMemberImageSources] = useState<Record<string, string>>({});

  // Image cache check
  useEffect(() => {
    try {
      const cached: Record<string, string> = {};
      TEAM_MEMBERS.forEach(m => {
        const stored = localStorage.getItem(`tech_select_member_img_${m.id}`);
        if (stored) {
          cached[m.id] = stored;
        }
      });
      if (Object.keys(cached).length > 0) {
        setMemberImageSources(prev => ({ ...prev, ...cached }));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const getImageSrc = (member: TeamMember) => {
    return memberImageSources[member.id] || member.image || '';
  };

  const handleImageError = (member: TeamMember) => {
    const currentSrc = getImageSrc(member);
    if (currentSrc && (currentSrc.endsWith('.jpg') || currentSrc.endsWith('.jpeg') || currentSrc.endsWith('.png'))) {
      const svgSrc = currentSrc.replace(/\.(jpg|jpeg|png)$/, '.svg');
      setMemberImageSources(prev => ({ ...prev, [member.id]: svgSrc }));
    } else {
      setImageErrors(prev => ({ ...prev, [member.id]: true }));
    }
  };

  // The 4 Core Values from Image 1 - Clean, uncluttered, precisely crafted
  const coreValues = [
    {
      id: 'transparency',
      titleHe: 'שקיפות מלאה ללא אותיות קטנות',
      titleEn: 'Zero Surprises & Flat Retainer',
      descHe: 'תמחור חודשי שקוף וקבוע ללא חיובים נסתרים, לצד דוחות סטטוס חודשיים ברורים.',
      descEn: 'Predictable flat monthly retainer with zero hidden fees and transparent SLA reports.',
      icon: FileCheck,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'availability',
      titleHe: 'מענה אנושי תוך פחות מ-15 דקות',
      titleEn: 'Under 15-Min Live Response',
      descHe: 'ללא מרכזיות מתישות. מהנדסים ומוקדנים בכירים עונים מיד ומטפלים בזמן אמת.',
      descEn: 'Direct access to senior engineers without robotic phone trees.',
      icon: Clock,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'partnership',
      titleHe: 'שותפות טכנולוגית ארוכת טווח (vCIO)',
      titleEn: 'Strategic vCIO Partnership',
      descHe: 'חלק אורגני מהנהלת הלקוח – תכנון תקציבי, חיסכון ברישוי ומפת דרכים טכנולוגית.',
      descEn: 'Acting as an executive extension for IT budget planning and roadmaps.',
      icon: Users,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'discipline',
      titleHe: 'משמעת הנדסית וסטנדרט ביטחוני',
      titleEn: 'Defense-Grade Engineering',
      descHe: 'ספק מורשה משרד הביטחון (0011028306) – הקשחה מחמירה, Air-Gap וגיבויים בלתי חדירים.',
      descEn: 'MoD certified supplier applying Air-Gap separation and immutable backups.',
      icon: ShieldAlert,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
    }
  ];

  // Guy Yaakobi (CEO) spotlight
  const guy = TEAM_MEMBERS.find(m => m.id === 'guy-yaakobi') || TEAM_MEMBERS[0];
  // Core leadership team members
  const teamLeads = TEAM_MEMBERS.filter(m => m.id !== 'guy-yaakobi');

  return (
    <div id="about" className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Immersive About Hero Fold (Matching Home Page Visual Architecture & Design) */}
      <div className="relative min-h-[560px] sm:min-h-[620px] flex flex-col items-center justify-center pt-24 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 mb-12 overflow-hidden border-b border-slate-200 dark:border-white/10">
        
        {/* Unified Enterprise Architectural Background */}
        <PageHeroBackground
          imageSrc="/tech_datacenter_hero.jpg"
          fallbackSrc="/techselect_office_hero.jpeg"
          alt="TECH-SELECT Enterprise Data Center & Cloud Infrastructure"
          glowColor="bg-blue-600"
        />

        {/* Center Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          
          {/* Eyebrow Pill Tag with Live Pulse */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm backdrop-blur-md transition-all bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 animate-linear-eyebrow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHe ? 'TECH-SELECT • אודות, חזון והאנשים' : 'TECH-SELECT • About, Vision & Team'}</span>
          </div>

          {/* Headline Matching Home Page Design */}
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] font-heading animate-linear-title ${
            isDark ? 'text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]' : 'text-slate-950 drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]'
          }`}>
            {isHe ? 'שותפות טכנולוגית שמעניקה שקט תעשייתי' : 'A Technology Partnership Built on Total Accountability'}
          </h1>

          {/* Subtitle Matching Home Page Measure */}
          <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-linear-subtitle ${
            isDark ? 'text-slate-100 font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : 'text-slate-900 font-semibold drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]'
          }`}>
            {isHe 
              ? 'אנחנו לוקחים אחריות מלאה על ה-IT, הענן ואבטחת המידע בארגון שלכם – כדי שתוכלו להתרכז ב-100% בצמיחה עסקית.'
              : 'We assume turnkey ownership over your IT, cloud, and cybersecurity footprint, freeing you to focus entirely on business growth.'}
          </p>

          {/* 4 Stats - Matching Home Page Glassmorphism */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1 text-xs sm:text-sm font-medium animate-linear-cta">
            <div className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-xs ${
              isDark ? 'bg-slate-950/70 border-white/15 text-slate-200' : 'bg-white/90 border-slate-300 text-slate-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{isHe ? '15+ שנות ניסיון בהנדסה' : '15+ Years Engineering'}</span>
            </div>
            <div className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-xs ${
              isDark ? 'bg-slate-950/70 border-white/15 text-slate-200' : 'bg-white/90 border-slate-300 text-slate-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isHe ? 'מענה תוך < 15 דקות' : '< 15 Min Response'}</span>
            </div>
            <div className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-xs ${
              isDark ? 'bg-slate-950/70 border-white/15 text-slate-200' : 'bg-white/90 border-slate-300 text-slate-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              <span>{isHe ? 'ספק מורשה משרד הביטחון' : 'MoD Authorized Supplier'}</span>
            </div>
            <div className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-xs ${
              isDark ? 'bg-slate-950/70 border-white/15 text-slate-200' : 'bg-white/90 border-slate-300 text-slate-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>{isHe ? 'שרידות עסקית 99.98%' : '99.98% High Availability'}</span>
            </div>
          </div>

          {/* Segmented Navigation Switcher */}
          <div className="pt-3 inline-flex p-1.5 rounded-2xl border shadow-lg backdrop-blur-md max-w-full overflow-x-auto gap-1 bg-white/80 dark:bg-slate-950/80 border-slate-300 dark:border-white/15 animate-linear-telemetry">
            <button
              id="tab-all"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
              }`}
            >
              {isHe ? 'הכל' : 'All Overview'}
            </button>
            <button
              id="tab-vision"
              onClick={() => setActiveTab('vision')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'vision'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
              }`}
            >
              {isHe ? '1. הסיפור ועקרונות הברזל' : '1. Story & Core Pillars'}
            </button>
            <button
              id="tab-team"
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'team'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
              }`}
            >
              {isHe ? '2. האנשים וההנהגה' : '2. Team & Leadership'}
            </button>
            <button
              id="tab-expertise"
              onClick={() => setActiveTab('expertise')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'expertise'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
              }`}
            >
              {isHe ? '3. מומחיות וארגז כלים' : '3. Expertise & Tech Stack'}
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ----------------------------------------------------------------------- */}
        {/* PILLAR 1: STORY & CORE VALUES (From Image 1) */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'vision') && (
          <section className="mb-14">
            
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isHe ? 'הסיפור, החזון ו-4 עקרונות הברזל' : 'Our Story, Vision & 4 Core Pillars'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHe ? 'לקיחת אחריות טכנולוגית מלאה ושקט תעשייתי אמיתי' : 'Total IT accountability and genuine business peace of mind'}
                </p>
              </div>
            </div>

            {/* Headquarters & Engineering Center Visual Showcase (Uploaded Photo) */}
            <div className={`mb-8 rounded-2xl overflow-hidden border shadow-sm transition-all ${
              isDark ? 'bg-[#0b101e] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
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
                  alt={isHe ? 'מטה ההנדסה ומרכז התמיכה של TECH-SELECT' : 'TECH-SELECT Engineering Headquarters'}
                  referrerPolicy="no-referrer"
                  fetchPriority="high"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center contrast-[1.05] brightness-[1.02] transition-transform duration-700 hover:scale-105"
                />
                <div className={`absolute inset-0 transition-colors ${
                  isDark
                    ? 'bg-gradient-to-t from-[#0b101e] via-[#0b101e]/20 to-transparent'
                    : 'bg-gradient-to-t from-white/95 via-white/20 to-transparent'
                }`} />
                <div className="absolute bottom-3 start-3 end-3 sm:bottom-4 sm:start-4 sm:end-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md bg-black/60 text-white border border-white/20">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isHe ? 'מטה ההנדסה ומרכז התמיכה • רוטשילד, תל אביב' : 'Engineering & Support HQ • Tel Aviv'}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isHe ? 'צוות הנדסה פנימי Tier-3/4 זמין 24/7' : 'In-House Tier-3/4 Engineering 24/7'}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'צוות המומחים של TECH-SELECT פועל ישירות ממטה החברה בתל אביב – ללא מוקדים חיצוניים וללא קבלני משנה. אחריות טכנולוגית מלאה, מענה תוך פחות מ-15 דקות ומעורבות הנדסית מקצועית מקצה לקצה.'
                    : 'TECH-SELECT’s dedicated engineers operate directly from our Tel Aviv headquarters — zero outsourcing, zero delays. Rapid tier-3/4 engineering response and complete ownership from end to end.'}
                </p>
              </div>
            </div>

            {/* Purpose & Origin: 2 Balanced Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              
              <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-[#0b101e] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>{isHe ? 'הצורך שעליו אנו עונים: שקט תעשייתי' : 'The Purpose: Real Peace of Mind'}</span>
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'מנהלים לא צריכים לבזבז ימי עבודה על שרת שהושבת, ויכוחי ספקים או מרכזיות מתישות. אנחנו לוקחים אחריות טכנולוגית מלאה (Turnkey IT) – מנטרים ופותרים תקלות מאחורי הקלעים לפני שאתם מרגישים בהן.'
                    : 'Leaders shouldn’t waste time on downed servers or finger-pointing vendors. We take turnkey IT ownership, resolving issues proactively before disruption occurs.'}
                </p>
              </div>

              <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-[#0b101e] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <span>{isHe ? 'הדרך שעברנו: משמעת הנדסית ביטחונית' : 'The Journey: Defense Discipline'}</span>
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'ניסיון של 15+ שנים שהחל בהקמת רשתות Air-Gap מסווגות ומתקנים ביטחוניים רגישים. כספק מורשה משרד הביטחון (0011028306), אנו מביאים סטנדרט בלתי מתפשר של אבטחה, גיבויים והמשכיות עסקית לכל לקוח.'
                    : '15+ years rooted in classified defense Air-Gap network installations. As an authorized Ministry of Defense supplier, we bring zero-compromise security to every enterprise.'}
                </p>
              </div>

            </div>

            {/* THE 4 CORE VALUE CARDS (Exact match to Image 1, polished and clean) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {coreValues.map((val) => {
                const IconComponent = val.icon;
                return (
                  <div 
                    key={val.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isDark 
                        ? 'bg-[#090d18] border-white/10 hover:border-white/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Icon & Title */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-xl shrink-0 border ${val.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                          {isHe ? val.titleHe : val.titleEn}
                        </h4>
                      </div>

                      {/* Description */}
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isHe ? val.descHe : val.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </section>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* PILLAR 2: LEADERSHIP & THE PEOPLE */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'team') && (
          <section className="mb-14">
            
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isHe ? 'האנשים שמאחורי הטכנולוגיה' : 'The People & Leadership'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHe ? 'מנהיגות מקצועית בגובה העיניים וצוות הנדסה מנוסה' : 'Hands-on leadership and experienced engineering talent'}
                </p>
              </div>
            </div>

            {/* CEO SPOTLIGHT CARD - Clean, Horizontal, Airy */}
            <div className={`p-6 sm:p-7 rounded-2xl border mb-6 transition-all ${
              isDark 
                ? 'bg-gradient-to-r from-[#0d1428] to-[#090d1a] border-blue-500/20' 
                : 'bg-gradient-to-r from-blue-50/60 to-white border-blue-200 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                
                {/* Portrait */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-md">
                    <GuyPortrait className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                    {isHe ? 'מייסד ומנכ"ל' : 'Founder & CEO'}
                  </div>
                </div>

                {/* Info & Vision */}
                <div className="flex-1 text-center sm:text-right">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isHe ? guy.nameHe : guy.nameEn}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {isHe ? 'מייסד ומנכ"ל | ארכיטקט מערכות ראשי' : 'Founder, CEO & Principal Architect'}
                      </p>
                    </div>

                    {/* Quick Contacts */}
                    <div className="flex items-center justify-center sm:justify-end gap-2">
                      <a
                        href={guy.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                          isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                        title="LinkedIn"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                        <span>LinkedIn</span>
                      </a>
                      {guy.email && (
                        <a
                          href={`mailto:${guy.email}`}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                            isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                          title={guy.email}
                        >
                          <Mail className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{guy.email}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe 
                      ? '״מנהיגות טכנולוגית אמיתית נמדדת בגובה העיניים ובנכונות לקחת אחריות מלאה על המערכות של הלקוח. אנחנו מלווים את ההנהלה כשותף אסטרטגי, פותרים תקלות מהר וללא תירוצים, ומספקים שקט תעשייתי בלתי מתפשר.״'
                      : '"True technology leadership is measured by direct accountability and hands-on partnership. We accompany executive boards with complete transparency and zero excuses."'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                      {isHe ? '15+ שנות ארכיטקטורה' : '15+ Yrs Architecture'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                      {isHe ? 'ספק מורשה משרד הביטחון' : 'MoD Authorized Supplier'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-medium">
                      {isHe ? 'ייעוץ vCIO בכיר' : 'Executive vCIO Practice'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 4 TEAM LEADS: Breathable Clean Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamLeads.map((member) => {
                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isDark ? 'bg-[#090d18] border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Photo & Role */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                          {!imageErrors[member.id] && getImageSrc(member) ? (
                            <img
                              src={getImageSrc(member)}
                              alt={isHe ? member.nameHe : member.nameEn}
                              onError={() => handleImageError(member)}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-300">
                              {member.initials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">
                            {isHe ? member.nameHe : member.nameEn}
                          </h4>
                          <p className="text-[11px] text-blue-500 dark:text-blue-400 truncate">
                            {isHe ? member.roleHe.split('|')[0].trim() : member.roleEn.split('|')[0].trim()}
                          </p>
                        </div>
                      </div>

                      {/* 1-Sentence Focus */}
                      <p className={`text-xs line-clamp-2 leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isHe ? member.teamDepartmentHe : member.teamDepartmentEn}
                      </p>
                    </div>

                    {/* Bottom Action / LinkedIn */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {isHe ? 'קרא עוד על הניסיון' : 'View background'}
                      </button>

                      {member.linkedinUrl && (
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-500 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </section>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* PILLAR 3: EXPERTISE & TECH STACK (No client stories / case studies!) */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'expertise') && (
          <section className="mb-14">
            
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isHe ? 'המומחיות, ארגז הכלים והשירות המנוהל' : 'Expertise & Tech Stack'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHe ? 'מעטפת IT שלמה מקצה לקצה תחת קורת גג אחת' : 'End-to-end full spectrum technology operations'}
                </p>
              </div>
            </div>

            {/* 3 Core Pillars of Service */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              
              <div className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-[#090d18] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-3">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-slate-900 dark:text-white">
                  {isHe ? 'מחלקת IT מנוהלת 360°' : 'Managed 360° IT Operations'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe 
                    ? 'מוקד Helpdesk אנושי זמין 24/7/365, ניהול שרתים ותחנות קצה, גיבויים שוטפים וליווי vCIO צמוד.'
                    : '24/7 live helpdesk, proactive server management, endpoints, regular backups, and executive vCIO.'}
                </p>
              </div>

              <div className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-[#090d18] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 w-fit mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-slate-900 dark:text-white">
                  {isHe ? 'סייבר, רשתות ו-Air-Gap' : 'Cyber, Networks & Air-Gap'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe 
                    ? 'הקמת רשתות מסווגות ומבודדות, מתגי CISCO, חומות אש Fortinet/Palo Alto והגנת AI EDR רב-שכבתית.'
                    : 'Isolated defense networks, CISCO switching, Fortinet firewalls, and AI-powered EDR threat hunting.'}
                </p>
              </div>

              <div className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-[#090d18] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 w-fit mb-3">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-slate-900 dark:text-white">
                  {isHe ? 'ענן, אוטומציה ו-AI' : 'Cloud, Automation & AI'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isHe 
                    ? 'הגירה היברידית ל-Azure/AWS, התאוששות מאסון DRP, אינטגרציות Salesforce ואוטומציית תהליכים.'
                    : 'Azure/AWS cloud migration, automated DRP, Salesforce CRM practice, and workflow automation.'}
                </p>
              </div>

            </div>

            {/* Enterprise Tech Ecosystem Infinite Marquee Banner */}
            <EnterpriseLogosMarquee />

          </section>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* BOTTOM CALL TO ACTION - Clean, Spacious, Minimal */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`mt-6 p-6 sm:p-8 rounded-2xl border text-center relative overflow-hidden transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#0c1428] via-[#090e1c] to-[#080b14] border-blue-500/30' 
            : 'bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm'
        }`}>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900 dark:text-white">
            {isHe ? 'מוכנים להעניק לארגון שלכם שקט תעשייתי?' : 'Ready for Genuine Technology Peace of Mind?'}
          </h3>
          <p className={`text-xs sm:text-sm max-w-xl mx-auto mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isHe
              ? 'נשמח לתאם פגישת היכרות ואפיון ללא עלות עם גיא והצוות הבכיר, למיפוי התשתיות ובניית מפת דרכים מותאמת.'
              : 'Schedule an introductory consultation with Guy and our engineering leadership to assess your IT infrastructure.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onNavigateToContact && (
              <button
                id="btn-contact-about"
                onClick={onNavigateToContact}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>{isHe ? 'תיאום פגישת אפיון ישירה' : 'Schedule Discovery Call'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            )}
            {onNavigateToServices && (
              <button
                id="btn-services-about"
                onClick={onNavigateToServices}
                className={`px-6 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {isHe ? 'לצפייה בכל שירותי החברה' : 'Explore All Services'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: TEAM MEMBER BIO (Only upon click, zero visual clutter on page!) */}
      {/* ========================================================================= */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
              isDark ? 'bg-[#0d1428] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                {!imageErrors[selectedMember.id] && getImageSrc(selectedMember) ? (
                  <img
                    src={getImageSrc(selectedMember)}
                    alt={isHe ? selectedMember.nameHe : selectedMember.nameEn}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg text-slate-300">
                    {selectedMember.initials}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {isHe ? selectedMember.nameHe : selectedMember.nameEn}
                </h3>
                <p className="text-xs text-blue-500 font-medium">
                  {isHe ? selectedMember.roleHe : selectedMember.roleEn}
                </p>
                {selectedMember.linkedinUrl && (
                  <a
                    href={selectedMember.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 mt-1"
                  >
                    <Linkedin className="w-3 h-3 text-blue-500" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
              </div>
            </div>

            <div className={`text-xs sm:text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isHe ? selectedMember.bioHe : selectedMember.bioEn}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-white/10">
              {(isHe ? selectedMember.badgesHe : selectedMember.badgesEn).map((badge, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
