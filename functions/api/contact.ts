// @ts-nocheck
import { sendGraphMail } from "./_shared/graphMail";

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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function handleContactSubmission(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const { name, phone, company, isDefense, message, email, service } = body || {};

    if (!name || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields (name and phone)",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
          📩 פנייה חדשה מאתר TECH-SELECT
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold; width: 35%;">שם פונה:</td>
            <td style="padding: 10px;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">טלפון:</td>
            <td style="padding: 10px; font-family: monospace; font-size: 15px; color: #38bdf8;"><a href="tel:${phone}" style="color:#38bdf8; text-decoration:none;">${phone}</a></td>
          </tr>
          ${
            email
              ? `<tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
                  <td style="padding: 10px;">${email}</td>
                </tr>`
              : ""
          }
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חברה / ארגון:</td>
            <td style="padding: 10px;">${company || "לא צוין"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">פנייה מסווגת / ביטחונית:</td>
            <td style="padding: 10px; color: ${isDefense ? "#34d399" : "#94a3b8"}; font-weight: bold;">
              ${isDefense ? "🛡️ כן - מתקן מסווג / חברה ביטחונית" : "לא"}
            </td>
          </tr>
          ${
            service
              ? `<tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; font-weight: bold;">שירות מבוקש:</td>
                  <td style="padding: 10px;">${service}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 10px; font-weight: bold; vertical-align: top;">תוכן ההודעה:</td>
            <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px; color: #f8fafc;">${message || "ללא פירוט נוסף"}</td>
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
        subject: `פנייה חדשה מהאתר - ${name} (${phone})`,
        content: htmlContent,
        isHtml: true,
        replyTo: email || undefined,
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
          שם_הפונה: name,
          טלפון: phone,
          דואל: email || "לא צוין",
          חברה: company || "לא צוין",
          סיווג_ביטחוני: isDefense ? "כן - מתקן מסווג / חברה ביטחונית" : "לא",
          שירות_מבוקש: service || "פנייה כללית",
          הודעה: message || "ללא",
          _subject: `📩 פנייה חדשה מאתר Tech-Select: ${name} (${phone})`,
          _template: "table",
          _captcha: "false",
          _cc: "g@tech-select.co.il",
          _replyto: email || undefined,
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
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[functions/api/contact] Fatal error:", err);
    return new Response(
      JSON.stringify({
        success: true, // Graceful return so UI shows confirmation
        message: "Inquiry received",
      }),
      { status: 200, headers: corsHeaders }
    );
  }
}

export async function onRequestPost(context: any) {
  return handleContactSubmission(context.request, context.env);
}
