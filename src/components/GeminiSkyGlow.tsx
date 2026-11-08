import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface GeminiSkyGlowProps {
  className?: string;
}

/**
 * GeminiSkyGlow - Replicates the subtle, ethereal sky-blue atmospheric bloom
 * seen in Gemini UI ("רקע תכלת עדין באזור הכתוב למעלה"), blooming smoothly
 * behind top headlines and typography between pages.
 */
export const GeminiSkyGlow: React.FC<GeminiSkyGlowProps> = ({ className = '' }) => {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-8 sm:top-14 left-1/2 -translate-x-1/2 w-[92vw] max-w-[1100px] h-[320px] sm:h-[440px] z-[1] overflow-visible ${className}`}
    >
      {/* Outer Ethereal Sky-Blue Ambient Bloom */}
      <div
        className={`absolute inset-0 rounded-full animate-gemini-sky-bloom transition-colors duration-700 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.18)_0%,rgba(14,165,233,0.08)_45%,rgba(5,7,12,0)_75%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(186,230,253,0.70)_0%,rgba(224,242,254,0.40)_45%,rgba(255,255,255,0)_75%)]'
        }`}
      />

      {/* Central Soft Sky-Blue Celestial Core */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[65vw] max-w-[680px] h-[220px] sm:h-[280px] rounded-full blur-[65px] animate-gemini-sky-bloom transition-colors duration-700 ${
          isDark
            ? 'bg-sky-400/15'
            : 'bg-sky-200/50'
        }`}
      />
    </div>
  );
};
