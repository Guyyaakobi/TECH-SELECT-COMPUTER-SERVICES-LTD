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
      case 'ai-dual-revolution-inference-geo':
        return {
          ...art,
          title: 'The Dual Revolution: From Local AI Inference Servers to the Era of AI Discoverability',
          categoryLabel: 'AI & Strategy',
          summary: 'AI has transitioned from a buzzword into an essential enterprise growth engine. The true competitive advantage of 2026 lies across two parallel fronts: on-premise inference servers ensuring ironclad data privacy and ROI, and modern GEO/AEO web architecture ensuring AI engines discover your enterprise authority.',
          readTime: '3 min read',
          date: 'September 7, 2026',
          author: 'Guy Yaakobi, TECH-SELECT',
          content: `Artificial intelligence has long ceased to be just a "buzzword" and has become a mission-critical growth engine. Yet while most organizations focus solely on end-user applications, the real competitive edge of 2026 lies deeper, across two parallel fronts: internal infrastructure running the models (Inference), and external digital architecture enabling AI search engines to discover, interpret, and cite the organization's assets.

To stay ahead, decision-makers must formulate strategic moves across both dimensions simultaneously.

**Front One: Local AI Inference Servers – Public Cloud or On-Premise Silicon?**

Transitioning workloads to the public cloud was the default paradigm over the past decade. However, when it comes to fine-tuning and running Large Language Models (LLMs) and deep inference, the equation fundamentally flips. Enterprises running recurrent AI workloads rapidly discover that public cloud compute costs can easily spiral out of control.

This is precisely where dedicated On-Premises Inference Servers enter the picture.

**Why Bring AI Compute Back In-House?**

• **Absolute Data Privacy Sovereignty:** Financial institutions, healthcare providers, and defense contractors handling sensitive trade secrets cannot afford to stream proprietary enterprise data across external APIs. An on-premise server running on an air-gapped network guarantees that confidential IP never exits organizational boundaries.

• **Definitive ROI and Operational Cost Reduction:** While public cloud imposes an unpredictable, ongoing operational expenditure (OpEx) tied to token volume, hardware procurement represents a predictable, one-time capital investment (CapEx). Dedicated workstations or servers equipped with dual high-performance GPUs (such as Dual NVIDIA enterprise arrays) effortlessly execute state-of-the-art enterprise models at a fraction of cloud subscription costs over time.

• **Minimal Latency (Real-Time Edge Response):** When the model physically resides within meters of end-users or production-line machinery, response latency drops dramatically—vital for industrial automation, high-frequency operations, and real-time customer engagement.

**The Executive Takeaway:** If your company is merely experimenting with AI, public cloud is a convenient playground. But once AI becomes a recurring, high-volume core process demanding strict data privacy, local inference infrastructure represents both the safest and most economically sound strategy.

**Front Two: AEO, GEO and AI Discoverability – How New Engines See You Today**

While you deploy AI internally, your clients are increasingly using generative AI to search for your services. The classic SEO era—focused on keyword stuffing and link farming—is yielding to natural-language answer engines (such as Perplexity, ChatGPT Search, and Google AI Overviews). These engines no longer index mere "websites"; they curate authoritative answers (Answer Engine Optimization - AEO).

**How to Engineer Your Codebase for AI Scanners:**

AI search bots must accurately parse semantic context in a logical, structured format without tripping over non-standard code. To ensure your digital footprint is fully AI Discoverable, executing a technical audit and deploying the following standards directly to Production is imperative:

1. **Rigid Semantic Hierarchy:** AI engines analyze document structure. Pristine heading hierarchy (H1 through H6 without skipped tiers or duplicate headings) is essential for machines to map concept relationships.

2. **Clean Canonicals & Crawl Hygiene:** AI bots allocate finite processing compute per domain. Impeccable canonical tags that eradicate duplicate content, coupled with zero crawl errors, guarantee models train and ground themselves on your primary content rather than junk pages.

3. **Structured Data (Schema.org Markup):** Establishing a native machine dialect via JSON-LD Schema markup. This structures FAQs, corporate identities, professional credentials, service catalogs, and research whitepapers.

4. **From Keywords to "Entities" (Generative Engine Optimization - GEO):** AI models reason in entities and relational knowledge graphs, not isolated strings. Content must directly address user intent, be grounded in verifiable facts, and deliver clear, authoritative domain expertise.

**Conclusion**

In 2026, market leaders will be those who master AI across both frontiers: engineering sovereign on-premise hardware infrastructure (Inference Servers) that safeguards IP and slashes cloud bills, while simultaneously optimizing their digital architecture (GEO/AEO) so modern generative search engines recognize them as the undisputed authority in their domain.

The time to treat AI as a mere toy is over. It is time to construct the enduring infrastructure—from inside and out.`
        };

      case 'private-ai-onprem-security':
        return {
          ...art,
          title: 'The Silent Hazard in Enterprise AI: Preventing Data Leakage with Private On-Prem AI Topologies',
          categoryLabel: 'AI & Cybersecurity',
          summary: 'Public AI tools expose enterprises to grave IP leakage and compliance risks. How deploying local air-gapped Private AI servers resolves this dilemma, enabling breakthrough innovation with zero security compromise.',
          readTime: '2 min read',
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
          readTime: '2.5 min read',
          date: 'July 28, 2026',
          author: 'TECH-SELECT Cyber Defense Team'
        };

      case 'mfa-2fa-best-practices':
        return {
          ...art,
          title: 'Why Passwords Are Not Enough: Enterprise Multi-Factor Authentication (2FA/MFA)',
          categoryLabel: 'Cybersecurity',
          summary: 'Over 80% of security breaches stem from compromised credentials. Why MFA is the fundamental baseline and how to prepare for Microsoft deprecating SMS/Phone MFA.',
          readTime: '2 min read',
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
          readTime: '2.5 min read',
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
    <section id="knowledge" className={`pt-36 sm:pt-40 pb-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
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

        {/* Search & Category Filter - Clean Minimal Bar */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
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
                  ? 'bg-white/[0.03] text-white border-white/[0.1] focus:border-white/20' 
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
                      ? 'bg-white/[0.14] text-white'
                      : 'bg-slate-900 text-white shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
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
                className="cursor-pointer group p-7 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-sans font-semibold text-[11px] ${
                      isDark 
                        ? 'bg-white/[0.04] text-cyan-300' 
                        : 'bg-blue-50 text-blue-800'
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
                    isDark ? 'text-slate-300' : 'text-slate-600'
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
