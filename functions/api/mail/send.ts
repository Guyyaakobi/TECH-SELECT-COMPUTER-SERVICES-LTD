// @ts-nocheck
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

export async function handleSendMail(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const to = body?.to;
    const subject = body?.subject || "הודעה חדשה ממוקד טק-סלקט";
    const content = body?.content || body?.message || body?.html || "";
    const isHtml = Boolean(body?.isHtml || body?.html);

    if (!to || !content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "חובה לציין נמען (to) ותוכן הודעה (content/html)",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const toAddresses = Array.isArray(to) ? to : [to];

    const envObj = (env || {}) as any;
    const tenantId = (envObj.TENANT_ID || (typeof process !== "undefined" && process?.env?.TENANT_ID) || "").trim();
    const clientId = (envObj.CLIENT_ID || (typeof process !== "undefined" && process?.env?.CLIENT_ID) || "").trim();
    const clientSecret = (envObj.CLIENT_SECRET || (typeof process !== "undefined" && process?.env?.CLIENT_SECRET) || "").trim();

    if (!tenantId || !clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "חסרים נתוני הזדהות של Microsoft Graph (TENANT_ID, CLIENT_ID, CLIENT_SECRET)",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Acquire OAuth2 token from Azure AD
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text().catch(() => "");
      console.error("[Graph OAuth Token Error]:", tokenRes.status, tokenErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: "שגיאה בהנפקת טוקן הזדהות מול Azure AD",
          details: tokenErr,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData?.access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "לא התקבל Access Token מ-Azure AD",
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    // 2. Dispatch email via Microsoft Graph API sendMail endpoint
    const senderUser = "support@tech-select.co.il";
    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUser)}/sendMail`;

    const recipients = toAddresses.map((addr: string) => ({
      emailAddress: {
        address: addr.trim(),
      },
    }));

    const mailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: isHtml ? "HTML" : "Text",
          content: content,
        },
        toRecipients: recipients,
        from: {
          emailAddress: {
            address: senderUser,
            name: "טק-סלקט מוקד תמיכה",
          },
        },
      },
      saveToSentItems: true,
    };

    const graphRes = await fetch(sendMailUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailPayload),
    });

    if (graphRes.ok || graphRes.status === 202) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "המייל נשלח בהצלחה דרך Microsoft Graph API מ-support@tech-select.co.il",
          recipients: toAddresses,
        }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      const graphErr = await graphRes.text().catch(() => "");
      console.error("[Graph sendMail Error]:", graphRes.status, graphErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: "שגיאה בשליחת המייל דרך Microsoft Graph API",
          details: graphErr,
          status: graphRes.status,
        }),
        { status: 502, headers: corsHeaders }
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
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestPost(context: any) {
  return handleSendMail(context.request, context.env);
}
