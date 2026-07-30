import React, { useState } from 'react';
import { SERVICES_DATA } from '../data/content';
import { ServiceItem } from '../types';
import { ServiceModal } from './ServiceModal';
import { Server, ShieldCheck, Cloud, Database, Wifi, Cpu, Monitor, Users, ChevronLeft, ChevronRight, Sparkles, ArrowLeft, ArrowRight, Lock, Clock, Code, HardDrive } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';

interface ServicesSectionProps {
  onSelectForQuote: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectForQuote }) => {
  const { isHe } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'all' | 'networking' | 'hardware' | 'align' | 'cyber'>('all');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const filteredServices = SERVICES_DATA.filter((svc) => {
    if (activeCategory === 'networking') return svc.id === 'network-infrastructure' || svc.id === 'm365-azure';
    if (activeCategory === 'hardware') return svc.id === 'hardware-supply';
    if (activeCategory === 'align') return svc.id === 'align-projects' || svc.id === 'retainer-support';
    if (activeCategory === 'cyber') return svc.id === 'cyber-security' || svc.id === 'backup-drp' || svc.id === 'software-dev';
    return true;
  });

  const getServiceEnData = (svc: ServiceItem) => {
    switch (svc.id) {
      case 'network-infrastructure':
        return {
          title: 'Network Infrastructure Architecture & Wi-Fi',
          subtitle: 'Enterprise Wireless & Wired Communication Solutions',
          shortDesc: 'End-to-end network engineering: requirements assessment, active/passive hardware selection, deployment, topology documentation, and testing.',
        };
      case 'hardware-supply':
        return {
          title: 'OEM Server & Workstation Supply',
          subtitle: 'Original Hardware from Global Tech Leaders',
          shortDesc: 'Supply, configuration, and lifecycle management of enterprise Dell/HPE/Lenovo servers, business laptops, and storage systems.',
        };
      case 'align-projects':
        return {
          title: 'IT Infrastructure Alignment & Standardization',
          subtitle: 'Rack Organization, Remediation & Zero-Downtime Migrations',
          shortDesc: 'Comprehensive remediation of legacy setups, server rack cable management, hardware upgrades, and site documentation.',
        };
      case 'cyber-security':
        return {
          title: 'Cyber Security & Perimeter Defense',
          subtitle: 'Firewalls, EDR/XDR Endpoint Protection & Zero-Trust MFA',
          shortDesc: 'Advanced cybersecurity suite including next-gen Firewalls, AI-driven EDR endpoint security, identity management, and compliance readiness.',
        };
      case 'm365-azure':
        return {
          title: 'Microsoft 365, Azure & Cloud Engineering',
          subtitle: 'Hybrid Cloud Architecture, Migration & Management',
          shortDesc: 'Seamless setup and management of Microsoft 365, SharePoint Online, Azure cloud infrastructure, and encrypted cloud backups.',
        };
      case 'retainer-support':
        return {
          title: 'Managed IT Retainer & SLA Support',
          subtitle: 'Strategic vCIO Advisory, 24/7 Monitoring & Senior Engineers',
          shortDesc: 'Long-term IT partnership with dedicated response times, proactive system monitoring, and strategic technology consulting.',
        };
      case 'backup-drp':
        return {
          title: 'Disaster Recovery (DRP) & Immutable Backup',
          subtitle: '3-2-1 Encrypted Backup & Rapid Business Continuity',
          shortDesc: 'Ransomware-proof immutable backups, periodic recovery testing, and complete DRP plans for total business continuity.',
        };
      case 'software-dev':
        return {
          title: 'Custom Software Development & IT Staffing',
          subtitle: 'Enterprise Systems Integration & Tech Outsource',
          shortDesc: 'Tailored software engineering, API integrations between ERP/CRM platforms, process automation, and tech staffing.',
        };
      default:
        return { title: svc.title, subtitle: svc.subtitle, shortDesc: svc.shortDesc };
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Wifi': return <Wifi className="w-5 h-5 text-cyan-400" />;
      case 'Server': return <Server className="w-5 h-5 text-blue-400" />;
      case 'HardDrive': return <HardDrive className="w-5 h-5 text-blue-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
      case 'Lock': return <Lock className="w-5 h-5 text-purple-400" />;
      case 'Cloud': return <Cloud className="w-5 h-5 text-sky-400" />;
      case 'Clock': return <Clock className="w-5 h-5 text-emerald-400" />;
      case 'Database': return <Database className="w-5 h-5 text-cyan-400" />;
      case 'Code': return <Code className="w-5 h-5 text-purple-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'Monitor': return <Monitor className="w-5 h-5 text-blue-400" />;
      case 'Users': return <Users className="w-5 h-5 text-indigo-400" />;
      default: return <Server className="w-5 h-5 text-cyan-400" />;
    }
  };

  const categories = isHe
    ? [
        { id: 'all', label: 'כל השירותים (8)' },
        { id: 'networking', label: 'אפיון רשתות & M365' },
        { id: 'hardware', label: 'אספקת ציוד & חומרה' },
        { id: 'align', label: 'יישור קו & תמיכה שוטפת' },
        { id: 'cyber', label: 'אבטחת מידע, DRP & פיתוח' },
      ]
    : [
        { id: 'all', label: 'All Services (8)' },
        { id: 'networking', label: 'Networking & M365' },
        { id: 'hardware', label: 'Hardware Supply' },
        { id: 'align', label: 'Alignment & Retainer' },
        { id: 'cyber', label: 'Cyber, DRP & Dev' },
      ];

  return (
    <section id="services" className="py-24 bg-[#0b0c10] text-slate-100 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>SOLUTIONS & INFRASTRUCTURE 360°</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            {isHe ? (
              <>
                שירותי IT, אפיון רשתות, ציוד <span className="gemini-text-gradient">ופיתוח תוכנה</span>
              </>
            ) : (
              <>
                IT Services, Network Architecture <span className="gemini-text-gradient">& Custom Software</span>
              </>
            )}
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            {isHe
              ? 'כל מעטפת התשתיות, הציוד, אבטחת המידע והניהול השוטף לארגון שלכם – תחת כתובת אחת אמינה.'
              : 'End-to-end IT infrastructure, original hardware supply, cybersecurity, and managed SLA support under one roof.'}
          </p>

          {/* Category Filter Pills */}
          <div className="pt-4 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((svc) => {
            const enData = getServiceEnData(svc);
            const title = isHe ? svc.title : enData.title;
            const subtitle = isHe ? svc.subtitle : enData.subtitle;
            const shortDesc = isHe ? svc.shortDesc : enData.shortDesc;

            return (
              <SpotlightCard
                key={svc.id}
                className={`gemini-card relative p-6 flex flex-col justify-between ${
                  svc.popular ? 'border-cyan-500/30 shadow-cyan-500/5' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Icon & Subtitle / Badges Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-cyan-400 shrink-0">
                      {renderIcon(svc.iconName)}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {svc.popular && (
                        <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm shrink-0">
                          CORE SPECIALIZATION
                        </span>
                      )}
                      <span className="text-xs text-cyan-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-semibold">
                        {subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors font-heading">
                    {title}
                  </h3>

                  {/* Short Desc */}
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
                    {shortDesc}
                  </p>

                  {/* Tech Stack Chips */}
                  {svc.techStack && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {svc.techStack.map((tech, idx) => (
                        <span key={idx} className="text-xs bg-white/5 text-slate-300 px-2.5 py-1 rounded-full font-sans font-semibold border border-white/5">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Features Highlights */}
                  <div className="space-y-1.5 pt-2">
                    {svc.features.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedService(svc)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>{isHe ? 'לפרטים מלאים' : 'View Details'}</span>
                    {isHe ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <a
                    href="#contact"
                    onClick={() => onSelectForQuote(svc.id)}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white text-xs font-medium rounded-full transition-all shadow-sm"
                  >
                    {isHe ? 'פנייה לאפיון' : 'Get Quote'}
                  </a>
                </div>
              </SpotlightCard>
            );
          })}

          {/* Custom Requirement CTA Card */}
          <SpotlightCard className="gemini-card p-6 bg-gradient-to-br from-[#121422] via-[#16192c] to-[#0f111d] border border-indigo-500/20 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-white/5 border border-white/10 text-cyan-300">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                {isHe ? 'זקוקים לפתרון IT, תקשורת או ציוד ייעודי?' : 'Need Custom IT, Hardware or Network Architecture?'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                {isHe
                  ? 'מערך ה-IT שלכם דורש אפיון מיוחד, רכש ציוד מקורי או פרויקט יישור קו? נשמח לתאם פגישה ולהתאים לכם מעטפת מלאה.'
                  : 'Does your IT setup require specialized engineering, hardware supply, or network alignment? Let’s schedule a consultation.'}
              </p>
            </div>

            <a
              href="#contact"
              className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium py-3 px-5 rounded-full text-xs transition-all shadow-md"
            >
              <span>{isHe ? 'דברו איתנו לאפיון מותאם' : 'Contact Us for Custom Scope'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </a>
          </SpotlightCard>
        </div>

      </div>

      {/* Detail Modal */}
      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onSelectForQuote={onSelectForQuote}
      />
    </section>
  );
};
