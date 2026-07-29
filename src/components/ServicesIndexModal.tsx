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
      brands: ['Microsoft 365', 'Azure Cloud', 'Entra ID', 'SharePoint Online', 'Veeam Cloud', 'AWS Enterprise', 'VMware Broadcom']
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
      descHe: 'ניהול IT היקפי בריטיינר קבוע, מוקד תמיכה פרואקטיבי ופרויקטי הבראת תשתיות טכנולוגיות.',
      descEn: 'Proactive retainer support, 24/7 senior Helpdesk & complete infrastructure remediation.',
      statsHe: 'מוקד פרואקטיבי | SLA מהיר | יישור קו',
      statsEn: 'Proactive Helpdesk | SLA Metrics | Remediation',
      itemsHe: [
        'מוקד תמיכה טכנית פרואקטיבי ומענה אנושי מהיר ע"י מהנדסי IT בכירים',
        'פרויקטי "יישור קו" והבראת תשתיות שנבנו טלאי על טלאי',
        'ניהול מלווה של מנהל IT ארגוני במודל ריטיינר קבוע ושקוף',
        'ניטור רציף 24/7, עדכוני אבטחה שוטפים ומניעת תקלות מראש',
        'בניית תיק אתר (Site Documentation) מפורט ושקוף לארגון',
        'התחייבות SLA לרמת שירות מהירה ומדידה לכל קריאה'
      ],
      itemsEn: [
        'Proactive Technical Helpdesk & Direct Access to Senior IT Engineers',
        'Infrastructure Alignment & Cable/Server Remediation Projects',
        'Dedicated Managed IT Director under Fixed Transparent Retainer',
        '24/7 Continuous Monitoring, Security Patching & Incident Prevention',
        'Comprehensive Site Documentation & Infrastructure Inventory',
        'Strict SLA Metrics & Guaranteed Fast Response Times'
      ],
      brands: ['24/7 SLA Support', 'Site Audit', 'Network Topology', 'Proactive Monitoring', 'Dedicated Engineer']
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
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#02040a]/95 backdrop-blur-2xl overflow-y-auto p-2 sm:p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Background Motion Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <AnimatedBackground />
      </div>

      {/* Cyber Glow Ambient Lighting Orbs */}
      <div className="fixed top-12 right-1/4 w-[650px] h-[650px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-12 left-1/4 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Modal Container */}
      <div className="relative z-10 w-full max-w-6xl bg-[#080c18]/95 border-2 border-slate-700/80 rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.98)] overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100 ring-1 ring-cyan-500/30">
        
        {/* Header Section */}
        <div className="relative p-5 sm:p-8 bg-gradient-to-b from-[#0d1428] via-[#090d1c] to-[#080c18] border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold shadow-inner">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>{isHe ? 'דירקטורי שירותים ושותפויות טכנולוגיות' : 'ENTERPRISE SERVICES & VENDOR DIRECTORY'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-heading tracking-tight leading-tight">
                {isHe ? (
                  <>
                    מפתח השירותים, התשתיות <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">והשותפויות הבינלאומיות</span>
                  </>
                ) : (
                  <>
                    Enterprise Services & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Global Tech Alliances</span>
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-3xl">
                {isHe
                  ? 'מיפוי מלא של פתרונות ה-IT, ארכיטקטורת רשתות, אבטחת מידע וסייבר, פיתוח מערכות תוכנה מורכבות, שירותי ענן וניהול IT במודל SLA מבית TECH-SELECT.'
                  : 'Complete overview of enterprise IT solutions, networking architecture, cybersecurity, complex software engineering, cloud services & SLA managed support.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all cursor-pointer hover:border-cyan-400/50 hover:scale-105 shrink-0"
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
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#080c18]/90 border border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-cyan-600/40 shadow-xl backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-90"
              title={isHe ? 'גלילה שמאלה' : 'Scroll Left'}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => handleManualScroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#080c18]/90 border border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-cyan-600/40 shadow-xl backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-90"
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
              className="flex items-center gap-2 overflow-x-auto pb-1 pt-3 px-8 border-t border-white/10 scrollbar-none text-xs font-mono scroll-smooth"
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2.5 rounded-full border transition-all cursor-pointer whitespace-nowrap font-bold shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/25 scale-105'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
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
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/15 scale-105 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{isHe ? cat.titleHe.split(',')[0] : cat.titleEn.split('&')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Vendors Banner Carousel Showcase */}
        <div className="bg-[#050812] border-b border-white/10 px-5 sm:px-8 py-3.5 shrink-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold shrink-0">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>{isHe ? 'חברות ושותפות טכנולוגית מובילות בעולם:' : 'Global Enterprise Vendor Partners:'}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full scrollbar-none py-1">
              {leadingPartners.map((partner, pIdx) => (
                <div
                  key={pIdx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-200 text-[11px] font-mono font-bold whitespace-nowrap shadow-sm hover:border-cyan-400/50 hover:bg-slate-800 transition-all"
                >
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Categories List */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <div className="grid gap-6">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const items = isHe ? cat.itemsHe : cat.itemsEn;
              return (
                <div
                  key={cat.id}
                  className="group relative bg-[#0a0f22]/90 border border-slate-700/80 hover:border-cyan-500/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 shadow-xl hover:shadow-[0_15px_45px_rgba(6,182,212,0.15)] space-y-5 overflow-hidden"
                >
                  {/* Glowing Top Corner Decoration */}
                  <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-cyan-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none group-hover:from-cyan-500/25 transition-all duration-500" />

                  {/* Category Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`p-3.5 rounded-2xl ${cat.bgColor} border ${cat.borderColor} ${cat.color} ${cat.activeGlow} shrink-0`}>
                        <Icon className="w-7 h-7" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                            {cat.badge}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                            {isHe ? cat.statsHe : cat.statsEn}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight pt-1">
                          {isHe ? cat.titleHe : cat.titleEn}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectForQuote(cat.id);
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-extrabold px-6 py-3 rounded-full shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
                    >
                      <span>{isHe ? 'בקש אפיון / הצעת מחיר' : 'Request Assessment'}</span>
                      {isHe ? <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> : <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  </div>

                  {/* Category Description */}
                  <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed relative z-10">
                    {isHe ? cat.descHe : cat.descEn}
                  </p>

                  {/* Bullet Points Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 relative z-10">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all text-xs text-slate-200 group/item"
                      >
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                        <span className="font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Supported Authorized Brand Badges */}
                  <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-white/5 relative z-10">
                    <span className="text-[11px] font-mono text-slate-400 font-bold pl-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isHe ? 'מותגים וטכנולוגיות מורשות:' : 'Authorized Vendor Brands:'}</span>
                    </span>

                    {cat.brands.map((brand, bIdx) => (
                      <span
                        key={bIdx}
                        className="bg-slate-900/90 hover:bg-cyan-950/70 text-cyan-300 border border-cyan-500/25 hover:border-cyan-400/60 px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all shadow-sm"
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
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#060913] via-[#0b1022] to-[#060913] border-t border-white/10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-right">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl hidden sm:block">
              <Headphones className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-2">
                <span>{isHe ? 'מענה הנדסי וטכני ישיר' : 'Direct Technical Engineering Desk'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  SLA & Direct
                </span>
              </span>
              <p className="text-xs text-slate-300 pt-0.5">
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
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-lg shadow-emerald-600/20"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => {
                onClose();
                onSelectForQuote();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-extrabold px-6 py-3 rounded-full transition-all cursor-pointer shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95"
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
