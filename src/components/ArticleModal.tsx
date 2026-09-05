import React from 'react';
import { ArticleItem } from '../types';
import { X, Clock, Calendar, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface ArticleModalProps {
  article: ArticleItem | null;
  onClose: () => void;
}

// Helper to render inline markdown formatting like **bold text**
const renderFormattedInline = (text: string, isDark: boolean) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// Helper to render article body paragraphs, bullet points and numbered lists
const renderFormattedContent = (content: string, isDark: boolean) => {
  if (!content) return null;
  const paragraphs = content.split(/\n\n+/);

  return paragraphs.map((para, idx) => {
    const lines = para.split('\n');
    return (
      <div key={idx} className="space-y-2 mb-4">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Check bullet point (- or • or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.replace(/^[-•*]\s*/, '');
            return (
              <div key={lIdx} className="flex items-start gap-2.5 my-1 sm:pr-2">
                <span className={`mt-1 font-bold text-base shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>•</span>
                <p className={`flex-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {renderFormattedInline(bulletText, isDark)}
                </p>
              </div>
            );
          }

          // Check numbered list (e.g., "1. ", "2. ")
          const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
          if (numMatch) {
            return (
              <div key={lIdx} className="flex items-start gap-2.5 my-1.5 sm:pr-1">
                <span className={`font-mono font-bold text-sm shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                  {numMatch[1]}
                </span>
                <p className={`flex-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {renderFormattedInline(numMatch[2], isDark)}
                </p>
              </div>
            );
          }

          // Standard paragraph line
          return (
            <p key={lIdx} className={`leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {renderFormattedInline(line, isDark)}
            </p>
          );
        })}
      </div>
    );
  });
};

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir={isHe ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-3xl border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-200 ${
          isDark 
            ? 'bg-[#070b12] border-white/[0.08] text-slate-100' 
            : 'bg-white border-slate-300/80 text-slate-900 shadow-slate-900/10'
        } ${isHe ? 'text-right' : 'text-left'}`}
      >
        
        {/* Header */}
        <div className={`p-6 border-b flex items-start justify-between gap-4 ${
          isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="space-y-2 max-w-2xl">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-sans font-bold border ${
              isDark ? 'bg-white/[0.04] text-cyan-300 border-white/[0.08]' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {article.categoryLabel}
            </span>
            <h2 className={`text-xl sm:text-2xl font-bold font-heading ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}>
              {article.title}
            </h2>
            <div className={`flex flex-wrap items-center gap-4 text-xs pt-1 font-medium font-sans ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span className="flex items-center gap-1">
                <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                {article.date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 opacity-70" />
                {article.author}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors shadow-2xs cursor-pointer shrink-0 ${
              isDark
                ? 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]'
                : 'text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border-slate-200'
            }`}
            aria-label={isHe ? 'סגירה' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm font-normal">
          <div className={`p-4 rounded-xl border font-semibold leading-relaxed ${
            isDark 
              ? 'bg-white/[0.03] border-white/[0.06] text-cyan-200' 
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}>
            {renderFormattedInline(article.summary, isDark)}
          </div>
          <div className="text-sm sm:text-base">
            {renderFormattedContent(article.content, isDark)}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isHe
              ? 'פורסם בפינת המידע המקצועי של TECH-SELECT'
              : 'Published in TECH-SELECT Knowledge Hub'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            {isHe ? 'סגור מאמר' : 'Close Article'}
          </button>
        </div>

      </div>
    </div>
  );
};
