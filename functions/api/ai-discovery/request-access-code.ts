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
export async function handleRequestAccessCode(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const { fullName, email, phone, companyName, companySize } = body || {};

    const directCode = String(Math.floor(1000 + Math.random() * 9000));
    const cleanPhone = (phone || "").replace(/[^0-9+]/g, "");
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, "972")}` : "לא צוין";

    // 1. Dispatch 4-digit OTP directly to the user's email via Microsoft Graph API
    if (email && email.includes("@")) {
      const userOtpSubject = `🔐 קוד אימות חד-פעמי (OTP) לפתיחת סימולטור ה-AI: ${directCode}`;
      const userOtpHtml = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0b1120; color: #e2e8f0; border-radius: 14px; border: 1px solid #1e293b; padding: 24px;">
          <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">TECH-SELECT Computer Services LTD</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">סימולטור אפיון ומוכנות AI למנהלים</p>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">שלום ${fullName || 'מנהל/ת יקר/ה'},</p>
          <p style="font-size: 14px; color: #cbd5e1;">להלן קוד האימות בן 4 הספרות לפתיחת סימולטור ה-AI של ארגון <strong>${companyName || 'החברה'}</strong>:</p>
          <div style="text-align: center; background: rgba(56, 189, 248, 0.1); border: 2px dashed #38bdf8; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">קוד אימות חד-פעמי (תקף ל-15 דקות):</div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${directCode}</div>
          </div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">הזן את 4 הספרות במסך הסימולטור לפתיחה מיידית של אפיון הארכיטקטורה, חישוב ה-ROI והורדת הדוח המנהלי.</p>
          <div style="border-top: 1px solid #1e293b; padding-top: 14px; margin-top: 24px; font-size: 11px; color: #64748b; text-align: center;">
            מוקד הנדסי טק-סלקט | גיא יעקובי - ניהול IT, אבטחת מידע ופיתוח AI | 050-3900903
          </div>
        </div>
      `;

      sendGraphMail(env, {
        to: email.trim(),
        subject: userOtpSubject,
        content: userOtpHtml,
        isHtml: true,
      }).catch((e) => console.error("[request-access-code] User OTP email failed:", e));
    }

    // 2. Dispatch internal alert to Guy via Microsoft Graph API
    const internalLeadSubject = `🚨 [קוד 4 ספרות הופק בסימולטור AI] ${companyName || 'חברה'} - ${fullName || 'מנהל'} (${phone || 'ללא טלפון'})`;
    const internalLeadHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #0b0c10; color: #f1f5f9; border-radius: 12px;">
        <h2 style="color: #38bdf8; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">ליד חדש ביקש קוד גישה לסימולטור ה-AI</h2>
        <p><strong>קוד 4 ספרות שהופק:</strong> <span style="font-size: 22px; color: #34d399; font-weight: bold; font-family: monospace;">${directCode}</span></p>
        <p><strong>שם:</strong> ${fullName || 'מנהל בארגון'}</p>
        <p><strong>חברה:</strong> ${companyName || 'חברה בבדיקה'}</p>
        <p><strong>טלפון:</strong> <a href="tel:${phone}" style="color: #38bdf8;">${phone || 'לא צוין'}</a></p>
        <p><strong>אימייל:</strong> ${email || 'לא צוין'}</p>
        <p><strong>גודל ארגון:</strong> ${companySize || 'לא צוין'}</p>
        <p><strong>וואטסאפ:</strong> <a href="${waLink}" style="color: #34d399;">פתיחת שיחה מהירה בוואטסאפ</a></p>
      </div>
    `;

    sendGraphMail(env, {
      to: ["g@tech-select.co.il", "support@tech-select.co.il"],
      subject: internalLeadSubject,
      content: internalLeadHtml,
      isHtml: true,
      replyTo: email || undefined,
    }).catch((e) => console.error("[request-access-code] Admin alert email failed:", e));

    // 3. Backup delivery to FormSubmit (support@tech-select.co.il with _cc: g@tech-select.co.il)
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
          סוג_הודעה: "🚨 ליד חדש - בקשת קוד גישה לסימולטור AI Discovery",
          קוד_גישה_4_ספרות: directCode,
          שם_המנהל: fullName || "מנהל בארגון",
          שם_החברה: companyName || "חברה בבדיקה",
          טלפון: phone || "לא צוין",
          אימייל: email || "לא צוין",
          גודל_ארגון: companySize || "לא צוין",
          קישור_וואטסאפ_ישיר_למנהל: waLink,
          _subject: internalLeadSubject,
          _template: "table",
          _captcha: "false",
          _cc: "g@tech-select.co.il",
          _replyto: email || undefined,
          זמן_פנייה: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
        }),
      });
    } catch (e) {
      console.warn("[request-access-code] FormSubmit backup error:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        directCode,
        message: "Access code generated successfully",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process request",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleRequestAccessCode(req, env, ctxParam);
}
