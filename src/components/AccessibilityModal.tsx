import React, { useState, useEffect } from 'react';
import { X, Eye, ZoomIn, ZoomOut, Sun, Type, RotateCcw, Link2, FileText, Sparkles, Contrast } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';

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
    const newOffset = Math.max(-2, Math.min(4, fontSizeOffset + delta));
    setFontSizeOffset(newOffset);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0b0f19] border-2 border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.25)] p-6 text-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm sm:text-base font-heading">
            <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <Eye className="w-5 h-5 text-cyan-300" />
            </div>
            <span>{isHe ? 'סרגל נגישות ותצוגה מתקדם' : 'Accessibility & Display Toolbar'}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors border border-white/10 cursor-pointer"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3 text-xs text-slate-200">
          
          {/* Font Size */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>{isHe ? 'גודל פונט / טקסט:' : 'Font Size:'}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFontSize(1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-cyan-300 font-bold shadow-sm cursor-pointer active:scale-95 transition-transform"
                title={isHe ? 'הגדל פונט' : 'Increase Font'}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="font-mono text-cyan-300 w-6 text-center font-bold">
                {fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}
              </span>
              <button
                onClick={() => handleFontSize(-1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-cyan-300 font-bold shadow-sm cursor-pointer active:scale-95 transition-transform"
                title={isHe ? 'הקטן פונט' : 'Decrease Font'}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>{isHe ? 'ניגודיות מוגברת:' : 'High Contrast:'}</span>
            </span>

            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                highContrast
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {highContrast ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Underline Links */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span>{isHe ? 'הדגשת קישורים:' : 'Highlight Links:'}</span>
            </span>

            <button
              onClick={() => setUnderlineLinks(!underlineLinks)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                underlineLinks
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {underlineLinks ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Grayscale */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Contrast className="w-4 h-4 text-purple-400" />
              <span>{isHe ? 'מצב גווני אפור:' : 'Grayscale Mode:'}</span>
            </span>

            <button
              onClick={() => setGrayscale(!grayscale)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                grayscale
                  ? 'bg-purple-500 text-slate-950 border-purple-300 shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {grayscale ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Readable Font */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isHe ? 'פונט קריא אחיד:' : 'Readable Font:'}</span>
            </span>

            <button
              onClick={() => setReadableFont(!readableFont)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                readableFont
                  ? 'bg-indigo-500 text-white border-indigo-300 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {readableFont ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetAccessibility}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl font-bold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>{isHe ? 'איפוס כל הגדרות הנגישות' : 'Reset Accessibility Settings'}</span>
          </button>
        </div>

        {/* Legal Declaration Button */}
        {onOpenLegalDeclaration && (
          <div className="pt-3 border-t border-white/10 text-center">
            <button
              onClick={() => {
                onClose();
                onOpenLegalDeclaration();
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isHe ? 'צפייה בהצהרת הנגישות המשפטית המלאה' : 'View Full Accessibility Statement'}</span>
            </button>
          </div>
        )}

        <div className="pt-2 text-[11px] text-slate-400 text-center font-mono">
          {isHe ? `רכז נגישות: ${COMPANY_INFO.email}` : `Accessibility Coordinator: ${COMPANY_INFO.email}`}
        </div>

      </div>
    </div>
  );
};
