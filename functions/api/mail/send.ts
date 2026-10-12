import {
  getCorsHeaders,
  getSecurityHeaders,
  sanitizeString,
  getClientIp,
  checkRateLimit,
} from "../_shared/security";
import { sendGraphMail } from "../_shared/graphMail";

/**
 * Cloudflare Pages Function & API Handler
 * POST /api/mail/send
 * 
 * Microsoft Graph API Email Dispatcher via Azure OAuth2 Client Credentials Flow:
 * Secrets: TENANT_ID, CLIENT_ID, CLIENT_SECRET
 * Sender: support@tech-select.co.il
 */

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

export async function handleSendMail(
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
    if (!checkRateLimit(`send_mail_${clientIp}`, 15, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי בקשות לשליחת מייל. אנא המתן מספר דקות.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const to = body?.to;
    const subject = sanitizeString(body?.subject, 200) || "הודעה חדשה ממוקד טק-סלקט";
    const content = body?.content || body?.message || body?.html || "";
    const isHtml = Boolean(body?.isHtml || body?.html);

    if (!to || !content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "חובה לציין נמען (to) ותוכן הודעה (content/html)",
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    const toAddresses: string[] = Array.isArray(to) ? to : [to];
    const validRecipients = toAddresses
      .map((a: string) => sanitizeString(a, 120).toLowerCase())
      .filter((a: string) => a.includes("@") && a.includes("."));

    if (validRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "לא סופקו כתובות מייל תקינות",
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    let allSent = true;
    for (const recipient of validRecipients) {
      const sent = await sendGraphMail(env, {
        to: recipient,
        subject,
        content: String(content),
        isHtml,
      });
      if (!sent) {
        allSent = false;
      }
    }

    if (allSent) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "המייל נשלח בהצלחה דרך Microsoft Graph API מ-support@tech-select.co.il",
          recipients: validRecipients,
        }),
        { status: 200, headers: responseHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "שגיאה בשליחת חלק מהמיילים דרך Microsoft Graph API",
          recipients: validRecipients,
        }),
        { status: 502, headers: responseHeaders }
      );
    }
  } catch (err: any) {
    console.error("[handleSendMail Fatal Error]:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "שגיאה פנימית בשליחת המייל",
        details: err?.message || String(err),
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: any, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleSendMail(req, env, ctxParam || requestOrContext?.ctx);
}
