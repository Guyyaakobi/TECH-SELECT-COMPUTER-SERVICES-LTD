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
import { ArrowLeft, ArrowRight, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function MainApp() {
  const { lang, isHe, setLang } = useLanguage();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isServicesIndexOpen, setIsServicesIndexOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'accessibility' | null>(null);

  useEffect(() => {
    document.documentElement.dir = isHe ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isHe]);

  // Handle Hash change / Direct deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'disaster-game' || hash === 'disaster') {
        setCurrentPage('disaster-game');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'defense') {
        setCurrentPage('defense');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === 'contact') {
        setCurrentPage('contact');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateToPage = (page: PageId) => {
    setCurrentPage(page);
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
    { id: 'delivery', title: 'מודל מצויינות', titleEn: 'Excellence Model' },
    { id: 'managed', title: 'מנהל IT מנוהל', titleEn: 'Managed IT' },
    { id: 'sectors', title: 'מגזרי תעשייה', titleEn: 'Industries' },
    { id: 'knowledge', title: 'מרכז ידע', titleEn: 'Knowledge Base' },
    { id: 'contact', title: 'צור קשר', titleEn: 'Contact Us' },
  ];

  const currentPageIndex = pagesOrder.findIndex((p) => p.id === currentPage);
  const nextPage = pagesOrder[(currentPageIndex + 1) % pagesOrder.length];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Living Dynamic Background Canvas */}
      <AnimatedBackground />

      {/* Main Top Floating Navigation Header */}
      <div className="pt-16 sm:pt-20">
        <Navbar
          currentPage={currentPage}
          onNavigate={navigateToPage}
          onOpenQuiz={() => navigateToPage('disaster-game')}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          lang={lang}
          onLanguageChange={setLang}
        />

        {/* Breadcrumb / Page Header indicator for inner pages */}
        {currentPage !== 'home' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between text-xs text-slate-400 font-mono">
            <button
              onClick={() => navigateToPage('home')}
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isHe ? 'חזרה לדף הבית' : 'Back to Home'}</span>
            </button>

            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-200 font-semibold">
              {isHe
                ? pagesOrder.find((p) => p.id === currentPage)?.title
                : pagesOrder.find((p) => p.id === currentPage)?.titleEn}
            </span>
          </div>
        )}

        {/* Individual Page Router Views */}
        <main className="flex-1">
          {currentPage === 'home' && (
            <Hero
              onOpenQuiz={() => setIsQuizOpen(true)}
              onOpenTerminal={() => setIsTerminalOpen(true)}
              onNavigateToDefense={() => navigateToPage('defense')}
              onOpenServicesIndex={() => setIsServicesIndexOpen(true)}
            />
          )}

          {currentPage === 'services' && (
            <ServicesSection onSelectForQuote={handleSelectServiceForQuote} />
          )}

          {currentPage === 'defense' && (
            <DefensePage onBackToHome={() => navigateToPage('home')} />
          )}

          {currentPage === 'delivery' && (
            <DeliveryHubsSection />
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

          {/* Bottom Quick Page-Switch Bar */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 my-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 text-right">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold block">
                    {isHe ? 'מעבר לעמוד הבא' : 'Next Section'}
                  </span>
                  <h4 className="text-base font-bold text-white font-heading">
                    {isHe ? nextPage.title : nextPage.titleEn}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateToPage(nextPage.id)}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer hover:opacity-90"
                >
                  <span>{isHe ? `עבור ל-${nextPage.title}` : `Go to ${nextPage.titleEn}`}</span>
                  {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

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

      {/* Cookie Consent Banner */}
      <CookieBanner onOpenPrivacy={() => setLegalModalType('privacy')} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
