import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface GuyPortraitProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export const GuyPortrait: React.FC<GuyPortraitProps> = ({
  className = '',
  size = 'lg',
  showBadge = true,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [hasError, setHasError] = useState(false);
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-32 h-32 sm:w-36 sm:h-36',
  }[size];

  const imageSrc = useFallbackSvg ? '/guy-yaakobi.svg' : '/guy-yaakobi.jpg';

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      {/* Executive Outer Ring */}
      <div
        className={`${sizeClasses} rounded-full p-[3px] relative transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/20 ring-4 ring-cyan-500/10'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-blue-400 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/10'
        }`}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-slate-900 bg-slate-900 flex items-center justify-center relative shadow-inner">
          {!hasError ? (
            <img
              src={imageSrc}
              alt={isHe ? 'גיא יעקובי - מנכ״ל ובעלים TECH-SELECT' : 'Guy Yaakobi - Founder & Owner TECH-SELECT'}
              className="w-full h-full object-cover object-center transform transition-transform duration-500 hover:scale-105"
              onError={() => {
                if (!useFallbackSvg) {
                  setUseFallbackSvg(true);
                } else {
                  setHasError(true);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-2xl font-mono">
              GY
            </div>
          )}
        </div>
      </div>

      {/* Verified Executive Badge */}
      {showBadge && (
        <div
          className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-md border-2 border-white dark:border-slate-900 flex items-center justify-center pointer-events-none ${
            isDark ? 'bg-cyan-500 text-slate-950' : 'bg-blue-600 text-white'
          }`}
          title={isHe ? 'מנכ״ל ובעלים מאומת' : 'Verified Owner & CEO'}
        >
          <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      )}
    </div>
  );
};
