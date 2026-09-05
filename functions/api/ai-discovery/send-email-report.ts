// @ts-nocheck
import { sendGraphMail } from "../_shared/graphMail";

interface Env {
  TENANT_ID?: string;
  CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  [key: string]: any;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleSendEmailReport(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const { lead, report, reportData, formData, companyContext, clientEmail, pdfBase64, pdfFilename } = body || {};

    const rep = report || reportData || {};
    const fData = formData || lead || companyContext || {};

    const company = fData?.companyName || rep?.companyName || "ארגון בבדיקה";
    const name = fData?.fullName || rep?.contactPerson || fData?.role || "מנהל בארגון";
    const role = fData?.role || rep?.role || "הנהלה";
    const email = clientEmail || fData?.email || rep?.email || "לא צוין";
    const phone = fData?.phone || rep?.phone || "לא צוין";
    const companySize = fData?.companySize || rep?.companySize || "לא צוין";

    const cleanPhone = (phone || "").replace(/[^0-9+]/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, '972')}` : "לא צוין";

    const yearlySavings = rep?.financialAnalysis?.estimatedYearlySavingsNIS || rep?.roi?.estimatedAnnualFinancialSavingsNIS || "280,000";
    const hoursSaved = rep?.financialAnalysis?.estimatedMonthlyHoursSaved || rep?.roi?.monthlyHoursSaved || "240";
    const summary = rep?.executiveSummary || "דוח אפיון והתכנות AI ארגוני הופק בהצלחה.";

    // Format top opportunities
    let opportunitiesFormatted = "1. אוטומציית מסמכים ועיבוד נתונים\n2. סוכן ידע פנים-ארגוני RAG מאובטח\n3. אינטגרציה למערכות ERP/CRM";
    if (Array.isArray(rep?.opportunities) && rep.opportunities.length > 0) {
      opportunitiesFormatted = rep.opportunities.slice(0, 4).map((opp: any, idx: number) => {
        return `${idx + 1}. [${opp.department || 'כללי'}] ${opp.title || 'יוזמה'}: ${opp.aiSolution || opp.problemStatement || ''}`;
      }).join("\n\n");
    }

    const reportSubject = `📄 [דוח אפיון ארכיטקטורת AI] עבור ${company} (${name} | ${phone})`;
    const htmlReport = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 650px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
          📊 דוח אפיון ארכיטקטורת AI ומפת דרכים
        </h2>
        <p style="font-size: 14px; color: #94a3b8;">הדוח הופק אוטומטית על ידי סימולטור ה-AI של Tech-Select</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold; width: 35%;">חברה:</td>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${company}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">איש קשר:</td>
            <td style="padding: 10px;">${name} (${role})</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">טלפון:</td>
            <td style="padding: 10px;"><a href="tel:${phone}" style="color: #38bdf8;">${phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
            <td style="padding: 10px;">${email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">גודל ארגון:</td>
            <td style="padding: 10px;">${companySize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חיסכון שנתי משוער:</td>
            <td style="padding: 10px; color: #34d399; font-weight: bold;">₪${typeof yearlySavings === "number" ? yearlySavings.toLocaleString() : yearlySavings}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חיסכון שעות חודשי:</td>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${hoursSaved} שעות בחודש</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; vertical-align: top;">תמצית מנהלים:</td>
            <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px;">${summary}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 12px; background-color: #1e293b; border-radius: 8px;">
          <h4 style="color: #38bdf8; margin: 0 0 8px 0;">יוזמות AI מרכזיות:</h4>
          <p style="white-space: pre-wrap; margin: 0; font-size: 13px; color: #cbd5e1;">${opportunitiesFormatted}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
          TECH-SELECT Computer Services LTD | ספק מורשה משרד הביטחון 0011033280 | נייד ישיר לגיא יעקובי: 050-3900903
        </p>
      </div>
    `;

    // 1. Send via Microsoft Graph API to Guy & Support
    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: pdfFilename || `Tech-Select-AI-Report-${company}.pdf`,
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

    // Also send copy to the client if email is valid and not tech-select
    if (email && email.includes("@") && !email.includes("tech-select")) {
      sendGraphMail(env, {
        to: email.trim(),
        subject: `הדוח המנהלי שלכם לאפיון AI - חברת ${company} | TECH-SELECT`,
        content: htmlReport,
        isHtml: true,
        attachments,
      }).catch((e) => console.error("[send-email-report] Graph client send error:", e));
    }

    // 2. Reliable Backup delivery to FormSubmit
    try {
      await fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
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
      });
    } catch (e) {
      console.warn("[send-email-report] FormSubmit backup error:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Executive AI Report dispatched successfully",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to dispatch email",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Backwards-compatible Pages/Context wrapper
export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleSendEmailReport(req, env, ctxParam);
}
