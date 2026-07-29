import React, { useState } from 'react';
import { SECTORS_DATA } from '../data/content';
import { Scale, Stethoscope, TrendingUp, Rocket, Building, Factory, ChevronLeft, ChevronRight, CheckCircle2, Globe, ShieldAlert } from 'lucide-react';
import { SectorItem } from '../types';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';

export const SectorsSection: React.FC = () => {
  const { isHe } = useLanguage();
  const [activeSector, setActiveSector] = useState<SectorItem>(SECTORS_DATA[0]);

  const renderIcon = (name: string) => {
    switch (name) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
      case 'Scale': return <Scale className="w-5 h-5 text-blue-400" />;
      case 'Stethoscope': return <Stethoscope className="w-5 h-5 text-emerald-400" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-sky-400" />;
      case 'Rocket': return <Rocket className="w-5 h-5 text-purple-400" />;
      case 'Building': return <Building className="w-5 h-5 text-cyan-400" />;
      case 'Factory': return <Factory className="w-5 h-5 text-blue-400" />;
      default: return <Building className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getSectorEn = (sec: SectorItem) => {
    switch (sec.id) {
      case 'defense-classified':
        return {
          title: 'Defense Industries & Classified Facilities',
          subtitle: 'Extensive experience with cleared facilities & high compliance',
          challenges: [
            'Strict defense regulations exceeding standard civilian requirements',
            'Air-gapped isolated networks, endpoint hardening & security procedures',
            'Need for cleared IT personnel experienced with sensitive facilities'
          ],
          solutions: [
            'IT engineers holding active security clearances & discrete orientation',
            'Architecture & setup of air-gapped networks & local hardware encryption',
            'Endpoint hardening, DLP controls, HSM hardware & compliance audits'
          ]
        };
      case 'law-accounting':
        return {
          title: 'Law Firms & Accounting',
          subtitle: 'Absolute confidentiality, file availability & client security',
          challenges: [
            'Requirement for strict confidentiality and attorney-client privilege',
            'Immutable encrypted backup to eliminate ransomware risks',
            'Specialized software support (Comet, Harmony, Hashavshevet, CRM)'
          ],
          solutions: [
            'Security hardening, full disk encryption & granular access controls',
            'Dual encrypted cloud backups with monthly recovery verification',
            'Fast helpdesk resolution & live support for office personnel'
          ]
        };
      case 'medical-clinics':
        return {
          title: 'Medical Clinics & Healthcare',
          subtitle: 'HIPAA/Privacy compliance & zero medical system downtime',
          challenges: [
            'Strict patient privacy standards and medical record security',
            'Zero tolerance for appointment scheduling & EHR system downtime',
            'Secure multi-site communication between branch clinics'
          ],
          solutions: [
            'Hardened IT solutions tailored for medical software & patient data',
            'Uninterruptible Power Supply (UPS) & redundant network backbones',
            'Secure multi-factor (MFA) remote access for physicians'
          ]
        };
      case 'finance-insurance':
        return {
          title: 'Finance & Insurance',
          subtitle: 'Advanced cybersecurity, regulator & cyber insurance compliance',
          challenges: [
            'Targeted phishing attacks and financial data breach risks',
            'Strict insurance prerequisites (AI EDR, 24/7 SOC, MFA)',
            'Complex permission matrices across accounting & trading platforms'
          ],
          solutions: [
            'AI-driven EDR/XDR suite with Data Loss Prevention (DLP)',
            'Audit preparation & security certificate issuance for cyber insurance',
            'Real-time threat monitoring and incident containment'
          ]
        };
      case 'startups-tech':
        return {
          title: 'High-Tech & Startups',
          subtitle: 'High-speed networking, OEM business hardware & IP defense',
          challenges: [
            'Rapid scaling requiring fast equipment procurement & laptop setup',
            'Protecting source code, IP, Git repositories, and cloud workloads',
            'Global distributed workforce operating worldwide'
          ],
          solutions: [
            'Pre-configured business laptop & workstation procurement',
            'High-throughput enterprise Wi-Fi and managed switching',
            'Centralized identity management (M365/Azure AD) & endpoint security'
          ]
        };
      case 'public-ngo':
        return {
          title: 'Public Institutions & NGOs',
          subtitle: 'Budget optimization, non-profit licensing & continuous operations',
          challenges: [
            'Limited budgets requiring maximal cost-efficiency',
            'Heterogeneous legacy hardware requiring maintenance',
            'Accessing non-profit software licensing grants'
          ],
          solutions: [
            'Implementation of Microsoft / Google non-profit donation grants',
            'Infrastructure alignment projects maximizing existing hardware life',
            'Proactive maintenance extending server and desktop longevity'
          ]
        };
      case 'industry-logistics':
        return {
          title: 'Manufacturing & Logistics',
          subtitle: 'Rugged field infrastructure, scanner connectivity & manufacturing uptime',
          challenges: [
            'Challenging physical environments (warehouses, factories, assembly lines)',
            'Connecting handheld barcode scanners, printers & WMS/ERP systems',
            'IT outages causing immediate production line and shipping stops'
          ],
          solutions: [
            'Ruggedized enterprise Wi-Fi coverage across warehouse floors',
            'Extended support hours for critical factory shifts',
            'Full network redundancy preventing manufacturing interruptions'
          ]
        };
      default:
        return { title: sec.title, subtitle: sec.subtitle, challenges: sec.challenges, solutions: sec.solutions };
    }
  };

  const currentEn = getSectorEn(activeSector);
  const title = isHe ? activeSector.title : currentEn.title;
  const subtitle = isHe ? activeSector.subtitle : currentEn.subtitle;
  const challenges = isHe ? activeSector.challenges : currentEn.challenges;
  const solutions = isHe ? activeSector.solutions : currentEn.solutions;

  return (
    <section id="sectors" className="py-20 bg-[#0b0c10] text-slate-100 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>SECTOR SPECIALIZATION 360°</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            {isHe ? (
              <>
                מלווים חברות ביטחוניות <span className="gemini-text-gradient">וארגונים מובילים</span>
              </>
            ) : (
              <>
                Tailored IT for Defense <span className="gemini-text-gradient">& Enterprise Sectors</span>
              </>
            )}
          </h2>
          <p className="text-slate-300 text-base font-normal">
            {isHe
              ? 'מחברות ביטחוניות ומפעלים מסווגים – ועד הייטק, פיננסים וארגונים רגישים.'
              : 'From defense contractors and classified plants to high-tech, finance, and enterprise orgs.'}
          </p>
        </div>

        {/* Sectors Tabs & Detail Box */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Sector Buttons (Left) */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            {SECTORS_DATA.map((sec) => {
              const isSelected = activeSector.id === sec.id;
              const secEn = getSectorEn(sec);
              const secTitle = isHe ? sec.title : secEn.title;
              const secSub = isHe ? sec.subtitle : secEn.subtitle;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSector(sec)}
                  className={`p-4 rounded-2xl text-right transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 text-white shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-white/10 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                    {renderIcon(sec.iconName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{secTitle}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{secSub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Sector Detailed View (Right) */}
          <SpotlightCard className="lg:col-span-7 gemini-card p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="p-3 rounded-2xl bg-white/5 text-cyan-400 border border-white/10">
                  {renderIcon(activeSector.iconName)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-heading">{title}</h3>
                  <p className="text-xs text-cyan-400 font-mono font-medium">{subtitle}</p>
                </div>
              </div>

              {/* Challenges */}
              <div>
                <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-3">
                  {isHe ? 'אתגרי המחשוב והאבטחה במגזר' : 'Sector IT & Security Challenges'}
                </h4>
                <div className="space-y-2">
                  {challenges.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl text-xs text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-3">
                  {isHe ? 'פתרון TECH-SELECT' : 'TECH-SELECT Solution'}
                </h4>
                <div className="space-y-2">
                  {solutions.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl text-xs text-slate-100 font-bold border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex justify-end">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium px-5 py-2.5 rounded-full text-xs shadow-md transition-all"
              >
                <span>{isHe ? `התאימו פתרון IT למגזר ${title}` : `Tailor Solution for ${title}`}</span>
                {isHe ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </a>
            </div>

          </SpotlightCard>

        </div>

      </div>
    </section>
  );
};
