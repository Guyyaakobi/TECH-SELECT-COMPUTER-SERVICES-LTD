import React, { useState } from 'react';
import { Lock, Radio, FileCheck, Key, CheckCircle2, ArrowRight, ArrowLeft, Phone, Mail, MapPin, Send, Award, ShieldAlert } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { TechSelectLogo } from './TechSelectLogo';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';

interface DefensePageProps {
  onBackToHome: () => void;
}

export const DefensePage: React.FC<DefensePageProps> = ({ onBackToHome }) => {
  const { isHe } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [facility, setFacility] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const defenseHighlights = [
    {
      title: isHe ? 'צוות IT בעל סיווג ביטחוני בתוקף' : 'Valid Active Security Clearances',
      desc: isHe
        ? 'כל הטכנאים, מנהלי הרשת ויועצי המערכת שלנו מחזיקים בסיווג ביטחוני בתוקף, המורשים לעבודה במתקנים מסווגים ובסביבות עבודה רגישות.'
        : 'All engineers, network architects, and system administrators hold active security clearances authorized for classified defense facilities.',
      icon: Key,
      badge: isHe ? 'סיווג ביטחוני פעיל' : 'ACTIVE CLEARANCE',
      color: 'rgba(56, 189, 248, 0.2)'
    },
    {
      title: isHe ? 'רשתות מבודדות (Air-Gapped Systems)' : 'Air-Gapped Network Isolation',
      desc: isHe
        ? 'תכנון, הקמה ותחזוקה של רשתות מחשוב ותקשורת המנותקות מאינטרנט ציבורי באופן הרמטי למניעת זליגת מידע מסווג.'
        : 'Architecture, deployment & management of physical networks completely isolated from public internet to prevent data leakage.',
      icon: Radio,
      badge: isHe ? 'הפרדה הרמטית' : 'HERMETIC AIR-GAP',
      color: 'rgba(6, 182, 212, 0.2)'
    },
    {
      title: isHe ? 'תקני משרד הביטחון, CMMC & ISO 27001' : 'Defense Standards: CMMC & ISO 27001',
      desc: isHe
        ? 'הקשחת עמדות קצה, ניהול הרשאות קפדני לפי עיקרון Minimal Privilege ועמידה בביקורות אבטחת מידע ביטחוניות.'
        : 'Endpoint hardening, strict Least Privilege permissions, and full audit readiness for defense regulations and CMMC compliance.',
      icon: FileCheck,
      badge: isHe ? 'רגולציה ביטחונית' : 'DEFENSE REGULATION',
      color: 'rgba(99, 102, 241, 0.2)'
    },
    {
      title: isHe ? 'הגנת DLP & הצפנת חומרה מלאה' : 'DLP Protection & Hardware Encryption',
      desc: isHe
        ? 'חסימת התקנים ניידים, הצפנה ברמת הדיסק (BitLocker/Hardware HSM) וניטור הדוק על כל תנועת קבצים ברשת.'
        : 'Removable media blocking, disk-level BitLocker/HSM hardware encryption, and continuous file-transfer monitoring.',
      icon: Lock,
      badge: 'DLP & ENCRYPTION',
      color: 'rgba(16, 185, 129, 0.2)'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* Main Defense Content */}
      <main className="py-8 sm:py-12">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
          
          {/* Defense Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-cyan-300 text-xs font-mono font-bold shadow-md border border-cyan-500/30">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>DEFENSE & CLASSIFIED IT SERVICES DIVISION</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-heading">
              {isHe ? (
                <>
                  פתרונות מחשוב ותשתיות<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                    לחברות ביטחוניות, מפעלים ומערכים מסווגים
                  </span>
                </>
              ) : (
                <>
                  Classified IT & Infrastructure Solutions<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                    For Defense Contractors & Hardened Facilities
                  </span>
                </>
              )}
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-normal">
              {isHe ? (
                <>
                  ב-<strong className="text-white font-bold">TECH-SELECT (טק-סלקט בע"מ)</strong>, פיתחנו מענה מיועד וייחודי המותאם במיוחד לספקי מערכת הביטחון, חברות ביטחוניות ומתקנים מסווגים. אנו מעניקים שירותי IT, תשתיות רשת מבודדות (Air-Gap) וליווי רגולטורי על ידי צוות בעל סיווג ביטחוני בתוקף.
                </>
              ) : (
                <>
                  At <strong className="text-white font-bold">TECH-SELECT LTD</strong>, we provide a specialized division tailored for defense contractors, military suppliers, and classified facilities. We deliver isolated Air-Gap networks, hardware supply, and security compliance led by cleared engineers.
                </>
              )}
            </p>

            <div className="flex flex-wrap justify-center items-center gap-3 pt-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-mono font-bold flex items-center gap-1.5 shadow-md border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isHe ? 'סיווג ביטחוני בתוקף' : 'Valid Security Clearances'}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-cyan-300 font-mono font-bold flex items-center gap-1.5 shadow-md border border-cyan-500/30">
                <Lock className="w-4 h-4 text-cyan-400" />
                {isHe ? 'תשתיות Air-Gap & DLP' : 'Air-Gap & DLP Infrastructure'}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-200 font-mono font-bold flex items-center gap-1.5 shadow-md border border-white/10">
                <Award className="w-4 h-4 text-blue-400" />
                {isHe ? 'תקני CMMC & ISO 27001' : 'CMMC & ISO 27001 Standards'}
              </span>

              {/* MOD Logo Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/95 border border-cyan-500/30 text-white text-xs font-mono shadow-md">
                <div className="bg-white/95 p-1 rounded-md shrink-0">
                  <img src="/mod-logo.svg" alt="משרד הביטחון" className="h-5 w-auto object-contain" />
                </div>
                <span className="text-[11px] font-bold text-cyan-300">
                  {isHe ? 'ספק מורשה משרד הביטחון' : 'MOD Authorized Supplier'}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Defense Core Highlights */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defenseHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <SpotlightCard
                  key={idx}
                  spotlightColor={item.color}
                  className="bg-slate-900/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-blue-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-heading mb-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-white/5">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {isHe ? 'מאושר ביטחונית' : 'Defense Approved'}
                    </span>
                    <span className="font-bold text-slate-300">100% COMPLIANT</span>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>

          {/* Detailed Compliance & Capabilities Box */}
          <SpotlightCard className="bg-slate-900/80 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 border border-white/10">
            <div className="pb-6">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                COMPLIANCE & PROTOCOLS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
                {isHe ? 'יכולות ועמידה בדרישות מערכת הביטחון (מנב"ט)' : 'Defense Security Compliance & Capabilities'}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-950/80 p-5 rounded-2xl space-y-3 shadow-md border border-white/5">
                <div className="p-2.5 w-fit rounded-xl bg-slate-900 text-cyan-400 shadow-sm border border-cyan-500/20">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-heading">{isHe ? 'סיווג אבטחה לצוותים' : 'Cleared Engineering Personnel'}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {isHe
                    ? 'צוותי ה-IT והתשתיות שלנו מורשים כניסה למתקנים מסווגים ומכירים לעומק את נהלי העבודה הדיסקרטיים הנדרשים מול ממונה הביטחון (מנב"ט).'
                    : 'Our IT teams hold active security clearances for classified facility access and adhere strictly to defense security officer protocols.'}
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl space-y-3 shadow-md border border-white/5">
                <div className="p-2.5 w-fit rounded-xl bg-slate-900 text-blue-400 shadow-sm border border-blue-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-heading">{isHe ? 'תשתיות Air-Gap מבודדות' : 'Isolated Air-Gap Networks'}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {isHe
                    ? 'תכנון והקמת רשתות מבודדות מאובטחות (בניית שרתים מקומיים, מיתוג מבודד, נטרול רכיבים אלחוטיים לא מורשים והצפנת נתונים).'
                    : 'Planning and deployment of isolated networks, local server builds, air-gapped switching, wireless disablement, and hardware encryption.'}
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl space-y-3 shadow-md border border-white/5">
                <div className="p-2.5 w-fit rounded-xl bg-slate-900 text-emerald-400 shadow-sm border border-emerald-500/20">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-heading">{isHe ? 'מוכנות לביקורות איכות' : 'Audit Readiness & CMMC'}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {isHe
                    ? 'ליווי יסודי במבדקי חדירות, סקרי סיכונים והכנה לביקורות תקן ISO 27001 ו-CMMC המבוקשים בפרויקטים בינלאומיים וביטחוניים.'
                    : 'Thorough guidance in risk surveys, penetration testing, and preparation for ISO 27001 & CMMC defense compliance audits.'}
                </p>
              </div>
            </div>
          </SpotlightCard>

          {/* Dedicated Confidential Contact Form for Defense Clients */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/80 p-6 rounded-2xl space-y-4 shadow-xl border border-white/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  DISCREET DEFENSE CHANNEL
                </div>
                <h3 className="text-xl font-bold text-white font-heading">{isHe ? 'תיאום פגישה במתקן מסווג' : 'Schedule Classified Facility Meeting'}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {isHe
                    ? 'פנייתכם תועבר ישירות למנהל השירות הביטחוני ב-TECH-SELECT ותטופל בסודיות מוחלטת.'
                    : 'Your inquiry will be directly handled by TECH-SELECT defense services management in strict confidentiality.'}
                </p>

                <div className="space-y-3 pt-2 text-xs text-slate-300 font-medium font-mono">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>{isHe ? 'קו ישיר' : 'Direct Line'}: {COMPANY_INFO.phoneLandline}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>{isHe ? 'דוא"ל' : 'Email'}: {COMPANY_INFO.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{COMPANY_INFO.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-900/80 p-6 sm:p-8 rounded-2xl shadow-xl border border-white/10">
              <h3 className="text-xl font-bold text-white font-heading mb-2">
                {isHe ? 'טופס פנייה דיסקרטי לחברות ביטחוניות' : 'Discreet Inquiry Form for Defense Clients'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {isHe
                  ? 'פרטי הפנייה יישמרו בסודיות מלאה ולא יועברו לשום גורם חיצוני.'
                  : 'All submitter data is kept under strict non-disclosure agreement protocols.'}
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">{isHe ? 'שם מלא *' : 'Full Name *'}</label>
                      <input
                        type="text"
                        required
                        placeholder={isHe ? 'ישראל ישראלי' : 'John Doe'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 text-white rounded-xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">{isHe ? 'טלפון ליצירת קשר *' : 'Phone *'}</label>
                      <input
                        type="tel"
                        required
                        placeholder="050-0000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 text-white rounded-xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-cyan-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">{isHe ? 'שם החברה / המתקן הביטחוני' : 'Company / Defense Facility'}</label>
                    <input
                      type="text"
                      placeholder={isHe ? 'שם החברה / מפעל' : 'Facility Name'}
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">{isHe ? 'תוכן הפנייה / דרישות אפיון' : 'Inquiry Scope / Requirements'}</label>
                    <textarea
                      rows={4}
                      placeholder={isHe ? 'תאר/י בקצרה את הצורך (למשל: תמיכה במתקן מסווג, רשת Air-Gap, ליווי מול מנב״ט...)' : 'Briefly describe requirements (Air-gap network, classified support, security officer alignment...)'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-cyan-500 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isHe ? 'שליחת פנייה דיסקרטית' : 'Submit Discreet Inquiry'}</span>
                  </button>
                </form>
              ) : (
                <div className="py-12 text-center space-y-4 bg-emerald-950/60 rounded-2xl p-6 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-xl font-bold text-white">{isHe ? 'הפנייה התקבלה בהצלחה' : 'Inquiry Received'}</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed font-medium">
                    {isHe ? `תודה ${name}. מנהל המגזר הביטחוני ב-TECH-SELECT יצור איתך קשר בדיסקרטיות בהקדם.` : `Thank you ${name}. Our defense division manager will contact you discreetly.`}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 text-center text-xs text-slate-400 border-t border-white/5">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            © {new Date().getFullYear()} TECH-SELECT computer services LTD · {isHe ? 'מחלקת מחשוב ותשתיות ביטחוניות' : 'Defense & Classified Infrastructure Division'}
          </div>
          <button
            onClick={onBackToHome}
            className="text-cyan-400 hover:underline font-bold cursor-pointer"
          >
            {isHe ? 'חזרה לאתר TECH-SELECT הראשי' : 'Back to TECH-SELECT Main Site'}
          </button>
        </div>
      </footer>

    </div>
  );
};
