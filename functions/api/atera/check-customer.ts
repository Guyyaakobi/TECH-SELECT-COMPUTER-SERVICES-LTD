// @ts-nocheck
interface Env {
  ATERA_API_KEY?: string;
  AT_KEY?: string;
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

const TECH_TEAM = [
  "אוריאל פחימה",
  "אמיר בן ארויה",
  "תבור כהן",
  "אריאל מורי",
  "יוסף איאסה"
];

export async function handleCheckCustomer(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const { email, technician } = body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();

    const selectedTech = (technician && TECH_TEAM.includes(technician))
      ? technician
      : TECH_TEAM[Math.floor(Math.random() * TECH_TEAM.length)];

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "כתובת מייל תקינה נדרשת לבדיקה במערכת אטרה",
          technician: selectedTech,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const envObj = (env || {}) as any;
    const ateraApiKey =
      envObj.ATERA_API_KEY ||
      envObj.AT_KEY ||
      (typeof process !== "undefined" && (process?.env?.ATERA_API_KEY || process?.env?.AT_KEY)) ||
      "";
    const cleanAteraKey = ateraApiKey.replace(/^Bearer\s+/i, "").trim();
    const bearerAtera = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanAteraKey}`;

    let ateraContact: any = null;
    let isCustomer = false;

    if (cleanAteraKey) {
      try {
        const contactRes = await fetch(
          `https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cleanEmail)}`,
          {
            method: "GET",
            headers: {
              "Authorization": bearerAtera,
              "X-API-KEY": cleanAteraKey,
              "Accept": "application/json",
            },
          }
        );

        if (contactRes.ok) {
          const contactsData: any = await contactRes.json().catch(() => null);
          const contactItems = Array.isArray(contactsData)
            ? contactsData
            : (Array.isArray(contactsData?.items) ? contactsData.items : []);
          ateraContact = contactItems.find(
            (c: any) => String(c?.Email || c?.email || "").trim().toLowerCase() === cleanEmail
          ) || (contactItems.length === 1 ? contactItems[0] : null);

          isCustomer = Boolean(ateraContact);
        }
      } catch (err) {
        console.warn("[check-customer.ts] Atera fetch error:", err);
      }
    }

    if (!isCustomer) {
      return new Response(
        JSON.stringify({
          success: true,
          isCustomer: false,
          technician: selectedTech,
          greeting: `היי, אני העוזר של ${selectedTech}. אני רואה שאתה עדיין לא לקוח שלנו, אבל לא נורא, שאל מה שאתה צריך ואני אראה מה אני יכול לעשות.`,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const contactName = `${ateraContact?.Firstname || ""} ${ateraContact?.Lastname || ""}`.trim() || cleanEmail;
    const customerName = ateraContact?.CustomerName || "לקוח טק-סלקט";

    return new Response(
      JSON.stringify({
        success: true,
        isCustomer: true,
        technician: selectedTech,
        contact: {
          id: ateraContact?.EndUserID || ateraContact?.ContactID || ateraContact?.Id,
          name: contactName,
          customerName: customerName,
          customerId: ateraContact?.CustomerID,
          email: cleanEmail,
        },
        greeting: `שלום ${contactName}! אני העוזר של ${selectedTech} מחברת טק-סלקט. זיהיתי אותך כלקוח קיים במערכת השירות (${customerName}). אני כאן כדי להעניק לך שירות מצוין, לפתוח קריאה במידת הצורך או לענות על כל שאלה. במה אוכל לעזור לך היום?`,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    const fallbackTech = TECH_TEAM[Math.floor(Math.random() * TECH_TEAM.length)];
    return new Response(
      JSON.stringify({
        success: true,
        isCustomer: false,
        technician: fallbackTech,
        greeting: `היי, אני העוזר של ${fallbackTech}. אני רואה שאתה עדיין לא לקוח שלנו, אבל לא נורא, שאל מה שאתה צריך ואני אראה מה אני יכול לעשות.`,
      }),
      { status: 200, headers: corsHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: Env): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleCheckCustomer(req, env);
}
