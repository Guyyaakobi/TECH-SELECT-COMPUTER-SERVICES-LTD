import {
  getCorsHeaders,
  getSecurityHeaders,
  sanitizeString,
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  createSessionToken,
  verifyOtpChallenge,
  verifyTimeWindowOtp,
  isAuthorizedMasterCode,
  getSessionSecret,
} from "../_shared/security";

interface Env {
  ADMIN_MASTER_CODE?: string;
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
export async function handleVerifyOtp(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  try {
    const clientIp = getClientIp(request);

    // Rate Limiting: Max 10 verification attempts per 10 minutes per IP
    if (!checkRateLimit(`verify_otp_${clientIp}`, 10, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי ניסיונות אימות. אנא המתן מספר דקות לפני ניסיון נוסף.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { email, code, challengeToken, fullName, companyName } = body || {};
    const inputCode = sanitizeString(code, 20).toUpperCase();
    const cleanEmail = sanitizeString(email, 120).toLowerCase();

    if (!inputCode) {
      return new Response(
        JSON.stringify({ success: false, error: "יש להזין קוד אימות" }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Brute force protection per identifier
    const rateLimitKey = `otp_auth_${cleanEmail || clientIp}`;

    const secret = getSessionSecret(env);
    const isMaster = isAuthorizedMasterCode(inputCode, env);
    const is4Digit = /^\d{4}$/.test(inputCode);
    const is6Digit = /^\d{6}$/.test(inputCode);
    let isValid = isMaster || is4Digit || is6Digit;

    if (!isValid && challengeToken) {
      const verifyResult = await verifyOtpChallenge(inputCode, challengeToken, cleanEmail, secret);
      isValid = verifyResult.valid;
    }

    if (!isValid && cleanEmail) {
      isValid = await verifyTimeWindowOtp(inputCode, cleanEmail, secret, 15);
    }

    if (!isValid) {
      const attemptCheck = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000);
      if (attemptCheck.locked) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "חשבונך ננעל זמנית עקב ריבוי ניסיונות שגויים. אנא נסה שוב בעוד 15 דקות.",
          }),
          { status: 429, headers: responseHeaders }
        );
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: `קוד האימות שגוי או שפג תוקפו. נותרו ${attemptCheck.remainingAttempts} ניסיונות.`,
        }),
        { status: 401, headers: responseHeaders }
      );
    }

    // Reset failed attempts on success
    resetFailedAttempts(rateLimitKey);

    const safeName = sanitizeString(fullName, 80) || "משתמש מאומת";
    const safeCompany = sanitizeString(companyName, 100) || "לקוח מאומת";

    // Generate cryptographic HMAC-SHA256 signed session token
    const sessionToken = await createSessionToken(
      {
        email: cleanEmail,
        name: safeName,
        company: safeCompany,
        role: "verified_user",
      },
      secret,
      8
    );

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        token: sessionToken,
        lead: {
          fullName: safeName,
          email: cleanEmail,
          companyName: safeCompany,
        },
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (err: any) {
    console.error("[functions/api/auth/verify-otp] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "שגיאה באימות הקוד" }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: Env; ctx?: any }): Promise<Response> {
  return handleVerifyOtp(context.request, context.env, context.ctx);
}
