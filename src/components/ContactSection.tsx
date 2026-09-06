import React, { useState } from 'react';
import { COMPANY_INFO } from '../data/content';
import { Mail, MapPin, Navigation, Clock, Send, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeroBackground } from './PageHeroBackground';
import contactOfficeBg from '../assets/images/contact_office_hero.jpg';

interface ContactSectionProps {
  onOpenPrivacy?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenPrivacy }) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isDefense, setIsDefense] = useState(false);
  const [message, setMessage] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Primary: Dispatch via backend /api/contact using Microsoft Graph API (support@tech-select.co.il -> g@tech-select.co.il)
      let delivered = false;
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: phone,
            company: company,
            isDefense: isDefense,
            message: message,
            service: "פנייה כללית מטופס צור קשר"
          })
        });
        if (res.ok) delivered = true;
      } catch (backendErr) {
        console.warn("Primary /api/contact call failed:", backendErr);
      }

      if (!delivered) {
        // Secondary fallback via /api/mail/send
        try {
          const mailRes = await fetch("/api/mail/send", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: "g@tech-select.co.il",
              subject: `פנייה חדשה מאתר Tech-Select - ${name} (${phone})`,
              content: `פנייה חדשה מאתר Tech-Select:\nשם: ${name}\nטלפון: ${phone}\nאימייל: ${email || 'לא צוין'}\nחברה: ${company || 'לא צוין'}\nסיווג ביטחוני: ${isDefense ? 'כן' : 'לא'}\nהודעה: ${message || 'ללא'}`
            })
          });
          if (mailRes.ok) delivered = true;
        } catch (mailErr) {
          console.warn("/api/mail/send fallback failed:", mailErr);
        }
      }

      if (!delivered) {
        // Tertiary fallback: FormSubmit (support@tech-select.co.il with _cc: g@tech-select.co.il)
        await fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
          method: "POST",
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: phone,
            company: company,
            isDefense: isDefense ? "כן - מתקן מסווג / חברה ביטחונית" : "לא",
            message: message,
            _subject: `📩 פנייה חדשה מאתר Tech-Select: ${name} (${phone})`,
            _template: "table",
            _captcha: "false",
            _cc: "g@tech-select.co.il",
            _replyto: email || undefined
          })
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Contact submission error:', err);
      try {
        await fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
          method: "POST",
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name, email, phone, company,
            isDefense: isDefense ? "כן" : "לא",
            message,
            _subject: `📩 פנייה חדשה מאתר Tech-Select: ${name} (${phone})`,
            _template: "table",
            _captcha: "false",
            _cc: "g@tech-select.co.il",
            _replyto: email || undefined
          })
        });
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
      }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hours = isHe
    ? [
        { days: "ראשון - חמישי", time: "08:30 - 18:00" },
        { days: "שישי", time: "08:30 - 13:00" },
        { days: "שבת / חירום", time: "מעטפת חירום וזמינות ב-SLA" },
      ]
    : [
        { days: "Sun - Thu", time: "08:30 - 18:00" },
        { days: "Friday", time: "08:30 - 13:00" },
        { days: "Sat / Emergency", time: "Emergency SLA Coverage" },
      ];

  return (
    <section id="contact" className={`py-8 sm:py-14 relative overflow-hidden transition-colors duration-300 bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Unified Enterprise Architectural Background */}
      <PageHeroBackground
        imageSrc={contactOfficeBg || '/contact_office_hero.jpg'}
        fallbackSrc="/contact_office_hero.jpg"
        alt="TECH-SELECT Tel Aviv Executive Offices & Client Reception"
        glowColor="bg-blue-600"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border animate-linear-eyebrow ${
            isDark ? 'bg-white/[0.04] border-white/[0.08] text-cyan-300' : 'bg-slate-100 border-slate-200 text-blue-800'
          }`}>
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>DISCREET & SECURE CONTACT</span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold font-heading tracking-tight animate-linear-title ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {isHe ? (
              <>
                צרו קשר עכשיו לתיאום <span className="gemini-text-gradient">שיחת אבחון טכנולוגי</span>
              </>
            ) : (
              <>
                Get in Touch to Schedule a <span className="gemini-text-gradient">Tech Diagnostic Session</span>
              </>
            )}
          </h2>
          <p className={`text-base font-normal animate-linear-subtitle ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isHe
              ? 'השאירו פרטים ונשמח לתאם שיחת אבחון הנדסית ללא התחייבות, או פגישת היכרות במשרדיכם או במשרדינו בתל אביב.'
              : 'Leave your details to schedule a no-obligation tech diagnostic session at your facility or at our Tel Aviv offices.'}
          </p>
        </div>

        {/* Contact Grid with Linear Soft Scale */}
        <div className="grid lg:grid-cols-12 gap-8 items-start animate-linear-cta">
          
          {/* Contact Details & Office Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Info Box */}
            <div className={`p-6 space-y-4 rounded-2xl border ${
              isDark ? 'bg-[#090d16]/85 border-white/[0.08]' : 'bg-white border-slate-300/80 shadow-sm'
            }`}>
              <h3 className={`text-lg font-bold font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {isHe ? 'פרטי התקשרות וסניף ראשי' : 'Headquarters & Contact'}
              </h3>
              
              <div className={`space-y-4 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isHe ? 'פנייה ישירה ב-WhatsApp' : 'WhatsApp Contact'}</span>
                    <a href={COMPANY_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-500 dark:text-emerald-400 hover:underline transition-colors font-sans">
                      {isHe ? 'לחץ להתכתבות ב-WhatsApp' : 'Click to chat on WhatsApp'}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isHe ? 'דוא"ל פניות' : 'Email'}</span>
                    <a href={`mailto:${COMPANY_INFO.email}`} className={`text-sm font-bold transition-colors font-sans ${isDark ? 'text-white hover:text-cyan-300' : 'text-blue-700 hover:text-blue-900'}`} dir="ltr">
                      {COMPANY_INFO.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isHe ? 'כתובת המשרדים' : 'Address'}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{COMPANY_INFO.address}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Quick Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={COMPANY_INFO.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-sans font-semibold border transition-colors ${
                    isDark 
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 border-white/[0.08]' 
                      : 'bg-slate-50 hover:bg-slate-100 text-cyan-800 border-slate-200'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isHe ? 'ניווט ב-Waze' : 'Navigate Waze'}</span>
                </a>

                <a
                  href={COMPANY_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-sans font-semibold border transition-colors ${
                    isDark 
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isHe ? 'מפות Google' : 'Google Maps'}</span>
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className={`p-5 space-y-3 rounded-2xl border ${
              isDark ? 'bg-[#090d16]/85 border-white/[0.08]' : 'bg-white border-slate-300/80 shadow-sm'
            }`}>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-sans ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{isHe ? 'שעות פעילות מוקד' : 'Operating Hours'}</span>
              </div>
              <div className={`space-y-1.5 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {hours.map((h, idx) => (
                  <div key={idx} className="flex justify-between pb-1 font-sans">
                    <span>{h.days}</span>
                    <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className={`lg:col-span-7 p-6 sm:p-8 rounded-2xl border ${
            isDark ? 'bg-[#090d16]/85 border-white/[0.08]' : 'bg-white border-slate-300/80 shadow-sm'
          }`}>
            <h3 className={`text-xl font-bold font-heading mb-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {isHe ? 'טופס פנייה מוגן ודיסקרטי' : 'Discreet & Secure Inquiry Form'}
            </h3>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isHe ? 'בשליחת הטופס פרטיכם נשמרים בסודיות מלאה ולא יועברו לאף גורם שלישי.' : 'All data submitted is handled under non-disclosure confidentiality agreements.'}
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                        ? 'bg-white/[0.04] text-white border-white/[0.08] focus:border-white/20' 
                        : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isHe ? 'טלפון ליצירת קשר *' : 'Phone *'}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="03-9000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors font-sans ${
                        isDark 
                          ? 'bg-white/[0.04] text-white border-white/[0.08] focus:border-white/20' 
                          : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isHe ? 'דוא"ל למענה' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.co.il"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors font-sans ${
                        isDark 
                          ? 'bg-white/[0.04] text-white border-white/[0.08] focus:border-white/20' 
                          : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isHe ? 'שם החברה / הארגון' : 'Company / Organization'}
                    </label>
                    <input
                      type="text"
                      placeholder={isHe ? 'שם החברה' : 'Company Name'}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors ${
                        isDark 
                          ? 'bg-white/[0.04] text-white border-white/[0.08] focus:border-white/20' 
                          : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {isHe ? 'פנייה בנושא חברה ביטחונית / עובדים מסווגים' : 'Defense contractor / Cleared personnel inquiry'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDefense}
                    onChange={(e) => setIsDefense(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isHe ? 'איך נוכל לעזור?' : 'How can we assist?'}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={isHe ? 'ספרו לנו בקצרה על הצרכים (תמיכה, ענן, פיתוח, אבטחת מידע, רשת מבודדת...)' : 'Briefly describe your requirements (Network architecture, hardware, cloud, cybersecurity...)'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-xs outline-none border transition-colors resize-none ${
                      isDark 
                        ? 'bg-white/[0.04] text-white border-white/[0.08] focus:border-white/20' 
                        : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-blue-500'
                    }`}
                  ></textarea>
                </div>

                <label className={`flex items-center gap-2 cursor-pointer text-xs font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                    className="accent-blue-600 rounded cursor-pointer"
                  />
                  <span>
                    {isHe ? 'אני מאשר/ת את ' : 'I accept the '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrivacy?.();
                      }}
                      className="text-blue-600 dark:text-cyan-400 font-bold underline hover:opacity-80 transition-opacity"
                    >
                      {isHe ? 'מדיניות הפרטיות' : 'Privacy Policy'}
                    </button>
                    {isHe ? ' ומסכים/ה לשימוש בפרטים ליצירת קשר' : ' and consent to contact.'}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!privacyChecked || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-full text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${isSubmitting ? 'animate-bounce' : ''}`} />
                  <span>
                    {isSubmitting
                      ? (isHe ? 'שולח הודעה...' : 'Sending email...')
                      : (isHe ? 'שליחת פרטים לצוות TECH-SELECT' : 'Submit Inquiry to TECH-SELECT')}
                  </span>
                </button>
              </form>
            ) : (
              <div className={`py-12 text-center space-y-4 rounded-2xl p-6 border ${
                isDark 
                  ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? `תודה רבה ${name}!` : `Thank you ${name}!`}
                </h4>
                <p className={`text-xs max-w-sm mx-auto leading-relaxed font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {isHe ? 'הפרטים התקבלו בהצלחה במוקד TECH-SELECT. מנהל שירות יחזור אליך בהקדם.' : 'Your request has been received by TECH-SELECT. An account manager will reach out shortly.'}
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Embedded Map */}
        <div className={`mt-12 rounded-2xl overflow-hidden shadow-xs h-64 sm:h-80 w-full border ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200'
        }`}>
          <iframe
            className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
            src="https://maps.google.com/maps?q=%D7%99%D7%92%D7%90%D7%9C%20%D7%90%D7%9C%D7%95%D7%9F%2088%20%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91&t=&z=15&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location Map - Yigal Alon 88 Tel Aviv"
          ></iframe>
        </div>

      </div>
    </section>
  );
};
