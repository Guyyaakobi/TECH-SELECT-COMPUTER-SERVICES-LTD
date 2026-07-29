import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtag?: boolean;
  theme?: 'light' | 'dark';
}

export const TechSelectLogo: React.FC<LogoProps> = ({ size = 'md', showSubtag = true, theme = 'dark' }) => {
  const sizeClasses = {
    sm: { laptop: 'w-7 h-5', title: 'text-sm sm:text-base', sub: 'text-[9px]' },
    md: { laptop: 'w-9 h-6', title: 'text-lg sm:text-xl', sub: 'text-[11px]' },
    lg: { laptop: 'w-12 h-8', title: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm' },
    xl: { laptop: 'w-16 h-11', title: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' },
  };

  const currentSize = sizeClasses[size];
  const textColor = theme === 'light' ? 'text-slate-900' : 'text-slate-100';
  const subColor = theme === 'light' ? 'text-slate-700' : 'text-slate-300';
  const strokeColor = theme === 'light' ? '#0f172a' : '#f8fafc';

  return (
    <div className="flex items-center gap-3.5 group cursor-pointer select-none dir-ltr text-left">
      {/* Laptop Icon SVG - Matches User's Exact Logo Artwork */}
      <div className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 100 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentSize.laptop} transition-all duration-300`}
        >
          {/* Laptop Screen Outer Border */}
          <rect
            x="12"
            y="6"
            width="76"
            height="46"
            rx="4"
            stroke={strokeColor}
            strokeWidth="6"
            fill="none"
          />

          {/* Inner Screen Display Surface */}
          <rect
            x="17"
            y="11"
            width="66"
            height="36"
            fill="none"
          />

          {/* Laptop Base Hinge / Tray */}
          <path
            d="M2 56C2 54 4 52 6 52H94C96 52 98 54 98 56V57C98 59 96 60 94 60H6C4 60 2 59 2 57V56Z"
            fill={strokeColor}
          />

          {/* Trackpad / Finger Latch Cutout */}
          <path
            d="M40 52H60V54C60 55 59 56 58 56H42C41 56 40 55 40 54V52Z"
            fill={theme === 'light' ? '#ffffff' : '#0b0c10'}
          />
        </svg>
      </div>

      {/* Official Serif Typography Brand Name */}
      <div className="flex flex-col text-left font-serif leading-tight">
        {/* Top Title: Tech Select */}
        <span className={`${currentSize.title} font-serif tracking-tight font-normal ${textColor}`}>
          Tech Select
        </span>

        {/* Subtitle: computer services LTD */}
        {showSubtag && (
          <span className={`${currentSize.sub} font-serif tracking-normal font-normal ${subColor} opacity-90 -mt-0.5`}>
            computer services LTD
          </span>
        )}
      </div>
    </div>
  );
};
