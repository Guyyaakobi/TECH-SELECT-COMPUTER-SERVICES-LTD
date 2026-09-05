import React, { useState } from 'react';
import { ARTICLES_DATA } from '../data/content';
import { ArticleItem } from '../types';
import { ArticleModal } from './ArticleModal';
import { BookOpen, Search, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import knowledgeCenterBg from '../assets/images/knowledge_center_hero.jpg';

export const KnowledgeCenterSection: React.FC = () => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<ArticleItem | null>(null);

  const getArticleEn = (art: ArticleItem): ArticleItem => {
    switch (art.id) {
      case 'private-ai-onprem-security':
        return {
          ...art,
          title: 'The Silent Hazard in Enterprise AI: Preventing Data Leakage with Private On-Prem AI Topologies',
          categoryLabel: 'AI & Cybersecurity',
          summary: 'Public AI tools expose enterprises to grave IP leakage and compliance risks. How deploying local air-gapped Private AI servers resolves this dilemma, enabling breakthrough innovation with zero security compromise.',
          readTime: '4 min read',
          date: 'August 18, 2026',
          author: 'TECH-SELECT Private AI & Cyber Defense Unit',
          content: `The artificial intelligence revolution has become an indispensable driver of enterprise velocity. However, it has simultaneously introduced one of the most critical cybersecurity and intellectual property vulnerabilities in recent history: unmanaged employee usage of public AI tools with confidential business data, source code, and trade secrets.

When team members paste financial spreadsheets, proprietary algorithms, or contractual drafts into public AI models, that sensitive data is transferred to external cloud endpoints and frequently ingested to train broader commercial models—triggering severe compliance breaches and trade secret forfeiture.

**The Engineering Solution: Air-Gapped & Dedicated Private AI Environments**

Deploying Private AI infrastructure allows organizations to harness the full power of state-of-the-art Large Language Models (LLMs) and automated workflows inside an impenetrable, self-contained perimeter:

1. **Dedicated On-Prem GPU Clusters:**
Deploying high-performance enterprise compute hardware (such as Dell PowerEdge XE servers equipped with dual NVIDIA enterprise GPUs) directly within the customer's on-prem datacenter or isolated rack enclosure.

2. **Hosting Open-Weight Enterprise LLMs:**
Deploying top-tier foundation models (Llama 3, DeepSeek, Mistral) that execute directly on local silicon with zero outbound internet transmission.

3. **Internal RAG & Local Vector Databases:**
Indexing company documentation, technical knowledge bases, and proprietary repositories into localized vector databases (Qdrant / Milvus), delivering high-precision contextual generation without sending a single prompt to third-party providers.

4. **Hermetic Air-Gapped Isolation:**
The topology is engineered to operate seamlessly within fully disconnected (Air-Gapped) classified networks, guaranteeing that not a single byte of corporate data ever traverses public cloud channels.

At TECH-SELECT, we architect, procure, deploy, and maintain custom Private AI environments, enabling enterprises and defense contractors to lead in technological innovation while maintaining absolute sovereignty over their data.`
        };

      case 'fortigate-cve-2026':
        return {
          ...art,
          title: 'Critical Security Alert: Fortinet FortiGate CVE Vulnerabilities & Patching Guide',
          categoryLabel: 'Cybersecurity',
          summary: 'Analysis of recent FortiGate CVEs (FortiOS / SSL-VPN / RCE), corporate network takeover risks, and TECH-SELECT mitigation steps.',
          content: `Fortinet FortiGate firewalls serve as the security backbone for thousands of enterprises worldwide, making them prime targets for sophisticated threat actors.

Recent critical CVEs in FortiOS (SSL-VPN / Remote Code Execution) allow unauthenticated attackers to bypass authentication, gain root privileges, and execute arbitrary code on internal networks.

**Primary Enterprise Risks:**
1. **Authentication Bypass:** Unauthorized entry via VPN appliances directly into corporate intranets.
2. **Backdoor Persistence:** Implanting persistent malware that survives standard reboots.
3. **Ransomware Deployment:** Utilizing exploited footholds to encrypt critical servers and database clusters.

**TECH-SELECT Hardening & Mitigation Plan:**
- **Immediate Asset Audit:** Rapid scanning of firewall fleets, identifying exposed FortiOS builds and open admin ports.
- **Admin Interface Isolation:** Blocking public Management Web UI access and restricting management to trusted IPs only.
- **Firmware Patching:** Executing controlled firmware upgrades to hardened stable releases without operational downtime.
- **VPN & MFA Hardening:** Mandating strict Multi-Factor Authentication (MFA) for all remote access links.`,
          readTime: '5 min read',
          date: 'July 28, 2026',
          author: 'TECH-SELECT Cyber Defense Team'
        };

      case 'mfa-2fa-best-practices':
        return {
          ...art,
          title: 'Why Passwords Are Not Enough: Enterprise Multi-Factor Authentication (2FA/MFA)',
          categoryLabel: 'Cybersecurity',
          summary: 'Over 80% of security breaches stem from compromised credentials. Why MFA is the fundamental baseline and how to prepare for Microsoft deprecating SMS/Phone MFA.',
          readTime: '4 min read',
          date: 'July 12, 2026',
          author: 'TECH-SELECT Security Team',
          content: `In today's threat landscape, passwords - regardless of length - no longer guarantee security. Phishing, targeted social engineering, and password reuse make corporate credentials vulnerable targets.

Multi-Factor Authentication (MFA) creates a crucial barrier: even if a password is lost, access is denied without the secondary factor (authenticator app or hardware key).

**Why SMS OTP is Deprecated:**
SMS messages are vulnerable to SIM swapping and signal interception. The modern enterprise standard relies on authenticator apps (Microsoft Authenticator / Duo) or FIDO2 YubiKeys.

**📢 Critical Update: Microsoft Phasing Out SMS and Phone Call MFA**
Microsoft announced a gradual deprecation of Multi-Factor Authentication (MFA) via SMS and phone calls in Microsoft Entra ID, moving towards phishing-resistant authentication methods.

• Starting September 1, 2026: Users relying on SMS or calls will be prompted to register for Microsoft Authenticator.
• Starting February 1, 2027: Native support for SMS and phone call MFA will be completely retired.

Organizations currently utilizing SMS or phone call MFA must prepare in advance and transition to Microsoft Authenticator, Passkeys (FIDO2), or advanced authentication.

At TECH-SELECT, we advise organizations not to wait for the final deadline and begin auditing their MFA infrastructure immediately.

**TECH-SELECT Deployment Best Practices:**
1. **Conditional Access Policies:** Enforcing MFA based on user location, device compliance, and risk score in M365/Azure.
2. **Comprehensive Coverage:** Extending MFA across M365, SSL-VPNs, RDP jump hosts, ERP systems, and workstations.
3. **MFA Fatigue Mitigation:** Implementing Number Matching on authenticator pushes to prevent accidental approvals during fatigue spamming.`
        };

      case 'ai-cyber-defense-2026':
        return {
          ...art,
          title: 'CISO Guide to Corporate AI Management: Security Rules, Permissions & Data Leak Prevention',
          categoryLabel: 'AI Security',
          summary: 'How to manage AI safely in the organization? Guidelines for privacy-first enterprise systems, zero free AI policy, Corporate AI Officer roles, and token/permission controls.',
          readTime: '5 min read',
          date: 'June 20, 2026',
          author: 'TECH-SELECT AI Research & Cyber Unit',
          content: `The artificial intelligence revolution offers unprecedented productivity, but without strict management, it presents one of the greatest cybersecurity and privacy risks in modern enterprise environments.

**5 Golden Rules for Corporate AI Management (TECH-SELECT CISO Framework):**

1. **Strict Zero Free AI Policy:**
Do not use personal accounts or free public tools for work. Free tools utilize prompt data for public model training, exposing source code, legal contracts, and financial spreadsheets to third-party servers.

2. **Work Exclusively with Enterprise-Grade AI Systems:**
Use organization-approved AI platforms with binding contractual data protection commitments - such as Microsoft 365 Copilot, Azure OpenAI, or ChatGPT Enterprise/Business - in alignment with service terms and corporate policy. These systems must ensure, depending on service configuration, that corporate data is not utilized for model training, is encrypted in transit and at rest, and is handled under strict security, privacy, and confidentiality obligations. Where Zero Data Retention is required, explicitly verify that the chosen service tier and configuration fulfill this guarantee.

3. **Corporate AI Officer Appointment:**
Appoint a dedicated AI Officer to oversee token budgets, License allocations, Role-Based Access Control (RBAC), and query anomaly monitoring.

4. **Least Privilege for AI Indexing:**
Enterprise AI engines linked to SharePoint or M365 index all files accessible to an employee. If permissions are flawed, AI will surface restricted financial or HR data! Permission hardening is mandatory prior to AI rollout.

5. **DLP & AI Telemetry:**
Enforce automated Data Loss Prevention (DLP) rules blocking unauthorized file uploads, sensitive keyword leaks, and trade secret exposure.`
        };

      default:
        return art;
    }
  };

  const categories = isHe
    ? [
        { id: 'all', label: 'כל המאמרים' },
        { id: 'cyber', label: 'אבטחת מידע וסייבר' },
        { id: 'ai', label: 'ניהול AI בארגון' },
        { id: 'defense', label: 'תשתיות וביטחון' },
        { id: 'cloud', label: 'ענן ו-M365' },
      ]
    : [
        { id: 'all', label: 'All Articles' },
        { id: 'cyber', label: 'Cybersecurity' },
        { id: 'ai', label: 'Enterprise AI' },
        { id: 'defense', label: 'Defense IT' },
        { id: 'cloud', label: 'Cloud & M365' },
      ];

  const filteredArticles = ARTICLES_DATA.filter((art) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'cyber' && (art.category === 'cyber' || art.id.includes('cve') || art.id.includes('mfa'))) ||
      (selectedCategory === 'ai' && (art.category === 'ai-security' || art.id.includes('ai'))) ||
      (selectedCategory === 'defense' && (art.category === 'network' || art.id.includes('air-gap') || art.id.includes('defense'))) ||
      (selectedCategory === 'cloud' && (art.category === 'cloud' || art.id.includes('m365') || art.id.includes('backup')));

    const artEn = getArticleEn(art);
    const searchTarget = `${art.title} ${art.summary} ${artEn.title} ${artEn.summary}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="knowledge" className={`py-8 sm:py-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={knowledgeCenterBg || '/knowledge_center_hero.jpg'}
        fallbackSrc="/knowledge_center_hero.jpg"
        alt="TECH-SELECT Knowledge Hub & Research Library"
        glowColor="bg-blue-600"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border animate-linear-eyebrow ${
            isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' : 'bg-white border-slate-200 text-blue-800 shadow-xs'
          }`}>
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>KNOWLEDGE HUB & CISO INSIGHTS</span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold font-heading tracking-tight animate-linear-title ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isHe ? (
              <>
                מדריכים ומאמרים מקצועיים <span className="gemini-text-gradient">ממומחי TECH-SELECT</span>
              </>
            ) : (
              <>
                Knowledge Hub & Insights <span className="gemini-text-gradient">from TECH-SELECT Experts</span>
              </>
            )}
          </h2>
          <p className={`text-base font-normal animate-linear-subtitle ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isHe
              ? 'כל מה שמנהלים צריכים לדעת על הגנת סייבר, תשתיות Air-Gap, גיבויים מוצפנים וענן מאובטח.'
              : 'Everything executives need to know about cybersecurity, Air-Gap networks, backup integrity, and IT alignment.'}
          </p>
        </div>

        {/* Interactive Cyber Incident Game Promo Banner */}
        <div className={`mb-10 rounded-2xl p-6 sm:p-8 relative overflow-hidden group border transition-all animate-linear-cta ${
          isDark 
            ? 'bg-[#090d16]/90 border-red-500/30 text-white shadow-lg' 
            : 'bg-rose-50/50 border-rose-200 text-slate-900 shadow-xs'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-sans font-bold border ${
                isDark 
                  ? 'bg-red-500/15 border-red-500/30 text-red-300' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{isHe ? '🎮 סימולטור סייבר אינטראקטיבי' : '🎮 Interactive Cyber Incident Game'}</span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Choose Your Own Disaster - {isHe ? 'משחק תרחישים עסקי בזמן אמת' : 'Business Cyber Disaster Simulator'}
              </h3>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isHe
                  ? 'יום ראשון, 06:45 בבוקר. הקבצים מוצפנים והכופר דורש 50,000$. האם העסק שלך ישרוד או יתרסק? כנס לסימולטור ה-SOC והתנסה בהתמודדות מול מתקפת סייבר אמיתית.'
                  : 'Sunday, 06:45 AM. Files are encrypted with a $50,000 ransom. Will your business survive? Enter our SOC simulator and make critical split-second choices.'}
              </p>
            </div>

            <a
              href="#disaster-game"
              className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>{isHe ? 'התחל סימולציה עכשיו' : 'Start Cyber Simulation'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </a>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-3.5 rounded-2xl border ${
          isDark ? 'bg-[#090d16]/80 border-white/[0.08]' : 'bg-white border-slate-300/80 shadow-xs'
        }`}>
          
          <div className="relative w-full sm:w-80">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isHe ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              placeholder={isHe ? 'חיפוש נושא או מאמר...' : 'Search articles...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isHe ? 'pl-3 pr-10' : 'pr-3 pl-10'} py-2 rounded-full text-xs outline-none border transition-colors ${
                isDark 
                  ? 'bg-white/[0.04] text-white border-white/[0.08] focus:border-white/20' 
                  : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? isDark
                      ? 'bg-white/[0.14] text-white border border-white/25 shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : isDark
                      ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredArticles.map((art) => {
            const artEn = getArticleEn(art);
            const title = isHe ? art.title : artEn.title;
            const categoryLabel = isHe ? art.categoryLabel : artEn.categoryLabel;
            const summary = isHe ? art.summary : artEn.summary;
            const readTime = isHe ? art.readTime : artEn.readTime;

            return (
              <SpotlightCard
                key={art.id}
                onClick={() => setActiveArticle(art)}
                className={`cursor-pointer group p-6 flex flex-col justify-between rounded-2xl border transition-all duration-300 ${
                  isDark ? 'bg-[#090d16]/85 border-white/[0.08] hover:border-cyan-400/40 hover:bg-[#0c1220]' : 'bg-white border-slate-300/80 shadow-sm hover:border-blue-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-3 py-0.5 rounded-full font-sans font-semibold border ${
                      isDark 
                        ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' 
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {categoryLabel}
                    </span>
                    <span className={`flex items-center gap-1 font-sans text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {readTime}
                    </span>
                  </div>

                  <h3 className={`text-lg font-bold font-heading leading-snug transition-colors ${
                    isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-950 group-hover:text-blue-700'
                  }`}>
                    {title}
                  </h3>

                  <p className={`text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {summary}
                  </p>
                </div>

                <div className={`pt-4 mt-4 border-t flex items-center justify-between text-xs font-semibold ${
                  isDark 
                    ? 'border-white/[0.08] text-cyan-400 group-hover:text-cyan-300' 
                    : 'border-slate-100 text-blue-700 group-hover:text-blue-800'
                }`}>
                  <span>{isHe ? 'קרא את המאמר המלא' : 'Read Full Article'}</span>
                  {isHe ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </div>
              </SpotlightCard>
            );
          })}
        </div>

      </div>

      <ArticleModal article={activeArticle} onClose={() => setActiveArticle(null)} />
    </section>
  );
};
