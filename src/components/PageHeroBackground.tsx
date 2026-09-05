import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface PageHeroBackgroundProps {
  imageSrc: string;
  fallbackSrc?: string;
  alt: string;
  glowColor?: string;
  className?: string;
  opacityLevel?: 'standard' | 'deep' | 'light';
}

export const PageHeroBackground: React.FC<PageHeroBackgroundProps> = ({
  imageSrc,
  fallbackSrc,
  alt,
  glowColor = 'bg-blue-600',
  className = '',
  opacityLevel = 'standard',
}) => {
  const { isDark } = useTheme();

  const getGradientClasses = () => {
    if (opacityLevel === 'deep') {
      return isDark
        ? 'bg-gradient-to-b from-[#080b12]/60 via-[#080b12]/30 to-[#080b12]/82'
        : 'bg-gradient-to-b from-white/60 via-white/28 to-[#f8fafc]/82';
    }
    if (opacityLevel === 'light') {
      return isDark
        ? 'bg-gradient-to-b from-[#080b12]/35 via-[#080b12]/12 to-[#080b12]/65'
        : 'bg-gradient-to-b from-white/35 via-white/10 to-[#f8fafc]/65';
    }
    // standard - perfectly balanced so the enterprise architectural scene is vividly visible & emphasized
    return isDark
      ? 'bg-gradient-to-b from-[#080b12]/48 via-[#080b12]/18 to-[#080b12]/76'
      : 'bg-gradient-to-b from-white/48 via-white/14 to-[#f8fafc]/76';
  };

  return (
    <>
      {/* Background Architectural Canvas */}
      <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden animate-linear-bg ${className}`}>
        <img
          src={imageSrc}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            // First tier fallback
            if (fallbackSrc && target.src !== fallbackSrc && !target.src.includes(fallbackSrc)) {
              target.src = fallbackSrc;
              return;
            }
            // Second tier fallback: extension switch
            if (target.src.endsWith('.jpg')) {
              target.src = target.src.replace(/\.jpg$/, '.jpeg');
              return;
            }
            if (target.src.endsWith('.jpeg')) {
              target.src = target.src.replace(/\.jpeg$/, '.jpg');
              return;
            }
            // Global master fallback: Tel Aviv headquarters
            if (!target.src.includes('techselect_office_hero')) {
              target.src = '/techselect_office_hero.jpeg';
            }
          }}
          alt={alt}
          referrerPolicy="no-referrer"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-center scale-100 contrast-[1.10] brightness-[1.04] saturate-[1.14] transition-all duration-700 ease-out"
        />

        {/* Crisp, Balanced Tint Overlay allowing the architecture to be vividly visible & emphasized */}
        <div className={`absolute inset-0 transition-colors duration-500 ${getGradientClasses()}`} />

        {/* Soft Central Radial Tint to Keep Foreground Typography and Cards 100% Legible */}
        <div
          className={`absolute inset-0 ${
            isDark
              ? 'bg-[radial-gradient(ellipse_at_center,rgba(8,11,18,0.10)_0%,rgba(8,11,18,0.56)_100%)]'
              : 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,rgba(248,250,252,0.56)_100%)]'
          }`}
        />
      </div>

      {/* Ambient Luxury Spotlight Glow */}
      <div
        className={`absolute top-12 sm:top-24 left-1/2 -translate-x-1/2 w-[700px] h-[460px] rounded-full blur-[140px] pointer-events-none z-[1] ${
          isDark ? `${glowColor}/[0.12]` : `${glowColor}/[0.06]`
        }`}
      />
    </>
  );
};
