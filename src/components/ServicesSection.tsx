import React, { useState } from 'react';
import { SERVICES_DATA } from '../data/content';
import { ServiceItem } from '../types';
import { ServiceModal } from './ServiceModal';
import { Server, ShieldCheck, Cloud, Database, Wifi, Cpu, Monitor, Users, Sparkles, ArrowLeft, ArrowRight, Lock, Clock, Code, HardDrive, CheckCircle2, Truck, Wrench, Shield } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import { HardwareManufacturersMarquee } from './HardwareManufacturersMarquee';
import servicesCloudBg from '../assets/images/services_cloud_hero.jpg';

interface ServicesSectionProps {
  onSelectForQuote: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectForQuote }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'all' | 'managed' | 'projects' | 'dev' | 'security' | 'cloud'>('all');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const filteredServices = SERVICES_DATA.filter((svc) => {
    if (activeCategory === 'managed') return svc.id === 'managed-it-systems' || svc.id === 'hardware-procurement';
    if (activeCategory === 'projects') return svc.id === 'complex-projects' || svc.id === 'private-ai-onprem';
    if (activeCategory === 'dev') return svc.id === 'software-dev';
    if (activeCategory === 'security') return svc.id === 'cyber-security-ciso' || svc.id === 'private-ai-onprem';
    if (activeCategory === 'cloud') return svc.id === 'cloud-drp-continuity' || svc.id === 'private-ai-onprem';
    return true;
  });

  const regularServices = filteredServices.filter((svc) => svc.id !== 'hardware-procurement');
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
        { id: 'all', label: 'כל היכולות (7)' },
        { id: 'managed', label: 'ניהול IT ו-vCIO' },
        { id: 'projects', label: 'פרויקטים ותשתיות AI' },
        { id: 'dev', label: 'פיתוח תוכנה' },
        { id: 'security', label: 'אבטחת מידע וסייבר' },
        { id: 'cloud', label: 'ענן ו-Private AI' },
      ]
    : [
        { id: 'all', label: 'All Capabilities (7)' },
        { id: 'managed', label: 'Managed IT & vCIO' },
        { id: 'projects', label: 'Projects & AI Infra' },
        { id: 'dev', label: 'Custom Software' },
        { id: 'security', label: 'Cyber & CISO' },
        { id: 'cloud', label: 'Cloud & Private AI' },
      ];

  return (
    <section id="services" className={`pt-36 sm:pt-40 pb-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
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

        {/* Services Grid (Regular Capabilities) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularServices.map((svc) => {
            const enData = getServiceEnData(svc);
            const title = isHe ? svc.title : enData.title;
            const subtitle = isHe ? svc.subtitle : enData.subtitle;
            const shortDesc = isHe ? svc.shortDesc : enData.shortDesc;

            return (
              <SpotlightCard
                key={svc.id}
                className="p-7 flex flex-col justify-between text-right"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className={`p-2.5 rounded-xl ${
                      isDark ? 'bg-white/[0.04] text-cyan-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {renderIcon(svc.iconName)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(isHe ? svc.highlightBadgeHe : svc.highlightBadgeEn) && (
                        <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                          isDark 
                            ? 'bg-amber-500/10 text-amber-300' 
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}>
                          {isHe ? svc.highlightBadgeHe : svc.highlightBadgeEn}
                        </span>
                      )}
                      {svc.popular && (
                        <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                          isDark ? 'bg-cyan-950/40 text-cyan-300' : 'bg-blue-50 text-blue-800'
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
                    <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {shortDesc}
                    </p>
                  </div>

                  {/* High-Impact Highlight Callout - Clean Editorial Accent */}
                  {(isHe ? svc.highlightHe : svc.highlightEn) && (
                    <div className={`border-s-2 ps-3 py-1 text-[11.5px] leading-relaxed flex items-start gap-2 ${
                      isDark 
                        ? 'border-cyan-500/60 text-cyan-200/90' 
                        : 'border-blue-600 text-blue-950'
                    }`}>
                      <Sparkles className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                      <span>{isHe ? svc.highlightHe : svc.highlightEn}</span>
                    </div>
                  )}

                  {/* Tech Stack - Clean Inline Monospace Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
                    {svc.techStack.slice(0, 3).map((tech, idx) => (
                      <span
                        key={idx}
                        className={isDark ? 'text-slate-400' : 'text-slate-600'}
                      >
                        {idx > 0 && <span className="opacity-40 me-2">·</span>}
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

        {/* FULL-WIDTH DEDICATED HARDWARE & OEM PROCUREMENT SHOWCASE */}
        {hardwareService && (
          <div className="mt-10 sm:mt-12">
            <SpotlightCard
              className={`p-6 sm:p-10 text-right border rounded-3xl transition-all duration-300 backdrop-blur-md ${
                isDark
                  ? 'bg-white/[0.02] border-white/[0.08]'
                  : 'bg-white/75 border-slate-200/80 shadow-xs'
              }`}
            >
              {/* Header Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-inherit">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <HardDrive className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs font-sans font-bold px-3 py-1 rounded-full ${
                        isDark 
                          ? 'bg-amber-500/10 text-amber-300' 
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {isHe ? 'אינטגרציה פיזית ו-RMA ישיר' : 'Physical Integration & Direct RMA'}
                      </span>
                      <span className={`text-xs font-sans font-bold px-3 py-1 rounded-full ${
                        isDark ? 'bg-cyan-950/40 text-cyan-300' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {isHe ? 'רכש מותאם אישית (Turnkey Supply)' : 'Turnkey OEM Procurement'}
                      </span>
                    </div>

                    <h3 className={`text-2xl sm:text-3xl font-extrabold font-heading tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {isHe ? hardwareService.title : getServiceEnData(hardwareService).title}
                    </h3>
                    <p className={`text-sm sm:text-base font-semibold mt-1 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                      {isHe ? hardwareService.subtitle : getServiceEnData(hardwareService).subtitle}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    onClick={() => setSelectedService(hardwareService)}
                    className={`text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full border transition-all cursor-pointer flex items-center gap-2 ${
                      isDark 
                        ? 'border-white/15 text-slate-200 hover:border-cyan-400 hover:text-white bg-white/5' 
                        : 'border-slate-300 text-slate-800 hover:border-blue-500 hover:text-blue-900 bg-white'
                    }`}
                  >
                    <span>{isHe ? 'פירוט הנדסי מלא' : 'Full Architecture'}</span>
                    {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onSelectForQuote(hardwareService.id)}
                    className="text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>{isHe ? 'התייעצות ורכש חומרה' : 'Consult & Hardware Quote'}</span>
                  </button>
                </div>
              </div>

              {/* Main Narrative */}
              <div className="py-6">
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe ? hardwareService.shortDesc : getServiceEnData(hardwareService).shortDesc}
                </p>
              </div>

              {/* 3 Pillars of Hardware Excellence - Open Editorial Split */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-6 divide-y md:divide-y-0 ${
                isHe ? 'md:divide-x-reverse' : ''
              } md:divide-x ${
                isDark ? 'divide-white/[0.08]' : 'divide-slate-200'
              }`}>
                <div className={`space-y-2 ${isHe ? 'md:pl-6' : 'md:pr-6'}`}>
                  <div className="flex items-center gap-2.5">
                    <Server className="w-5 h-5 text-blue-500 shrink-0" />
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isHe ? 'אפיון כירורגי לעומסי קצה' : 'Surgical Workload Sizing'}
                    </h4>
                  </div>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe 
                      ? 'עסקאות ענק של ניידים לאנטרפרייז (Lenovo, Dell, Apple), שרתי GPU ומערכי אחסון מהירים – מותאמים במדויק לצורכי הארגון.' 
                      : 'Enterprise laptop fleets (Lenovo, Dell, Apple), high-performance GPU clusters and storage arrays sized for your real workloads.'}
                  </p>
                </div>

                <div className={`pt-4 md:pt-0 space-y-2 ${isHe ? 'md:px-6' : 'md:px-6'}`}>
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isHe ? 'אינטגרציה פיזית ו-Last Mile' : 'On-Site Physical Deployment'}
                    </h4>
                  </div>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe 
                      ? 'לא רק משלוח קופסאות: התקנה פיזית באתר הלקוח, סידור ארונות תקשורת, חיווט מוקפד, התקנת אימג\' מאובטח ובדיקות עומס.' 
                      : 'More than shipping: on-site physical rack assembly, meticulous cabling, pre-configuration, secure golden image and burn-in tests.'}
                  </p>
                </div>

                <div className={`pt-4 md:pt-0 space-y-2 ${isHe ? 'md:pr-6' : 'md:pl-6'}`}>
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-purple-500 shrink-0" />
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isHe ? 'אחריות יצרן מלאה ו-RMA ישיר' : 'Official Warranty & RMA'}
                    </h4>
                  </div>
                  <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe 
                      ? 'ניהול ספקים ואחריות מול היצרנים בזמן אמת. כתובת הנדסית אחת לכל כשל חומרתי עם אספקת חלפים והחלפה מהירה.' 
                      : 'End-to-end OEM vendor warranty management. Single engineering point-of-contact for all RMAs, spare parts and fast replacements.'}
                  </p>
                </div>
              </div>

              {/* Integrated Hardware Manufacturers Ecosystem inside the unified card */}
              <HardwareManufacturersMarquee embedded />
            </SpotlightCard>
          </div>
        )}

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
