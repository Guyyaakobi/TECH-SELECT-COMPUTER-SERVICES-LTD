// @ts-nocheck
import { sendGraphMail } from "../_shared/graphMail";

interface Env {
  GEMINI_API_KEY?: string;
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleGenerateReport(request: Request, env: Env, _ctx?: any): Promise<Response> {
  try {
    const body: any = await request.json();
    const { formData, chatHistory, singleWindowText, businessContext, lead } = body || {};

    const fData = formData || lead || {};
    const finalCompany = fData.companyName || "ארגון מוביל";
    const finalContact = fData.fullName || "הנהלת הארגון";
    const finalEmail = fData.email || "לא צוין";
    const finalPhone = fData.phone || "לא צוין";
    const size = fData.companySize || "21-100";

    const userText = singleWindowText || businessContext || fData.customPainPoints || fData.dreamGoalTomorrow || (chatHistory ? JSON.stringify(chatHistory) : "מעוניינים באפיון שילוב כלי AI, חיבור למערכות ERP/CRM ואוטומציית מסמכים מאובטחת.");

    const envObj = (env || {}) as any;
    const apiKey =
      envObj.GEMINI_API_KEY ||
      envObj.GOOGLE_GENAI_API_KEY ||
      (typeof process !== "undefined" && process?.env?.GEMINI_API_KEY) ||
      "";
    let customAIReport: any = null;

    if (apiKey) {
      const prompt = `
אתה ארכיטקט AI ראשי ויועץ אסטרטגי בכיר בחברת TECH-SELECT (טק-סלקט בע"מ).
לפניך נתוני חברה ושאלות אפיון שמילאה הנהלת החברה:
שם החברה: ${finalCompany}
איש קשר / תפקיד: ${finalContact}
גודל חברה: ${size}
תשובות וצווארי בקבוק:
"""
${userText}
"""

עליך להחזיר אך ורק JSON תקין (ללא שום תווים נוספים) במבנה הבא:
{
  "executiveSummary": "תמצית מנהלים מעמיקה, עניינית ומותאמת אישית לחברה ${finalCompany}",
  "overallReadinessScore": 84,
  "securityReadinessScore": 88,
  "automationPotentialScore": 86,
  "financialAnalysis": {
    "estimatedMonthlyHoursSaved": 240,
    "estimatedYearlySavingsNIS": 288000,
    "paybackPeriodMonths": 2.8,
    "efficiencyGainPercent": 32,
    "summaryExplanation": "חישוב חיסכון מבוסס שחרור שעות עבודה ידניות"
  },
  "opportunities": [
    {
      "id": "opp-1",
      "title": "יוזמה 1 מותאמת אישית",
      "category": "Enterprise RAG",
      "problemDescription": "תיאור הבעיה מתוך קלט המשתמש",
      "aiSolution": "פתרון AI מדויק של Tech-Select",
      "impact": "Critical",
      "complexity": "Medium",
      "estimatedTimeToValue": "3-4 שבועות",
      "estimatedHoursSavedMonthly": 100,
      "recommendedTools": ["Tech-Select Private RAG", "Entra ID SSO", "Vector DB"]
    },
    {
      "id": "opp-2",
      "title": "יוזמה 2 מותאמת אישית",
      "category": "Automation",
      "problemDescription": "תיאור צוואר הבקבוק התפעולי",
      "aiSolution": "אוטומציה מאובטחת למערכות הליבה",
      "impact": "High",
      "complexity": "Medium",
      "estimatedTimeToValue": "4-6 שבועות",
      "estimatedHoursSavedMonthly": 85,
      "recommendedTools": ["Document AI", "ERP API Integration"]
    },
    {
      "id": "opp-3",
      "title": "יוזמה 3 מותאמת אישית",
      "category": "Security & Governance",
      "problemDescription": "מניעת זליגת מידע ו-Shadow AI",
      "aiSolution": "הקמת AI Gateway ארגוני עם סינון DLP",
      "impact": "Critical",
      "complexity": "Low",
      "estimatedTimeToValue": "1-2 שבועות",
      "estimatedHoursSavedMonthly": 55,
      "recommendedTools": ["AI Gateway", "DLP Sanitizer", "Zero-Retention DPA"]
    }
  ],
  "architectureRecommendations": {
    "tier1_Identity": "אימות זהות ארגוני (Microsoft Entra ID / SSO) עם MFA",
    "tier2_Gateway": "שכבת שער AI עם סינון DLP והתחייבות Zero Data Retention",
    "tier3_DataPipeline": "אינדוקס RAG מאובטח עם שמירה על הרשאות משתמשים",
    "tier4_ModelCluster": "הרצה בענן ארגוני מבודד או שרתי GPU מקומיים"
  },
  "roadmapPhases": [
    {
      "phase": "שלב 1 (ימים 0-30): תשתית אבטחה, מדיניות ו-Quick Win ראשון",
      "timeline": "חודש 1",
      "goals": ["הסדרת מדיניות AI ארגונית", "הקמת AI Gateway מאובטח"],
      "deliverables": ["מדריך מדיניות", "סביבת פיילוט עובדת"]
    },
    {
      "phase": "שלב 2 (ימים 30-90): אינדוקס ידע RAG וחיבור למערכות הליבה",
      "timeline": "חודשים 2-3",
      "goals": ["חיבור מאובטח למאגר המסמכים וה-ERP", "אוטומציה של עיבוד נתונים"],
      "deliverables": ["פורטל ידע פנימי חי לצוות", "אינטגרציה מלאה"]
    }
  ]
}`;

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash"];
      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2500,
                responseMimeType: "application/json"
              }
            })
          });

          if (res.ok) {
            const data: any = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
              customAIReport = JSON.parse(cleaned);
              break;
            }
          }
        } catch (e) {
          console.error(`Cloudflare report Gemini error on model ${model}:`, e);
        }
      }
    }

    const reportToSend = customAIReport || {
      executiveSummary: `דוח אפיון ארכיטקטורת AI וטרנספורמציה דיגיטלית מקיף עבור ${finalCompany}. המערכת ממליצה על הטמעת סוכני AI אוטונומיים, סנכרון מאובטח למערכות הליבה והפחתת 65% מזמן העבודה השגרתי.`,
      overallReadinessScore: 82,
      securityReadinessScore: 86,
      automationPotentialScore: 88,
      financialAnalysis: {
        estimatedMonthlyHoursSaved: size === "500+" ? 520 : size === "201-500" ? 380 : 240,
        estimatedYearlySavingsNIS: size === "500+" ? 850000 : size === "201-500" ? 540000 : 288000,
        paybackPeriodMonths: 2.8,
        efficiencyGainPercent: 32,
        summaryExplanation: "חישוב חיסכון מבוסס שחרור שעות עבודה ידניות"
      },
      architectureRecommendations: {
        tier1_Identity: "אימות זהות ארגוני (Microsoft Entra ID / SSO) עם MFA",
        tier2_Gateway: "שכבת שער AI עם סינון DLP והתחייבות Zero Data Retention",
        tier3_DataPipeline: "אינדוקס RAG מאובטח עם שמירה על הרשאות",
        tier4_ModelCluster: "מודלי שפה ייעודיים מאובטחים"
      }
    };

    // Forward notification to Guy in background
    try {
      const cleanPhone = (finalPhone || "").replace(/[^0-9+]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, '972')}` : "לא צוין";
      const savingsNIS = reportToSend.financialAnalysis?.estimatedYearlySavingsNIS || 280000;
      const hoursSaved = reportToSend.financialAnalysis?.estimatedMonthlyHoursSaved || 240;

      const whyTechSelect = [
        "1. ספק מורשה משרד הביטחון (מס' 0011033280) - עמידה בסטנדרטים המחמירים ביותר של סייבר, אבטחת מידע וסודיות.",
        "2. שילוב הנדסי מנצח של 3 עולמות: תשתית IT ארגונית יציבה, אבטחת מידע מתקדמת (DLP), ופיתוח תוכנה ייעודי עם אינטגרציות API.",
        "3. ניסיון הנדסי מוכח של מעל 15 שנה בהובלת גיא יעקובי בניהול IT, פרויקטים מורכבים וארכיטקטורת ענן היברידי.",
        "4. אינטגרציה עמוקה ובטוחה למערכות הליבה (Priority, SAP, Salesforce, Monday) ללא סיכון פעילות הארגון.",
        "5. מחויבות לתוצאות, שקיפות (FinOps), SLA קשיח וליווי אנושי צמוד עד להטמעה מלאה בקרב העובדים."
      ].join("\n");

      // 1. Primary: Send via Microsoft Graph API
      const reportSubject = `📊 [דוח אפיון והתכנות AI הופק] ${finalCompany} (${finalContact} | ${finalPhone})`;
      const reportHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <h2 style="color: #38bdf8; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">📊 דוח אפיון והתכנות AI הופק בהצלחה</h2>
          <p><strong>חברה:</strong> ${finalCompany}</p>
          <p><strong>מנהל / איש קשר:</strong> ${finalContact}</p>
          <p><strong>טלפון:</strong> <a href="tel:${finalPhone}" style="color: #38bdf8;">${finalPhone}</a></p>
          <p><strong>אימייל:</strong> ${finalEmail}</p>
          <p><strong>גודל ארגון:</strong> ${size}</p>
          <p><strong>חיסכון כספי שנתי:</strong> <span style="color: #34d399; font-weight: bold;">₪${savingsNIS.toLocaleString()}</span></p>
          <p><strong>חיסכון שעות עבודה:</strong> ${hoursSaved} שעות בחודש</p>
          <div style="background-color: #1e293b; padding: 12px; border-radius: 6px; margin: 16px 0;">
            <strong>תמצית מנהלים:</strong>
            <p style="white-space: pre-wrap; margin: 6px 0 0 0; color: #e2e8f0;">${reportToSend.executiveSummary}</p>
          </div>
        </div>
      `;

      sendGraphMail(env, {
        to: ["g@tech-select.co.il", "support@tech-select.co.il"],
        subject: reportSubject,
        content: reportHtml,
        isHtml: true,
        replyTo: finalEmail && finalEmail.includes("@") ? finalEmail : undefined,
      }).catch((err) => console.error("[generate-tailored-report] Graph send error:", err));

      // 2. Reliable Backup: FormSubmit (support@tech-select.co.il with _cc: g@tech-select.co.il)
      await fetch("https://formsubmit.co/ajax/support@tech-select.co.il", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://tech-select.co.il",
          "Referer": "https://tech-select.co.il/ai-discovery"
        },
        body: JSON.stringify({
          שם_החברה: finalCompany,
          שם_המנהל: finalContact,
          טלפון: finalPhone,
          אימייל: finalEmail,
          קישור_וואטסאפ_למנהל: waLink,
          גודל_ארגון: size,
          חיסכון_כספי_שנתי_משוער: `₪${savingsNIS.toLocaleString()}`,
          חיסכון_שעות_חודשי: `${hoursSaved} שעות`,
          תמצית_מנהלים: reportToSend.executiveSummary,
          למה_טק_סלקט_היא_השותף_המתאים: whyTechSelect,
          _subject: reportSubject,
          _template: "table",
          _captcha: "false",
          _cc: "g@tech-select.co.il",
          _replyto: finalEmail && finalEmail.includes("@") ? finalEmail : undefined,
          זמן_הפקה: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })
        })
      });
    } catch (e) {
      console.error("Cloudflare report notification error:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: reportToSend
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate report"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}

// Backwards-compatible Pages/Context wrapper
export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleGenerateReport(req, env, ctxParam);
}
