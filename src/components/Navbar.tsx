import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Sparkles, ShieldCheck, Eye, Globe } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { TechSelectLogo } from './TechSelectLogo';

export type PageId = 'home' | 'services' | 'defense' | 'delivery' | 'managed' | 'sectors' | 'knowledge' | 'contact' | 'disaster-game';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenQuiz: () => void;
  onOpenAccessibility: () => void;
  onOpenTerminal?: () => void;
  lang?: 'he' | 'en';
  onLanguageChange?: (lang: 'he' | 'en') => void;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.552 4.107 1.517 5.838L0 24l6.326-1.481A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.582-.489-5.088-1.341l-.365-.208-3.754.879.897-3.66-.228-.372A9.945 9.945 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenQuiz,
  onOpenAccessibility,
  lang = 'he',
  onLanguageChange,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHe = lang === 'he';

  const navLinks: { id: PageId; name: string }[] = isHe
    ? [
        { id: 'home', name: 'ראשי' },
        { id: 'services', name: 'שירותי IT' },
        { id: 'defense', name: 'ביטחון וסייבר' },
        { id: 'disaster-game', name: 'מוכנות IT' },
        { id: 'delivery', name: 'מודל Delivery' },
        { id: 'managed', name: 'IT מנוהל' },
        { id: 'sectors', name: 'מגזרים' },
        { id: 'knowledge', name: 'מרכז ידע' },
        { id: 'contact', name: 'צור קשר' },
      ]
    : [
        { id: 'home', name: 'Home' },
        { id: 'services', name: 'IT & Cloud' },
        { id: 'defense', name: 'Defense' },
        { id: 'disaster-game', name: 'IT Readiness' },
        { id: 'delivery', name: 'Delivery' },
        { id: 'managed', name: 'Managed IT' },
        { id: 'sectors', name: 'Industries' },
        { id: 'knowledge', name: 'Knowledge' },
        { id: 'contact', name: 'Contact' },
      ];

  const handleNavClick = (pageId: PageId, e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-2 sm:top-4 inset-x-0 z-[100] px-2 sm:px-4 md:px-6 w-full max-w-[1440px] mx-auto pointer-events-none transition-all duration-300">
      <div
        className={`header-glass-pill pointer-events-auto transition-all duration-300 rounded-2xl xl:rounded-full px-3 sm:px-4 xl:px-5 py-2.5 border ${
          isScrolled
            ? 'bg-[#090c14]/95 border-white/25 shadow-[0_25px_50px_rgba(0,0,0,0.95)] backdrop-blur-xl ring-1 ring-white/10'
            : 'bg-[#0b0e17]/90 border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.75)] backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 xl:gap-3.5">
          
          {/* Brand Logo */}
          <a
            href="#"
            onClick={(e) => handleNavClick('home', e)}
            className="flex items-center shrink-0 pr-1"
            aria-label="TECH-SELECT דף הבית"
          >
            <TechSelectLogo size="sm" showSubtag={true} theme="dark" />
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink min-w-0">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={(e) => handleNavClick(link.id, e)}
                  className={`px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-cyan-600/90 text-white font-bold shadow-md shadow-blue-500/20 border border-cyan-400/30'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </nav>

          {/* Left Actions (WhatsApp, Language & CTA) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
            
            {/* WhatsApp Badge */}
            <a
              href={COMPANY_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-full px-3 py-1.5 text-[11px] xl:text-xs font-bold transition-all cursor-pointer shadow-sm"
              title={isHe ? 'פנייה מהירה ב-WhatsApp' : 'WhatsApp Contact'}
            >
              <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
              <span>{isHe ? 'פנייה ב-WhatsApp' : 'WhatsApp Us'}</span>
            </a>

            {/* Language Switcher Button with Globe Icon */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(isHe ? 'en' : 'he')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-[11px] xl:text-xs font-bold transition-all cursor-pointer hover:border-cyan-400/50 hover:text-cyan-300 shrink-0"
                title={isHe ? 'Switch site to English' : 'החלף שפה לעברית'}
                aria-label="בחר שפה / Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-mono uppercase">{isHe ? 'EN' : 'HE'}</span>
              </button>
            )}

            {/* Main CTA */}
            <button
              onClick={(e) => handleNavClick('contact', e)}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-medium px-3.5 xl:px-4 py-1.5 rounded-full text-[11px] xl:text-xs transition-all shadow-md shadow-indigo-500/25 active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
              <span>{isHe ? 'תיאום אפיון' : 'Get Quote'}</span>
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 lg:hidden shrink-0">
            {/* Language Toggle Mobile */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(isHe ? 'en' : 'he')}
                className="p-1.5 text-xs font-bold font-mono text-cyan-300 bg-white/10 hover:bg-white/15 rounded-full border border-white/15 flex items-center gap-1"
                aria-label="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[10px] uppercase">{isHe ? 'EN' : 'HE'}</span>
              </button>
            )}

            {/* WhatsApp */}
            <a
              href={COMPANY_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full transition-all border border-emerald-500/30"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
            </a>

            {/* WhatsApp Mobile Quick Button */}
            <a
              href={COMPANY_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full transition-all flex items-center justify-center"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-full transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-3 border-t border-white/10 mt-3 space-y-3 text-right animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={(e) => handleNavClick(link.id, e)}
                    className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm text-right transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/30 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-200 hover:bg-white/10 font-medium'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <a
                href={COMPANY_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 font-bold transition-all"
              >
                <span>{isHe ? 'פנייה ישירה ב-WhatsApp:' : 'WhatsApp Direct Support:'}</span>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>050-3900903</span>
                </div>
              </a>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenQuiz();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-slate-200 py-2.5 rounded-full font-medium text-xs border border-white/10"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isHe ? 'שאלון IT' : 'IT Quiz'}</span>
                </button>

                <button
                  onClick={(e) => handleNavClick('contact', e)}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2.5 rounded-full font-medium text-xs shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{isHe ? 'תיאום אפיון' : 'Get Quote'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onOpenAccessibility();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>{isHe ? 'סרגל נגישות ותצוגה' : 'Accessibility Toolbar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
