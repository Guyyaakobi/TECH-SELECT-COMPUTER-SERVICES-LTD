import React, { useState } from 'react';
import { SECTORS_DATA } from '../data/content';
import { Scale, Stethoscope, TrendingUp, Rocket, Building, Factory, ChevronLeft, ChevronRight, CheckCircle2, Globe, ShieldAlert } from 'lucide-react';
import { SectorItem } from '../types';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import sectorsIndustryBg from '../assets/images/sectors_industry_hero.jpg';

export const SectorsSection: React.FC = () => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [activeSector, setActiveSector] = useState<SectorItem>(SECTORS_DATA[0]);

  const renderIcon = (name: string) => {
    switch (name) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-cyan-500" />;
      case 'Scale': return <Scale className="w-5 h-5 text-blue-500" />;
      case 'Stethoscope': return <Stethoscope className="w-5 h-5 text-emerald-500" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-sky-500" />;
      case 'Rocket': return <Rocket className="w-5 h-5 text-purple-500" />;
      case 'Building': return <Building className="w-5 h-5 text-cyan-500" />;
      case 'Factory': return <Factory className="w-5 h-5 text-blue-500" />;
      default: return <Building className="w-5 h-5 text-cyan-500" />;
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
    <section id="sectors" className={`py-8 sm:py-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={sectorsIndustryBg || '/sectors_industry_hero.jpg'}
        fallbackSrc="/sectors_industry_hero.jpg"
        alt="TECH-SELECT Metropolitan Industry & Enterprise Skyline"
        glowColor="bg-sky-600"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border animate-linear-eyebrow ${
            isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' : 'bg-slate-100 border-slate-200 text-blue-800'
          }`}>
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>SECTOR SPECIALIZATION 360°</span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold font-heading tracking-tight animate-linear-title ${isDark ? 'text-white' : 'text-slate-950'}`}>
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
          <p className={`text-base font-normal animate-linear-subtitle ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isHe
              ? 'מחברות ביטחוניות ומפעלים מסווגים - ועד הייטק, פיננסים וארגונים רגישים.'
              : 'From defense contractors and classified plants to high-tech, finance, and enterprise orgs.'}
          </p>
        </div>

        {/* Sectors Tabs & Detail Box */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Sector Buttons (Left) with Linear Soft Scale */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 animate-linear-cta">
            {SECTORS_DATA.map((sec) => {
              const isSelected = activeSector.id === sec.id;
              const secEn = getSectorEn(sec);
              const secTitle = isHe ? sec.title : secEn.title;
              const secSub = isHe ? sec.subtitle : secEn.subtitle;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSector(sec)}
                  className={`p-4 rounded-2xl text-right transition-all flex items-center gap-3.5 cursor-pointer border ${
                    isSelected
                      ? isDark 
                        ? 'bg-[#0e1424] border-cyan-500/40 text-white shadow-sm ring-1 ring-cyan-500/20' 
                        : 'bg-white border-blue-600 text-blue-950 shadow-sm ring-1 ring-blue-600/20'
                      : isDark
                        ? 'bg-[#090d16]/80 hover:bg-[#0c1220] border-white/[0.08] text-slate-300 hover:text-white'
                        : 'bg-slate-50 hover:bg-white border-slate-300/80 text-slate-700 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 border ${
                    isSelected 
                      ? isDark ? 'bg-white/[0.08] border-white/20 text-cyan-300' : 'bg-blue-100 border-blue-200 text-blue-700' 
                      : isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
                  }`}>
                    {renderIcon(sec.iconName)}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isSelected && !isDark ? 'text-blue-950 font-extrabold' : ''}`}>{secTitle}</h3>
                    <p className={`text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{secSub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Sector Detailed View (Right) */}
          <SpotlightCard className={`lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between rounded-2xl border transition-all ${
            isDark ? 'bg-[#090d16]/85 border-white/[0.08]' : 'bg-white border-slate-300/80 shadow-sm'
          }`}>
            <div className="space-y-6">
              <div className={`flex items-center gap-3 pb-4 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.04] text-cyan-400 border-white/[0.08]' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {renderIcon(activeSector.iconName)}
                </div>
                <div>
                  <h3 className={`text-2xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
                  <p className={`text-xs font-sans font-semibold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>{subtitle}</p>
                </div>
              </div>

              {/* Challenges */}
              <div>
                <h4 className={`text-xs font-sans font-bold uppercase tracking-wider mb-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {isHe ? 'אתגרי המחשוב והאבטחה במגזר' : 'Sector IT & Security Challenges'}
                </h4>
                <div className="space-y-2">
                  {challenges.map((c, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium border ${
                      isDark 
                        ? 'bg-white/[0.03] text-slate-300 border-white/[0.06]' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <h4 className={`text-xs font-sans font-bold uppercase tracking-wider mb-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {isHe ? 'פתרון TECH-SELECT' : 'TECH-SELECT Solution'}
                </h4>
                <div className="space-y-2">
                  {solutions.map((s, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold border ${
                      isDark 
                        ? 'bg-white/[0.04] text-slate-200 border-white/[0.08]' 
                        : 'bg-blue-50/80 text-blue-950 border-blue-200'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`pt-6 mt-6 border-t flex justify-end ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-full text-xs shadow-md shadow-blue-600/20 transition-all"
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
