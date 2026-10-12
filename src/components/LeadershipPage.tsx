import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import leadershipBoardBg from '../assets/images/leadership_board_hero.jpg';
import { 
  ShieldCheck, 
  Linkedin, 
  Mail, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  PhoneCall, 
  Award, 
  Terminal,
  Code2,
  Headphones,
  Briefcase,
  Users
} from 'lucide-react';

export interface TeamMember {
  id: string;
  nameHe: string;
  nameEn: string;
  roleHe: string;
  roleEn: string;
  category: 'executive' | 'infrastructure' | 'software' | 'support';
  teamDepartmentHe: string;
  teamDepartmentEn: string;
  image?: string;
  initials: string;
  accentColor: string; // Tailwind color class for border/gradient
  linkedinUrl: string;
  email?: string;
  bioHe: string;
  bioEn: string;
  badgesHe: string[];
  badgesEn: string[];
  stats?: { labelHe: string; labelEn: string; value: string };
  isFeatured?: boolean;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'guy-yaakobi',
    nameHe: 'גיא יעקובי',
    nameEn: 'Guy Yaakobi',
    roleHe: 'מייסד ומנכ"ל | ארכיטקט מערכות ראשי',
    roleEn: 'Founder & CEO | Principal Enterprise Architect',
    teamDepartmentHe: 'מוביל את מעטפת ה-IT, הענן ואבטחת המידע של TECH-SELECT',
    teamDepartmentEn: 'Directing TECH-SELECT Corporate IT, Cloud & Cybersecurity Strategy',
    category: 'executive',
    image: '/guy-yaakobi.jpg',
    initials: 'GY',
    accentColor: 'from-blue-600 to-cyan-500',
    linkedinUrl: 'https://www.linkedin.com/in/guy-yaakobi-techselect/',
    email: 'guy@tech-select.co.il',
    bioHe: '״טכנולוגיה טובה מתחילה באנשים שלוקחים אחריות. אנחנו עובדים בגובה העיניים, מלווים את הנהלת הארגון כשותף טכנולוגי, ומנהלים את מערך ה-IT מקצה לקצה — מתכנון ויישום ועד תמיכה שוטפת. המטרה פשוטה: מערכות יציבות, עבודה רציפה ושקט תפעולי.״',
    bioEn: '“Great technology starts with people who take ownership. We communicate at eye level, accompany executive leadership as a trusted technology partner, and manage corporate IT end-to-end — from architecture and deployment to ongoing mission-critical support. The goal is simple: stable systems, continuous workflow, and operational peace of mind.”',
    badgesHe: ['15+ שנות ארכיטקטורה והובלה', 'אחריות הנדסית מלאה Turnkey', 'ספק מורשה משרד הביטחון', 'שותף אסטרטגי vCIO'],
    badgesEn: ['15+ Yrs Enterprise Architecture', 'Full Turnkey Ownership', 'MoD Authorized Supplier', 'Strategic vCIO Partner'],
    stats: { labelHe: 'שנות ניסיון בהנדסה', labelEn: 'Years Experience', value: '15+' },
    isFeatured: true
  },
  {
    id: 'irit-yaakobi',
    nameHe: 'אירית יעקובי',
    nameEn: 'Irit Yaakobi',
    roleHe: 'סמנכ"לית תפעול, מומחית מערכות Salesforce ומובילת PMO ארגוני (COO)',
    roleEn: 'Chief Operating Officer, Salesforce Enterprise Solutions Lead & VP PMO',
    teamDepartmentHe: 'עומדת בראש אגף התפעול, בקרת ה-SLA, הטמעת מערכות Salesforce וניהול פרויקטי ענק בתאגידים מובילים',
    teamDepartmentEn: 'Directs Corporate Operations, Zero-Breach SLA, Enterprise Salesforce Practice & Tier-1 PMO Squads',
    category: 'executive',
    image: '/irit-yaakobi.svg',
    initials: 'IY',
    accentColor: 'from-purple-600 to-pink-500',
    linkedinUrl: 'https://www.linkedin.com/in/irit-yaakobi-570088218/',
    email: 'irit@tech-select.co.il',
    bioHe: 'עומדת בראש אגף התפעול וה-SLA של TECH-SELECT ומומחית בכירה לארכיטקטורה, אופטימיזציה והטמעת מערכות Salesforce ופלטפורמות CRM מורכבות. אירית מובילה ומנהלת פרויקטי ענק טכנולוגיים חוצי-ארגון עבור התאגידים והגופים המובילים במשק ובמגזרים רגישים (תחת מעטה סודיות וסיווג קפדני). במסגרת זו, היא מנצחת על צוותי אינטגרציה, פיתוח ו-PMO, ומסנכרנת בדיוק מירבי בין הנהלות הארגונים, הדרישות העסקיות והביצוע ההנדסי ברף האיכות הגבוה ביותר.',
    bioEn: 'Directs TECH-SELECT\'s operations, SLA governance, and enterprise Salesforce / CRM practice. Irit brings deep mastery in leading complex, multi-million enterprise technology deployments for tier-1 corporations and classified entities under strict NDA governance. Commanding cross-functional integration teams, software squads, and PMO controllers, she bridges executive strategic vision with flawless engineering execution and zero-breach SLA compliance.',
    badgesHe: ['מומחית מערכות Salesforce ו-CRM', 'ניהול פרויקטי ענק בתאגידים מסווגים', 'הובלת מערך התפעול וה-PMO', 'בקרת איכות ו-SLA 100%'],
    badgesEn: ['Enterprise Salesforce & CRM Expert', 'Classified & Tier-1 Enterprise PMO', 'Leads PMO & Operations Squads', '100% SLA Quality Metric'],
    stats: { labelHe: 'עמידה ב-SLA ובקרת איכות', labelEn: 'Quality & SLA Metric', value: '100%' },
    isFeatured: true
  },
  {
    id: 'niv-boro',
    nameHe: 'ניב בורו',
    nameEn: 'Niv Boro',
    roleHe: 'מנהל הנדסה טכנולוגית, ארכיטקט סייבר ומומחה תקשורת CISCO בכיר',
    roleEn: 'Head of Systems Engineering, Senior Cyber Architect & CISCO Master',
    teamDepartmentHe: 'מוביל ומפקד על צוות מהנדסי התשתיות, מומחי ה-Cybersecurity, מהנדסי CISCO וארכיטקטי הרשתות',
    teamDepartmentEn: 'Directs Elite Squad of Systems Engineers, Certified CISCO Specialists, Cyber Experts & Network Architects',
    category: 'infrastructure',
    image: '/niv-boro.svg',
    initials: 'NB',
    accentColor: 'from-cyan-600 to-blue-500',
    linkedinUrl: 'https://www.linkedin.com/in/niv-boro-b094b1349/',
    bioHe: 'מוביל ומנהל את צוות מהנדסי התשתיות, מומחי הסייבר וארכיטקטי התקשורת ב-TECH-SELECT. בעל מגוון הסמכות CISCO מתקדמות ויוקרתיות (בהווה ובתהליך מתמיד להסמכות קצה) לצד הסמכות Tier-1 מהמובילות בעולם בהקשחת חומות אש (Fortinet, Check Point, Palo Alto). ניב מחזיק בניסיון עשיר בהובלת פרויקטי תקשורת ורשתות מורכבים במיוחד, הקמת חוות שרתים, שרידות גבוהה (HA & DR), וירטואליזציה וסביבות Air-Gap מבודדות ברמת סיווג ביטחוני מחמיר. תחת ניהולו, צוותי ההנדסה מיישמים פתרונות תקשורת ואבטחה Zero-Trust מהמתקדמים בישראל.',
    bioEn: 'Commands TECH-SELECT\'s elite squad of infrastructure engineers, cybersecurity specialists, and senior network architects. Holds comprehensive, high-tier CISCO certifications alongside premier tier-1 credentials in next-gen firewalls (Fortinet, Check Point, Palo Alto). Niv has spearheaded massive, intricate networking projects, enterprise virtualization clusters (VMware / Hyper-V), and classified Air-Gap defense topologies. He directs his engineering squads in deploying enterprise-grade Zero-Trust frameworks and mission-critical high availability (HA / DR).',
    badgesHe: ['הסמכות CISCO מתקדמות ורשתות Enterprise', 'הקשחת Firewalls (Fortinet & Check Point)', 'תשתיות Air-Gap וסביבות מסווגות', 'פיקוד על צוותי הנדסה וסייבר'],
    badgesEn: ['Certified CISCO Enterprise Networking', 'Next-Gen Firewalls (Fortinet/Check Point)', 'Classified Air-Gap Systems', 'Commands Infrastructure Squads'],
    stats: { labelHe: 'תקני אבטחה, תקשורת ושרידות', labelEn: 'Security & Resiliency Level', value: 'Tier 3+' }
  },
  {
    id: 'vadim-gavrilov',
    nameHe: 'ודים גברילוב',
    nameEn: 'Vadim Gavrilov',
    roleHe: 'מנהל פיתוח תוכנה, פתרונות ענן ואינטגרציות',
    roleEn: 'Head of Software Engineering & Cloud Solutions',
    teamDepartmentHe: 'עומד בראש צוות מפתחי התוכנה, מהנדסי ה-Cloud ומומחי ה-API והאוטומציה',
    teamDepartmentEn: 'Directs Full-Stack Developers, Cloud DevOps Engineers & API Automation Specialists',
    category: 'software',
    image: '/vadim-gavrilov.svg',
    initials: 'VG',
    accentColor: 'from-indigo-600 to-violet-500',
    linkedinUrl: 'https://www.linkedin.com/in/vadim-gavrilov/',
    bioHe: 'עומד בראש חטיבת פיתוח התוכנה ומוביל צוות של מפתחי Full-Stack, מהנדסי ענן ומומחי אינטגרציה. בעל ניסיון רב בארכיטקטורת מערכות ענן מורכבות, פיתוח פלטפורמות SaaS מותאמות אישית, אינטגרציות API מורכבות בין מערכות ליבה (ERP, CRM, מחסנים ממוחשבים), ואוטומציה עמוקה של תהליכי IT ועסקים. ודים והצוות שבהובלתו מפתחים פתרונות טכנולוגיים מדויקים שמייעלים משמעותית את הפרודוקטיביות והרווחיות של לקוחות החברה.',
    bioEn: 'Directs TECH-SELECT\'s software engineering division, commanding full-stack developers, cloud DevOps engineers, and API integration specialists. Highly experienced in complex cloud architectures, custom enterprise SaaS development, mission-critical ERP/CRM system integrations, and end-to-end workflow automation. Vadim and his engineering squad build bespoke software assets that deliver substantial operational efficiency and competitive edge.',
    badgesHe: ['הובלת צוותי פיתוח ו-Cloud', 'אינטגרציות API ומערכות ליבה', 'אוטומציית IT ותהליכים עסקיים', 'פיתוח מערכות SaaS מותאמות'],
    badgesEn: ['Commands Dev & Cloud Squads', 'Mission-Critical API Integrations', 'IT & Business Automation', 'Bespoke SaaS Platforms'],
    stats: { labelHe: 'פרויקטי תוכנה ואינטגרציות מורכבות', labelEn: 'Software & API Deployments', value: '100+' }
  },
  {
    id: 'yosef-aiasa',
    nameHe: 'יוסף איאסה',
    nameEn: 'Yosef Aiasa',
    roleHe: 'מנהל מערך שטח, תמיכה טכנית ו-Enterprise Helpdesk',
    roleEn: 'Head of Field Operations & Enterprise Helpdesk',
    teamDepartmentHe: 'מפקד על צוות מהנדסי השטח, מוקדני ה-Helpdesk הבכירים וטכנאי ה-Enterprise',
    teamDepartmentEn: 'Commands Field Support Engineers, Senior Helpdesk Specialists & Enterprise Technicians',
    category: 'support',
    image: '/yosef-aiasa.svg',
    initials: 'YA',
    accentColor: 'from-emerald-600 to-teal-500',
    linkedinUrl: 'https://www.linkedin.com/in/yosef-aiasa-717b86254/',
    bioHe: 'מפקד על מערך השטח והתמיכה של TECH-SELECT ומנהל ישירות את צוותי מהנדסי השטח ומוקדני ה-Helpdesk הבכירים. מוביל פריסת ציי מחשוב, שרתים ותחנות עבודה מאובטחות (EDR / MDM), ומתמחה בטיפול בתקלות מורכבות ובאירועי קצה קריטיים באתר הלקוח ובשליטה מרחוק. תחת פיקודו, צוותי התמיכה והשטח פועלים בסטנדרט SLA קפדני עם זמני תגובה שוברי שיא, ומעניקים שקט תעשייתי מלא לאלפי משתמשים בארגונים המובילים בישראל.',
    bioEn: 'Commands TECH-SELECT\'s field engineering division and enterprise Helpdesk operations, directly managing squads of senior on-site engineers and support specialists. Oversees fleet endpoint deployment, secure hardware configurations (EDR / MDM), and complex rapid-incident resolution. Under his leadership, our field and support squads maintain record-breaking SLA response times, delivering unconditional operational peace of mind to thousands of enterprise users.',
    badgesHe: ['פיקוד על צוותי שטח ו-Helpdesk', 'הנדסת מערכות ופריסות שרתים', 'ניהול ואבטחת ציי קצה (EDR/MDM)', 'זמני תגובה שוברי שיא'],
    badgesEn: ['Commands Field & Helpdesk Squads', 'On-Site Field Engineering', 'Fleet Endpoint Security (EDR/MDM)', 'Record SLA Response Times'],
    stats: { labelHe: 'זמן מענה ממוצע לקריאות קריטיות', labelEn: 'Avg Critical SLA Response', value: '< 10m' }
  }
];

interface LeadershipPageProps {
  onNavigateToContact?: () => void;
  onBackToHome?: () => void;
}

export const LeadershipPage: React.FC<LeadershipPageProps> = ({
  onNavigateToContact,
  onBackToHome
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'all' | 'executive' | 'infrastructure' | 'software' | 'support'>('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [memberImageSources, setMemberImageSources] = useState<Record<string, string>>({});

  // Initialize cached photos from localStorage if available
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

  const categories = [
    { id: 'all', labelHe: 'כל ההנהלה והמובילים', labelEn: 'All Leadership & Leads', icon: Users },
    { id: 'executive', labelHe: 'הנהלה בכירה', labelEn: 'Executive Management', icon: Briefcase },
    { id: 'infrastructure', labelHe: 'תשתיות, הנדסה וסייבר', labelEn: 'Infrastructure & Cyber', icon: Cpu },
    { id: 'software', labelHe: 'פיתוח תוכנה ופתרונות ענן', labelEn: 'Software & Cloud Solutions', icon: Code2 },
    { id: 'support', labelHe: 'תפעול, שטח ו-Helpdesk', labelEn: 'Field Operations & Helpdesk', icon: Headphones },
  ];

  // Only show Guy Yaakobi (CEO & Founder) as requested
  const filteredMembers = TEAM_MEMBERS.filter(m => m.id === 'guy-yaakobi');

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

  return (
    <div className="w-full pb-20 relative overflow-hidden">
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={leadershipBoardBg || '/leadership_board_hero.jpg'}
        fallbackSrc="/leadership_board_hero.jpg"
        alt="TECH-SELECT Executive Boardroom & Leadership Atmosphere"
        glowColor="bg-blue-600"
      />
      
      {/* Hero / Header Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-36 sm:pt-40 pb-12 text-right relative z-10">
        
        {/* Top Tag & Back Button with Linear Eyebrow Animation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-linear-eyebrow">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHe ? 'שדרת הניהול וההנדסה של TECH-SELECT' : 'EXECUTIVE LEADERSHIP & SENIOR ENGINEERING'}</span>
          </div>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              {isHe ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isHe ? 'חזרה לדף הבית' : 'Back to Home'}</span>
            </button>
          )}
        </div>

        {/* Main Headline with Linear Title Animation */}
        <h1 className={`text-3xl sm:text-5xl font-black font-heading tracking-tight mb-4 leading-tight animate-linear-title ${
          isDark ? 'text-white' : 'text-slate-950'
        }`}>
          {isHe ? (
            <>
              הנהלת החברה ומצוינות טכנולוגית ב-<span className="gemini-text-gradient">TECH-SELECT</span>
            </>
          ) : (
            <>
              Executive Leadership & Technology at <span className="gemini-text-gradient">TECH-SELECT</span>
            </>
          )}
        </h1>

        <p className={`text-sm sm:text-base max-w-3xl leading-relaxed font-sans animate-linear-subtitle ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {isHe
            ? 'ב-TECH-SELECT אחריות הנדסית אינה סיסמה. הנהלת החברה מעניקה ליווי טכנולוגי אישי וצמוד לכל לקוח, תכנון ארכיטקטורה מתקדמת, מעטפת ענן וסייבר מקיפה ורציפות עסקית מלאה תחת הסכם SLA מחייב.'
            : 'At TECH-SELECT, engineering accountability is our foundation. Executive leadership provides personalized architectural advisory, robust cloud infrastructure, cybersecurity protection, and comprehensive business continuity under strict contractual SLAs.'}
        </p>

        {/* Value Highlights Chips with Linear CTA Soft Scale */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 animate-linear-cta">
          {[
            { titleHe: 'ליווי אישי של המייסד', titleEn: 'Direct Executive Lead', subHe: 'מעורבות הנדסית צמודה', subEn: 'Hands-on architectural lead' },
            { titleHe: 'ספק משהב״ט מורשה', titleEn: 'MoD Authorized', subHe: 'סיווג ביטחוני בתוקף', subEn: 'Active Security Clearances' },
            { titleHe: 'אחריות Turnkey מלאה', titleEn: 'Turnkey Ownership', subHe: 'כתובת אחת לכל אתגר', subEn: 'Single accountable partner' },
            { titleHe: 'תמיכה ו-SLA מובטח', titleEn: 'Guaranteed SLA', subHe: 'מענה הנדסי מהיר ומחייב', subEn: 'Contractual rapid engineering response' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all backdrop-blur-md ${
                isDark 
                  ? 'bg-white/[0.04] border-white/10 hover:border-white/20' 
                  : 'bg-white/70 border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold font-heading">{isHe ? item.titleHe : item.titleEn}</span>
              </div>
              <span className={`text-[11px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHe ? item.subHe : item.subEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Leadership Grid Section - Centered for Guy Yaakobi */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {filteredMembers.map((member) => {
            const currentImgSrc = getImageSrc(member);
            const hasCustomImage = !!currentImgSrc && !imageErrors[member.id];
            
            return (
              <div
                key={member.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between text-right group backdrop-blur-xl ${
                  isDark
                    ? 'bg-[#091122]/82 border-white/[0.14] shadow-[0_16px_50px_0_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:border-cyan-400/50'
                    : 'bg-white/88 border-slate-200/90 shadow-[0_16px_45px_0_rgba(37,99,235,0.08),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:border-blue-400/60'
                }`}
              >
                {/* Card Header with Portrait & Identity */}
                <div className="p-6 sm:p-8 md:p-10">
                  
                  {/* Top Bar: Role badge & LinkedIn Link */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    
                    {/* LinkedIn Button */}
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 group/link ${
                        isDark
                          ? 'bg-white/5 hover:bg-[#0077b5]/20 hover:border-[#0077b5]/50 border-white/10 text-slate-300 hover:text-cyan-300'
                          : 'bg-slate-100 hover:bg-[#0077b5]/10 hover:border-[#0077b5]/30 border-slate-200 text-slate-700 hover:text-[#0077b5]'
                      }`}
                      title={isHe ? `צפה בפרופיל LinkedIn של ${member.nameHe}` : `View ${member.nameEn}'s LinkedIn Profile`}
                      aria-label={`${member.nameEn} LinkedIn`}
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                      <span>LinkedIn</span>
                    </a>

                    {/* Executive Pill */}
                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide border ${
                      isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {isHe ? 'הנהלה ראשית • Executive' : 'Executive Leadership'}
                    </span>
                  </div>

                  {/* Profile Layout (Avatar + Name & Role) */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 mb-6">
                    
                    {/* Portrait Avatar Container - Ultra-Crisp High Fidelity */}
                    <div className="relative shrink-0">
                      <div 
                        className={`w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 shadow-2xl relative flex items-center justify-center ${
                          isDark ? 'border-cyan-500/30 bg-slate-900 ring-4 ring-cyan-500/10' : 'border-blue-500/30 bg-white ring-4 ring-blue-500/10'
                        }`}
                      >
                        <img
                          src="/guy-yaakobi.jpg"
                          alt={`${member.nameHe} - ${member.roleHe}`}
                          className="w-full h-full object-cover object-center transform transition-transform duration-500 hover:scale-105"
                          decoding="async"
                          loading="eager"
                          style={{ imageRendering: 'auto' }}
                        />

                        {/* Verified executive badge */}
                        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-md border-2 border-white dark:border-slate-900 z-10">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      </div>

                      {member.stats && (
                        <div className={`mt-3 text-center text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-xs ${
                          isDark ? 'bg-white/5 border-white/10 text-cyan-300' : 'bg-slate-100 border-slate-200 text-blue-700'
                        }`}>
                          {member.stats.value} {isHe ? member.stats.labelHe : member.stats.labelEn}
                        </div>
                      )}
                    </div>

                    {/* Name, Role & Executive Manifesto Quote */}
                    <div className="flex-1 text-center md:text-right">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div>
                          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight ${
                            isDark ? 'text-white' : 'text-slate-950'
                          }`}>
                            {isHe ? member.nameHe : member.nameEn}
                          </h2>
                          <h3 className={`text-sm sm:text-base font-bold mt-1 ${
                            isDark ? 'text-cyan-400' : 'text-blue-700'
                          }`}>
                            {isHe ? member.roleHe : member.roleEn}
                          </h3>
                        </div>

                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                              isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                            }`}
                            dir="ltr"
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
                            <span>{member.email}</span>
                          </a>
                        )}
                      </div>

                      {/* Command / Department Scope */}
                      {member.teamDepartmentHe && (
                        <div className={`text-xs font-sans font-medium px-3 py-1.5 rounded-xl mb-4 inline-flex items-center gap-2 border ${
                          isDark 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                            : 'bg-blue-50 border-blue-200 text-blue-900'
                        }`}>
                          <Users className="w-4 h-4 shrink-0 text-blue-500 dark:text-cyan-400" />
                          <span>{isHe ? member.teamDepartmentHe : member.teamDepartmentEn}</span>
                        </div>
                      )}

                      {/* Bio Narrative - User's Custom Quote */}
                      <div className={`p-4 sm:p-5 rounded-xl border relative mb-4 ${
                        isDark ? 'bg-white/[0.03] border-white/10 text-slate-100' : 'bg-slate-50/80 border-slate-200/80 text-slate-800'
                      }`}>
                        <p className="text-sm sm:text-base leading-relaxed font-sans font-medium italic">
                          {isHe ? member.bioHe : member.bioEn}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Capability Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(isHe ? member.badgesHe : member.badgesEn).map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className={`text-[11px] font-sans px-2.5 py-1 rounded-md border ${
                          isDark
                            ? 'bg-white/[0.04] border-white/10 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer with Direct Action */}
                <div className={`px-6 py-3 border-t flex items-center justify-between text-xs font-sans ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isHe ? 'שדרת ניהול מוסמכת' : 'Certified Leadership'}</span>
                  </div>

                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    <span>{isHe ? 'פרופיל LinkedIn' : 'LinkedIn Profile'}</span>
                    <Linkedin className="w-3 h-3 text-[#0077b5]" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* Leadership Creed & Direct Access Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
        <div className={`rounded-2xl p-6 sm:p-10 border relative overflow-hidden text-right backdrop-blur-2xl ${
          isDark
            ? 'bg-[#0a1122]/65 border-cyan-500/30 shadow-[0_12px_45px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.14)]'
            : 'bg-white/75 border-blue-200/90 shadow-[0_12px_36px_0_rgba(15,23,42,0.06),inset_0_1px_0_0_rgba(255,255,255,0.95)]'
        }`}>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold uppercase mb-2">
                <Terminal className="w-4 h-4" />
                <span>{isHe ? 'מחויבות הנדסית כוללת' : 'DIRECT ENGINEERING COMMITMENT'}</span>
              </div>

              <h3 className={`text-xl sm:text-2xl font-bold font-heading mb-2 ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {isHe
                  ? 'רוצים לדבר ישירות עם מומחה טכנולוגי בכיר?'
                  : 'Want to consult directly with our Senior Engineering Team?'}
              </h3>

              <p className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isHe
                  ? 'ללא מענה קולי אוטומטי, ללא אנשי מכירות ביניים. שיחת אבחון הנדסית מקצועית (30 דקות) לבחינת מערכי המחשוב, הענן ואבטחת המידע שלכם.'
                  : 'Zero call centers, zero sales friction. A focused 30-minute diagnostic session with our senior engineers to evaluate your IT stability and security.'}
              </p>
            </div>

            {onNavigateToContact && (
              <button
                onClick={onNavigateToContact}
                className="shrink-0 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{isHe ? 'תיאום שיחת אבחון עם ההנהלה' : 'Schedule Executive Consultation'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
