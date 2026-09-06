import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  DellLogo,
  HpeLogo,
  ArubaLogo,
  AsusLogo,
  IbmLogo,
  LenovoLogo,
  QnapLogo,
  SynologyLogo,
  AppleLogo,
  ApcSchneiderLogo,
  CrucialMicronLogo,
  ToshibaLogo,
  SamsungLogo,
  CiscoMerakiLogo
} from './brandLogos';

export interface HardwareManufacturer {
  id: string;
  name: string;
  categoryHe: string;
  categoryEn: string;
  categoryColor: string;
  url: string;
  logo: React.ReactNode;
}

export const HARDWARE_MANUFACTURERS: HardwareManufacturer[] = [
  {
    id: 'dell',
    name: 'DELL Technologies',
    categoryHe: 'שרתים, תחנות עבודה ומחשוב עסקי',
    categoryEn: 'PowerEdge Servers & Commercial Fleet',
    categoryColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    url: 'https://www.dell.com',
    logo: <DellLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
  },
  {
    id: 'hpe',
    name: 'HPE (Hewlett Packard)',
    categoryHe: 'שרתי דאטה-סנטר ו-Blade ארגוניים',
    categoryEn: 'ProLiant Enterprise Data Center Servers',
    categoryColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    url: 'https://www.hpe.com',
    logo: <HpeLogo className="w-12 h-7 sm:w-14 sm:h-8 shrink-0" />
  },
  {
    id: 'aruba',
    name: 'Aruba Networks',
    categoryHe: 'מתגי ליבה ו-Wi-Fi 6E ארגוני',
    categoryEn: 'Enterprise Switching & Cloud Wi-Fi',
    categoryColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    url: 'https://www.arubanetworks.com',
    logo: <ArubaLogo className="w-12 h-7 sm:w-14 sm:h-8 shrink-0" />
  },
  {
    id: 'asus',
    name: 'ASUS Commercial',
    categoryHe: 'תחנות עבודה, Mini-PC ולוחות אם',
    categoryEn: 'ProArt Workstations & ExpertCenter Fleet',
    categoryColor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    url: 'https://www.asus.com',
    logo: <AsusLogo className="w-12 h-6 sm:w-14 sm:h-7 shrink-0" />
  },
  {
    id: 'ibm',
    name: 'IBM Systems',
    categoryHe: 'שרתי Power ומערכי אחסון מרכזיים',
    categoryEn: 'Power Systems & Enterprise FlashSystem',
    categoryColor: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
    url: 'https://www.ibm.com',
    logo: <IbmLogo className="w-13 h-7 sm:w-15 sm:h-8 shrink-0" />
  },
  {
    id: 'lenovo',
    name: 'Lenovo ThinkPad',
    categoryHe: 'מחשוב נייד, ThinkStation ושרתים',
    categoryEn: 'ThinkPad Laptops & ThinkSystem Servers',
    categoryColor: 'text-red-500 bg-red-500/10 border-red-500/20',
    url: 'https://www.lenovo.com',
    logo: <LenovoLogo className="w-13 h-6 sm:w-15 sm:h-7 shrink-0" />
  },
  {
    id: 'qnap',
    name: 'QNAP Systems',
    categoryHe: 'מערכי אחסון NAS מהירים ו-NVMe',
    categoryEn: 'High-Performance All-Flash NAS',
    categoryColor: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
    url: 'https://www.qnap.com',
    logo: <QnapLogo className="w-12 h-6 sm:w-14 sm:h-7 shrink-0" />
  },
  {
    id: 'synology',
    name: 'Synology Enterprise',
    categoryHe: 'שרתי אחסון, SAN וגיבוי מקומי',
    categoryEn: 'RackStation Storage & Active Backup',
    categoryColor: 'text-slate-600 bg-slate-600/10 border-slate-600/20',
    url: 'https://www.synology.com',
    logo: <SynologyLogo className="w-13 h-7 sm:w-15 sm:h-8 shrink-0" />
  },
  {
    id: 'apple',
    name: 'Apple',
    categoryHe: 'MacBook, Mac Studio וסביבות macOS',
    categoryEn: 'MacBook Pro, Mac Studio & macOS Fleet',
    categoryColor: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    url: 'https://www.apple.com',
    logo: <AppleLogo className="w-8 h-9 sm:w-9 sm:h-10 shrink-0" />
  },
  {
    id: 'apc',
    name: 'APC Schneider Electric',
    categoryHe: 'אל-פסק Smart-UPS וארונות שרתים',
    categoryEn: 'Smart-UPS, Power Systems & Rack Enclosures',
    categoryColor: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20',
    url: 'https://www.apc.com',
    logo: <ApcSchneiderLogo className="w-12 h-7 sm:w-14 sm:h-8 shrink-0" />
  },
  {
    id: 'crucial',
    name: 'Crucial by Micron',
    categoryHe: 'זיכרון RAM מקצועי ודיסקים NVMe',
    categoryEn: 'Enterprise DDR5 RAM & NVMe Gen5 SSDs',
    categoryColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    url: 'https://www.crucial.com',
    logo: <CrucialMicronLogo className="w-13 h-7 sm:w-15 sm:h-8 shrink-0" />
  },
  {
    id: 'toshiba',
    name: 'TOSHIBA Enterprise',
    categoryHe: 'דיסקים קשיחים ומערכי אחסון מסיביים',
    categoryEn: 'High-Density Nearline Cloud HDD Storage',
    categoryColor: 'text-red-600 bg-red-600/10 border-red-600/20',
    url: 'https://www.toshiba.com',
    logo: <ToshibaLogo className="w-13 h-6 sm:w-15 sm:h-7 shrink-0" />
  },
  {
    id: 'samsung-mobile',
    name: 'SAMSUNG MOBILE',
    categoryHe: 'סמארטפונים Galaxy מאובטחי Knox',
    categoryEn: 'Secured Galaxy Fleet & Knox Suite',
    categoryColor: 'text-blue-700 bg-blue-700/10 border-blue-700/20',
    url: 'https://www.samsung.com',
    logo: <SamsungLogo className="w-13 h-6 sm:w-15 sm:h-7 shrink-0" />
  },
  {
    id: 'cisco-meraki',
    name: 'CISCO MERAKI',
    categoryHe: 'מתגי ענן, נתבים ו-Access Points',
    categoryEn: 'Cloud-Managed Wi-Fi, Switches & SD-WAN',
    categoryColor: 'text-lime-500 bg-lime-500/10 border-lime-500/20',
    url: 'https://meraki.cisco.com',
    logo: <CiscoMerakiLogo className="w-13 h-7 sm:w-15 sm:h-8 shrink-0" />
  }
];

export const HardwareManufacturersMarquee: React.FC = () => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  // Split into two balanced tracks
  const half = Math.ceil(HARDWARE_MANUFACTURERS.length / 2);
  const track1 = HARDWARE_MANUFACTURERS.slice(0, half);
  const track2 = HARDWARE_MANUFACTURERS.slice(half);

  // Duplicate each list for seamless infinite marquee loop
  const infiniteTrack1 = [...track1, ...track1];
  const infiniteTrack2 = [...track2, ...track2];

  return (
    <div className={`rounded-2xl border transition-all relative overflow-hidden my-6 sm:my-8 shadow-sm ${
      isDark ? 'bg-[#0a0f1d] border-white/10' : 'bg-slate-50/90 border-slate-200'
    }`}>
      {/* Header bar */}
      <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-inherit">
        <div className="text-center sm:text-right">
          <div className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            {isHe ? 'יצרנים ופתרונות חומרה' : 'OEM MANUFACTURERS & HARDWARE SUPPLY'}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isHe 
              ? 'אפיון מדויק, התאמת ציוד למידות הארגון, רכש ישיר ואחריות יצרן רשמית (לחצו למעבר לאתר היצרן)' 
              : 'Precision hardware sizing, custom enterprise supply and official manufacturer warranty (Click to visit)'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-white/5 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">{isHe ? 'אספקה ואחריות יצרן רשמית (RMA)' : 'Official OEM Warranty & RMA'}</span>
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
        <div className="animate-marquee gap-4 sm:gap-5 mb-4">
          {infiniteTrack1.map((item, idx) => (
            <a
              key={`hw-track1-${item.id}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={isHe ? `מעבר לאתר הרשמי של ${item.name}` : `Visit official ${item.name} website`}
              className={`group flex items-center gap-4 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border transition-all shrink-0 cursor-pointer select-none shadow-xs hover:scale-[1.03] ${
                isDark 
                  ? 'bg-[#070a14] border-white/10 hover:border-cyan-500/50 hover:bg-[#0e1730] hover:shadow-[0_4px_20px_rgba(6,182,212,0.15)]' 
                  : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
              }`}
            >
              {/* Logo SVG in dedicated box */}
              <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center p-2 text-slate-800 dark:text-slate-200 transition-transform group-hover:scale-105 ${
                isDark ? 'bg-slate-900/90 border border-white/10' : 'bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}>
                {item.logo}
              </div>

              {/* Company Info */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm sm:text-base font-bold tracking-tight whitespace-nowrap group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  {isHe ? item.categoryHe : item.categoryEn}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* TRACK 2: Reverse Marquee */}
        <div className="animate-marquee-reverse gap-4 sm:gap-5">
          {infiniteTrack2.map((item, idx) => (
            <a
              key={`hw-track2-${item.id}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={isHe ? `מעבר לאתר הרשמי של ${item.name}` : `Visit official ${item.name} website`}
              className={`group flex items-center gap-4 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl border transition-all shrink-0 cursor-pointer select-none shadow-xs hover:scale-[1.03] ${
                isDark 
                  ? 'bg-[#070a14] border-white/10 hover:border-cyan-500/50 hover:bg-[#0e1730] hover:shadow-[0_4px_20px_rgba(6,182,212,0.15)]' 
                  : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
              }`}
            >
              {/* Logo SVG in dedicated box */}
              <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center p-2 text-slate-800 dark:text-slate-200 transition-transform group-hover:scale-105 ${
                isDark ? 'bg-slate-900/90 border border-white/10' : 'bg-slate-50 border border-slate-200/80 shadow-xs'
              }`}>
                {item.logo}
              </div>

              {/* Company Info */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm sm:text-base font-bold tracking-tight whitespace-nowrap group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          ? '• אפיון עומסים, פריסה פיזית באתר הלקוח (Last Mile), הרכבה בארון התקשורת וניהול אחריות מקיף תחת כתובת אחת •'
          : '• Workload sizing, Last-Mile on-site delivery, server rack assembly & consolidated RMA support •'}
      </div>
    </div>
  );
};
