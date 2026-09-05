import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sparkles, ShieldCheck, Eye, Sun, Moon, ChevronDown, Server, Cpu, Shield, Layers, Code2, BookOpen, Building2 } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { TechSelectLogo } from './TechSelectLogo';
import { useTheme } from '../context/ThemeContext';

export type PageId = 'home' | 'ai-discovery' | 'services' | 'defense' | 'leadership' | 'delivery' | 'managed' | 'sectors' | 'knowledge' | 'contact' | 'disaster-game';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenQuiz: () => void;
  onOpenAccessibility: () => void;
  onOpenTerminal?: () => void;
  lang?: 'he' | 'en';
  onLanguageChange?: (lang: 'he' | 'en') => void;
}

// WhatsApp SVG Icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.552 4.107 1.517 5.838L0 24l6.326-1.481A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.582-.489-5.088-1.341l-.365-.208-3.754.879.897-3.66-.228-.372A9.945 9.945 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
  </svg>
);

// Israel Flag SVG Icon
const IsraelFlagIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg className={`${className} rounded-[2px] shadow-sm shrink-0`} viewBox="0 0 640 480" fill="none">
    <rect width="640" height="480" fill="#ffffff" />
    <rect width="640" height="52" y="44" fill="#0038b8" />
    <rect width="640" height="52" y="384" fill="#0038b8" />
    <g transform="translate(320 240) scale(1.15)">
      <polygon points="0,-50 43.3,25 -43.3,25" fill="none" stroke="#0038b8" strokeWidth="10" />
      <polygon points="0,50 43.3,-25 -43.3,-25" fill="none" stroke="#0038b8" strokeWidth="10" />
    </g>
  </svg>
);

// USA Flag SVG Icon
const UsFlagIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg className={`${className} rounded-[2px] shadow-sm shrink-0`} viewBox="0 0 640 480" fill="none">
    <rect width="640" height="480" fill="#bd3d44"/>
    <path stroke="#ffffff" strokeWidth="37" d="M0 55.5h640M0 129h640M0 203h640M0 277h640M0 351h640M0 424.5h640"/>
    <rect width="285" height="258.5" fill="#192f5d"/>
    <g fill="#ffffff">
      <circle cx="28" cy="25" r="7"/>
      <circle cx="85" cy="25" r="7"/>
      <circle cx="142" cy="25" r="7"/>
      <circle cx="199" cy="25" r="7"/>
      <circle cx="256" cy="25" r="7"/>
      <circle cx="56.5" cy="50" r="7"/>
      <circle cx="113.5" cy="50" r="7"/>
      <circle cx="170.5" cy="50" r="7"/>
      <circle cx="227.5" cy="50" r="7"/>
      <circle cx="28" cy="75" r="7"/>
      <circle cx="85" cy="75" r="7"/>
      <circle cx="142" cy="75" r="7"/>
      <circle cx="199" cy="75" r="7"/>
      <circle cx="256" cy="75" r="7"/>
      <circle cx="56.5" cy="100" r="7"/>
      <circle cx="113.5" cy="100" r="7"/>
      <circle cx="170.5" cy="100" r="7"/>
      <circle cx="227.5" cy="100" r="7"/>
      <circle cx="28" cy="125" r="7"/>
      <circle cx="85" cy="125" r="7"/>
      <circle cx="142" cy="125" r="7"/>
      <circle cx="199" cy="125" r="7"/>
      <circle cx="256" cy="125" r="7"/>
      <circle cx="56.5" cy="150" r="7"/>
      <circle cx="113.5" cy="150" r="7"/>
      <circle cx="170.5" cy="150" r="7"/>
      <circle cx="227.5" cy="150" r="7"/>
      <circle cx="28" cy="175" r="7"/>
      <circle cx="85" cy="175" r="7"/>
      <circle cx="142" cy="175" r="7"/>
      <circle cx="199" cy="175" r="7"/>
      <circle cx="256" cy="175" r="7"/>
      <circle cx="56.5" cy="200" r="7"/>
      <circle cx="113.5" cy="200" r="7"/>
      <circle cx="170.5" cy="200" r="7"/>
      <circle cx="227.5" cy="200" r="7"/>
      <circle cx="28" cy="225" r="7"/>
      <circle cx="85" cy="225" r="7"/>
      <circle cx="142" cy="225" r="7"/>
      <circle cx="199" cy="225" r="7"/>
      <circle cx="256" cy="225" r="7"/>
    </g>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenQuiz,
  onOpenAccessibility,
  onOpenTerminal,
  lang = 'he',
  onLanguageChange,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [itDropdownOpen, setItDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDark, toggleTheme } = useTheme();

  const handleMouseEnterDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setItDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // 320ms graceful delay to easily move mouse into dropdown without it disappearing
    closeTimeoutRef.current = setTimeout(() => {
      setItDropdownOpen(false);
    }, 320);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setItDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHe = lang === 'he';

  // Sub-items grouped under "שירותי IT"
  const itSubItems: { id: PageId; name: string; desc: string; icon: React.FC<{ className?: string }> }[] = isHe
    ? [
        { id: 'services', name: 'שירותי IT', desc: 'פתרונות ענן, תשתיות ותקשורת', icon: Server },
        { id: 'disaster-game', name: 'מוכנות IT', desc: 'סימולטור השבתה וחוסן ארגוני', icon: Cpu },
        { id: 'managed', name: 'IT מנוהל', desc: 'ניהול IT מקיף, תמיכה ו-vCIO', icon: Layers },
        { id: 'sectors', name: 'מגזרים', desc: 'התאמה לענפי תעשייה ועסקים', icon: Building2 },
      ]
    : [
        { id: 'services', name: 'IT Services', desc: 'Cloud, Infrastructure & Networks', icon: Server },
        { id: 'disaster-game', name: 'IT Readiness', desc: 'Disaster Simulator & Resilience', icon: Cpu },
        { id: 'managed', name: 'Managed IT', desc: 'Full IT Operations & vCIO', icon: Layers },
        { id: 'sectors', name: 'Sectors', desc: 'Industry-Specific Solutions', icon: Building2 },
      ];

  const isITActive = ['services', 'disaster-game', 'managed', 'sectors'].includes(currentPage);

  const mainNavLinks: { id: PageId; name: string; isNew?: boolean }[] = isHe
    ? [
        { id: 'home', name: 'ראשי' },
        { id: 'ai-discovery', name: 'פיתוח תוכנה ו-AI' },
        { id: 'defense', name: 'ביטחון וסייבר' },
        { id: 'delivery', name: 'אודות' },
        { id: 'knowledge', name: 'מרכז ידע' },
      ]
    : [
        { id: 'home', name: 'Home' },
        { id: 'ai-discovery', name: 'Custom Software & AI' },
        { id: 'defense', name: 'Defense & Cyber' },
        { id: 'delivery', name: 'About' },
        { id: 'knowledge', name: 'Knowledge' },
      ];

  const handleNavClick = (pageId: PageId, e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(pageId);
    setMobileMenuOpen(false);
    setItDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-2 sm:top-3 inset-x-0 z-[100] px-2 sm:px-4 md:px-6 w-full max-w-[1560px] mx-auto pointer-events-none transition-all duration-300 animate-linear-navbar">
      <div
        className={`header-glass-pill pointer-events-auto transition-all duration-300 rounded-2xl xl:rounded-full px-4 sm:px-6 xl:px-7 py-2.5 sm:py-3.5 border ${
          isScrolled
            ? isDark
              ? 'bg-[#080b12]/98 border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl ring-1 ring-cyan-500/20'
              : 'bg-white/98 border-slate-300 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl ring-1 ring-slate-300'
            : isDark
              ? 'bg-[#0a0d17]/95 border-white/20 shadow-[0_14px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl ring-1 ring-white/10'
              : 'bg-white/95 border-slate-200 shadow-[0_10px_25px_rgba(15,23,42,0.08)] backdrop-blur-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-5 xl:gap-6">
          
          {/* Brand Logo (Enlarged & Crisp) */}
          <a
            href="#"
            onClick={(e) => handleNavClick('home', e)}
            className="flex items-center shrink-0 pr-1 transition-transform hover:scale-[1.03] duration-200"
            aria-label="TECH-SELECT דף הבית"
          >
            <TechSelectLogo size="md" showSubtag={true} theme={isDark ? 'dark' : 'light'} />
          </a>

          {/* Navigation Links (Spacious, Clear & Perfectly Proportioned - Clean Mature Design) */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 shrink min-w-0">

            {/* Grouped IT Solutions Dropdown */}
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnterDropdown}
              onMouseLeave={handleMouseLeaveDropdown}
            >
              <button
                onClick={() => setItDropdownOpen(!itDropdownOpen)}
                className={`px-3.5 xl:px-4 py-2 rounded-full text-[13.5px] xl:text-[15px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isITActive
                    ? isDark
                      ? 'bg-blue-600/35 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                      : 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-sm'
                    : isDark
                      ? 'text-slate-200 hover:text-white hover:bg-white/[0.08]'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                }`}
                aria-expanded={itDropdownOpen}
              >
                <span>{isHe ? 'שירותי IT' : 'IT Services'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${itDropdownOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
              </button>

              {/* Invisible Hover Bridge between button and dropdown */}
              <div 
                className="absolute top-full left-0 right-0 h-4 pointer-events-auto"
                onMouseEnter={handleMouseEnterDropdown}
              />

              {/* Dropdown Menu */}
              {itDropdownOpen && (
                <div 
                  className={`absolute top-[calc(100%+6px)] right-0 w-72 rounded-2xl p-2.5 border shadow-2xl backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95 slide-in-from-top-2 z-50 ${
                    isDark
                      ? 'bg-[#080b14]/98 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] ring-1 ring-white/10'
                      : 'bg-white/98 border-slate-300 shadow-[0_20px_45px_rgba(15,23,42,0.14)] ring-1 ring-slate-200'
                  }`}
                  onMouseEnter={handleMouseEnterDropdown}
                  onMouseLeave={handleMouseLeaveDropdown}
                >
                  <div className="space-y-1">
                    {itSubItems.map((sub) => {
                      const isSubActive = currentPage === sub.id;
                      const Icon = sub.icon;
                      return (
                        <button
                          key={sub.id}
                          onClick={(e) => handleNavClick(sub.id, e)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl ${isHe ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                            isSubActive
                              ? isDark
                                ? 'bg-blue-600/25 text-cyan-300 font-bold border border-cyan-500/30'
                                : 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                              : isDark
                                ? 'text-slate-200 hover:bg-white/10 hover:text-white'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isSubActive
                              ? 'bg-blue-600 text-white'
                              : isDark
                                ? 'bg-white/5 text-cyan-400 border border-white/10'
                                : 'bg-slate-100 text-blue-600 border border-slate-200'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{sub.name}</span>
                            <span className={`text-[11px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {sub.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Other Main Links */}
            {mainNavLinks.filter(l => l.id !== 'home').map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={(e) => handleNavClick(link.id, e)}
                  className={`px-3.5 xl:px-4 py-2 rounded-full text-[13.5px] xl:text-[15px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? isDark
                        ? 'bg-white/[0.14] text-white font-bold border border-white/25 shadow-sm'
                        : 'bg-slate-900 text-white font-bold shadow-sm'
                      : isDark
                        ? 'text-slate-200 hover:text-white hover:bg-white/[0.08]'
                        : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <span>{link.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Graded / Faded Soft Separator Line */}
          <div className="hidden lg:flex items-center self-stretch px-1">
            <div className={`w-[1px] h-6 rounded-full ${
              isDark 
                ? 'bg-white/15' 
                : 'bg-slate-300'
            }`} />
          </div>

          {/* Dedicated Action Utilities Group (Spacious & Clean) */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-amber-300 hover:text-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 hover:text-blue-700'
              }`}
              title={isDark ? (isHe ? 'מעבר למצב יום / בהיר (Light Mode)' : 'Switch to Light Mode') : (isHe ? 'מעבר למצב לילה / כהה (Dark Mode)' : 'Switch to Dark Mode')}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(isHe ? 'en' : 'he')}
                className={`flex items-center gap-1.5 px-3 xl:px-3.5 py-2 rounded-full text-xs xl:text-[13px] font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
                }`}
                title={isHe ? 'Switch site to English' : 'החלף שפה לעברית'}
                aria-label="Language"
              >
                {isHe ? (
                  <>
                    <UsFlagIcon className="w-4 h-3" />
                    <span className="font-sans">EN</span>
                  </>
                ) : (
                  <>
                    <IsraelFlagIcon className="w-4 h-3" />
                    <span className="font-sans">עברית</span>
                  </>
                )}
              </button>
            )}

            {/* Unified Contact & WhatsApp Action Pill */}
            <div className={`flex items-center rounded-full p-1 transition-all shadow-md active:scale-98 ${
              currentPage === 'contact'
                ? 'bg-blue-600 ring-2 ring-blue-400/50'
                : isDark
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25 ring-1 ring-blue-400/30'
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
            }`}>
              <button
                onClick={(e) => handleNavClick('contact', e)}
                className="flex items-center gap-1.5 text-white font-semibold px-4 py-2 text-xs xl:text-[13.5px] whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-200 shrink-0" />
                <span>{isHe ? 'צור קשר' : 'Contact Us'}</span>
              </button>

              <div className="w-[1px] h-4 bg-white/20" />

              <a
                href={COMPANY_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-2 px-2.5 rounded-full text-emerald-300 hover:text-white hover:bg-white/15 transition-all"
                title={isHe ? 'פנייה מהירה ב-WhatsApp' : 'Direct WhatsApp Chat'}
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
              </a>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 lg:hidden shrink-0">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center ${
                isDark
                  ? 'bg-white/10 text-amber-300 border border-white/20'
                  : 'bg-slate-100 text-slate-800 border border-slate-300'
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Toggle Mobile */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(isHe ? 'en' : 'he')}
                className={`px-2 py-1.5 text-xs font-bold font-sans rounded-full border flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                  isDark
                    ? 'text-slate-100 bg-white/10 border-white/20'
                    : 'text-slate-800 bg-slate-100 border-slate-300'
                }`}
                aria-label="Switch Language"
              >
                {isHe ? <UsFlagIcon className="w-4 h-3" /> : <IsraelFlagIcon className="w-4 h-3" />}
                <span className="text-[11px] font-sans">{isHe ? 'EN' : 'עב'}</span>
              </button>
            )}

            {/* WhatsApp Mobile */}
            <a
              href={COMPANY_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full transition-all flex items-center justify-center"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isDark
                  ? 'text-slate-200 hover:text-white bg-white/10'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100'
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className={`lg:hidden pt-4 pb-3 border-t mt-3 space-y-3 ${isHe ? 'text-right' : 'text-left'} animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <div className="flex flex-col space-y-1">

              {/* Grouped IT Services in Mobile */}
              <div className={`p-2 rounded-xl border my-1 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[11px] font-bold px-2 py-1 block ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                  {isHe ? 'שירותי ופתרונות IT:' : 'IT Solutions:'}
                </span>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {itSubItems.map((sub) => {
                    const isSubActive = currentPage === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={(e) => handleNavClick(sub.id, e)}
                        className={`p-2 rounded-lg ${isHe ? 'text-right' : 'text-left'} text-xs transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-blue-600 text-white font-bold'
                            : isDark
                              ? 'text-slate-200 hover:bg-white/10'
                              : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remaining Mobile Links */}
              {mainNavLinks.filter(l => l.id !== 'home').map((link) => {
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={(e) => handleNavClick(link.id, e)}
                    className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm ${isHe ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/30 text-cyan-300 font-bold border border-cyan-500/30'
                        : isDark
                          ? 'text-slate-200 hover:bg-white/10 font-medium'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
              
              <button
                onClick={(e) => handleNavClick('contact', e)}
                className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm ${isHe ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                  currentPage === 'contact'
                    ? 'bg-blue-600/30 text-cyan-300 font-bold border border-cyan-500/30'
                    : isDark
                      ? 'text-slate-200 hover:bg-white/10 font-medium'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                {isHe ? 'צור קשר' : 'Contact Us'}
              </button>
            </div>

            <div className={`pt-3 border-t flex flex-col gap-2.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <a
                href={COMPANY_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2 border rounded-xl text-xs font-mono font-bold transition-all ${
                  isDark
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
                }`}
              >
                <span>{isHe ? 'פנייה ישירה ב-WhatsApp:' : 'WhatsApp Direct Support:'}</span>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>{isHe ? 'לחץ להתכתבות' : 'Click to chat'}</span>
                </div>
              </a>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenQuiz();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full font-medium text-xs border ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isHe ? 'שאלון IT' : 'IT Quiz'}</span>
                </button>

                <button
                  onClick={(e) => handleNavClick('contact', e)}
                  className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-full font-medium text-xs shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{isHe ? 'צור קשר' : 'Contact Us'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onOpenAccessibility();
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <Eye className="w-4 h-4 text-cyan-500" />
                <span>{isHe ? 'סרגל נגישות ותצוגה' : 'Accessibility Toolbar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
