import { jsPDF } from "jspdf";
import { getCorsHeaders, getSecurityHeaders, sanitizeString } from "../_shared/security";

export async function onRequestOptions(context: any): Promise<Response> {
  const req = context?.request || context;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req, "GET, POST, OPTIONS"),
  });
}

export async function onRequestPost(context: any): Promise<Response> {
  const req = context?.request || context;
  const corsHeaders = getCorsHeaders(req, "GET, POST, OPTIONS");
  const secHeaders = getSecurityHeaders();

  try {
    const body: any = await req.json().catch(() => ({}));
    const rep = body.report || body.reportData || {};
    const fData = body.formData || body.lead || {};

    const company = sanitizeString(fData?.companyName || rep?.companyName || body.companyName, 100) || "Company";
    const name = sanitizeString(fData?.fullName || rep?.contactPerson || body.contactPerson, 80) || "מנהל";
    const role = sanitizeString(fData?.role || rep?.role || body.role, 80) || "הנהלה";
    const email = sanitizeString(body.email || fData?.email || rep?.email, 120) || "לא צוין";
    const phone = sanitizeString(body.phone || fData?.phone || rep?.phone, 30) || "לא צוין";
    const companySize = sanitizeString(body.companySize || fData?.companySize || rep?.companySize, 40) || "21-100";

    const rawYearly = rep?.financialAnalysis?.estimatedYearlySavingsNIS || rep?.roi?.estimatedAnnualFinancialSavingsNIS || 280000;
    const yearlySavings = typeof rawYearly === "number" ? rawYearly.toLocaleString() : sanitizeString(rawYearly, 30);
    const hoursSaved = sanitizeString(rep?.financialAnalysis?.estimatedMonthlyHoursSaved || rep?.roi?.monthlyHoursSaved || 240, 20);
    const summary = sanitizeString(rep?.executiveSummary || "דוח אפיון והתכנות AI ארגוני.", 1500);

    let opportunitiesFormatted = "1. אוטומציית מסמכים ועיבוד נתונים\n2. סוכן ידע פנים-ארגוני RAG מאובטח\n3. אינטגרציה למערכות ליבה";
    if (Array.isArray(rep?.opportunities) && rep.opportunities.length > 0) {
      opportunitiesFormatted = rep.opportunities.slice(0, 4).map((opp: any, idx: number) => {
        const d = sanitizeString(opp.department || "כללי", 40);
        const t = sanitizeString(opp.title || "יוזמה", 80);
        const s = sanitizeString(opp.aiSolution || opp.problemStatement || "", 200);
        return `${idx + 1}. [${d}] ${t}: ${s}`;
      }).join("\n\n");
    }

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
    doc.text(`Organization: ${company}`, 14, 58);
    doc.text(`Contact: ${name} (${role})`, 14, 65);
    doc.text(`Email: ${email} | Phone: ${phone}`, 14, 72);
    doc.text(`Company Size: ${companySize}`, 14, 79);

    // ROI Box
    doc.setFillColor(6, 78, 59);
    doc.rect(14, 85, 182, 22, "F");
    doc.setTextColor(110, 231, 183);
    doc.setFontSize(9);
    doc.text("Projected Financial & Operational ROI:", 18, 92);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10.5);
    doc.text(`Monthly Hours Saved: ${hoursSaved} hrs  |  Annual Savings: NIS ${yearlySavings}`, 18, 101);

    // Executive Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.text("Executive Summary:", 14, 118);
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(summary, 180);
    doc.text(summaryLines.slice(0, 7), 14, 126);

    // Key Initiatives
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Key AI Initiatives & Automation:", 14, 168);
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const oppLines = doc.splitTextToSize(opportunitiesFormatted, 180);
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

    const pdfArrayBuffer = doc.output("arraybuffer");
    const cleanCompanySafe = sanitizeString(company, 60).replace(/[^a-zA-Z0-9_\u0590-\u05FF.-]/g, "_") || "Company";
    const filename = `Tech-Select-AI-Report-${cleanCompanySafe}.pdf`;

    return new Response(pdfArrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        ...secHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Failed to generate PDF" }), {
      status: 500,
      headers: { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function onRequestGet(context: any): Promise<Response> {
  return onRequestPost(context);
}
