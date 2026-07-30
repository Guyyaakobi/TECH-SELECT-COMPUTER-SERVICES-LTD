import React, { useState } from 'react';
import { ARTICLES_DATA } from '../data/content';
import { ArticleItem } from '../types';
import { ArticleModal } from './ArticleModal';
import { BookOpen, Search, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';

export const KnowledgeCenterSection: React.FC = () => {
  const { isHe } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<ArticleItem | null>(null);

  const getArticleEn = (art: ArticleItem): ArticleItem => {
    switch (art.id) {
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
          content: `In today's threat landscape, passwords—regardless of length—no longer guarantee security. Phishing, targeted social engineering, and password reuse make corporate credentials vulnerable targets.

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
Use organization-approved AI platforms with binding contractual data protection commitments—such as Microsoft 365 Copilot, Azure OpenAI, or ChatGPT Enterprise/Business—in alignment with service terms and corporate policy. These systems must ensure, depending on service configuration, that corporate data is not utilized for model training, is encrypted in transit and at rest, and is handled under strict security, privacy, and confidentiality obligations. Where Zero Data Retention is required, explicitly verify that the chosen service tier and configuration fulfill this guarantee.

3. **Corporate AI Officer Appointment:**
Appoint a dedicated AI Officer to oversee token budgets, License allocations, Role-Based Access Control (RBAC), and query anomaly monitoring.

4. **Least Privilege for AI Indexing:**
Enterprise AI engines linked to SharePoint or M365 index all files accessible to an employee. If permissions are flawed, AI will surface restricted financial or HR data! Permission hardening is mandatory prior to AI rollout.

5. **DLP & AI Telemetry:**
Enforce automated Data Loss Prevention (DLP) rules blocking unauthorized file uploads, sensitive keyword leaks, and trade secret exposure.`
        };

      case 'backup-restore-architecture':
        return {
          ...art,
          title: 'Returning to Backups: Immutable WORM Storage & True Disaster Recovery Architecture',
          categoryLabel: 'Cloud & Backup',
          summary: 'Why even advanced perimeter security cannot replace an un-hackable backup. The importance of immutable WORM storage, periodic recovery testing, and RTO benchmarks.',
          readTime: '4 min read',
          date: 'July 12, 2026',
          author: 'TECH-SELECT Backup & Business Continuity Division',
          content: `In modern cybersecurity, sophisticated attacks or catastrophic hardware failures can strike any organization. Cybersecurity and IT professionals understand one fundamental truth: **Ultimately, every business continuity strategy relies on backup quality and recovery capability.**

**Why Traditional Backups (External Drive / Local NAS) Are No Longer Enough:**
Modern attackers and ransomware target backup servers first! If your backups are connected to the network with standard admin credentials, attackers will encrypt the backups before encrypting your primary ERP databases and SAN storage.

**The Three Pillars of Winning Backup & Disaster Recovery at TECH-SELECT:**

1. **Immutable WORM Cloud Storage:**
Backups are written in WORM (Write Once, Read Many) format in secure cloud storage. Even if an attacker gains Domain Admin rights inside your network, there is zero technical way to view, delete, or encrypt immutable cloud backups during the retention lock period.

2. **The 3-2-1-1-0 Backup Rule:**
- 3 copies of your data.
- 2 different media types.
- 1 offsite cloud copy.
- 1 air-gapped / immutable isolated copy.
- 0 errors during automated recovery verification!

3. **True Recovery Simulation & RTO / RPO Testing:**
A backup is not a backup until a successful restore is executed from it. At TECH-SELECT, we conduct periodic Disaster Recovery (DR) simulations guaranteeing a Recovery Time Objective (RTO) of under 35 minutes, ensuring your business resumes full operation in real emergencies without paying ransom.`
        };

      case 'airgapped-defense-networks':
        return {
          ...art,
          title: 'Air-Gapped Network Architecture: Hermetic Defense for Critical & Defense Facilities',
          categoryLabel: 'Networking & Defense',
          summary: 'How to achieve total physical isolation from the public internet without sacrificing operational efficiency, and managing offline patch cycles.',
          readTime: '5 min read',
          date: 'June 8, 2026',
          author: 'TECH-SELECT Classified Infrastructure Division',
          content: `For defense contractors, financial institutions, critical infrastructure, and classified labs, direct internet connectivity poses an unacceptable risk. An Air-Gapped Network provides complete physical and logical separation from external networks.

**The Engineering Challenge:**
How to maintain strict air-gapped isolation while safely facilitating essential software updates, backups, and sanitized file transfers.

**TECH-SELECT Air-Gap Design Methodology:**
1. **Physical Isolation:** Dedicated server racks, isolated switches, and color-coded structured cabling preventing cross-connection.
2. **Optical Data Diodes:** Utilizing hardware data diodes allowing strictly one-way data egress (e.g., backup logs) with zero inbound ingress path.
3. **Kiosk Sanitization Stations:** Multi-engine antivirus scanning for all USB devices and external files prior to network ingestion.
4. **Offline Patch Management:** On-premises update repositories (Local WSUS) providing verified, offline security updates.`
        };

      case 'network-planning-2026':
        return {
          ...art,
          title: 'Importance of Corporate Network Architecture: Preventing Bottlenecks & Outages',
          categoryLabel: 'Networking & Infrastructure',
          summary: 'Why proper switch, router, and access point architecture is key to business stability, and how to avoid costly network design mistakes.',
          readTime: '4 min read',
          date: 'May 15, 2026',
          author: 'TECH-SELECT Networking Team',
          content: `Corporate network infrastructure is the nervous system of modern enterprise. Network drops, slow file transfers, or Voice-over-IP call disconnects stem from improper hardware sizing or lack of VLAN segmentation.

In a professional network engineering project, TECH-SELECT executes:
1. **Load Sizing & Traffic Assessment:** Evaluating user density, bandwidth demand, and latency-critical apps.
2. **Enterprise OEM Hardware Selection:** Managed switches, redundant routers, and latest Wi-Fi standard access points.
3. **Network Segmentation (VLANs):** Separating data workstations, VoIP telephony, security cameras, and guest networks for maximum security.
4. **Full Engineering Documentation:** Cable labeling, topology schematics, and port mapping for operational order.`
        };

      case 'align-project-value':
        return {
          ...art,
          title: 'What is an IT "Alignment Project" and Why is it Essential?',
          categoryLabel: 'Infrastructure & Management',
          summary: 'Legacy setups built piecemeal cause recurring failures. How an alignment project restores operational order and uptime.',
          readTime: '3 min read',
          date: 'April 2, 2026',
          author: 'TECH-SELECT Engineering Management',
          content: `As companies grow, their IT environment frequently evolves haphazardly: unpatched servers, messy cable racks, excessive user permissions, and un-aligned workstations.

A TECH-SELECT "Alignment Project" brings the organization to a single, professional engineering benchmark:
- **Comprehensive Infrastructure Audit:** Identifying single points of failure, obsolete hardware, and security flaws.
- **Server Rack Remediation:** Tidying network cabling, port tagging, UPS battery checks, and active hardware alignment.
- **Security & Privilege Hardening:** Cleaning legacy accounts and sealing access vulnerabilities.
- **Site Documentation:** Constructing a complete site dossier that provides total operational clarity.`
        };

      case 'hardware-lifecycle':
        return {
          ...art,
          title: 'OEM Business Hardware: Why Consumer Grade Gear Costs You More',
          categoryLabel: 'Hardware & Equipment',
          summary: 'The key differences between consumer gear and original business-grade equipment, and why full manufacturer warranty saves major capital.',
          readTime: '3 min read',
          date: 'March 10, 2026',
          author: 'TECH-SELECT Procurement Team',
          content: `Purchasing consumer grade PCs or discounted retail products for an enterprise environment quickly turns out to be a costly mistake. Enterprise Grade hardware is built for continuous workloads, featuring higher component tolerance and on-site manufacturer warranties.

At TECH-SELECT, we supply original OEM hardware from Dell, HPE, Lenovo, Cisco, Fortinet, and Apple:
- 100% Genuine hardware with direct manufacturer warranty.
- Pre-configuration and corporate image deployment on all new units.
- Dedicated Lifecycle Management from deployment to decommission.`
        };

      default:
        return art;
    }
  };

  const filteredArticles = ARTICLES_DATA.map((art) => (isHe ? art : getArticleEn(art))).filter((art) => {
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = isHe
    ? [
        { id: 'all', label: 'הכל' },
        { id: 'cyber', label: 'סייבר ואבטחה' },
        { id: 'ai-security', label: 'בינה מלאכותית (AI)' },
        { id: 'cloud-backup', label: 'גיבוי וענן' },
        { id: 'network', label: 'תקשורת ותשתיות' },
        { id: 'it-management', label: 'תשתיות וניהול' },
        { id: 'hardware', label: 'חומרה וציוד' },
      ]
    : [
        { id: 'all', label: 'All' },
        { id: 'cyber', label: 'Cybersecurity' },
        { id: 'ai-security', label: 'AI Security' },
        { id: 'cloud-backup', label: 'Cloud & Backup' },
        { id: 'network', label: 'Networking' },
        { id: 'it-management', label: 'Management' },
        { id: 'hardware', label: 'Hardware' },
      ];

  return (
    <section id="knowledge" className="py-20 bg-[#0b0c10] text-slate-100 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>KNOWLEDGE & CYBER SECURITY HUB</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
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
          <p className="text-slate-300 text-base font-normal">
            {isHe
              ? 'כל מה שמנהלים צריכים לדעת על הגנת סייבר, תשתיות Air-Gap, גיבויים מוצפנים וענן מאובטח.'
              : 'Everything executives need to know about cybersecurity, Air-Gap networks, backup integrity, and IT alignment.'}
          </p>
        </div>

        {/* Interactive Cyber Incident Game Promo Banner */}
        <div className="mb-10 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/20 transition-all" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>{isHe ? '🎮 סימולטור סייבר אינטראקטיבי' : '🎮 Interactive Cyber Incident Game'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                Choose Your Own Disaster – {isHe ? 'משחק תרחישים עסקי בזמן אמת' : 'Business Cyber Disaster Simulator'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {isHe
                  ? 'יום ראשון, 06:45 בבוקר. הקבצים מוצפנים והכופר דורש 50,000$. האם העסק שלך ישרוד או יתרסק? כנס לסימולטור ה-SOC והתנסה בהתמודדות מול מתקפת סייבר אמיתית.'
                  : 'Sunday, 06:45 AM. Files are encrypted with a $50,000 ransom. Will your business survive? Enter our SOC simulator and make critical split-second choices.'}
              </p>
            </div>

            <a
              href="#disaster-game"
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-red-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>{isHe ? 'התחל סימולציה עכשיו' : 'Start Cyber Simulation'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </a>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white/5 border border-white/10 p-4 rounded-3xl">
          
          <div className="relative w-full sm:w-80">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isHe ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              placeholder={isHe ? 'חיפוש נושא או מאמר...' : 'Search articles...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-white/5 text-white ${isHe ? 'pl-3 pr-10' : 'pr-3 pl-10'} py-2 rounded-full text-xs outline-none border border-white/5 focus:border-white/20 transition-colors`}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
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
                className="cursor-pointer group gemini-card p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-mono font-medium">
                      {categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-400 text-xs">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors font-heading leading-snug">
                    {title}
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
                    {summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-cyan-400 group-hover:text-cyan-300">
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
