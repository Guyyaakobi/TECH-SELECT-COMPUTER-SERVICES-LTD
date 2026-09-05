import { sendGraphMail } from "../_shared/graphMail";
import {
  getCorsHeaders,
  getSecurityHeaders,
  escapeHtml,
  sanitizeString,
  getClientIp,
  checkRateLimit,
  getSessionSecret,
  createOtpChallengeToken,
  generateTimeWindowOtp,
} from "../_shared/security";

interface Env {
  TENANT_ID?: string;
  CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
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
export async function handleSendOtp(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  try {
    const clientIp = getClientIp(request);

    // Rate Limiting: Max 5 OTP requests per 10 minutes per IP
    if (!checkRateLimit(`send_otp_${clientIp}`, 5, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי בקשות לקוד אימות. אנא המתן מספר דקות לפני ניסיון נוסף.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { email, fullName, action } = body || {};
    const cleanEmail = sanitizeString(email, 120).toLowerCase();
    const cleanName = sanitizeString(fullName, 80) || "משתמש באתר";
    const actionDesc = sanitizeString(action, 100) || "אימות זהות למוקד התמיכה וה-AI";

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return new Response(
        JSON.stringify({ success: false, error: "כתובת דוא״ל תקינה נדרשת לקבלת קוד אימות" }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Generate secure cryptographic OTP challenge (deterministic windowed code + HMAC signed token)
    const secret = getSessionSecret(env);
    const otpCode = await generateTimeWindowOtp(cleanEmail, secret, 15);
    const challengeToken = await createOtpChallengeToken(otpCode, cleanEmail, secret);

    const safeName = escapeHtml(cleanName);
    const safeAction = escapeHtml(actionDesc);

    const userOtpSubject = `🔐 קוד אימות 4 ספרות - Tech-Select`;
    const userOtpHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
          <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">טק-סלקט שירותי מחשוב בע"מ</span>
          <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">קוד אימות 4 ספרות</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          שלום <strong>${safeName}</strong>,<br>
          התקבלה בקשת אימות זהות עבור ${safeAction}.<br>
          קוד האימות שלך בן 4 ספרות הוא:
        </p>
        <div style="background-color: #1e1b4b; border: 2px solid #38bdf8; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="color: #93c5fd; font-size: 13px; font-weight: bold; margin-bottom: 6px;">🔢 קוד האימות שלך:</div>
          <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
          <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">(תוקף: 15 דקות • אין להעביר קוד זה)</div>
        </div>
        <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
          צוות אבטחת מידע וסייבר | TECH-SELECT Computer Services LTD
        </div>
      </div>
    `;

    // 1. Send via Microsoft Graph API (support@tech-select.co.il)
    let graphSent = false;
    try {
      graphSent = await sendGraphMail(env, {
        to: cleanEmail,
        subject: userOtpSubject,
        content: userOtpHtml,
        isHtml: true,
      });

      // Internal copy to support
      sendGraphMail(env, {
        to: "support@tech-select.co.il",
        subject: `🔐 קוד אימות נשלח אל ${cleanEmail}`,
        content: userOtpHtml,
        isHtml: true,
      }).catch(() => {});
    } catch (graphErr) {
      console.warn("[SEND-OTP GRAPH WARNING]", graphErr);
    }

    // 2. Fallback backup if Graph isn't configured in this Worker
    if (!graphSent) {
      fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://tech-select.co.il",
        },
        body: JSON.stringify({
          נושא: `קוד אימות 4 ספרות`,
          נמען: cleanEmail,
          שם: cleanName,
          זמן: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({
        success: true,
        challengeToken,
        maskedEmail: cleanEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        expiresInMinutes: 15,
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (err: any) {
    console.error("[functions/api/auth/send-otp] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "שגיאה בשליחת קוד אימות" }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: Env; ctx?: any }): Promise<Response> {
  return handleSendOtp(context.request, context.env, context.ctx);
}
