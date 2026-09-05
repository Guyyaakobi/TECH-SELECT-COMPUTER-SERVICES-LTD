import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export interface TechCompany {
  id: string;
  name: string;
  categoryHe: string;
  categoryEn: string;
  categoryColor: string;
  logo: React.ReactNode;
}

export const ENTERPRISE_COMPANIES: TechCompany[] = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    categoryHe: 'ענן וסביבות עבודה',
    categoryEn: 'Cloud & Workspace',
    categoryColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <rect x="2" y="2" width="9" height="9" fill="#F25022" rx="1" />
        <rect x="13" y="2" width="9" height="9" fill="#7FBA00" rx="1" />
        <rect x="2" y="13" width="9" height="9" fill="#00A4EF" rx="1" />
        <rect x="13" y="13" width="9" height="9" fill="#FFB900" rx="1" />
      </svg>
    )
  },
  {
    id: 'azure',
    name: 'Azure Entra ID',
    categoryHe: 'ענן ואבטחת זהויות',
    categoryEn: 'Cloud & IAM',
    categoryColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="currentColor">
        <path fill="#0089D6" d="M13.2 2.5L7.5 12.8l4.4 7.9h4.8L22 12.8 13.2 2.5z" />
        <path fill="#0072C6" d="M2 12.8l5.5-10.3h5.7L7.5 12.8H2z" opacity="0.85" />
        <path fill="#00BCF2" d="M7.5 12.8l4.4 7.9H2l5.5-7.9z" opacity="0.9" />
      </svg>
    )
  },
  {
    id: 'cisco',
    name: 'CISCO Catalyst & Meraki',
    categoryHe: 'רשתות ותשתיות',
    categoryEn: 'Enterprise Networking',
    categoryColor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    logo: (
      <svg viewBox="0 0 32 20" className="w-7 h-5 shrink-0" fill="#00BCEB">
        <rect x="2" y="9" width="2" height="7" rx="1" />
        <rect x="6" y="5" width="2" height="11" rx="1" />
        <rect x="10" y="2" width="2" height="14" rx="1" />
        <rect x="14" y="6" width="2" height="10" rx="1" />
        <rect x="18" y="6" width="2" height="10" rx="1" />
        <rect x="22" y="2" width="2" height="14" rx="1" />
        <rect x="26" y="5" width="2" height="11" rx="1" />
        <rect x="30" y="9" width="2" height="7" rx="1" />
      </svg>
    )
  },
  {
    id: 'fortinet',
    name: 'Fortinet FortiGate',
    categoryHe: 'חומות אש וסייבר',
    categoryEn: 'Next-Gen Firewall',
    categoryColor: 'text-red-500 bg-red-500/10 border-red-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <rect x="3" y="4" width="7" height="4" fill="#EE3124" rx="1" />
        <rect x="14" y="4" width="7" height="4" fill="#EE3124" rx="1" />
        <rect x="3" y="10" width="18" height="4" fill="#EE3124" rx="1" />
        <rect x="3" y="16" width="7" height="4" fill="#EE3124" rx="1" />
        <rect x="14" y="16" width="7" height="4" fill="#EE3124" rx="1" />
      </svg>
    )
  },
  {
    id: 'sentinelone',
    name: 'SentinelOne AI EDR',
    categoryHe: 'הגנת נקודות קצה AI',
    categoryEn: 'Autonomous AI EDR',
    categoryColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <circle cx="12" cy="12" r="10" fill="#7B2CBF" fillOpacity="0.15" stroke="#7B2CBF" strokeWidth="1.5" />
        <path d="M12 5L17 9.5V14.5L12 19L7 14.5V9.5L12 5Z" stroke="#9D4EDD" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 8.5L14.5 10.5V13.5L12 15.5L9.5 13.5V10.5L12 8.5Z" fill="#C77DFF" />
      </svg>
    )
  },
  {
    id: 'veeam',
    name: 'Veeam Backup',
    categoryHe: 'גיבוי ושחזור DRP',
    categoryEn: 'Enterprise Backup & DRP',
    categoryColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <path d="M3 5.5L8.5 18H11L5.5 5.5H3Z" fill="#00B336" />
        <path d="M9 5.5L14.5 18H17L11.5 5.5H9Z" fill="#00D642" />
        <path d="M15 5.5L19 14.5H21L17.5 5.5H15Z" fill="#00B336" opacity="0.8" />
      </svg>
    )
  },
  {
    id: 'checkpoint',
    name: 'Check Point',
    categoryHe: 'אבטחת מידע וסייבר',
    categoryEn: 'Cyber Security',
    categoryColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#EC1C24" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16" stroke="#EC1C24" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="#EC1C24" />
      </svg>
    )
  },
  {
    id: 'paloalto',
    name: 'Palo Alto Networks',
    categoryHe: 'סייבר ורשתות Zero Trust',
    categoryEn: 'Zero Trust Security',
    categoryColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <path d="M4 8L12 4L20 8L12 12L4 8Z" fill="#FA582D" />
        <path d="M4 16L12 12L20 16L12 20L4 16Z" fill="#D83B01" opacity="0.8" />
        <path d="M4 8V16L12 20V12L4 8Z" fill="#FA582D" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'aws',
    name: 'AWS Cloud',
    categoryHe: 'תשתיות ענן ציבורי',
    categoryEn: 'Public Cloud Infrastructure',
    categoryColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    logo: (
      <svg viewBox="0 0 28 20" className="w-7 h-5 shrink-0" fill="none">
        <text x="1" y="12" fill="#FF9900" fontSize="11" fontWeight="900" fontFamily="sans-serif">AWS</text>
        <path d="M2 16C9 19.5 19 19.5 25 15.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 13.5L25.5 15.5L23.5 18" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    categoryHe: 'ענן ופרודוקטיביות',
    categoryEn: 'Cloud & Collaboration',
    categoryColor: 'text-green-500 bg-green-500/10 border-green-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
      </svg>
    )
  },
  {
    id: 'salesforce',
    name: 'Salesforce Practice',
    categoryHe: 'CRM ומערכות ארגוניות',
    categoryEn: 'Enterprise CRM',
    categoryColor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <path d="M10 5C11.5 3.8 13.5 3.5 15.2 4.2C16.8 4.8 18 6.3 18.2 8C19.8 8.4 21 9.8 21 11.5C21 13.4 19.4 15 17.5 15H7C4.8 15 3 13.2 3 11C3 9.1 4.3 7.5 6.2 7.1C6.7 5.3 8.2 4.1 10 5Z" fill="#00A1E0" />
        <text x="6" y="12" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">salesforce</text>
      </svg>
    )
  },
  {
    id: 'vmware',
    name: 'VMware vSphere',
    categoryHe: 'וירטואליזציה ודאטה סנטר',
    categoryEn: 'Virtualization & Cloud',
    categoryColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <rect x="3" y="4" width="8" height="7" rx="1.5" fill="#0095D3" />
        <rect x="13" y="4" width="8" height="7" rx="1.5" fill="#727272" opacity="0.9" />
        <rect x="3" y="13" width="8" height="7" rx="1.5" fill="#727272" opacity="0.9" />
        <rect x="13" y="13" width="8" height="7" rx="1.5" fill="#0095D3" />
      </svg>
    )
  },
  {
    id: 'synology',
    name: 'Synology Enterprise',
    categoryHe: 'אחסון NAS ושרידות',
    categoryEn: 'Enterprise NAS & SAN',
    categoryColor: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="#475569" strokeWidth="2" />
        <circle cx="7" cy="12" r="1.5" fill="#3B82F6" />
        <circle cx="12" cy="12" r="1.5" fill="#10B981" />
        <circle cx="17" cy="12" r="1.5" fill="#6366F1" />
        <line x1="3" y1="8" x2="21" y2="8" stroke="#475569" strokeWidth="1" strokeDasharray="1 2" />
      </svg>
    )
  },
  {
    id: 'nvidia-ai',
    name: 'NVIDIA Enterprise AI',
    categoryHe: 'תשתיות AI מקומיות',
    categoryEn: 'On-Prem AI Compute',
    categoryColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
        <path d="M4 12C4 7.6 7.6 4 12 4C14.5 4 16.7 5.1 18.2 6.9C17 7.7 15.5 8.2 13.8 8.2C10.7 8.2 8.2 10.7 8.2 13.8C8.2 15.5 8.7 17 9.5 18.2C7.7 16.7 4 14.5 4 12Z" fill="#76B900" />
        <circle cx="14" cy="14" r="5" stroke="#76B900" strokeWidth="2" />
        <circle cx="14" cy="14" r="2" fill="#76B900" />
      </svg>
    )
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
    <div className={`rounded-2xl border transition-all relative overflow-hidden ${
      isDark ? 'bg-[#0a0f1d] border-white/10' : 'bg-slate-50/90 border-slate-200 shadow-xs'
    }`}>
      {/* Header bar */}
      <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-inherit">
        <div className="text-center sm:text-right">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {isHe ? 'פלטפורמות וכלי ENTERPRISE שאנו מנהלים עבורכם' : 'CORE TECHNOLOGIES & ENTERPRISE ECOSYSTEM'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isHe 
              ? 'אינטגרציה, רישוי, תמיכה והקשחה מול היצרנים המובילים בעולם' 
              : 'End-to-end integration, licensing, and engineering across premier tech leaders'}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isHe ? 'ניהול ותמיכה 24/7' : '24/7 Managed Operations'}</span>
        </div>
      </div>

      {/* Marquee Container with edge gradients */}
      <div className="relative py-4 overflow-hidden dir-ltr">
        
        {/* Left Edge Gradient Fade */}
        <div className={`absolute top-0 bottom-0 left-0 w-16 sm:w-28 z-10 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-r from-[#0a0f1d] to-transparent' 
            : 'bg-gradient-to-r from-slate-50 to-transparent'
        }`} />

        {/* Right Edge Gradient Fade */}
        <div className={`absolute top-0 bottom-0 right-0 w-16 sm:w-28 z-10 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-l from-[#0a0f1d] to-transparent' 
            : 'bg-gradient-to-l from-slate-50 to-transparent'
        }`} />

        {/* TRACK 1: Forward Marquee */}
        <div className="animate-marquee gap-3 sm:gap-4 mb-3">
          {infiniteTrack1.map((item, idx) => (
            <div
              key={`track1-${item.id}-${idx}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all shrink-0 cursor-default select-none ${
                isDark 
                  ? 'bg-[#070a14] border-white/10 hover:border-blue-500/50 hover:bg-[#0d152a]' 
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 shadow-xs'
              }`}
            >
              {/* Logo SVG */}
              <div className="shrink-0 flex items-center justify-center">
                {item.logo}
              </div>

              {/* Company Info */}
              <div className="flex flex-col text-left">
                <span className={`text-xs font-bold tracking-tight whitespace-nowrap ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {isHe ? item.categoryHe : item.categoryEn}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* TRACK 2: Reverse Marquee */}
        <div className="animate-marquee-reverse gap-3 sm:gap-4">
          {infiniteTrack2.map((item, idx) => (
            <div
              key={`track2-${item.id}-${idx}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all shrink-0 cursor-default select-none ${
                isDark 
                  ? 'bg-[#070a14] border-white/10 hover:border-blue-500/50 hover:bg-[#0d152a]' 
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 shadow-xs'
              }`}
            >
              {/* Logo SVG */}
              <div className="shrink-0 flex items-center justify-center">
                {item.logo}
              </div>

              {/* Company Info */}
              <div className="flex flex-col text-left">
                <span className={`text-xs font-bold tracking-tight whitespace-nowrap ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {isHe ? item.categoryHe : item.categoryEn}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Subtle bottom ticker note */}
      <div className={`px-5 py-2 text-center text-[10px] border-t ${
        isDark ? 'border-white/5 text-slate-400 bg-white/[0.01]' : 'border-slate-200 text-slate-600 bg-white/50'
      }`}>
        {isHe 
          ? '• התאמה, רישוי מרוכז וניהול שוטף של כל מוצרי החומרה והתוכנה תחת חשבונית ומוקד תמיכה אחד •'
          : '• Consolidated licensing, hardware supply & single SLA point of contact •'}
      </div>
    </div>
  );
};
