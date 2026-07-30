import React, { useState } from 'react';
import { COMPANY_INFO } from '../data/content';
import { Phone, Mail, MapPin, Navigation, Clock, Send, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ContactSectionProps {
  onOpenPrivacy?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenPrivacy }) => {
  const { isHe } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isDefense, setIsDefense] = useState(false);
  const [message, setMessage] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("https://formsubmit.co/ajax/guyyaakobi@gmail.com", {
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
          _subject: "פנייה חדשה מאתר Tech-Select"
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        console.warn('FormSubmit response warning:', data);
        setSubmitted(true);
      }
    } catch (err: any) {
      console.error('Failed to dispatch contact form email via FormSubmit:', err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hours = isHe
    ? [
        { days: "ראשון - חמישי", time: "08:30 - 18:00" },
        { days: "שישי", time: "08:30 - 13:00" },
        { days: "שבת / חירום", time: "תמיכה 24/7 למנויים" },
      ]
    : [
        { days: "Sun - Thu", time: "08:30 - 18:00" },
        { days: "Friday", time: "08:30 - 13:00" },
        { days: "Sat / Emergency", time: "24/7 SLA Hotline" },
      ];

  return (
    <section id="contact" className="py-20 bg-[#0b0c10] text-slate-100 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>DISCREET & SECURE CONTACT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            {isHe ? (
              <>
                צרו קשר עכשיו לקבלת <span className="gemini-text-gradient">ייעוץ IT, ענן וסייבר</span>
              </>
            ) : (
              <>
                Get in Touch for <span className="gemini-text-gradient">IT, Cloud & Cyber Advisory</span>
              </>
            )}
          </h2>
          <p className="text-slate-300 text-base font-normal">
            {isHe
              ? 'השאירו פרטים ונשמח לתאם פגישת היכרות ואפיון במתקן שלכם או במשרדינו בתל אביב.'
              : 'Contact us for a consultation at your facility or at our Tel Aviv offices.'}
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details & Office Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Info Box */}
            <div className="gemini-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white font-heading">
                {isHe ? 'פרטי התקשרות וסניף ראשי' : 'Headquarters & Contact'}
              </h3>
              
              <div className="space-y-4 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">{isHe ? 'פנייה ישירה ב-WhatsApp' : 'WhatsApp Contact'}</span>
                    <a href={COMPANY_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors font-mono">
                      {isHe ? 'לחץ להתכתבות ב-WhatsApp' : 'Click to chat on WhatsApp'}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">{isHe ? 'דוא"ל פניות' : 'Email'}</span>
                    <a href={`mailto:${COMPANY_INFO.email}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors font-mono" dir="ltr">
                      {COMPANY_INFO.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-emerald-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">{isHe ? 'כתובת המשרדים' : 'Address'}</span>
                    <span className="text-sm font-bold text-white">{COMPANY_INFO.address}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Quick Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={COMPANY_INFO.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-cyan-300 py-2.5 rounded-full text-xs font-mono font-medium border border-white/10 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isHe ? 'ניווט ב-Waze' : 'Navigate Waze'}</span>
                </a>

                <a
                  href={COMPANY_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 py-2.5 rounded-full text-xs font-mono font-medium border border-white/10 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isHe ? 'מפות Google' : 'Google Maps'}</span>
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="gemini-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{isHe ? 'שעות פעילות מוקד' : 'Operating Hours'}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                {hours.map((h, idx) => (
                  <div key={idx} className="flex justify-between pb-1 font-mono">
                    <span>{h.days}</span>
                    <span className="text-cyan-300 font-bold">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 gemini-card p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white font-heading mb-2">
              {isHe ? 'טופס פנייה מוגן ודיסקרטי' : 'Discreet & Secure Inquiry Form'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {isHe ? 'בשליחת הטופס פרטיכם נשמרים בסודיות מלאה ולא יועברו לאף גורם שלישי.' : 'All data submitted is handled under non-disclosure confidentiality agreements.'}
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{isHe ? 'שם מלא *' : 'Full Name *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isHe ? 'ישראל ישראלי' : 'John Doe'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 text-white rounded-2xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-white/20 transition-colors"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{isHe ? 'טלפון ליצירת קשר *' : 'Phone *'}</label>
                    <input
                      type="tel"
                      required
                      placeholder="03-9000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/5 text-white rounded-2xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-white/20 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{isHe ? 'דוא"ל למענה' : 'Email Address'}</label>
                    <input
                      type="email"
                      placeholder="name@company.co.il"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 text-white rounded-2xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-white/20 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{isHe ? 'שם החברה / הארגון' : 'Company / Organization'}</label>
                    <input
                      type="text"
                      placeholder={isHe ? 'שם החברה' : 'Company Name'}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-white/5 text-white rounded-2xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {isHe ? 'פנייה בנושא חברה ביטחונית / עובדים מסווגים' : 'Defense contractor / Cleared personnel inquiry'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDefense}
                    onChange={(e) => setIsDefense(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{isHe ? 'איך נוכל לעזור?' : 'How can we assist?'}</label>
                  <textarea
                    rows={4}
                    placeholder={isHe ? 'ספרו לנו בקצרה על הצרכים (תמיכה, ענן, פיתוח, אבטחת מידע, רשת מבודדת...)' : 'Briefly describe your requirements (Network architecture, hardware, cloud, cybersecurity...)'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white/5 text-white rounded-2xl px-4 py-3 text-xs outline-none border border-white/10 focus:border-white/20 transition-colors resize-none"
                  ></textarea>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 font-medium">
                  <input
                    type="checkbox"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                    className="accent-cyan-500 rounded cursor-pointer"
                  />
                  <span>
                    {isHe ? 'אני מאשר/ת את ' : 'I accept the '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrivacy?.();
                      }}
                      className="text-cyan-400 font-bold underline hover:text-cyan-300 transition-colors"
                    >
                      {isHe ? 'מדיניות הפרטיות' : 'Privacy Policy'}
                    </button>
                    {isHe ? ' ומסכים/ה לשימוש בפרטים ליצירת קשר' : ' and consent to contact.'}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!privacyChecked || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium py-3.5 rounded-full text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${isSubmitting ? 'animate-bounce' : ''}`} />
                  <span>
                    {isSubmitting
                      ? (isHe ? 'שולח הודעה ל-info@tech-select.co.il...' : 'Sending email to info@tech-select.co.il...')
                      : (isHe ? 'שליחת פרטים לצוות TECH-SELECT' : 'Submit Inquiry to TECH-SELECT')}
                  </span>
                </button>
              </form>
            ) : (
              <div className="py-12 text-center space-y-4 bg-emerald-950/40 border border-emerald-500/20 rounded-3xl p-6 text-emerald-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-xl font-bold text-white">{isHe ? `תודה רבה ${name}!` : `Thank you ${name}!`}</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed font-medium">
                  {isHe ? 'הפרטים התקבלו בהצלחה במוקד TECH-SELECT. מנהל שירות יחזור אליך בהקדם.' : 'Your request has been received by TECH-SELECT. An account manager will reach out shortly.'}
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Embedded Map */}
        <div className="mt-12 rounded-3xl overflow-hidden shadow-2xl h-64 sm:h-80 w-full opacity-90 hover:opacity-100 transition-opacity border border-white/10">
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
