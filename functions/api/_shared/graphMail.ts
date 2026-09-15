/**
 * Shared Microsoft Graph API Mail Sender for Cloudflare Pages Functions
 * Uses Azure AD OAuth2 Client Credentials flow
 * Sender: support@tech-select.co.il
 */

export interface GraphMailOptions {
  to: string | string[];
  subject: string;
  content: string;
  isHtml?: boolean;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType?: string;
  }>;
}

export async function sendGraphMail(env: any, options: GraphMailOptions): Promise<boolean> {
  const envObj = (env || {}) as any;
  const tenantId = (envObj.TENANT_ID || (typeof process !== "undefined" && process?.env?.TENANT_ID) || "").trim();
  const clientId = (envObj.CLIENT_ID || (typeof process !== "undefined" && process?.env?.CLIENT_ID) || "").trim();
  const clientSecret = (envObj.CLIENT_SECRET || (typeof process !== "undefined" && process?.env?.CLIENT_SECRET) || "").trim();

  if (!tenantId || !clientId || !clientSecret) {
    console.warn("[sendGraphMail] Missing Microsoft Graph credentials in env (TENANT_ID, CLIENT_ID, CLIENT_SECRET)");
    return false;
  }

  try {
    // 1. Acquire Access Token
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      console.error("[sendGraphMail Token Error]:", tokenRes.status, errText);
      return false;
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    if (!accessToken) {
      console.error("[sendGraphMail] No access_token received from Azure AD");
      return false;
    }

    // 2. Dispatch Email
    const sender = "support@tech-select.co.il";
    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;

    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    const recipients = toAddresses
      .filter(Boolean)
      .map((addr) => ({ emailAddress: { address: addr.trim() } }));

    if (recipients.length === 0) {
      console.error("[sendGraphMail] No recipients specified");
      return false;
    }

    const messagePayload: any = {
      subject: options.subject,
      body: {
        contentType: options.isHtml ? "HTML" : "Text",
        content: options.content,
      },
      toRecipients: recipients,
      from: {
        emailAddress: {
          address: sender,
          name: "טק-סלקט מוקד תמיכה ו-AI",
        },
      },
    };

    if (options.replyTo && options.replyTo.includes("@")) {
      messagePayload.replyTo = [
        {
          emailAddress: {
            address: options.replyTo.trim(),
          },
        },
      ];
    }

    if (options.attachments && options.attachments.length > 0) {
      messagePayload.attachments = options.attachments.map((att) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.filename,
        contentType: att.contentType || "application/octet-stream",
        contentBytes: att.content,
      }));
    }

    const graphRes = await fetch(sendMailUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messagePayload,
        saveToSentItems: true,
      }),
    });

    if (graphRes.ok || graphRes.status === 202) {
      console.log(`[sendGraphMail Success] Sent "${options.subject}" to ${JSON.stringify(toAddresses)}`);
      return true;
    } else {
      const graphErr = await graphRes.text().catch(() => "");
      console.error(`[sendGraphMail Error Status ${graphRes.status}]:`, graphErr);
      return false;
    }
  } catch (err: any) {
    console.error("[sendGraphMail Exception]:", err?.message || err);
    return false;
  }
}
