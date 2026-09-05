import { sendGraphMail } from "../_shared/graphMail";
import {
  getCorsHeaders,
  getSecurityHeaders,
  escapeHtml,
  sanitizeString,
  validateEmail,
  validatePhone,
  checkRateLimit,
  getClientIp,
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
export async function handleRequestAccessCode(
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

    // Rate Limiting: Max 5 code requests per 10 minutes per IP
    if (!checkRateLimit(`req_code_${clientIp}`, 5, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי בקשות בזמן קצר. אנא המתינו מספר דקות או פנו לתמיכה.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { fullName, email, phone, companyName, companySize, botTrap } = body || {};

    // Honeypot anti-bot check
    if (botTrap && String(botTrap).trim().length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied" }),
        { status: 403, headers: responseHeaders }
      );
    }

    // Input Sanitization & Validation
    const cleanName = sanitizeString(fullName, 80) || "מנהל בארגון";
    const cleanCompany = sanitizeString(companyName, 100) || "חברה בבדיקה";
    const cleanEmail = sanitizeString(email, 120).toLowerCase();
    const cleanPhone = sanitizeString(phone, 30);
    const cleanSize = sanitizeString(companySize, 40) || "21-100";

    const isEmailValid = validateEmail(cleanEmail);
    const isPhoneValid = validatePhone(cleanPhone);

    if (!isEmailValid && !isPhoneValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "נא להזין כתובת מייל תקינה או מספר טלפון לקבלת קוד גישה",
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Generate secure cryptographic random 4-digit OTP challenge (fresh random code + HMAC signed token)
    const identifier = cleanEmail || cleanPhone;
    const secret = getSessionSecret(env);
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const directCode = String(1000 + (randomArray[0] % 9000));
    const challengeToken = await createOtpChallengeToken(directCode, identifier, secret);

    // Persist to Cloudflare Workers KV
    const kv = env.OTP_KV || env.KV || env.AUTH_KV || env.TECH_SELECT_KV;
    if (kv && typeof kv.put === "function") {
      try {
        const kvPayload = JSON.stringify({
          code: directCode,
          email: cleanEmail,
          phone: cleanPhone,
          identifier,
          fullName: cleanName,
          companyName: cleanCompany,
          createdAt: Date.now(),
          expiresAt: Date.now() + 15 * 60 * 1000,
          challengeToken,
        });
        if (identifier) await kv.put(`otp_${identifier}`, kvPayload, { expirationTtl: 900 });
        if (cleanEmail && cleanEmail !== identifier) await kv.put(`otp_${cleanEmail}`, kvPayload, { expirationTtl: 900 });
        await kv.put(`otp_code_${directCode}`, kvPayload, { expirationTtl: 900 });
      } catch (kvErr) {
        console.warn("[request-access-code] KV write warning:", kvErr);
      }
    }

    // In-memory fallback
    try {
      const gStore = (globalThis as any).__techSelectOtpMap || new Map<string, any>();
      (globalThis as any).__techSelectOtpMap = gStore;
      const memPayload = {
        code: directCode,
        email: cleanEmail,
        phone: cleanPhone,
        identifier,
        fullName: cleanName,
        companyName: cleanCompany,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        challengeToken,
      };
      if (identifier) gStore.set(`otp_${identifier}`, memPayload);
      if (cleanEmail) gStore.set(`otp_${cleanEmail}`, memPayload);
      gStore.set(`otp_code_${directCode}`, memPayload);
    } catch {}

    const safeName = escapeHtml(cleanName);
    const safeCompany = escapeHtml(cleanCompany);
    const safeEmail = escapeHtml(cleanEmail);
    const safePhone = escapeHtml(cleanPhone);
    const safeSize = escapeHtml(cleanSize);
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, "972").replace(/\D/g, "")}` : "לא צוין";

    // 1. Dispatch 4-digit OTP directly to the user's email via Microsoft Graph API
    let userEmailSent = false;
    if (isEmailValid) {
      const userOtpSubject = `🔐 קוד אימות חד-פעמי (OTP) לפתיחת סימולטור ה-AI: ${directCode}`;
      const userOtpHtml = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0b1120; color: #e2e8f0; border-radius: 14px; border: 1px solid #1e293b; padding: 24px;">
          <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">TECH-SELECT Computer Services LTD</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">סימולטור אפיון ומוכנות AI למנהלים</p>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">שלום ${safeName},</p>
          <p style="font-size: 14px; color: #cbd5e1;">להלן קוד האימות בן 4 הספרות לפתיחת סימולטור ה-AI של ארגון <strong>${safeCompany}</strong>:</p>
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

      try {
        userEmailSent = await sendGraphMail(env, {
          to: cleanEmail,
          subject: userOtpSubject,
          content: userOtpHtml,
          isHtml: true,
        });
      } catch (e) {
        console.error("[request-access-code] User OTP email failed:", e);
      }
    }

    // 2. Dispatch internal alert to Guy via Microsoft Graph API
    const internalLeadSubject = `🚨 [קוד 4 ספרות הופק בסימולטור AI] ${safeCompany} - ${safeName} (${safePhone || 'ללא טלפון'})`;
    const internalLeadHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #0b0c10; color: #f1f5f9; border-radius: 12px;">
        <h2 style="color: #38bdf8; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">ליד חדש ביקש קוד גישה לסימולטור ה-AI</h2>
        <p><strong>קוד 4 ספרות שהופק:</strong> <span style="font-size: 22px; color: #34d399; font-weight: bold; font-family: monospace;">${directCode}</span></p>
        <p><strong>שם:</strong> ${safeName}</p>
        <p><strong>חברה:</strong> ${safeCompany}</p>
        <p><strong>טלפון:</strong> <a href="tel:${safePhone}" style="color: #38bdf8;">${safePhone || 'לא צוין'}</a></p>
        <p><strong>אימייל:</strong> ${safeEmail || 'לא צוין'}</p>
        <p><strong>גודל ארגון:</strong> ${safeSize}</p>
        <p><strong>סטטוס שליחת מייל למשתמש:</strong> ${userEmailSent ? 'נשלח בהצלחה' : 'נכשל או לא הוזן מייל'}</p>
        <p><strong>וואטסאפ:</strong> <a href="${waLink}" style="color: #34d399;">פתיחת שיחה מהירה בוואטסאפ</a></p>
      </div>
    `;

    try {
      await sendGraphMail(env, {
        to: ["g@tech-select.co.il", "support@tech-select.co.il"],
        subject: internalLeadSubject,
        content: internalLeadHtml,
        isHtml: true,
        replyTo: isEmailValid ? cleanEmail : undefined,
      });
    } catch (e) {
      console.error("[request-access-code] Admin alert email failed:", e);
    }

    // Backup alert via FormSubmit in case Graph Mail credentials are not provisioned in this environment
    fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://tech-select.co.il",
      },
      body: JSON.stringify({
        נושא: `[קוד 4 ספרות] ${cleanCompany} - ${cleanName}`,
        קוד_סודי_4_ספרות: directCode,
        שם_מלא: cleanName,
        חברה: cleanCompany,
        טלפון: cleanPhone,
        אימייל: cleanEmail,
        גודל_ארגון: cleanSize,
        זמן: new Date().toISOString(),
      }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        message: "קוד אימות בן 4 ספרות נשלח בהצלחה לכתובת המייל שלך. אנא בדוק את תיבת הדואר הנכנס (כולל תיקיית ספאם/קידומי מכירות) והזן את 4 הספרות להפעלת הסימולטור.",
        challengeToken,
        expiresInMinutes: 15,
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process request",
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleRequestAccessCode(req, env, ctxParam);
}
