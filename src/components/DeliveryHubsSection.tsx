import React, { useState } from 'react';
import { Globe, Server, ShieldCheck, Users, ArrowLeft, ArrowRight, CheckCircle2, Building2, MapPin, Sparkles, ShieldAlert, Award, UserCheck, MessageSquareQuote } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';

export const DeliveryHubsSection: React.FC = () => {
  const { isHe } = useLanguage();
  const [activeTab, setActiveTab] = useState<'defense' | 'dedicated' | 'managed' | 'cyber'>('defense');

  const deliveryModels = [
    {
      id: 'defense',
      title: isHe ? 'רשתות מסווגות & Air-Gap' : 'Classified & Air-Gap Networks',
      shortDesc: isHe
        ? 'הקמה ותחזוקת תשתיות IT מבודדות לחברות ביטחוניות ומפעלים ביטחוניים'
        : 'Deployment & maintenance of isolated IT infrastructure for defense contractors and sensitive facilities',
      icon: ShieldAlert,
      badge: isHe ? 'משרד הביטחון Compliant' : 'Defense Ministry Compliant',
      highlights: isHe
        ? [
            'טכנאים ומנהלי רשת בעלי סיווג ביטחוני בתוקף',
            'הקמת תשתיות Air-Gap מנתקות רשת גלויה וסגורה',
            'עמידה בתקני איכות ואבטחה מחמירים (CMMC, ISO 27001)',
            'תמיכה דיסקרטית במתקנים מסווגים בפריסה ארצית'
          ]
        : [
            'Engineers with valid active defense security clearances',
            'Hermetic Air-Gap networks separating classified from clear nets',
            'Strict compliance with CMMC and ISO 27001 defense standards',
            'Discreet nationwide support for classified facilities'
          ],
      metrics: {
        title: isHe ? 'סיווג ביטחוני' : 'Security Clearance',
        val: isHe ? 'מלא' : 'Full',
        sub: isHe ? 'צוות מוסמך למתקנים מסווגים' : 'Cleared team for sensitive facilities'
      }
    },
    {
      id: 'dedicated',
      title: isHe ? 'צוותים ייעודיים & Nearshore' : 'Dedicated Teams & IT Staffing',
      shortDesc: isHe
        ? 'הרחבה גמישה ומהירה של יכולות ה-IT והפיתוח בארגון'
        : 'Rapid, flexible expansion of enterprise IT engineering and software development capabilities',
      icon: Users,
      badge: isHe ? 'גמישות תפעולית' : 'OPERATIONAL FLEXIBILITY',
      highlights: isHe
        ? [
            'גיוס והקמת צוות מומחים ייעודי תוך 14 ימי עבודה בלבד',
            'שליטה מלאה במתודולוגיית העבודה, המשימות והלו"ז הארגוני',
            'מודל תמחור שקוף וקבוע (Flat Monthly Rate) ללא פינות נסתרות',
            'העברת ידע רציפה וליווי מנהל פרויקט בכיר מטעם TECH-SELECT'
          ]
        : [
            'Rapid staffing of dedicated IT expert teams within 14 business days',
            'Full enterprise control over workflows, Jira tasks, and deadlines',
            'Predictable flat monthly retainer with zero hidden fees',
            'Continuous knowledge transfer with senior TECH-SELECT vCIO oversight'
          ],
      metrics: {
        title: isHe ? 'זמן הקמת צוות' : 'Team Onboarding',
        val: '14 ' + (isHe ? 'ימים' : 'Days'),
        sub: isHe ? 'חיסכון של 45% בעלויות מעסיק' : '45% operational overhead cost savings'
      }
    },
    {
      id: 'managed',
      title: isHe ? 'מחלקת IT מנוהלת 360°' : 'Managed 360° IT Department',
      shortDesc: isHe
        ? 'ניהול היקפי של תשתיות, תחנות קצה ומוקד תמיכה'
        : 'Comprehensive management of enterprise networks, endpoints, and 24/7 helpdesk',
      icon: Server,
      badge: 'SLA 99.99%',
      highlights: isHe
        ? [
            'מוקד Helpdesk אנושי זמין 24/7/365 למענה מהיר',
            'ניהול שרתים, מתגים, פיירוול וציוד קצה באופן פרואקטיבי',
            'vCIO – מנהל טכנולוגיות בכיר המלווה את הנהלת החברה',
            'תחזוקה מונעת וסריקות אבטחה תקופתיות לכלל הציוד'
          ]
        : [
            '24/7/365 live human helpdesk for rapid issue resolution',
            'Proactive management of servers, switches, firewalls & endpoints',
            'Dedicated senior vCIO accompanying executive leadership',
            'Preventive maintenance and periodic security vulnerability audits'
          ],
      metrics: {
        title: isHe ? 'זמן תגובה ממוצע' : 'Avg Response Time',
        val: '< 15 ' + (isHe ? 'דק’' : 'Min'),
        sub: isHe ? 'פתרון 92% מהפניות בקריאה ראשונה' : '92% first-contact resolution rate'
      }
    },
    {
      id: 'cyber',
      title: isHe ? 'מוקד סייבר & SOC 24/7' : 'Cyber Security & 24/7 SOC',
      shortDesc: isHe
        ? 'הגנה היקפית, ניטור איומים בזמן אמת ותגובה מיידית'
        : 'Perimeter protection, real-time threat monitoring, and rapid incident response',
      icon: ShieldCheck,
      badge: 'ISO 27001 / CMMC',
      highlights: isHe
        ? [
            'ניטור רציף 24/7/365 של כל תנועת הרשת ותחנות הקצה',
            'הטמעת מערכות AI EDR למניעה אוטומטית של כופרות',
            'צוות תגובה מהירה (Incident Response) לאירועי סייבר',
            'מבדקי חדירות תקופתיים וסקר סיכונים לפי תקן אירופאי'
          ]
        : [
            'Continuous 24/7/365 monitoring of all network traffic and endpoints',
            'Deployment of AI EDR systems for automated ransomware prevention',
            'Dedicated Incident Response team for immediate cyber containment',
            'Periodic penetration testing and European-standard risk assessments'
          ],
      metrics: {
        title: isHe ? 'ניטור איומים' : 'Threat Monitoring',
        val: '24/7/365',
        sub: isHe ? 'חסימת איומים אוטומטית' : 'Automated threat containment'
      }
    }
  ];

  const deliveryHubs = [
    {
      city: isHe ? 'תל אביב - מטה מרכזי' : 'Tel Aviv - HQ',
      role: isHe ? 'מוקד NOC/SOC ראשי וניהול' : 'Primary NOC/SOC Center & Execs',
      specs: isHe ? 'מוקד תמיכה 24/7, ניהול IT וייעוץ CISO' : '24/7 Support Desk, IT Exec & vCIO',
      status: isHe ? 'פעיל' : 'Active',
    },
    {
      city: isHe ? 'ירושלים - מרכז ענן' : 'Jerusalem - Cloud Hub',
      role: isHe ? 'דאטה סנטר מאובטח' : 'Hardened Datacenter',
      specs: isHe ? 'רמת אבטחה Tier III, ISO 27001' : 'Tier III Security, ISO 27001',
      status: isHe ? 'פעיל' : 'Active',
    },
    {
      city: isHe ? 'חיפה - מרכז מצוינות' : 'Haifa - Excellence Hub',
      role: isHe ? 'מוקד צפוני ופיתוח' : 'Northern Tech & Dev Hub',
      specs: isHe ? 'מענה מהיר לתעשייה והייטק' : 'High-tech & industrial support',
      status: isHe ? 'פעיל' : 'Active',
    },
    {
      city: isHe ? 'דרום - חטיבת ביטחון' : 'South - Defense Division',
      role: isHe ? 'מענה למתקנים מסווגים' : 'Defense Facilities Unit',
      specs: isHe ? 'צוותי טכנאים מסווגים בפריסה ארצית' : 'Nationwide cleared engineers',
      status: isHe ? 'פעיל' : 'Active',
    }
  ];

  const currentModel = deliveryModels.find(m => m.id === activeTab) || deliveryModels[0];

  return (
    <section id="delivery" className="py-20 bg-[#0b0c10] text-slate-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>PERSONAL EXECUTIVE COMMITMENT & DELIVERY EXCELLENCE</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            {isHe ? (
              <>
                מודל מצוינות – <span className="gemini-text-gradient">מחויבות אישית ואחריות מלאה</span>
              </>
            ) : (
              <>
                Excellence Model – <span className="gemini-text-gradient">Personal Ownership & Delivery</span>
              </>
            )}
          </h2>
          
          <p className="text-slate-300 text-base leading-relaxed">
            {isHe
              ? 'מתודולוגיית השירות של TECH-SELECT נשענת על עיקרון פשוט: אצלנו הלקוח לא הולך לאיבוד במרכזיה אנונימית. אנו משלבים נוכחות מקומית, מוקד תמיכה אנושי זמין וצוותים מנוסים שמעניקים לארגון שלכם שקט תעשייתי אמיתי.'
              : 'Our delivery methodology is built on direct accountability: no anonymous helpdesks, just experienced engineers and direct executive oversight for total peace of mind.'}
          </p>
        </div>

        {/* Personal Note from Founder & Owner */}
        <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 p-6 sm:p-8 rounded-3xl border border-cyan-500/30 mb-14 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
            <div className="p-3.5 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 rounded-2xl shrink-0">
              <MessageSquareQuote className="w-8 h-8" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  {isHe ? 'מילה מהבעלים והמנכ"ל' : 'Message from Founder & Owner'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans italic">
                {isHe
                  ? '״כבעלים ומנכ"ל TECH-SELECT, הקמתי את החברה מתוך תפיסה שהנהלת IT וסייבר נמדדת ברגעי אמת – ולא בסיסמאות שיווקיות. אצלנו לא תפגשו אנשי מכירות שנעלמים ברגע שמממשים חוזה, אלא מענה הנדסי רציני, שקיפות בתקציב וקו פתוח אליי ולאנשי המקצוע הבכירים ביותר בצוות. כשאתם עובדים איתנו, אתם מקבלים גב טכנולוגי מלא ואחריות אישית שלי לשקט הנפשי שלכם.״'
                  : '"As the Founder and Owner of TECH-SELECT, I built this company on a core principle: IT management is measured in real moments of truth—not marketing fluff. You won\'t deal with vanishing salespeople; you get dedicated engineers, transparent budgets, and a direct line to executive management. When you partner with us, your operational stability is my personal commitment."'}
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">{isHe ? 'גיא יעקובי | מנכ"ל ובעלים, TECH-SELECT' : 'Guy Yaakobi | Founder & Owner, TECH-SELECT'}</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {isHe ? 'מחויבות אישית לכל לקוח' : 'Personal Executive SLA'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Hubs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {deliveryHubs.map((hub, idx) => (
            <SpotlightCard
              key={idx}
              className="gemini-card p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {hub.city}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300">
                  {hub.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-100 mb-1 font-heading">{hub.role}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{hub.specs}</p>
            </SpotlightCard>
          ))}
        </div>

        {/* Interactive Model Tabs Header */}
        <div className="gemini-card p-6 sm:p-8 text-slate-100 relative overflow-hidden">
          
          {/* Navigation Tabs (Gemini Rounded Pills) */}
          <div className="flex flex-wrap items-center gap-2 pb-6 mb-8 border-b border-white/10">
            {deliveryModels.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content Display */}
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Highlights List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-medium">
                  {currentModel.badge}
                </span>
                <h3 className="text-2xl font-bold text-white font-heading">
                  {currentModel.title}
                </h3>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                {currentModel.shortDesc}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {currentModel.highlights.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 leading-normal font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics & Action Box */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 p-6 rounded-3xl text-center space-y-4">
              <span className="text-xs uppercase text-slate-400 block font-mono font-medium">{isHe ? 'מדד ביצוע מרכזי (KPI)' : 'Key Performance Metric (KPI)'}</span>
              
              <div>
                <div className="text-3xl font-extrabold text-white font-mono mb-1">
                  {currentModel.metrics.val}
                </div>
                <div className="text-xs font-bold text-cyan-300">{currentModel.metrics.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">{currentModel.metrics.sub}</div>
              </div>

              <a
                href="#contact"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium py-3 rounded-full text-xs shadow-md transition-all"
              >
                <span>{isHe ? 'תיאום פגישת אפיון' : 'Schedule Assessment'}</span>
                {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>
            </div>

          </div>

        </div>

        {/* Corporate Trust Badges Bar */}
        <div className="mt-12 pt-6 text-center">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest block mb-4 font-mono">
            {isHe ? 'סומכים על השירות והסיווג הביטחוני של TECH-SELECT' : 'Trusted by Leading Industries & Defense Sectors'}
          </span>

          <div className="flex flex-wrap justify-center items-center gap-3 text-slate-200 font-medium text-xs">
            <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              {isHe ? 'תעשיות ביטחוניות' : 'Defense Sector'}
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              {isHe ? 'פיננסים & בנקים' : 'Finance & Banking'}
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {isHe ? 'חברות הייטק & Cyber' : 'High-Tech & Cyber'}
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              {isHe ? 'משרדי ממשלה & ציבורי' : 'Government & Public'}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

