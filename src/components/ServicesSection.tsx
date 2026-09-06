import React, { useState } from 'react';
import { SERVICES_DATA } from '../data/content';
import { ServiceItem } from '../types';
import { ServiceModal } from './ServiceModal';
import { Server, ShieldCheck, Cloud, Database, Wifi, Cpu, Monitor, Users, Sparkles, ArrowLeft, ArrowRight, Lock, Clock, Code, HardDrive, CheckCircle2, Truck, Wrench } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import { HardwareManufacturersMarquee } from './HardwareManufacturersMarquee';
import servicesCloudBg from '../assets/images/services_cloud_hero.jpg';

interface ServicesSectionProps {
  onSelectForQuote: (serviceId: string) => void;
}

type CategoryId = 'all' | 'managed' | 'hardware' | 'projects' | 'dev' | 'security' | 'cloud';

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectForQuote }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const filteredServices = SERVICES_DATA.filter((svc) => {
    if (activeCategory === 'managed') return svc.id === 'managed-it-systems' || svc.id === 'hardware-procurement';
    if (activeCategory === 'hardware') return svc.id === 'hardware-procurement';
    if (activeCategory === 'projects') return svc.id === 'complex-projects' || svc.id === 'private-ai-onprem';
    if (activeCategory === 'dev') return svc.id === 'software-dev';
    if (activeCategory === 'security') return svc.id === 'cyber-security-ciso' || svc.id === 'private-ai-onprem';
    if (activeCategory === 'cloud') return svc.id === 'cloud-drp-continuity' || svc.id === 'private-ai-onprem';
    return true;
  });

  const standardServices = filteredServices.filter((svc) => svc.id !== 'hardware-procurement');
  const hardwareService = filteredServices.find((svc) => svc.id === 'hardware-procurement');

  const getServiceEnData = (svc: ServiceItem) => {
    switch (svc.id) {
      case 'private-ai-onprem':
        return {
          title: 'Private AI & On-Prem LLM Infrastructure',
          subtitle: 'Dedicated AI Servers, Air-Gapped GPU Topologies & Local LLMs',
          shortDesc: 'Design, procurement, and deployment of dedicated on-prem AI servers and air-gapped environments for hosting local LLMs. Empowering your enterprise with AI without risking proprietary trade secrets in public clouds.',
        };
      case 'managed-it-systems':
        return {
          title: 'Comprehensive Managed IT & vCIO Services',
          subtitle: 'Full Systems Management, Workstations, M365 & IT Budgeting',
          shortDesc: 'Taking end-to-end engineering ownership over organizational IT: servers, endpoints, permissions, licensing, and strategic advisory.',
        };
      case 'complex-projects':
        return {
          title: 'Complex IT Projects & Infrastructure Engineering',
          subtitle: 'Zero-Downtime Migrations, Network Architecture & Deployments',
          shortDesc: 'End-to-end execution of complex technology projects: branch rollouts, server room deployments, and network standardizations.',
        };
      case 'software-dev':
        return {
          title: 'Custom Software Development & Automation',
          subtitle: 'Enterprise Applications, Automation Workflows & Deep APIs',
          shortDesc: 'Custom software engineering, internal portals, deep API bridges between ERP/CRM platforms, and workflow automation.',
        };
      case 'cyber-security-ciso':
        return {
          title: 'Cyber Security, CISO & Compliance Governance',
          subtitle: 'EDR/XDR Defense, Next-Gen Firewalls & Zero-Trust MFA',
          shortDesc: 'Advanced enterprise security suite: next-gen Firewalls, AI-driven EDR endpoint protection, Zero-Trust access, and CISO advisory.',
        };
      case 'cloud-drp-continuity':
        return {
          title: 'Cloud Solutions, Immutable Backup & DRP',
          subtitle: 'Azure/M365 Cloud, WORM Storage & Rapid Business Continuity',
          shortDesc: 'Microsoft 365 and Azure environments, ransomware-proof immutable backups, routine restore testing, and full DRP plans.',
        };
      case 'hardware-procurement':
        return {
          title: 'Surgical Hardware Sizing & Enterprise Supply (Turnkey)',
          subtitle: 'Dell, HPE, Lenovo, Cisco Networks & High-Performance GPU Clusters',
          shortDesc: 'We specialize in surgical hardware sizing for heavy workloads—from large-scale enterprise laptop fleet rollouts and advanced network switching to high-performance GPU compute clusters. Delivering tailored, mission-critical infrastructure rather than generic off-the-shelf boxes.',
        };
      default:
        return { title: svc.title, subtitle: svc.subtitle, shortDesc: svc.shortDesc };
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Wifi': return <Wifi className="w-5 h-5 text-cyan-500" />;
      case 'Server': return <Server className="w-5 h-5 text-blue-500" />;
      case 'HardDrive': return <HardDrive className="w-5 h-5 text-emerald-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-indigo-500" />;
      case 'Lock': return <Lock className="w-5 h-5 text-purple-500" />;
      case 'Cloud': return <Cloud className="w-5 h-5 text-sky-500" />;
      case 'Clock': return <Clock className="w-5 h-5 text-emerald-500" />;
      case 'Database': return <Database className="w-5 h-5 text-cyan-500" />;
      case 'Code': return <Code className="w-5 h-5 text-blue-500" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-purple-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'Monitor': return <Monitor className="w-5 h-5 text-blue-500" />;
      case 'Users': return <Users className="w-5 h-5 text-indigo-500" />;
      default: return <Cpu className="w-5 h-5 text-cyan-500" />;
    }
  };

  const categories = isHe
    ? [
        { id: 'all' as CategoryId, label: 'כל היכולות (7)' },
        { id: 'managed' as CategoryId, label: 'ניהול IT ו-vCIO' },
        { id: 'hardware' as CategoryId, label: 'רכש וחומרה ייעודית' },
        { id: 'projects' as CategoryId, label: 'פרויקטים ותשתיות AI' },
        { id: 'dev' as CategoryId, label: 'פיתוח תוכנה' },
        { id: 'security' as CategoryId, label: 'אבטחת מידע וסייבר' },
        { id: 'cloud' as CategoryId, label: 'ענן ו-Private AI' },
      ]
    : [
        { id: 'all' as CategoryId, label: 'All Capabilities (7)' },
        { id: 'managed' as CategoryId, label: 'Managed IT & vCIO' },
        { id: 'hardware' as CategoryId, label: 'Hardware & Supply' },
        { id: 'projects' as CategoryId, label: 'Projects & AI Infra' },
        { id: 'dev' as CategoryId, label: 'Custom Software' },
        { id: 'security' as CategoryId, label: 'Cyber & CISO' },
        { id: 'cloud' as CategoryId, label: 'Cloud & Private AI' },
      ];

  return (
    <section id="services" className={`py-8 sm:py-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={servicesCloudBg || '/services_cloud_hero.jpg'}
        fallbackSrc="/services_cloud_hero.jpg"
        alt="TECH-SELECT Enterprise Cloud & IT Operations Architecture"
        glowColor="bg-blue-600"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header with Linear Cinematic Entrance Animations */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border animate-linear-eyebrow ${
            isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' : 'bg-slate-100 border-slate-200 text-blue-800'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>SOLUTIONS & CAPABILITIES ARCHITECTURE</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-extrabold font-heading tracking-tight animate-linear-title ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isHe ? (
              <>
                מפת היכולות והשירותים של <span className="gemini-text-gradient">TECH-SELECT</span>
              </>
            ) : (
              <>
                TECH-SELECT <span className="gemini-text-gradient">Capabilities & Solutions Map</span>
              </>
            )}
          </h2>
          <p className={`text-base sm:text-lg leading-relaxed font-normal animate-linear-subtitle ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isHe
              ? 'מעטפת טכנולוגית מלאה: ניהול IT מנוהל, פרויקטים מורכבים, פיתוח תוכנה, ענן ואבטחת מידע תחת גורם אחד אחראי.'
              : 'Complete technology governance: managed IT, complex projects, custom software development, cloud, and cybersecurity.'}
          </p>

          {/* Category Filter Pills with Linear Soft Scale Reveal */}
          <div className="pt-4 flex flex-wrap justify-center gap-2 animate-linear-cta">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? isDark
                      ? 'bg-white/[0.14] text-white border border-white/25 shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : isDark
                      ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Standard Services Grid (Balanced 2x3 layout) */}
        {standardServices.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {standardServices.map((svc) => {
              const enData = getServiceEnData(svc);
              const title = isHe ? svc.title : enData.title;
              const subtitle = isHe ? svc.subtitle : enData.subtitle;
              const shortDesc = isHe ? svc.shortDesc : enData.shortDesc;

              return (
                <SpotlightCard
                  key={svc.id}
                  className={`p-7 flex flex-col justify-between text-right border rounded-2xl transition-all duration-300 shadow-sm ${
                    isDark
                      ? 'bg-[#090d16]/85 border-white/[0.08] hover:border-cyan-400/40 hover:bg-[#0c1220]'
                      : 'bg-white border-slate-300/80 hover:border-blue-500/40 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className={`p-3 rounded-xl border ${
                        isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-blue-50 border-blue-100'
                      }`}>
                        {renderIcon(svc.iconName)}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(isHe ? svc.highlightBadgeHe : svc.highlightBadgeEn) && (
                          <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                            isDark 
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                              : 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                          }`}>
                            {isHe ? svc.highlightBadgeHe : svc.highlightBadgeEn}
                          </span>
                        )}
                        {svc.popular && (
                          <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                            isDark ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/20' : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {isHe ? 'יכולת ליבה' : 'CORE CAPABILITY'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-lg font-bold font-heading mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {title}
                      </h3>
                      <p className={`text-xs font-semibold mb-2.5 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                        {subtitle}
                      </p>
                      <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {shortDesc}
                      </p>
                    </div>

                    {/* High-Impact Highlight Callout */}
                    {(isHe ? svc.highlightHe : svc.highlightEn) && (
                      <div className={`p-3 rounded-xl border text-[11px] leading-relaxed font-medium flex items-start gap-2 ${
                        isDark 
                          ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200 shadow-xs' 
                          : 'bg-blue-50/90 border-blue-200 text-blue-950 shadow-xs'
                      }`}>
                        <Sparkles className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        <span>{isHe ? svc.highlightHe : svc.highlightEn}</span>
                      </div>
                    )}

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {svc.techStack.slice(0, 3).map((tech, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                            isDark
                              ? 'bg-white/[0.02] border-white/[0.06] text-slate-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'border-white/[0.08]' : 'border-slate-100'
                  }`}>
                    <button
                      onClick={() => setSelectedService(svc)}
                      className={`text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-700 hover:text-blue-900'
                      }`}
                    >
                      <span>{isHe ? 'פירוט הנדסי מלא' : 'Full Architecture'}</span>
                      {isHe ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onSelectForQuote(svc.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
                    >
                      {isHe ? 'התייעצות' : 'Consult'}
                    </button>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        )}

        {/* FULL-WIDTH FEATURED SHOWCASE: רכש חומרה ייעודית וציוד ארגוני (Turnkey Supply) */}
        {hardwareService && (() => {
          const hwEnData = getServiceEnData(hardwareService);
          const hwTitle = isHe ? hardwareService.title : hwEnData.title;
          const hwSubtitle = isHe ? hardwareService.subtitle : hwEnData.subtitle;
          const hwShortDesc = isHe ? hardwareService.shortDesc : hwEnData.shortDesc;

          return (
            <div className="mt-8 space-y-6">
              <div
                className={`p-6 sm:p-9 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-lg ${
                  isDark
                    ? 'bg-[#080c16]/95 border-white/[0.12] hover:border-cyan-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
                    : 'bg-white border-slate-300 hover:border-blue-500/50 shadow-md'
                }`}
              >
                {/* Ambient glow backgrounds */}
                <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-blue-600/10 dark:bg-blue-600/15 blur-3xl pointer-events-none" />

                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-inherit relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                        isDark ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30' : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}>
                        {isHe ? 'רכש ציוד וחומרה ייעודית (Turnkey Supply)' : 'ENTERPRISE HARDWARE & TURNKEY SUPPLY'}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                        isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}>
                        {isHe ? 'אינטגרציה פיזית וניהול אחריות (RMA)' : 'PHYSICAL INTEGRATION & DIRECT RMA'}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                        isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}>
                        {isHe ? 'ציוד מקורי Tier-1' : 'Tier-1 OEM Hardware'}
                      </span>
                    </div>

                    <h2 className={`text-2xl sm:text-3xl font-black font-heading tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}>
                      {hwTitle}
                    </h2>

                    <p className={`text-sm sm:text-base font-semibold ${
                      isDark ? 'text-cyan-400' : 'text-blue-700'
                    }`}>
                      {hwSubtitle}
                    </p>
                  </div>

                  {/* Top Action CTAs */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setSelectedService(hardwareService)}
                      className={`text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full border transition-all cursor-pointer flex items-center gap-2 ${
                        isDark
                          ? 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400'
                          : 'border-blue-300 text-blue-800 hover:bg-blue-50 hover:border-blue-500'
                      }`}
                    >
                      <span>{isHe ? 'פירוט הנדסי מלא' : 'Full Architecture'}</span>
                      {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onSelectForQuote(hardwareService.id)}
                      className="text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-sm hover:shadow-blue-500/25"
                    >
                      {isHe ? 'התייעצות ובקשת הצעת מחיר' : 'Consult & Request Quote'}
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-12 gap-6 pt-6 relative z-10">
                  {/* Left Column: Scope & Physical Last-Mile */}
                  <div className="lg:col-span-5 space-y-4">
                    <p className={`text-xs sm:text-sm leading-relaxed font-normal ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {hwShortDesc}
                    </p>

                    {/* High-Impact Highlight Box */}
                    <div className={`p-4 rounded-2xl border text-xs sm:text-[13px] leading-relaxed font-medium space-y-2 ${
                      isDark 
                        ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100 shadow-xs' 
                        : 'bg-blue-50/90 border-blue-200 text-blue-950 shadow-xs'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-heading">
                          {isHe ? 'אינטגרציה פיזית וניהול אחריות יצרן (RMA)' : 'Physical Integration & Direct RMA'}
                        </span>
                      </div>
                      <p>
                        {isHe ? hardwareService.highlightHe : hardwareService.highlightEn}
                      </p>
                    </div>

                    {/* SLA Box */}
                    <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                      isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold block text-slate-900 dark:text-white">
                          {isHe ? 'התחייבות אספקה ואיכות' : 'Delivery & Quality SLA'}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {hardwareService.sla}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 6 Core Capabilities */}
                  <div className="lg:col-span-7 space-y-3">
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {isHe ? 'מפרט פתרונות ואספקה ארגונית' : 'ENTERPRISE CAPABILITIES & DEPLOYMENT SCOPE'}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {hardwareService.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                            isDark
                              ? 'bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]'
                              : 'bg-slate-50/80 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className={`text-xs leading-relaxed font-medium ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tech Stack & Brand Ecosystem */}
                    <div className="pt-3">
                      <span className={`text-[11px] font-mono block mb-2 font-semibold ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {isHe ? 'יצרני חומרה נבחרים באפיון ורכש:' : 'Core OEM Partners & Fleet Sizing:'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {hardwareService.techStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className={`text-[11px] font-mono px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-white/[0.03] border-white/[0.1] text-cyan-300'
                                : 'bg-slate-100 border-slate-200 text-blue-900 font-semibold'
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Directly Underneath: Marquee of OEM Hardware Manufacturers & Solutions */}
              <HardwareManufacturersMarquee />
            </div>
          );
        })()}

      </div>

      {/* Service Modal */}
      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onSelectForQuote={onSelectForQuote}
        />
      )}
    </section>
  );
};
