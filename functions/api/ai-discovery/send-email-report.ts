import { sendGraphMail } from "../_shared/graphMail";
import {
  getCorsHeaders,
  getSecurityHeaders,
  escapeHtml,
  sanitizeString,
  getClientIp,
  checkRateLimit,
} from "../_shared/security";

interface Env {
  TENANT_ID?: string;
  CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  [key: string]: any;
}

export async function onRequestOptions(contextOrRequest: any): Promise<Response> {
  const request = contextOrRequest?.request || contextOrRequest;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, "POST, OPTIONS"),
  });
}

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleSendEmailReport(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  try {
    const clientIp = getClientIp(request);

    // Rate Limiting: Max 10 email dispatches per 10 minutes per IP
    if (!checkRateLimit(`send_email_${clientIp}`, 10, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי בקשות לשליחת דוח. אנא המתן מספר דקות.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { lead, report, reportData, formData, companyContext, clientEmail, pdfBase64, pdfFilename, botTrap } = body || {};

    // Honeypot check
    if (botTrap && String(botTrap).trim().length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied" }),
        { status: 403, headers: responseHeaders }
      );
    }

    const rep = report || reportData || {};
    const fData = formData || lead || companyContext || {};

    // Sanitize user inputs
    const company = sanitizeString(fData?.companyName || rep?.companyName, 100) || "ארגון בבדיקה";
    const name = sanitizeString(fData?.fullName || rep?.contactPerson, 80) || "מנהל בארגון";
    const role = sanitizeString(fData?.role || rep?.role, 80) || "הנהלה";
    const email = sanitizeString(clientEmail || fData?.email || rep?.email, 120) || "לא צוין";
    const phone = sanitizeString(fData?.phone || rep?.phone, 30) || "לא צוין";
    const companySize = sanitizeString(fData?.companySize || rep?.companySize, 40) || "לא צוין";

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, "972")}` : "לא צוין";

    const rawYearly = rep?.financialAnalysis?.estimatedYearlySavingsNIS || rep?.roi?.estimatedAnnualFinancialSavingsNIS || 280000;
    const yearlySavings = typeof rawYearly === "number" ? rawYearly.toLocaleString() : sanitizeString(rawYearly, 30);
    const hoursSaved = sanitizeString(rep?.financialAnalysis?.estimatedMonthlyHoursSaved || rep?.roi?.monthlyHoursSaved || 240, 20);
    const summary = sanitizeString(rep?.executiveSummary || "דוח אפיון והתכנות AI ארגוני הופק בהצלחה.", 1500);

    // Format opportunities
    let opportunitiesFormatted = "1. אוטומציית מסמכים ועיבוד נתונים\n2. סוכן ידע פנים-ארגוני RAG מאובטח\n3. אינטגרציה למערכות ERP/CRM";
    if (Array.isArray(rep?.opportunities) && rep.opportunities.length > 0) {
      opportunitiesFormatted = rep.opportunities.slice(0, 4).map((opp: any, idx: number) => {
        const d = sanitizeString(opp.department || "כללי", 40);
        const t = sanitizeString(opp.title || "יוזמה", 80);
        const s = sanitizeString(opp.aiSolution || opp.problemStatement || "", 200);
        return `${idx + 1}. [${d}] ${t}: ${s}`;
      }).join("\n\n");
    }

    // HTML Escape all dynamic values
    const safeCompany = escapeHtml(company);
    const safeName = escapeHtml(name);
    const safeRole = escapeHtml(role);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safeSize = escapeHtml(companySize);
    const safeSummary = escapeHtml(summary);
    const safeOpp = escapeHtml(opportunitiesFormatted);

    const reportSubject = `📄 [דוח אפיון ארכיטקטורת AI] עבור ${safeCompany} (${safeName} | ${safePhone})`;
    const htmlReport = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 650px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
          📊 דוח אפיון ארכיטקטורת AI ומפת דרכים
        </h2>
        <p style="font-size: 14px; color: #94a3b8;">הדוח הופק אוטומטית על ידי סימולטור ה-AI של Tech-Select</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold; width: 35%;">חברה:</td>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${safeCompany}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">איש קשר:</td>
            <td style="padding: 10px;">${safeName} (${safeRole})</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">טלפון:</td>
            <td style="padding: 10px;"><a href="tel:${safePhone}" style="color: #38bdf8;">${safePhone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
            <td style="padding: 10px;">${safeEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">גודל ארגון:</td>
            <td style="padding: 10px;">${safeSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חיסכון שנתי משוער:</td>
            <td style="padding: 10px; color: #34d399; font-weight: bold;">₪${escapeHtml(yearlySavings)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חיסכון שעות חודשי:</td>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${escapeHtml(hoursSaved)} שעות בחודש</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; vertical-align: top;">תמצית מנהלים:</td>
            <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px;">${safeSummary}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 12px; background-color: #1e293b; border-radius: 8px;">
          <h4 style="color: #38bdf8; margin: 0 0 8px 0;">יוזמות AI מרכזיות:</h4>
          <p style="white-space: pre-wrap; margin: 0; font-size: 13px; color: #cbd5e1;">${safeOpp}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
          TECH-SELECT Computer Services LTD | ספק מורשה משרד הביטחון 0011033280 | נייד ישיר לגיא יעקובי: 050-3900903
        </p>
      </div>
    `;

    // 1. Send via Microsoft Graph API to Guy & Support
    const attachments = [];
    if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length < 5 * 1024 * 1024) {
      const safeFilename = sanitizeString(pdfFilename || `Tech-Select-AI-Report-${company}.pdf`, 100).replace(/[^a-zA-Z0-9_\u0590-\u05FF.-]/g, "_");
      attachments.push({
        filename: safeFilename,
        content: pdfBase64,
        contentType: "application/pdf",
      });
    }

    sendGraphMail(env, {
      to: ["g@tech-select.co.il", "support@tech-select.co.il"],
      subject: reportSubject,
      content: htmlReport,
      isHtml: true,
      replyTo: email && email.includes("@") ? email : undefined,
      attachments,
    }).catch((e) => console.error("[send-email-report] Graph admin send error:", e));

    // Also send copy to the client if email is valid and not internal
    if (email && email.includes("@") && !email.includes("tech-select")) {
      sendGraphMail(env, {
        to: email.trim(),
        subject: `הדוח המנהלי שלכם לאפיון AI - חברת ${safeCompany} | TECH-SELECT`,
        content: htmlReport,
        isHtml: true,
        attachments,
      }).catch((e) => console.error("[send-email-report] Graph client send error:", e));
    }

    // 2. Reliable Backup delivery to FormSubmit
    fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://tech-select.co.il",
        "Referer": "https://tech-select.co.il/ai-discovery",
      },
      body: JSON.stringify({
        שם_הארגון: company,
        איש_קשר_ותפקיד: `${name} (${role})`,
        טלפון: phone,
        דואל: email,
        גודל_ארגון: companySize,
        חיסכון_שנתי: yearlySavings,
        חיסכון_שעות_חודשי: hoursSaved,
        תמצית_מנהלים: summary,
        יוזמות: opportunitiesFormatted,
        _subject: reportSubject,
        _template: "table",
        _captcha: "false",
        _cc: "g@tech-select.co.il",
        _replyto: email && email.includes("@") ? email : undefined,
        זמן_הפקה: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
      }),
    }).catch((e) => console.warn("[send-email-report] FormSubmit backup error:", e));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Executive AI Report dispatched successfully",
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to dispatch email",
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleSendEmailReport(req, env, ctxParam);
}
