import React, { useState, useEffect } from 'react';
import { 
  Bot, Sparkles, ArrowRight, ArrowLeft, Shield, Building2, 
  User, Mail, Phone, Zap, FileText, RefreshCw, Lightbulb, CheckCircle2,
  Lock, Check, Layers, Database, Cpu, Sliders, ShieldCheck, AlertCircle,
  HelpCircle, Clock, ChevronRight, ChevronLeft, Award, Server
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AIDiscoveryFormData } from '../../types';
import { AIDiscoveryPreset } from '../../data/aiDiscoveryPresets';

interface AIDiscoveryWizardProps {
  formData: AIDiscoveryFormData;
  onChangeFormData: (data: AIDiscoveryFormData) => void;
  onSubmit: (data?: AIDiscoveryFormData) => void;
  onCancel: () => void;
  onSelectPreset?: (preset: AIDiscoveryPreset) => void;
}

export const AIDiscoveryWizard: React.FC<AIDiscoveryWizardProps> = ({
  formData,
  onChangeFormData,
  onSubmit,
  onCancel,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();

  // Wizard active step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Local state initialized safely with fallback
  const [fullName, setFullName] = useState(formData.fullName || '');
  const [companyName, setCompanyName] = useState(formData.companyName || '');
  const [email, setEmail] = useState(formData.email || '');
  const [phone, setPhone] = useState(formData.phone || '');
  const [companySize, setCompanySize] = useState(formData.companySize || '21-100');
  const [industry, setIndustry] = useState(formData.industry || (isHe ? 'שירותים עסקיים והנדסה' : 'Business Services & Engineering'));

  // Systems state
  const [selectedERPs, setSelectedERPs] = useState<string[]>(
    formData.erpCrmDetails ? [formData.erpCrmDetails] : ['Priority ERP']
  );
  const [selectedStorage, setSelectedStorage] = useState<string[]>(
    formData.docStorage && formData.docStorage.length > 0 ? formData.docStorage : ['SharePoint/OneDrive']
  );
  const [currentAITools, setCurrentAITools] = useState<string[]>(
    formData.currentAITools && formData.currentAITools.length > 0 ? formData.currentAITools : ['ChatGPT Enterprise']
  );

  // Bottlenecks & Wasted Hours
  const [selectedBottlenecks, setSelectedBottlenecks] = useState<string[]>(
    formData.timeWastingActivities && formData.timeWastingActivities.length > 0 
      ? formData.timeWastingActivities 
      : ['Document search & filing', 'Manual data entry / Copy-paste', 'Email management']
  );
  const [wastedHours, setWastedHours] = useState<number>(
    formData.estimatedDailyWastedHoursPerEmployee || 1.8
  );

  // Security & Compliance
  const [securityPriorities, setSecurityPriorities] = useState<string[]>([
    'Zero Data Retention (ZDR)',
    'ISO 27001 & חוק הגנת הפרטיות',
    'חסימת דליפת נתונים ו-Shadow AI'
  ]);

  // Executive Goal & Brief
  const [customBrief, setCustomBrief] = useState(formData.customPainPoints || '');
  const [botTrap, setBotTrap] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate lead from localStorage safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem('techselect_executive_lead_v3') || localStorage.getItem('techselect_simulator_lead');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName && !fullName) setFullName(parsed.fullName);
        if (parsed.companyName && !companyName) setCompanyName(parsed.companyName);
        if (parsed.email && !email) setEmail(parsed.email);
        if (parsed.phone && !phone) setPhone(parsed.phone);
        if (parsed.companySize && !companySize) setCompanySize(parsed.companySize);
      }
    } catch {}
  }, []);

  const STEPS_NAV = [
    { num: 1, titleHe: 'פרופיל הארגון', titleEn: 'Profile', icon: Building2 },
    { num: 2, titleHe: 'תשתיות ומערכות', titleEn: 'Systems', icon: Database },
    { num: 3, titleHe: 'צווארי בקבוק', titleEn: 'Bottlenecks', icon: Clock },
    { num: 4, titleHe: 'אבטחה ופרטיות', titleEn: 'Security', icon: ShieldCheck },
    { num: 5, titleHe: 'חזון ודוח', titleEn: 'Vision & Report', icon: Sparkles },
  ];

  const INDUSTRY_OPTIONS = isHe
    ? ['שירותים עסקיים והנדסה', 'הייטק ופיתוח תוכנה', 'פיננסים, ביטוח ועורכי דין', 'תעשייה, מפעלים ולוגיסטיקה', 'רפואה, פארמה ובריאות', 'מסחר, יבוא והפצה']
    : ['Business Services & Engineering', 'High-Tech & Software', 'Finance, Legal & Insurance', 'Manufacturing & Logistics', 'Healthcare & Pharma', 'Commerce & Distribution'];

  const ERP_OPTIONS = [
    'Priority ERP', 'SAP Business One / S4HANA', 'Salesforce CRM', 'Microsoft Dynamics 365', 'HubSpot', 'NetSuite', 'מערכת פנימית מותאמת (In-house DB)'
  ];

  const STORAGE_OPTIONS = isHe
    ? ['Microsoft 365 / SharePoint / OneDrive', 'שרת קבצים פנימי (Local Windows Server)', 'Google Workspace / Drive', 'Atlassian Jira / Confluence', 'בסיסי נתונים SQL / Cloud']
    : ['Microsoft 365 / SharePoint / OneDrive', 'Local Windows Server Storage', 'Google Workspace / Drive', 'Atlassian Jira / Confluence', 'SQL / Cloud Databases'];

  const BOTTLENECK_OPTIONS = isHe
    ? [
        { id: 'data_entry', label: 'הקלדת נתונים כפולה מ-PDF/חשבוניות ל-ERP' },
        { id: 'doc_search', label: 'חיפוש ידני ממושך בחוזים, מפרטים ומסמכי עבר' },
        { id: 'email_sort', label: 'עומס מסיבי של מיילים ופניות לקוחות חוזרות' },
        { id: 'quotes_gen', label: 'זמן ממושך להרכבת הצעות מחיר ומענה למכרזים' },
        { id: 'meeting_sync', label: 'כתיבת סיכומי פגישות ותיעוד ידני ב-CRM' },
        { id: 'shadow_ai', label: 'עובדים שמשתמשים בכלי AI חינמיים עם מידע מסווג' }
      ]
    : [
        { id: 'data_entry', label: 'Duplicate data entry from PDF/Invoices to ERP' },
        { id: 'doc_search', label: 'Lengthy manual searches across past contracts & specs' },
        { id: 'email_sort', label: 'Massive email volumes and repetitive client inquiries' },
        { id: 'quotes_gen', label: 'Slow turnaround for complex quotes and RFPs' },
        { id: 'meeting_sync', label: 'Manual meeting summaries and CRM updates' },
        { id: 'shadow_ai', label: 'Staff using unapproved public AI tools with confidential data' }
      ];

  const SECURITY_OPTIONS = isHe
    ? [
        'Zero Data Retention (ZDR) - מודלים שלא שומרים או מאמנים נתונים',
        'ISO 27001 & חוק הגנת הפרטיות הישראלי (תיקון 40)',
        'חסימת דליפת נתונים וסביבת AI ארגונית מבודדת (Private VPC)',
        'אינטגרציה עם Microsoft Entra ID / Okta SSO וניהול הרשאות RBAC',
        'אפשרות פריסה היברידית או מקומית (On-Prem / Air-Gapped AI)'
      ]
    : [
        'Zero Data Retention (ZDR) - Enterprise models that never train on data',
        'ISO 27001 & Israeli Privacy Protection Law',
        'DLP & Isolated Enterprise Private Cloud AI (VPC)',
        'Microsoft Entra ID / Okta SSO with Role-Based Access Control',
        'On-Premises or Air-Gapped Local LLM deployment option'
      ];

  const toggleArrayItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!fullName.trim() || !companyName.trim()) {
        setErrorMsg(isHe ? 'נא להזין שם מלא ושם חברה' : 'Please provide full name and company name');
        return;
      }
    }
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (botTrap.trim().length > 0) return;

    setIsSubmitting(true);

    const compiledBrief = customBrief.trim() || (isHe
      ? `חברה בת ${companySize} בתחום ${industry}. מערכות: ${selectedERPs.join(', ')} ואחסון ב-${selectedStorage.join(', ')}. צווארי בקבוק עיקריים: ${selectedBottlenecks.join(', ')}. דרישות אבטחה: ${securityPriorities.join(', ')}.`
      : `Enterprise of ${companySize} in ${industry}. Core systems: ${selectedERPs.join(', ')} and ${selectedStorage.join(', ')}. Bottlenecks: ${selectedBottlenecks.join(', ')}. Security: ${securityPriorities.join(', ')}.`);

    const compiledData: AIDiscoveryFormData = {
      ...formData,
      fullName: fullName.trim() || (isHe ? 'הנהלת הארגון' : 'Executive Leadership'),
      companyName: companyName.trim() || (isHe ? 'החברה שלכם' : 'Your Enterprise'),
      email: email.trim() || 'executive@company.co.il',
      phone: phone.trim() || '050-0000000',
      companySize: companySize,
      industry: industry,
      erpCrmDetails: selectedERPs.join(', '),
      docStorage: selectedStorage,
      currentAITools: currentAITools,
      timeWastingActivities: selectedBottlenecks,
      estimatedDailyWastedHoursPerEmployee: wastedHours,
      complianceNeeds: securityPriorities,
      customPainPoints: compiledBrief,
      mainProcesses: selectedBottlenecks
    };

    onChangeFormData(compiledData);

    // Send lead activity non-blocking
    try {
      fetch('/api/simulator/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'ai_wizard_full_submit',
          title: `🎯 אפיון אשף מלא מנהלים: ${compiledData.companyName} (${compiledData.fullName})`,
          formData: compiledData,
          botTrap
        })
      }).catch(() => {});
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit(compiledData);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto" dir={isHe ? 'rtl' : 'ltr'}>
      <div className={`rounded-2xl border shadow-xl overflow-hidden transition-all ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Top Stepper Bar */}
        <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {isHe ? `שלב ${currentStep} מתוך 5` : `Step ${currentStep} of 5`}
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zero Data Retention</span>
                </span>
              </div>
              <h2 className={`text-base sm:text-lg font-black font-heading mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isHe ? 'אשף אפיון AI ארגוני מקיף (Big-4 Assessment Wizard)' : 'Enterprise AI Diagnostic Wizard'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isHe ? 'חזרה לאבחון מהיר' : 'Back to Brief'}
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className={`grid grid-cols-5 p-2 sm:p-3 border-b text-center gap-1 sm:gap-2 ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          {STEPS_NAV.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            const Icon = step.icon;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isCompleted
                      ? isDark ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{isHe ? step.titleHe : step.titleEn}</span>
                <span className="md:hidden">{step.num}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 min-h-[380px]">
          
          {/* Honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={botTrap}
            onChange={(e) => setBotTrap(e.target.value)}
            className="opacity-0 absolute -top-[9999px] left-0 h-0 w-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* ================= STEP 1: ORGANIZATION PROFILE ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? '1. פרופיל הארגון ותחום הפעילות' : '1. Organization Profile & Sector'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isHe ? 'נתונים אלו מאפשרים להתאים מודל ROI ותקני אבטחה מגזריים.' : 'Defines industry baseline and compliance parameters.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isHe ? 'שם מלא *' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <User className={`w-4 h-4 absolute ${isHe ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isHe ? 'דוד כהן (מנכ"ל / סמנכ"ל)' : 'David Cohen'}
                      className={`w-full py-2.5 ${isHe ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs sm:text-sm rounded-xl border ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isHe ? 'שם החברה / הארגון *' : 'Company Name *'}
                  </label>
                  <div className="relative">
                    <Building2 className={`w-4 h-4 absolute ${isHe ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={isHe ? 'שם החברה' : 'Acme Corp'}
                      className={`w-full py-2.5 ${isHe ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs sm:text-sm rounded-xl border ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Industry Sector */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isHe ? 'תחום הפעילות המרכזי:' : 'Primary Industry Sector:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        industry === ind
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : isDark
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headcount */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isHe ? 'גודל כוח האדם בארגון:' : 'Organization Headcount:'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1-20', '21-100', '101-500', '500+'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCompanySize(sz)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        companySize.startsWith(sz) || companySize === sz
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : isDark
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sz} {isHe ? 'עובדים' : 'Staff'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: SYSTEMS & STACK ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? '2. מערכות מידע, ERP ותשתיות מסמכים' : '2. Core Business Systems & Data Repositories'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isHe ? 'בחר את המערכות אליהן נרצה לחבר את מנוע ה-AI או לאחזר מהן ידע.' : 'Select applications to integrate with private AI workflows.'}
                </p>
              </div>

              {/* ERP / CRM */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isHe ? 'מערכות ERP / CRM בשימוש הארגון (ניתן לבחור מספר מערכות):' : 'Active ERP / CRM Systems:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ERP_OPTIONS.map((erp) => {
                    const isSelected = selectedERPs.includes(erp);
                    return (
                      <button
                        key={erp}
                        type="button"
                        onClick={() => toggleArrayItem(selectedERPs, setSelectedERPs, erp)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-bold'
                            : isDark
                              ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{erp}</span>
                        {isSelected ? <Check className="w-4 h-4 text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-slate-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Storage */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isHe ? 'תשתיות אחסון מסמכים וקבצים (RAG Data Sources):' : 'Document & Knowledge Repositories:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STORAGE_OPTIONS.map((storage) => {
                    const isSelected = selectedStorage.includes(storage);
                    return (
                      <button
                        key={storage}
                        type="button"
                        onClick={() => toggleArrayItem(selectedStorage, setSelectedStorage, storage)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-bold'
                            : isDark
                              ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{storage}</span>
                        {isSelected ? <Check className="w-4 h-4 text-cyan-400" /> : <div className="w-4 h-4 rounded-full border border-slate-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: BOTTLENECKS & HOURS ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? '3. צווארי בקבוק מרכזיים והערכת שעות מבוזבזות' : '3. Key Bottlenecks & Wasted Hours'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isHe ? 'סמנו את התהליכים שגוזלים הכי הרבה זמן מהצוות ופוגעים ברווחיות.' : 'Pinpoint operations causing operational friction and labor overhead.'}
                </p>
              </div>

              {/* Bottlenecks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BOTTLENECK_OPTIONS.map((item) => {
                  const isSelected = selectedBottlenecks.includes(item.label) || selectedBottlenecks.some(b => b.includes(item.id));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleArrayItem(selectedBottlenecks, setSelectedBottlenecks, item.label)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-right flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                          : isDark
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="leading-snug">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Wasted Hours Slider / Selector */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isHe ? 'הערכת שעות עבודה ידניות מבוזבזות לעובד ביום:' : 'Estimated manual wasted hours/employee/day:'}
                  </span>
                  <span className="text-sm font-mono font-black text-cyan-400">
                    {wastedHours} {isHe ? 'שעות ביום' : 'hrs/day'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1.0, 1.8, 2.5, 3.5].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setWastedHours(h)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        wastedHours === h
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {h} {isHe ? 'שעות' : 'hrs'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: SECURITY & COMPLIANCE ================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? '4. אבטחת מידע, סודיות ורגולציה' : '4. Security Architecture & Privacy Standards'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isHe ? 'דרישות האבטחה של TECH-SELECT מבטיחות ששום מידע לא ידלוף או ישמש לאימון מודלים ציבוריים.' : 'Enterprise safeguards ensuring zero leakages and strict regulatory compliance.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {SECURITY_OPTIONS.map((sec, idx) => {
                  const isSelected = securityPriorities.includes(sec);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleArrayItem(securityPriorities, setSecurityPriorities, sec)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold text-right flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-blue-300 font-bold'
                          : isDark
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span>{sec}</span>
                      </div>
                      {isSelected ? <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isHe
                    ? 'כל ארכיטקטורת ה-AI של טק-סלקט מתוכננת על פי מודל Zero Data Retention עם הצפנת AES-256 במנוחה ובתנועה.'
                    : 'All Tech-Select AI blueprints enforce Zero Data Retention with AES-256 encryption at rest and in transit.'}
                </span>
              </div>
            </div>
          )}

          {/* ================= STEP 5: VISION & REPORT ================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isHe ? '5. חזון ה-AI ויעדים מוגדרים (סיכום והפקה)' : '5. Executive Vision & Report Synthesis'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isHe ? 'כתבו הנחיות נוספות או דגשים מיוחדים, והמנוע יסנתז את דוח המנהלים המלא.' : 'Add custom notes and trigger the comprehensive Big-4 executive report.'}
                </p>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {isHe ? 'הנחיות ודגשים מההנהלה (אופציונלי):' : 'Executive Direct Instructions (Optional):'}
                </label>
                <textarea
                  rows={4}
                  value={customBrief}
                  onChange={(e) => setCustomBrief(e.target.value)}
                  placeholder={isHe
                    ? 'לדוגמה: אנו רוצים להתחיל בפיילוט של 30 יום על מחלקת שירות והצעות מחיר, ורק לאחר מכן להתרחב לכלל החברה...'
                    : 'e.g., We wish to pilot for 30 days in sales quotes, then scale to all business units...'}
                  className={`w-full p-3.5 text-xs sm:text-sm rounded-xl border leading-relaxed ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Summary Cards */}
              <div className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isHe ? 'חברה ואיש קשר' : 'Company & Lead'}</span>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{companyName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isHe ? 'מערכות ERP' : 'ERP Systems'}</span>
                  <strong className={isDark ? 'text-cyan-400' : 'text-blue-700'}>{selectedERPs[0] || 'Priority'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isHe ? 'צווארי בקבוק' : 'Bottlenecks'}</span>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedBottlenecks.length} {isHe ? 'אותרו' : 'selected'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isHe ? 'חיסכון שעות' : 'Target Savings'}</span>
                  <strong className="text-emerald-400">~{Math.round(wastedHours * 22 * (companySize.includes('21') ? 50 : 25))} {isHe ? 'שעות/חודש' : 'hrs/mo'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Bottom Navigation Actions */}
        <div className={`p-4 sm:p-6 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isHe ? 'הקודם' : 'Previous'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isHe ? 'ביטול' : 'Cancel'}
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isHe ? 'המשך לשלב הבא' : 'Next Step'}</span>
              {isHe ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleFinalSubmit()}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isHe ? 'מפיק דוח...' : 'Synthesizing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>{isHe ? 'הפק דוח מנהלים מבוסס AI' : 'Generate Executive Report'}</span>
                  {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
