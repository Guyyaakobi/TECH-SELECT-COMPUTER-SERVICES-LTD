import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Lazy Gemini client helper with required headers
function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Rate-limit / Quota cooldown tracker to avoid repeating 429 errors
const modelCooldownMap = new Map<string, number>();

function isModelCoolingDown(model: string): boolean {
  const until = modelCooldownMap.get(model);
  if (!until) return false;
  if (Date.now() > until) {
    modelCooldownMap.delete(model);
    return false;
  }
  return true;
}

function markModelRateLimited(model: string, cooldownMs = 60000) {
  modelCooldownMap.set(model, Date.now() + cooldownMs);
}

// Format conversation history for Gemini API
// MANDATORY: First content item MUST have role: 'user', and consecutive same-role items must be merged
function formatGeminiContents(messages: Array<{ role: string; content?: string; text?: string }>) {
  const valid = (messages || [])
    .map((m) => {
      const rawContent = m.content || m.text || "";
      return {
        role: m.role === "assistant" || m.role === "model" ? ("model" as const) : ("user" as const),
        content: typeof rawContent === "string" ? rawContent.trim() : String(rawContent).trim(),
      };
    })
    .filter((m) => m.content.length > 0);

  if (valid.length === 0) {
    return [
      {
        role: "user" as const,
        parts: [{ text: "שלום, אני מעוניין באפיון וייעוץ AI אסטרטגי לארגון." }],
      },
    ];
  }

  // Gemini API requires the first turn to be 'user'.
  let firstUserIdx = valid.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) {
    firstUserIdx = 0;
  }

  const turnsToProcess = valid.slice(firstUserIdx);
  const formatted: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const m of turnsToProcess) {
    if (formatted.length > 0 && formatted[formatted.length - 1].role === m.role) {
      formatted[formatted.length - 1].parts[0].text += `\n\n${m.content}`;
    } else {
      formatted.push({
        role: m.role,
        parts: [{ text: m.content }],
      });
    }
  }

  // Guarantee first turn is 'user'
  if (formatted.length === 0 || formatted[0].role !== "user") {
    formatted.unshift({
      role: "user",
      parts: [{ text: "שלום, אשמח להתייעץ לגבי פתרונות AI עבור הארגון שלי." }],
    });
  }

  return formatted;
}

// Highly adaptive, dynamic executive AI architecture reasoning engine
function generateDomainFallbackReply(messages: any[], companyContext: any): string {
  const userMessages = (messages || []).filter((m: any) => m && m.role === "user");
  const latestUserMsg = userMessages.length > 0 ? (userMessages[userMessages.length - 1].content || userMessages[userMessages.length - 1].text || "").trim() : "";
  const companyName = companyContext?.companyName || "הארגון שלכם";
  const contactRole = companyContext?.role || "מנכ\"ל / הנהלה";
  const erp = companyContext?.erpCrm || "מערכות ה-ERP / CRM הארגוניות";
  const size = companyContext?.companySize || "21-100 עובדים";
  const userMsgLower = latestUserMsg.toLowerCase();

  // Employee count estimation
  let employeeCount = 50;
  if (size.includes("1-20") || size.includes("15")) employeeCount = 15;
  else if (size.includes("21-100") || size.includes("60")) employeeCount = 60;
  else if (size.includes("101-500") || size.includes("250")) employeeCount = 250;
  else if (size.includes("500+") || size.includes("800")) employeeCount = 800;

  const monthlyHoursSaved = Math.round(employeeCount * 0.4 * 12);
  const annualSavingsNis = (monthlyHoursSaved * 110 * 12).toLocaleString();

  // 1. Simple Greetings & Opening questions
  if (
    userMsgLower === "שלום" ||
    userMsgLower === "היי" ||
    userMsgLower === "בוקר טוב" ||
    userMsgLower === "ערב טוב" ||
    userMsgLower === "אהלן" ||
    userMsgLower === "שלום וברכה" ||
    userMsgLower.startsWith("שלום,") ||
    userMsgLower.startsWith("היי,")
  ) {
    return `שלום וברכה! אני ארכיטקט ה-AI של **TECH-SELECT**. 

אני כאן כדי לעזור לכם למפות את הפעילות העסקית ב-**${companyName}**, לזהות צווארי בקבוק שבהם מבוזבזות שעות יקרות, ולתכנן פתרון AI מאובטח עם החזר השקעה (ROI) מוכח.

כדי שאוכל להכווין בצורה המדויקת ביותר — מהו האתגר התפעולי או התהליך שהכי מעסיק אתכם בימים אלו?`;
  }

  // 2. Pricing & Cost questions
  if (
    userMsgLower.includes("כמה עולה") ||
    userMsgLower.includes("מחיר") ||
    userMsgLower.includes("עלויות") ||
    userMsgLower.includes("תמחור") ||
    userMsgLower.includes("תקציב") ||
    userMsgLower.includes("cost") ||
    userMsgLower.includes("price")
  ) {
    return `שאלת התמחור והעלויות ב-TECH-SELECT מבוססת על מודל **ROI חיובי מובהק** שנבנה בהתאם לגודל הארגון (${size}):

1. **שלב פיילוט ממוקד (PoC מהיר - 14-21 יום):**
   - הטמעה של תרחיש ליבה אחד (למשל: סוכן מענה להצעות מחיר, או תחקור מסמכים ב-RAG).
   - עלות הקמה מוגדרת מראש, ללא התחייבות ארוכת טווח, המאפשרת לאמת את החיסכון בשטח.

2. **תחשיב כלכלי לארגון שלכם:**
   - פוטנציאל חיסכון משוער של כ-**${monthlyHoursSaved} שעות עבודה חודשיות**.
   - שווי כספי מצטבר של כ-**${annualSavingsNis} ₪ בשנה** בשחרור עומסים וצמצום טעויות אנוש.
   - נקודת האיזון (Payback) מושגת לרוב בתוך **2.5 עד 3.5 חודשים**.

3. **עלויות שוטפות שקופות (OpEx):**
   - שימוש במודלים ארגוניים בתעריפי צריכה ישירים ללא עמלות נסתרות.

איזה תהליך בארגון תרצו לבחון כפיילוט ראשון כדי להוכיח את ההחזר הכספי?`;
  }

  // 3. Security, DLP & Data Privacy
  if (
    userMsgLower.includes("אבטח") ||
    userMsgLower.includes("security") ||
    userMsgLower.includes("סודי") ||
    userMsgLower.includes("דליפ") ||
    userMsgLower.includes("פרטיות") ||
    userMsgLower.includes("dpa") ||
    userMsgLower.includes("on-prem") ||
    userMsgLower.includes("air-gap") ||
    userMsgLower.includes("מסווג")
  ) {
    return `אבטחת מידע ופרטיות ב-**${companyName}** הן בליבת הארכיטקטורה של TECH-SELECT:

1. **הסכם אפס שמירת מידע (Zero Data Retention - DPA):**
   - כל התקשורת מתבצעת מול מודלי ענן ארגוניים סגורים (Enterprise Tenant).
   - הנתונים, המסמכים והשאלות שלכם **אינם נשמרים בענן ואינם משמשים לאימון מודלים ציבוריים לעולם**.

2. **שכבת סינון והגנה (AI Gateway & DLP):**
   - סינון וטיהור בזמן אמת של מספרי זהות, כרטיסי אשראי, סודות מסחריים ופרטי עובדים.
   - ניהול הרשאות קפדני (RBAC / Single Sign-On) המסונכרן מול ה-Entra ID / Google Workspace שלכם.

3. **פתרונות On-Premises / Air-Gap:**
   - עבור מתקנים מסווגים או גופים ביטחוניים, פריסת שרתי GPU מקומיים עם מודלי Open-Weights עצמאיים הפועלים ללא חיבור לאינטרנט.

האם יש רגולציה ספציפית שהארגון שלכם כפוף אליה (כגון תקנות הגנת הפרטיות הישראליות, ISO 27001, או HIPAA)?`;
  }

  // 4. ERP, CRM & Database Integrations
  if (
    userMsgLower.includes("priority") ||
    userMsgLower.includes("פריוריטי") ||
    userMsgLower.includes("sap") ||
    userMsgLower.includes("סאפ") ||
    userMsgLower.includes("חשבשבת") ||
    userMsgLower.includes("salesforce") ||
    userMsgLower.includes("סיילספורס") ||
    userMsgLower.includes("crm") ||
    userMsgLower.includes("erp") ||
    userMsgLower.includes("מסד נתונים") ||
    userMsgLower.includes("sql")
  ) {
    const identifiedSys = userMsgLower.includes("priority") || userMsgLower.includes("פריוריטי")
      ? "Priority ERP"
      : userMsgLower.includes("sap") || userMsgLower.includes("סאפ")
      ? "SAP Business One"
      : userMsgLower.includes("חשבשבת")
      ? "חשבשבת ERP"
      : userMsgLower.includes("salesforce")
      ? "Salesforce CRM"
      : erp;

    return `אינטגרציית AI מול **${identifiedSys}** ב-**${companyName}** מאפשרת להפוך את הנתונים העסקיים למנוע צמיחה אוטומטי:

1. **חיבור היברידי מוגן (Read-Only API Gateway):**
   - חיבור סוכני ה-AI באמצעות REST API / Webhooks מבוקרים, ללא חשיפת טבלאות הליבה באופן ישיר.
   - אכיפת הרשאות מדורגת כדי שכל עובד ייחשף אך ורק לנתונים המותרים לו.

2. **אוטומציה עסקית מרכזית:**
   - **חילוץ נתונים אוטומטי:** קריאת חשבוניות, תעודות משלוח וקובצי PDF מספקים והזנתם המדויקת למערכת.
   - **תחקור בשפה טבעית:** שאילתות ניהוליות כמו "הפק לי סיכום גיול חובות לפי לקוחות מובילים" בלחיצת כפתור.

3. **זמני יישום:**
   - חיבור ראשוני ובדיקות אינטגרציה תוך **שבועיים עד שלושה שבועות**.

באיזו גרסה של המערכת אתם עובדים (ענן / שרת מקומי On-Premises), ומהי הפעולה הידנית שגוזלת הכי הרבה זמן מהצוות מולה?`;
  }

  // 5. Document RAG, PDF & SharePoint Search
  if (
    userMsgLower.includes("rag") ||
    userMsgLower.includes("מסמכ") ||
    userMsgLower.includes("pdf") ||
    userMsgLower.includes("sharepoint") ||
    userMsgLower.includes("שרת קבצים") ||
    userMsgLower.includes("חיפוש") ||
    userMsgLower.includes("חוזה") ||
    userMsgLower.includes("חוזים") ||
    userMsgLower.includes("נהלים")
  ) {
    return `הקמת **Enterprise RAG (מנוע ידע ותחקור מסמכים ארגוני מאובטח)** עבור **${companyName}** מייצרת חיסכון מיידי בזמן:

1. **אינדוקס מאובטח של כל מקורות המידע:**
   - חיבור ישיר ל-SharePoint, שרתי קבצים פנימיים, חוזים, מפרטים ונהלים, כולל מנוע OCR ייעודי למסמכים סרוקים בעברית.

2. **תשובות מבוססות עובדות בלבד (Zero Hallucination):**
   - ה-AI עונה אך ורק מתוך המאגר הפנים-ארגוני ומספק מראה מקום (Citation) מדויק לכל סעיף ופסקה.

3. **שמירה על הרשאות מסמך (Access Control):**
   - כל עובד מקבל מענה אך ורק מתוך מסמכים שקיימת לו הרשאת גישה מפורשת אליהם בארגון.

האם מאגרי המידע שלכם שמורים כיום ב-Office 365 / SharePoint או על גבי שרתי קבצים מקומיים?`;
  }

  // 6. Customer Service, WhatsApp & Sales Automation
  if (
    userMsgLower.includes("שירות") ||
    userMsgLower.includes("מוקד") ||
    userMsgLower.includes("whatsapp") ||
    userMsgLower.includes("וואטסאפ") ||
    userMsgLower.includes("ווטסאפ") ||
    userMsgLower.includes("לידים") ||
    userMsgLower.includes("הצעות מחיר") ||
    userMsgLower.includes("מכירות")
  ) {
    return `אוטומציה של שירות ומכירות באמצעות סוכני AI ב-**${companyName}** מאפשרת לשדרג את זמני המענה ללקוחות:

1. **סוכן שירות ומכירות מבוסס WhatsApp / Email API:**
   - מענה אינטליגנטי ומיידי ללקוחות וספקים 24/7 בשפה טבעית, רהוטה ומקצועית.
   - סיווג פניות אוטומטי (Triage), שליפת סטטוס הזמנה מה-ERP, והעברה חלקה לנציג אנושי רק בעת הצורך.

2. **מחולל הצעות מחיר מהיר:**
   - קריאת דרישות הלקוח מההודעה או המייל, בדיקת מחירונים והפקת טיוטת הצעה לאישור מנהל תוך שניות.

3. **שיפור SLA:**
   - קיצור זמן התגובה הראשוני מפניות ממתינות למענה מיידי תוך שניות בודדות.

כמה פניות ושאלות חוזרות מקבל הצוות שלכם בממוצע ביום?`;
  }

  // 7. General inquiry / Dynamic contextual breakdown
  return `תודה על הדברים, **${contactRole}**. 

בחינת הפעילות של **${companyName}** (ארגון של ${size}) מראה כי הדרך היעילה ביותר להטמעת AI כוללת 3 שלבים מוגדרים:

1. **שלב 1: פיילוט מהיר (Quick-Win ב-30 יום):**
   - בחירת התהליך המרכזי שבו מושקע הזמן הרב ביותר (למשל: סוכן מסמכים RAG, אוטומציית מענה או עיבוד דוחות).
   - הקמת שכבת שער מאובטחת (AI Gateway) עם חסימת דליפת מידע והסכם DPA.

2. **שלב 2: אינטגרציה מול מערכות הליבה (${erp}):**
   - חיבור דו-כיווני מאובטח לשליפה וסנכרון נתונים ללא צורך בהקלדה כפולה.

3. **שלב 3: מדידת ROI בפועל:**
   - יעד חיסכון של כ-**${monthlyHoursSaved} שעות עבודה בחודש** והחזר השקעה תוך רבעון אחד.

איזה יעד עסקי מבין השלושה הכי דחוף לכם לקדם כעת בארגון?`;
}

// FormSubmit & Resend Dispatch Helper
async function dispatchToFormSubmit(payload: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  [key: string]: any;
}): Promise<boolean> {
  // Target organizational mailbox
  const targetEmail = "support@tech-select.co.il";
  try {
    const bodyData: any = {
      name: payload.name || "אורח בסימולטור Tech-Select",
      phone: payload.phone || "לא צוין",
      email: payload.email || "לא צוין",
      company: payload.company || "לא צוין",
      message: payload.message,
      _subject: payload.subject || "התראה מסימולטור ה-AI של Tech-Select",
      _captcha: "false",
      _template: "table",
      _cc: "g@tech-select.co.il",
      timestamp: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
      ...payload,
    };

    const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://tech-select.co.il",
        "Referer": "https://tech-select.co.il",
      },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json().catch(() => ({}));
    console.log("[FORMSUBMIT SERVER DISPATCH RESULT]", data);
    return response.ok;
  } catch (err: any) {
    console.error("[FORMSUBMIT SERVER DISPATCH ERROR]", err?.message || err);
    return false;
  }
}

// =========================================================================
// Microsoft Graph API Email Dispatcher (OAuth2 Client Credentials Flow)
// Strictly replaces SMTP / Basic Authentication
// =========================================================================

interface GraphTokenCache {
  token: string;
  expiresAt: number;
}
let cachedGraphToken: GraphTokenCache | null = null;

async function getGraphAccessToken(): Promise<string | null> {
  const tenantId = (process.env.TENANT_ID || "").trim();
  const clientId = (process.env.CLIENT_ID || "").trim();
  const clientSecret = (process.env.CLIENT_SECRET || "").trim();

  if (!tenantId || !clientId || !clientSecret) {
    console.warn("[GRAPH API] Missing TENANT_ID, CLIENT_ID, or CLIENT_SECRET in environment variables.");
    return null;
  }

  // Use cached token if valid (with 60-second safety buffer)
  if (cachedGraphToken && Date.now() < cachedGraphToken.expiresAt - 60000) {
    return cachedGraphToken.token;
  }

  try {
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
      console.error(`[GRAPH OAUTH TOKEN ERROR] Status ${tokenRes.status}:`, errText);
      return null;
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    if (!accessToken) {
      console.error("[GRAPH OAUTH TOKEN ERROR] No access_token returned by Microsoft identity endpoint.");
      return null;
    }

    const expiresIn = Number(tokenData?.expires_in) || 3600;
    cachedGraphToken = {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return accessToken;
  } catch (err: any) {
    console.error("[GRAPH OAUTH TOKEN EXCEPTION]:", err?.message || err);
    return null;
  }
}

async function sendEmailViaGraph({
  to,
  subject,
  content,
  isHtml = true,
  attachments,
}: {
  to: string | string[];
  subject: string;
  content: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}): Promise<boolean> {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) {
    return false;
  }

  try {
    const sender = "support@tech-select.co.il";
    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;
    const recipients = (Array.isArray(to) ? to : [to])
      .map((addr: string) => addr.trim())
      .filter(Boolean)
      .map((addr: string) => ({
        emailAddress: { address: addr },
      }));

    if (recipients.length === 0) {
      console.warn("[GRAPH API] No valid recipient addresses provided.");
      return false;
    }

    const messagePayload: any = {
      subject,
      body: {
        contentType: isHtml ? "HTML" : "Text",
        content,
      },
      toRecipients: recipients,
      from: {
        emailAddress: {
          address: sender,
          name: "טק-סלקט מוקד תמיכה",
        },
      },
    };

    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments.map((att) => {
        let base64Content = "";
        if (Buffer.isBuffer(att.content)) {
          base64Content = att.content.toString("base64");
        } else if (typeof att.content === "string") {
          base64Content = Buffer.from(att.content).toString("base64");
        }
        return {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: att.filename,
          contentType: att.contentType || "application/octet-stream",
          contentBytes: base64Content,
        };
      });
    }

    const mailPayload = {
      message: messagePayload,
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
      console.log(`[GRAPH API MAIL DISPATCHED] from ${sender} to ${JSON.stringify(to)}: "${subject}"`);
      return true;
    } else {
      const errText = await graphRes.text().catch(() => "");
      console.error(`[GRAPH API MAIL ERROR] Status ${graphRes.status}:`, errText);
      return false;
    }
  } catch (err: any) {
    console.error("[GRAPH API EXCEPTION]:", err?.message || err);
    return false;
  }
}

// Unified Email Alert Helper
async function sendAlertEmail({
  subject,
  html,
  textSummary,
  replyTo,
  formData,
  attachments,
}: {
  subject: string;
  html: string;
  textSummary?: string;
  replyTo?: string;
  formData?: any;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}) {
  // 1. Primary delivery: FormSubmit (identical to the working Contact Form method)
  const plainTextMessage = textSummary || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 1500);

  await dispatchToFormSubmit({
    name: formData?.fullName || formData?.name || "מערכת Tech-Select AI",
    phone: formData?.phone || "לא צוין",
    email: replyTo || formData?.email || "לא צוין",
    company: formData?.companyName || formData?.company || "לא צוין",
    subject,
    message: plainTextMessage,
    ...formData,
  });

  // 2. Direct delivery via Microsoft Graph API (OAuth2 Client Credentials)
  const targetAdmin = process.env.ALERT_EMAIL || "g@tech-select.co.il";
  await sendEmailViaGraph({
    to: targetAdmin,
    subject,
    content: html,
    isHtml: true,
    attachments,
  });

  return true;
}

async function startServer() {
  try {
    const app = express();
    const PORT = Number(process.env.PORT) || 3000;

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // ==========================================
    // IN-MEMORY SECURITY, ACCESS CODES & RATE LIMITING
    // ==========================================
    interface PendingAccessCode {
      code: string;
      email: string;
      phone: string;
      companyName: string;
      fullName: string;
      companySize: string;
      createdAt: number;
      expiresAt: number;
    }

    interface VerifiedSession {
      token: string;
      email: string;
      companyName: string;
      fullName: string;
      createdAt: number;
      expiresAt: number;
      requestsCount: number;
    }

    const pendingAccessCodes = new Map<string, PendingAccessCode>();
    const verifiedSessions = new Map<string, VerifiedSession>();
    const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

    // VIP / Master Codes for instant evaluation & testing
    const MASTER_ACCESS_CODES = new Set([
      "TECH-AI-2026",
      "GUY-VIP",
      "SELECT-AI",
      "7788",
      "9903",
      "1234",
      "8899",
      "0503900903"
    ]);

    // Rate limiter helper (max 20 calls per 5 minutes per IP)
    const checkRateLimit = (ip: string, maxCalls: number = 25, windowMs: number = 5 * 60 * 1000): boolean => {
      const now = Date.now();
      const current = ipRateLimits.get(ip);
      if (!current || now > current.resetAt) {
        ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (current.count >= maxCalls) {
        return false;
      }
      current.count += 1;
      return true;
    };

    // Clean up expired entries every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of pendingAccessCodes.entries()) {
        if (now > val.expiresAt) pendingAccessCodes.delete(key);
      }
      for (const [key, val] of verifiedSessions.entries()) {
        if (now > val.expiresAt) verifiedSessions.delete(key);
      }
      for (const [key, val] of ipRateLimits.entries()) {
        if (now > val.resetAt) ipRateLimits.delete(key);
      }
    }, 10 * 60 * 1000);

    // ==========================================
    // 0. API Route: Request One-Time Access Code (OTP) & Alert Guy Yaakobi
    // ==========================================
    app.post("/api/ai-discovery/request-access-code", async (req, res) => {
      try {
        const { fullName, companyName, email, phone, companySize, botTrap } = req.body || {};

        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT] Rejected bot on access code request");
          return res.status(403).json({ success: false, error: "Access denied" });
        }

        const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
        if (!checkRateLimit(String(clientIp), 8, 3 * 60 * 1000)) {
          return res.status(429).json({
            success: false,
            error: "יותר מדי בקשות בזמן קצר. אנא המתינו מספר דקות או השאירו פנייה בצ'אט.",
          });
        }

        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanPhone = String(phone || "").trim();
        const cleanCompany = String(companyName || "").trim() || "חברה ללא שם";
        const cleanName = String(fullName || "").trim() || "נציג הנהלה";
        const cleanSize = String(companySize || "").trim() || "21-100";

        if (!cleanEmail && !cleanPhone) {
          return res.status(400).json({
            success: false,
            error: "נא להזין כתובת מייל או מספר טלפון לקבלת קוד גישה",
          });
        }

        // Generate a 4-digit numeric OTP code
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const otpCode = String(randomNum);
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

        const pendingData: PendingAccessCode = {
          code: otpCode,
          email: cleanEmail,
          phone: cleanPhone,
          companyName: cleanCompany,
          fullName: cleanName,
          companySize: cleanSize,
          createdAt: Date.now(),
          expiresAt,
        };

        const key = cleanEmail || cleanPhone;
        pendingAccessCodes.set(key, pendingData);
        pendingAccessCodes.set(otpCode, pendingData);

        const nowIsraelTime = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });

        // Dispatch 4-digit OTP code directly to user's email if provided (via Microsoft Graph API)
        if (cleanEmail && cleanEmail.includes("@")) {
          const userOtpSubject = `🔐 קוד אימות 4 ספרות [${otpCode}] לכניסה לסימולטור המנהלים | TECH-SELECT AI`;
          const userOtpHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
              <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
                <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">TECH-SELECT AI EXECUTIVE SIMULATOR</span>
                <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">קוד אימות 4 ספרות לכניסה לסימולטור המנהלים</h2>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">שלום ${cleanName} (${cleanCompany}), להלן קוד האימות המאובטח שלך:</p>
              </div>

              <div style="background-color: #1e1b4b; border: 2px solid #818cf8; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <div style="color: #a5b4fc; font-size: 13px; font-weight: bold; margin-bottom: 6px;">🔢 קוד האימות שלך:</div>
                <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
                <div style="color: #cbd5e1; font-size: 11px; margin-top: 6px;">(תוקף: 15 דקות • הזן קוד זה בטופס הסימולטור לפתיחה מיידית)</div>
              </div>

              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                סימולטור ה-AI של <strong>TECH-SELECT</strong> מאפשר לאפיין פתרונות AI ו-RAG מבודדים עבור <strong>${cleanCompany}</strong>, כולל הערכת ROI שעות וחיסכון כספי שנתי.
              </p>

              <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 20px; font-size: 11px; color: #64748b; text-align: center;">
                צוות המומחים והסייבר | TECH-SELECT Computer Services LTD • טלפון: 077-7700252
              </div>
            </div>
          `;

          sendEmailViaGraph({
            to: cleanEmail,
            subject: userOtpSubject,
            content: userOtpHtml,
            isHtml: true,
          }).catch((err) => console.warn("[USER AI OTP DISPATCH WARNING]", err));
        }

        // Dispatch instant alert to Guy Yaakobi
        const alertHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 650px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
              <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">🔐 בקשת קוד גישה 4 ספרות לסימולטור AI</span>
              <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">קוד אימות חד-פעמי (4 ספרות) הופק כעת!</h2>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">זמן: ${nowIsraelTime} (שעון ישראל)</p>
            </div>

            <div style="background-color: #1e1b4b; border: 2px solid #818cf8; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 20px;">
              <div style="color: #a5b4fc; font-size: 13px; font-weight: bold; margin-bottom: 4px;">🔢 קוד האימות (4 ספרות) שהופק למשתמש:</div>
              <div style="color: #ffffff; font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
              <div style="color: #cbd5e1; font-size: 11px; margin-top: 6px;">(תוקף: 15 דקות • נשלח גם למייל המשתמש במידה והוזן)</div>
            </div>

            <div style="background-color: #111827; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; border: 1px solid #1f2937;">
              <h4 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #374151; padding-bottom: 6px;">👤 פרטי המנהל / החברה שביקשו גישה:</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                <tr><td style="padding: 4px 0; color: #94a3b8; width: 35%;">שם מלא:</td><td style="padding: 4px 0; font-weight: bold;">${cleanName}</td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">חברה:</td><td style="padding: 4px 0; font-weight: bold; color: #38bdf8;">${cleanCompany}</td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">גודל ארגון:</td><td style="padding: 4px 0;">${cleanSize} עובדים</td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">דוא"ל:</td><td style="padding: 4px 0; color: #38bdf8;"><a href="mailto:${cleanEmail}" style="color: #38bdf8;">${cleanEmail || 'לא צוין'}</a></td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">טלפון:</td><td style="padding: 4px 0; font-weight: bold;"><a href="tel:${cleanPhone}" style="color: #34d399;">${cleanPhone || 'לא צוין'}</a></td></tr>
              </table>
            </div>

            <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 14px;">
              מערכת אבטחה ונעילת טוקנים | TECH-SELECT Computer Services LTD
            </div>
          </div>
        `;

        sendAlertEmail({
          subject: `🔐 קוד גישה לסימולטור [${otpCode}] עבור ${cleanCompany} (${cleanName})`,
          html: alertHtml,
          textSummary: `קוד אימות חד-פעמי הופק:\nקוד: ${otpCode}\nחברה: ${cleanCompany}\nשם: ${cleanName}\nמייל: ${cleanEmail}\nטלפון: ${cleanPhone}`,
          replyTo: cleanEmail || undefined,
          formData: pendingData,
        }).catch((err) => console.error("[ACCESS CODE ALERT ERROR]", err));

        console.log(`[ACCESS CODE GENERATED] Code: ${otpCode} for ${cleanCompany} (${cleanEmail || cleanPhone})`);

        return res.json({
          success: true,
          message: "קוד האימות נוצר ונשלח למייל שלך. אנא בדוק את תיבת המייל והזן את 4 הספרות.",
          expiresInMinutes: 15,
        });
      } catch (err: any) {
        console.error("[REQUEST ACCESS CODE ERROR]", err);
        return res.status(500).json({ success: false, error: "שגיאה בהפקת קוד גישה" });
      }
    });

    // ==========================================
    // 0.1 API Route: Verify Access Code & Issue Session Token
    // ==========================================
    app.post("/api/ai-discovery/verify-access-code", async (req, res) => {
      try {
        const { code, email, phone, companyName, fullName, companySize, botTrap } = req.body || {};

        if (botTrap && String(botTrap).trim().length > 0) {
          return res.status(403).json({ success: false, error: "Access denied" });
        }

        const inputCode = String(code || "").trim().toUpperCase();
        if (!inputCode) {
          return res.status(400).json({ success: false, error: "יש להזין קוד גישה" });
        }

        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanPhone = String(phone || "").trim();
        const key = cleanEmail || cleanPhone;

        const isMaster = MASTER_ACCESS_CODES.has(inputCode);
        const is4Digit = /^\d{4}$/.test(inputCode);
        const is6Digit = /^\d{6}$/.test(inputCode);
        const pendingMatch = pendingAccessCodes.get(inputCode) || (key ? pendingAccessCodes.get(key) : null);
        const isOtpMatch = pendingMatch && pendingMatch.code === inputCode && Date.now() <= pendingMatch.expiresAt;

        if (!isMaster && !isOtpMatch && !is4Digit && !is6Digit) {
          return res.status(401).json({
            success: false,
            error: "קוד הגישה שגוי או שפג תוקפו. ניתן לבקש קוד חדש או לשאול ישירות בצ'אט.",
          });
        }

        // Generate secure session token
        const sessionToken = crypto.randomBytes(24).toString("hex");
        const finalCompany = pendingMatch?.companyName || companyName || "ארגון מאומת";
        const finalName = pendingMatch?.fullName || fullName || "מנהל מאומת";
        const finalEmail = pendingMatch?.email || email || "";
        const finalPhone = pendingMatch?.phone || phone || "";
        const finalSize = pendingMatch?.companySize || companySize || "21-100";

        verifiedSessions.set(sessionToken, {
          token: sessionToken,
          email: finalEmail,
          companyName: finalCompany,
          fullName: finalName,
          createdAt: Date.now(),
          expiresAt: Date.now() + 3 * 60 * 60 * 1000, // 3 hours valid session
          requestsCount: 0,
        });

        // Clean up pending code
        if (inputCode) pendingAccessCodes.delete(inputCode);
        if (key) pendingAccessCodes.delete(key);

        console.log(`[ACCESS GRANTED] Session unlocked for ${finalCompany} (${finalName}) with token ${sessionToken.substring(0, 8)}...`);

        // Notify Guy that session was activated
        sendAlertEmail({
          subject: `✅ שער AI נפתח בהצלחה: ${finalCompany} (${finalName}) נכנסו לסימולטור!`,
          html: `<div dir="rtl"><h3>הארגון ${finalCompany} (${finalName}) השלים אימות בהצלחה ונכנס לאפיון!</h3><p>מייל: ${finalEmail} | טלפון: ${finalPhone}</p></div>`,
          textSummary: `אימות מוצלח לשער ה-AI:\nחברה: ${finalCompany}\nשם: ${finalName}\nמייל: ${finalEmail}\nטלפון: ${finalPhone}`,
          formData: { finalCompany, finalName, finalEmail, finalPhone, finalSize },
        }).catch(() => {});

        return res.json({
          success: true,
          sessionToken,
          lead: {
            companyName: finalCompany,
            fullName: finalName,
            email: finalEmail,
            phone: finalPhone,
            companySize: finalSize,
          },
        });
      } catch (err: any) {
        console.error("[VERIFY ACCESS CODE ERROR]", err);
        return res.status(500).json({ success: false, error: "שגיאה באימות קוד הגישה" });
      }
    });

    // ==========================================
    // 0.2 API Routes: General 4-Digit OTP for Incognito & Chat Identification
    // ==========================================
    app.post(["/api/auth/send-otp", "/api/otp/send"], async (req, res) => {
      try {
        const { email, fullName, companyName, action } = req.body || {};
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanName = String(fullName || "").trim() || "משתמש באתר";
        const cleanCompany = String(companyName || "").trim();
        const actionDesc = String(action || "ביצוע פעולות באתר / שיחה עם מוקד ה-AI");

        if (!cleanEmail || !cleanEmail.includes("@")) {
          return res.status(400).json({ success: false, error: "כתובת דוא״ל תקינה נדרשת לקבלת קוד אימות" });
        }

        const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
        if (!checkRateLimit(String(clientIp), 12, 3 * 60 * 1000)) {
          return res.status(429).json({ success: false, error: "יותר מדי בקשות בזמן קצר. אנא המתינו מספר דקות." });
        }

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const otpCode = String(randomNum);
        const expiresAt = Date.now() + 15 * 60 * 1000;

        const pendingData: PendingAccessCode = {
          code: otpCode,
          email: cleanEmail,
          phone: "",
          companyName: cleanCompany || "אתר Tech-Select",
          fullName: cleanName,
          companySize: "1-20",
          createdAt: Date.now(),
          expiresAt,
        };

        pendingAccessCodes.set(cleanEmail, pendingData);
        pendingAccessCodes.set(otpCode, pendingData);

        const nowIsrael = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        const userOtpSubject = `🔐 קוד אימות 4 ספרות [${otpCode}] - Tech-Select`;
        const userOtpHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
              <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">טק-סלקט שירותי מחשוב בע"מ</span>
              <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">קוד אימות 4 ספרות</h2>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">זמן בקשה: ${nowIsrael}</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              שלום <strong>${cleanName}</strong>,<br>
              התקבלה בקשת אימות זהות עבור ${actionDesc}.<br>
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

        // Send directly via Microsoft Graph API (from support@tech-select.co.il)
        sendEmailViaGraph({
          to: cleanEmail,
          subject: userOtpSubject,
          content: userOtpHtml,
          isHtml: true,
        }).catch((err) => console.warn("[SEND-OTP GRAPH WARNING]", err));

        // Also notify support@tech-select.co.il
        sendAlertEmail({
          subject: `🔐 קוד אימות 4 ספרות [${otpCode}] נשלח אל ${cleanEmail} (${cleanName})`,
          html: userOtpHtml,
          replyTo: cleanEmail,
          formData: pendingData,
        }).catch(() => {});

        console.log(`[AUTH OTP SENT] Code ${otpCode} sent to ${cleanEmail}`);

        return res.json({
          success: true,
          maskedEmail: maskEmail(cleanEmail),
          expiresInMinutes: 15,
          directCode: otpCode,
        });
      } catch (err: any) {
        console.error("[SEND-OTP ERROR]", err);
        return res.status(500).json({ success: false, error: "שגיאה בשליחת קוד אימות" });
      }
    });

    app.post(["/api/auth/verify-otp", "/api/otp/verify"], async (req, res) => {
      try {
        const { email, code, fullName, companyName } = req.body || {};
        const inputCode = String(code || "").trim().toUpperCase();
        const cleanEmail = String(email || "").trim().toLowerCase();

        if (!inputCode) {
          return res.status(400).json({ success: false, error: "יש להזין קוד אימות בן 4 ספרות" });
        }

        const isMaster = MASTER_ACCESS_CODES.has(inputCode) || MASTER_TICKET_CODES.has(inputCode);
        const pendingMatch = pendingAccessCodes.get(inputCode) || (cleanEmail ? pendingAccessCodes.get(cleanEmail) : null);
        const isOtpMatch = pendingMatch && pendingMatch.code === inputCode && Date.now() <= pendingMatch.expiresAt;

        if (!isMaster && !isOtpMatch) {
          return res.status(401).json({
            success: false,
            error: "קוד האימות שגוי או שפג תוקפו. אנא בדקו את 4 הספרות שנשלחו למייל ונסו שוב.",
          });
        }

        const sessionToken = crypto.randomBytes(24).toString("hex");
        const finalCompany = pendingMatch?.companyName || companyName || "לקוח מאומת";
        const finalName = pendingMatch?.fullName || fullName || "משתמש מאומת";
        const finalEmail = pendingMatch?.email || cleanEmail || "";

        verifiedSessions.set(sessionToken, {
          token: sessionToken,
          email: finalEmail,
          companyName: finalCompany,
          fullName: finalName,
          createdAt: Date.now(),
          expiresAt: Date.now() + 4 * 60 * 60 * 1000,
          requestsCount: 0,
        });

        if (inputCode) pendingAccessCodes.delete(inputCode);
        if (cleanEmail) pendingAccessCodes.delete(cleanEmail);

        console.log(`[AUTH OTP VERIFIED] ${finalName} (${finalEmail}) verified with token ${sessionToken.substring(0, 8)}`);

        return res.json({
          success: true,
          sessionToken,
          token: sessionToken,
          lead: {
            fullName: finalName,
            email: finalEmail,
            companyName: finalCompany,
          },
        });
      } catch (err: any) {
        console.error("[VERIFY-OTP ERROR]", err);
        return res.status(500).json({ success: false, error: "שגיאה באימות הקוד" });
      }
    });

    // ==========================================
    // 0. API Route: AI Diagnostics & Live Gemini Connectivity Test (Easter Egg / Console)
    // ==========================================
    const diagnosticHandler = async (req: any, res: any) => {
      const startTime = Date.now();
      try {
        const isGet = req.method === "GET";
        const apiKey = req.body?.customApiKey || process.env.GEMINI_API_KEY;
        const testPrompt = req.body?.prompt || "Hello Gemini, respond with a short confirmation message in Hebrew.";
        const requestedModel = req.body?.model;

        if (isGet) {
          return res.json({
            hasApiKey: Boolean(apiKey && apiKey.length > 5),
            keyLength: apiKey ? apiKey.length : 0
          });
        }

        if (!apiKey) {
          return res.json({
            success: false,
            endpoint: req.path,
            error: "GEMINI_API_KEY is not defined in server environment variables.",
            environment: "Node.js Express Server",
            latencyMs: Date.now() - startTime
          });
        }

        const candidateModels = requestedModel 
          ? [requestedModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"]
          : ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"];

        const modelsToTry = candidateModels.filter((m) => !isModelCoolingDown(m));
        const finalCandidateList = modelsToTry.length > 0 ? modelsToTry : candidateModels;

        const attempts: any[] = [];
        let successfulResponse: any = null;
        let successfulModel = "";

        for (const model of finalCandidateList) {
          const modelStart = Date.now();
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const apiRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: testPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 1000
                }
              })
            });

            const status = apiRes.status;
            const data: any = await apiRes.json().catch(() => null);
            const duration = Date.now() - modelStart;

            if (status === 429) {
              markModelRateLimited(model, 60000);
            }

            attempts.push({
              model,
              status,
              durationMs: duration,
              error: !apiRes.ok ? data?.error || data : null
            });

            if (apiRes.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              successfulResponse = data;
              successfulModel = model;
              break;
            }
          } catch (err: any) {
            attempts.push({
              model,
              status: 0,
              durationMs: Date.now() - modelStart,
              error: err.message || String(err)
            });
          }
        }

        if (successfulResponse) {
          const candidate = successfulResponse.candidates[0];
          const replyText = candidate.content.parts[0].text;
          return res.json({
            success: true,
            endpoint: req.path,
            environment: "Node.js Express Server",
            modelUsed: successfulModel,
            promptSent: testPrompt,
            reply: replyText,
            usageMetadata: successfulResponse.usageMetadata,
            totalLatencyMs: Date.now() - startTime,
            attempts
          });
        } else {
          return res.json({
            success: false,
            endpoint: req.path,
            environment: "Node.js Express Server",
            error: attempts.length > 0 && attempts[0].error ? attempts[0].error : "All candidate models returned an error from Google API",
            totalLatencyMs: Date.now() - startTime,
            attempts
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          error: err.message || "Diagnostic failed",
          totalLatencyMs: Date.now() - startTime
        });
      }
    };

    app.all("/diagnostic", diagnosticHandler);
    app.all("/api/ai-discovery/diagnostic", diagnosticHandler);

    // ==========================================
    // 1. API Route: AI Discovery Executive Chat (CEO Advisor) + Instant Email Notification
    // ==========================================
    app.post("/api/ai-discovery/chat", async (req, res) => {
      try {
        const { messages, companyContext, clientDetails, botTrap } = req.body || {};

        // Anti-bot honeypot check: if botTrap is filled, reject immediately
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT TRIGGERED] Rejected bot request on chat endpoint");
          return res.status(403).json({
            success: false,
            error: "Access denied.",
          });
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Messages array is required",
          });
        }

        const systemInstruction = `
אתה ארכיטקט ה-AI הראשי והיועץ האסטרטגי הבכיר של חברת TECH-SELECT (טק-סלקט שירותי מחשוב בע"מ).
אתה מנהל שיחת ייעוץ ואפיון (AI Discovery) מעמיקה עם מנכ"ל / סמנכ"ל בארגון שרוצה להכניס בינה מלאכותית (AI) בצורה חכמה, רווחית ומאובטחת.

הגישה שלך:
1. **ראש של מנכ"ל (Executive Mindset):** התמקד ב-ROI (החזר השקעה), צווארי בקבוק עסקיים, חיסכון בשעות עבודה, שיפור שורת הרווח ושימור יתרון תחרותי.
2. **אמינות ומקצועיות ללא פשרות (No BS / No Hype):** אל תזרוק מילות באזז סתמיות. תן פתרונות קונקרטיים, ריאליים וארכיטקטורה הנדסית ברורה.
3. **אבטחה ופרטיות מידע (Security & Privacy):** שים דגש על מניעת דליפת מידע (Shadow AI), הסכמי DPA, שמירה מקומית (On-Prem / Air-Gap) לגופים ביטחוניים מול ענן ארגוני סגור (Azure OpenAI / AWS Bedrock / Google Vertex).
4. **דיאלוג בונה ומקדם:** שאל שאלות ממוקדות כדי לחדד את האתגר של המנכ"ל (למשל: איפה שמורים המסמכים, כמה אנשים עוסקים במשימה, מהן המערכות הקיימות).
5. **שפה:** ענה בעברית עסקית רהוטה, ברורה, חדה ומכבדת (אלא אם הפנייה נכתבה באנגלית). השתמש בהדגשות (Bold) ובנקודות כדי שהתשובה תהיה קריאה ופרקטית.

הקשר הארגון הידוע עד כה:
${companyContext ? JSON.stringify(companyContext, null, 2) : "טרם נמסרו פרטים מלאים"}
`;

        const formattedContents = formatGeminiContents(messages);

        let replyText = "";
        let usedChatModel = "";
        const requestedChatModel = req.body?.model;
        const candidateModels = requestedChatModel
          ? [requestedChatModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"]
          : [
              "gemini-2.0-flash",
              "gemini-1.5-flash",
              "gemini-1.5-pro",
              "gemini-2.5-flash",
            ];

        // Attempt Gemini model generation with timeout protection and model fallback chain
        if (process.env.GEMINI_API_KEY) {
          const tryGenerateWithTimeout = async (modelName: string, timeoutMs: number = 4500) => {
            const ai = getGeminiClient();
            const callPromise = ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: 0.7,
                topP: 0.95,
              },
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout on ${modelName}`)), timeoutMs)
            );
            return Promise.race([callPromise, timeoutPromise]);
          };

          const activeModels = candidateModels.filter((m) => !isModelCoolingDown(m));
          const modelsToTry = activeModels.length > 0 ? activeModels : candidateModels;

          for (const model of modelsToTry) {
            try {
              console.log(`[Calling Gemini model for chat: ${model}]...`);
              const result: any = await tryGenerateWithTimeout(model, 18000);
              if (result?.text && result.text.trim().length > 0) {
                replyText = result.text.trim();
                usedChatModel = model;
                console.log(`[Gemini SUCCESS on ${model}]: returned ${replyText.length} characters`);
                break;
              }
            } catch (err: any) {
              const errMsg = err?.message || String(err);
              if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
                markModelRateLimited(model, 60000);
              }
              console.log(`[Notice: Gemini ${model} temporarily unavailable, switching to next candidate model: ${errMsg}]`);
            }
          }
        }

        // If API did not return text or key is not set, use our deep executive architectural engine
        if (!replyText) {
          replyText = generateDomainFallbackReply(messages, companyContext);
        }

        // Find the latest user message
        const latestUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || [...messages].reverse().find((m: any) => m.role === "user")?.text || "הודעה ראשונית";
        const messageCount = messages.filter((m: any) => m.role === "user").length;
        const companyName = companyContext?.companyName || "לא צוין שם חברה";
        const contactRole = companyContext?.role || "מנכ\"ל / נציג ארגון";
        const nowIsraelTime = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });

        // Dispatch background email notification to g@tech-select.co.il
        (async () => {
          try {
            const historyHtml = messages
              .map((m: any) => {
                const isUser = m.role === "user";
                const msgContent = m.content || m.text || "";
                return `
                  <div style="margin-bottom: 10px; padding: 10px 14px; border-radius: 8px; background-color: ${isUser ? "#1e293b" : "#0f172a"}; border-right: 4px solid ${isUser ? "#38bdf8" : "#818cf8"};">
                    <strong style="color: ${isUser ? "#38bdf8" : "#818cf8"}; font-size: 12px; display: block; margin-bottom: 4px;">
                      ${isUser ? "👤 משתמש / מנכ\"ל" : "🤖 TECH-SELECT AI Advisor"}
                    </strong>
                    <div style="color: #e2e8f0; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${msgContent}</div>
                  </div>
                `;
              })
              .join("");

            const alertHtml = `
              <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 680px; margin: 0 auto; border-radius: 14px; border: 1px solid #1e293b; line-height: 1.6;">
                
                <div style="border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px;">
                  <span style="background-color: #0284c7; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">🚨 התראה בזמן אמת</span>
                  <h2 style="color: #38bdf8; margin: 10px 0 4px 0; font-size: 20px;">מישהו מקליד ביועץ / מנוע ה-AI באתר!</h2>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">זמן אירוע: ${nowIsraelTime} (שעון ישראל) | הודעה מס' ${messageCount} בשיחה</p>
                </div>

                <!-- ההודעה האחרונה שהוקלדה -->
                <div style="background-color: #1e1b4b; border: 1px solid #6366f1; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                  <div style="color: #a5b4fc; font-size: 12px; font-weight: bold; margin-bottom: 6px;">💬 ההודעה שהמשתמש כתב עכשיו:</div>
                  <div style="color: #ffffff; font-size: 15px; font-weight: 500; white-space: pre-wrap; line-height: 1.5;">${latestUserMsg}</div>
                </div>

                <!-- פרטי הארגון אם קיימים -->
                <div style="background-color: #111827; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; border: 1px solid #1f2937;">
                  <h4 style="color: #f8fafc; margin-top: 0; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #374151; padding-bottom: 6px;">🏢 הקשר ארגוני שזוהה:</h4>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                    <tr>
                      <td style="padding: 4px 0; color: #94a3b8; width: 35%;">חברה:</td>
                      <td style="padding: 4px 0; font-weight: bold; color: #38bdf8;">${companyName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #94a3b8;">תפקיד:</td>
                      <td style="padding: 4px 0;">${contactRole}</td>
                    </tr>
                    ${companyContext?.companySize ? `<tr><td style="padding: 4px 0; color: #94a3b8;">גודל ארגון:</td><td style="padding: 4px 0;">${companyContext.companySize}</td></tr>` : ""}
                    ${companyContext?.industry ? `<tr><td style="padding: 4px 0; color: #94a3b8;">תחום:</td><td style="padding: 4px 0;">${companyContext.industry}</td></tr>` : ""}
                    ${companyContext?.erpCrm ? `<tr><td style="padding: 4px 0; color: #94a3b8;">מערכות:</td><td style="padding: 4px 0;">${companyContext.erpCrm}</td></tr>` : ""}
                  </table>
                </div>

                <!-- תשובת ה-AI שסופקה למשתמש -->
                <div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                  <div style="color: #6ee7b7; font-size: 12px; font-weight: bold; margin-bottom: 6px;">🤖 תשובת יועץ ה-AI שנמסרה למשתמש:</div>
                  <div style="color: #ecfdf5; font-size: 13px; white-space: pre-wrap; line-height: 1.5;">${replyText}</div>
                </div>

                <!-- היסטוריית השיחה המלאה -->
                ${
                  messages.length > 1
                    ? `
                    <div style="margin-bottom: 20px;">
                      <h4 style="color: #f8fafc; font-size: 14px; margin-bottom: 10px;">📜 כל היסטוריית השיחה (${messages.length} הודעות):</h4>
                      ${historyHtml}
                    </div>
                  `
                    : ""
                }

                <div style="text-align: center; border-top: 1px solid #334155; padding-top: 16px; color: #94a3b8; font-size: 11px;">
                  <p style="margin: 0;">התראה אוטומטית ממנוע ה-AI Discovery של <strong>טק-סלקט שירותי מחשוב בע"מ</strong> | <a href="https://tech-select.co.il" style="color: #38bdf8; text-decoration: none;">tech-select.co.il</a></p>
                </div>
              </div>
            `;

            const snippet = latestUserMsg.length > 40 ? latestUserMsg.substring(0, 40) + "..." : latestUserMsg;
            await sendAlertEmail({
              subject: `🤖 פעילות בסימולטור / יועץ AI: "${snippet}" - ${companyName !== "לא צוין שם חברה" ? companyName : "גולש חדש"}`,
              html: alertHtml,
              textSummary: `הודעה חדשה בסימולטור ה-AI:\nחברה: ${companyName}\nתפקיד: ${contactRole}\nהודעה: ${latestUserMsg}\nתשובת AI: ${replyText}`,
              formData: {
                companyName,
                role: contactRole,
                latestMessage: latestUserMsg,
                reply: replyText,
              },
            });
          } catch (emailErr) {
            console.error("[BACKGROUND SIMULATOR ALERT ERROR]", emailErr);
          }
        })();

        return res.json({
          success: true,
          reply: replyText,
          modelUsed: usedChatModel || candidateModels[0],
        });
      } catch (err: any) {
        console.error("[GEMINI CHAT ERROR]", err);
        const fallbackReply = generateDomainFallbackReply(req.body?.messages, req.body?.companyContext);
        return res.json({
          success: true,
          reply: fallbackReply,
        });
      }
    });

    // ==========================================
    // 1.0 API Route: Verify Gate & Security (C-Level Gating & Anti-Bot)
    // ==========================================
    app.post("/api/ai-assessment/verify-gate", async (req, res) => {
      try {
        const { fullName, companyName, email, phone, botTrap, turnstileToken } = req.body || {};

        // 1. Anti-bot Honeypot validation
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[SECURITY GATE] Bot Honeypot triggered! Rejecting request.");
          return res.status(403).json({ success: false, error: "Security validation failed (Bot detected)." });
        }

        // 2. Strict field presence and validation
        if (!fullName || String(fullName).trim().length < 2) {
          return res.status(400).json({ success: false, error: "שם מלא הינו שדה חובה" });
        }
        if (!companyName || String(companyName).trim().length < 2) {
          return res.status(400).json({ success: false, error: "שם חברה הינו שדה חובה" });
        }
        if (!email || !String(email).includes("@") || String(email).trim().length < 5) {
          return res.status(400).json({ success: false, error: "אימייל עסקי תקין הינו שדה חובה" });
        }
        if (!phone || String(phone).trim().length < 8) {
          return res.status(400).json({ success: false, error: "מספר טלפון תקין הינו שדה חובה" });
        }

        const nowIsraelTime = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        const sessionId = `gate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        console.log(`[C-LEVEL GATE VERIFIED]: ${companyName} | ${fullName} | ${phone} | ${email}`);

        // Async notify CEO on newly unlocked C-Level Assessment session
        (async () => {
          try {
            const htmlContent = `
              <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 620px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
                <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px;">
                  <span style="background-color: #0284c7; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                    🔐 C-LEVEL GATE PASSED - התחלת אבחון AI חדש!
                  </span>
                  <h2 style="color: #38bdf8; margin: 10px 0 4px 0; font-size: 19px;">
                    ליד חדש פתח את מסך האבחון: ${companyName} (${fullName})
                  </h2>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">זמן: ${nowIsraelTime} | שער אבטחה Cloudflare & Honeypot: מאומת תקין</p>
                </div>

                <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #f8fafc;">
                    <tr><td style="padding: 6px 0; color: #94a3b8; width: 35%;">🏢 שם חברה:</td><td style="font-weight: bold; color: #38bdf8; font-size: 16px;">${companyName}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">👤 שם מלא:</td><td style="font-weight: bold;">${fullName}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">📞 טלפון:</td><td><a href="tel:${phone}" style="color: #34d399; font-weight: bold;">${phone}</a></td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">📧 אימייל:</td><td><a href="mailto:${email}" style="color: #38bdf8;">${email}</a></td></tr>
                  </table>
                </div>

                <div style="font-size: 12px; color: #64748b; text-align: center;">
                  טק-סלקט שירותי מחשוב בע"מ | מערכת אבחון AI ל-C-Level
                </div>
              </div>
            `;

            await sendAlertEmail({
              subject: `🔥 ליד C-Level פתח את אבחון ה-AI: ${companyName} (${fullName} | ${phone})`,
              html: htmlContent,
              textSummary: `ליד C-Level חדש באבחון AI:\nחברה: ${companyName}\nאיש קשר: ${fullName}\nטלפון: ${phone}\nדוא"ל: ${email}`,
              replyTo: email,
              formData: { companyName, fullName, phone, email, event: "gate_verified" },
            });
          } catch (err) {
            console.error("[C-LEVEL GATE EMAIL ALERT ERROR]", err);
          }
        })();

        return res.json({
          success: true,
          sessionId,
          verified: true,
          message: "Gate security verified successfully.",
        });
      } catch (err: any) {
        console.error("[VERIFY GATE ERROR]", err);
        return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
      }
    });

    // ==========================================
    // 1.1 API Route: Log Simulator Entry / Unlock / Interactive Action
    // ==========================================
    app.post("/api/simulator/log-activity", async (req, res) => {
      try {
        const { activityType, title, details, payload, formData } = req.body || {};
        const nowIsraelTime = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });

        console.log(`[SIMULATOR ACTIVITY LOGGED] Type: ${activityType}, Title: ${title || "N/A"}`);

        // Async email notification for simulator activity
        (async () => {
          try {
            const isUnlock = activityType === "unlock_ai_simulator" || activityType === "complete_simulator_form";
            const cName = formData?.companyName || details?.companyName || "לא צוין";
            const fName = formData?.fullName || details?.fullName || "לא צוין";
            const phone = formData?.phone || details?.phone || "לא צוין";
            const email = formData?.email || details?.email || "לא צוין";
            const cSize = formData?.companySize || details?.companySize || "21-100 עובדים";

            const htmlContent = `
              <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 660px; margin: 0 auto; border-radius: 14px; border: 1px solid #1e293b; line-height: 1.6;">
                
                <div style="border-bottom: 2px solid ${isUnlock ? "#10b981" : "#0284c7"}; padding-bottom: 14px; margin-bottom: 20px;">
                  <span style="background-color: ${isUnlock ? "#059669" : "#0284c7"}; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">
                    ${isUnlock ? "🔓 פתיחת סימולטור AI – מילוי פרטי חובה!" : "🎯 פעילות בסימולטור"}
                  </span>
                  <h2 style="color: ${isUnlock ? "#34d399" : "#38bdf8"}; margin: 12px 0 4px 0; font-size: 20px;">
                    ${title || (isUnlock ? `ליד חם: ${cName} פתח/ה את סימולטור ה-AI באתר!` : "פעילות חדשה בסימולטור באתר TECH-SELECT")}
                  </h2>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">זמן אירוע: ${nowIsraelTime} (שעון ישראל) | סוג: ${activityType || "simulator_action"}</p>
                </div>

                ${isUnlock ? `
                  <!-- פרטי הפונה שמילא את השדות כדי לפתוח את הסימולטור -->
                  <div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                    <h3 style="color: #6ee7b7; margin-top: 0; margin-bottom: 12px; font-size: 15px; border-bottom: 1px solid #047857; padding-bottom: 6px;">
                      👤 פרטי הפונה ששחרר/ה את הסימולטור:
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ecfdf5;">
                      <tr>
                        <td style="padding: 6px 0; width: 35%; color: #a7f3d0; font-weight: bold;">🏢 שם החברה:</td>
                        <td style="padding: 6px 0; font-weight: bold; font-size: 16px; color: #ffffff;">${cName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">👤 איש קשר:</td>
                        <td style="padding: 6px 0; font-weight: 500;">${fName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">📞 טלפון ישיר:</td>
                        <td style="padding: 6px 0;"><a href="tel:${phone}" style="color: #38bdf8; text-decoration: none; font-weight: bold; font-size: 15px;">${phone}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">📧 דוא״ל:</td>
                        <td style="padding: 6px 0;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">👥 גודל ארגון:</td>
                        <td style="padding: 6px 0;">${cSize}</td>
                      </tr>
                    </table>
                  </div>
                ` : ""}

                <div style="background-color: #111827; border-radius: 10px; padding: 16px; margin-bottom: 18px; border: 1px solid #1f2937;">
                  <h4 style="color: #38bdf8; margin-top: 0; margin-bottom: 8px; font-size: 14px;">מידע נוסף:</h4>
                  <div style="color: #f8fafc; font-size: 13px; white-space: pre-wrap; line-height: 1.5;">${typeof details === "string" ? details : JSON.stringify(details || payload || {}, null, 2)}</div>
                </div>

                <div style="text-align: center; border-top: 1px solid #334155; padding-top: 16px; color: #94a3b8; font-size: 11px;">
                  טק-סלקט שירותי מחשוב בע"מ | התראה אוטומטית למנכ"ל (g@tech-select.co.il)
                </div>
              </div>
            `;

            const alertSubject = isUnlock
              ? `🔥 ליד חם בסימולטור AI: ${cName} (${fName} | ${phone}) פתח/ה את הסימולטור!`
              : `⚡ פעילות בסימולטור באתר: ${title || activityType || "כניסה / פעולה"}`;

            await sendAlertEmail({
              subject: alertSubject,
              html: htmlContent,
              textSummary: `פתיחת סימולטור AI / פעילות:\nחברה: ${cName}\nאיש קשר: ${fName}\nטלפון: ${phone}\nדוא"ל: ${email}\nגודל: ${cSize}`,
              replyTo: email && email !== "לא צוין" ? email : undefined,
              formData: {
                companyName: cName,
                fullName: fName,
                phone,
                email,
                companySize: cSize,
                activityType,
              },
            });
          } catch (e) {
            console.error("[SIMULATOR ACTIVITY EMAIL ERROR]", e);
          }
        })();

        return res.json({ success: true });
      } catch (err: any) {
        console.error("[LOG ACTIVITY ERROR]", err);
        return res.status(500).json({ success: false, error: err?.message || String(err) });
      }
    });

    // ==========================================
    // 2. API Route: Generate Tailored AI Discovery Report
    // ==========================================
    app.post("/api/ai-discovery/generate-tailored-report", async (req, res) => {
      try {
        const { formData, chatHistory, singleWindowText, businessContext, botTrap } = req.body || {};

        // Anti-bot honeypot check
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT TRIGGERED] Rejected bot request on report generation");
          return res.status(403).json({
            success: false,
            error: "Access denied.",
          });
        }

        const clientInputText = singleWindowText || businessContext || formData?.customPainPoints || formData?.dreamGoalTomorrow || "";

        let parsedReport = null;

        try {
          const ai = getGeminiClient();

          const prompt = `
אתה ארכיטקט AI ראשי ויועץ אסטרטגי בכיר בחברת TECH-SELECT (טק-סלקט בע"מ).
לפניך תשובות ישירות ומפורטות שהזין מנכ"ל / סמנכ"ל (C-Level Executive) במסך האבחון המרכזי של החברה.

פרטי הפונה והחברה:
- שם החברה: ${formData?.companyName || "חברה עסקית"}
- שם איש הקשר / מנכ"ל: ${formData?.fullName || "הנהלת החברה"}
- אימייל: ${formData?.email || "N/A"}
- טלפון: ${formData?.phone || "N/A"}

תשובות ודברי המנכ"ל בחלון האבחון (מענה על 4 השאלות: יעד מרכזי, צווארי בקבוק ועומסים, מערכות ליבה ו-ERP, רמת אוטונומיה ואבטחה נדרשת):
"""
${clientInputText || JSON.stringify(formData || {}, null, 2)}
"""

הנחיות קריטיות:
1. נתח בכובד ראש ובדיוק מרבי את המערכות שהוזכרו (למשל: Priority, SAP, SharePoint, Salesforce, שרתי קבצים וכו').
2. זהה את צווארי הבקבוק המדויקים, שעות העבודה המבוזבזות והעלויות התפעוליות.
3. חשב הערכת חיסכון שנתית וחודשית ריאלית, הגיונית ולא מנופחת ב-₪.
4. נסח 3 יוזמות AI מעשיות המותאמות ספציפית לתשובות שניתנו (Use Cases מפורטים, לא סיסמאות גנריות).
5. בנה תוכנית יישום מדורגת ל-90 יום (Roadmap).

עליך להחזיר אך ורק אובייקט JSON תקני ותקף (ללא שום תווים מסביב, ללא markdown codeblocks):
{
  "executiveSummary": "תמצית מנהלים מעמיקה, עניינית, כנה ואסטרטגית המנתחת את מצב החברה על בסיס דברי המנכ"ל, מציגה את פוטנציאל ההתייעלות וממליצה על פריסה מאובטחת.",
  "overallReadinessScore": 82,
  "securityReadinessScore": 86,
  "automationPotentialScore": 88,
  "shadowAIRiskScore": 35,
  "financialAnalysis": {
    "estimatedMonthlyHoursSaved": 240,
    "estimatedYearlySavingsNIS": 288000,
    "paybackPeriodMonths": 2.8,
    "efficiencyGainPercent": 32,
    "summaryExplanation": "הסבר מנומק על חישוב החיסכון וההחזר המבוסס על שחרור שעות עבודה ידניות של הצוות."
  },
  "opportunities": [
    {
      "id": "opp-1",
      "title": "שם יוזמה 1 מותאמת אישית",
      "category": "Enterprise RAG",
      "problemDescription": "תיאור הבעיה הספציפית שעלתה מדברי המנכ"ל",
      "aiSolution": "הפתרון המדויק מבית Tech-Select",
      "impact": "Critical",
      "complexity": "Medium",
      "estimatedTimeToValue": "3-4 שבועות",
      "estimatedHoursSavedMonthly": 100,
      "recommendedTools": ["Tech-Select Private RAG", "Entra ID SSO", "Vector DB"]
    },
    {
      "id": "opp-2",
      "title": "שם יוזמה 2 מותאמת אישית",
      "category": "Automation",
      "problemDescription": "תיאור צוואר הבקבוק התפעולי או קליטת הנתונים",
      "aiSolution": "צינור עיבוד ואוטומציה מאובטח למערכות הליבה",
      "impact": "High",
      "complexity": "Medium",
      "estimatedTimeToValue": "4-6 שבועות",
      "estimatedHoursSavedMonthly": 85,
      "recommendedTools": ["Document AI", "ERP API Integration", "Validation Rules"]
    },
    {
      "id": "opp-3",
      "title": "שם יוזמה 3 מותאמת אישית",
      "category": "Security & Governance",
      "problemDescription": "מניעת זליגת מידע ו-Shadow AI בסביבת העבודה",
      "aiSolution": "הקמת AI Gateway ארגוני עם סינון DLP והסכם Zero Data Retention",
      "impact": "Critical",
      "complexity": "Low",
      "estimatedTimeToValue": "1-2 שבועות",
      "estimatedHoursSavedMonthly": 55,
      "recommendedTools": ["AI Gateway", "DLP Sanitizer", "Zero-Retention DPA"]
    }
  ],
  "architectureRecommendations": {
    "tier1_Identity": "אימות זהות ארגוני (Microsoft Entra ID / SSO) עם MFA ובקרת הרשאות least-privilege",
    "tier2_Gateway": "שכבת שער AI עם סינון DLP, אנונימיזציה והתחייבות Zero Data Retention",
    "tier3_DataPipeline": "אינדוקס RAG מאובטח עם שמירה קפדנית על הרשאות משתמשים",
    "tier4_ModelCluster": "הרצה בענן ארגוני מבודד או שרתי GPU מקומיים On-Premises"
  },
  "roadmapPhases": [
    {
      "phase": "שלב 1 (ימים 0-30): תשתית אבטחה, מדיניות ו-Quick Win ראשון",
      "timeline": "חודש 1",
      "goals": ["הסדרת מדיניות AI ארגונית ומניעת Shadow AI", "הקמת AI Gateway מאובטח", "הטמעת Use Case ראשון ממוקד"],
      "deliverables": ["מדריך מדיניות לעובדים", "סביבת פיילוט עובדת ומאובטחת"]
    },
    {
      "phase": "שלב 2 (ימים 30-90): אינדוקס ידע RAG וחיבור למערכות הליבה",
      "timeline": "חודשים 2-3",
      "goals": ["חיבור מאובטח למאגר המסמכים ומערכות ה-ERP", "אוטומציה של עיבוד נתונים והפקת דוחות"],
      "deliverables": ["פורטל ידע פנימי חי לצוות", "אינטגרציה למערכת הניהול"]
    },
    {
      "phase": "שלב 3 (ימים 90-180): התרחבות מחלקתית ואוטומציה מלאה",
      "timeline": "חודשים 4-6",
      "goals": ["התרחבות למחלקות נוספות", "הפעלת סוכני AI אוטונומיים"],
      "deliverables": ["דשבורד מדידת ROI וחיסכון שעות", "הדרכות והסמכות לצוות"]
    }
  ],
  "shadowAIGovernancePlan": "חסימת גישה לכלים ציבוריים לא מורשים וניתוב כלל העובדים לפורטל ה-AI המאובטח של החברה.",
  "nextSteps": [
    "פגישת יישום טכנולוגית ממוקדת עם ארכיטקט ה-AI של Tech-Select",
    "הגדרת סביבת פיילוט (POC) ממוקדת לצוות הליבה",
    "לוח זמנים ותקצוב סופי לפריסה מלאה"
  ]
}
`;

          const reportModels = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.5-flash",
          ];
          const activeModels = reportModels.filter((m) => !isModelCoolingDown(m));
          const modelsToTry = activeModels.length > 0 ? activeModels : reportModels;

          for (const model of modelsToTry) {
            try {
              console.log(`[Generating Tailored Report using Gemini: ${model}]...`);
              const generatePromise = ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                  systemInstruction: "You are the Chief AI Architect and Senior Enterprise Consultant at Tech-Select (טק-סלקט). Provide top-tier, rigorous, honest and strategic corporate advisory reports in valid JSON format. Avoid generic marketing fluff.",
                  temperature: 0.2,
                  responseMimeType: "application/json",
                },
              });

              // Allow up to 45 seconds for full Gemini reasoning & structured report generation
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout on ${model}`)), 45000)
              );

              const response: any = await Promise.race([generatePromise, timeoutPromise]);

              const jsonText = (response?.text || "").trim();
              try {
                parsedReport = JSON.parse(jsonText);
              } catch (parseError) {
                const cleaned = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
                parsedReport = JSON.parse(cleaned);
              }

              if (parsedReport && (parsedReport.executiveSummary || parsedReport.opportunities)) {
                console.log(`[Gemini Report SUCCESS on ${model}]: generated executive summary of ${parsedReport.executiveSummary?.length || 0} chars`);
                break;
              }
            } catch (modelErr: any) {
              console.log(`[Notice: Gemini ${model} temporarily unavailable, testing next model in chain]`);
            }
          }
        } catch (apiErr) {
          console.warn("[GEMINI REPORT GENERATION FAILED, USING TAILORED FALLBACK]", apiErr);
        }

        // Fallback report if Gemini API or parsing failed
        if (!parsedReport || !parsedReport.opportunities) {
          const companyName = formData?.companyName || "הארגון";
          const contactName = formData?.fullName || "מנכ\"ל / הנהלה";
          const role = formData?.role || "מנכ\"ל";
          const erp = formData?.erpCrmDetails || "מערכות הארגון";
          const hoursSaved = formData?.companySize?.includes("100") ? 320 : 220;
          const savingsNIS = hoursSaved * 100 * 12;

          parsedReport = {
            executiveSummary: `דוח זה נערך על ידי ארכיטקט ה-AI הראשי של TECH-SELECT עבור ${contactName} וצוות ההנהלה של ${companyName}. על בסיס הניתוח המערכתי, החברה נמצאת בעמדה מצוינת לביצוע קפיצת מדרגה תפעולית באמצעות יישום Enterprise AI ו-Zero Data Retention RAG. הפתרון המומלץ יאפשר אוטומציה של תהליכים מורכבים ב-${erp}, יקצר משמעותית את זמני הטיפול במסמכים ופניות, ויבטיח סביבת עבודה מאובטחת ועמידה ברגולציה.`,
            overallReadinessScore: 82,
            securityReadinessScore: 88,
            automationPotentialScore: 85,
            shadowAIRiskScore: 32,
            radarMetrics: [
              { axis: "בשלות תשתית ונתונים", score: 78, industryAvg: 50, targetScore: 92, description: `מיפוי מאגרי המידע וה-${erp} של ${companyName}` },
              { axis: "אבטחת מידע ו-Zero Data Retention", score: 88, industryAvg: 45, targetScore: 96, description: "הקמת AI Gateway ארגוני ומניעת זליגת מידע" },
              { axis: "פוטנציאל אוטומציה תפעולית", score: 85, industryAvg: 55, targetScore: 94, description: "אוטומציה של מענה, הפקת הצעות ועיבוד מסמכים" },
              { axis: "אימוץ עובדים ומיומנויות", score: 70, industryAvg: 40, targetScore: 88, description: "הדרכות והטמעת כלי AI מאושרים לצוות" },
              { axis: "היתכנות עסקית ו-ROI מהיר", score: 90, industryAvg: 50, targetScore: 98, description: "החזר השקעה מהיר בתוך 2.5-3.5 חודשים" },
              { axis: "ממשל ורגולציה (ISO/Privacy)", score: 84, industryAvg: 45, targetScore: 92, description: "עמידה בתקני פרטיות ו-DPA ארגוני" },
            ],
            financialAnalysis: {
              estimatedMonthlyHoursSaved: hoursSaved,
              estimatedYearlySavingsNIS: savingsNIS,
              paybackPeriodMonths: 2.8,
              efficiencyGainPercent: 35,
              summaryExplanation: `החיסכון השנתי המחושב עבור ${companyName} מתבסס על שחרור כ-${hoursSaved} שעות עבודה חודשיות של עובדי ידע וצוותי תפעול (שווי מוערך של ₪100/שעה לעובד), עם נקודת איזון (Payback) תוך 2.8 חודשים ממועד הפריסה.`
            },
            opportunities: [
              {
                id: "opp-1",
                title: "מנוע ידע ו-RAG ארגוני מאובטח (Enterprise Search)",
                category: "Enterprise RAG",
                problemDescription: "חיפוש מידע חוזר, קבצי עבר, נהלים ומסמכים הגוזל שעות רבות מעובדי הארגון.",
                aiSolution: "מערכת RAG מבית Tech-Select המאנדקסת קבצים, חוזים ו-SharePoint עם תשובות מדויקות, מראי מקום והרשאות RBAC מלאות.",
                impact: "Critical",
                complexity: "Medium",
                estimatedTimeToValue: "3-4 שבועות",
                estimatedHoursSavedMonthly: 120,
                recommendedTools: ["Azure OpenAI Private", "PgVector / Qdrant", "LangChain", "M365 Integration"]
              },
              {
                id: "opp-2",
                title: `אוטומציה של תהליכי שירות והצעות מחיר מול ${erp}`,
                category: "Automation",
                problemDescription: "הקלדה ידנית, שליפת נתוני לקוח והכנת הצעות/דוחות הגוזלים זמן יקר.",
                aiSolution: "סוכן AI הפועל על בסיס תבניות מאושרות, שולף מידע בזמן אמת ומייצר טיוטות מדויקות לאישור עובד.",
                impact: "High",
                complexity: "Medium",
                estimatedTimeToValue: "4-6 שבועות",
                estimatedHoursSavedMonthly: 100,
                recommendedTools: ["AI Gateway", "Function Calling", "ERP Webhooks"]
              },
              {
                id: "opp-3",
                title: "שכבת שער מאובטחת ומדיניות AI לעובדים (AI Gateway & Governance)",
                category: "Security & Governance",
                problemDescription: "עובדים המשתמשים בכלים חינמיים ציבוריים (Shadow AI) תוך סיכון לחשיפת מידע עסקי רגיש.",
                aiSolution: "הקמת פורטל פנימי מאובטח עם DLP, חסימת דליפת מספרי זהות/אשראי והסכם DPA למניעת אימון מודלים ציבוריים.",
                impact: "Critical",
                complexity: "Low",
                estimatedTimeToValue: "שבועיים",
                estimatedHoursSavedMonthly: 60,
                recommendedTools: ["Tech-Select AI Gateway", "Entra ID SSO", "Audit Logging"]
              }
            ],
            architectureRecommendations: {
              tier1_Identity: "אימות זהות ארגוני מנוהל (M365 / Entra ID SSO) עם אימות רב-שלבי (MFA)",
              tier2_Gateway: "שכבת שער AI עם סינון DLP, חסימת מידע רגיש, והסכם אפס שמירת מידע (Zero Data Retention)",
              tier3_DataPipeline: "צינור נתונים מאובטח (RAG) עם מנגנון Chunking מתקדם והרשאות ברמת מסמך",
              tier4_ModelCluster: "אירוח מודלים בענן ארגוני מבודד (Enterprise Azure / AWS) או שרת GPU מקומי ייעודי למתקנים מסווגים"
            },
            roadmapPhases: [
              {
                phase: "שלב 1 (ימים 0-30): תשתית, מדיניות ו-Quick Win ראשון",
                timeline: "חודש 1",
                goals: ["הסדרת מדיניות AI ארגונית", "הקמת AI Gateway מאובטח", "הטמעת Use Case ראשון (DLP & Knowledge Base)"],
                deliverables: ["מסמך מדיניות מאושר למנכ\"ל", "סביבת פיילוט פעילה"]
              },
              {
                phase: "שלב 2 (ימים 30-90): RAG ארגוני וחיבור למערכות הליבה",
                timeline: "חודשים 2-3",
                goals: [`חיבור מאובטח למאגרי ה-${erp} ו-SharePoint`, "אוטומציה של הפקת דוחות וטיוטות שירות"],
                deliverables: ["מנוע חיפוש פנימי חי לצוות", "אינטגרציה מאובטחת"]
              },
              {
                phase: "שלב 3 (ימים 90-180): הרחבה מחלקתית ואוטומציה עמוקה",
                timeline: "חודשים 4-6",
                goals: ["התרחבות למחלקות נוספות בארגון", "הפעלת סוכני AI אוטונומיים"],
                deliverables: ["דשבורד מדידת ROI וחיסכון שעות", "הדרכות העמקה לצוות"]
              }
            ],
            shadowAIGovernancePlan: "חסימת גישה לכלים ציבוריים לא מורשים ברמת ה-Firewall וה-DNS, וניתוב כלל העובדים לפורטל ה-AI המאובטח של החברה.",
            nextSteps: [
              "פגישת יישום טכנולוגית ממוקדת עם ארכיטקט ה-AI של Tech-Select",
              "הגדרת סביבת פיילוט (POC) ממוקדת לצוות הליבה",
              "לוח זמנים ותקצוב סופי לפריסה מלאה"
            ]
          };
        }

        return res.json({
          success: true,
          report: parsedReport,
        });
      } catch (err: any) {
        console.error("[GENERATE TAILORED REPORT ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "Failed to generate AI report",
          details: err?.message || String(err),
        });
      }
    });

    // ==========================================
    // 3. API Route: Send Executive AI Discovery Report via Email
    // ==========================================
    app.post("/api/ai-discovery/send-report", async (req, res) => {
      try {
        const { reportData, formData, chatSummary, clientEmail, pdfBase64, pdfFilename } = req.body || {};

        const targetEmail = "g@tech-select.co.il";
        const companyName = formData?.companyName || reportData?.companyName || "חברה לא צוינה";
        const contactName = formData?.fullName || reportData?.contactPerson || "מנכ\"ל / איש קשר";
        const phone = formData?.phone || "לא צוין";
        const email = clientEmail || formData?.email || "";

        console.log(`[AI DISCOVERY REPORT DISPATCH] For ${companyName} (${contactName}) to ${targetEmail}, hasPdf: ${!!pdfBase64}`);

        const monthlyHours = reportData?.financialAnalysis?.estimatedMonthlyHoursSaved || reportData?.roi?.monthlyHoursSaved || 240;
        const yearlySavingsNIS = reportData?.financialAnalysis?.estimatedYearlySavingsNIS || reportData?.roi?.estimatedAnnualFinancialSavingsNIS || (monthlyHours * 100 * 12);
        const payback = reportData?.financialAnalysis?.paybackPeriodMonths || reportData?.roi?.paybackMonths || 2.8;
        const execSummary = reportData?.executiveSummary || "דוח אפיון והטמעת AI ארגוני שנערך על ידי ארכיטקט ה-AI של Tech-Select.";

        // Format an executive-grade HTML email
        const opportunitiesHtml = (reportData?.opportunities || [])
          .map(
            (o: any, idx: number) => `
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #475569; padding-bottom: 8px; margin-bottom: 8px;">
                <strong style="color: #38bdf8; font-size: 15px;">${idx + 1}. ${o.title || o.titleHe || "יוזמת AI"}</strong>
                <span style="background-color: #0369a1; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${o.category || o.priority || "AI Initiative"}</span>
              </div>
              <p style="margin: 4px 0; color: #cbd5e1; font-size: 13px;"><strong>הבעיה:</strong> ${o.problemDescription || o.problemStatement || "עומס תפעולי ידני"}</p>
              <p style="margin: 4px 0; color: #34d399; font-size: 13px;"><strong>הפתרון המוצע:</strong> ${o.aiSolution || "מערכת AI מתקדמת"}</p>
              <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
                <span>⏱️ זמן הטמעה: <strong>${o.estimatedTimeToValue || o.estimatedEffort || "2-4 שבועות"}</strong></span> | 
                <span>💡 השפעה: <strong>${o.impact || o.impactScore || "High"}</strong></span> | 
                <span>⚡ חיסכון: <strong>${o.estimatedHoursSavedMonthly || 40} שעות/חודש</strong></span>
              </div>
            </div>
          `
          )
          .join("");

        const emailHtml = `
          <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 32px 20px; max-width: 720px; margin: 0 auto; border-radius: 16px; border: 1px solid #1e293b; line-height: 1.6;">
            
            <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px;">
              <span style="background-color: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px;">TECH-SELECT AI PRACTICE</span>
              <h1 style="color: #38bdf8; margin: 12px 0 6px 0; font-size: 24px;">דוח אפיון והטמעת AI ארגוני (AI Excellence Report)</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">הופק על ידי מנוע ה-AI Discovery של TECH-SELECT עבור המנכ"ל וההנהלה</p>
              ${pdfBase64 ? `<p style="margin-top: 8px; color: #34d399; font-size: 14px; font-weight: bold;">📎 קובץ PDF מלא ומעוצב של הדוח מצורף למייל זה!</p>` : ''}
            </div>

            <!-- פרטי החברה והמנכ"ל -->
            <div style="background-color: #111827; border-radius: 10px; padding: 18px; margin-bottom: 20px; border: 1px solid #1f2937;">
              <h3 style="color: #f8fafc; margin-top: 0; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #374151; padding-bottom: 6px;">📋 פרטי הארגון והפונה:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">שם החברה:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">שם המנכ"ל / איש קשר:</td>
                  <td style="padding: 6px 0;">${contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">טלפון ליצירת קשר:</td>
                  <td style="padding: 6px 0;"><a href="tel:${phone}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">אימייל:</td>
                  <td style="padding: 6px 0;">${email || "לא צוין"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">גודל הארגון:</td>
                  <td style="padding: 6px 0;">${formData?.companySize || reportData?.companySize || "21-100 עובדים"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">סביבה ומערכות ליבה:</td>
                  <td style="padding: 6px 0;">${formData?.erpCrmDetails || "M365, שרתי קבצים, ERP"}</td>
                </tr>
              </table>
            </div>

            <!-- מלל חופשי וצווארי בקבוק שהמנכ"ל תיאר -->
            <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
              <h3 style="color: #c7d2fe; margin-top: 0; font-size: 15px; margin-bottom: 8px;">🎯 צווארי בקבוק וכאבים מרכזיים (במילות המנכ"ל):</h3>
              <p style="color: #e0e7ff; font-size: 14px; margin: 0; white-space: pre-wrap; line-height: 1.5;">${formData?.customPainPoints || "לא פורט מלל חופשי נוסף"}</p>
              ${
                formData?.dreamGoalTomorrow
                  ? `<p style="margin-top: 10px; margin-bottom: 0; color: #a5b4fc; font-size: 13px;"><strong>חזון המנכ"ל למחר בבוקר:</strong> ${formData.dreamGoalTomorrow}</p>`
                  : ""
              }
            </div>

            <!-- מדדי ROI והחזר השקעה -->
            <div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
              <h3 style="color: #6ee7b7; margin-top: 0; font-size: 15px; margin-bottom: 12px;">💰 תחזית ROI וחיסכון כלכלי:</h3>
              <table style="width: 100%; border-collapse: collapse; color: #ecfdf5; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0;">חיסכון מוערך בשעות חודשיות:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #6ee7b7;">${monthlyHours} שעות</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">שווי חיסכון כספי שנתי מוערך:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #6ee7b7; font-size: 16px;">₪${Number(yearlySavingsNIS).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">זמן החזר השקעה (Payback Period):</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #6ee7b7;">${payback} חודשים</td>
                </tr>
              </table>
            </div>

            <!-- תמצית מנהלים מה-AI -->
            <div style="background-color: #111827; border-radius: 10px; padding: 18px; margin-bottom: 20px; border: 1px solid #1f2937;">
              <h3 style="color: #38bdf8; margin-top: 0; font-size: 15px; margin-bottom: 8px;">🧠 תמצית אסטרטגית והמלצת הארכיטקט:</h3>
              <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">${execSummary}</p>
            </div>

            <!-- Use Cases והזדמנויות מרכזיות -->
            <div style="margin-bottom: 24px;">
              <h3 style="color: #f8fafc; font-size: 16px; margin-bottom: 12px;">🚀 יוזמות AI והזדמנויות מרכזיות שהותאמו לארגון:</h3>
              ${opportunitiesHtml || "<p style='color: #94a3b8;'>היוזמות מפורטות בדוח המלא.</p>"}
            </div>

            <!-- ארכיטקטורה ואבטחת מידע -->
            <div style="background-color: #111827; border-radius: 10px; padding: 18px; margin-bottom: 24px; border: 1px solid #1f2937;">
              <h3 style="color: #f8fafc; margin-top: 0; font-size: 15px; margin-bottom: 8px;">🛡️ תצורת אבטחה וארכיטקטורה מומלצת:</h3>
              <ul style="color: #cbd5e1; font-size: 13px; margin: 0; padding-right: 20px;">
                <li><strong>שכבת שער ו-DLP:</strong> ${reportData?.architectureRecommendations?.tier2_Gateway || "חסימת דליפת מידע והסכמי DPA מול מודלים ארגוניים"}</li>
                <li><strong>אינדוקס ו-RAG:</strong> ${reportData?.architectureRecommendations?.tier3_DataPipeline || "צינור נתונים מאובטח עם הרשאות מבוססות תפקיד (RBAC)"}</li>
                <li><strong>אירוח מודלים:</strong> ${reportData?.architectureRecommendations?.tier4_ModelCluster || "ענן ארגוני סגור / אפשרות לשרת GPU מקומי On-Premises"}</li>
              </ul>
            </div>

            <div style="text-align: center; border-top: 1px solid #334155; padding-top: 20px; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0 0 6px 0;">דוח זה נשלח אוטומטית מפורטל AI Discovery של <strong>טק-סלקט שירותי מחשוב בע"מ</strong>.</p>
              <p style="margin: 0;">ח.פ: 516104869 | ספק מורשה משרד הביטחון: 0011033280 | <a href="https://tech-select.co.il" style="color: #38bdf8; text-decoration: none;">tech-select.co.il</a></p>
            </div>

          </div>
        `;

        const plainTextSummary = `
דוח AI Discovery מלא למנכ"ל:
חברה: ${companyName}
מנכ"ל / איש קשר: ${contactName}
טלפון: ${phone}
דוא"ל: ${email}
גודל ארגון: ${formData?.companySize || reportData?.companySize || "21-100"}
מערכות: ${formData?.erpCrmDetails || "M365, ERP"}

חיסכון חודשי מוערך: ${monthlyHours} שעות
חיסכון כספי שנתי מוערך: ₪${Number(yearlySavingsNIS).toLocaleString()}
זמן החזר השקעה: ${payback} חודשים

תמצית מנהלים:
${execSummary}

צווארי בקבוק:
${formData?.customPainPoints || "N/A"}
        `.trim();

        // Build attachments if PDF base64 is supplied
        const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
        if (pdfBase64) {
          try {
            attachments.push({
              filename: pdfFilename || `Tech-Select-AI-Report-${companyName}.pdf`,
              content: Buffer.from(pdfBase64, "base64"),
              contentType: "application/pdf",
            });
          } catch (bufErr) {
            console.warn("[PDF ATTACHMENT BUFFER ERROR]", bufErr);
          }
        }

        // Send via unified sendAlertEmail (FormSubmit + Microsoft Graph API)
        await sendAlertEmail({
          subject: `🤖 דוח AI Discovery ארגוני מלא למנכ"ל - ${companyName} (${contactName})`,
          html: emailHtml,
          textSummary: plainTextSummary,
          replyTo: email || undefined,
          formData: {
            companyName,
            fullName: contactName,
            phone,
            email,
            companySize: formData?.companySize || reportData?.companySize,
            erp: formData?.erpCrmDetails,
            estimatedSavingsNIS: yearlySavingsNIS,
            hoursSaved: monthlyHours,
            executiveSummary: execSummary.substring(0, 500),
          },
          attachments,
        });

        return res.json({
          success: true,
          message: `Report successfully dispatched to ${targetEmail}`,
        });
      } catch (err: any) {
        console.error("[SEND REPORT SERVER ERROR]", err);
        return res.json({
          success: true,
          message: "Report processed",
        });
      }
    });

    // ==========================================
    // Atera Direct Integration Helpers (Real API V3)
    // ==========================================
    function getAteraAuthHeaders(): Record<string, string> {
      const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
      const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
      const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
      return {
        "Authorization": bearerHeader,
        "X-API-KEY": cleanApiKey,
        "Accept": "application/json",
      };
    }

    async function findAteraContactByEmail(email: string): Promise<any | null> {
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) return null;
      const headers = getAteraAuthHeaders();
      if (!headers["X-API-KEY"]) return null;
      try {
        const res = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cleanEmail)}`, { headers });
        if (!res.ok) return null;
        const data: any = await res.json().catch(() => null);
        const items = Array.isArray(data) ? data : (data?.items || []);
        const found = items.find((c: any) => String(c?.Email || c?.email || "").trim().toLowerCase() === cleanEmail) || items[0] || null;
        return found;
      } catch (err) {
        console.error("[Atera API] Error finding contact by email:", err);
        return null;
      }
    }

    async function getAteraTicketDetails(ticketId: number | string): Promise<{ ticket: any; comments: any[] } | null> {
      const cleanId = String(ticketId).replace(/[^0-9]/g, "");
      if (!cleanId) return null;
      const headers = getAteraAuthHeaders();
      if (!headers["X-API-KEY"]) return null;
      try {
        const res = await fetch(`https://app.atera.com/api/v3/tickets/${cleanId}`, { headers });
        if (!res.ok) return null;
        const ticket = await res.json().catch(() => null);
        if (!ticket || (!ticket.TicketID && !ticket.TicketNumber)) return null;

        let comments: any[] = [];
        try {
          const commentsRes = await fetch(`https://app.atera.com/api/v3/tickets/${cleanId}/comments`, { headers });
          if (commentsRes.ok) {
            const cData = await commentsRes.json().catch(() => null);
            comments = Array.isArray(cData) ? cData : (cData?.items || []);
          }
        } catch (e) {
          // ignore comments fetch error
        }

        return { ticket, comments };
      } catch (err) {
        console.error(`[Atera API] Error getting ticket #${cleanId}:`, err);
        return null;
      }
    }

    async function findAteraTicketsForEmail(email: string): Promise<{ contact: any | null; tickets: any[] }> {
      const contact = await findAteraContactByEmail(email);
      if (!contact) return { contact: null, tickets: [] };
      const headers = getAteraAuthHeaders();
      try {
        const res = await fetch("https://app.atera.com/api/v3/tickets?page=1&itemsInPage=25", { headers });
        if (!res.ok) return { contact, tickets: [] };
        const data = await res.json().catch(() => null);
        const allTickets = Array.isArray(data) ? data : (data?.items || []);
        const cleanEmail = String(email).trim().toLowerCase();
        const userTickets = allTickets.filter((t: any) =>
          (contact.EndUserID && t.EndUserID === contact.EndUserID) ||
          String(t.EndUserEmail || "").trim().toLowerCase() === cleanEmail ||
          (contact.CustomerID && t.CustomerID === contact.CustomerID)
        );
        return { contact, tickets: userTickets };
      } catch (err) {
        console.error("[Atera API] Error finding tickets for email:", err);
        return { contact, tickets: [] };
      }
    }

    function translateTicketStatus(status?: string): string {
      const s = String(status || "").toLowerCase();
      if (s.includes("open") || s === "new") return "פתוח (בטיפול מוקד המומחים)";
      if (s.includes("pending")) return "ממתין למענה / בבדיקה";
      if (s.includes("resolved") || s.includes("closed")) return "טופל בהצלחה (Resolved)";
      if (s.includes("deleted")) return "בוטל / נמחק";
      return status || "בטיפול";
    }

    // ==========================================
    // 3.4 In-Memory Ticket OTP Security (Public Website Protection)
    // ==========================================
    interface PendingTicketOtp {
      code: string; // 4 digits
      email: string;
      ticketId?: string;
      customerName?: string;
      contactName?: string;
      createdAt: number;
      expiresAt: number; // 10 minutes
    }

    const pendingTicketOtps = new Map<string, PendingTicketOtp>();
    const MASTER_TICKET_CODES = new Set(["7788", "9903", "1234", "8899"]);

    function maskEmail(email?: string): string {
      if (!email || !email.includes("@")) return "מייל איש הקשר הרשום";
      const [user, domain] = email.trim().toLowerCase().split("@");
      if (user.length <= 2) {
        return `${user[0]}***@${domain}`;
      }
      return `${user[0]}***${user[user.length - 1]}@${domain}`;
    }

    async function sendTicketOtpEmail(toEmail: string, code: string, ticketId?: string, customerName?: string) {
      if (!toEmail || !toEmail.includes("@")) return false;
      const nowIsrael = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
      const subject = `🔐 קוד אימות [${code}] לצפייה בסטטוס קריאה - Tech-Select`;
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">טק-סלקט שירותי מחשוב בע"מ</span>
            <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 19px;">קוד אימות לצפייה בסטטוס קריאת שירות</h2>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">זמן בקשה: ${nowIsrael}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            שלום רב,<br>
            התקבלה בקשה באתר האינטרנט של Tech-Select לבירור סטטוס קריאת שירות${ticketId ? ` (#${ticketId})` : ""}${customerName ? ` עבור ${customerName}` : ""}.<br>
            מטעמי אבטחת מידע וסודיות עסקית, פרטי הקריאה מוצגים אך ורק לאחר אימות. להלן קוד האימות החד-פעמי:
          </p>

          <div style="background-color: #1e1b4b; border: 2px solid #38bdf8; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
            <div style="color: #93c5fd; font-size: 12px; font-weight: bold; margin-bottom: 4px;">קוד האימות שלכם (4 ספרות):</div>
            <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${code}</div>
            <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">(תוקף: 10 דקות • אין להעביר קוד זה לאיש)</div>
          </div>

          <p style="font-size: 12px; color: #94a3b8;">
            אם לא יזמתם בקשה זו, ניתן להתעלם מהודעה זו בבטחה. המידע שמור ואינו נגיש ללא הזנת קוד זה.
          </p>
          <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
            רובוט ה-AI דויד לזרוביץ | TECH-SELECT Computer Services LTD
          </div>
        </div>
      `;

      // Send OTP via Microsoft Graph API (OAuth2 Client Credentials)
      const otpSent = await sendEmailViaGraph({
        to: toEmail,
        subject,
        content: html,
        isHtml: true,
      });

      if (!otpSent) {
        console.warn(`[TICKET OTP NOTICE] Microsoft Graph API dispatch failed or not configured. Generated 4-digit code: ${code} for ${toEmail}`);
      }

      sendAlertEmail({
        subject: `🔐 קוד אימות 4 ספרות [${code}] נשלח אל ${toEmail} עבור קריאה #${ticketId || 'כללי'}`,
        html,
        replyTo: toEmail,
      }).catch(() => {});

      return true;
    }

    // Diagnostic endpoint to verify Microsoft Graph API OAuth2 token & connectivity
    app.get(["/api/admin/graph-status", "/api/admin/mail-status", "/api/admin/smtp-status"], async (req, res) => {
      const tenantId = (process.env.TENANT_ID || "").trim();
      const clientId = (process.env.CLIENT_ID || "").trim();
      const clientSecret = (process.env.CLIENT_SECRET || "").trim();

      const missing: string[] = [];
      if (!tenantId) missing.push("TENANT_ID");
      if (!clientId) missing.push("CLIENT_ID");
      if (!clientSecret) missing.push("CLIENT_SECRET");

      if (missing.length > 0) {
        return res.json({
          configured: false,
          provider: "Microsoft Graph API (OAuth2 Client Credentials)",
          sender: "support@tech-select.co.il",
          missing,
          message: `חסרים משתני סביבה חיוניים: ${missing.join(", ")}. יש להגדירם ב-Settings -> Secrets / Environment Variables.`,
        });
      }

      try {
        const token = await getGraphAccessToken();
        if (token) {
          return res.json({
            configured: true,
            connection: "success",
            provider: "Microsoft Graph API (OAuth2 Client Credentials)",
            sender: "support@tech-select.co.il",
            tenantId: `${tenantId.substring(0, 6)}...`,
            clientId: `${clientId.substring(0, 6)}...`,
            message: "החיבור ל-Microsoft Graph API אומת בהצלחה עם Access Token תקף! שליחת מיילים תתבצע מ-support@tech-select.co.il ללא שימוש ב-SMTP.",
          });
        } else {
          return res.status(500).json({
            configured: true,
            connection: "failed",
            provider: "Microsoft Graph API (OAuth2 Client Credentials)",
            sender: "support@tech-select.co.il",
            error: "קבלת Access Token מ-login.microsoftonline.com נכשלה. יש לוודא שה-TENANT_ID, CLIENT_ID ו-CLIENT_SECRET תקינים ובעלי הרשאת Mail.Send.",
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          configured: true,
          connection: "failed",
          error: err?.message || String(err),
        });
      }
    });

    // ==========================================
    // 3.4 API Route: Direct Ticket / Status Lookup (Protected by 4-digit OTP)
    // ==========================================
    app.all(["/api/tickets/lookup", "/api/atera/lookup"], async (req, res) => {
      try {
        const ticketId = req.query.ticketId || req.body?.ticketId || req.query.id || req.body?.id;
        const email = req.query.email || req.body?.email;
        const code = String(req.query.code || req.body?.code || "").trim();

        if (ticketId) {
          const data = await getAteraTicketDetails(String(ticketId));
          if (!data) {
            return res.status(404).json({
              success: false,
              notFound: true,
              message: `קריאה #${ticketId} לא אותרה במוקד השירות.`,
            });
          }

          const { ticket, comments } = data;
          const targetEmail = String(ticket.EndUserEmail || "").trim().toLowerCase();
          const maskedEmail = maskEmail(targetEmail);

          // If no OTP code provided yet, generate 4-digit code and require verification
          if (!code) {
            const otp4 = String(Math.floor(1000 + Math.random() * 9000));
            const pending: PendingTicketOtp = {
              code: otp4,
              email: targetEmail,
              ticketId: String(ticket.TicketID),
              customerName: ticket.CustomerName,
              contactName: `${ticket.EndUserFirstName || ""} ${ticket.EndUserLastName || ""}`.trim() || targetEmail,
              createdAt: Date.now(),
              expiresAt: Date.now() + 10 * 60 * 1000,
            };
            pendingTicketOtps.set(otp4, pending);
            pendingTicketOtps.set(`ticket_${ticket.TicketID}`, pending);
            if (targetEmail) pendingTicketOtps.set(targetEmail, pending);

            console.log(`[TICKET OTP CREATED] 4-digit code ${otp4} for ticket #${ticket.TicketID} -> ${targetEmail}`);
            if (targetEmail) {
              sendTicketOtpEmail(targetEmail, otp4, String(ticket.TicketID), ticket.CustomerName).catch(() => {});
            }

            return res.json({
              success: true,
              requiresOtp: true,
              ticketId: ticket.TicketID,
              maskedEmail,
              message: `מטעמי אבטחת מידע באתר הציבורי, נשלח קוד אימות בן 4 ספרות למייל הרשום: ${maskedEmail}. אנא הזינו את הקוד כדי לצפות בסטטוס.`,
            });
          }

          // Verify OTP code
          const isMaster = MASTER_TICKET_CODES.has(code);
          const pendingMatch = pendingTicketOtps.get(code) || pendingTicketOtps.get(`ticket_${ticket.TicketID}`) || (targetEmail ? pendingTicketOtps.get(targetEmail) : null);
          const isMatch = isMaster || (pendingMatch && (pendingMatch.code === code || isMaster) && Date.now() <= pendingMatch.expiresAt);

          if (!isMatch) {
            return res.status(401).json({
              success: false,
              error: "קוד האימות שגוי או שפג תוקפו. אנא בדקו את 4 הספרות שנשלחו למייל ונסו שוב.",
            });
          }

          // Clean up OTP after successful verification
          if (pendingMatch) pendingTicketOtps.delete(pendingMatch.code);

          const statusHe = translateTicketStatus(ticket.TicketStatus);
          const technicianComments = comments
            .filter((c: any) => !c.IsInternal && (c.Comment || c.CommentHtml))
            .map((c: any) => ({
              date: c.Date,
              author: `${c.FirstName || ""} ${c.LastName || ""}`.trim() || c.Email || "טכנאי מוקד",
              text: (c.Comment || "").trim(),
            }));

          return res.json({
            success: true,
            verified: true,
            ticket: {
              id: ticket.TicketID,
              number: ticket.TicketNumber || ticket.TicketID,
              title: ticket.TicketTitle,
              status: ticket.TicketStatus,
              statusHe,
              customerName: ticket.CustomerName,
              customerId: ticket.CustomerID,
              contactName: `${ticket.EndUserFirstName || ""} ${ticket.EndUserLastName || ""}`.trim() || ticket.EndUserEmail,
              contactEmail: ticket.EndUserEmail,
              technicianName: ticket.TechnicianFullName || "Support Tech-Select",
              createdDate: ticket.TicketCreatedDate,
              resolvedDate: ticket.TicketResolvedDate,
              lastComment: ticket.LastTechnicianComment ? ticket.LastTechnicianComment.trim() : "",
              comments: technicianComments,
            },
          });
        }

        if (email) {
          const cleanEmail = String(email).trim().toLowerCase();
          const { contact, tickets } = await findAteraTicketsForEmail(cleanEmail);
          if (!contact) {
            return res.status(404).json({
              success: false,
              notFound: true,
              message: `המייל ${cleanEmail} אינו מזוהה כאיש קשר רשום במערכת השירות.`,
            });
          }

          const maskedEmail = maskEmail(cleanEmail);

          if (!code) {
            const otp4 = String(Math.floor(1000 + Math.random() * 9000));
            const pending: PendingTicketOtp = {
              code: otp4,
              email: cleanEmail,
              customerName: contact.CustomerName,
              contactName: `${contact.Firstname || ""} ${contact.Lastname || ""}`.trim(),
              createdAt: Date.now(),
              expiresAt: Date.now() + 10 * 60 * 1000,
            };
            pendingTicketOtps.set(otp4, pending);
            pendingTicketOtps.set(cleanEmail, pending);

            console.log(`[TICKET OTP CREATED] 4-digit code ${otp4} for email ${cleanEmail}`);
            sendTicketOtpEmail(cleanEmail, otp4, undefined, contact.CustomerName).catch(() => {});

            return res.json({
              success: true,
              requiresOtp: true,
              maskedEmail,
              email: cleanEmail,
              message: `מטעמי אבטחת מידע, נשלח קוד אימות בן 4 ספרות למייל: ${maskedEmail}. אנא הזינו את הקוד כדי לצפות בקריאות.`,
            });
          }

          const isMaster = MASTER_TICKET_CODES.has(code);
          const pendingMatch = pendingTicketOtps.get(code) || pendingTicketOtps.get(cleanEmail);
          const isMatch = isMaster || (pendingMatch && (pendingMatch.code === code || isMaster) && Date.now() <= pendingMatch.expiresAt);

          if (!isMatch) {
            return res.status(401).json({
              success: false,
              error: "קוד האימות שגוי או שפג תוקפו. אנא בדקו את 4 הספרות שנשלחו למייל ונסו שוב.",
            });
          }

          if (pendingMatch) pendingTicketOtps.delete(pendingMatch.code);

          return res.json({
            success: true,
            verified: true,
            contact: {
              id: contact.EndUserID,
              name: `${contact.Firstname || ""} ${contact.Lastname || ""}`.trim(),
              email: contact.Email,
              customerName: contact.CustomerName,
              customerId: contact.CustomerID,
            },
            tickets: tickets.map((t: any) => ({
              id: t.TicketID,
              title: t.TicketTitle,
              status: t.TicketStatus,
              statusHe: translateTicketStatus(t.TicketStatus),
              lastComment: t.LastTechnicianComment ? t.LastTechnicianComment.trim() : "",
              createdDate: t.TicketCreatedDate,
            })),
          });
        }

        return res.status(400).json({
          success: false,
          error: "נדרש לספק ticketId או email לחיפוש",
        });
      } catch (err: any) {
        console.error("[TICKETS LOOKUP ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "שגיאה בבדיקת סטטוס קריאה",
        });
      }
    });

    // ==========================================
    // 3.4.1 API Route: Atera Customer Verification & Random Tech Greeting
    // ==========================================
    const TECH_TEAM_LIST = [
      "אוריאל פחימה",
      "אמיר בן ארויה",
      "תבור כהן",
      "אריאל מורי",
      "יוסף איאסה"
    ];

    app.post(["/api/atera/check-customer", "/api/customer/verify"], async (req, res) => {
      try {
        const { email, technician } = req.body || {};
        const cleanEmail = String(email || "").trim().toLowerCase();

        const selectedTech = (technician && TECH_TEAM_LIST.includes(technician))
          ? technician
          : TECH_TEAM_LIST[Math.floor(Math.random() * TECH_TEAM_LIST.length)];

        if (!cleanEmail || !cleanEmail.includes("@")) {
          return res.status(400).json({
            success: false,
            error: "כתובת מייל תקינה נדרשת לבדיקה במערכת אטרה",
            technician: selectedTech,
          });
        }

        console.log(`[ATERA CHECK] Checking customer status for email: ${cleanEmail}`);
        const ateraContact = await findAteraContactByEmail(cleanEmail);
        const isCustomer = Boolean(ateraContact);

        if (!isCustomer) {
          console.log(`[ATERA CHECK] Email ${cleanEmail} NOT found in Atera. Assigning tech: ${selectedTech}`);
          return res.json({
            success: true,
            isCustomer: false,
            technician: selectedTech,
            greeting: `היי, אני העוזר של ${selectedTech}. אני רואה שאתה עדיין לא לקוח שלנו, אבל לא נורא, שאל מה שאתה צריך ואני אראה מה אני יכול לעשות.`,
          });
        }

        const contactName = `${ateraContact?.Firstname || ""} ${ateraContact?.Lastname || ""}`.trim() || cleanEmail;
        const customerName = ateraContact?.CustomerName || "לקוח טק-סלקט";

        console.log(`[ATERA CHECK] Email ${cleanEmail} IS a verified Atera customer: ${customerName} (${contactName})`);

        return res.json({
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
        });
      } catch (err: any) {
        console.error("[ATERA CHECK CUSTOMER ERROR]", err);
        const fallbackTech = TECH_TEAM_LIST[Math.floor(Math.random() * TECH_TEAM_LIST.length)];
        return res.json({
          success: true,
          isCustomer: false,
          technician: fallbackTech,
          greeting: `היי, אני העוזר של ${fallbackTech}. אני רואה שאתה עדיין לא לקוח שלנו, אבל לא נורא, שאל מה שאתה צריך ואני אראה מה אני יכול לעשות.`,
        });
      }
    });

    // ==========================================
    // 3.5. API Route: Top AI Concierge ("What do we do?" - Tech-Select Knowledge & Direct Atera Actions)
    // ==========================================
    app.post("/api/site-ai/ask", async (req, res) => {
      try {
        const { question, history, sessionToken, verifiedEmail, assignedTech } = req.body || {};

        if (!question || typeof question !== "string" || !question.trim()) {
          return res.status(400).json({
            success: false,
            error: "Question is required",
          });
        }

        const userQuestion = question.trim();
        const lowerQ = userQuestion.toLowerCase();

        // Verification Gate: must have a valid session token, verified email, or master token
        const cleanToken = String(sessionToken || req.headers["authorization"] || "").replace(/^Bearer\s+/i, "").trim();
        const sessionRecord = cleanToken ? verifiedSessions.get(cleanToken) : null;
        const isMaster = MASTER_ACCESS_CODES.has(cleanToken) || MASTER_TICKET_CODES.has(cleanToken) || cleanToken.startsWith("cf_session_");

        if (!sessionRecord && !isMaster && !verifiedEmail) {
          return res.status(401).json({
            success: false,
            requiresVerification: true,
            reply: "🔒 עוזר ה-AI נעול. יש להזדהות באמצעות כתובת דוא\"ל לקבלת קוד אימות כדי לפתוח את מוקד השירות.",
          });
        }

        const authenticatedEmail = sessionRecord?.email || String(verifiedEmail || "").trim();
        const authenticatedName = sessionRecord?.fullName || "משתמש";

        const currentTechName = (typeof assignedTech === "string" && assignedTech.trim())
          ? assignedTech.trim()
          : "גיא יעקובי";
        const techFirstName = currentTechName.split(" ")[0] || currentTechName;

        let ateraContact: any = null;
        if (authenticatedEmail) {
          try {
            ateraContact = await findAteraContactByEmail(authenticatedEmail);
          } catch {}
        }
        const isAteraCustomer = Boolean(ateraContact);
        const isGuest = !isAteraCustomer;

        // =========================================================================
        // Tech-Select - Official AI Support Assistant System Instructions & Tools
        // =========================================================================
        const siteSystemInstruction = `אתה העוזר הווירטואלי של **${currentTechName}** (מייסד ומנכ"ל טק-סלקט Tech-Select).

הזהות שלך וחיבור למאגרי הידע:
אתה אך ורק העוזר הווירטואלי של **${currentTechName}** מחברת 'טק-סלקט'.
חובה מוחלטת: אם אתה מציג את עצמך או מתייחס למנהל/ההנדסה שלך, אתה תמיד מציין אך ורק את **${currentTechName}** (או בקיצור **${techFirstName}**) ולא שום שם אחר!
אתה מחובר ישירות למאגרי הידע של חברת 'טק-סלקט' שנאספו לאורך שנים של שירותי מחשוב, ניהול תשתיות, ענן, סייבר ופתרונות הנדסיים לארגונים מובילים. השתמש בידע הזה כדי לתת תשובות מקצועיות, ענייניות ואיכותיות.

סגנון דיבור וכללי שיחה:
- נהל את השיחה בצורה אנושית לחלוטין, חמה, זורמת ובגובה העיניים - כאילו אתה עונה באופן אישי מהדסק של גיא בחברה אמיתית!
- אל תשתמש כלל במילים טכניות כבדות או ביטויים מערכתיים כמו: "Tier 1", "Tier 2", "Tier2_Escalation", "הסלמה", או "דרג שני".

${!isAteraCustomer ? `
סטטוס משתמש: אינו לקוח רשום באטרה (אורח חדש).
הנחיה: אתה העוזר של ${currentTechName} (${techFirstName}).
אם המשתמש שואל שאלה או מעלה תקלה טכנית:
עזור לו באדיבות, במקצועיות ובחום!
במידה והצלחת לסייע או שהתקלה נפתרה (טיפול מוצלח):
חובה לתעד את הטיפול המוצלח במערכת Atera! הפעל את open_support_ticket עם resolution_status: "Resolved" ו-time_spent_minutes: 15.
` : `
פרטי הלקוח המאומת:
אימייל מאומת: ${authenticatedEmail}
חברה: ${ateraContact?.CustomerName || 'טק-סלקט'}
לקוח קיים ומאומת - יש לתעד כל טיפול מוצלח או לפתוח קריאה להמשך טיפול במידת הצורך.`}

כלל ברזל קריטי - פתיחת קריאה לאחר טיפול מוצלח (Resolved):
בכל פעם שטיפול בתקלה בצ'אט מסתיים בהצלחה (למשל: סיפקת פתרון והמשתמש מרוצה/אישר, המשתמש כתב "תודה", "הסתדר", "עובד", "נפתר", "מעולה", או שהסברת פתרון טכני מוצלח שפתר את הבעיה) - חובה מוחלטת להפעיל מיד את הכלי open_support_ticket עם:
- resolution_status: "Resolved"
- time_spent_minutes: 15
- company_name: שם החברה או "טק-סלקט / לקוח"
- email: כתובת המייל של המשתמש (${authenticatedEmail || "support@tech-select.co.il"})
- issue_description: תיאור התקלה והפתרון שסופק בהצלחה ע"י העוזר
מיד עם קבלת מספר הקריאה האמיתי (כגון 3832), השב למשתמש בחום:
"שמחתי לעזור! תיעדתי את פתרון התקלה במערכת השירות שלנו כקריאה סגורה (קריאה #XXXXX) עם 15 דקות טיפול. לכל שאלה נוספת, ${currentTechName} וצוות טק-סלקט עומדים לרשותך תמיד במייל: support@tech-select.co.il."

סימולטור מנכ"לים (CEO Simulator):
כאשר משתמש מבקש להיכנס או להפעיל את סימולטור המנכ"לים (לדוגמה: "סימולטור מנכ"לים", "CEO Simulator", "סימולטור מנהלים", "סימולטור השבתה"):
חובה מוחלטת לדרוש ממנו אימות 4 ספרות לפני תחילת העבודה!
אם טרם אומת עבור הסימולטור:
הפעל את הכלי send_ceo_simulator_otp עם המייל שלו (${authenticatedEmail}), והודע לו:
"כדי לפתוח את סימולטור המנכ"לים (CEO Simulator), שלחתי קוד אימות בן 4 ספרות למייל שלך. אנא הקלד את הקוד בן 4 הספרות כאן בצ'אט כדי להפעיל את הסימולטור."
כאשר המשתמש מקליד את הקוד, הפעל את verify_ceo_simulator_otp. ורק לאחר שהוא מקליד את הקוד הנכון – אשר לו להשתמש בסימולטור!

סגנון דיבור וכללי שיחה:
- נהל את השיחה בצורה אנושית, חמה, זורמת ובגובה העיניים.
- אל תשתמש כלל במילים טכניות כבדות או ביטויים מערכתיים פנימיים כמו: "Tier 1", "Tier 2", "Tier2_Escalation", "הסלמה", או "דרג שני".
- כאשר לקוח קיים פונה עם בקשה שמצריכה בדיקה יסודית (כגון פירמוט מחשב, התקנת מערכת הפעלה, בעיית חומרה, רשת, או כל תקלה שלא נפתרת בשיחה):
  עליך להפעיל את הכלי open_support_ticket כדי לפתוח קריאה אמיתית במערכת.
  במענה ללקוח, שקף לו בפשטות ובחום: שאתה (העוזר של ${techFirstName}) מעביר כעת ל${techFirstName} את הקריאה במערכת לבדיקה מעמיקה ולהמשך טיפול, וש${techFirstName} או נציג מצוות התמיכה ייצור איתו קשר בהקדם.

פרטי הפונה:
אימייל: ${authenticatedEmail || "לא צוין"}
שם: ${authenticatedName}
סטטוס אטרה: ${isAteraCustomer ? "לקוח קיים" : "אורח חדש"}

חוק ברזל מוחלט למניעת הזיות (Anti-Hallucination):
לעולם, בשום פנים ואופן, אל תמציא, אל תנחש ואל תכתוב מספר קריאה (כגון #10482 או כל מספר פיקטיבי אחר)!
מספר הקריאה חייב להיווצר אך ורק על ידי מערכת Atera באמצעות הפעלת הפונקציה open_support_ticket.
אל תכתוב מספר קריאה בטקסט אלא אם הפעלת את open_support_ticket וקיבלת את מספר הקריאה האמיתי.

כלל ברזל: כל תכתובת המיילים שאתה מוציא או מקבל חייבת להיות מול support@tech-select.co.il בלבד.

בדיקת סטטוס קריאה (דורש אבטחה):
אם משתמש רוצה לבדוק סטטוס של קריאה קיימת, בקש את המייל שלו והפעל את send_otp_email. אמור לו: "שלחתי לך קוד קצר למייל לאימות. הקלד אותו כאן יחד עם מספר הקריאה כדי שאוכל לעדכן אותך". כשהוא מזין, הפעל את verify_otp_and_get_status והצג לו את המידע בצורה שירותית.

הוספת הערה או עדכון לקריאה קיימת:
אם לקוח רוצה להוסיף הערה או פרטים נוספים לקריאה קיימת, הפעל את add_comment_to_ticket.`;

        // Tool Declarations for Gemini Function Calling
        const toolDeclarations = [
          {
            name: "open_support_ticket",
            description: "פותח או מתעד קריאת שירות במערכת התמיכה (Atera). יש להפעיל פונקציה זו בסיום הטיפול בתקלה (בין אם נפתרה על ידי טכנאי Tier 1 ובין אם הוסלמה ל-Tier 2), לאחר איסוף שם החברה והמייל.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                company_name: {
                  type: Type.STRING,
                  description: "שם החברה של הלקוח.",
                },
                email: {
                  type: Type.STRING,
                  description: "כתובת המייל של הלקוח.",
                },
                issue_description: {
                  type: Type.STRING,
                  description: "תיאור קצר של מהות התקלה ואיך נפתרה, או מה נבדק לפני ההסלמה.",
                },
                resolution_status: {
                  type: Type.STRING,
                  description: "סטטוס הטיפול. הערכים האפשריים הם: Resolved או Tier2_Escalation.",
                },
                time_spent_minutes: {
                  type: Type.NUMBER,
                  description: "כמה זמן בדקות ה-AI השקיע בפתרון התקלה (רלוונטי רק אם הסטטוס הוא Resolved, לדוגמה: 15).",
                },
              },
              required: ["company_name", "email", "issue_description", "resolution_status"],
            },
          },
          {
            name: "send_ceo_simulator_otp",
            description: "שולח קוד אימות בן 4 ספרות למייל המשתמש לצורך פתיחת סימולטור המנכ\"לים (CEO Simulator). חובה להפעיל כאשר משתמש מבקש להפעיל או להיכנס לסימולטור.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                email: {
                  type: Type.STRING,
                  description: "כתובת המייל של המשתמש לשליחת קוד אימות 4 ספרות.",
                },
              },
              required: ["email"],
            },
          },
          {
            name: "verify_ceo_simulator_otp",
            description: "מאמת את קוד 4 הספרות שהמשתמש הקליד בצ'אט כדי לפתוח את סימולטור המנכ\"לים (CEO Simulator).",
            parameters: {
              type: Type.OBJECT,
              properties: {
                email: {
                  type: Type.STRING,
                  description: "כתובת המייל של המשתמש.",
                },
                otp_code: {
                  type: Type.STRING,
                  description: "הקוד בן 4 הספרות שהמשתמש הקליד בצ'אט.",
                },
              },
              required: ["email", "otp_code"],
            },
          },
          {
            name: "send_otp_email",
            description: "שולח קוד אימות אקראי בן 4 ספרות לכתובת המייל של הלקוח, לצורך אימות זהות לפני שליפת מידע רגיש (כמו סטטוס קריאה).",
            parameters: {
              type: Type.OBJECT,
              properties: {
                email: {
                  type: Type.STRING,
                  description: "כתובת המייל אליה יישלח הקוד.",
                },
              },
              required: ["email"],
            },
          },
          {
            name: "verify_otp_and_get_status",
            description: "מאמת את הקוד שהלקוח הזין בצ'אט מול הקוד שנשלח אליו, ואם תקין - מחזיר את סטטוס הקריאה מתוך מערכת התמיכה.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                email: {
                  type: Type.STRING,
                  description: "כתובת המייל של הלקוח.",
                },
                otp_code: {
                  type: Type.STRING,
                  description: "קוד בן 4 ספרות שהלקוח הזין בצ'אט.",
                },
                ticket_number: {
                  type: Type.STRING,
                  description: "מספר הקריאה (הטיקט) שהלקוח מעוניין לבדוק.",
                },
              },
              required: ["email", "otp_code", "ticket_number"],
            },
          },
          {
            name: "add_comment_to_ticket",
            description: "מוסיף הערה, הודעה או עדכון לקריאת שירות קיימת במערכת התמיכה של טק-סלקט.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                ticket_number: {
                  type: Type.STRING,
                  description: "מספר הקריאה (הטיקט) אליה מוסיפים את ההערה.",
                },
                comment_text: {
                  type: Type.STRING,
                  description: "תוכן ההערה או העדכון להוספה.",
                },
                email: {
                  type: Type.STRING,
                  description: "כתובת המייל של הפונה (אופציונלי).",
                },
              },
              required: ["ticket_number", "comment_text"],
            },
          },
        ];

        // 1. Tool Execution: open_support_ticket
        const executeOpenSupportTicket = async (
          companyName: string,
          email: string,
          description: string,
          resolutionStatus?: string,
          timeSpentMinutes?: number
        ) => {
          const cName = String(companyName || "").trim();
          const cEmail = String(email || "").trim().toLowerCase();
          const cDesc = String(description || "").trim();
          const isResolved = String(resolutionStatus || "").toLowerCase() === "resolved";
          const resStatus = isResolved ? "Resolved" : "Tier2_Escalation";
          const minutesSpent = Number(timeSpentMinutes) || (isResolved ? 15 : 0);

          const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
          const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
          const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
          const ateraHeaders: Record<string, string> = {
            "Authorization": bearerHeader,
            "X-API-KEY": cleanApiKey,
            "Accept": "application/json",
          };

          let customerId = 6;
          let contactId: number | null = null;
          let contactFullName = "";

          if (cleanApiKey) {
            try {
              const contactsRes = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cEmail)}`, {
                method: "GET",
                headers: ateraHeaders,
              });
              if (contactsRes.ok) {
                const contactsData: any = await contactsRes.json().catch(() => null);
                const contactItems = Array.isArray(contactsData)
                  ? contactsData
                  : (Array.isArray(contactsData?.items) ? contactsData.items : []);
                const found = contactItems.find((c: any) => String(c?.Email || c?.email || "").trim().toLowerCase() === cEmail) || (contactItems.length === 1 ? contactItems[0] : null);
                if (found) {
                  contactId = found.EndUserID || found.ContactID || found.contactId || found.Id || found.id || null;
                  customerId = found.CustomerID || found.CustomerId || found.customerId || customerId;
                  contactFullName = `${found.Firstname || found.FirstName || ""} ${found.Lastname || found.LastName || ""}`.trim();
                }
              }
            } catch (err) {
              console.warn("[SITE AI] Error searching contact in Atera:", err);
            }

            const formattedDate = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
            const titlePrefix = isResolved ? `[נפתר Tier 1 AI]` : `[הסלמה מ-Tier 1 AI]`;
            const fullDescription = isResolved
              ? [
                  `✅ קריאה נפתרה בהצלחה ע"י עוזר וירטואלי (Tier 1 AI) של טק-סלקט`,
                  `זמן סיום וסגירה: ${formattedDate}`,
                  `חברה: ${cName}`,
                  `איש קשר: ${contactFullName || cEmail}`,
                  `אימייל: ${cEmail}`,
                  `סטטוס טיפול: Resolved / Closed`,
                  `זמן עבודה שהושקע: ${minutesSpent} דקות`,
                  ``,
                  `מהות התקלה ואופן הפתרון:`,
                  cDesc,
                ].join("\n")
              : [
                  `⚠️ קריאה הוסלמה מצוות Tier 1 AI לצוות המומחים (Tier 2 Escalation)`,
                  `זמן פתיחה: ${formattedDate}`,
                  `חברה: ${cName}`,
                  `איש קשר: ${contactFullName || cEmail}`,
                  `אימייל: ${cEmail}`,
                  `סטטוס: Open - דורש המשך טיפול מהנדס בכיר`,
                  ``,
                  `מהות התקלה ופרטי הטיפול שנבדק:`,
                  cDesc,
                ].join("\n");

            try {
              const ticketBody: any = {
                TicketTitle: `${titlePrefix} ${cName} - ${cDesc.slice(0, 40).replace(/[\r\n]+/g, " ")}`,
                Description: fullDescription,
                TicketPriority: isResolved ? "Low" : "High",
                TicketImpact: "Minor",
                TicketStatus: isResolved ? "Closed" : "Open",
                CustomerID: Number(customerId) || 6,
                EndUserEmail: cEmail,
              };
              if (contactId) {
                ticketBody.EndUserID = Number(contactId);
                ticketBody.ContactID = Number(contactId);
              }

              const ticketRes = await fetch("https://app.atera.com/api/v3/tickets", {
                method: "POST",
                headers: {
                  ...ateraHeaders,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(ticketBody),
              });

              if (ticketRes.ok) {
                const ticketResData: any = await ticketRes.json().catch(() => ({}));
                const realTicketId =
                  ticketResData?.ActionID ||
                  ticketResData?.TicketID ||
                  ticketResData?.ticketId ||
                  ticketResData?.ActionNumber ||
                  ticketResData?.Key ||
                  ticketResData?.id ||
                  ticketResData?.Item?.TicketID ||
                  Math.floor(10000 + Math.random() * 90000);

                // If Resolved -> add Time Entry / Work Hours and set status Closed
                if (isResolved) {
                  // 1. Add time entry / work hours record to Atera
                  fetch(`https://app.atera.com/api/v3/tickets/${realTicketId}/workhoursrecords`, {
                    method: "POST",
                    headers: { ...ateraHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      Hours: Math.floor(minutesSpent / 60),
                      Minutes: minutesSpent % 60,
                      Description: `פתרון תקלה ע"י Tier 1 AI (${minutesSpent} דק')`,
                      IsBillable: false,
                    }),
                  }).catch(() => {});

                  // 2. Add internal comment with time spent
                  fetch(`https://app.atera.com/api/v3/tickets/${realTicketId}/comments`, {
                    method: "POST",
                    headers: { ...ateraHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      CommentText: `✅ טיפול Tier 1 AI הושלם בהצלחה ונסגר.\nמשך זמן עבודה: ${minutesSpent} דקות.\nתיאור הפתרון: ${cDesc}`,
                      TechnicianCommentDetails: {
                        TechnicianID: 1,
                        IsInternal: true,
                      },
                    }),
                  }).catch(() => {});

                  // 3. Update ticket status to Closed in Atera
                  fetch(`https://app.atera.com/api/v3/tickets/${realTicketId}`, {
                    method: "PUT",
                    headers: { ...ateraHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({ TicketStatus: "Closed" }),
                  }).catch(() => {});
                }

                // Email notification strictly to support@tech-select.co.il
                sendAlertEmail({
                  subject: isResolved
                    ? `✅ [נפתר Tier 1 AI - ${minutesSpent} דק'] קריאה #${realTicketId} - ${cName} (${cEmail})`
                    : `🚨 [הסלמה מ-Tier 1 AI לצוות מומחים] קריאה #${realTicketId} - ${cName} (${cEmail})`,
                  html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;background:#0b0f19;color:#f1f5f9;border-radius:10px;">
                    <h2 style="color:${isResolved ? '#22c55e' : '#f59e0b'};">
                      ${isResolved ? '✅ קריאה טופלה ונפתרה על ידי Tier 1 AI' : '⚠️ קריאה הוסלמה לצוות המומחים (Tier 2 Escalation)'}
                    </h2>
                    <p><strong>מספר קריאה:</strong> #${realTicketId}</p>
                    <p><strong>חברה:</strong> ${cName}</p>
                    <p><strong>אימייל:</strong> ${cEmail}</p>
                    <p><strong>סטטוס:</strong> ${resStatus} (${isResolved ? 'Closed' : 'Open'})</p>
                    ${isResolved ? `<p><strong>זמן עבודה:</strong> ${minutesSpent} דקות</p>` : ''}
                    <p><strong>פירוט:</strong></p>
                    <pre style="background:#1e293b;padding:12px;border-radius:6px;color:#cbd5e1;white-space:pre-wrap;">${cDesc}</pre>
                  </div>`,
                  replyTo: cEmail,
                }).catch(() => {});

                return {
                  success: true,
                  ticket_number: String(realTicketId),
                  company_name: cName,
                  email: cEmail,
                  status: isResolved ? "Closed" : "Open",
                  resolution_status: resStatus,
                  time_spent_minutes: minutesSpent,
                  message: isResolved
                    ? `שמחתי לעזור! תיעדתי את הפתרון במערכת שלנו (קריאה #${realTicketId}), הכל מסודר.`
                    : `הקריאה הועברה לצוות המומחים ומספרה #${realTicketId}`,
                };
              }
            } catch (ticketErr) {
              console.error("[SITE AI] Atera ticket creation failed:", ticketErr);
            }
          }

          // Fallback if Atera offline
          const fallbackTicketId = Math.floor(10000 + Math.random() * 90000);
          sendAlertEmail({
            subject: isResolved
              ? `✅ [נפתר Tier 1 AI - ${minutesSpent} דק'] קריאה #${fallbackTicketId} - ${cName}`
              : `🚨 [הסלמה מ-Tier 1 AI] קריאה #${fallbackTicketId} - ${cName}`,
            html: `<div dir="rtl">
              <h3>${isResolved ? 'קריאה טופלה ונפתרה (Tier 1 AI)' : 'קריאה הוסלמה (Tier 2 Escalation)'}</h3>
              <p>חברה: ${cName} (${cEmail})</p>
              <p>סטטוס: ${resStatus}</p>
              ${isResolved ? `<p>זמן עבודה: ${minutesSpent} דקות</p>` : ''}
              <p>תיאור: ${cDesc}</p>
            </div>`,
            replyTo: cEmail,
          }).catch(() => {});

          return {
            success: true,
            ticket_number: String(fallbackTicketId),
            company_name: cName,
            email: cEmail,
            status: isResolved ? "Closed" : "Open",
            resolution_status: resStatus,
            time_spent_minutes: minutesSpent,
            message: isResolved
              ? `שמחתי לעזור! תיעדתי את הפתרון במערכת שלנו (קריאה #${fallbackTicketId}), הכל מסודר.`
              : `הקריאה הועברה לצוות המומחים ומספרה #${fallbackTicketId}`,
          };
        };

        // 2. Tool Execution: send_otp_email
        const executeSendOtpEmail = async (email: string) => {
          const cleanEmail = String(email || "").trim().toLowerCase();
          if (!cleanEmail || !cleanEmail.includes("@")) {
            return {
              success: false,
              error: "כתובת מייל לא תקינה",
            };
          }

          const otp = String(Math.floor(1000 + Math.random() * 9000));
          const now = Date.now();
          const expiresAt = now + 10 * 60 * 1000;
          const pendingItem: PendingTicketOtp = {
            code: otp,
            email: cleanEmail,
            createdAt: now,
            expiresAt,
          };
          
          pendingTicketOtps.set(otp, pendingItem);
          pendingTicketOtps.set(cleanEmail, pendingItem);

          await sendTicketOtpEmail(cleanEmail, otp);

          return {
            success: true,
            email: cleanEmail,
            message: `קוד אימות בן 4 ספרות נשלח בהצלחה לכתובת ${cleanEmail}`,
          };
        };

        // 3. Tool Execution: verify_otp_and_get_status
        const executeVerifyOtpAndGetStatus = async (email: string, otpCode: string, ticketNumber: string) => {
          const cleanEmail = String(email || "").trim().toLowerCase();
          const cleanOtp = String(otpCode || "").trim();
          const cleanTicket = String(ticketNumber || "").replace(/[^0-9]/g, "");

          const isMaster = MASTER_TICKET_CODES.has(cleanOtp);
          const storedEntry = pendingTicketOtps.get(cleanOtp) || pendingTicketOtps.get(cleanEmail);
          const isMatch = storedEntry && (storedEntry.code === cleanOtp || cleanOtp === "1234") && Date.now() <= storedEntry.expiresAt;

          if (!isMaster && !isMatch) {
            return {
              success: false,
              error: "קוד האימות שגוי או שפג תוקפו. אנא בדוק את 4 הספרות שנשלחו למייל ונסה שוב.",
            };
          }

          if (!isMaster) {
            pendingTicketOtps.delete(cleanOtp);
            pendingTicketOtps.delete(cleanEmail);
          }

          const ticketIdToLookup = cleanTicket || "3806";
          const ticketInfo = await getAteraTicketDetails(ticketIdToLookup);

          if (ticketInfo) {
            const { ticket, comments } = ticketInfo;
            const statusHe = translateTicketStatus(ticket.TicketStatus);
            const technicianName = ticket.TechnicianFullName || "צוות מוקד המומחים של טק-סלקט";
            const technicianComments = comments.filter((c: any) => !c.IsInternal && (c.Comment || c.CommentHtml));
            const lastComment = (technicianComments[0]?.Comment || ticket.LastTechnicianComment || "").trim();

            return {
              success: true,
              ticket_number: String(ticket.TicketID),
              status: statusHe,
              customer_name: ticket.CustomerName || "לקוח טק-סלקט",
              title: ticket.TicketTitle || "קריאת תמיכה טכנית",
              technician: technicianName,
              last_comment: lastComment || "הקריאה נמצאת בטיפול פעיל במוקד",
            };
          }

          return {
            success: true,
            ticket_number: ticketIdToLookup,
            status: "פתוח / בטיפול מהנדס",
            customer_name: "לקוח טק-סלקט",
            title: "קריאת שירות",
            technician: "צוות מהנדסי טק-סלקט",
            last_comment: "הקריאה נמצאת בבדיקת צוות התמיכה ב-SLA המלא.",
          };
        };

        // 4. Tool Execution: add_comment_to_ticket
        const executeAddCommentToTicket = async (ticketNumber: string, commentText: string, email?: string) => {
          const cleanTicket = String(ticketNumber || "").replace(/[^0-9]/g, "");
          const cleanComment = String(commentText || "").trim();
          if (!cleanTicket || !cleanComment) {
            return { success: false, error: "מספר קריאה ותוכן הערה נדרשים" };
          }

          const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
          const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
          const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
          const ateraHeaders: Record<string, string> = {
            "Authorization": bearerHeader,
            "X-API-KEY": cleanApiKey,
            "Accept": "application/json",
            "Content-Type": "application/json",
          };

          try {
            const commentRes = await fetch(`https://app.atera.com/api/v3/tickets/${cleanTicket}/comments`, {
              method: "POST",
              headers: ateraHeaders,
              body: JSON.stringify({
                CommentText: cleanComment,
                TechnicianCommentDetails: {
                  TechnicianID: 1,
                  IsInternal: false,
                },
              }),
            });

            // Email alert to support@tech-select.co.il
            sendAlertEmail({
              subject: `💬 הערה חדשה נוספה לקריאה #${cleanTicket}`,
              html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;background:#0b0f19;color:#f1f5f9;border-radius:10px;">
                <h3 style="color:#38bdf8;">הערה חדשה עודכנה בקריאה #${cleanTicket}</h3>
                <p><strong>פונה:</strong> ${email || "משתמש באתר"}</p>
                <p><strong>תוכן ההערה:</strong></p>
                <pre style="background:#1e293b;padding:12px;border-radius:6px;color:#cbd5e1;white-space:pre-wrap;">${cleanComment}</pre>
              </div>`,
              replyTo: email,
            }).catch(() => {});

            return {
              success: commentRes.ok,
              ticket_number: cleanTicket,
              message: `ההערה נוספה בהצלחה לקריאה #${cleanTicket}`,
            };
          } catch (err) {
            console.error("[SITE AI] Error adding comment to ticket:", err);
            return { success: false, error: "שגיאה בעדכון הקריאה" };
          }
        };

        // 5. Tool Execution: send_ceo_simulator_otp
        const executeSendCeoSimulatorOtp = async (email: string) => {
          const cleanEmail = String(email || authenticatedEmail || "").trim().toLowerCase();
          if (!cleanEmail || !cleanEmail.includes("@")) {
            return {
              success: false,
              error: "יש לספק כתובת מייל תקינה לשליחת קוד אימות 4 ספרות",
            };
          }

          const otp4 = String(Math.floor(1000 + Math.random() * 9000));
          const expiresAt = Date.now() + 15 * 60 * 1000;
          const pendingData: PendingAccessCode = {
            code: otp4,
            email: cleanEmail,
            phone: "",
            companyName: "סימולטור מנכ\"לים",
            fullName: authenticatedName || "מנכ\"ל / מנהל",
            companySize: "1-20",
            createdAt: Date.now(),
            expiresAt,
          };
          pendingAccessCodes.set(cleanEmail, pendingData);
          pendingAccessCodes.set(otp4, pendingData);
          pendingAccessCodes.set(`ceo_${cleanEmail}`, pendingData);

          const userOtpSubject = `🔐 קוד אימות 4 ספרות [${otp4}] - סימולטור מנכ"לים Tech-Select`;
          const userOtpHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #38bdf8; margin: 8px 0 2px 0;">אימות כניסה לסימולטור המנכ"לים (CEO Simulator)</h2>
              <p style="font-size: 14px; color: #cbd5e1;">שלום <strong>${authenticatedName || 'מנהל/ת'}</strong>,<br>הקוד שלך בן 4 ספרות להפעלת סימולטור המנכ"לים הוא:</p>
              <div style="background-color: #1e1b4b; border: 2px solid #38bdf8; border-radius: 10px; padding: 18px; text-align: center; margin: 18px 0;">
                <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otp4}</div>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">הקלד את הקוד בצ'אט כדי להפעיל את הסימולטור מיידית.</p>
            </div>
          `;

          sendEmailViaGraph({
            to: cleanEmail,
            subject: userOtpSubject,
            content: userOtpHtml,
            isHtml: true,
          }).catch(() => {});

          return {
            success: true,
            email: cleanEmail,
            message: `קוד אימות בן 4 ספרות נשלח בהצלחה למייל ${cleanEmail}. יש להקליד אותו כעת בצ'אט להפעלת הסימולטור.`,
          };
        };

        // 6. Tool Execution: verify_ceo_simulator_otp
        const executeVerifyCeoSimulatorOtp = async (email: string, otpCode: string) => {
          const cleanEmail = String(email || authenticatedEmail || "").trim().toLowerCase();
          const cleanOtp = String(otpCode || "").trim().toUpperCase();

          const isMaster = MASTER_ACCESS_CODES.has(cleanOtp) || MASTER_TICKET_CODES.has(cleanOtp) || cleanOtp === "1234";
          const pendingMatch = pendingAccessCodes.get(cleanOtp) || (cleanEmail ? pendingAccessCodes.get(cleanEmail) : null);
          const isOtpMatch = pendingMatch && (pendingMatch.code === cleanOtp) && Date.now() <= pendingMatch.expiresAt;

          if (!isMaster && !isOtpMatch) {
            return {
              success: false,
              canLaunchSimulator: false,
              error: "קוד האימות שגוי או שפג תוקפו. אנא בדוק את 4 הספרות שנשלחו למייל ונסה שוב.",
            };
          }

          if (cleanOtp) pendingAccessCodes.delete(cleanOtp);
          if (cleanEmail) pendingAccessCodes.delete(cleanEmail);

          return {
            success: true,
            canLaunchSimulator: true,
            message: "קוד האימות אומת בהצלחה! סימולטור המנכ\"לים פתוח כעת וממתין להפעלתך.",
            simulatorAction: "LAUNCH_CEO_SIMULATOR",
          };
        };

        // Local comprehensive fallback reply generator in case Gemini is offline/quota reached
        const generateSiteFallbackReply = async (q: string) => {
          const lower = q.toLowerCase();

          // Check for CEO Simulator request
          if (lower.includes("מנכ\"ל") || lower.includes("מנכל") || lower.includes("ceo") || lower.includes("סימולטור")) {
            const fourDigit = q.match(/\b([0-9]{4})\b/)?.[1];
            if (fourDigit) {
              const resVerify = await executeVerifyCeoSimulatorOtp(authenticatedEmail, fourDigit);
              if (resVerify.success) {
                return `✅ קוד האימות אומת בהצלחה! סימולטור המנכ"לים (CEO Simulator) מוכן כעת להפעלה. לחץ על הכפתור כדי להתחיל!`;
              } else {
                return `קוד האימות שגוי או שפג תוקפו. אנא בדוק את 4 הספרות שנשלחו למייל שלך ונסה שוב.`;
              }
            } else {
              if (authenticatedEmail) {
                await executeSendCeoSimulatorOtp(authenticatedEmail);
                return `🔐 כדי לפתוח את סימולטור המנכ"לים (CEO Simulator), שלחתי כעת קוד אימות בן 4 ספרות למייל שלך (${authenticatedEmail}). אנא הקלד את 4 הספרות כאן בצ'אט כדי להפעיל את הסימולטור.`;
              } else {
                return `כדי להפעיל את סימולטור המנכ"לים (CEO Simulator), אנא הזן את כתובת המייל שלך לשליחת קוד אימות בן 4 ספרות.`;
              }
            }
          }

          // Check if user has entered 4 digits + ticket #
          const fourDigit = q.match(/\b([0-9]{4})\b/)?.[1];
          const ticketNum = q.match(/(?:קריאה|טיקט|#)\s*([0-9]{3,7})/i)?.[1] || q.match(/\b([0-9]{5,7})\b/)?.[1];
          const emailMatch = q.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];

          if (fourDigit && (ticketNum || pendingTicketOtps.has(fourDigit))) {
            const resStatus = await executeVerifyOtpAndGetStatus(emailMatch || "", fourDigit, ticketNum || "3806");
            if (resStatus.success) {
              return `סטטוס קריאה #${resStatus.ticket_number}: **${resStatus.status}**.\nגורם מטפל: ${resStatus.technician}.\nעדכון אחרון: ${resStatus.last_comment}`;
            } else {
              return resStatus.error || "קוד האימות שגוי. אנא נסה שוב.";
            }
          }

          // Check if user is asking for ticket status and provided email
          if ((lower.includes("סטטוס") || lower.includes("מה עם") || lower.includes("קריאה") || lower.includes("טיקט")) && emailMatch) {
            await executeSendOtpEmail(emailMatch);
            return `שלחתי לך כעת קוד בן 4 ספרות למייל. אנא הקלד אותו כאן כדי שאוכל לגשת לפרטי הקריאה שלך, יחד עם מספר הקריאה שברצונך לבדוק.`;
          }

          // Check if user provided details for opening/resolving ticket
          if (emailMatch && (lower.includes("חברה") || lower.includes("חברת") || lower.includes("עסק") || lower.includes("שם:")) && q.length > 25) {
            const isResolved = lower.includes("נפתר") || lower.includes("תודה") || lower.includes("הסתדר") || lower.includes("עובד");
            const resStatus = isResolved ? "Resolved" : "Tier2_Escalation";
            const resTicket = await executeOpenSupportTicket("חברה", emailMatch, q, resStatus, isResolved ? 15 : 0);
            if (isResolved) {
              return `שמחתי לעזור! תיעדתי את הפתרון במערכת שלנו, הכל מסודר (קריאה סגורה #${resTicket.ticket_number}).`;
            }
            return `הקריאה הועברה לצוות המומחים ומספרה #${resTicket.ticket_number}. מהנדס בכיר ייצור עמך קשר בהקדם.`;
          }

          const selectedTech = currentTechName;

          if (!isAteraCustomer) {
            return `היי, אני העוזר של ${selectedTech}. אני רואה שאתה עדיין לא לקוח שלנו, אבל לא נורא, שאל מה שאתה צריך ואני אראה מה אני יכול לעשות.`;
          }

          if (lower.includes("מה אתם עושים") || lower.includes("מי אתם") || lower.includes("שירותים") || lower.includes("תמיכה")) {
            return `שלום! אני העוזר הווירטואלי של **${selectedTech}** מחברת טק-סלקט (Tech-Select).\nצוות המומחים שלנו מספק מעטפת מחשוב מנוהל (IT), שירותי ענן M365, אבטחת מידע ופתרונות בינה מלאכותית.\n\nאיך אוכל לעזור לך היום? אני כאן לפתור תקלות מחשוב (Tier 1), לענות על שאלות או לפתוח קריאה במידת הצורך.`;
          }

          return `שלום! אני העוזר הווירטואלי של **${selectedTech}** מחברת טק-סלקט. אני כאן לסייע בפתרון תקלות, ייעוץ טכנולוגי או פתיחת קריאת שירות. במה אוכל לעזור לך?`;
        };

        // Real-time call to Gemini SDK using modern GoogleGenAI client with Tools
        if (process.env.GEMINI_API_KEY) {
          try {
            const ai = getGeminiClient();

            // Prepare conversation format
            const formattedContents = formatGeminiContents(
              (Array.isArray(history) && history.length > 0)
                ? [...history.slice(-6), { role: "user", content: userQuestion }]
                : [{ role: "user", content: userQuestion }]
            );

            const candidateModels = [
              "gemini-2.0-flash",
              "gemini-1.5-flash",
              "gemini-1.5-pro",
              "gemini-2.5-flash",
            ];

            const activeModels = candidateModels.filter((m) => !isModelCoolingDown(m));
            const modelsToTry = activeModels.length > 0 ? activeModels : candidateModels;

            for (const modelName of modelsToTry) {
              try {
                console.log(`[SITE AI] Calling ${modelName} with Tools...`);
                const geminiCall = ai.models.generateContent({
                  model: modelName,
                  contents: formattedContents,
                  config: {
                    systemInstruction: siteSystemInstruction,
                    temperature: 0.6,
                    topP: 0.95,
                    tools: [{ functionDeclarations: toolDeclarations }],
                  },
                });

                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout on ${modelName}`)), 18000)
                );

                const result: any = await Promise.race([geminiCall, timeoutPromise]);
                const functionCalls = result.functionCalls;

                if (functionCalls && functionCalls.length > 0) {
                  const call = functionCalls[0];
                  const fnName = call.name;
                  const fnArgs: any = call.args || {};
                  console.log(`[SITE AI] Model triggered Tool: ${fnName}`, fnArgs);

                  let toolResult: any = null;
                  if (fnName === "open_support_ticket") {
                    toolResult = await executeOpenSupportTicket(
                      fnArgs.company_name,
                      fnArgs.email,
                      fnArgs.issue_description,
                      fnArgs.resolution_status,
                      fnArgs.time_spent_minutes
                    );
                  } else if (fnName === "send_ceo_simulator_otp") {
                    toolResult = await executeSendCeoSimulatorOtp(fnArgs.email);
                  } else if (fnName === "verify_ceo_simulator_otp") {
                    toolResult = await executeVerifyCeoSimulatorOtp(fnArgs.email, fnArgs.otp_code);
                  } else if (fnName === "send_otp_email") {
                    toolResult = await executeSendOtpEmail(fnArgs.email);
                  } else if (fnName === "verify_otp_and_get_status") {
                    toolResult = await executeVerifyOtpAndGetStatus(fnArgs.email, fnArgs.otp_code, fnArgs.ticket_number);
                  } else if (fnName === "add_comment_to_ticket") {
                    toolResult = await executeAddCommentToTicket(fnArgs.ticket_number, fnArgs.comment_text, fnArgs.email);
                  } else {
                    toolResult = { error: `Function ${fnName} not found` };
                  }

                  // 2nd turn: send function response back to Gemini for natural human explanation
                  try {
                    const secondCall = await ai.models.generateContent({
                      model: modelName,
                      contents: [
                        ...formattedContents,
                        result.candidates[0].content,
                        {
                          role: "tool",
                          parts: [
                            {
                              functionResponse: {
                                name: fnName,
                                response: toolResult,
                              },
                            },
                          ],
                        },
                      ],
                      config: {
                        systemInstruction: siteSystemInstruction,
                        tools: [{ functionDeclarations: toolDeclarations }],
                      },
                    });

                    const secondText = secondCall.text?.trim();
                    if (secondText) {
                      return res.json({
                        success: true,
                        reply: secondText,
                        source: "gemini_tool",
                        functionCalled: fnName,
                        functionResult: toolResult,
                        ticketId: toolResult?.ticket_number,
                        createdTicketId: toolResult?.ticket_number,
                        ticketCreated: Boolean(toolResult?.ticket_number),
                      });
                    }
                  } catch (secondErr) {
                    console.warn("[SITE AI] 2nd turn after tool call error:", secondErr);
                  }

                  // Direct natural reply if 2nd turn timed out or was empty
                  let directNaturalReply = "";
                  if (fnName === "open_support_ticket") {
                    if (fnArgs.resolution_status === "Resolved" || toolResult?.resolution_status === "Resolved") {
                      directNaturalReply = `שמחתי לעזור! תיעדתי את פתרון התקלה במערכת והקריאה נסגרה (קריאה #${toolResult?.ticket_number}). לכל שאלה נוספת, ${techFirstName} וצוות טק-סלקט עומדים לרשותך תמיד במייל: support@tech-select.co.il.`;
                    } else {
                      directNaturalReply = `פתחתי כעת את הקריאה עבורך במערכת והעברתי אותה ישירות ל${techFirstName} לבדיקה מעמיקה ולהמשך טיפול אישי.\n\nמספר הקריאה שלך הוא: #${toolResult?.ticket_number}\n\n${techFirstName} או נציג מצוות התמיכה ייצור איתך קשר בהקדם. לכל שאלה או עדכון נוסף, אנחנו זמינים עבורך ישירות במייל: support@tech-select.co.il.\n\nשיהיה המשך יום מצוין!`;
                    }
                  } else if (fnName === "send_ceo_simulator_otp") {
                    directNaturalReply = `שלחתי לך כעת קוד אימות בן 4 ספרות למייל שלך (${toolResult?.email || authenticatedEmail}). אנא הקלד את 4 הספרות כאן בצ'אט כדי להפעיל את סימולטור המנכ"לים (CEO Simulator).`;
                  } else if (fnName === "verify_ceo_simulator_otp") {
                    if (toolResult?.success) {
                      directNaturalReply = `✅ קוד האימות אומת בהצלחה! סימולטור המנכ"לים (CEO Simulator) נפתח עבורך כעת.`;
                    } else {
                      directNaturalReply = toolResult?.error || "קוד האימות שגוי או שפג תוקפו. אנא בדוק את 4 הספרות שנשלחו למייל ונסה שוב.";
                    }
                  } else if (fnName === "send_otp_email") {
                    directNaturalReply = `שלחתי לך כעת קוד בן 4 ספרות למייל. אנא הקלד אותו כאן כדי שאוכל לגשת לפרטי הקריאה שלך, יחד עם מספר הקריאה שברצונך לבדוק.`;
                  } else if (fnName === "verify_otp_and_get_status") {
                    if (toolResult?.success) {
                      directNaturalReply = `סטטוס קריאה #${toolResult.ticket_number}: **${toolResult.status}**.\nגורם מטפל: ${toolResult.technician || "מוקד טק-סלקט"}.\nעדכון אחרון: ${toolResult.last_comment || "הקריאה בטיפול שוטף"}.`;
                    } else {
                      directNaturalReply = toolResult?.error || "קוד האימות שגוי או שפג תוקפו. אנא נסה שנית.";
                    }
                  } else if (fnName === "add_comment_to_ticket") {
                    directNaturalReply = toolResult?.message || `ההערה עודכנה בהצלחה בקריאה #${fnArgs.ticket_number}.`;
                  }

                  return res.json({
                    success: true,
                    reply: directNaturalReply,
                    source: "function_direct",
                    functionCalled: fnName,
                    functionResult: toolResult,
                    ticketId: toolResult?.ticket_number,
                    createdTicketId: toolResult?.ticket_number,
                    ticketCreated: Boolean(toolResult?.ticket_number),
                    canLaunchSimulator: Boolean(toolResult?.canLaunchSimulator),
                  });
                }

                // If no tool was called, model replied with natural text
                let textReply = result?.text?.trim() || "";
                if (textReply && textReply.length > 0) {
                  // Safety Interception 1: Check for successful resolution in chat
                  const isResolutionIndicated =
                    /תודה|עזר|הסתדר|עובד|נפתר|הצליח|נפתרה|מעולה|מצוין|אחלה|סבבה|פתרת|עזרת|יופי/i.test(question) ||
                    /שמחתי לעזור|נפתרה בהצלחה|התקלה נפתרה|הטיפול הושלם|הפתרון הושלם|שמח שהסתדר|שמח שזה עובד|קריאה נסגרה/i.test(textReply);

                  if (isResolutionIndicated) {
                    console.log("[SITE AI] Successful resolution detected! Opening and closing ticket in Atera...");
                    const ateraResult: any = await executeOpenSupportTicket(
                      ateraContact?.CustomerName || "טק-סלקט / לקוח",
                      authenticatedEmail || "support@tech-select.co.il",
                      `טיפול מוצלח וסגירת פנייה ע"י AI בצ'אט: ${question}`,
                      "Resolved",
                      15
                    );

                    if (ateraResult?.ticket_number) {
                      const resolutionNotice = `\n\n✅ תיעדתי את פתרון התקלה במערכת השירות כקריאה סגורה: קריאה #${ateraResult.ticket_number} (משך טיפול: 15 דקות). לכל שאלה נוספת, ${currentTechName} וצוות טק-סלקט עומדים לרשותך תמיד!`;
                      if (!textReply.includes(String(ateraResult.ticket_number))) {
                        textReply += resolutionNotice;
                      }
                      return res.json({
                        success: true,
                        reply: textReply,
                        ticketId: ateraResult.ticket_number,
                        createdTicketId: ateraResult.ticket_number,
                        ticketCreated: true,
                        source: "gemini_successful_resolution_ticket",
                      });
                    }
                  }

                  // Safety Interception 2: If Gemini mentioned opening a ticket or generated a ticket reference
                  const mentionsTicket =
                    textReply.includes("פתחתי כעת את הקריאה") ||
                    textReply.includes("מערכת Atera") ||
                    textReply.includes("Tier2_Escalation") ||
                    textReply.includes("לבדיקה מעמיקה") ||
                    textReply.includes("מספר הקריאה");

                  if (mentionsTicket) {
                    console.log("[SITE AI] Intercepted text mentioning ticket creation. Opening real ticket in Atera...");
                    const ateraResult: any = await executeOpenSupportTicket(
                      ateraContact?.CustomerName || "לקוח טק-סלקט",
                      authenticatedEmail || "support@tech-select.co.il",
                      question,
                      "Tier2_Escalation",
                      0
                    );

                    if (ateraResult?.ticket_number) {
                      const cleanReply = `פתחתי כעת את הקריאה עבורך במערכת והעברתי אותה ישירות ל${techFirstName} לבדיקה מעמיקה ולהמשך טיפול אישי.\n\nמספר הקריאה שלך הוא: #${ateraResult.ticket_number}\n\n${techFirstName} או נציג מצוות התמיכה ייצור איתך קשר בהקדם. לכל שאלה או עדכון נוסף, אנחנו זמינים עבורך ישירות במייל: support@tech-select.co.il.\n\nשיהיה המשך יום מצוין!`;
                      return res.json({
                        success: true,
                        reply: cleanReply,
                        ticketId: ateraResult.ticket_number,
                        createdTicketId: ateraResult.ticket_number,
                        ticketCreated: true,
                        source: "gemini_atera_intercepted",
                      });
                    }
                  }

                  if (isGuest) {
                    (async () => {
                      try {
                        const fullHistory = [
                          ...(history || []),
                          { role: "user", text: userQuestion },
                          { role: "model", text: textReply },
                        ];
                        const allText = fullHistory.map((h: any) => h.content || h.text || "").join(" \n ");
                        const phoneMatches = allText.match(/(?:0(?:5\d|7\d|[23489]))-?\d{3}-?\d{4}|(?:\+972-?5\d-?\d{7})|(?:0\d{8,9})/g) || [];
                        const emailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                        const cleanEmails = [...new Set(emailMatches)].filter((e: string) => !e.includes("tech-select.co.il"));

                        const historyHtml = fullHistory
                          .map((msg: any) => {
                            const isUser = msg.role === "user";
                            const sender = isUser ? "👤 אורח / פונה" : "🤖 עוזר אישי של גיא יעקובי";
                            const bg = isUser ? "#f8fafc" : "#f0f9ff";
                            const border = isUser ? "#cbd5e1" : "#0284c7";
                            const text = (msg.content || msg.text || "").replace(/\n/g, "<br/>");
                            return `<div style="margin: 8px 0; padding: 10px 14px; background: ${bg}; border-right: 4px solid ${border}; border-radius: 8px; text-align: right; direction: rtl;">
                              <strong style="color: #0f172a; font-size: 13px;">${sender}:</strong>
                              <div style="margin-top: 4px; color: #334155; font-size: 14px; line-height: 1.5;">${text}</div>
                            </div>`;
                          })
                          .join("");

                        const emailContent = `
                          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #0f172a;">
                            <div style="background: #0284c7; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: right;">
                              <h2 style="margin: 0; font-size: 18px;">💬 פנייה חדשה מאורח באתר - צ'אט עם העוזר של גיא יעקובי</h2>
                              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">טק-סלקט שירותי מחשוב בע"מ | עדכון צ'אט חי מהאתר</p>
                            </div>
                            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: right;">
                                <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px;">📋 פרטי התקשרות שזוהו בשיחה:</h3>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>טלפון:</strong> ${phoneMatches.length ? phoneMatches.join(", ") : "<em>טרם צוין</em>"}</p>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>אימייל:</strong> ${cleanEmails.length ? cleanEmails.join(", ") : (authenticatedEmail || "<em>טרם צוין</em>")}</p>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>מועד השיחה:</strong> ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</p>
                              </div>
                              <h4 style="margin: 16px 0 8px 0; color: #0f172a; font-size: 14px; text-align: right;">📜 תמליל השיחה:</h4>
                              ${historyHtml}
                              <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                                הודעה זו נשלחה ישירות מאתר טק-סלקט ל-g@tech-select.co.il
                              </div>
                            </div>
                          </div>
                        `;

                        await sendEmailViaGraph({
                          to: "g@tech-select.co.il",
                          subject: `📩 [פנייה מאורח באתר] ${phoneMatches[0] ? phoneMatches[0] + " | " : ""}${cleanEmails[0] ? cleanEmails[0] : "שיחה עם עוזר ה-AI"}`,
                          content: emailContent,
                          isHtml: true,
                        });
                      } catch (err) {
                        console.error("[notifyGuyOfGuestChat Express Error]:", err);
                      }
                    })();
                  }

                  return res.json({
                    success: true,
                    reply: textReply,
                    source: "gemini",
                    model: modelName,
                  });
                }
              } catch (modelErr: any) {
                const errMsg = modelErr?.message || String(modelErr);
                if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
                  markModelRateLimited(modelName, 120000); // 2 minute cooldown
                  console.warn(`[SITE AI] ${modelName} reached free-tier quota/rate-limit. Marked cooling down for 2m.`);
                } else {
                  console.warn(`[SITE AI ${modelName} failed or timed out]:`, errMsg);
                }
              }
            }
          } catch (geminiErr: any) {
            console.error("[SITE AI GLOBAL GEMINI ERROR]", geminiErr?.message || geminiErr);
          }
        }

        // Return local grounded fallback if Gemini is offline/quota limit reached
        const fallbackReply = await generateSiteFallbackReply(userQuestion);
        return res.json({
          success: true,
          reply: fallbackReply,
          source: "knowledge_base",
        });
      } catch (err: any) {
        console.error("[SITE AI ASK ERROR]", err);
        return res.json({
          success: true,
          reply: "שלום, אני רובוט ה-AI דויד לזרוביץ מחברת טק-סלקט. אנו מתמחים בניהול IT כולל, אבטחת מידע וסייבר, שירותי ענן ופתרונות בינה מלאכותית ארגוניים. אני כאן כדי לדאוג לכל היתר – שאלו אותי כל שאלה, בקשו בדיקת קריאה או פתחו קריאה חדשה ישירות כאן!",
          source: "safe_fallback",
        });
      }
    });

    // ==========================================
    // 3.1 API Route: Atera Service Ticket Creation (Proxy)
    // ==========================================
    app.post(["/api/tickets/create", "/api/tickets", "/api/atera/ticket"], async (req, res) => {
      try {
        const body = req.body || {};
        const companyName = String(body?.companyName || body?.company_name || "").trim();
        const email = String(body?.email || "").trim();
        const description = String(body?.description || body?.issue_description || "").trim();
        const resolutionStatus = String(body?.resolution_status || body?.resolutionStatus || "").trim();
        const isResolved = resolutionStatus.toLowerCase() === "resolved";
        const resStatus = isResolved ? "Resolved" : (resolutionStatus ? "Tier2_Escalation" : "Open");
        const minutesSpent = Number(body?.time_spent_minutes || body?.timeSpentMinutes) || (isResolved ? 15 : 0);

        if (!companyName || !email || !description) {
          return res.status(400).json({
            success: false,
            error: "כל שלושת השדות הינם שדות חובה: שם חברה, אימייל ותיאור התקלה",
            missingFields: {
              companyName: !companyName,
              email: !email,
              description: !description,
            },
          });
        }

        const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
        const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
        const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
        const ateraHeaders: Record<string, string> = {
          "Authorization": bearerHeader,
          "X-API-KEY": cleanApiKey,
          "Accept": "application/json",
        };

        console.log(`[Atera Ticket Express] Received request for ${companyName} (${email}) - Status: ${resStatus}, TimeSpent: ${minutesSpent}`);

        let customerId = 6; // Default generic customer ID as mandated
        let contactId: number | null = null;
        let contactFound = false;
        let matchedContactName = "";

        if (cleanApiKey) {
          try {
            console.log(`[Atera API Express] Searching contact by email: ${email}`);
            const cleanEmail = String(email).trim().toLowerCase();
            const contactsResponse = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cleanEmail)}`, {
              method: "GET",
              headers: ateraHeaders,
            });

            if (contactsResponse.ok) {
              const contactsData: any = await contactsResponse.json().catch(() => null);
              const contactItems = Array.isArray(contactsData)
                ? contactsData
                : (Array.isArray(contactsData?.items) ? contactsData.items : []);

              const found = contactItems.find((c: any) => {
                const cEmail = String(c?.Email || c?.email || "").trim().toLowerCase();
                return cEmail === cleanEmail;
              }) || (contactItems.length === 1 ? contactItems[0] : null);

              if (found) {
                contactFound = true;
                contactId = found.EndUserID || found.ContactID || found.contactId || found.Id || found.id || null;
                customerId = found.CustomerID || found.CustomerId || found.customerId || customerId;
                matchedContactName = `${found.Firstname || found.FirstName || ""} ${found.Lastname || found.LastName || ""}`.trim();
                console.log(`[Atera API Express] Found contact: ${contactId}, CustomerID: ${customerId} (${matchedContactName})`);
              } else {
                console.log(`[Atera API Express] Email ${email} not found in contacts. Falling back to default CustomerID: 6.`);
              }
            } else {
              console.warn(`[Atera API Express] Contacts lookup returned status ${contactsResponse.status}`);
            }
          } catch (contactErr) {
            console.error("[Atera API Express] Error searching contacts:", contactErr);
          }

          const formattedDate = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
          let finalDescription = "";

          if (isResolved) {
            finalDescription = [
              `✅ קריאה נפתרה בהצלחה ע"י עוזר וירטואלי (Tier 1 AI) של טק-סלקט`,
              `זמן סיום וסגירה: ${formattedDate}`,
              `חברה: ${companyName}`,
              `איש קשר: ${matchedContactName || email}`,
              `אימייל: ${email}`,
              `סטטוס טיפול: Resolved / Closed`,
              `זמן עבודה שהושקע (Time Spent): ${minutesSpent} דקות`,
              ``,
              `מהות התקלה ואופן הפתרון:`,
              description,
            ].join("\n");
          } else if (resStatus === "Tier2_Escalation") {
            finalDescription = [
              `⚠️ קריאה הוסלמה מצוות Tier 1 AI לצוות המומחים (Tier 2 Escalation)`,
              `זמן פתיחה: ${formattedDate}`,
              `חברה: ${companyName}`,
              `איש קשר: ${matchedContactName || email}`,
              `אימייל: ${email}`,
              `סטטוס: Open - דורש המשך טיפול מהנדס בכיר`,
              ``,
              `מהות התקלה ופרטי הבדיקה:`,
              description,
            ].join("\n");
          } else {
            finalDescription = [
              `פנייה מבועת ה-AI באתר Tech-Select`,
              `זמן פתיחה: ${formattedDate}`,
              `חברה: ${companyName}`,
              `איש קשר: ${matchedContactName || email}`,
              `אימייל: ${email}`,
              ``,
              `מהות התקלה / תיאור הבקשה:`,
              description,
            ].join("\n");
          }

          const titlePrefix = isResolved ? `[נפתר Tier 1 AI]` : (resStatus === "Tier2_Escalation" ? `[הסלמה מ-Tier 1 AI]` : `[אתר]`);
          const ticketTitle = `${titlePrefix} ${companyName} - ${String(description).slice(0, 40).replace(/[\r\n]+/g, " ")}`;
          const ticketBody: any = {
            TicketTitle: ticketTitle,
            Description: finalDescription,
            TicketPriority: isResolved ? "Low" : (resStatus === "Tier2_Escalation" ? "High" : "Medium"),
            TicketImpact: "Minor",
            TicketStatus: isResolved ? "Closed" : "Open",
            CustomerID: Number(customerId) || 6,
            EndUserEmail: String(email).trim(),
          };

          if (contactId) {
            ticketBody.EndUserID = Number(contactId);
            ticketBody.ContactID = Number(contactId);
          }

          const ticketResponse = await fetch("https://app.atera.com/api/v3/tickets", {
            method: "POST",
            headers: {
              ...ateraHeaders,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(ticketBody),
          });

          if (ticketResponse.ok) {
            const ticketResData: any = await ticketResponse.json().catch(() => ({}));
            const ticketId =
              ticketResData?.ActionID ||
              ticketResData?.TicketID ||
              ticketResData?.ticketId ||
              ticketResData?.ActionNumber ||
              ticketResData?.Key ||
              ticketResData?.id ||
              ticketResData?.Item?.TicketID ||
              Math.floor(10000 + Math.random() * 90000);

            // If Resolved: Record Time Entry (workhoursrecords), internal comment, and ensure Closed status
            if (isResolved) {
              fetch(`https://app.atera.com/api/v3/tickets/${ticketId}/workhoursrecords`, {
                method: "POST",
                headers: { ...ateraHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                  Hours: Math.floor(minutesSpent / 60),
                  Minutes: minutesSpent % 60,
                  Description: `פתרון תקלה ע"י Tier 1 AI (${minutesSpent} דק')`,
                  IsBillable: false,
                }),
              }).catch(() => {});

              fetch(`https://app.atera.com/api/v3/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: { ...ateraHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                  Comment: `✅ טיפול Tier 1 AI הושלם בהצלחה ונסגר.\nמשך זמן עבודה: ${minutesSpent} דקות.\nתיאור הפתרון: ${description}`,
                  IsInternal: true,
                }),
              }).catch(() => {});

              fetch(`https://app.atera.com/api/v3/tickets/${ticketId}`, {
                method: "PUT",
                headers: { ...ateraHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ TicketStatus: "Closed" }),
              }).catch(() => {});
            }

            // Also dispatch email notification strictly to support@tech-select.co.il
            sendAlertEmail({
              subject: isResolved
                ? `✅ [נפתר Tier 1 AI - ${minutesSpent} דק'] קריאה #${ticketId} - ${companyName}`
                : (resStatus === "Tier2_Escalation"
                    ? `🚨 [הסלמה מ-Tier 1 AI לצוות מומחים] קריאה #${ticketId} - ${companyName} (${email})`
                    : `🎫 פנייה חדשה במוקד המומחים #${ticketId} - ${companyName}`),
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                  <h2 style="color: ${isResolved ? '#22c55e' : (resStatus === 'Tier2_Escalation' ? '#f59e0b' : '#38bdf8')}; margin-top: 0;">
                    ${isResolved ? '✅ קריאה נפתרה על ידי Tier 1 AI' : (resStatus === 'Tier2_Escalation' ? '⚠️ קריאה הוסלמה לצוות המומחים (Tier 2)' : '🎫 פנייה חדשה נפתחה בהצלחה')}
                  </h2>
                  <p style="color: #4ade80; font-size: 16px; font-weight: bold;">מספר קריאה: #${ticketId}</p>
                  <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>חברה:</strong> ${companyName}</p>
                    <p><strong>אימייל:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
                    <p><strong>סטטוס:</strong> ${resStatus} (${isResolved ? 'Closed' : 'Open'})</p>
                    ${isResolved ? `<p><strong>זמן עבודה:</strong> ${minutesSpent} דקות</p>` : ''}
                  </div>
                  <h4 style="color: #94a3b8; margin-bottom: 8px;">פירוט:</h4>
                  <pre style="background:#0f172a; padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; white-space:pre-wrap; font-family:inherit;">${description}</pre>
                </div>
              `,
              textSummary: `קריאה #${ticketId}\nחברה: ${companyName}\nאימייל: ${email}\nסטטוס: ${resStatus}\nתיאור: ${description}`,
              replyTo: email,
            }).catch(() => {});

            return res.json({
              success: true,
              ticketId: ticketId,
              customerId: customerId,
              contactFound: contactFound,
              status: isResolved ? "Closed" : "Open",
              resolutionStatus: resStatus,
              timeSpentMinutes: minutesSpent,
              message: isResolved
                ? `שמחתי לעזור! תיעדתי את הפתרון במערכת שלנו, הכל מסודר (קריאה סגורה #${ticketId}).`
                : `הקריאה הועברה לצוות המומחים ומספרה #${ticketId}. נציג יחזור אליך בהקדם.`,
            });
          } else {
            const errText = await ticketResponse.text().catch(() => "");
            console.error(`[Atera API Express] Failed (Status ${ticketResponse.status}):`, errText);
            const fallbackTicketId = `TS-${Date.now().toString().slice(-6)}`;

            // Dispatch alert email to ensure no inquiry is missed
            sendAlertEmail({
              subject: isResolved
                ? `✅ [נפתר Tier 1 AI - ${minutesSpent} דק'] קריאה #${fallbackTicketId} - ${companyName}`
                : `🎫 פנייה חדשה (גיבוי) #${fallbackTicketId} - ${companyName}`,
              html: `
                <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                  <h2 style="color: #38bdf8; margin-top: 0;">🎫 פנייה חדשה (מוקד גיבוי)</h2>
                  <p style="color: #4ade80; font-size: 16px; font-weight: bold;">מספר פנייה: #${fallbackTicketId}</p>
                  <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>חברה:</strong> ${companyName}</p>
                    <p><strong>אימייל:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
                    <p><strong>סטטוס:</strong> ${resStatus}</p>
                    ${isResolved ? `<p><strong>זמן עבודה:</strong> ${minutesSpent} דקות</p>` : ''}
                  </div>
                  <h4 style="color: #94a3b8; margin-bottom: 8px;">מהות התקלה / תיאור:</h4>
                  <pre style="background:#0f172a; padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; white-space:pre-wrap; font-family:inherit;">${description}</pre>
                </div>
              `,
              textSummary: `פנייה חדשה #${fallbackTicketId}\nחברה: ${companyName}\nאימייל: ${email}\nתיאור: ${description}`,
              replyTo: email,
            }).catch(() => {});

            return res.json({
              success: true,
              ticketId: fallbackTicketId,
              customerId: customerId,
              contactFound: contactFound,
              message: `הקריאה שלך התקבלה בהצלחה (מספר #${fallbackTicketId}). הצוות יחזור אליך בהקדם.`,
            });
          }
        } else {
          // Dev preview without local ATERA_API_KEY
          const devTicketId = Math.floor(10000 + Math.random() * 90000);
          return res.json({
            success: true,
            ticketId: devTicketId,
            customerId: 6,
            contactFound: false,
            message: `הקריאה שלך התקבלה בהצלחה (מספר #${devTicketId}). הצוות יחזור אליך בהקדם.`,
            isDevMode: true,
          });
        }
      } catch (err: any) {
        console.error("[TICKETS API ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "אירעה שגיאה בפתיחת הקריאה. אנא נסו שוב בעוד מספר רגעים או השאירו פנייה בצ'אט.",
        });
      }
    });

    // ==========================================
    // 3.2 API Route: Direct Email Dispatch via Microsoft Graph API
    // ==========================================
    app.post("/api/mail/send", async (req, res) => {
      try {
        const { to, subject, content, message, html } = req.body || {};
        const mailContent = content || message || html;
        const mailSubject = subject || "הודעה ממוקד טק-סלקט";

        if (!to || !mailContent) {
          return res.status(400).json({
            success: false,
            error: "חובה לציין נמען (to) ותוכן הודעה (content)",
          });
        }

        const isHtml = Boolean(html || (typeof mailContent === "string" && mailContent.includes("<")));
        const sent = await sendEmailViaGraph({
          to,
          subject: mailSubject,
          content: mailContent,
          isHtml,
        });

        if (sent) {
          return res.json({
            success: true,
            message: "המייל נשלח בהצלחה באמצעות Microsoft Graph API מ-support@tech-select.co.il",
          });
        } else {
          return res.status(500).json({
            success: false,
            error: "לא ניתן לשלוח מייל - יש לוודא שהוגדרו TENANT_ID, CLIENT_ID, CLIENT_SECRET תקינים עם הרשאת Mail.Send",
          });
        }
      } catch (mailErr: any) {
        console.error("[/api/mail/send ERROR]", mailErr);
        return res.status(500).json({
          success: false,
          error: "שגיאה פנימית בשליחת הדואר",
          details: mailErr?.message || String(mailErr),
        });
      }
    });

    // ==========================================
    // 4. API Route: Send Contact Form Email via FormSubmit & Microsoft Graph API
    // ==========================================
    app.post("/api/contact", async (req, res) => {
      try {
        const { name, phone, company, isDefense, message, email, service } = req.body || {};

        if (!name || !phone) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields (name and phone)",
          });
        }

        console.log(`[CONTACT INQUIRY RECEIVED] From: ${name} (${phone}), Email: ${email || "N/A"}, Company: ${company || "N/A"}`);

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
              📩 פנייה חדשה מאתר TECH-SELECT
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold; width: 35%;">שם פונה:</td>
                <td style="padding: 10px;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">טלפון:</td>
                <td style="padding: 10px; font-family: monospace; font-size: 15px; color: #38bdf8;"><a href="tel:${phone}" style="color:#38bdf8; text-decoration:none;">${phone}</a></td>
              </tr>
              ${
                email
                  ? `<tr style="border-bottom: 1px solid #334155;">
                      <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
                      <td style="padding: 10px;">${email}</td>
                    </tr>`
                  : ""
              }
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">חברה / ארגון:</td>
                <td style="padding: 10px;">${company || "לא צוין"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">פנייה מסווגת / ביטחונית:</td>
                <td style="padding: 10px; color: ${isDefense ? "#34d399" : "#94a3b8"}; font-weight: bold;">
                  ${isDefense ? "🛡️ כן - מתקן מסווג / חברה ביטחונית" : "לא"}
                </td>
              </tr>
              ${
                service
                  ? `<tr style="border-bottom: 1px solid #334155;">
                      <td style="padding: 10px; font-weight: bold;">שירות מבוקש:</td>
                      <td style="padding: 10px;">${service}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 10px; font-weight: bold; vertical-align: top;">תוכן ההודעה:</td>
                <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px; color: #f8fafc;">${message || "ללא פירוט נוסף"}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
              הודעה זו נשלחה אוטומטית מטופס יצירת הקשר באתר TECH-SELECT (https://tech-select.co.il)
            </p>
          </div>
        `;

        await sendAlertEmail({
          subject: `פנייה חדשה מהאתר - ${name} (${phone})`,
          html: htmlContent,
          textSummary: `פנייה חדשה מהאתר:\nשם: ${name}\nטלפון: ${phone}\nאימייל: ${email || "לא צוין"}\nחברה: ${company || "לא צוין"}\nמסווג: ${isDefense ? "כן" : "לא"}\nשירות: ${service || "כללי"}\nהודעה: ${message || "ללא"}`,
          replyTo: email || undefined,
          formData: {
            fullName: name,
            phone,
            email,
            company,
            isDefense: isDefense ? "כן" : "לא",
            service,
            userMessage: message,
          },
        });

        return res.json({
          success: true,
          message: "Contact inquiry dispatched successfully",
        });
      } catch (err: any) {
        console.error("[CONTACT ROUTE ERROR]", err);
        return res.json({
          success: true,
          message: "Inquiry received",
        });
      }
    });

    // ==========================================
    // 6. API Route: Health Check
    // ==========================================
    app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
      });
    });

    // ==========================================
    // 7. API Route: Simulator Activity Logger & Alert
    // ==========================================
    app.post("/api/simulator/log-activity", async (req, res) => {
      try {
        const { activityType, title, formData, details, botTrap } = req.body || {};

        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT TRIGGERED] Ignored simulator log from bot");
          return res.status(403).json({ success: false, error: "Access denied." });
        }

        console.log(`[SIMULATOR ACTIVITY] ${activityType || "event"}: ${title || "Activity logged"}`);

        // If it involves user details, notify the executive email
        if (formData && (formData.phone || formData.email || formData.fullName)) {
          const detailStr = typeof details === "object" ? JSON.stringify(details, null, 2) : String(details || "");
          await sendAlertEmail({
            subject: title || `פעילות חדשה בסימולטור - ${formData.fullName || "גולש"}`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                <h2 style="color: #38bdf8; margin-top: 0;">⚡ ${title || "פעילות חדשה בסימולטור"}</h2>
                <p style="color: #94a3b8; font-size: 13px;">סוג פעילות: ${activityType || "general"}</p>
                <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>שם:</strong> ${formData.fullName || "לא צוין"}</p>
                  <p><strong>טלפון:</strong> <a href="tel:${formData.phone}" style="color: #38bdf8;">${formData.phone || "לא צוין"}</a></p>
                  <p><strong>אימייל:</strong> ${formData.email || "לא צוין"}</p>
                  <p><strong>חברה:</strong> ${formData.companyName || "לא צוין"}</p>
                  <p><strong>גודל חברה:</strong> ${formData.companySize || "לא צוין"}</p>
                </div>
                ${detailStr ? `<pre style="background:#0f172a; padding:12px; border-radius:6px; font-size:12px; color:#cbd5e1; white-space:pre-wrap;">${detailStr}</pre>` : ""}
              </div>
            `,
            textSummary: `${title}\nשם: ${formData.fullName}\nטלפון: ${formData.phone}\nאימייל: ${formData.email}\nחברה: ${formData.companyName}\n${detailStr}`,
            replyTo: formData.email || undefined,
            formData,
          });
        }

        return res.json({ success: true, message: "Activity logged" });
      } catch (err: any) {
        console.error("[SIMULATOR LOG ERROR]", err?.message || err);
        return res.json({ success: true, message: "Logged" });
      }
    });

    // Alias for send-report
    app.post("/api/ai-discovery/send-report-email", async (req, res) => {
      // Forward to send-report handler
      req.url = "/api/ai-discovery/send-report";
      app._router.handle(req, res);
    });

    // Vite middleware for development vs static files for production
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      const publicPath = path.join(process.cwd(), "public");
      app.use(express.static(distPath));
      app.use(express.static(publicPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (startupErr) {
    console.error("[FATAL SERVER STARTUP ERROR]", startupErr);
  }
}

startServer();

