import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Sparkles, ShieldCheck, Eye, Sun, Moon, ChevronDown, ChevronLeft, Server, Cpu, Shield, Layers, Code2, BookOpen, Building2, Globe } from 'lucide-react';
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

  // Mega Menu columns grouped under "שירותים מנוהלים (MSP)" / "Tech & IT Solutions"
  const itSubItems: { id: PageId; name: string; desc: string; icon: React.FC<{ className?: string }> }[] = isHe
    ? [
        { 
          id: 'services', 
          name: 'שירותים מנוהלים MSP', 
          desc: 'מעטפת טכנולוגית מלאה: ניהול IT מנוהל, פרויקטים מורכבים, פיתוח תוכנה, ענן ואבטחת מידע תחת גורם אחד אחראי.', 
          icon: Server 
        },
        { 
          id: 'disaster-game', 
          name: 'מוכנות IT', 
          desc: 'בואו נכיר את העסק עם משחק קטן', 
          icon: Cpu 
        },
        { 
          id: 'managed', 
          name: 'IT מנוהל', 
          desc: 'אנחנו הופכים ל"מנהל מחלקת המחשוב" שלכם - בלי הצורך בהעסקת מנהל IT פנימי יקר!', 
          icon: Layers 
        },
        { 
          id: 'sectors', 
          name: 'מגזרים', 
          desc: 'מחברות ביטחוניות ומפעלים מסווגים - ועד הייטק, פיננסים וארגונים רגישים.', 
          icon: Building2 
        },
      ]
    : [
        { 
          id: 'services', 
          name: 'Managed Services MSP', 
          desc: 'Full technological envelope: Managed IT, complex projects, custom software development, cloud, and security under one accountable partner.', 
          icon: Server 
        },
        { 
          id: 'disaster-game', 
          name: 'IT Readiness', 
          desc: "Let's explore your business resilience with an interactive simulation game.", 
          icon: Cpu 
        },
        { 
          id: 'managed', 
          name: 'Managed IT', 
          desc: 'We become your dedicated "IT Department Head" - without the costly overhead of an in-house hire!', 
          icon: Layers 
        },
        { 
          id: 'sectors', 
          name: 'Industry Sectors', 
          desc: 'From defense contractors and classified facilities to high-tech, finance, and sensitive institutions.', 
          icon: Building2 
        },
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
    <header className="fixed top-2 sm:top-3 inset-x-0 z-[100] px-2.5 sm:px-4 md:px-6 w-full max-w-[1560px] mx-auto pointer-events-none transition-all duration-300 animate-linear-navbar">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 w-full">
        
        {/* 1. Brand Logo Anchor - Seamlessly Embedded Without Background */}
        <div className="flex items-center shrink-0 pointer-events-auto">
          <a
            href="#"
            onClick={(e) => handleNavClick('home', e)}
            className="flex items-center p-1 sm:p-1.5 transition-transform hover:scale-[1.03] active:scale-95 duration-200 cursor-pointer"
            aria-label="TECH-SELECT דף הבית"
          >
            <TechSelectLogo size="md" showSubtag={true} theme={isDark ? 'dark' : 'light'} />
          </a>
        </div>

        {/* 2. Centered Navigation Island (Desktop) */}
        <div className="hidden lg:flex items-center justify-center flex-1 pointer-events-none px-2">
          <nav 
            ref={dropdownRef}
            className={`header-glass-pill relative pointer-events-auto flex items-center gap-5 xl:gap-7 rounded-2xl px-5 xl:px-6 py-2.5 border transition-all duration-300 ${
            isScrolled
              ? isDark
                ? 'bg-[#080b12]/98 border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
                : 'bg-white/98 border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.08)]'
              : isDark
                ? 'bg-[#0a0d17]/95 border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.65)]'
                : 'bg-white/95 border-slate-200/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)]'
          }`}>

            {/* Grouped IT Solutions Dropdown Trigger */}
            <div 
              className="relative py-0.5"
              onMouseEnter={handleMouseEnterDropdown}
              onMouseLeave={handleMouseLeaveDropdown}
            >
              <button
                onClick={() => setItDropdownOpen(!itDropdownOpen)}
                className={`py-1 px-0.5 text-[15px] xl:text-[15.5px] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isITActive
                    ? isDark
                      ? 'text-cyan-400 font-bold'
                      : 'text-blue-600 font-bold'
                    : isDark
                      ? 'text-slate-300 hover:text-white font-medium'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
                aria-expanded={itDropdownOpen}
              >
                <span>{isHe ? 'שירותים מנוהלים (MSP)' : 'Tech & IT Solutions'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${itDropdownOpen ? 'rotate-180' : ''} ${
                  isITActive
                    ? isDark ? 'text-cyan-400' : 'text-blue-600'
                    : 'text-slate-400'
                }`} />
              </button>
            </div>

            {/* Other Main Links */}
            {mainNavLinks.filter(l => l.id !== 'home').map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={(e) => handleNavClick(link.id, e)}
                  onMouseEnter={() => {
                    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                    setItDropdownOpen(false);
                  }}
                  className={`py-1 px-0.5 text-[15px] xl:text-[15.5px] transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'text-cyan-400 font-bold'
                        : 'text-blue-600 font-bold'
                      : isDark
                        ? 'text-slate-300 hover:text-white font-medium'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>{link.name}</span>
                </button>
              );
            })}

            {/* Separator Line */}
            <motion.div 
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.9, ease: "easeOut" }}
              className="flex items-center self-stretch origin-center"
            >
              <div className={`w-[1px] h-4 rounded-full ${
                isDark ? 'bg-white/15' : 'bg-slate-200'
              }`} />
            </motion.div>

            {/* Language Switcher & Sun/Moon Mode Controls - Hidden initially, rises smoothly from below the bar after 3s */}
            <div className="relative flex items-center gap-1.5 px-1 overflow-hidden h-8">
              {/* Language Switcher */}
              {onLanguageChange && (
                <motion.div
                  initial={{ y: 36, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 3.0,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center"
                >
                  <button
                    onClick={() => onLanguageChange(isHe ? 'en' : 'he')}
                    className={`flex items-center gap-1.5 text-[13.5px] font-medium transition-all duration-200 cursor-pointer py-1 px-2 rounded-lg ${
                      isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                    }`}
                    title={isHe ? 'Switch site to English' : 'החלף שפה לעברית'}
                    aria-label="Language"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-[13px] tracking-wide">{isHe ? 'EN' : 'עברית'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </button>
                </motion.div>
              )}

              {/* Theme Toggle Button (Sun / Moon) */}
              <motion.div
                initial={{ y: 36, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.85,
                  delay: 3.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center"
              >
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    isDark
                      ? 'text-amber-300 hover:text-amber-200 hover:bg-white/[0.08]'
                      : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100/80'
                  }`}
                  title={isDark ? (isHe ? 'מעבר למצב יום' : 'Switch to Light Mode') : (isHe ? 'מעבר למצב לילה' : 'Switch to Dark Mode')}
                  aria-label="Toggle Theme"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>
              </motion.div>
            </div>

            {/* Mega Menu Dropdown - Spans exactly 100% width of the Nav itself */}
            <AnimatePresence>
              {itDropdownOpen && (
                <>
                  {/* Invisible Hover Bridge between Nav and Mega Menu */}
                  <div 
                    className="absolute top-full left-0 right-0 h-3 z-40 pointer-events-auto"
                    onMouseEnter={handleMouseEnterDropdown}
                    onMouseLeave={handleMouseLeaveDropdown}
                  />

                  <motion.div
                    key="mega-menu"
                    initial={{ opacity: 0, y: -7 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ 
                      duration: 0.35, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    className={`absolute top-[calc(100%+8px)] inset-x-0 w-full rounded-2xl p-3.5 sm:p-4 border shadow-2xl backdrop-blur-2xl z-50 overflow-hidden ${
                      isDark
                        ? 'bg-[#080c16]/98 border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.9)]'
                        : 'bg-white/98 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
                    }`}
                    onMouseEnter={handleMouseEnterDropdown}
                    onMouseLeave={handleMouseLeaveDropdown}
                  >
                    {/* Top ambient highlight line */}
                    <div className={`absolute top-0 inset-x-0 h-[1px] ${
                      isDark
                        ? 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-blue-500/20 to-transparent'
                    }`} />

                    {/* 4-column borderless typography layout with subtle dividers */}
                    <div className={`grid grid-cols-4 divide-x ${
                      isHe ? 'divide-x-reverse' : ''
                    } ${
                      isDark ? 'divide-white/[0.08]' : 'divide-slate-200/80'
                    }`}>
                      {itSubItems.map((col, idx) => {
                        const isSubActive = currentPage === col.id;
                        const Icon = col.icon;
                        return (
                          <button
                            key={col.id}
                            onClick={(e) => handleNavClick(col.id, e)}
                            className={`group relative flex flex-col h-full ${
                              isHe ? 'text-right' : 'text-left'
                            } px-4 xl:px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                              isSubActive
                                ? isDark
                                  ? 'bg-white/[0.04]'
                                  : 'bg-blue-50/60'
                                : isDark
                                  ? 'hover:bg-white/[0.03]'
                                  : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Column Header: Icon + Title with Hover Arrow */}
                            <div className="flex items-center justify-between gap-2 w-full mb-2">
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                                  isSubActive
                                    ? isDark ? 'text-cyan-400' : 'text-blue-600'
                                    : isDark
                                      ? 'text-slate-400 group-hover:text-cyan-400'
                                      : 'text-slate-400 group-hover:text-blue-600'
                                }`} />
                                <h4 className={`text-[14.5px] font-bold tracking-tight transition-colors ${
                                  isSubActive
                                    ? isDark ? 'text-cyan-300' : 'text-blue-700'
                                    : isDark
                                      ? 'text-white group-hover:text-cyan-300'
                                      : 'text-slate-900 group-hover:text-blue-600'
                                }`}>
                                  {col.name}
                                </h4>
                              </div>

                              {isSubActive ? (
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  isDark ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-blue-600'
                                }`} />
                              ) : (
                                <ChevronLeft className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 ${
                                  isHe ? 'group-hover:-translate-x-0.5' : 'rotate-180 group-hover:translate-x-0.5'
                                } ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                              )}
                            </div>

                            {/* Column Description - זורם, קריא, ללא מסגרות */}
                            <p className={`text-[12.5px] leading-relaxed transition-colors ${
                              isDark
                                ? 'text-slate-400 group-hover:text-slate-200'
                                : 'text-slate-500 group-hover:text-slate-800'
                            }`}>
                              {col.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </nav>
        </div>

        {/* 3. Action / Contact Anchor - Seamlessly Embedded Without Background */}
        <div className="flex items-center shrink-0 pointer-events-auto">
          <div className="flex items-center gap-3 p-1">
            
            {/* Contact Action Button */}
            <button
              onClick={(e) => handleNavClick('contact', e)}
              className={`flex items-center gap-2 px-4.5 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer active:scale-95 shadow-xs ${
                currentPage === 'contact'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                  : isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-md'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
              <span>{isHe ? 'צור קשר' : 'Contact Us'}</span>
            </button>

            {/* WhatsApp Direct Chat */}
            <a
              href={COMPANY_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 transition-transform flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 text-[#25D366] hover:text-[#20bd5a] drop-shadow-xs"
              title={isHe ? 'פנייה מהירה ב-WhatsApp' : 'Direct WhatsApp Chat'}
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="w-6.5 sm:w-7 h-6.5 sm:h-7 fill-current shrink-0" />
            </a>

            {/* Mobile Controls (Theme, Language, Hamburger) */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <div className="flex items-center gap-1 overflow-hidden h-8">
                {/* Theme Toggle Mobile */}
                <motion.div
                  initial={{ y: 28, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 3.0, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center"
                >
                  <button
                    onClick={toggleTheme}
                    className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      isDark
                        ? 'text-amber-300 hover:text-amber-200'
                        : 'text-slate-700 hover:text-amber-600'
                    }`}
                    aria-label="Toggle Theme"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </motion.div>

                {/* Language Switcher Mobile */}
                {onLanguageChange && (
                  <motion.div
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 3.15, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center"
                  >
                    <button
                      onClick={() => onLanguageChange(isHe ? 'en' : 'he')}
                      className={`px-2 py-1 text-[11px] font-bold font-sans rounded-full flex items-center gap-1 cursor-pointer transition-all ${
                        isDark
                          ? 'text-slate-200 hover:text-white bg-white/5 border border-white/10'
                          : 'text-slate-700 hover:text-slate-950 bg-slate-100 border border-slate-200'
                      }`}
                      aria-label="Language"
                    >
                      {isHe ? <UsFlagIcon className="w-3.5 h-2.5" /> : <IsraelFlagIcon className="w-3.5 h-2.5" />}
                      <span>{isHe ? 'EN' : 'עב'}</span>
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Hamburger Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isDark
                    ? 'text-slate-200 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="w-full mt-2.5 pointer-events-auto px-1 sm:px-2 lg:hidden">
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ${
            isDark
              ? 'bg-[#080b14]/98 border-white/20 text-white shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-white/10'
              : 'bg-white/98 border-slate-300 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-200'
          }`}>
            <div className="flex flex-col space-y-1">

              {/* Grouped IT Services in Mobile */}
              <div className={`p-2.5 rounded-xl border my-1 ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[11px] font-bold px-2 py-1 block ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                  {isHe ? 'שירותים מנוהלים (MSP):' : 'Tech & IT Solutions:'}
                </span>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {itSubItems.map((sub) => {
                    const isSubActive = currentPage === sub.id;
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={(e) => handleNavClick(sub.id, e)}
                        className={`p-2.5 rounded-lg flex items-center gap-2 ${isHe ? 'text-right' : 'text-left'} text-xs font-medium transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-blue-600 text-white font-bold'
                            : isDark
                              ? 'text-slate-200 hover:bg-white/10'
                              : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Nav Links in Mobile */}
              {mainNavLinks.map((link) => {
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={(e) => handleNavClick(link.id, e)}
                    className={`py-2 px-3.5 rounded-xl text-sm ${isHe ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-cyan-400 font-bold'
                        : isDark
                          ? 'text-slate-300 hover:bg-white/10 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
              
              <button
                onClick={(e) => handleNavClick('contact', e)}
                className={`py-2 px-3.5 rounded-xl text-sm ${isHe ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                  currentPage === 'contact'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-cyan-400 font-bold'
                    : isDark
                      ? 'text-slate-300 hover:bg-white/10 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                {isHe ? 'צור קשר' : 'Contact Us'}
              </button>
            </div>

            <div className={`pt-3 border-t flex flex-col gap-2.5 mt-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <a
                href={COMPANY_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3.5 py-2.5 border rounded-xl text-xs font-mono font-bold transition-all ${
                  isDark
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
                }`}
              >
                <span>{isHe ? 'פנייה ישירה ב-WhatsApp:' : 'WhatsApp Direct Support:'}</span>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <WhatsAppIcon className="w-5 h-5 fill-current shrink-0 drop-shadow-xs" />
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
        </div>
      )}
    </header>
  );
};
