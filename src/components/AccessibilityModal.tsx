import React, { useState, useEffect } from 'react';
import { X, Eye, ZoomIn, ZoomOut, Sun, Type, RotateCcw, Link2, FileText, Sparkles, Contrast } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { useTheme } from '../context/ThemeContext';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegalDeclaration?: () => void;
  lang?: 'he' | 'en';
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  onOpenLegalDeclaration,
  lang = 'he',
}) => {
  const { isDark } = useTheme();
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [readableFont, setReadableFont] = useState(false);

  useEffect(() => {
    // Apply font size
    document.documentElement.style.fontSize = `${16 + fontSizeOffset * 2}px`;
  }, [fontSizeOffset]);

  useEffect(() => {
    // Apply high contrast
    if (highContrast) {
      document.body.classList.add('contrast-125', 'brightness-110');
    } else {
      document.body.classList.remove('contrast-125', 'brightness-110');
    }
  }, [highContrast]);

  useEffect(() => {
    // Apply underline links
    if (underlineLinks) {
      document.body.classList.add('underline-links');
    } else {
      document.body.classList.remove('underline-links');
    }
  }, [underlineLinks]);

  useEffect(() => {
    // Apply grayscale
    if (grayscale) {
      document.body.style.filter = 'grayscale(100%)';
    } else {
      document.body.style.filter = 'none';
    }
  }, [grayscale]);

  useEffect(() => {
    // Apply readable font
    if (readableFont) {
      document.body.style.fontFamily = 'Arial, sans-serif';
    } else {
      document.body.style.fontFamily = '';
    }
  }, [readableFont]);

  if (!isOpen) return null;

  const handleFontSize = (delta: number) => {
    setFontSizeOffset((prev) => Math.max(-2, Math.min(3, prev + delta)));
  };

  const resetAccessibility = () => {
    setFontSizeOffset(0);
    setHighContrast(false);
    setUnderlineLinks(false);
    setGrayscale(false);
    setReadableFont(false);
    document.documentElement.style.fontSize = '16px';
    document.body.classList.remove('contrast-125', 'brightness-110', 'underline-links');
    document.body.style.filter = 'none';
    document.body.style.fontFamily = '';
  };

  const isHe = lang === 'he';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir={isHe ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-5 transition-colors duration-200 ${
          isDark 
            ? 'bg-[#070b12] border-white/[0.08] text-slate-100' 
            : 'bg-white border-slate-300/80 text-slate-900 shadow-slate-900/10'
        } ${isHe ? 'text-right' : 'text-left'}`}
      >
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm font-heading">
            <div className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <Eye className="w-5 h-5" />
            </div>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {isHe ? 'סרגל נגישות והתאמות תצוגה' : 'Accessibility Toolbar'}
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors border cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]' 
                : 'text-slate-500 hover:text-slate-900 bg-slate-100 border-slate-200'
            }`}
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3 text-xs">
          
          {/* Font Size */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Type className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>{isHe ? 'גודל פונט / טקסט:' : 'Font Size:'}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFontSize(1)}
                className={`p-2 rounded-lg font-bold shadow-2xs cursor-pointer active:scale-95 transition-transform border ${
                  isDark 
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-cyan-300' 
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-blue-700'
                }`}
                title={isHe ? 'הגדל פונט' : 'Increase Font'}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className={`font-sans w-6 text-center font-bold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                {fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}
              </span>
              <button
                onClick={() => handleFontSize(-1)}
                className={`p-2 rounded-lg font-bold shadow-2xs cursor-pointer active:scale-95 transition-transform border ${
                  isDark 
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-cyan-300' 
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-blue-700'
                }`}
                title={isHe ? 'הקטן פונט' : 'Decrease Font'}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>{isHe ? 'ניגודיות מוגברת:' : 'High Contrast:'}</span>
            </span>

            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                highContrast
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : isDark
                    ? 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
                    : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {highContrast ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Underline Links */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span>{isHe ? 'הדגשת קישורים:' : 'Highlight Links:'}</span>
            </span>

            <button
              onClick={() => setUnderlineLinks(!underlineLinks)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                underlineLinks
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/20'
                  : isDark
                    ? 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
                    : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {underlineLinks ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Grayscale */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Contrast className="w-4 h-4 text-purple-400" />
              <span>{isHe ? 'מצב גווני אפור:' : 'Grayscale Mode:'}</span>
            </span>

            <button
              onClick={() => setGrayscale(!grayscale)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                grayscale
                  ? 'bg-purple-500 text-white border-purple-300 shadow-md shadow-purple-500/20'
                  : isDark
                    ? 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
                    : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {grayscale ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Readable Font */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isHe ? 'פונט קריא אחיד:' : 'Readable Font:'}</span>
            </span>

            <button
              onClick={() => setReadableFont(!readableFont)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                readableFont
                  ? 'bg-indigo-500 text-white border-indigo-300 shadow-md shadow-indigo-500/20'
                  : isDark
                    ? 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
                    : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {readableFont ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetAccessibility}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold cursor-pointer transition-colors border ${
              isDark 
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-cyan-300' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>{isHe ? 'איפוס כל הגדרות הנגישות' : 'Reset Accessibility Settings'}</span>
          </button>
        </div>

        {/* Legal Declaration Button */}
        {onOpenLegalDeclaration && (
          <div className={`pt-3 border-t text-center ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <button
              onClick={() => {
                onClose();
                onOpenLegalDeclaration();
              }}
              className={`text-xs underline font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isHe ? 'צפייה בהצהרת הנגישות המשפטית המלאה' : 'View Full Accessibility Statement'}</span>
            </button>
          </div>
        )}

        <div className={`pt-2 text-[11px] text-center font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {isHe ? `רכז נגישות: ${COMPANY_INFO.email}` : `Accessibility Coordinator: ${COMPANY_INFO.email}`}
        </div>

      </div>
    </div>
  );
};
