import React, { useState, useEffect } from 'react';
import { Navbar, PageId } from './components/Navbar';
import { Hero } from './components/Hero';
import { DefensePage } from './components/DefensePage';
import { DeliveryHubsSection } from './components/DeliveryHubsSection';
import { ServicesSection } from './components/ServicesSection';
import { ManagedITSection } from './components/ManagedITSection';
import { SectorsSection } from './components/SectorsSection';
import { KnowledgeCenterSection } from './components/KnowledgeCenterSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { TechQuizModal } from './components/TechQuizModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { LegalModals } from './components/LegalModals';
import { CommandTerminalModal } from './components/CommandTerminalModal';
import { CookieBanner } from './components/CookieBanner';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ServicesIndexModal } from './components/ServicesIndexModal';
import { DisasterGamePage } from './components/DisasterGamePage';
import { LeadershipPage } from './components/LeadershipPage';
import { SecureAIDevPage } from './components/SecureAIDevPage';
import { StrategicDifferentiatorsBanner } from './components/StrategicDifferentiatorsBanner';
import { GeminiDebuggerModal } from './components/GeminiDebuggerModal';
import { FloatingAIConcierge } from './components/FloatingAIConcierge';
import { ArrowLeft, ArrowRight, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainApp() {
  const { lang, isHe, setLang } = useLanguage();
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isServicesIndexOpen, setIsServicesIndexOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'accessibility' | null>(null);
  
  // Gemini AI Debugger Easter Egg (8 clicks on bottom bar or PIN: 1981)
  const [isGeminiDebuggerOpen, setIsGeminiDebuggerOpen] = useState(false);
  const [debugClickCount, setDebugClickCount] = useState(0);
  const debugClickTimerRef = React.useRef<any>(null);

  const handleDebugBottomBarClick = () => {
    setDebugClickCount((prev) => {
      const next = prev + 1;
      if (next >= 8) {
        setIsGeminiDebuggerOpen(true);
        return 0;
      }
      return next;
    });

    if (debugClickTimerRef.current) {
      clearTimeout(debugClickTimerRef.current);
    }
    debugClickTimerRef.current = setTimeout(() => {
      setDebugClickCount(0);
    }, 5000); // 5 seconds window
  };

  useEffect(() => {
    document.documentElement.dir = isHe ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // Set concise, attractive Chrome tab title
    let titlePrefix = 'TECH-SELECT | שותף טכנולוגי וניהול IT';
    if (!isHe) {
      titlePrefix = 'TECH-SELECT | Enterprise IT & Technology';
    }

    if (currentPage === 'defense') {
      titlePrefix = isHe ? 'TECH-SELECT | פתרונות לסביבות ביטחוניות (ספק משהב״ט)' : 'TECH-SELECT | Defense & High-Security IT';
    } else if (currentPage === 'ai-discovery') {
      titlePrefix = isHe ? 'TECH-SELECT | פיתוח מאובטח AI וסדנת אפיון ארגונית' : 'TECH-SELECT | Enterprise Secure AI Engineering';
    } else if (currentPage === 'disaster-game') {
      titlePrefix = isHe ? 'TECH-SELECT | סימולטור רציפות עסקית ו-DRP' : 'TECH-SELECT | Business Continuity Simulator';
    } else if (currentPage === 'leadership') {
      titlePrefix = isHe ? 'TECH-SELECT | שדרת הניהול וההנדסה' : 'TECH-SELECT | Leadership & Engineering Team';
    } else if (currentPage === 'delivery') {
      titlePrefix = isHe ? 'TECH-SELECT | אודות - מי אנחנו ומודל המצוינות' : 'TECH-SELECT | About Us & Excellence Delivery';
    }

    document.title = titlePrefix;
  }, [lang, isHe, currentPage]);

  // Handle Hash change / Direct deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'ai-discovery' || hash === 'ai' || hash === 'secure-ai' || hash === 'ai-dev') {
        setCurrentPage('ai-discovery');
        setPageTransitionKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'disaster-game' || hash === 'disaster') {
        setCurrentPage('disaster-game');
        setPageTransitionKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'defense') {
        setCurrentPage('defense');
        setPageTransitionKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'leadership' || hash === 'management' || hash === 'team') {
        setCurrentPage('leadership');
        setPageTransitionKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'about' || hash === 'about-us' || hash === 'delivery') {
        setCurrentPage('delivery');
        setPageTransitionKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'contact') {
        setCurrentPage('contact');
        setPageTransitionKey((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'gemini-debug' || hash === 'debug-ai' || hash === 'gemini') {
        setIsGeminiDebuggerOpen(true);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [pageTransitionKey, setPageTransitionKey] = useState<number>(0);

  const navigateToPage = (page: PageId) => {
    setCurrentPage(page);
    setPageTransitionKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectServiceForQuote = (_serviceId: string) => {
    navigateToPage('contact');
  };

  const pagesOrder: { id: PageId; title: string; titleEn: string }[] = [
    { id: 'home', title: 'דף הבית', titleEn: 'Home' },
    { id: 'services', title: 'שירותי IT וענן', titleEn: 'IT & Cloud Services' },
    { id: 'defense', title: 'חברות ביטחוניות', titleEn: 'Defense Sector' },
    { id: 'disaster-game', title: 'מוכנות IT', titleEn: 'IT Readiness' },
    { id: 'delivery', title: 'אודות (מי אנחנו)', titleEn: 'About Us' },
    { id: 'managed', title: 'מנהל IT מנוהל', titleEn: 'Managed IT' },
    { id: 'ai-discovery', title: 'פיתוח מאובטח AI', titleEn: 'Secure AI Dev' },
    { id: 'sectors', title: 'מגזרי תעשייה', titleEn: 'Industries' },
    { id: 'knowledge', title: 'מרכז ידע', titleEn: 'Knowledge Base' },
    { id: 'contact', title: 'צור קשר', titleEn: 'Contact Us' },
  ];

  const currentPageIndex = pagesOrder.findIndex((p) => p.id === currentPage);
  const nextPage = pagesOrder[(currentPageIndex + 1) % pagesOrder.length];

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-[#05070c] text-slate-100' : 'bg-[#f3f5f8] text-slate-900'
    }`}>
      {/* Living Dynamic Background Canvas */}
      <AnimatedBackground />

      {/* Global Tech Grid Overlay across the entire page */}
      <div className="fixed inset-0 pointer-events-none bg-tech-grid z-0" />

      {/* Main Top Floating Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateToPage}
        onOpenQuiz={() => navigateToPage('disaster-game')}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        lang={lang}
        onLanguageChange={setLang}
      />

      {/* Main Page Content - Starts from the very top (y=0) behind the navbar */}
      <main className="flex-1 w-full relative z-10">
        {/* Breadcrumb / Page Header indicator for inner pages */}
        {currentPage !== 'home' && (
          <div className="pt-24 sm:pt-28 max-w-6xl mx-auto px-4 sm:px-6 pb-4 flex items-center justify-between text-xs font-sans text-slate-600 dark:text-slate-400">
            <button
              onClick={() => navigateToPage('home')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-700 hover:text-blue-800 font-semibold'
              }`}
            >
              {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isHe ? 'חזרה לדף הבית' : 'Back to Home'}</span>
            </button>

            <span className={`px-3 py-1 rounded-full font-semibold border ${
              isDark ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
              {isHe
                ? pagesOrder.find((p) => p.id === currentPage)?.title
                : pagesOrder.find((p) => p.id === currentPage)?.titleEn}
            </span>
          </div>
        )}

        <div key={`${currentPage}-${pageTransitionKey}`}>
          {currentPage === 'home' && (
            <>
              <Hero
                onOpenQuiz={() => setIsQuizOpen(true)}
                onOpenTerminal={() => setIsTerminalOpen(true)}
                onNavigateToDefense={() => navigateToPage('defense')}
                onOpenServicesIndex={() => setIsServicesIndexOpen(true)}
                onNavigateToAIDiscovery={() => navigateToPage('ai-discovery')}
              />
              <StrategicDifferentiatorsBanner />
            </>
          )}

          {currentPage === 'ai-discovery' && (
            <SecureAIDevPage
              onBackToHome={() => navigateToPage('home')}
              onNavigateToContact={() => navigateToPage('contact')}
            />
          )}

          {currentPage === 'services' && (
            <>
              <ServicesSection onSelectForQuote={handleSelectServiceForQuote} />
              <StrategicDifferentiatorsBanner showHardwareMarquee={false} />
            </>
          )}

          {currentPage === 'defense' && (
            <DefensePage onBackToHome={() => navigateToPage('home')} />
          )}

          {currentPage === 'leadership' && (
            <LeadershipPage
              onNavigateToContact={() => navigateToPage('contact')}
              onBackToHome={() => navigateToPage('home')}
            />
          )}

          {currentPage === 'delivery' && (
            <DeliveryHubsSection
              onNavigateToContact={() => navigateToPage('contact')}
              onNavigateToServices={() => navigateToPage('services')}
              onNavigateToDefense={() => navigateToPage('defense')}
              onNavigateToAIDiscovery={() => navigateToPage('ai-discovery')}
            />
          )}

          {currentPage === 'managed' && (
            <ManagedITSection />
          )}

          {currentPage === 'sectors' && (
            <SectorsSection />
          )}

          {currentPage === 'knowledge' && (
            <KnowledgeCenterSection />
          )}

          {currentPage === 'disaster-game' && (
            <DisasterGamePage
              onNavigateToContact={() => navigateToPage('contact')}
              onBackToHome={() => navigateToPage('home')}
            />
          )}

          {currentPage === 'contact' && (
            <ContactSection onOpenPrivacy={() => setLegalModalType('privacy')} />
          )}
        </div>

        {/* Bottom Quick Page-Switch Bar (Easter Egg: Click 8 times silently to open Gemini AI Debugger) */}
        <div 
          onClick={handleDebugBottomBarClick}
          className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 my-6 border-t select-none cursor-pointer transition-all ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-4 sm:p-6 backdrop-blur-md border transition-all ${
            isDark 
              ? 'bg-white/5 border-white/10 hover:border-cyan-500/30' 
              : 'bg-white border-slate-200 shadow-sm hover:border-blue-300'
          }`}>
            <div className="flex items-center gap-3 text-right pointer-events-none">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-sans font-bold block ${
                    isDark ? 'text-cyan-400' : 'text-blue-700'
                  }`}>
                    {isHe ? 'מעבר לעמוד הבא' : 'Next Section'}
                  </span>
                </div>
                <h4 className={`text-base font-bold font-heading ${
                  isDark ? 'text-white' : 'text-slate-950'
                }`}>
                  {isHe ? nextPage.title : nextPage.titleEn}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => navigateToPage(nextPage.id)}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{isHe ? `עבור ל-${nextPage.title}` : `Go to ${nextPage.titleEn}`}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer
        lang={lang}
        onOpenPrivacy={() => setLegalModalType('privacy')}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenLegalAccessibility={() => setLegalModalType('accessibility')}
      />

      {/* Popups & Dialog Modals */}
      <TechQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />

      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        onOpenLegalDeclaration={() => setLegalModalType('accessibility')}
        lang={lang}
      />

      <CommandTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      <ServicesIndexModal
        isOpen={isServicesIndexOpen}
        onClose={() => setIsServicesIndexOpen(false)}
        onSelectForQuote={(serviceId) => {
          setIsServicesIndexOpen(false);
          handleSelectServiceForQuote(serviceId || '');
        }}
      />

      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Gemini AI Developer Debugger Modal (10 Clicks / PIN 1981) */}
      <GeminiDebuggerModal
        isOpen={isGeminiDebuggerOpen}
        onClose={() => setIsGeminiDebuggerOpen(false)}
        isDark={isDark}
      />

      {/* Floating Discreet AI Concierge Bubble */}
      <FloatingAIConcierge
        onNavigateToSimulator={() => navigateToPage('ai-discovery')}
        onNavigateToContact={() => navigateToPage('contact')}
      />

      {/* Cookie Consent Banner */}
      <CookieBanner onOpenPrivacy={() => setLegalModalType('privacy')} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
