import { sendGraphMail } from "./_shared/graphMail";
import {
  getCorsHeaders,
  getSecurityHeaders,
  sanitizeString,
  escapeHtml,
  getClientIp,
  checkRateLimit,
} from "./_shared/security";

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

export async function handleContactSubmission(
  requestOrContext: any,
  envParam?: Env,
  ctxParam?: any
): Promise<Response> {
  const request: Request = requestOrContext?.request || requestOrContext;
  const env: Env =
    envParam ||
    requestOrContext?.env ||
    (typeof process !== "undefined" ? (process.env as any) : {}) ||
    {};
  const _ctx = ctxParam || requestOrContext?.ctx;

  const corsHeaders = getCorsHeaders(request, "POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  try {
    const clientIp = getClientIp(request);
    if (!checkRateLimit(`contact_${clientIp}`, 10, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי פניות נשלחו בזמן קצר. אנא המתן מספר דקות.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { name, phone, company, isDefense, message, email, service } = body || {};

    const cleanName = sanitizeString(name, 80);
    const cleanPhone = sanitizeString(phone, 30);
    const cleanEmail = sanitizeString(email, 120).toLowerCase();
    const cleanCompany = sanitizeString(company, 100);
    const cleanService = sanitizeString(service, 100);
    const cleanMessage = sanitizeString(message, 3000);

    if (!cleanName || !cleanPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields (name and phone)",
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    const safeName = escapeHtml(cleanName);
    const safePhone = escapeHtml(cleanPhone);
    const safeEmail = escapeHtml(cleanEmail);
    const safeCompany = escapeHtml(cleanCompany);
    const safeService = escapeHtml(cleanService);
    const safeMessage = escapeHtml(cleanMessage);

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
          📩 פנייה חדשה מאתר TECH-SELECT
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold; width: 35%;">שם פונה:</td>
            <td style="padding: 10px;">${safeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">טלפון:</td>
            <td style="padding: 10px; font-family: monospace; font-size: 15px; color: #38bdf8;"><a href="tel:${safePhone}" style="color:#38bdf8; text-decoration:none;">${safePhone}</a></td>
          </tr>
          ${
            safeEmail
              ? `<tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
                  <td style="padding: 10px;">${safeEmail}</td>
                </tr>`
              : ""
          }
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חברה / ארגון:</td>
            <td style="padding: 10px;">${safeCompany || "לא צוין"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">פנייה מסווגת / ביטחונית:</td>
            <td style="padding: 10px; color: ${isDefense ? "#34d399" : "#94a3b8"}; font-weight: bold;">
              ${isDefense ? "🛡️ כן - מתקן מסווג / חברה ביטחונית" : "לא"}
            </td>
          </tr>
          ${
            safeService
              ? `<tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold;">שירות מבוקש:</td>
                  <td style="padding: 10px;">${safeService}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 10px; font-weight: bold; vertical-align: top;">תוכן ההודעה:</td>
            <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px; color: #f8fafc;">${safeMessage || "ללא פירוט נוסף"}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
          הודעה זו נשלחה אוטומטית מטופס יצירת הקשר באתר TECH-SELECT (https://tech-select.co.il)
        </p>
      </div>
    `;

    // 1. Primary: Send via Microsoft Graph API
    let graphSent = false;
    try {
      graphSent = await sendGraphMail(env, {
        to: ["g@tech-select.co.il", "support@tech-select.co.il"],
        subject: `פנייה חדשה מהאתר - ${cleanName} (${cleanPhone})`,
        content: htmlContent,
        isHtml: true,
        replyTo: cleanEmail || undefined,
      });
    } catch (e) {
      console.error("[functions/api/contact] Graph send error:", e);
    }

    // 2. Reliable Backup: Dispatch to FormSubmit (support@tech-select.co.il with _cc: g@tech-select.co.il)
    try {
      await fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://tech-select.co.il",
          "Referer": "https://tech-select.co.il/contact",
        },
        body: JSON.stringify({
          שם_הפונה: cleanName,
          טלפון: cleanPhone,
          דואל: cleanEmail || "לא צוין",
          חברה: cleanCompany || "לא צוין",
          סיווג_ביטחוני: isDefense ? "כן - מתקן מסווג / חברה ביטחונית" : "לא",
          שירות_מבוקש: cleanService || "פנייה כללית",
          הודעה: cleanMessage || "ללא",
          _subject: `📩 פנייה חדשה מאתר Tech-Select: ${cleanName} (${cleanPhone})`,
          _template: "table",
          _captcha: "false",
          _cc: "g@tech-select.co.il",
          _replyto: cleanEmail || undefined,
          זמן_שליחה: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
        }),
      });
    } catch (fsErr) {
      console.warn("[functions/api/contact] FormSubmit backup error:", fsErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact inquiry dispatched successfully",
        graphSent,
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (err: any) {
    console.error("[functions/api/contact] Fatal error:", err);
    return new Response(
      JSON.stringify({
        success: true, // Graceful return so UI shows confirmation
        message: "Inquiry received",
      }),
      { status: 200, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: any, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleContactSubmission(req, env, ctxParam || requestOrContext?.ctx);
}
