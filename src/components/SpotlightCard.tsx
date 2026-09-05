import React, { useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
  id?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor,
  onClick,
  id,
}) => {
  const { isDark } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const defaultSpotlight = isDark
    ? (spotlightColor || 'rgba(56, 189, 248, 0.12)')
    : (spotlightColor || 'rgba(37, 99, 235, 0.08)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const baseThemeClasses = isDark
    ? 'border-slate-800/80 bg-[#0d121f]/90 hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.2)] hover:bg-[#121828]'
    : 'border-slate-200/90 bg-white/95 hover:border-blue-400 hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.12)] hover:bg-white text-slate-900';

  return (
    <div
      ref={cardRef}
      id={id}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-sm ${baseThemeClasses} ${className}`}
    >
      {/* Smooth Following Cursor Light Halo / Spotlight Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-out"
        style={{
          opacity,
          background: `radial-gradient(550px circle at ${position.x}px ${position.y}px, ${defaultSpotlight}, transparent 65%)`,
        }}
      />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

