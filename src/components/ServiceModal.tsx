import React from 'react';
import { ServiceItem } from '../types';
import { X, CheckCircle2, ShieldCheck, Server, Cloud, Database, Wifi, Cpu, Monitor, Users, ArrowLeft, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onSelectForQuote: (serviceId: string) => void;
}

const SERVICE_MODAL_EN_DATA: Record<string, {
  title: string;
  subtitle: string;
  fullDesc: string;
  features: string[];
  slaTitle: string;
  slaDesc: string;
}> = {
  'private-ai-onprem': {
    title: 'Private AI & On-Prem LLM Infrastructure',
    subtitle: 'Dedicated AI Servers, Air-Gapped GPU Topologies & Local LLMs',
    fullDesc: 'TECH-SELECT Private AI infrastructure enables organizations to adopt cutting-edge LLMs and generative AI capabilities with zero data risk. We specify, procure, and configure high-performance on-prem compute servers (such as Dell PowerEdge with dual NVIDIA enterprise accelerators), establish hermetically isolated air-gapped perimeters, and deploy open-weight foundation models (Llama 3, DeepSeek, Mistral) alongside private Vector databases. Your enterprise data never crosses physical boundary lines, eliminating risks of IP leakage or public model training.',
    features: [
      'Capex model & zero cloud rent: 100% offline LLM execution with zero external token fees',
      'Architectural design & deployment of dedicated on-prem GPU compute clusters',
      'Hermetic Air-Gapped deployment with zero outbound internet connectivity',
      'Local foundation models (Llama 3, DeepSeek, Mistral) optimized for enterprise workloads',
      'Local Vector Databases & RAG pipelines for secure internal document indexing',
      'Strict Role-Based Access Control (RBAC) preventing unauthorized internal data exposure'
    ],
    slaTitle: 'Hermetic Isolation & On-Prem GPU Performance',
    slaDesc: '100% data sovereignty, zero leakage, and rapid local inference speeds'
  },
  'managed-it-systems': {
    title: 'Comprehensive Managed IT & Strategic vCIO Services',
    subtitle: 'Full Systems Governance, Workstations, M365 & IT Budgeting',
    fullDesc: 'TECH-SELECT operates as the executive engineering extension of your organization. We assume turnkey accountability over system architecture, employee workstations, physical servers, cloud infrastructure, identity governance, and day-to-day user support. Our service includes 24/7 proactive telemetry monitoring, rigorous SLA-backed live helpdesk response, intelligent SaaS FinOps license optimization, and strategic vCIO roadmapping that eliminates wasteful tech expenditures.',
    features: [
      'Continuous turnkey governance of endpoints, on-prem servers, and cloud infrastructure',
      'User identity, Active Directory / Microsoft Entra ID permissions, and M365 tenant management',
      'FinOps license optimization: eliminating zombie seats and duplicate subscriptions',
      'Rapid-response live engineering Helpdesk with guaranteed contractual response times',
      '24/7 proactive Remote Monitoring and Management (RMM) detecting issues before downtime',
      'Strategic vCIO advisory for technology planning and annual budgetary precision'
    ],
    slaTitle: 'High Availability & Proactive Telemetry Governance',
    slaDesc: 'Sub-15 minute live triage, strict contractual response SLA, and continuous monitoring'
  },
  'complex-projects': {
    title: 'Complex IT Projects & Infrastructure Engineering',
    subtitle: 'Zero-Downtime Migrations, Network Architecture & Deployments',
    fullDesc: 'TECH-SELECT excels in leading complex, mission-critical infrastructure projects from conception to turnkey sign-off. From initial architectural discovery, hardware specification, and active network cabling to structured zero-downtime cutovers. We handle office relocations, server room builds, legacy system standardizations, and multisite SD-WAN rollouts.',
    features: [
      'Specification and deployment of structured fiber/copper cabling & enterprise Wi-Fi 6/7',
      'Datacenter commissioning, SAN/NAS high-availability storage, and virtualization clusters',
      'Infrastructure standardization projects, rack rehabilitation, and complete topology mapping',
      'New branch office rollouts, corporate relocations, and encrypted Site-to-Site VPN mesh',
      'Complex system integration across hybrid compute, storage, and networking layers',
      'Generation of comprehensive Site Topology Dossiers and engineering documentation'
    ],
    slaTitle: 'Precision Engineering & Zero-Downtime Migration Execution',
    slaDesc: 'Structured project milestones, comprehensive documentation, and zero operational disruption'
  },
  'software-dev': {
    title: 'Custom Software Development & Enterprise Integrations',
    subtitle: 'Enterprise Applications, Automation Workflows & Deep APIs',
    fullDesc: 'In addition to core IT infrastructure, TECH-SELECT maintains an engineering software division solving bespoke organizational challenges. We design and build custom web and mobile portals, deep bidirectional API bridges synchronizing disparate ERP, CRM, and billing systems, and automated ETL data pipelines that eliminate repetitive manual labor.',
    features: [
      'Tailored web applications, client portals, and bespoke internal workflow dashboards',
      'Deep bidirectional API integrations between ERP (SAP, Priority), CRM (Salesforce, HubSpot), and IT systems',
      'Workflow automation and data ETL pipelines reducing administrative overhead',
      'Custom monitoring dashboards, access audit tools, and executive reporting',
      'Strict compliance with Secure Coding lifecycle standards (OWASP Top 10 & Zero-Trust)',
      'Full ongoing maintenance, version upgrades, and SLA support across the application lifecycle'
    ],
    slaTitle: 'Secure Coding Standards & Continuous Lifecycle Support',
    slaDesc: 'Clean maintainable code, comprehensive automated tests, and dedicated developer support'
  },
  'cyber-security-ciso': {
    title: 'Cyber Security, CISO Advisory & Compliance Governance',
    subtitle: 'Next-Gen EDR/XDR Defense, Perimeter Firewalls & Zero-Trust Access',
    fullDesc: 'TECH-SELECT provides a comprehensive defense envelope shielding corporate assets: enterprise Next-Gen Firewalls (Fortinet, Check Point), AI-driven EDR/XDR endpoint protection, Zero-Trust Conditional Access, server hardening, and fractional CISO advisory ensuring compliance with ISO 27001, CMMC, and cyber insurance prerequisites.',
    features: [
      'Next-Gen Firewall management (Fortinet FortiGate, Check Point Quantum) with active IPS',
      'AI-driven EDR/XDR endpoint and server defense detecting zero-day exploits in real time',
      'Centralized Identity Governance, Multi-Factor Authentication (MFA), and Conditional Access',
      'Corporate email security, advanced anti-phishing filters, and Data Loss Prevention (DLP)',
      'Server and workstation hardening following ISO 27001 and defense industry benchmarks',
      'Fractional CISO as a Service, comprehensive risk assessments, and cyber insurance audit sign-offs'
    ],
    slaTitle: 'Continuous Perimeter Defense & Threat Hunting',
    slaDesc: 'Real-time telemetry, rapid containment protocols, and cleared security specialists'
  },
  'cloud-drp-continuity': {
    title: 'Cloud Architecture, Immutable Backup & Disaster Recovery (DRP)',
    subtitle: 'Microsoft 365, Azure Cloud, WORM Storage & Business Continuity',
    fullDesc: 'We architect, migrate, and govern resilient hybrid cloud ecosystems (Microsoft 365, SharePoint Online, Microsoft Azure) combined with ransomware-proof Disaster Recovery (DRP) systems. Our architectures guarantee that regardless of hardware failure, catastrophic site events, or sophisticated cyber attacks, your enterprise data remains intact with contractually validated recovery time objectives (RTO).',
    features: [
      'Architecture, zero-downtime migration, and governance of Microsoft 365 & SharePoint Online',
      'Microsoft Azure infrastructure design, Virtual Desktop (AVD), and hybrid cloud environments',
      'Automated encrypted backup pipelines adhering to the strict 3-2-1-1-0 resiliency rule',
      'Immutable WORM (Write Once, Read Many) backup storage immune to ransomware tampering',
      'Routine scheduled recovery drills testing real-world database and VM restores',
      'Formal Disaster Recovery Plan (DRP) documentation and operational failover runbooks'
    ],
    slaTitle: 'Guaranteed RTO / RPO Objectives & Cloud Uptime',
    slaDesc: 'Rapid disaster recovery, verifiable backup restores, and 99.99% cloud resiliency'
  },
  'hardware-procurement': {
    title: 'Surgical Hardware Sizing & Enterprise Supply (Turnkey)',
    subtitle: 'Tier-1 Enterprise Laptops, Network Infrastructure & GPU Clusters',
    fullDesc: 'At TECH-SELECT, we don\'t drop off generic boxes—we act as hardware and infrastructure architects. We specialize in bespoke, surgical sizing of Tier-1 enterprise equipment for high-intensity workloads: massive corporate laptop fleet rollouts (Lenovo ThinkPad, Dell Latitude, Apple Enterprise), complex routing and switching fabrics (Cisco, Aruba, Fortinet), high-density SAN/NAS storage, and multi-GPU compute clusters. Every device undergoes pre-configuration, burn-in testing, and secure golden image deployment before leaving our staging center.',
    features: [
      'Complete on-site physical integration (Last Mile), rack cabling, and clean cable management',
      'Direct manufacturer warranty management and real-time RMA handling (Dell, HPE, Lenovo, Cisco)',
      'Surgical hardware sizing tailored to real workload requirements rather than generic specs',
      'Large-scale enterprise laptop and mobile workstation procurement and staging',
      'High-performance GPU servers and workstations (Dell PowerEdge, HPE ProLiant, NVIDIA)',
      'Pre-configuration, secure corporate image provisioning, and hardware burn-in testing'
    ],
    slaTitle: 'Original Tier-1 Hardware & On-Site Warranty Management',
    slaDesc: 'Authentic enterprise equipment, extended manufacturer warranties, and direct RMA handling'
  }
};

export const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, onSelectForQuote }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  if (!service) return null;

  const enData = SERVICE_MODAL_EN_DATA[service.id];
  const modalTitle = (!isHe && enData) ? enData.title : service.title;
  const modalSubtitle = (!isHe && enData) ? enData.subtitle : service.subtitle;
  const modalFullDesc = (!isHe && enData) 
    ? enData.fullDesc 
    : (service.fullDesc || (service as any).fullDescription || (service as any).description || service.shortDesc);
  const modalFeatures = (!isHe && enData) ? enData.features : (service.features || (service as any).capabilities || []);
  const modalSlaTitle = (!isHe && enData) ? enData.slaTitle : (isHe ? 'מחויבות לזמני תגובה (SLA מנוהל)' : 'Dedicated SLA Response Time');
  const modalSlaDesc = (!isHe && enData) ? enData.slaDesc : (isHe ? 'מענה מהיר מתחייב, מוקד Helpdesk ישיר וצוות כוננות' : 'Guaranteed rapid response & cleared engineering team');

  const renderIcon = (name: string) => {
    const iconClass = `w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`;
    switch (name) {
      case 'Server': return <Server className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'Cloud': return <Cloud className={iconClass} />;
      case 'Database': return <Database className={iconClass} />;
      case 'Wifi': return <Wifi className={iconClass} />;
      case 'Cpu': return <Cpu className={iconClass} />;
      case 'Monitor': return <Monitor className={iconClass} />;
      case 'Users': return <Users className={iconClass} />;
      default: return <Server className={iconClass} />;
    }
  };

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
        <div className={`relative p-6 border-b flex items-start justify-between ${
          isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border shadow-xs ${
              isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-slate-200'
            }`}>
              {renderIcon(service.iconName)}
            </div>
            <div>
              <span className={`text-xs font-sans font-bold uppercase tracking-wider block ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`}>
                {modalSubtitle}
              </span>
              <h2 className={`text-xl sm:text-2xl font-bold font-heading ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {modalTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors shadow-2xs cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]'
                : 'text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border-slate-200'
            }`}
            aria-label={isHe ? 'סגירה' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Strategic Differentiator Highlight */}
          {(isHe ? service.highlightHe : service.highlightEn) && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              isDark 
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200' 
                : 'bg-blue-50/90 border-blue-200 text-blue-950'
            }`}>
              <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <div>
                {(isHe ? service.highlightBadgeHe : service.highlightBadgeEn) && (
                  <span className={`inline-block text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${
                    isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isHe ? service.highlightBadgeHe : service.highlightBadgeEn}
                  </span>
                )}
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  {isHe ? service.highlightHe : service.highlightEn}
                </p>
              </div>
            </div>
          )}

          {/* Full Description */}
          <div>
            <h3 className={`text-xs font-sans font-bold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {isHe ? 'אודות השירות' : 'About the Service'}
            </h3>
            <p className={`leading-relaxed font-normal text-sm sm:text-base ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {modalFullDesc}
            </p>
          </div>

          {/* Capabilities List */}
          <div>
            <h3 className={`text-xs font-sans font-bold uppercase tracking-wider mb-3 ${
              isDark ? 'text-cyan-400' : 'text-blue-600'
            }`}>
              {isHe ? 'מפרט יכולות ורכיבי השירות' : 'Core Capabilities & Deliverables'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {modalFeatures.map((cap: string, idx: number) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    isDark 
                      ? 'bg-white/[0.03] border-white/[0.06] hover:border-cyan-500/30' 
                      : 'bg-slate-50 border-slate-200/80 hover:border-blue-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className={`text-xs font-medium leading-relaxed ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SLA & Delivery Commitment */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark 
              ? 'bg-[#0b1322] border-cyan-500/20' 
              : 'bg-blue-50/80 border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white border-blue-200 text-blue-600'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {modalSlaTitle}
                </span>
                <span className={`text-[11px] ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {modalSlaDesc}
                </span>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-sans font-bold border ${
              isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40' : 'bg-white text-blue-800 border-blue-200 shadow-2xs'
            }`}>
              24/7 / SLA 99.99%
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 sm:p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
        }`}>
          <a
            href={COMPANY_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full sm:w-auto px-4 py-2.5 rounded-full border text-xs font-sans font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isDark 
                ? 'bg-emerald-950/40 hover:bg-emerald-950/70 border-emerald-500/30 text-emerald-300' 
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}
          >
            <span>{isHe ? 'שאלות ב-WhatsApp' : 'Inquire via WhatsApp'}</span>
          </a>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300' 
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {isHe ? 'סגירה' : 'Close'}
            </button>

            <button
              onClick={() => {
                onClose();
                onSelectForQuote(service.id);
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isHe ? 'קבלת הצעת מחיר' : 'Request a Proposal'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
