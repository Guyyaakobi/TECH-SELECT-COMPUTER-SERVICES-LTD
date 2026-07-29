import React from 'react';
import { ServiceItem } from '../types';
import { X, CheckCircle2, ShieldCheck, Server, Cloud, Database, Wifi, Cpu, Monitor, Users, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { useLanguage } from '../context/LanguageContext';

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onSelectForQuote: (serviceId: string) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, onSelectForQuote }) => {
  const { isHe } = useLanguage();
  if (!service) return null;

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Server': return <Server className="w-8 h-8 text-cyan-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-8 h-8 text-blue-400" />;
      case 'Cloud': return <Cloud className="w-8 h-8 text-sky-400" />;
      case 'Database': return <Database className="w-8 h-8 text-emerald-400" />;
      case 'Wifi': return <Wifi className="w-8 h-8 text-cyan-400" />;
      case 'Cpu': return <Cpu className="w-8 h-8 text-indigo-400" />;
      case 'Monitor': return <Monitor className="w-8 h-8 text-blue-400" />;
      case 'Users': return <Users className="w-8 h-8 text-indigo-400" />;
      default: return <Server className="w-8 h-8 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="relative p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              {renderIcon(service.iconName)}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                {service.subtitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                {service.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors shadow-sm cursor-pointer"
            aria-label={isHe ? 'סגירה' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm">
          {/* Full Description */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              {isHe ? 'אודות השירות' : 'About the Service'}
            </h3>
            <p className="text-base leading-relaxed text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              {service.fullDesc}
            </p>
          </div>

          {/* SLA Guarantee */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isHe ? 'התחייבות SLA לרמת שירות: ' : 'Guaranteed SLA Level: '}<strong>{service.sla}</strong></span>
          </div>

          {/* Features Checklist */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              {isHe ? 'מה כולל השירות?' : 'Service Highlights'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {service.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200 font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              {isHe ? 'טכנולוגיות ומערכות נתמכות' : 'Supported Tech Stack & Platforms'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {service.techStack.map((tech, idx) => (
                <span key={idx} className="bg-slate-950 text-cyan-300 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono font-bold shadow-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              {isHe ? 'ערך מוסף לעסק שלכם' : 'Business Value'}
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 font-medium">
              {service.benefits.map((b, idx) => (
                <li key={idx} className="text-slate-200">{b}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium">
            {isHe ? 'מעוניינים במידע נוסף? דברו ישירות עם מומחה מחשוב ב-TECH-SELECT' : 'Need additional technical details? Speak directly with a TECH-SELECT engineer'}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${COMPANY_INFO.phoneLandline}`}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-mono font-bold transition-colors shadow-sm"
            >
              {COMPANY_INFO.phoneLandline}
            </a>

            <button
              onClick={() => {
                onClose();
                onSelectForQuote(service.id);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>{isHe ? 'פנייה לאפיון שירות זה' : 'Inquire for this Service'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
