interface Env {
  GEMINI_API_KEY?: string;
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
export async function handleChat(request: Request, env: Env, _ctx?: any): Promise<Response> {
  try {
    const body: any = await request.json();
    const { messages, companyContext } = body || {};

    const envObj = (env || {}) as any;
    const apiKey =
      envObj.GEMINI_API_KEY ||
      envObj.GOOGLE_GENAI_API_KEY ||
      (typeof process !== "undefined" && process?.env?.GEMINI_API_KEY) ||
      "";
    const companyName = companyContext?.companyName || "הארגון שלכם";
    const erp = companyContext?.erpCrm || "מערכות הארגון";
    const role = companyContext?.role || "הנהלה";

    let replyText = "";

    if (apiKey) {
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash"];
      
      // Clean and format messages ensuring alternating turns and valid parts
      const cleanMessages = (messages || [])
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          text: (m.content || m.text || "").trim()
        }))
        .filter((m: any) => m.text.length > 0);

      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
      for (const m of cleanMessages) {
        if (contents.length > 0 && contents[contents.length - 1].role === m.role) {
          contents[contents.length - 1].parts[0].text += `\n\n${m.text}`;
        } else {
          contents.push({ role: m.role, parts: [{ text: m.text }] });
        }
      }

      if (contents.length === 0 || contents[0].role !== "user") {
        contents.unshift({ role: "user", parts: [{ text: "שלום, אשמח להתייעץ לגבי פתרונות AI עבור הארגון שלי." }] });
      }

      const systemInstruction = `אתה גיא יעקובי, ארכיטקט מערכות AI בכיר ומוביל בחברת TECH-SELECT COMPUTER SERVICES LTD (טק-סלקט בע"מ).
פרופיל הארגון: חברה: ${companyName}, תפקיד המשתמש: ${role}, מערכות קיימות: ${erp}.
מטרתך: ניתוח צרכים מעמיק, אפיון ארכיטקטורת AI מאובטחת, סוכני AI אוטונומיים, הגנת מידע (DPA / Zero Retention / DLP) וחישוב ROI עסקי ברור.
סגנון: מקצועי, חד, ענייני ומעשי, בעברית עסקית רהוטה.`;

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200
              }
            })
          });

          if (res.ok) {
            const data: any = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 0) {
              replyText = text.trim();
              break;
            }
          }
        } catch (e) {
          console.error(`Cloudflare Gemini model ${model} failed:`, e);
        }
      }
    }

    // Fallback if no API key or upstream error
    if (!replyText) {
      const userMsgs = (messages || []).filter((m: any) => m.role === "user");
      const lastMsg = userMsgs.length > 0 ? (userMsgs[userMsgs.length - 1].content || userMsgs[userMsgs.length - 1].text || "") : "";
      
      replyText = `שלום, כאן גיא יעקובי מ-Tech-Select.
בחנו את האתגר של ${companyName} סביב שילוב ${erp}. 

אנו ממליצים על יישום ארכיטקטורת סוכנים אוטונומיים (Agentic AI) הכוללת:
1. **שכבת אינטגרציה מאובטחת (Secure API Mesh):** סנכרון דו-כיווני בזמן אמת ללא שינוי בקוד הליבה.
2. **אימות והרשאות Zero-Trust:** בידוד מלא של נתוני החברה וסודיות עסקית.
3. **אוטומציית תהליכים (85%+ דיוק):** חיסכון של עשרות שעות עבודה שבועיות וצמצום טעויות אנוש.

${lastMsg ? `בהתייחס ישירות לנקודה שהעלית ("${lastMsg.substring(0, 80)}..."), נבנה את המודל הייעודי כך שישתלב בדיוק בזרימת העבודה הקיימת.` : ""}

האם תרצה שנעבור להפקת דוח האפיון המלא והערכת ה-ROI המותאמת לארגונכם?`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText
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
        error: error.message || "Failed to process chat"
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
  return handleChat(req, env, ctxParam);
}
