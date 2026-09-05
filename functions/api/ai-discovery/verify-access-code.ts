import {
  getCorsHeaders,
  getSecurityHeaders,
  sanitizeString,
  getClientIp,
  getSessionSecret,
  verifyOtpChallenge,
  createSessionToken,
  recordFailedAttempt,
  resetFailedAttempts,
  checkRateLimit,
} from "../_shared/security";

interface Env {
  SESSION_SECRET?: string;
  CLIENT_SECRET?: string;
  ADMIN_MASTER_CODE?: string;
  [key: string]: any;
}

// In-memory set to prevent replay attacks (One-time use enforcement)
const consumedChallenges = new Set<string>();

export async function onRequestOptions(contextOrRequest: any): Promise<Response> {
  const request = contextOrRequest?.request || contextOrRequest;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, "POST, OPTIONS"),
  });
}

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleVerifyAccessCode(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  try {
    const clientIp = getClientIp(request);
    const ipRateLimitKey = `verify_rate_${clientIp}`;

    // Rate Limiting: Max 15 verification calls per 10 minutes per IP
    if (!checkRateLimit(ipRateLimitKey, 15, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי ניסיונות אימות. אנא המתינו 10 דקות לפני ניסיון חוזר.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { code, challengeToken, email, phone, companyName, fullName, companySize, lead, botTrap } = body || {};

    // Honeypot bot check
    if (botTrap && String(botTrap).trim().length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied" }),
        { status: 403, headers: responseHeaders }
      );
    }

    const trimmedCode = sanitizeString(code, 20).toUpperCase();
    const cleanEmail = sanitizeString(email || lead?.email, 120).toLowerCase();
    const cleanPhone = sanitizeString(phone || lead?.phone, 30);
    const identifier = cleanEmail || cleanPhone;
    const bruteForceKey = `brute_${clientIp}_${identifier || "anon"}`;

    if (!trimmedCode) {
      return new Response(
        JSON.stringify({ success: false, error: "נא להזין קוד אימות" }),
        { status: 400, headers: responseHeaders }
      );
    }

    const secret = getSessionSecret(env);

    // Check if secure admin master code is configured in environment (NEVER hardcoded in source)
    const envMasterCode = (env.ADMIN_MASTER_CODE || (typeof process !== "undefined" && process.env?.ADMIN_MASTER_CODE) || "").trim().toUpperCase();
    const isAuthorizedMaster = Boolean(envMasterCode && envMasterCode.length >= 8 && trimmedCode === envMasterCode);

    let isCodeValid = false;

    if (isAuthorizedMaster) {
      isCodeValid = true;
    } else if (challengeToken) {
      // Replay prevention: check if this challenge token was already consumed
      if (consumedChallenges.has(challengeToken)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "קוד אימות זה כבר נוצל (קוד חד-פעמי). אנא בקש קוד חדש.",
          }),
          { status: 401, headers: responseHeaders }
        );
      }

      const challengeResult = await verifyOtpChallenge(trimmedCode, challengeToken, identifier, secret);
      if (challengeResult.valid) {
        isCodeValid = true;
        // Mark challenge consumed (limit set size to prevent memory leaks)
        if (consumedChallenges.size > 5000) {
          consumedChallenges.clear();
        }
        consumedChallenges.add(challengeToken);
      }
    }

    if (!isCodeValid) {
      // Record failed attempt for brute-force protection
      const attempt = recordFailedAttempt(bruteForceKey, 5, 15 * 60 * 1000);
      if (attempt.locked) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "חשבונך ננעל זמנית ל-15 דקות עקב מספר ניסיונות שגויים רצופים.",
          }),
          { status: 429, headers: responseHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: `קוד אימות שגוי או שפג תוקפו. נותרו ${attempt.remainingAttempts} ניסיונות.`,
        }),
        { status: 401, headers: responseHeaders }
      );
    }

    // Reset failed attempts on success
    resetFailedAttempts(bruteForceKey);

    // Create cryptographically signed session token (Valid for 3 hours)
    const sessionPayload = {
      sid: crypto.randomUUID(),
      email: cleanEmail,
      phone: cleanPhone,
      company: sanitizeString(companyName || lead?.companyName, 100),
      name: sanitizeString(fullName || lead?.fullName, 80),
      size: sanitizeString(companySize || lead?.companySize, 40),
    };

    const sessionToken = await createSessionToken(sessionPayload, secret, 3);

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        lead: {
          companyName: sessionPayload.company,
          fullName: sessionPayload.name,
          email: sessionPayload.email,
          phone: sessionPayload.phone,
          companySize: sessionPayload.size,
        },
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to verify code",
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleVerifyAccessCode(req, env, ctxParam);
}
