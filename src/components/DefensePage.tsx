import React, { useState } from 'react';
import { Lock, Radio, FileCheck, Key, CheckCircle2, Phone, Mail, MapPin, Send, Award, ShieldAlert } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import defenseCommandBg from '../assets/images/defense_command_hero.jpg';

interface DefensePageProps {
  onBackToHome: () => void;
}

export const DefensePage: React.FC<DefensePageProps> = ({ onBackToHome }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
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
      color: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)'
    },
    {
      title: isHe ? 'רשתות מבודדות (Air-Gapped Systems)' : 'Air-Gapped Network Isolation',
      desc: isHe
        ? 'תכנון, הקמה ותחזוקה של רשתות מחשוב ותקשורת המנותקות מאינטרנט ציבורי באופן הרמטי למניעת זליגת מידע מסווג.'
        : 'Architecture, deployment & management of physical networks completely isolated from public internet to prevent data leakage.',
      checkmark: isHe
        ? 'הטמעת סביבות AI סגורות לחלוטין למערכים מסווגים – יכולות ניתוח נתונים ו-LLM ללא שום חיבור לאינטרנט.'
        : 'Deploying fully isolated Air-Gapped AI environments for classified units – advanced data analytics and on-prem LLMs with zero internet connectivity.',
      icon: Radio,
      badge: isHe ? 'הפרדה הרמטית' : 'HERMETIC AIR-GAP',
      color: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.15)'
    },
    {
      title: isHe ? 'תקני משרד הביטחון, CMMC & ISO 27001' : 'Defense Standards: CMMC & ISO 27001',
      desc: isHe
        ? 'הקשחת עמדות קצה, ניהול הרשאות קפדני לפי עיקרון Minimal Privilege ועמידה בביקורות אבטחת מידע ביטחוניות.'
        : 'Endpoint hardening, strict Least Privilege permissions, and full audit readiness for defense regulations and CMMC compliance.',
      icon: FileCheck,
      badge: isHe ? 'רגולציה ביטחונית' : 'DEFENSE REGULATION',
      color: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'
    },
    {
      title: isHe ? 'הגנת DLP & הצפנת חומרה מלאה' : 'DLP Protection & Hardware Encryption',
      desc: isHe
        ? 'חסימת התקנים ניידים, הצפנה ברמת הדיסק (BitLocker/Hardware HSM) וניטור הדוק על כל תנועת קבצים ברשת.'
        : 'Removable media blocking, disk-level BitLocker/HSM hardware encryption, and continuous file-transfer monitoring.',
      icon: Lock,
      badge: 'DLP & ENCRYPTION',
      color: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'
    }
  ];

  return (
    <div className={`font-sans transition-colors duration-300 selection:bg-cyan-500 selection:text-white relative overflow-hidden bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={defenseCommandBg || '/defense_command_hero.jpg'}
        fallbackSrc="/defense_command_hero.jpg"
        alt="TECH-SELECT Defense & Classified IT Command Operations"
        glowColor="bg-cyan-600"
      />
      
      {/* Main Defense Content */}
      <div className="py-6 sm:py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
          
          {/* Defense Hero Section with Linear Entrance Animations */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-sm border animate-linear-eyebrow ${
              isDark 
                ? 'bg-slate-900 text-cyan-300 border-cyan-500/30' 
                : 'bg-white text-blue-800 border-blue-200'
            }`}>
              <ShieldAlert className="w-4 h-4 text-cyan-500" />
              <span>DEFENSE & CLASSIFIED IT SERVICES DIVISION</span>
            </div>

            <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-heading animate-linear-title ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isHe ? (
                <>
                  פתרונות מחשוב ותשתיות<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-300">
                    לחברות ביטחוניות, מפעלים ומערכים מסווגים
                  </span>
                </>
              ) : (
                <>
                  Classified IT & Infrastructure Solutions<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-300">
                    For Defense Contractors & Hardened Facilities
                  </span>
                </>
              )}
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-normal animate-linear-subtitle ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {isHe ? (
                <>
                  ב-<strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT (טק-סלקט בע"מ)</strong>, פיתחנו מענה מיועד וייחודי המותאם במיוחד לספקי מערכת הביטחון, חברות ביטחוניות ומתקנים מסווגים. אנו מעניקים שירותי IT, תשתיות רשת מבודדות (Air-Gap) וליווי רגולטורי על ידי צוות בעל סיווג ביטחוני בתוקף.
                </>
              ) : (
                <>
                  At <strong className={isDark ? "text-white font-bold" : "text-slate-900 font-bold"}>TECH-SELECT LTD</strong>, we provide a specialized division tailored for defense contractors, military suppliers, and classified facilities. We deliver isolated Air-Gap networks, hardware supply, and security compliance led by cleared engineers.
                </>
              )}
            </p>

            <div className="flex flex-wrap justify-center items-center gap-3 pt-2 text-xs animate-linear-cta">
              <span className={`px-3 py-1.5 rounded-xl font-sans font-bold flex items-center gap-1.5 shadow-sm border ${
                isDark 
                  ? 'bg-slate-900 text-emerald-400 border-emerald-500/30' 
                  : 'bg-white text-emerald-800 border-emerald-200'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {isHe ? 'סיווג ביטחוני בתוקף' : 'Valid Security Clearances'}
              </span>
              <span className={`px-3 py-1.5 rounded-xl font-sans font-bold flex items-center gap-1.5 shadow-sm border ${
                isDark 
                  ? 'bg-slate-900 text-cyan-300 border-cyan-500/30' 
                  : 'bg-white text-blue-800 border-blue-200'
              }`}>
                <Lock className="w-4 h-4 text-blue-600" />
                {isHe ? 'תשתיות Air-Gap & DLP' : 'Air-Gap & DLP Infrastructure'}
              </span>
              <span className={`px-3 py-1.5 rounded-xl font-sans font-bold flex items-center gap-1.5 shadow-sm border ${
                isDark 
                  ? 'bg-slate-900 text-slate-200 border-white/10' 
                  : 'bg-white text-slate-800 border-slate-200'
              }`}>
                <Award className="w-4 h-4 text-indigo-600" />
                {isHe ? 'תקני CMMC & ISO 27001' : 'CMMC & ISO 27001 Standards'}
              </span>

              {/* MOD Logo Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-sans shadow-sm ${
                isDark 
                  ? 'bg-slate-900/95 border-cyan-500/30 text-white' 
                  : 'bg-white border-blue-300 text-slate-900'
              }`}>
                <div className="bg-white/95 p-1 rounded-md shrink-0">
                  <img src="/mod-logo.svg" alt="משרד הביטחון" width="20" height="20" loading="lazy" decoding="async" className="h-5 w-auto object-contain" />
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-cyan-300' : 'text-blue-800'}`}>
                  {isHe ? 'ספק מורשה משרד הביטחון: 0011028306' : 'MOD Supplier: 0011028306'}
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
                  className={`p-6 rounded-2xl shadow-sm flex flex-col justify-between border transition-all ${
                    isDark 
                      ? 'bg-slate-900/80 border-white/10' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        isDark ? 'bg-slate-950 border-white/10' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <Icon className="w-6 h-6 text-cyan-500" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isDark 
                          ? 'bg-blue-950 text-cyan-300 border-cyan-500/30' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.badge}
                      </span>
                    </div>

                    <h3 className={`text-lg font-bold font-heading mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.title}
                    </h3>

                    <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.desc}
                    </p>

                    {item.checkmark && (
                      <div className={`mt-3 p-2.5 rounded-xl border flex items-start gap-2 text-[11px] font-medium leading-relaxed ${
                        isDark 
                          ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200' 
                          : 'bg-blue-50/90 border-blue-200 text-blue-900'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        <span>{item.checkmark}</span>
                      </div>
                    )}
                  </div>

                  <div className={`mt-6 pt-4 flex items-center justify-between text-[11px] font-mono border-t ${
                    isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isHe ? 'מאושר ביטחונית' : 'Defense Approved'}
                    </span>
                    <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>100% COMPLIANT</span>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>

          {/* Detailed Compliance & Capabilities Box */}
          <div className={`rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 border ${
            isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="pb-4">
              <span className={`text-xs font-mono font-bold uppercase tracking-widest block mb-1 ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`}>
                COMPLIANCE & PROTOCOLS
              </span>
              <h2 className={`text-2xl sm:text-3xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isHe ? 'יכולות ועמידה בדרישות מערכת הביטחון (מנב"ט)' : 'Defense Security Compliance & Capabilities'}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className={`p-5 rounded-2xl space-y-3 shadow-sm border ${
                isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-2.5 w-fit rounded-xl shadow-sm border ${
                  isDark ? 'bg-slate-900 text-cyan-400 border-cyan-500/20' : 'bg-white text-blue-600 border-blue-100'
                }`}>
                  <Key className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>{isHe ? 'סיווג אבטחה לצוותים' : 'Cleared Engineering Personnel'}</h3>
                <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'צוותי ה-IT והתשתיות שלנו מורשים כניסה למתקנים מסווגים ומכירים לעומק את נהלי העבודה הדיסקרטיים הנדרשים מול ממונה הביטחון (מנב"ט).'
                    : 'Our IT teams hold active security clearances for classified facility access and adhere strictly to defense security officer protocols.'}
                </p>
              </div>

              <div className={`p-5 rounded-2xl space-y-3 shadow-sm border ${
                isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-2.5 w-fit rounded-xl shadow-sm border ${
                  isDark ? 'bg-slate-900 text-blue-400 border-blue-500/20' : 'bg-white text-cyan-600 border-cyan-100'
                }`}>
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>{isHe ? 'תשתיות Air-Gap מבודדות' : 'Isolated Air-Gap Networks'}</h3>
                <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'תכנון והקמת רשתות מבודדות מאובטחות (בניית שרתים מקומיים, מיתוג מבודד, נטרול רכיבים אלחוטיים לא מורשים והצפנת נתונים).'
                    : 'Planning and deployment of isolated networks, local server builds, air-gapped switching, wireless disablement, and hardware encryption.'}
                </p>
              </div>

              <div className={`p-5 rounded-2xl space-y-3 shadow-sm border ${
                isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-2.5 w-fit rounded-xl shadow-sm border ${
                  isDark ? 'bg-slate-900 text-emerald-400 border-emerald-500/20' : 'bg-white text-emerald-600 border-emerald-100'
                }`}>
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>{isHe ? 'מוכנות לביקורות איכות' : 'Audit Readiness & CMMC'}</h3>
                <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'ליווי יסודי במבדקי חדירות, סקרי סיכונים והכנה לביקורות תקן ISO 27001 ו-CMMC המבוקשים בפרויקטים בינלאומיים וביטחוניים.'
                    : 'Thorough guidance in risk surveys, penetration testing, and preparation for ISO 27001 & CMMC defense compliance audits.'}
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Confidential Contact Form for Defense Clients */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-5 space-y-6">
              <div className={`p-6 rounded-2xl space-y-4 shadow-sm border ${
                isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  isDark ? 'bg-slate-950 text-cyan-300 border-cyan-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  <Lock className="w-3.5 h-3.5 text-cyan-500" />
                  DISCREET DEFENSE CHANNEL
                </div>
                <h3 className={`text-xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? 'תיאום פגישה במתקן מסווג' : 'Schedule Classified Facility Meeting'}
                </h3>
                <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isHe
                    ? 'פנייתכם תועבר ישירות למנהל השירות הביטחוני ב-TECH-SELECT ותטופל בסודיות מוחלטת.'
                    : 'Your inquiry will be directly handled by TECH-SELECT defense services management in strict confidentiality.'}
                </p>

                <div className={`space-y-3 pt-2 text-xs font-medium font-sans ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  <a
                    href={COMPANY_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity font-semibold"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isHe ? 'פנייה ישירה ב-WhatsApp' : 'Direct WhatsApp Chat'}</span>
                  </a>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-500" />
                    <span>{isHe ? 'דוא"ל' : 'Email'}: {COMPANY_INFO.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>{COMPANY_INFO.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`lg:col-span-7 p-6 sm:p-8 rounded-2xl shadow-sm border ${
              isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-xl font-bold font-heading mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isHe ? 'טופס פנייה דיסקרטי לחברות ביטחוניות' : 'Discreet Inquiry Form for Defense Clients'}
              </h3>
              <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHe
                  ? 'פרטי הפנייה יישמרו בסודיות מלאה ולא יועברו לשום גורם חיצוני.'
                  : 'All submitter data is kept under strict non-disclosure agreement protocols.'}
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {isHe ? 'שם מלא *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isHe ? 'ישראל ישראלי' : 'John Doe'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors ${
                          isDark 
                            ? 'bg-slate-950 text-white border-white/10 focus:border-cyan-500' 
                            : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {isHe ? 'טלפון ליצירת קשר *' : 'Phone *'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="050-0000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors font-mono ${
                          isDark 
                            ? 'bg-slate-950 text-white border-white/10 focus:border-cyan-500' 
                            : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isHe ? 'שם החברה / המתקן הביטחוני' : 'Company / Defense Facility'}
                    </label>
                    <input
                      type="text"
                      placeholder={isHe ? 'שם החברה / מפעל' : 'Facility Name'}
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors ${
                        isDark 
                          ? 'bg-slate-950 text-white border-white/10 focus:border-cyan-500' 
                          : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isHe ? 'תוכן הפנייה / דרישות אפיון' : 'Inquiry Scope / Requirements'}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={isHe ? 'תאר/י בקצרה את הצורך (למשל: תמיכה במתקן מסווג, רשת Air-Gap, ליווי מול מנב״ט...)' : 'Briefly describe requirements (Air-gap network, classified support, security officer alignment...)'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors resize-none ${
                        isDark 
                          ? 'bg-slate-950 text-white border-white/10 focus:border-cyan-500' 
                          : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                      }`}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isHe ? 'שליחת פנייה דיסקרטית' : 'Submit Discreet Inquiry'}</span>
                  </button>
                </form>
              ) : (
                <div className={`py-12 text-center space-y-4 rounded-2xl p-6 border ${
                  isDark 
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isHe ? 'הפנייה התקבלה בהצלחה' : 'Inquiry Received'}</h4>
                  <p className={`text-xs max-w-sm mx-auto leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHe ? `תודה ${name}. מנהל המגזר הביטחוני ב-TECH-SELECT יצור איתך קשר בדיסקרטיות בהקדם.` : `Thank you ${name}. Our defense division manager will contact you discreetly.`}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
