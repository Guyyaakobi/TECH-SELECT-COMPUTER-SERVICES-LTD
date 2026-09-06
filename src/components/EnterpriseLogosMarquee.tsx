import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  MicrosoftLogo,
  AzureLogo,
  CiscoLogo,
  FortinetLogo,
  SentinelOneLogo,
  VeeamLogo,
  CheckPointLogo,
  PaloAltoLogo,
  AwsLogo,
  GoogleCloudLogo,
  VmwareLogo,
  SynologyLogo,
  NvidiaLogo,
  RedHatLogo,
  AcronisLogo,
  ArcserveLogo
} from './brandLogos';

export interface TechCompany {
  id: string;
  name: string;
  categoryHe: string;
  categoryEn: string;
  categoryColor: string;
  logo: React.ReactNode;
  websiteUrl: string;
}

export const ENTERPRISE_COMPANIES: TechCompany[] = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    categoryHe: 'ענן וסביבות עבודה ארגוניות',
    categoryEn: 'Cloud & Enterprise Workspace',
    categoryColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    logo: <MicrosoftLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />,
    websiteUrl: 'https://www.microsoft.com/microsoft-365'
  },
  {
    id: 'azure',
    name: 'Azure Entra ID',
    categoryHe: 'ענן, תשתיות ואבטחת זהויות',
    categoryEn: 'Cloud Infrastructure & IAM',
    categoryColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    logo: <AzureLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />,
    websiteUrl: 'https://azure.microsoft.com'
  },
  {
    id: 'cisco',
    name: 'CISCO Networking',
    categoryHe: 'מתגי ליבה, תקשורת ו-Catalyst',
    categoryEn: 'Enterprise Core Switching & Routers',
    categoryColor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    logo: <CiscoLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />,
    websiteUrl: 'https://www.cisco.com'
  },
  {
    id: 'fortinet',
    name: 'Fortinet FortiGate',
    categoryHe: 'חומות אש NGFW וסייבר היקפי',
    categoryEn: 'Next-Gen Firewall & Perimeter Cyber',
    categoryColor: 'text-red-500 bg-red-500/10 border-red-500/20',
    logo: <FortinetLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />,
    websiteUrl: 'https://www.fortinet.com'
  },
  {
    id: 'sentinelone',
    name: 'SentinelOne',
    categoryHe: 'הגנת נקודות קצה אוטונומית AI EDR',
    categoryEn: 'Autonomous AI EDR Endpoint Defense',
    categoryColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    logo: <SentinelOneLogo className="w-8 h-10 sm:w-9 sm:h-11 shrink-0" />,
    websiteUrl: 'https://www.sentinelone.com'
  },
  {
    id: 'veeam',
    name: 'Veeam Backup',
    categoryHe: 'גיבוי ארגוני, הצפנה ושחזור DRP',
    categoryEn: 'Enterprise Backup & Instant Disaster Recovery',
    categoryColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    logo: <VeeamLogo className="w-12 h-7 sm:w-14 sm:h-8 shrink-0" />,
    websiteUrl: 'https://www.veeam.com'
  },
  {
    id: 'acronis',
    name: 'Acronis Cyber Protect',
    categoryHe: 'הגנת סייבר מנוהלת וגיבוי ענן היברידי',
    categoryEn: 'Cyber Protection, Cloud Backup & Anti-Ransomware',
    categoryColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    logo: <AcronisLogo className="w-13 sm:w-15 h-auto shrink-0" />,
    websiteUrl: 'https://www.acronis.com'
  },
  {
    id: 'arcserve',
    name: 'Arcserve UDP',
    categoryHe: 'המשכיות עסקית, שחזור אסון ואחסון Immutable',
    categoryEn: 'Unified Data Protection, BCDR & Immutable Storage',
    categoryColor: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    logo: <ArcserveLogo className="w-14 sm:w-16 h-auto shrink-0" />,
    websiteUrl: 'https://www.arcserve.com'
  },
  {
    id: 'checkpoint',
    name: 'Check Point',
    categoryHe: 'אבטחת מידע, Quantum ו-Harmony',
    categoryEn: 'Cyber Security & Network Protection',
    categoryColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    logo: <CheckPointLogo className="w-11 sm:w-13 h-auto shrink-0" />,
    websiteUrl: 'https://www.checkpoint.com'
  },
  {
    id: 'paloalto',
    name: 'Palo Alto Networks',
    categoryHe: 'סייבר מתקדם ורשתות Zero Trust',
    categoryEn: 'Next-Gen Cyber & Zero Trust Architecture',
    categoryColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    logo: <PaloAltoLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />,
    websiteUrl: 'https://www.paloaltonetworks.com'
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    categoryHe: 'תשתיות ענן ציבורי ודאטה',
    categoryEn: 'Public Cloud Infrastructure & Hybrid VPC',
    categoryColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    logo: <AwsLogo className="w-12 h-8 sm:w-14 sm:h-9 shrink-0" />,
    websiteUrl: 'https://aws.amazon.com'
  },
  {
    id: 'google-workspace',
    name: 'Google Cloud & Workspace',
    categoryHe: 'ענן עסקי, סביבות עבודה ואבטחה',
    categoryEn: 'Business Cloud & Enterprise Productivity',
    categoryColor: 'text-green-500 bg-green-500/10 border-green-500/20',
    logo: <GoogleCloudLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />,
    websiteUrl: 'https://cloud.google.com'
  },
  {
    id: 'vmware',
    name: 'VMware by Broadcom',
    categoryHe: 'וירטואליזציה, ESXi ו-vSphere',
    categoryEn: 'Data Center Virtualization & vSphere',
    categoryColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    logo: <VmwareLogo className="w-13 h-7 sm:w-15 sm:h-8 shrink-0" />,
    websiteUrl: 'https://www.vmware.com'
  },
  {
    id: 'synology',
    name: 'Synology Enterprise',
    categoryHe: 'אחסון NAS, גיבוי מרכזי ושרידות',
    categoryEn: 'Centralized NAS Storage & Active Backup',
    categoryColor: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    logo: <SynologyLogo className="w-13 h-7 sm:w-15 sm:h-8 shrink-0" />,
    websiteUrl: 'https://www.synology.com'
  },
  {
    id: 'nvidia-ai',
    name: 'NVIDIA Enterprise',
    categoryHe: 'מחשוב AI, מאיצי GPU ותשתיות',
    categoryEn: 'Enterprise AI Compute & GPU Accelerated Systems',
    categoryColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    logo: <NvidiaLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />,
    websiteUrl: 'https://www.nvidia.com'
  },
  {
    id: 'redhat',
    name: 'Red Hat Enterprise',
    categoryHe: 'שרתי לינוקס ארגוניים ו-OpenShift',
    categoryEn: 'RHEL Enterprise Linux & Cloud Systems',
    categoryColor: 'text-red-600 bg-red-600/10 border-red-600/20',
    logo: <RedHatLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />,
    websiteUrl: 'https://www.redhat.com'
  }
];

export const EnterpriseLogosMarquee: React.FC = () => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  // Split into two alternating tracks for a rich, high-tech dual-speed look
  const half = Math.ceil(ENTERPRISE_COMPANIES.length / 2);
  const track1 = ENTERPRISE_COMPANIES.slice(0, half);
  const track2 = ENTERPRISE_COMPANIES.slice(half);

  // Duplicate each list for seamless infinite loop
  const infiniteTrack1 = [...track1, ...track1];
  const infiniteTrack2 = [...track2, ...track2];

  return (
    <div className={`rounded-2xl border transition-all relative overflow-hidden shadow-sm ${
      isDark ? 'bg-[#0a0f1d] border-white/10' : 'bg-slate-50/90 border-slate-200'
    }`}>
      {/* Header bar */}
      <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-inherit">
        <div className="text-center sm:text-right">
          <div className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {isHe ? 'פלטפורמות וכלי ENTERPRISE שאנו מנהלים עבורכם' : 'CORE TECHNOLOGIES & ENTERPRISE ECOSYSTEM'}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isHe 
              ? 'אינטגרציה מלאה, רישוי רשמי, הקשחה ותמיכה ישירה מול היצרנים המובילים בעולם (לחצו למעבר לאתר היצרן)' 
              : 'End-to-end integration, tier-1 licensing, security hardening and certified operations (Click to visit official vendor)'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-white/5 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">{isHe ? 'הסמכות ושותפות טכנולוגית רשמית' : 'Certified Enterprise Partners'}</span>
        </div>
      </div>

      {/* Marquee Container with edge gradients */}
      <div className="relative py-6 sm:py-7 overflow-hidden dir-ltr">
        
        {/* Left Edge Gradient Fade */}
        <div className={`absolute top-0 bottom-0 left-0 w-20 sm:w-36 z-10 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-r from-[#0a0f1d] to-transparent' 
            : 'bg-gradient-to-r from-slate-50 to-transparent'
        }`} />

        {/* Right Edge Gradient Fade */}
        <div className={`absolute top-0 bottom-0 right-0 w-20 sm:w-36 z-10 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-l from-[#0a0f1d] to-transparent' 
            : 'bg-gradient-to-l from-slate-50 to-transparent'
        }`} />

        {/* TRACK 1: Forward Marquee */}
        <div className="animate-marquee hover:[animation-play-state:paused] gap-4 sm:gap-5 mb-4 flex">
          {infiniteTrack1.map((item, idx) => (
            <a
              key={`track1-${item.id}-${idx}`}
              href={item.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${item.name} - ${isHe ? 'מעבר לאתר הרשמי של היצרן' : 'Visit official website'}`}
              className={`group flex items-center gap-4 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border transition-all shrink-0 cursor-pointer select-none shadow-xs hover:scale-[1.03] active:scale-[0.98] ${
                isDark 
                  ? 'bg-[#070a14] border-white/10 hover:border-blue-500/60 hover:bg-[#0e1730] hover:shadow-lg hover:shadow-blue-500/10' 
                  : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
              }`}
            >
              {/* Logo SVG in dedicated box */}
              <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform ${
                isDark ? 'bg-slate-900/90 border border-white/10' : 'bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}>
                {item.logo}
              </div>

              {/* Company Info */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm sm:text-base font-bold tracking-tight whitespace-nowrap group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-cyan-400 shrink-0" />
                </div>
                <span className="text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  {isHe ? item.categoryHe : item.categoryEn}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* TRACK 2: Reverse Marquee */}
        <div className="animate-marquee-reverse hover:[animation-play-state:paused] gap-4 sm:gap-5 flex">
          {infiniteTrack2.map((item, idx) => (
            <a
              key={`track2-${item.id}-${idx}`}
              href={item.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${item.name} - ${isHe ? 'מעבר לאתר הרשמי של היצרן' : 'Visit official website'}`}
              className={`group flex items-center gap-4 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border transition-all shrink-0 cursor-pointer select-none shadow-xs hover:scale-[1.03] active:scale-[0.98] ${
                isDark 
                  ? 'bg-[#070a14] border-white/10 hover:border-blue-500/60 hover:bg-[#0e1730] hover:shadow-lg hover:shadow-blue-500/10' 
                  : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
              }`}
            >
              {/* Logo SVG in dedicated box */}
              <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform ${
                isDark ? 'bg-slate-900/90 border border-white/10' : 'bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}>
                {item.logo}
              </div>

              {/* Company Info */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm sm:text-base font-bold tracking-tight whitespace-nowrap group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-cyan-400 shrink-0" />
                </div>
                <span className="text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  {isHe ? item.categoryHe : item.categoryEn}
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>

      {/* Subtle bottom ticker note */}
      <div className={`px-6 py-3 text-center text-xs sm:text-sm font-medium border-t ${
        isDark ? 'border-white/5 text-slate-400 bg-white/[0.02]' : 'border-slate-200 text-slate-600 bg-white/60'
      }`}>
        {isHe 
          ? '• אפיון, רישוי מרוכז וניהול שוטף של כל מערכות החומרה והתוכנה תחת חשבונית ואחריות הנדסית אחת •'
          : '• Consolidated licensing, enterprise supply & single point-of-contact SLA •'}
      </div>
    </div>
  );
};
