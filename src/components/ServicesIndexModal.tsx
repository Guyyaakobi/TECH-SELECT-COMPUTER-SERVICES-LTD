import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wifi,
  Server,
  Lock,
  Cloud,
  Layers,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Phone,
  Sparkles,
  Award,
  Headphones,
  Code,
  Globe2,
  ShieldCheck,
  Check,
  Cpu,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { COMPANY_INFO } from '../data/content';
import { AnimatedBackground } from './AnimatedBackground';

interface ServicesIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForQuote: (serviceId?: string) => void;
}

export const ServicesIndexModal: React.FC<ServicesIndexModalProps> = ({
  isOpen,
  onClose,
  onSelectForQuote,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const navBarRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(0);

  const startAutoScroll = (speed: number) => {
    scrollSpeedRef.current = speed;
    if (!scrollAnimationRef.current) {
      const step = () => {
        if (navBarRef.current && scrollSpeedRef.current !== 0) {
          navBarRef.current.scrollLeft += scrollSpeedRef.current;
          scrollAnimationRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimationRef.current = null;
        }
      };
      scrollAnimationRef.current = requestAnimationFrame(step);
    }
  };

  const stopAutoScroll = () => {
    scrollSpeedRef.current = 0;
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const handleNavBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = navBarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX;
    const zoneWidth = 110; // 110px edge zone

    const distFromLeft = mouseX - rect.left;
    const distFromRight = rect.right - mouseX;

    if (distFromLeft < zoneWidth && distFromLeft > 0) {
      // Near left edge -> scroll left
      const intensity = (zoneWidth - distFromLeft) / zoneWidth;
      const speed = -Math.max(3, Math.round(intensity * 14));
      startAutoScroll(speed);
    } else if (distFromRight < zoneWidth && distFromRight > 0) {
      // Near right edge -> scroll right
      const intensity = (zoneWidth - distFromRight) / zoneWidth;
      const speed = Math.max(3, Math.round(intensity * 14));
      startAutoScroll(speed);
    } else {
      stopAutoScroll();
    }
  };

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (navBarRef.current) {
      const amount = direction === 'left' ? -240 : 240;
      navBarRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Leading global enterprise vendor & partner logos
  const leadingPartners = [
    { name: 'Dell Technologies', tier: 'Enterprise Partner' },
    { name: 'HPE', tier: 'Gold Partner' },
    { name: 'Lenovo', tier: 'Platinum Partner' },
    { name: 'Fortinet', tier: 'Certified Security Partner' },
    { name: 'Check Point', tier: 'Gold Security' },
    { name: 'Microsoft 365 / Azure', tier: 'Cloud Solution Provider' },
    { name: 'Cisco Meraki', tier: 'Networking Partner' },
    { name: 'SentinelOne', tier: 'AI Cyber Defense' },
    { name: 'Aruba Enterprise', tier: 'Wireless Specialist' },
    { name: 'Synology', tier: 'Enterprise Storage' },
    { name: 'Palo Alto Networks', tier: 'Next-Gen Firewall' },
    { name: 'Veeam', tier: 'Cloud Backup' },
    { name: 'Acronis', tier: 'Cyber Protection & Backup' },
    { name: 'Arcserve', tier: 'Business Continuity & UDP' },
    { name: 'Ubiquiti UniFi', tier: 'Infrastructure' },
    { name: 'APC Schneider', tier: 'Critical Power & Rack' },
    { name: 'Apple Enterprise', tier: 'Authorized Business' }
  ];

  const categories = [
    {
      id: 'networking',
      titleHe: 'תשתיות תקשורת, רשתות ו-Wi-Fi',
      titleEn: 'Networking, Wi-Fi & Infrastructure',
      icon: Wifi,
      badge: 'NETWORKING & WI-FI 6E',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      activeGlow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
      descHe: 'תכנון, אספקה והטמעה מלאה של ארכיטקטורת רשת קווית ואלחוטית מאובטחת לארגונים ומתקנים רגישים.',
      descEn: 'Design, procurement & deployment of enterprise wired & wireless network infrastructure.',
      statsHe: 'מתגים | Wi-Fi 6E | VPN מאובטח',
      statsEn: 'Switches | Wi-Fi 6E | Site-to-Site VPN',
      itemsHe: [
        'אפיון ארכיטקטורת רשת קווית ואלחוטית (Site Survey & Architecture)',
        'מתגים (Switches) ניהוליים מרובי פורטים (PoE+) ונתבים ארגוניים',
        'נקודות גישה (Access Points) בטכנולוגיית Wi-Fi 6/6E לכיסוי היקפי רציף',
        'חיבורים מוצפנים בין סניפים (Site-to-Site VPN) ורשתות אורחים מבודדות',
        'תשתיות כבילה מבנית, תיוג הנדסי וסידור ארונות תקשורת ברמה הגבוהה ביותר',
        'תיעוד הנדסי מלא של מפת הרשת (Network Topology & IP Management)'
      ],
      itemsEn: [
        'Network Architecture Design & Wireless Site Surveys',
        'Enterprise Managed Switches (PoE/PoE+) & Core Routers',
        'High-Density Wi-Fi 6/6E Access Point Deployments',
        'Site-to-Site Encrypted IPsec VPNs & Isolated Guest Networks',
        'Structured Cabling, Rack Management & Engineering Labeling',
        'Full Topology Mapping & IP Asset Documentation'
      ],
      brands: ['Cisco Meraki', 'Fortinet FortiSwitch', 'Aruba Enterprise', 'Ubiquiti UniFi', 'Palo Alto', 'Juniper Networks', 'Mikrotik']
    },
    {
      id: 'software-dev',
      titleHe: 'פיתוח תוכנה ומערכות מורכבות',
      titleEn: 'Complex Software Engineering & APIs',
      icon: Code,
      badge: 'COMPLEX SOFTWARE DEV',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      activeGlow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      descHe: 'פיתוח מערכות תוכנה מורכבות, אפליקציות ייעודיות, אינטגרציות API עמוקות ואוטומציות ארגוניות.',
      descEn: 'Complex software engineering, custom enterprise applications, deep API integrations & workflow automation.',
      statsHe: 'מערכות מורכבות | Full-Stack | API | Web & Mobile',
      statsEn: 'Complex Systems | Full-Stack | API Integrations',
      itemsHe: [
        'פיתוח מערכות תוכנה מורכבות ואפליקציות בהתאמה אישית לצורכי העסק',
        'אינטגרציות API עמוקות וסנכרון נתונים בזמן אמת בין מערכות ERP, CRM ו-IT',
        'אוטומציית תהליכים עסקיים (Workflow Automation) ופיתוח כלי ניהול פנימיים',
        'ארכיטקטורת תוכנה מאובטחת לפי תקני Secure Coding מחמירים',
        'שירותי מיקור חוץ (Outsourcing) של מפתחים ומומחי תוכנה ארגוניים',
        'תחזוקת קוד, עדכוני גרסאות, תיעוד הנדסי וליווי ארוך טווח'
      ],
      itemsEn: [
        'Tailored Complex Software Systems & Enterprise Applications',
        'Deep API Integrations & Real-Time Sync between ERP, CRM & IT Platforms',
        'Business Workflow Automation & Internal Management Tools',
        'Secure Coding Standards & Audited Software Architecture',
        'Tech Outsourcing & Specialized Software Engineer Placement',
        'Long-term Code Maintenance, Version Upgrades & Documentation'
      ],
      brands: ['Full-Stack Enterprise', 'Custom Systems Architecture', 'REST & GraphQL APIs', 'Docker & Kubernetes', 'PostgreSQL & SQL', 'CI/CD Pipelines']
    },
    {
      id: 'cyber',
      titleHe: 'אבטחת מידע, סייבר וסביבות מסווגות',
      titleEn: 'Cybersecurity & Defense Isolation',
      icon: Lock,
      badge: 'CYBERSECURITY & DEFENSE',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      activeGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      descHe: 'הגנת סייבר היקפית, חומות אש דור-חדש, EDR/XDR והקשחת סביבות מבודדות (Air-Gapped).',
      descEn: 'Fortified perimeter firewalls, EDR/XDR AI endpoint protection & air-gapped isolation.',
      statsHe: 'חומות אש | SentinelOne | Air-Gap | Zero-Trust',
      statsEn: 'NGFW | SentinelOne | Air-Gap | Zero-Trust',
      itemsHe: [
        'חומות אש מתקדמות (Next-Gen Firewalls) מבית Fortinet ו-Check Point',
        'הגנת תחנות קצה EDR/XDR מבוססת AI (SentinelOne / Defender for Business)',
        'ניהול זהויות, אימות כפול (MFA) ומדיניות גישה בשיטת Zero-Trust',
        'הקשחת תשתיות ורשתות מבודדות (Air-Gapped) לגופים ביטחוניים ורגישים',
        'הגנה על תיבות דוא"ל ארגוני, מניעת פישינג וסינון זליגת מידע (DLP)',
        'הכנה לעמידה בדרישות רגולציה וביטוח סייבר (CMMC / תקני משרד הביטחון)'
      ],
      itemsEn: [
        'Next-Gen Firewalls: Fortinet FortiGate, Check Point Architecture',
        'AI Endpoint Protection EDR/XDR: SentinelOne & Microsoft Defender',
        'Identity Access Management, MFA Enforcements & Zero-Trust Policies',
        'Defense-Grade Air-Gapped Network Isolation & Infrastructure Hardening',
        'Email Security, Anti-Phishing Engine & Data Loss Prevention (DLP)',
        'Regulatory Compliance Alignment & Cyber Insurance Audit Preparation'
      ],
      brands: ['Fortinet FortiGate', 'Check Point', 'SentinelOne', 'Microsoft Defender', 'Cisco Umbrella', 'CrowdStrike', 'Palo Alto Prisma']
    },
    {
      id: 'cloud',
      titleHe: 'ענן Microsoft 365, Azure ותשתיות',
      titleEn: 'Microsoft 365 Cloud, Azure & Infrastructure',
      icon: Cloud,
      badge: 'CLOUD & INFRASTRUCTURE',
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      activeGlow: 'shadow-[0_0_25px_rgba(56,189,248,0.25)]',
      descHe: 'אפיון, מיגרציה וניהול שוטף לסביבות Microsoft 365, Azure, גיבוי ענן מוצפן ותשתיות היברידיות.',
      descEn: 'Architecture, migration & administration for M365, Azure Cloud & encrypted cloud backups.',
      statsHe: 'M365 | Azure | גיבוי מוצפן | Cloud-to-Cloud',
      statsEn: 'M365 | Azure | Encrypted Backup | Hybrid Cloud',
      itemsHe: [
        'הקמה ומיגרציה שקופה לסביבות Microsoft 365, Exchange Online & SharePoint',
        'ניהול תשתיות ענן היברידיות ב-Microsoft Azure (Active Directory / Entra ID)',
        'גיבוי מוצפן ואוטומטי לנתוני ענן ותיבות דוא"ל (Cloud-to-Cloud Backup)',
        'אופטימיזציית עלויות רישוי עסקי וצמצום כפילויות תוכנה',
        'ניהול שרתים וירטואליים בענן, גישור סביבות ענניות ומקומיות',
        'אבטחת זהויות בענן והגנה היקפית על נתונים ארגוניים'
      ],
      itemsEn: [
        'Microsoft 365, Exchange Online & SharePoint Setup & Seamless Migration',
        'Hybrid Cloud Architecture & Azure Active Directory / Entra ID Management',
        'Encrypted Cloud-to-Cloud Automated Backup Solutions',
        'Enterprise License Optimization & Cost Reduction Audits',
        'Virtual Machine Management & On-Prem to Cloud Bridging',
        'Cloud Identity Protection & Enterprise Data Guard'
      ],
      brands: ['Microsoft 365', 'Azure Cloud', 'Entra ID', 'SharePoint Online', 'Veeam Cloud', 'Acronis Cyber Protect', 'Arcserve UDP', 'AWS Enterprise', 'VMware Broadcom']
    },
    {
      id: 'managed',
      titleHe: 'שירותי IT מנוהלים ופרויקטי יישור קו',
      titleEn: 'Managed IT, SLA & Infrastructure Remediation',
      icon: Layers,
      badge: 'MANAGED IT & SLA',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      activeGlow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      descHe: 'ניהול IT היקפי בריטיינר קבוע, תמיכה הנדסית פרואקטיבית ופרויקטי הבראת תשתיות טכנולוגיות.',
      descEn: 'Proactive retainer support, senior engineering team & complete infrastructure remediation.',
      statsHe: 'ניהול פרואקטיבי | SLA מהיר | יישור קו',
      statsEn: 'Proactive IT | SLA Metrics | Remediation',
      itemsHe: [
        'תמיכה הנדסית פרואקטיבית ומענה אנושי מהיר ע"י מהנדסי IT בכירים',
        'פרויקטי "יישור קו" והבראת תשתיות שנבנו טלאי על טלאי',
        'ניהול מלווה של מנהל IT ארגוני במודל ריטיינר קבוע ושקוף',
        'ניטור רציף ופרואקטיבי, עדכוני אבטחה שוטפים ומניעת תקלות מראש',
        'בניית תיק אתר (Site Documentation) מפורט ושקוף לארגון',
        'התחייבות SLA לרמת שירות מהירה ומדידה לכל קריאה'
      ],
      itemsEn: [
        'Proactive Technical Support & Direct Access to Senior IT Engineers',
        'Infrastructure Alignment & Cable/Server Remediation Projects',
        'Dedicated Managed IT Director under Fixed Transparent Retainer',
        'Continuous Telemetry Monitoring, Security Patching & Incident Prevention',
        'Comprehensive Site Documentation & Infrastructure Inventory',
        'Strict SLA Metrics & Guaranteed Fast Response Times'
      ],
      brands: ['Enterprise SLA Support', 'Site Audit', 'Network Topology', 'Proactive Monitoring', 'Dedicated Engineer']
    },
    {
      id: 'hardware',
      titleHe: 'ציוד וחומרה (כשירות משלים)',
      titleEn: 'OEM Hardware Supply (Value-Add Service)',
      icon: Server,
      badge: 'HARDWARE AS A SERVICE',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      activeGlow: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
      descHe: 'אספקת חומרה מקורית, שרתים ותחנות עבודה הניתנת כמעטפת משלימה לשירות ה-IT והנוחות של לקוחותינו.',
      descEn: 'Original hardware supply offered as a convenient value-add component of our total IT management wrapper.',
      statsHe: 'שרתי Enterprise | Workstations | NAS/SAN',
      statsEn: 'Enterprise Servers | Workstations | NAS Storage',
      itemsHe: [
        'שרתי Enterprise מותאמים אישית: Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem',
        'מחשבים ניידים וסדרות עסקיות: Lenovo ThinkPad, Dell Latitude, HP EliteBook, Apple Mac',
        'תחנות עבודה הנדסיות (Workstations) למעצבים, מפתחים ואנשי סימולציה',
        'פתרונות אחסון מתקדמים (NAS / SAN) מבית Synology ו-Enterprise Storage',
        'מסכים מקצועיים, תחנות עגינה (Docking Stations) וציוד היקפי ארגוני',
        'התקנה מוקדמת (Pre-configuration), אימג\' ארגוני וניהול אחריות יצרן מקורית'
      ],
      itemsEn: [
        'Enterprise Servers: Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem',
        'Business Laptops & PCs: Lenovo ThinkPad, Dell Latitude, HP EliteBook, Apple',
        'High-Performance Engineering Workstations & Rendering Rigs',
        'Enterprise Storage & NAS/SAN: Synology & Dedicated Redundant Backup',
        'Professional Displays, Docking Stations & Enterprise Peripherals',
        'OS Imaging, Pre-configuration & Official OEM Warranty Services'
      ],
      brands: ['Dell Technologies', 'HPE', 'Lenovo Enterprise', 'HP Inc.', 'Apple Enterprise', 'Synology', 'QNAP', 'APC Schneider Electric']
    }
  ];

  const filteredCategories = categories.filter(
    (cat) => selectedCategory === 'all' || cat.id === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-2xl overflow-y-auto p-2 sm:p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Background Motion Effects in dark mode */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
          <AnimatedBackground />
        </div>
      )}

      {/* Main Modal Container */}
      <div className={`relative z-10 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#080c14] border-white/[0.08] text-slate-100 shadow-[0_25px_90px_rgba(0,0,0,0.98)]' 
          : 'bg-white border-slate-300/80 text-slate-900 shadow-[0_25px_90px_rgba(15,23,42,0.18)]'
      }`}>
        
        {/* Header Section */}
        <div className={`relative p-5 sm:p-8 border-b shrink-0 ${
          isDark 
            ? 'bg-[#05070c] border-white/[0.08]' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-sans font-bold border ${
                isDark 
                  ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>{isHe ? 'דירקטורי שירותים ושותפויות טכנולוגיות' : 'ENTERPRISE SERVICES & VENDOR DIRECTORY'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
              </div>

              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {isHe ? (
                  <>
                    מפתח השירותים, התשתיות <span className={isDark ? "gemini-text-gradient" : "text-blue-600"}>והשותפויות הבינלאומיות</span>
                  </>
                ) : (
                  <>
                    Enterprise Services & <span className={isDark ? "gemini-text-gradient" : "text-blue-600"}>Global Tech Alliances</span>
                  </>
                )}
              </h2>

              <p className={`text-xs sm:text-sm font-normal leading-relaxed max-w-3xl ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isHe
                  ? 'מיפוי מלא של פתרונות ה-IT, ארכיטקטורת רשתות, אבטחת מידע וסייבר, פיתוח מערכות תוכנה מורכבות, שירותי ענן וניהול IT במודל SLA מבית TECH-SELECT.'
                  : 'Complete overview of enterprise IT solutions, networking architecture, cybersecurity, complex software engineering, cloud services & SLA managed support.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-105 shrink-0 ${
                isDark 
                  ? 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-cyan-400/50' 
                  : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'
              }`}
              aria-label={isHe ? 'סגירה' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Navigation Pills Bar with Edge Auto-Scroll */}
          <div className="mt-6 relative group/nav">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => handleManualScroll('left')}
              className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border shadow-md backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-90 ${
                isDark 
                  ? 'bg-[#080c18]/90 border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-cyan-600/40' 
                  : 'bg-white/95 border-slate-200 text-blue-700 hover:text-blue-900 hover:bg-slate-100'
              }`}
              title={isHe ? 'גלילה שמאלה' : 'Scroll Left'}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => handleManualScroll('right')}
              className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border shadow-md backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-90 ${
                isDark 
                  ? 'bg-[#080c18]/90 border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-cyan-600/40' 
                  : 'bg-white/95 border-slate-200 text-blue-700 hover:text-blue-900 hover:bg-slate-100'
              }`}
              title={isHe ? 'גלילה ימינה' : 'Scroll Right'}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Scrollable Container with Mouse Hover Auto-Scroll */}
            <div
              ref={navBarRef}
              onMouseMove={handleNavBarMouseMove}
              onMouseLeave={stopAutoScroll}
              className={`flex items-center gap-2 overflow-x-auto pb-1 pt-3 px-8 border-t scrollbar-none text-xs font-sans scroll-smooth ${
                isDark ? 'border-white/[0.08]' : 'border-slate-200'
              }`}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2.5 rounded-full border transition-all cursor-pointer whitespace-nowrap font-bold shrink-0 ${
                  selectedCategory === 'all'
                    ? isDark 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-105'
                      : 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                    : isDark
                      ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {isHe ? 'כל התחומים (הכל)' : 'All Domains'}
              </button>

              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border transition-all cursor-pointer whitespace-nowrap text-xs font-semibold shrink-0 ${
                      isSelected
                        ? isDark 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-105 font-bold'
                          : 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs scale-105 font-bold'
                        : isDark
                          ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? (isDark ? 'text-white' : 'text-blue-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                    <span>{isHe ? cat.titleHe.split(',')[0] : cat.titleEn.split('&')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Vendors Banner Carousel Showcase */}
        <div className={`border-b px-5 sm:px-8 py-3.5 shrink-0 overflow-hidden ${
          isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className={`flex items-center gap-2 text-xs font-sans font-bold shrink-0 ${
              isDark ? 'text-cyan-300' : 'text-blue-700'
            }`}>
              <Globe2 className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>{isHe ? 'חברות ושותפות טכנולוגית מובילות בעולם:' : 'Global Enterprise Vendor Partners:'}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full scrollbar-none py-1">
              {leadingPartners.map((partner, pIdx) => (
                <div
                  key={pIdx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-sans font-semibold whitespace-nowrap border shadow-2xs transition-all ${
                    isDark 
                      ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 hover:border-cyan-400/50 hover:bg-white/[0.08]' 
                      : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Categories List */}
        <div className={`p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar ${
          isDark ? 'bg-[#080c14]' : 'bg-slate-50/50'
        }`}>
          <div className="grid gap-6">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const items = isHe ? cat.itemsHe : cat.itemsEn;
              return (
                <div
                  key={cat.id}
                  className={`group relative rounded-2xl p-6 sm:p-7 transition-all duration-300 shadow-md space-y-5 overflow-hidden border ${
                    isDark 
                      ? 'bg-[#090d16]/85 border-white/[0.08] hover:border-white/[0.15]' 
                      : 'bg-white border-slate-300/80 hover:border-blue-300 hover:shadow-[0_15px_35px_rgba(37,99,235,0.08)]'
                  }`}
                >
                  {/* Category Card Header */}
                  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b relative z-10 ${
                    isDark ? 'border-white/[0.08]' : 'border-slate-100'
                  }`}>
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`p-3.5 rounded-xl border ${
                        isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                      } shrink-0`}>
                        <Icon className="w-7 h-7" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            isDark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-blue-700 bg-blue-50 border-blue-200'
                          }`}>
                            {cat.badge}
                          </span>
                          <span className={`text-[11px] font-sans hidden sm:inline-block ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {isHe ? cat.statsHe : cat.statsEn}
                          </span>
                        </div>
                        <h3 className={`text-xl sm:text-2xl font-bold font-heading tracking-tight pt-1 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {isHe ? cat.titleHe : cat.titleEn}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectForQuote(cat.id);
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-3 rounded-full shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
                    >
                      <span>{isHe ? 'בקש אפיון / הצעת מחיר' : 'Request Assessment'}</span>
                      {isHe ? <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> : <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  </div>

                  {/* Category Description */}
                  <p className={`text-xs sm:text-sm font-normal leading-relaxed relative z-10 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {isHe ? cat.descHe : cat.descEn}
                  </p>

                  {/* Bullet Points Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 relative z-10">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-all text-xs group/item ${
                          isDark 
                            ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] text-slate-200' 
                            : 'bg-slate-50 border-slate-200/80 hover:border-blue-300 hover:bg-white text-slate-800'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isDark ? 'text-cyan-400' : 'text-blue-600'
                        }`} />
                        <span className="font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Supported Authorized Brand Badges */}
                  <div className={`pt-3 flex flex-wrap items-center gap-2 border-t relative z-10 ${
                    isDark ? 'border-white/[0.08]' : 'border-slate-100'
                  }`}>
                    <span className={`text-[11px] font-sans font-bold pl-2 flex items-center gap-1.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <Award className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                      <span>{isHe ? 'מותגים וטכנולוגיות מורשות:' : 'Authorized Vendor Brands:'}</span>
                    </span>

                    {cat.brands.map((brand, bIdx) => (
                      <span
                        key={bIdx}
                        className={`px-3 py-1 rounded-lg text-[11px] font-sans font-semibold transition-all shadow-2xs border ${
                          isDark 
                            ? 'bg-white/[0.04] text-cyan-300 border-white/[0.08]' 
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {brand}
                      </span>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Direct Engineering Action Bar */}
        <div className={`p-5 sm:p-6 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark 
            ? 'bg-[#05070c] border-white/[0.08]' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3.5 text-right">
            <div className={`p-3 rounded-xl hidden sm:block border ${
              isDark ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <Headphones className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className={`text-xs font-sans font-bold flex items-center gap-2 ${
                isDark ? 'text-cyan-400' : 'text-blue-700'
              }`}>
                <span>{isHe ? 'מענה הנדסי וטכני ישיר' : 'Direct Technical Engineering Desk'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  SLA & Direct
                </span>
              </span>
              <p className={`text-xs pt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isHe
                  ? 'צוות המהנדסים הבכירים של טק-סלקט זמין לאפיון תשתיות, אבטחת מידע ופיתוח תוכנה.'
                  : 'TECH-SELECT senior engineering team is available for custom infrastructure, cyber & software assessments.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={COMPANY_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => {
                onClose();
                onSelectForQuote();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-3 rounded-full transition-all cursor-pointer shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95"
            >
              <span>{isHe ? 'צור קשר לאפיון מקיף' : 'Contact Engineering'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> : <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
