import React from 'react';
import { ArticleItem } from '../types';
import { X, Clock, Calendar, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ArticleModalProps {
  article: ArticleItem | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const { isHe } = useLanguage();
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        dir={isHe ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isHe ? 'text-right' : 'text-left'
        } text-slate-100`}
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-cyan-300 border border-blue-800 text-xs font-mono font-bold">
              {article.categoryLabel}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-medium font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {article.date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {article.author}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors shadow-sm cursor-pointer shrink-0"
            aria-label={isHe ? 'סגירה' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-300 text-sm leading-relaxed font-normal whitespace-pre-line">
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-cyan-200 font-semibold">
            {article.summary}
          </div>
          <div className="text-base text-slate-200 leading-loose">
            {article.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {isHe
              ? 'פורסם בפינת המידע המקצועי של TECH-SELECT'
              : 'Published in TECH-SELECT Knowledge Hub'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {isHe ? 'סגור מאמר' : 'Close Article'}
          </button>
        </div>

      </div>
    </div>
  );
};
