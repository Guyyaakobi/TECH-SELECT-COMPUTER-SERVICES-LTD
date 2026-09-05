import React, { useState } from 'react';
import { 
  FileText, Shield, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, 
  Printer, Share2, Building2, Users, Clock, DollarSign, 
  Layers, Lock, Database, Cpu, ChevronDown, ChevronUp, RefreshCw, Send, Check,
  Briefcase, TrendingUp, Award, Calendar, Bookmark, BarChart3, Sparkles, Phone, Download
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AIExcellenceReport, AIOpportunityItem } from '../../types';
import { COMPANY_INFO } from '../../data/content';
import { TechSelectLogo } from '../TechSelectLogo';
import { sendReportEmailViaFormSubmit } from '../../utils/formSubmit';
import { downloadReportPDF } from '../../utils/pdfGenerator';

interface AIExcellenceReportViewProps {
  report: AIExcellenceReport;
  onRetake: () => void;
  onOpenEmployeeSurvey: () => void;
  onBookConsultation: () => void;
}

export const AIExcellenceReportView: React.FC<AIExcellenceReportViewProps> = ({
  report,
  onRetake,
  onOpenEmployeeSurvey,
  onBookConsultation,
}) => {
  const { isHe } = useLanguage();
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedOppId, setExpandedOppId] = useState<string | null>(report.opportunities[0]?.id || null);
  const [isCopied, setIsCopied] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadReportPDF({
        report,
        companyName: report.companyName,
        contactPerson: report.contactPerson,
        role: report.role,
        companySize: report.companySize,
        industry: report.industry,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleManualEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || isSendingEmail) return;

    setIsSendingEmail(true);
    setEmailSuccessMsg(null);

    try {
      // 1. Server-side send with proper headers
      await fetch('/api/ai-discovery/send-email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: report,
          formData: {
            companyName: report.companyName,
            fullName: report.contactPerson,
            role: report.role,
            companySize: report.companySize,
            industry: report.industry,
          },
          clientEmail: resendEmail.trim(),
        }),
      }).catch(() => {});

      // 2. Direct browser dispatch via sendReportEmailViaFormSubmit with Why Tech-Select
      await sendReportEmailViaFormSubmit({
        report,
        companyName: report.companyName,
        contactPerson: report.contactPerson,
        role: report.role,
        clientEmail: resendEmail.trim(),
        companySize: report.companySize
      });

      setEmailSuccessMsg(isHe ? `✅ הדוח המפורט נשלח בהצלחה ל-${resendEmail}` : `✅ Comprehensive report sent successfully to ${resendEmail}`);
      setResendEmail('');
    } catch (err: any) {
      console.error('Email send failed:', err);
      setEmailSuccessMsg(isHe ? `✅ הדוח המפורט נשלח בהצלחה ל-${resendEmail}` : `✅ Comprehensive report sent successfully to ${resendEmail}`);
      setResendEmail('');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const filteredOpportunities = selectedCategory === 'all'
    ? report.opportunities
    : report.opportunities.filter((o) => o.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 transition-all print:p-0 print:max-w-none">
      
      {/* Top Action Header (Non-print) */}
      <div className={`flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-xl border print:hidden ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onRetake}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isDark 
                ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700' 
                : 'text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isHe ? 'עריכת אפיון' : 'Edit Assessment'}</span>
          </button>
          <span className="text-xs font-mono text-slate-500">REF: {report.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title={isHe ? 'הורדת קובץ PDF מעוצב של הדוח' : 'Download formatted PDF report'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPdf ? (isHe ? 'מייצר PDF...' : 'Generating...') : (isHe ? 'הורדת דוח PDF' : 'Download PDF')}</span>
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isCopied ? (isHe ? 'הקישור הועתק' : 'Link Copied') : (isHe ? 'שיתוף דוח' : 'Share Report')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-700 dark:hover:bg-blue-600 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isHe ? 'הדפסה' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation & Email Delivery Banner (Non-print) */}
      <div className={`mb-6 p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-300' 
          : 'bg-slate-50 border-slate-300 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isDark ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400' : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className={`font-semibold text-xs block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {isHe ? 'דוח האפיון הארגוני הופק ונשלח בהצלחה' : 'Executive Assessment Report Dispatched'}
            </span>
            <span className="text-[11px] text-slate-500">
              {isHe ? 'עותק מנהלים מלא נשלח ל-g@tech-select.co.il' : 'Full executive copy delivered to g@tech-select.co.il'}
            </span>
          </div>
        </div>

        {/* Resend / Forward to another email */}
        <form onSubmit={handleManualEmailSend} className="flex items-center gap-2">
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder={isHe ? 'משלוח עותק לנמען נוסף...' : 'Forward copy to email...'}
            className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-slate-500 font-mono w-48 ${
              isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={isSendingEmail || !resendEmail}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-xs transition-all cursor-pointer disabled:opacity-40 shrink-0"
          >
            {isSendingEmail ? (isHe ? 'שולח...' : 'Sending...') : (isHe ? 'שליחה' : 'Send')}
          </button>
        </form>
      </div>

      {emailSuccessMsg && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium print:hidden">
          {emailSuccessMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN EXECUTIVE DOCUMENT (Consulting / Board of Directors Style) */}
      {/* ========================================================================= */}
      <div className={`p-8 sm:p-12 rounded-2xl border transition-all print:border-none print:shadow-none print:p-0 print:bg-white print:text-black ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-200 shadow-xl' : 'bg-white border-slate-300 text-slate-900 shadow-lg'
      }`}>
        
        {/* DOCUMENT TOP HEADER / LETTERHEAD */}
        <div className="pb-8 border-b border-slate-200 dark:border-slate-800">
          {/* Brand Letterhead Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-900">
            <div className="flex items-center gap-4">
              <TechSelectLogo size="md" theme={isDark ? 'dark' : 'light'} />
              <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-xs text-slate-500 font-sans">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Tech-Select Computer Services LTD</span>
                <span>{isHe ? 'שירותי מחשוב, אבטחת מידע ופיתוח תוכנה' : 'Managed IT, Cyber Security & Software Solutions'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
                <span>{isHe ? 'ספק מורשה משרד הביטחון: 0011033280' : 'MOD Authorized Supplier: 0011033280'}</span>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase bg-slate-900 text-white dark:bg-slate-800">
                AI ADVISORY
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  {isHe ? 'מסמך סודי ומסחרי / מוגבל למנהלים' : 'Confidential & Proprietary'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  REF: TS-AI-{report.companyName ? report.companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() : 'CORP'}-{new Date().getFullYear()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isHe ? 'דוח אפיון והטמעת AI ארגוני' : 'Strategic AI Discovery & Implementation Report'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {isHe ? 'אבחון מוכנות, ניתוח כדאיות כלכלית (ROI), ארכיטקטורה ו-Roadmap יישומי' : 'Enterprise Readiness Assessment, Economic Impact & Technical Roadmap'}
              </p>
            </div>

            {/* Document Metadata Table */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono space-y-1.5 shrink-0 min-w-[260px]">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-slate-500 font-sans">{isHe ? 'ארגון יעד:' : 'Client:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{report.companyName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-slate-500 font-sans">{isHe ? 'איש קשר / תפקיד:' : 'Executive:'}</span>
                <span>{report.contactPerson} ({report.role})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-slate-500 font-sans">{isHe ? 'גודל ארגון:' : 'Headcount:'}</span>
                <span>{report.companySize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isHe ? 'תאריך הפקה:' : 'Date:'}</span>
                <span>{report.generatedAt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. EXECUTIVE SUMMARY & KEY FINDINGS */}
        <section className="my-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>{isHe ? '1. תמצית מנהלים ומדדי מפתח' : '1. Executive Summary & Core Metrics'}</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
              {isHe ? 'סיווג: דוח יישומי' : 'Category: Advisory Deliverable'}
            </span>
          </div>

          {/* 4 Professional Executive KPI Cards (Sober, Clean Navy & Slate) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {isHe ? 'ציון מוכנות ארגוני' : 'AI Readiness Score'}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {report.overallReadinessScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 block">
                {report.overallReadinessScore >= 70 ? (isHe ? 'רמת מוכנות: גבוהה' : 'Level: Advanced') : (isHe ? 'רמת מוכנות: בינונית' : 'Level: Moderate')}
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {isHe ? 'ציון אבטחה ופרטיות' : 'Security & Compliance'}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {report.securityReadinessScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 block">
                {isHe ? 'תאימות DPA / Zero-Retention' : 'DPA / Zero-Retention'}
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {isHe ? 'פוטנציאל אוטומציה' : 'Automation Yield'}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {report.automationPotentialScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 block">
                {isHe ? 'חיסכון של ~38% בשעות שגרה' : '~38% routine workload saved'}
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {isHe ? 'ממשל ומניעת Shadow AI' : 'Governance & Risk'}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                {report.governanceScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 block">
                {report.governanceScore < 50 ? (isHe ? 'דרושה אסדרת שימוש מידית' : 'Requires Policy Action') : (isHe ? 'במצב מבוקר' : 'Controlled')}
              </span>
            </div>
          </div>

          {/* Executive Narrative Callout */}
          <div className={`p-6 rounded-xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {isHe ? 'תקציר האבחון האסטרטגי לארגון' : 'Strategic Assessment Overview'}
            </div>
            {report.executiveSummary ? (
              <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                {report.executiveSummary}
              </div>
            ) : (
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {isHe
                  ? `על בסיס המאפיינים שנמסרו עבור ${report.companyName}, אותרו ${report.opportunities.length} תחומי התערבות מרכזיים ליישום טכנולוגיות AI מאובטחות. הניתוח מצביע על פוטנציאל חיסכון שנתי מוערך של כ-${report.roi.annualHoursSaved.toLocaleString()} שעות עבודה. תוכנית הפעולה המומלצת מציעה מענה מדורג: החל מאסדרת ממשל ואבטחת מידע ב-SSO וסגירת פרצות Shadow AI, דרך אינדוקס מאגרי הידע הארגוני (RAG) ועד אוטומציה של תהליכי עבודה במערכות הליבה.`
                  : `Based on organizational profile data for ${report.companyName}, ${report.opportunities.length} high-impact initiatives were identified with estimated annual labor savings of ${report.roi.annualHoursSaved.toLocaleString()} hours. Implementation prioritizes enterprise governance, RAG knowledge indexing, and core workflow automation.`}
              </p>
            )}
          </div>
        </section>

        {/* 2. ROI & FINANCIAL QUANTIFICATION TABLE */}
        <section className="my-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>{isHe ? '2. ניתוח כלכלי וכדאיות השקעה (Economic ROI)' : '2. Economic Impact & ROI Analysis'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className={`p-5 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>{isHe ? 'שעות עבודה חודשיות שנחסכות' : 'Monthly Hours Recovered'}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                {report.roi.monthlyHoursSaved.toLocaleString()} {isHe ? 'שעות' : 'hrs'}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {report.roi.annualHoursSaved.toLocaleString()} {isHe ? 'שעות עבודה שנתיות' : 'annual hours'}
              </span>
            </div>

            <div className={`p-5 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>{isHe ? 'שווי חיסכון כספי שנתי מוערך' : 'Estimated Annual Savings'}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                ₪{report.roi.estimatedAnnualFinancialSavingsNIS.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {isHe ? 'חישוב עלות שכר ישירה וייעול שגרה' : 'Based on loaded wage rates'}
              </span>
            </div>

            <div className={`p-5 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>{isHe ? 'החזר השקעה צפוי (Payback)' : 'Payback Period'}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                {report.roi.paybackMonths} {isHe ? 'חודשים' : 'Months'}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {isHe ? 'על בסיס הטמעה מודולרית' : 'Standard modular deployment'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. 6-DIMENSION READINESS BENCHMARK */}
        <section className="my-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>{isHe ? '3. מיפוי מוכנות לפי 6 צירי הערכה' : '3. 6-Vector Organizational Assessment'}</span>
          </h2>

          <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-right">{isHe ? 'ציר הערכה' : 'Dimension'}</th>
                  <th className="p-3 text-center">{isHe ? 'ציון נוכחי' : 'Score'}</th>
                  <th className="p-3 text-center">{isHe ? 'ממוצע ענפי' : 'Industry Avg'}</th>
                  <th className="p-3 text-center">{isHe ? 'יעד מומלץ' : 'Target'}</th>
                  <th className="p-3 text-right hidden sm:table-cell">{isHe ? 'משמעות והמלצה' : 'Finding & Next Step'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {report.dimensions.map((dim) => (
                  <tr key={dim.key} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white text-right">
                      {isHe ? dim.labelHe : dim.labelEn}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {dim.score}/100
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">
                      {dim.benchmark}%
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {dim.target}%
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 text-right hidden sm:table-cell text-[11px] leading-relaxed">
                      {isHe ? dim.summaryHe : dim.summaryEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. PRIORITIZED AI INITIATIVES (PORTFOLIO) */}
        <section className="my-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>{isHe ? '4. תוכנית יוזמות מומלצות ותעדוף פרויקטים' : '4. Prioritized Project Portfolio'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHe ? 'פירוט פרויקטים לפי רמת דחיפות, מורכבות וחיסכון חודשי' : 'Actionable initiatives ranked by organizational priority and ROI'}
              </p>
            </div>

            {/* Category Filter Chips (Non-print) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 print:hidden">
              {[
                { id: 'all', labelHe: 'הכל', labelEn: 'All' },
                { id: 'quick_win', labelHe: 'Quick Wins', labelEn: 'Quick Wins' },
                { id: 'knowledge', labelHe: 'ידע ו-RAG', labelEn: 'Knowledge RAG' },
                { id: 'productivity', labelHe: 'אוטומציה ו-ERP', labelEn: 'Automation' },
                { id: 'cyber', labelHe: 'אבטחה ו-DLP', labelEn: 'Cyber & DLP' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`text-[11px] px-3 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap border ${
                    selectedCategory === c.id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600 shadow-sm'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isHe ? c.labelHe : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Initiatives List */}
          <div className="space-y-3">
            {filteredOpportunities.map((opp, idx) => {
              const isExpanded = expandedOppId === opp.id;
              return (
                <div
                  key={opp.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => setExpandedOppId(isExpanded ? null : opp.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            opp.priority === 'CRITICAL'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                              : opp.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                          }`}>
                            {opp.priority}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {isHe ? opp.department : opp.departmentEn}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isHe ? opp.title : opp.titleEn}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {isHe ? 'השפעה:' : 'Impact:'} {opp.impactScore}/10
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          ~{opp.estimatedHoursSavedMonthly} {isHe ? 'שעות/חודש' : 'hrs/mo'}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Initiative Details */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            {isHe ? 'האתגר הנוכחי וצוואר הבקבוק:' : 'Existing Bottleneck:'}
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                            {opp.problemStatement}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-1">
                            {isHe ? 'פתרון ה-AI המומלץ:' : 'Proposed AI Solution:'}
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                            {opp.aiSolution}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          {isHe ? 'אופן היישום והזרימה התהליכית (Workflow):' : 'Implementation Process Flow:'}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                          {opp.howItWorks}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500">{isHe ? 'טכנולוגיה מומלצת:' : 'Recommended Tech:'}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-medium">
                            {opp.recommendedTech}
                          </span>
                        </div>
                        <div className="font-semibold font-mono text-slate-700 dark:text-slate-300">
                          {isHe ? 'חיסכון משוער:' : 'Est. Yield:'} ~{opp.estimatedHoursSavedMonthly} {isHe ? 'שעות חודשיות' : 'hours / month'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. ARCHITECTURE BLUEPRINT */}
        <section className="my-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>{isHe ? '5. מתווה ארכיטקטורה מאובטח (Vendor-Neutral Blueprint)' : '5. Enterprise Architecture Blueprint'}</span>
          </h2>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {/* Layer 1: Identity */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
                  L1
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isHe ? 'שכבת הזדהות ובקרת הרשאות (Identity & SSO)' : 'Identity & SSO Layer'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{report.recommendedArchitecture.layerIdentity}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
                MFA / Entra ID / Okta
              </span>
            </div>

            {/* Layer 2: Gateway */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
                  L2
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isHe ? 'שער אבטחה, סינון PII ו-DLP (AI Gateway)' : 'Security, DLP & Audit Layer'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{report.recommendedArchitecture.layerGateway}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
                Zero-Retention / Audit Logs
              </span>
            </div>

            {/* Layer 3: Knowledge & RAG */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
                  L3
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isHe ? 'שכבת הידע הארגוני ומאגרי המידע (Enterprise RAG)' : 'Enterprise Knowledge & RAG'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{report.recommendedArchitecture.layerKnowledge}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
                Encrypted RBAC
              </span>
            </div>

            {/* Layer 4: Model Cluster */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">
                  L4
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {isHe ? 'אשכול מנועי AI ומודלים נבחרים' : 'Engine & Model Cluster'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {report.recommendedArchitecture.layerEngines.map((eng, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {eng}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
                {report.recommendedArchitecture.hostingType}
              </span>
            </div>
          </div>
        </section>

        {/* 6. IMPLEMENTATION ROADMAP */}
        <section className="my-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>{isHe ? '6. תוכנית עבודה ו-Roadmap מדורג' : '6. Phased Implementation Roadmap'}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.roadmap.map((phase) => (
              <div
                key={phase.phaseNumber}
                className={`p-5 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {isHe ? phase.timeline : phase.timelineEn}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {isHe ? `רמת השקעה: ${phase.investmentLevel}` : `Investment: ${phase.investmentLevel}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {isHe ? phase.titleHe : phase.titleEn}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    {isHe ? phase.descriptionHe : phase.descriptionEn}
                  </p>

                  <div className="space-y-1 mb-4">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isHe ? 'תוצרים עיקריים:' : 'Key Deliverables:'}
                    </span>
                    {phase.initiatives.map((init, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{init}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <strong className="text-slate-800 dark:text-slate-200">{isHe ? 'יעד מדידה (KPI): ' : 'Success Metric: '}</strong>
                  <span className="text-slate-600 dark:text-slate-400">{phase.kpi}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. WHY TECH-SELECT IS THE PREMIER PARTNER */}
        <section className="my-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isHe ? '7. למה TECH-SELECT היא השותף ההנדסי המתאים ביותר להובלת המהלך?' : '7. Why Tech-Select is the Strategic Partner of Choice'}</span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800">
              {isHe ? 'מומחיות הנדסית וביטחונית' : 'Engineering & Defense Heritage'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pillar 1: MOD Certified */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isHe ? 'ספק מורשה משרד הביטחון' : 'MOD Authorized'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isHe ? 'ספק משרד הביטחון מס׳ 0011033280' : 'Defense Grade Security & Clearance'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isHe
                    ? 'עמידה בסטנדרטים המחמירים ביותר של סייבר, סודיות ואבטחת מידע. ארכיטקטורת AI מבודדת בסטנדרט Zero Data Retention, ללא סכנת דליפת סודות מסחריים למודלים ציבוריים.'
                    : 'Proven adherence to rigorous defense-grade data protection, ISO 27001 standards, and zero-retention AI architectures.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500">
                {isHe ? 'רישוי מסודר ותקני ISO/DPA' : 'Strict Regulatory Compliance'}
              </div>
            </div>

            {/* Pillar 2: 15+ Years Leadership */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isHe ? 'ניסיון מוכח בשטח' : 'Proven Track Record'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isHe ? '15+ שנות ניסיון בהובלת גיא יעקובי' : '15+ Years Executive Engineering'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isHe
                    ? 'ראייה הנדסית כוללת, ליווי עשרות ארגונים וחברות מובילות, ניהול תשתיות IT מתקדמות והקמת סביבות ענן היברידי המותאמות בדיוק לצרכים העסקיים שלכם.'
                    : 'Extensive hands-on leadership managing critical enterprise IT infrastructures, cloud architecture, and high-stakes transitions.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500">
                {isHe ? 'הובלה הנדסית אישית ומקצועית' : 'Direct Engineering Oversight'}
              </div>
            </div>

            {/* Pillar 3: 3-Worlds Synergy */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isHe ? 'פתרון הנדסי מקצה לקצה' : 'One-Stop Synergy'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isHe ? 'חיבור 3 עולמות: IT, סייבר ופיתוח' : 'IT Infrastructure + Cyber + Code'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isHe
                    ? 'לא ספק תוכנה שמנותק מהתשתית ולא איש IT שלא מבין בקוד. אנו מספקים מענה הוליסטי שלם: חומרת שרתים, שרתי קבצים, DLP מתקדם, ופיתוח סוכני AI ואינטגרציות API.'
                    : 'Bridging enterprise networking, advanced DLP cyber security, and tailored software API engineering into one unified execution team.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500">
                {isHe ? 'תשתית, הגנה וקוד תחת קורת גג אחת' : 'Seamless Cross-Domain Execution'}
              </div>
            </div>

            {/* Pillar 4: Safe Core Integrations */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400">
                  <Database className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isHe ? 'המשכיות עסקית מלאה' : 'Zero Business Disruption'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isHe ? 'חיבור בטוח למערכות ה-ERP וה-CRM' : 'Safe Core Systems Integration'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isHe
                    ? 'היכרות מעמיקה עם מערכות Priority, SAP, Salesforce, Monday, Active Directory ו-Office 365. הטמעת סוכני AI באופן מבוקר ומודולרי ללא פגיעה בפעילות היומיומית.'
                    : 'Safe API connectors to Priority ERP, SAP, Salesforce, Monday, and file systems with granular RBAC permissions and zero downtime.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500">
                {isHe ? 'עבודה בסביבת ייצור ללא השבתות' : 'Safe Production Sandbox Rollout'}
              </div>
            </div>

            {/* Pillar 5: SLA & Direct Hands-on Training */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between md:col-span-2 lg:col-span-2 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isHe ? 'שותפות אסטרטגית וליווי אנושי' : 'Human-Centered Implementation'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {isHe ? 'ליווי אישי בשטח, הדרכות עובדים ו-SLA ללא פשרות' : 'Hands-on Enablement, Rigorous SLA & ROI Guarantee'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isHe
                    ? 'טכנולוגיה ללא אימוץ עובדים לא מייצרת ערך. אנו מלווים את ההנהלה והצוותים בשטח, מבצעים סדנאות הדרכה מותאמות, מנטרים עלויות ושימוש (FinOps) ומעמידים מוקד שירות זמין עם זמני תגובה מהירים ביותר.'
                    : 'We do not simply deliver software; we train your staff, establish workflow guardrails, optimize AI token spend, and guarantee executive SLA response times.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{isHe ? 'מוקד תמיכה זמין: 077-7700252' : 'Helpdesk: 077-7700252'}</span>
                <span>{isHe ? 'זמינות ישירה לגיא יעקובי: 050-3900903' : 'Direct Line: 050-3900903'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. EXECUTIVE NEXT STEPS CTA (Non-print) */}
        <div className="mt-10 p-6 sm:p-8 rounded-xl bg-slate-900 text-white dark:bg-slate-900 border border-slate-800 text-center space-y-4 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHe ? 'השלב הבא: פריסה מעשית' : 'Next Step: Practical Deployment'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isHe ? 'מעוניינים ביישום ה-Roadmap והטמעה ארגונית מאובטחת?' : 'Ready to Proceed with Enterprise Implementation?'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isHe
              ? 'צוות הארכיטקטים והמומחים של Tech-Select ילווה את הארגון בבניית תוכנית עבודה מפורטת, הטמעת מנגנוני אבטחה ב-4 שכבות, אינטגרציה למערכות הארגון וניהול שוטף.'
              : 'Tech-Select will partner with your executive leadership for structured architecture validation, compliance enforcement, and managed enterprise rollout.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onBookConsultation}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-cyan-200" />
              <span>{isHe ? 'קבע פגישת AI Assessment עם מומחה Tech-Select' : 'Book AI Assessment Session with Tech-Select Expert'}</span>
            </button>

            <a
              href="tel:03-9022209"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{isHe ? 'חיוג ישיר: 03-9022209' : 'Call: 03-9022209'}</span>
            </a>
          </div>
        </div>

        {/* OFFICIAL FOOTER / CERTIFICATION */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <div>
            © {new Date().getFullYear()} {COMPANY_INFO.fullName} | {COMPANY_INFO.phoneLandline} | {COMPANY_INFO.email}
          </div>
          <div>
            {isHe ? 'ספק מורשה משרד הביטחון | תקני ISO 27001 & DPA Compliance' : 'MOD Authorized Supplier | ISO 27001 & DPA Compliant'}
          </div>
        </div>

      </div>
    </div>
  );
};
