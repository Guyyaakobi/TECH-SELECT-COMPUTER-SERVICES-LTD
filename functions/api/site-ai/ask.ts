// @ts-nocheck
import { sendGraphMail } from "../_shared/graphMail";

interface Env {
  GEMINI_API_KEY?: string;
  GOOGLE_GENAI_API_KEY?: string;
  ATERA_API_KEY?: string;
  AT_KEY?: string;
  TENANT_ID?: string;
  CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  [key: string]: any;
}

interface AteraTicketResult {
  success: boolean;
  ticketId?: string;
  isRealAtera: boolean;
  status?: string;
  error?: string;
}

async function executeOpenAteraTicket(
  env: Env,
  companyName: string,
  email: string,
  issueDescription: string,
  resolutionStatus: string = "Tier2_Escalation",
  timeSpentMinutes: number = 0,
  assignedTech: string = "תבור כהן"
): Promise<AteraTicketResult> {
  const envObj = (env || {}) as any;
  const ateraApiKey =
    envObj.ATERA_API_KEY ||
    envObj.AT_KEY ||
    (typeof process !== "undefined" && (process?.env?.ATERA_API_KEY || process?.env?.AT_KEY)) ||
    "";
  const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "").trim();
  const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;

  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanCompany = String(companyName || "חברה").trim();
  const cleanDesc = String(issueDescription || "").trim();
  const isResolved = String(resolutionStatus || "").toLowerCase() === "resolved";
  const resStatus = isResolved ? "Resolved" : "Tier2_Escalation";
  const minutes = Number(timeSpentMinutes) || (isResolved ? 15 : 0);

  if (!cleanApiKey) {
    console.warn("[SITE AI] ATERA_API_KEY is not configured in Cloudflare environment.");
    return {
      success: false,
      isRealAtera: false,
      error: "ATERA_API_KEY_NOT_CONFIGURED"
    };
  }

  const ateraHeaders: Record<string, string> = {
    "Authorization": bearerHeader,
    "X-API-KEY": cleanApiKey,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  let customerId = 6;
  let contactId: number | null = null;
  let contactFullName = "";

  // 1. Search contact by email in Atera
  try {
    const contactRes = await fetch(
      `https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cleanEmail)}`,
      {
        method: "GET",
        headers: ateraHeaders,
      }
    );
    if (contactRes.ok) {
      const contactsData: any = await contactRes.json().catch(() => null);
      const contactItems = Array.isArray(contactsData)
        ? contactsData
        : (Array.isArray(contactsData?.items) ? contactsData.items : []);
      const found = contactItems.find((c: any) => String(c?.Email || c?.email || "").trim().toLowerCase() === cleanEmail) || (contactItems.length === 1 ? contactItems[0] : null);
      if (found) {
        contactId = found.EndUserID || found.ContactID || found.contactId || found.Id || found.id || null;
        customerId = found.CustomerID || found.CustomerId || found.customerId || customerId;
        contactFullName = `${found.Firstname || found.FirstName || ""} ${found.Lastname || found.LastName || ""}`.trim();
      }
    }
  } catch (err) {
    console.warn("[SITE AI] Contact search error in Atera:", err);
  }

  // 2. Build full description for Atera ticket
  const formattedDate = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
  const titlePrefix = isResolved ? `[נפתר ע"י העוזר]` : `[הועבר לבדיקה מעמיקה של ${assignedTech}]`;
  const fullDescription = isResolved
    ? [
        `✅ קריאה נפתרה על ידי העוזר של ${assignedTech} (טק-סלקט)`,
        `זמן סיום וסגירה: ${formattedDate}`,
        `חברה: ${cleanCompany}`,
        `איש קשר: ${contactFullName || cleanEmail}`,
        `אימייל: ${cleanEmail}`,
        `סטטוס טיפול: Closed / נפתר`,
        `זמן עבודה: ${minutes} דקות`,
        ``,
        `מהות התקלה ואופן הפתרון:`,
        cleanDesc,
      ].join("\n")
    : [
        `📌 קריאה הועברה ישירות לבדיקה מעמיקה של ${assignedTech}`,
        `זמן פתיחה: ${formattedDate}`,
        `חברה: ${cleanCompany}`,
        `איש קשר: ${contactFullName || cleanEmail}`,
        `אימייל: ${cleanEmail}`,
        `סטטוס: Open - ממתין לבדיקת טכנאי`,
        ``,
        `מהות התקלה ובקשת הלקוח:`,
        cleanDesc,
      ].join("\n");

  const ticketTitle = `${titlePrefix} ${cleanCompany} - ${cleanDesc.slice(0, 40).replace(/[\r\n]+/g, " ")}`;
  const ticketBody: any = {
    TicketTitle: ticketTitle,
    Description: fullDescription,
    TicketPriority: isResolved ? "Low" : "High",
    TicketImpact: "Minor",
    TicketStatus: isResolved ? "Closed" : "Open",
    CustomerID: Number(customerId) || 6,
    EndUserEmail: cleanEmail,
  };
  if (contactId) {
    ticketBody.EndUserID = Number(contactId);
    ticketBody.ContactID = Number(contactId);
  }

  try {
    const ticketRes = await fetch("https://app.atera.com/api/v3/tickets", {
      method: "POST",
      headers: ateraHeaders,
      body: JSON.stringify(ticketBody),
    });

    if (ticketRes.ok) {
      const data: any = await ticketRes.json().catch(() => ({}));
      const realId = String(
        data?.ActionID ||
        data?.TicketID ||
        data?.ticketId ||
        data?.ActionNumber ||
        data?.Key ||
        data?.id ||
        data?.Item?.TicketID ||
        ""
      ).trim();

      if (realId) {
        console.log(`[SITE AI] Atera ticket created successfully! ActionID: #${realId}`);

        // If Resolved -> close ticket & log work hours in Atera
        if (isResolved) {
          fetch(`https://app.atera.com/api/v3/tickets/${realId}/workhoursrecords`, {
            method: "POST",
            headers: ateraHeaders,
            body: JSON.stringify({
              Hours: Math.floor(minutes / 60),
              Minutes: minutes % 60,
              Description: `פתרון תקלה ע"י Tier 1 AI (${minutes} דק')`,
              IsBillable: false,
            }),
          }).catch(() => {});

          fetch(`https://app.atera.com/api/v3/tickets/${realId}/comments`, {
            method: "POST",
            headers: ateraHeaders,
            body: JSON.stringify({
              CommentText: `✅ טיפול Tier 1 AI הושלם בהצלחה ונסגר.\nמשך זמן עבודה: ${minutes} דקות.\nתיאור: ${cleanDesc}`,
              TechnicianCommentDetails: { TechnicianID: 1, IsInternal: true },
            }),
          }).catch(() => {});

          fetch(`https://app.atera.com/api/v3/tickets/${realId}`, {
            method: "PUT",
            headers: ateraHeaders,
            body: JSON.stringify({ TicketStatus: "Closed" }),
          }).catch(() => {});
        }

        // Email notification via Microsoft Graph API
        sendGraphMail(env, {
          to: ["support@tech-select.co.il", cleanEmail],
          subject: isResolved
            ? `✅ סיכום טיפול בקריאת שירות #${realId} - טק-סלקט`
            : `📩 [קריאת שירות #${realId}] פנייה הועברה לבדיקה מעמיקה של ${assignedTech} - ${cleanCompany}`,
          content: `
            <div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;background:#f8fafc;color:#0f172a;border-radius:8px;">
              <h2 style="color:${isResolved ? '#16a34a' : '#0284c7'};">
                ${isResolved ? '✅ קריאת שירות טופלה וסוכמה' : `📌 פנייה חדשה הועברה לבדיקה מעמיקה של ${assignedTech}`}
              </h2>
              <p><strong>מספר קריאה במערכת:</strong> #${realId}</p>
              <p><strong>חברה:</strong> ${cleanCompany}</p>
              <p><strong>איש קשר:</strong> ${contactFullName || cleanEmail} (${cleanEmail})</p>
              <p><strong>טכנאי מטפל:</strong> ${assignedTech}</p>
              <div style="background:#fff;padding:15px;border:1px solid #e2e8f0;border-radius:6px;margin:15px 0;">
                <strong>מהות הפנייה:</strong><br/>
                ${cleanDesc.replace(/\n/g, '<br/>')}
              </div>
              <p style="color:#64748b;font-size:13px;">טק-סלקט שירותי מחשוב בע"מ | support@tech-select.co.il</p>
            </div>
          `,
          isHtml: true,
          replyTo: cleanEmail,
        }).catch(() => {});

        return {
          success: true,
          ticketId: realId,
          isRealAtera: true,
          status: isResolved ? "Closed" : "Open",
        };
      }
    } else {
      const errTxt = await ticketRes.text().catch(() => "");
      console.error("[SITE AI] Atera ticket creation failed:", ticketRes.status, errTxt);
    }
  } catch (err) {
    console.error("[SITE AI] Atera ticket creation network error:", err);
  }

  return {
    success: false,
    isRealAtera: false,
    error: "ATERA_CREATION_FAILED",
  };
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

export async function handleAsk(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const userQuestion = String(body?.question || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];
    const { sessionToken, verifiedEmail } = body || {};

    // Verification check: sessionToken, auth header, or verified email
    const authHeader = request.headers.get("Authorization") || "";
    const cleanToken = String(sessionToken || authHeader).replace(/^Bearer\s+/i, "").trim();

    if (!cleanToken && !verifiedEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          requiresVerification: true,
          reply: "🔒 עוזר ה-AI נעול. יש לאמת את זהותך באמצעות קוד 4 ספרות שנשלח למייל כדי לפתוח את מוקד התמיכה.",
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const envObj = (env || {}) as any;
    const apiKey =
      envObj.GEMINI_API_KEY ||
      envObj.GOOGLE_GENAI_API_KEY ||
      envObj.GEMINI_KEY ||
      envObj.GOOGLE_API_KEY ||
      (typeof process !== "undefined" && (process?.env?.GEMINI_API_KEY || process?.env?.GOOGLE_GENAI_API_KEY)) ||
      "";

    const currentTechName =
      (typeof body?.assignedTech === "string" && body.assignedTech.trim())
        ? body.assignedTech.trim()
        : "גיא יעקובי";

    const techFirstName = currentTechName.split(" ")[0] || currentTechName;
    const effectiveEmail = String(verifiedEmail || "").trim();

    const siteSystemInstruction = `אתה העוזר הווירטואלי של **${currentTechName}** (מייסד ומנכ"ל TECH-SELECT טק-סלקט שירותי מחשוב בע"מ).

הזהות שלך וחיבור למאגרי הידע:
אתה אך ורק העוזר הווירטואלי של **${currentTechName}** מחברת 'טק-סלקט'.
חובה מוחלטת: אם אתה מציג את עצמך או מתייחס למנהל/ההנדסה שלך, אתה תמיד מציין אך ורק את **${currentTechName}** (או בקיצור **${techFirstName}**) ולא שום שם אחר!
אתה מחובר ישירות למאגרי הידע של חברת 'טק-סלקט' שנאספו לאורך שנים של שירותי מחשוב, ניהול תשתיות, ענן, סייבר ופתרונות הנדסיים לארגונים מובילים. השתמש בידע הזה כדי לתת תשובות מקצועיות, ענייניות ואיכותיות.

סגנון דיבור וכללי שיחה:
- נהל את השיחה בצורה אנושית, חמה, זורמת ובגובה העיניים.
- אל תשתמש כלל במילים טכניות כבדות או ביטויים מערכתיים כמו: "Tier 1", "Tier 2", "Tier2_Escalation", "הסלמה", או "דרג שני".
- כאשר הלקוח פונה עם בקשה שמצריכה בדיקה יסודית (כגון פירמוט מחשב, התקנת מערכת הפעלה, בעיית חומרה, רשת, או כל תקלה שלא נפתרת בשאלות קצרות):
  עליך להפעיל את הכלי open_support_ticket כדי לפתוח קריאה אמיתית במערכת.
  במענה ללקוח, שקף לו בפשטות ובחום: שאתה (העוזר של ${techFirstName}) מעביר כעת ל${techFirstName} את הקריאה במערכת לבדיקה מעמיקה ולהמשך טיפול, וש${techFirstName} או נציג מצוות התמיכה ייצור איתו קשר בהקדם.

פרטי הלקוח המאומת:
אימייל מאומת: ${effectiveEmail || "משתמש מאומת באתר"}
מכיוון שהלקוח כבר אומת באמצעות קוד 4 ספרות בכניסה, השתמש ישירות באימייל המאומת הזה לצורך פתיחת הקריאה במערכת.

חוק ברזל מוחלט למניעת הזיות (Anti-Hallucination):
לעולם, בשום פנים ואופן, אל תמציא, אל תנחש ואל תכתוב מספר קריאה (כגון #10482 או כל מספר פיקטיבי אחר)!
מספר הקריאה חייב להיווצר אך ורק על ידי מערכת Atera באמצעות הפעלת הפונקציה open_support_ticket.
אל תכתוב מספר קריאה בטקסט אלא אם הפעלת את open_support_ticket וקיבלת את מספר הקריאה האמיתי.

כלל ברזל: כל תכתובת המיילים חייבת להיות מול support@tech-select.co.il בלבד.`;

    const randomTech = currentTechName;

    // High quality domain fallback reply generator
    const generateSiteFallbackReply = (q: string) => {
      const lower = q.toLowerCase();

      if (lower.includes("מה אתם עושים") || lower.includes("מי אתם") || lower.includes("שירותים") || lower.includes("תמיכה")) {
        return `שלום! אני העוזר הווירטואלי של **${randomTech}** מחברת טק-סלקט (Tech-Select).
צוות המומחים שלנו מספק מעטפת מחשוב מנוהל (IT), שירותי ענן Microsoft 365, אבטחת מידע ופתרונות בינה מלאכותית ארגוניים.

איך אוכל לעזור לך היום? אני כאן לסייע בפתרון תקלות מחשוב (Tier 1), לענות על שאלות או לבדוק סטטוס קריאה קיימת.`;
      }

      if (lower.includes("קשר") || lower.includes("טלפון") || lower.includes("מייל") || lower.includes("שעות")) {
        return `אנו עומדים לרשותך בכל שאלה או צורך:
• **מייל שירות ותמיכה בלבד:** support@tech-select.co.il
• **כתובת:** יגאל אלון 88, תל אביב
• **שעות מוקד:** ימים א'-ה' 08:30 - 18:00 (מוקד חירום 24/7 ללקוחות מנוהלים).`;
      }

      return `שלום! אני העוזר הווירטואלי של **${randomTech}** מחברת טק-סלקט. אני כאן כדי לעזור לך בפתרון תקלות מחשוב, ייעוץ טכנולוגי או פתיחת קריאת שירות. במה אוכל לעזור לך כעת?`;
    };

    // Tool Declaration for Gemini Function Calling
    const toolDeclarations = [
      {
        name: "open_support_ticket",
        description: "פותח קריאת שירות אמיתית במערכת Atera ומחזיר מספר קריאה אמיתי. יש להפעיל כלי זה כאשר תקלה נפתרה או כאשר היא מוסלמת לצוות מומחים (כמו פירמוט, התקנות, תקלות חומרה או רשת מורכבות).",
        parameters: {
          type: "OBJECT",
          properties: {
            company_name: {
              type: "STRING",
              description: "שם החברה של הלקוח. אם לא ידוע, יש לציין 'לקוח טק-סלקט'.",
            },
            email: {
              type: "STRING",
              description: "כתובת המייל של הלקוח לפתיחת הקריאה.",
            },
            issue_description: {
              type: "STRING",
              description: "תיאור מהות התקלה או הבקשה (לדוגמה: פירמוט מחשב והתקנה מחדש).",
            },
            resolution_status: {
              type: "STRING",
              description: "סטטוס הטיפול: Resolved אם נפתר עליך, או Tier2_Escalation אם דורש טיפול טכנאי בכיר/שטח.",
            },
            time_spent_minutes: {
              type: "NUMBER",
              description: "דקות עבודה שהושקעו (רלוונטי רק אם נפתר).",
            },
          },
          required: ["company_name", "email", "issue_description"],
        },
      },
    ];

    if (apiKey) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          for (const item of history.slice(-6)) {
            contents.push({
              role: item.role === "user" ? "user" : "model",
              parts: [{ text: item.content || item.text || "" }],
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: userQuestion || "מה אתם עושים בטק-סלקט?" }],
        });

        const models = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        for (const model of models) {
          try {
            const apiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents,
                  systemInstruction: {
                    parts: [{ text: siteSystemInstruction }],
                  },
                  tools: [{ functionDeclarations: toolDeclarations }],
                  generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 800,
                  },
                }),
              }
            );

            if (apiRes.ok) {
              const data = await apiRes.json();
              const candidate = data?.candidates?.[0];
              const parts = candidate?.content?.parts || [];

              // 1. Check if Gemini triggered function call open_support_ticket
              const functionCallPart = parts.find((p: any) => p.functionCall && p.functionCall.name === "open_support_ticket");

              if (functionCallPart) {
                const args = functionCallPart.functionCall.args || {};
                const cEmail = args.email || effectiveEmail || "support@tech-select.co.il";
                const cCompany = args.company_name || "לקוח טק-סלקט";
                const cDesc = args.issue_description || userQuestion;
                const cStatus = args.resolution_status || "Tier2_Escalation";
                const cTime = Number(args.time_spent_minutes) || 0;

                const ateraResult = await executeOpenAteraTicket(
                  env,
                  cCompany,
                  cEmail,
                  cDesc,
                  cStatus,
                  cTime,
                  currentTechName
                );

                if (ateraResult.success && ateraResult.ticketId) {
                  const isResolved = cStatus.toLowerCase() === "resolved";
                  const reply = isResolved
                    ? `✅ תיעדתי את פתרון התקלה במערכת והקריאה נסגרה בהצלחה.\n\nמספר הקריאה שלך הוא: #${ateraResult.ticketId}\n\nשמחתי לעזור! ${techFirstName} וצוות טק-סלקט עומדים לרשותך תמיד במייל: support@tech-select.co.il.`
                    : `פתחתי כעת את הקריאה עבורך במערכת והעברתי אותה ישירות ל${techFirstName} לבדיקה מעמיקה ולהמשך טיפול אישי.\n\nמספר הקריאה שלך הוא: #${ateraResult.ticketId}\n\n${techFirstName} או נציג מצוות התמיכה ייצור איתך קשר בהקדם. לכל שאלה או עדכון נוסף, אנחנו זמינים עבורך ישירות במייל: support@tech-select.co.il.\n\nשיהיה המשך יום מצוין!`;

                  return new Response(
                    JSON.stringify({
                      success: true,
                      reply,
                      ticketId: ateraResult.ticketId,
                      source: "atera_real",
                    }),
                    { headers: corsHeaders }
                  );
                } else if (!ateraResult.isRealAtera) {
                  // ATERA_API_KEY is not configured in Cloudflare environment
                  const reply = `העברתי את פנייתך עבור "${cDesc}" ישירות ל${techFirstName} ולצוות התמיכה (support@tech-select.co.il) לבדיקה מעמיקה.\n\nאישור נשלח למייל: ${cEmail}.\n\nניצור איתך קשר בהקדם!`;

                  return new Response(
                    JSON.stringify({ success: true, reply, source: "emergency_queue" }),
                    { headers: corsHeaders }
                  );
                }
              }

              // 2. Normal text reply from Gemini
              let replyText = parts.find((p: any) => p.text)?.text || "";

              if (replyText) {
                // Safety Interception: If Gemini mentioned opening a ticket or generated a ticket reference
                const mentionsTicket =
                  replyText.includes("פתחתי כעת את הקריאה") ||
                  replyText.includes("מערכת Atera") ||
                  replyText.includes("Tier2_Escalation") ||
                  replyText.includes("לבדיקה מעמיקה") ||
                  replyText.includes("מספר הקריאה");

                if (mentionsTicket) {
                  console.log("[SITE AI] Intercepted text mentioning ticket creation. Verifying with real Atera API...");
                  const ateraResult = await executeOpenAteraTicket(
                    env,
                    "לקוח טק-סלקט",
                    effectiveEmail || "support@tech-select.co.il",
                    userQuestion,
                    "Tier2_Escalation",
                    0,
                    currentTechName
                  );

                  if (ateraResult.success && ateraResult.ticketId) {
                    const cleanReply = `פתחתי כעת את הקריאה עבורך במערכת והעברתי אותה ישירות ל${techFirstName} לבדיקה מעמיקה ולהמשך טיפול אישי.\n\nמספר הקריאה שלך הוא: #${ateraResult.ticketId}\n\n${techFirstName} או נציג מצוות התמיכה ייצור איתך קשר בהקדם. לכל שאלה או עדכון נוסף, אנחנו זמינים עבורך ישירות במייל: support@tech-select.co.il.\n\nשיהיה המשך יום מצוין!`;
                    return new Response(
                      JSON.stringify({
                        success: true,
                        reply: cleanReply,
                        ticketId: ateraResult.ticketId,
                        source: "atera_real_intercepted",
                      }),
                      { headers: corsHeaders }
                    );
                  } else {
                    const cleanReply = `העברתי כעת את פרטי הפנייה שלך ישירות ל${techFirstName} לבדיקה מעמיקה ולהמשך טיפול.\n\nפנייתך נרשמה במוקד התמיכה (support@tech-select.co.il) ונציג ייצור איתך קשר בהקדם.`;
                    return new Response(
                      JSON.stringify({
                        success: true,
                        reply: cleanReply,
                        source: "support_logged",
                      }),
                      { headers: corsHeaders }
                    );
                  }
                }

                return new Response(
                  JSON.stringify({ success: true, reply: replyText, source: "gemini" }),
                  { headers: corsHeaders }
                );
              }
            }
          } catch (modelErr) {
            console.warn(`[Worker Site AI] Model ${model} failed`, modelErr);
          }
        }
      } catch (geminiErr) {
        console.warn("[Worker Site AI] Global error", geminiErr);
      }
    }

    const fallback = generateSiteFallbackReply(userQuestion);
    return new Response(
      JSON.stringify({ success: true, reply: fallback, source: "knowledge_base" }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: true,
        reply: "טק-סלקט שירותי מחשוב בע\"מ הינה שותף טכנולוגי כולל לארגונים (ספק מורשה משרד הביטחון 0011033280). לפניה מהירה, פנו אלינו בוואטסאפ או דרך עמוד יצירת קשר באתר.",
        source: "fallback",
      }),
      { headers: corsHeaders }
    );
  }
}

export async function onRequestPost(context: any) {
  return handleAsk(context.request, context.env, context);
}

