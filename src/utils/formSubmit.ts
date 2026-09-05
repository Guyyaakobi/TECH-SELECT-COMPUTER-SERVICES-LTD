/**
 * Unified dispatch helper for sending email notifications to g@tech-select.co.il
 * using Microsoft Graph API via internal endpoints with FormSubmit fallback.
 */

export interface FormSubmitPayload {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  subject: string;
  message: string;
  ccEmail?: string;
  extraData?: Record<string, any>;
}

export async function sendLeadNotificationViaFormSubmit(payload: FormSubmitPayload): Promise<boolean> {
  // Primary email destination is support@tech-select.co.il
  const url = `https://formsubmit.co/ajax/support@tech-select.co.il`;

  try {
    // Primary: Call backend route which delivers via Microsoft Graph API
    try {
      const apiRes = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          company: payload.company,
          message: payload.message,
          service: payload.subject,
        })
      });
      if (apiRes.ok) return true;
    } catch (e) {
      console.warn("Backend /api/contact call failed, falling back to formsubmit", e);
    }

    const cleanPhone = (payload.phone || "").replace(/[^0-9+]/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, '972')}` : "לא צוין";

    const bodyPayload: Record<string, any> = {
      _subject: payload.subject || "🚨 התראה חדשה מאתר Tech-Select",
      _template: "table",
      _captcha: "false",
      _cc: "g@tech-select.co.il",
      שם_הפונה: payload.name || "אורח באתר",
      טלפון: payload.phone || "לא צוין",
      קישור_וואטסאפ: waLink,
      דואל: payload.email || "לא צוין",
      שם_החברה: payload.company || "לא צוין",
      פרטי_הפנייה: payload.message,
      זמן_רישום: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
    };

    if (payload.email && payload.email.includes("@")) {
      bodyPayload._replyto = payload.email;
    }
    if (payload.ccEmail && payload.ccEmail.includes("@") && !payload.ccEmail.includes("tech-select")) {
      bodyPayload._cc = payload.ccEmail;
    }

    if (payload.extraData) {
      for (const [key, value] of Object.entries(payload.extraData)) {
        if (value !== undefined && value !== null) {
          bodyPayload[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
        }
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    const result = await response.json();
    console.log("[FORMSUBMIT SUCCESS]", result);
    return response.ok;
  } catch (error) {
    console.error("[FORMSUBMIT DISPATCH ERROR]", error);
    return false;
  }
}

import { generateReportPDF } from './pdfGenerator';

/**
 * Send prestigious, branded executive AI report to g@tech-select.co.il (and CC client if provided)
 * Automatically attaches the generated PDF file to the email!
 */
export async function sendReportEmailViaFormSubmit(params: {
  report: any;
  companyName: string;
  contactPerson: string;
  role?: string;
  phone?: string;
  email?: string;
  clientEmail?: string;
  companySize?: string;
  erp?: string;
  customPainPoints?: string;
}): Promise<boolean> {
  const url = `https://formsubmit.co/ajax/support@tech-select.co.il`;

  const cleanPhone = (params.phone || "").replace(/[^0-9+]/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, '972')}` : "לא צוין";
  const yearlySavings = params.report?.financialAnalysis?.estimatedYearlySavingsNIS || params.report?.roi?.estimatedAnnualFinancialSavingsNIS || "280,000";
  const hoursSaved = params.report?.financialAnalysis?.estimatedMonthlyHoursSaved || params.report?.roi?.monthlyHoursSaved || "240";
  const payback = params.report?.financialAnalysis?.paybackPeriodMonths || params.report?.roi?.paybackMonths || 2.8;

  let opportunitiesFormatted = "1. אוטומציית מסמכים ועיבוד נתונים\n2. סוכן ידע פנים-ארגוני RAG מאובטח\n3. אינטגרציה למערכות ERP/CRM";
  if (Array.isArray(params.report?.opportunities) && params.report.opportunities.length > 0) {
    opportunitiesFormatted = params.report.opportunities.slice(0, 4).map((opp: any, idx: number) => {
      return `【יוזמה ${idx + 1}】 ${opp.titleHe || opp.title} [${opp.category || 'AI'}]\n• אתגר: ${opp.problemDescription || opp.problemStatement || 'עומס ידני'}\n• פתרון: ${opp.aiSolution || 'מערכת AI מאובטחת'}\n• שעות חודשיות שנחסכות: כ-${opp.estimatedHoursSavedMonthly || 40} שעות | זמן פריסה: ${opp.estimatedTimeToValue || '3-4 שבועות'}`;
    }).join("\n\n");
  }

  const whyTechSelect = [
    "1. ספק מורשה משרד הביטחון (מס' 0011033280) - עמידה בסטנדרטים המחמירים ביותר של סייבר, אבטחת מידע וסודיות.",
    "2. שילוב הנדסי מנצח של 3 עולמות: תשתית IT ארגונית יציבה, אבטחת מידע מתקדמת (DLP), ופיתוח תוכנה ייעודי עם אינטגרציות API.",
    "3. ניסיון הנדסי מוכח של מעל 15 שנה בהובלת גיא יעקובי בניהול IT, פרויקטים מורכבים וארכיטקטורת ענן היברידי.",
    "4. אינטגרציה עמוקה ובטוחה למערכות הליבה (Priority, SAP, Salesforce, Monday) ללא סיכון פעילות הארגון.",
    "5. מחויבות לתוצאות, שקיפות (FinOps), SLA קשיח וליווי אנושי צמוד עד להטמעה מלאה בקרב העובדים."
  ].join("\n");

  const sendToEmail = params.clientEmail || params.email;

  // 1. Generate the PDF attachment
  let pdfBlob: Blob | null = null;
  let pdfBase64: string = '';
  let pdfFilename: string = `Tech-Select-AI-Report-${params.companyName || 'Company'}.pdf`;

  try {
    const pdfResult = await generateReportPDF({
      report: params.report,
      companyName: params.companyName,
      contactPerson: params.contactPerson,
      role: params.role,
      phone: params.phone,
      email: sendToEmail,
      companySize: params.companySize,
      erp: params.erp,
      customPainPoints: params.customPainPoints,
    });
    pdfBlob = pdfResult.blob;
    pdfBase64 = pdfResult.base64;
    pdfFilename = pdfResult.filename;
  } catch (pdfErr) {
    console.error("[PDF GENERATION IN FORMSUBMIT WARNING]", pdfErr);
  }

  // 2. Primary Dispatch via Microsoft Graph API through backend route
  try {
    let apiRes = await fetch("/api/ai-discovery/send-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportData: params.report,
        formData: {
          companyName: params.companyName,
          fullName: params.contactPerson,
          role: params.role,
          phone: params.phone,
          email: sendToEmail,
          companySize: params.companySize,
          erpCrmDetails: params.erp,
          customPainPoints: params.customPainPoints,
        },
        pdfBase64,
        pdfFilename,
        clientEmail: sendToEmail,
      }),
    });

    if (!apiRes.ok) {
      apiRes = await fetch("/api/ai-discovery/send-email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportData: params.report,
          formData: {
            companyName: params.companyName,
            fullName: params.contactPerson,
            role: params.role,
            phone: params.phone,
            email: sendToEmail,
            companySize: params.companySize,
            erpCrmDetails: params.erp,
            customPainPoints: params.customPainPoints,
          },
          pdfBase64,
          pdfFilename,
          clientEmail: sendToEmail,
        }),
      });
    }

    if (apiRes.ok) {
      console.log("[REPORT DISPATCH SUCCESS via Microsoft Graph API]");
      return true;
    }
  } catch (graphErr) {
    console.warn("[Internal send-report via Graph API warning]", graphErr);
  }

  // 3. Dispatch via FormData (supports attachment in FormSubmit as fallback)
  try {
    const formData = new FormData();
    formData.append("_subject", `📄 [דוח סימולטור מצורף כ-PDF] ${params.companyName} (${params.contactPerson} | ${params.phone || 'ללא טלפון'})`);
    formData.append("_template", "table");
    formData.append("_captcha", "false");
    formData.append("_cc", "g@tech-select.co.il");
    formData.append("קובץ_PDF_מצורף", "✅ כן! דוח אפיון והטמעת AI ארגוני מלא מצורף להודעה זו כקובץ PDF!");
    formData.append("מותג_וחברה", "💻 TECH-SELECT COMPUTER SERVICES LTD (טק-סלקט בע\"מ)");
    formData.append("רישוי_וסיווג", "🛡️ ספק מורשה משרד הביטחון (מספר ספק: 0011033280)");
    formData.append("שם_הארגון", params.companyName || "לא צוין");
    formData.append("איש_קשר_ותפקיד", `${params.contactPerson || 'נציג הנהלה'} (${params.role || 'הנהלה'})`);
    formData.append("טלפון_ישיר", params.phone || "לא צוין");
    formData.append("קישור_וואטסאפ_מהיר", waLink);
    formData.append("דואר_אלקטרוני", sendToEmail || "לא צוין");
    formData.append("גודל_ארגון", params.companySize || "לא צוין");
    formData.append("מערכות_ליבה", params.erp || "M365, ERP, שרתים");
    formData.append("תאריך_הפקה", new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }));
    formData.append("פוטנציאל_חיסכון_שנתי_משוער", typeof yearlySavings === "number" ? `₪${yearlySavings.toLocaleString()}` : `₪${yearlySavings}`);
    formData.append("חיסכון_שעות_עבודה_חודשי", `${hoursSaved} שעות בחודש`);
    formData.append("זמן_החזר_השקעה_Payback", `${payback} חודשים`);
    formData.append("תמצית_מנהלים_מלאה", params.report?.executiveSummary || "דוח אפיון והתכנות ארכיטקטורת AI הופק בהצלחה.");
    formData.append("יוזמות_AI_מרכזיות", opportunitiesFormatted);
    formData.append("ארכיטקטורת_אבטחה_וZero_Data_Retention", "אימות Entra ID SSO / MFA, שכבת שער AI Gateway עם DLP ו-Zero Data Retention, אינדוקס RAG מאובטח עם הרשאות RBAC.");
    formData.append("למה_טק_סלקט_היא_השותף_המתאים", whyTechSelect);
    formData.append("פרטי_התקשרות_מנכל", "טלפון משרד: 077-7700252 | נייד ישיר / WhatsApp לגיא יעקובי: 050-3900903 | מייל: Info@tech-select.co.il | יגאל אלון 88, תל אביב");

    if (sendToEmail && sendToEmail.includes("@") && !sendToEmail.includes("tech-select")) {
      formData.append("_replyto", sendToEmail);
      formData.append("_cc", sendToEmail);
    }

    // Attach the actual PDF file
    if (pdfBlob) {
      const pdfFile = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
      formData.append("attachment", pdfFile);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      body: formData,
    });

    return response.ok;
  } catch (err) {
    console.error("[FORMSUBMIT REPORT ERROR]", err);
    return false;
  }
}
