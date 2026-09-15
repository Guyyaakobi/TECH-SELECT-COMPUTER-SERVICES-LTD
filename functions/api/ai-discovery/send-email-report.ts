import { sendGraphMail } from "../_shared/graphMail";
import { jsPDF } from "jspdf";
import {
  getCorsHeaders,
  getSecurityHeaders,
  escapeHtml,
  sanitizeString,
  getClientIp,
  checkRateLimit,
} from "../_shared/security";

interface Env {
  TENANT_ID?: string;
  CLIENT_ID?: string;
  CLIENT_SECRET?: string;
  [key: string]: any;
}

function generateFallbackPdfBase64(data: {
  company: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  companySize: string;
  yearlySavings: string;
  hoursSaved: string;
  summary: string;
  opportunities: string;
}): string {
  try {
    const doc = new jsPDF();

    // Dark Header Banner
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(16);
    doc.text("TECH-SELECT AI PRACTICE", 14, 16);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Strategic AI Architecture & ROI Assessment", 14, 24);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Tech-Select Computer Services Ltd | Ministry of Defense Supplier #0011033280", 14, 32);

    // Profile Card
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Executive AI Discovery Report", 14, 48);

    doc.setFontSize(9.5);
    doc.text(`Organization: ${data.company || "N/A"}`, 14, 58);
    doc.text(`Contact: ${data.name || "N/A"} (${data.role || "Executive"})`, 14, 65);
    doc.text(`Email: ${data.email || "N/A"} | Phone: ${data.phone || "N/A"}`, 14, 72);
    doc.text(`Company Size: ${data.companySize || "21-100"}`, 14, 79);

    // ROI Box
    doc.setFillColor(6, 78, 59);
    doc.rect(14, 85, 182, 22, "F");
    doc.setTextColor(110, 231, 183);
    doc.setFontSize(9);
    doc.text("Projected Financial & Operational ROI:", 18, 92);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10.5);
    doc.text(`Monthly Hours Saved: ${data.hoursSaved} hrs  |  Annual Savings: NIS ${data.yearlySavings}`, 18, 101);

    // Executive Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.text("Executive Summary:", 14, 118);
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(data.summary || "AI Architecture Roadmap", 180);
    doc.text(summaryLines.slice(0, 7), 14, 126);

    // Key Initiatives
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Key AI Initiatives & Automation:", 14, 168);
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const oppLines = doc.splitTextToSize(data.opportunities || "Enterprise AI Agents, RAG, Integration", 180);
    doc.text(oppLines.slice(0, 7), 14, 176);

    // Security Architecture
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 228, 182, 42, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text("Enterprise Security Architecture (Zero Data Retention):", 18, 235);
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("• Tier 1: Identity & Access Management (Microsoft Entra ID, Conditional Access, MFA)", 18, 242);
    doc.text("• Tier 2: AI DLP Gateway (PII redaction, enterprise DPA, Zero Training guarantee)", 18, 248);
    doc.text("• Tier 3: Secure Vector Store & Enterprise RAG (Preserving folder permissions & ACLs)", 18, 254);
    doc.text("• Tier 4: Managed Private Cloud in Israel / Dedicated On-Premises GPU Cluster", 18, 260);

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("TECH-SELECT Computer Services Ltd | Phone: 050-3900903 | Email: g@tech-select.co.il", 14, 287);

    const dataUri = doc.output("datauristring");
    return dataUri.split(",")[1] || "";
  } catch (e) {
    console.error("[generateFallbackPdfBase64 error]", e);
    return "";
  }
}

export async function onRequestOptions(contextOrRequest: any): Promise<Response> {
  const request = contextOrRequest?.request || contextOrRequest;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, "POST, OPTIONS"),
  });
}

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleSendEmailReport(request: Request, env: Env, _ctx?: any): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  try {
    const clientIp = getClientIp(request);

    // Rate Limiting: Max 10 email dispatches per 10 minutes per IP
    if (!checkRateLimit(`send_email_${clientIp}`, 10, 10 * 60 * 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "יותר מדי בקשות לשליחת דוח. אנא המתן מספר דקות.",
        }),
        { status: 429, headers: responseHeaders }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const { lead, report, reportData, formData, companyContext, clientEmail, pdfBase64, pdfFilename, botTrap } = body || {};

    // Honeypot check
    if (botTrap && String(botTrap).trim().length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied" }),
        { status: 403, headers: responseHeaders }
      );
    }

    const rep = report || reportData || {};
    const fData = formData || lead || companyContext || {};

    // Sanitize user inputs
    const company = sanitizeString(fData?.companyName || rep?.companyName, 100) || "ארגון בבדיקה";
    const name = sanitizeString(fData?.fullName || rep?.contactPerson, 80) || "מנהל בארגון";
    const role = sanitizeString(fData?.role || rep?.role, 80) || "הנהלה";
    const email = sanitizeString(clientEmail || fData?.email || rep?.email, 120) || "לא צוין";
    const phone = sanitizeString(fData?.phone || rep?.phone, 30) || "לא צוין";
    const companySize = sanitizeString(fData?.companySize || rep?.companySize, 40) || "לא צוין";

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^0/, "972")}` : "לא צוין";

    const rawYearly = rep?.financialAnalysis?.estimatedYearlySavingsNIS || rep?.roi?.estimatedAnnualFinancialSavingsNIS || 280000;
    const yearlySavings = typeof rawYearly === "number" ? rawYearly.toLocaleString() : sanitizeString(rawYearly, 30);
    const hoursSaved = sanitizeString(rep?.financialAnalysis?.estimatedMonthlyHoursSaved || rep?.roi?.monthlyHoursSaved || 240, 20);
    const summary = sanitizeString(rep?.executiveSummary || "דוח אפיון והתכנות AI ארגוני הופק בהצלחה.", 1500);

    // Format opportunities
    let opportunitiesFormatted = "1. אוטומציית מסמכים ועיבוד נתונים\n2. סוכן ידע פנים-ארגוני RAG מאובטח\n3. אינטגרציה למערכות ERP/CRM";
    if (Array.isArray(rep?.opportunities) && rep.opportunities.length > 0) {
      opportunitiesFormatted = rep.opportunities.slice(0, 4).map((opp: any, idx: number) => {
        const d = sanitizeString(opp.department || "כללי", 40);
        const t = sanitizeString(opp.title || "יוזמה", 80);
        const s = sanitizeString(opp.aiSolution || opp.problemStatement || "", 200);
        return `${idx + 1}. [${d}] ${t}: ${s}`;
      }).join("\n\n");
    }

    // HTML Escape all dynamic values
    const safeCompany = escapeHtml(company);
    const safeName = escapeHtml(name);
    const safeRole = escapeHtml(role);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safeSize = escapeHtml(companySize);
    const safeSummary = escapeHtml(summary);
    const safeOpp = escapeHtml(opportunitiesFormatted);

    const reportSubject = `📄 [דוח אפיון ארכיטקטורת AI] עבור ${safeCompany} (${safeName} | ${safePhone})`;
    const htmlReport = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 650px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
          📊 דוח אפיון ארכיטקטורת AI ומפת דרכים
        </h2>
        <p style="font-size: 14px; color: #94a3b8;">הדוח הופק אוטומטית על ידי סימולטור ה-AI של Tech-Select</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold; width: 35%;">חברה:</td>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${safeCompany}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">איש קשר:</td>
            <td style="padding: 10px;">${safeName} (${safeRole})</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">טלפון:</td>
            <td style="padding: 10px;"><a href="tel:${safePhone}" style="color: #38bdf8;">${safePhone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
            <td style="padding: 10px;">${safeEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">גודל ארגון:</td>
            <td style="padding: 10px;">${safeSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חיסכון שנתי משוער:</td>
            <td style="padding: 10px; color: #34d399; font-weight: bold;">₪${escapeHtml(yearlySavings)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px; font-weight: bold;">חיסכון שעות חודשי:</td>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${escapeHtml(hoursSaved)} שעות בחודש</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; vertical-align: top;">תמצית מנהלים:</td>
            <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px;">${safeSummary}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 12px; background-color: #1e293b; border-radius: 8px;">
          <h4 style="color: #38bdf8; margin: 0 0 8px 0;">יוזמות AI מרכזיות:</h4>
          <p style="white-space: pre-wrap; margin: 0; font-size: 13px; color: #cbd5e1;">${safeOpp}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
          TECH-SELECT Computer Services LTD | ספק מורשה משרד הביטחון 0011033280 | נייד ישיר לגיא יעקובי: 050-3900903
        </p>
      </div>
    `;

    // 1. Send via Microsoft Graph API to Guy & Support
    const attachments = [];
    const cleanCompanySafe = sanitizeString(company, 60).replace(/[^a-zA-Z0-9_\u0590-\u05FF.-]/g, "_") || "Company";
    const safeFilename = sanitizeString(pdfFilename || `Tech-Select-AI-Report-${cleanCompanySafe}.pdf`, 100).replace(/[^a-zA-Z0-9_\u0590-\u05FF.-]/g, "_");

    if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
      const cleanBase64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;
      attachments.push({
        filename: safeFilename,
        content: cleanBase64,
        contentType: "application/pdf",
      });
    }

    // Always guarantee a PDF attachment if client didn't supply one or failed
    if (attachments.length === 0) {
      const fallbackPdf = generateFallbackPdfBase64({
        company,
        name,
        role,
        phone,
        email,
        companySize,
        yearlySavings,
        hoursSaved,
        summary,
        opportunities: opportunitiesFormatted,
      });
      if (fallbackPdf) {
        attachments.push({
          filename: safeFilename,
          content: fallbackPdf,
          contentType: "application/pdf",
        });
      }
    }

    sendGraphMail(env, {
      to: ["g@tech-select.co.il"],
      subject: reportSubject,
      content: htmlReport,
      isHtml: true,
      replyTo: email && email.includes("@") ? email : undefined,
      attachments,
    }).catch((e) => console.error("[send-email-report] Graph admin send error:", e));

    // Also send copy to the client if email is valid and not internal
    if (email && email.includes("@") && !email.includes("tech-select")) {
      sendGraphMail(env, {
        to: email.trim(),
        subject: `הדוח המנהלי שלכם לאפיון AI - חברת ${safeCompany} | TECH-SELECT`,
        content: htmlReport,
        isHtml: true,
        attachments,
      }).catch((e) => console.error("[send-email-report] Graph client send error:", e));
    }

    // 2. Reliable Backup delivery to FormSubmit
    fetch("https://formsubmit.co/ajax/g@tech-select.co.il", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://tech-select.co.il",
        "Referer": "https://tech-select.co.il/ai-discovery",
      },
      body: JSON.stringify({
        שם_הארגון: company,
        איש_קשר_ותפקיד: `${name} (${role})`,
        טלפון: phone,
        דואל: email,
        גודל_ארגון: companySize,
        חיסכון_שנתי: yearlySavings,
        חיסכון_שעות_חודשי: hoursSaved,
        תמצית_מנהלים: summary,
        יוזמות: opportunitiesFormatted,
        _subject: reportSubject,
        _template: "table",
        _captcha: "false",
        _replyto: email && email.includes("@") ? email : undefined,
        זמן_הפקה: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
      }),
    }).catch((e) => console.warn("[send-email-report] FormSubmit backup error:", e));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Executive AI Report dispatched successfully",
      }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to dispatch email",
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleSendEmailReport(req, env, ctxParam);
}
