import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Lock, Bot } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ExecutiveAIAssessmentEngine } from './ExecutiveAIAssessmentEngine';
import { PageHeroBackground } from '../PageHeroBackground';
import aiEngineeringBg from '../../assets/images/ai_engineering_hero.jpg';

interface AIDiscoveryPageProps {
  onBackToHome: () => void;
  onNavigateToContact: () => void;
}

export const AIDiscoveryPage: React.FC<AIDiscoveryPageProps> = ({
  onBackToHome,
  onNavigateToContact,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="w-full relative min-h-screen pb-16 pt-6 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={aiEngineeringBg || '/ai_engineering_hero.jpg'}
        fallbackSrc="/ai_engineering_hero.jpg"
        alt="TECH-SELECT Enterprise AI Discovery Assessment"
        glowColor="bg-violet-600"
      />

      <div className="relative z-10">
        {/* Top back button */}
        <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isDark
              ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm'
          }`}
        >
          {isHe ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isHe ? 'חזרה לדף הבית' : 'Back to Home'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>{isHe ? 'סביבת אבחון C-Level מאובטחת' : 'Enterprise C-Level Assessment'}</span>
        </div>
      </div>

      {/* Main Engine Component */}
      <ExecutiveAIAssessmentEngine
        onNavigateToContact={onNavigateToContact}
      />
      </div>
    </div>
  );
};
