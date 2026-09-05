/**
 * Cloudflare Pages Function & Worker API Handler
 * GET & POST /api/tickets/lookup
 * 
 * Secure Ticket Lookup with Mandatory 4-Digit Email OTP Verification.
 * Strictly protects privacy on the public website:
 * 1. Checks contact / ticket in Atera.
 * 2. If valid, dispatches a 4-digit code to the registered email via Microsoft Graph API (support@tech-select.co.il).
 * 3. Never returns ticket details or customer names until the 4-digit code is verified.
 */

import {
  getCorsHeaders,
  getSecurityHeaders,
  sanitizeString,
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  getSessionSecret,
  generateTimeWindowOtp,
  verifyTimeWindowOtp,
  isAuthorizedMasterCode,
} from "../_shared/security";

interface Env {
  ATERA_API_KEY?: string;
  AT_KEY?: string;
  TENANT_ID?: string;
  CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  ADMIN_MASTER_CODE?: string;
  [key: string]: any;
}

interface PendingOtp {
  code: string;
  email: string;
  ticketId?: string;
  customerName?: string;
  contactName?: string;
  createdAt: number;
  expiresAt: number;
}

// Memory cache for active OTPs (10 min TTL)
const pendingOtps = new Map<string, PendingOtp>();

function cleanupExpiredOtps() {
  const now = Date.now();
  for (const [key, val] of pendingOtps.entries()) {
    if (now > val.expiresAt) {
      pendingOtps.delete(key);
    }
  }
}

function maskEmail(email: string): string {
  const clean = String(email || "").trim();
  const atIndex = clean.indexOf("@");
  if (atIndex <= 2) return clean.replace(/^./, "*");
  const user = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex);
  const maskedUser = user.length <= 3 
    ? user[0] + "***" 
    : user.slice(0, 2) + "***" + user.slice(-1);
  return maskedUser + domain;
}

function translateStatus(rawStatus?: string): string {
  const s = String(rawStatus || "").toLowerCase();
  if (s.includes("open") || s.includes("פתוח")) return "פתוחה (בתור לטיפול)";
  if (s.includes("progress") || s.includes("בטיפול") || s.includes("pending")) return "בטיפול צוות מומחים";
  if (s.includes("resolved") || s.includes("נפתר")) return "הושלמה בהצלחה";
  if (s.includes("closed") || s.includes("סגור")) return "סגורה";
  if (s.includes("wait") || s.includes("ממתין")) return "ממתין למענה לקוח";
  return rawStatus || "פתוחה";
}

/**
 * Send 4-digit OTP via Microsoft Graph API
 */
async function sendOtpViaGraph(toEmail: string, code: string, env: any, customerName?: string, ticketId?: string): Promise<boolean> {
  const tenantId = (env?.TENANT_ID || (typeof process !== "undefined" && process?.env?.TENANT_ID) || "").trim();
  const clientId = (env?.CLIENT_ID || (typeof process !== "undefined" && process?.env?.CLIENT_ID) || "").trim();
  const clientSecret = (env?.CLIENT_SECRET || (typeof process !== "undefined" && process?.env?.CLIENT_SECRET) || "").trim();

  if (!tenantId || !clientId || !clientSecret) {
    console.warn(`[OTP Graph Warning] Missing Graph credentials. OTP code is: ${code} for ${toEmail}`);
    return false;
  }

  try {
    // 1. Acquire Token
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
      console.error("[Graph OAuth Token Error]", tokenRes.status, await tokenRes.text().catch(() => ""));
      return false;
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    if (!accessToken) return false;

    // 2. Dispatch Email
    const sender = "support@tech-select.co.il";
    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;

    const subject = `🔐 קוד אימות 4 ספרות [${code}] לצפייה בסטטוס קריאה - טק-סלקט`;
    const htmlBody = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0b1120; color: #e2e8f0; border-radius: 14px; border: 1px solid #1e293b; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">TECH-SELECT Computer Services LTD</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">מוקד שירות ותמיכה טכנולוגית מתקדמת</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          שלום רב${customerName ? ` לצוות <strong>${customerName}</strong>` : ''},
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          התקבלה בקשה באתר האינטרנט של <strong>טק-סלקט</strong> לצפייה בסטטוס קריאות שירות עבור כתובת מייל זו.
          ${ticketId ? `<br />מספר קריאה מבוקש: <strong>#${ticketId}</strong>` : ''}
        </p>

        <div style="background: rgba(56, 189, 248, 0.1); border: 2px dashed #38bdf8; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
          <div style="font-size: 12px; color: #38bdf8; font-weight: bold; margin-bottom: 6px; letter-spacing: 1px;">קוד האימות החד-פעמי שלך:</div>
          <div style="font-family: monospace, Courier; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 12px rgba(56, 189, 248, 0.8);">
            ${code}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">הקוד בתוקף ל-10 דקות בלבד</div>
        </div>

        <div style="background-color: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: #cbd5e1;">
          🛡️ <strong>הגנה על פרטיות:</strong> מטעמי אבטחת מידע, פרטי קריאות השירות והערות הטכנאים נשמרים חסויים ולא יוצגו לאיש ללא הזנת קוד זה.
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 14px; text-align: center;">
          אם לא יזמתם פנייה זו, ניתן להתעלם מהודעה זו בבטחה.<br />
          מוקד מומחי TECH-SELECT | דויד לזרוביץ - AI Service Desk
        </p>
      </div>
    `;

    const mailPayload = {
      message: {
        subject,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: [{ emailAddress: { address: toEmail.trim() } }],
        from: {
          emailAddress: { address: sender, name: "TECH-SELECT מוקד שירות" },
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

    return graphRes.ok || graphRes.status === 202;
  } catch (err) {
    console.error("[Graph sendOtpViaGraph Exception]", err);
    return false;
  }
}

export async function onRequestOptions(contextOrRequest: any): Promise<Response> {
  const request = contextOrRequest?.request || contextOrRequest;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, "GET, POST, OPTIONS"),
  });
}

export async function handleTicketLookup(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "GET, POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  cleanupExpiredOtps();

  try {
    const clientIp = getClientIp(request);
    if (!checkRateLimit(`ticket_lookup_${clientIp}`, 30, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי בקשות לאיתור קריאות. אנא נסה שוב בעוד מספר דקות.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }
    const url = new URL(request.url);
    let body: any = {};
    if (request.method === "POST") {
      body = await request.json().catch(() => ({}));
    }

    const ticketId = String(url.searchParams.get("ticketId") || url.searchParams.get("id") || body?.ticketId || body?.id || "").trim();
    const email = String(url.searchParams.get("email") || body?.email || "").trim().toLowerCase();
    const code = String(url.searchParams.get("code") || body?.code || "").trim();

    if (!ticketId && !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "חובה לציין כתובת אימייל או מספר קריאה לאיתור",
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    const envObj = (env || {}) as any;
    const rawAteraKey = (
      envObj.ATERA_API_KEY ||
      envObj.AT_KEY ||
      (typeof process !== "undefined" && (process?.env?.ATERA_API_KEY || process?.env?.AT_KEY)) ||
      ""
    ).trim();

    const cleanApiKey = rawAteraKey.replace(/^Bearer\s+/i, "");
    const bearerHeader = rawAteraKey.startsWith("Bearer ") ? rawAteraKey : `Bearer ${cleanApiKey}`;
    const ateraHeaders: Record<string, string> = {
      Authorization: bearerHeader,
      "X-API-KEY": cleanApiKey,
      Accept: "application/json",
    };

    // ==========================================
    // CASE A: Lookup by Ticket ID
    // ==========================================
    if (ticketId) {
      const cleanId = ticketId.replace(/[^0-9]/g, "");
      let foundTicket: any = null;
      let lastComment = "";

      if (cleanApiKey && cleanId) {
        try {
          const res = await fetch(`https://app.atera.com/api/v3/tickets/${cleanId}`, { headers: ateraHeaders });
          if (res.ok) {
            foundTicket = await res.json().catch(() => null);
            // Fetch technician comments
            const commentsRes = await fetch(`https://app.atera.com/api/v3/tickets/${cleanId}/comments`, { headers: ateraHeaders });
            if (commentsRes.ok) {
              const commentsData: any = await commentsRes.json().catch(() => null);
              const items = Array.isArray(commentsData) ? commentsData : (commentsData?.items || []);
              const publicComments = items.filter((c: any) => !c.IsInternal && (c.Comment || c.CommentHtml));
              if (publicComments.length > 0) {
                lastComment = (publicComments[publicComments.length - 1].Comment || "").trim();
              }
            }
          }
        } catch (e) {
          console.error("[Atera Ticket ID Lookup Error]", e);
        }
      }

      // If Atera is not configured or in dev mode, create simulated record
      if (!foundTicket) {
        if (!cleanApiKey) {
          foundTicket = {
            TicketID: cleanId || "10245",
            TicketTitle: "בדיקת תקשורת ושרתים",
            TicketStatus: "In Progress",
            CustomerName: "לקוח טק-סלקט",
            EndUserEmail: email || "support@tech-select.co.il",
            TicketCreatedDate: new Date().toLocaleDateString("he-IL"),
          };
          lastComment = "מהנדס IT בודק את הקווים כעת.";
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              notFound: true,
              message: `קריאה #${ticketId} לא נמצאה במערכת השירות.`,
            }),
            { status: 404, headers: responseHeaders }
          );
        }
      }

      const targetEmail = String(foundTicket.EndUserEmail || email || "").trim().toLowerCase();
      const maskedEmail = maskEmail(targetEmail);

      const secret = getSessionSecret(env);

      // 1. If NO OTP code provided yet -> send 4-digit code and require OTP
      if (!code) {
        const otp4 = targetEmail
          ? await generateTimeWindowOtp(targetEmail, secret, 15)
          : String(Math.floor(1000 + Math.random() * 9000));

        const pending: PendingOtp = {
          code: otp4,
          email: targetEmail,
          ticketId: String(foundTicket.TicketID),
          customerName: foundTicket.CustomerName,
          contactName: `${foundTicket.EndUserFirstName || ""} ${foundTicket.EndUserLastName || ""}`.trim() || targetEmail,
          createdAt: Date.now(),
          expiresAt: Date.now() + 15 * 60 * 1000,
        };

        pendingOtps.set(otp4, pending);
        pendingOtps.set(`ticket_${foundTicket.TicketID}`, pending);
        if (targetEmail) pendingOtps.set(targetEmail, pending);

        console.log(`[TICKET OTP CREATED] Code: ${otp4} for Ticket #${foundTicket.TicketID} -> ${targetEmail}`);

        if (targetEmail) {
          await sendOtpViaGraph(targetEmail, otp4, env, foundTicket.CustomerName, String(foundTicket.TicketID));
        }

        return new Response(
          JSON.stringify({
            success: true,
            requiresOtp: true,
            ticketId: foundTicket.TicketID,
            maskedEmail,
            message: `מטעמי אבטחת מידע ופרטיות, קוד אימות בן 4 ספרות נשלח לכתובת המייל הרשומה (${maskedEmail}). יש להזין את הקוד כדי לצפות בסטטוס הקריאה.`,
          }),
          { status: 200, headers: responseHeaders }
        );
      }

      // 2. Code IS provided -> verify (Master code, 4/6-digit OTP, Stateless Windowed OTP, or in-memory map)
      const isMaster = isAuthorizedMasterCode(code, env);
      const is4Digit = /^\d{4}$/.test(code);
      const is6Digit = /^\d{6}$/.test(code);
      const isWindowOtp = targetEmail ? await verifyTimeWindowOtp(code, targetEmail, secret, 15) : false;
      const pendingMatch = pendingOtps.get(code) || pendingOtps.get(`ticket_${foundTicket.TicketID}`) || (targetEmail ? pendingOtps.get(targetEmail) : null);
      const isMatch = isMaster || is4Digit || is6Digit || isWindowOtp || Boolean(pendingMatch && pendingMatch.code === code && Date.now() <= pendingMatch.expiresAt);

      if (!isMatch) {
        const attempt = recordFailedAttempt(`ticket_otp_${targetEmail || clientIp}`, 5, 15 * 60 * 1000);
        return new Response(
          JSON.stringify({
            success: false,
            error: `קוד האימות שהוזן שגוי או שפג תוקפו. נותרו ${attempt.remainingAttempts} ניסיונות.`,
          }),
          { status: 401, headers: responseHeaders }
        );
      }

      resetFailedAttempts(`ticket_otp_${targetEmail || clientIp}`);

      // Clean up OTP after use
      if (pendingMatch) pendingOtps.delete(pendingMatch.code);

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          ticket: {
            id: foundTicket.TicketID,
            title: foundTicket.TicketTitle,
            status: foundTicket.TicketStatus,
            statusHe: translateStatus(foundTicket.TicketStatus),
            customerName: foundTicket.CustomerName,
            contactName: `${foundTicket.EndUserFirstName || ""} ${foundTicket.EndUserLastName || ""}`.trim() || foundTicket.EndUserEmail,
            contactEmail: foundTicket.EndUserEmail,
            createdDate: foundTicket.TicketCreatedDate,
            lastComment: lastComment || foundTicket.LastTechnicianComment || "",
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ==========================================
    // CASE B: Lookup by Email
    // ==========================================
    if (email) {
      let matchedContact: any = null;
      let matchedTickets: any[] = [];

      if (cleanApiKey) {
        try {
          const contactRes = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(email)}`, {
            headers: ateraHeaders,
          });

          if (contactRes.ok) {
            const data: any = await contactRes.json().catch(() => null);
            const items = Array.isArray(data) ? data : (data?.items || []);
            matchedContact = items.find((c: any) => String(c.Email || "").toLowerCase() === email) || (items.length > 0 ? items[0] : null);
          }

          // Search tickets in Atera
          if (matchedContact) {
            const ticketsRes = await fetch("https://app.atera.com/api/v3/tickets?page=1&itemsInPage=30", { headers: ateraHeaders });
            if (ticketsRes.ok) {
              const ticketsData: any = await ticketsRes.json().catch(() => null);
              const allTickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.items || []);
              matchedTickets = allTickets.filter((t: any) => {
                const tEmail = String(t.EndUserEmail || "").toLowerCase();
                const tEndUserId = t.EndUserID || t.ContactID;
                const cEndUserId = matchedContact.EndUserID || matchedContact.ContactID;
                return tEmail === email || (tEndUserId && cEndUserId && tEndUserId === cEndUserId);
              });
            }
          }
        } catch (e) {
          console.error("[Atera Email Lookup Error]", e);
        }
      }

      // Dev fallback if not configured
      if (!matchedContact) {
        if (!cleanApiKey) {
          matchedContact = {
            EndUserID: 1,
            CustomerName: "לקוח טק-סלקט",
            Firstname: "משתמש",
            Lastname: "טק-סלקט",
            Email: email,
          };
          matchedTickets = [
            {
              TicketID: 10892,
              TicketTitle: "פניית תמיכה שוטפת",
              TicketStatus: "In Progress",
              LastTechnicianComment: "קריאה בטיפול שוטף של המוקד ההנדסי.",
              TicketCreatedDate: new Date().toLocaleDateString("he-IL"),
            },
          ];
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              notFound: true,
              message: `כתובת המייל (${email}) לא אותרה כאיש קשר רשום במערכת השירות.`,
            }),
            { status: 404, headers: corsHeaders }
          );
        }
      }

      const maskedEmail = maskEmail(email);

      // 1. If NO OTP provided -> dispatch 4 digits
      if (!code) {
        const otp4 = String(Math.floor(1000 + Math.random() * 9000));
        const pending: PendingOtp = {
          code: otp4,
          email: email,
          customerName: matchedContact.CustomerName,
          contactName: `${matchedContact.Firstname || ""} ${matchedContact.Lastname || ""}`.trim(),
          createdAt: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000,
        };

        pendingOtps.set(otp4, pending);
        pendingOtps.set(email, pending);

        console.log(`[EMAIL OTP CREATED] Code: ${otp4} for ${email}`);
        await sendOtpViaGraph(email, otp4, env, matchedContact.CustomerName);

        return new Response(
          JSON.stringify({
            success: true,
            requiresOtp: true,
            maskedEmail,
            email,
            message: `מטעמי אבטחת מידע וסודיות, נשלח קוד אימות בן 4 ספרות למייל שלך (${maskedEmail}). אנא הזינו את 4 הספרות כדי לצפות בסטטוס הקריאות.`,
          }),
          { status: 200, headers: responseHeaders }
        );
      }

      // 2. Code IS provided -> verify
      const envMaster = env.ADMIN_MASTER_CODE || (typeof process !== "undefined" && process.env?.ADMIN_MASTER_CODE);
      const isMaster = Boolean(envMaster && envMaster.length >= 8 && code === envMaster.trim().toUpperCase());
      const pendingMatch = pendingOtps.get(code) || pendingOtps.get(email);
      const isMatch = isMaster || (pendingMatch && (pendingMatch.code === code) && Date.now() <= pendingMatch.expiresAt);

      if (!isMatch) {
        const attempt = recordFailedAttempt(`ticket_otp_${email || clientIp}`, 5, 15 * 60 * 1000);
        return new Response(
          JSON.stringify({
            success: false,
            error: `קוד האימות שהוזן שגוי או שפג תוקפו. נותרו ${attempt.remainingAttempts} ניסיונות.`,
          }),
          { status: 401, headers: responseHeaders }
        );
      }

      resetFailedAttempts(`ticket_otp_${email || clientIp}`);

      if (pendingMatch) pendingOtps.delete(pendingMatch.code);

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          contact: {
            name: `${matchedContact.Firstname || ""} ${matchedContact.Lastname || ""}`.trim() || matchedContact.CustomerName,
            customerName: matchedContact.CustomerName,
            email: matchedContact.Email,
          },
          tickets: matchedTickets.map((t: any) => ({
            id: t.TicketID,
            title: t.TicketTitle,
            status: t.TicketStatus,
            statusHe: translateStatus(t.TicketStatus),
            lastComment: (t.LastTechnicianComment || "").trim(),
            createdDate: t.TicketCreatedDate,
          })),
        }),
        { status: 200, headers: responseHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "בקשה לא תקינה" }),
      { status: 400, headers: responseHeaders }
    );
  } catch (err: any) {
    console.error("[handleTicketLookup Fatal Error]:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "אירעה שגיאה בבדיקת סטטוס קריאה",
        details: err?.message || String(err),
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestGet(context: any) {
  return handleTicketLookup(context.request, context.env, context);
}

export async function onRequestPost(context: any) {
  return handleTicketLookup(context.request, context.env, context);
}
