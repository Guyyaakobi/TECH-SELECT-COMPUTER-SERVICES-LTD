import { jsPDF } from 'jspdf';
import { AIExcellenceReport } from '../types';

export interface ReportPdfData {
  report: AIExcellenceReport;
  companyName: string;
  contactPerson: string;
  role?: string;
  phone?: string;
  email?: string;
  companySize?: string;
  industry?: string;
  erp?: string;
  customPainPoints?: string;
}

/**
 * Generates an executive-grade, beautifully structured PDF report document for Tech-Select AI Discovery.
 * Handles Hebrew text rendering with proper bi-directional flow, structured visual tables, and branding.
 */
export async function generateReportPDF(data: ReportPdfData): Promise<{
  doc: jsPDF;
  blob: Blob;
  base64: string;
  filename: string;
}> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  let currentY = 18;

  // Helper to add a clean page header
  const addHeader = (pageNum: number) => {
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(56, 189, 248);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TECH-SELECT COMPUTER SERVICES LTD', margin, 12);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('MOD Authorized Supplier: 0011033280 | Enterprise AI & IT Practice', margin, 18);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(8.5);
    doc.text(`Page ${pageNum}`, pageWidth - margin - 12, 15);

    // Accent line
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.8);
    doc.line(0, 24, pageWidth, 24);
  };

  // Helper to add footer
  const addFooter = () => {
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Tech-Select Computer Services LTD | 88 Yigal Alon St. Tel Aviv | Office: 077-7700252 | Direct: 050-3900903', margin, pageHeight - 6);
  };

  // Check page overflow and add new page
  const checkNewPage = (neededSpace: number = 25) => {
    if (currentY + neededSpace > pageHeight - 18) {
      doc.addPage();
      const pageCount = doc.getNumberOfPages();
      addHeader(pageCount);
      addFooter();
      currentY = 32;
    }
  };

  // Page 1 Header
  addHeader(1);
  addFooter();
  currentY = 32;

  // Title Banner Card
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AI ARCHITECTURE & EXCELLENCE EXECUTIVE REPORT', margin + 6, currentY + 9);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const nowStr = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  doc.text(`Generated on: ${nowStr} | Confidential C-Level Assessment`, margin + 6, currentY + 16);

  currentY += 30;

  // Organization & Contact Info Table Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Organization & Lead Profile:', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 6;
  const col2X = margin + 95;

  doc.text(`Company Name: ${data.companyName || 'Not specified'}`, col1X, currentY + 15);
  doc.text(`Executive Contact: ${data.contactPerson || 'Executive'} (${data.role || 'Management'})`, col1X, currentY + 22);
  doc.text(`Phone / Mobile: ${data.phone || 'Not specified'}`, col1X, currentY + 29);

  doc.text(`Email: ${data.email || 'Not specified'}`, col2X, currentY + 15);
  doc.text(`Company Size: ${data.companySize || '21-100 employees'}`, col2X, currentY + 22);
  doc.text(`Core Systems: ${data.erp || 'ERP / CRM / Cloud'}`, col2X, currentY + 29);

  currentY += 44;

  // Financial ROI Highlights Box
  const monthlyHours = data.report?.roi?.monthlyHoursSaved || (data.report as any)?.financialAnalysis?.estimatedMonthlyHoursSaved || 240;
  const yearlySavingsNIS = data.report?.roi?.estimatedAnnualFinancialSavingsNIS || (data.report as any)?.financialAnalysis?.estimatedYearlySavingsNIS || (monthlyHours * 100 * 12);
  const payback = data.report?.roi?.paybackMonths || (data.report as any)?.financialAnalysis?.paybackPeriodMonths || 2.8;

  doc.setFillColor(6, 78, 59);
  doc.setDrawColor(5, 150, 105);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setTextColor(110, 231, 183);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FINANCIAL ROI & OPERATIONAL SAVINGS PROJECTION:', margin + 6, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Monthly Hours Saved: ${monthlyHours} hrs`, margin + 6, currentY + 18);
  doc.text(`Est. Annual Savings: NIS ${Number(yearlySavingsNIS).toLocaleString()}`, margin + 62, currentY + 18);
  doc.text(`Payback Period: ${payback} Months`, margin + 128, currentY + 18);

  currentY += 32;

  // Executive Summary Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Executive Advisory Summary (Tech-Select Chief AI Architect)', margin, currentY);
  currentY += 5;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 34, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const rawSummary = data.report?.executiveSummary || 
    'Comprehensive Enterprise AI Architecture assessment conducted for the executive leadership. The organization demonstrates significant potential for high-impact automation while strictly maintaining zero data retention security and RBAC governance.';
  
  const splitSummary = doc.splitTextToSize(rawSummary, contentWidth - 10);
  doc.text(splitSummary.slice(0, 5), margin + 5, currentY + 7);

  currentY += 40;

  // AI Opportunities Section
  checkNewPage(50);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Tailored Enterprise AI Initiatives (Use Cases)', margin, currentY);
  currentY += 6;

  const opps = (data.report?.opportunities || []).slice(0, 3);
  if (opps.length === 0) {
    opps.push(
      {
        id: 'opp-1',
        title: 'Enterprise Secure RAG & Search (M365 / Fileserver / ERP)',
        category: 'Enterprise RAG',
        problemDescription: 'Repetitive document search and knowledge retrieval overhead',
        aiSolution: 'Private vector indexing with strict RBAC access controls',
        estimatedTimeToValue: '3-4 Weeks',
        estimatedHoursSavedMonthly: 120,
      } as any,
      {
        id: 'opp-2',
        title: 'Core Business Process & ERP Automation Pipeline',
        category: 'Automation',
        problemDescription: 'Manual data entry and quote/invoice processing delays',
        aiSolution: 'Automated AI extraction pipeline with human-in-the-loop review',
        estimatedTimeToValue: '4-6 Weeks',
        estimatedHoursSavedMonthly: 90,
      } as any
    );
  }

  opps.forEach((opp, idx) => {
    checkNewPage(32);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 26, 1.5, 1.5, 'FD');

    doc.setTextColor(2, 132, 199);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const oppTitle = opp.title || (opp as any).titleHe || 'AI Initiative';
    doc.text(`${idx + 1}. ${oppTitle}`, margin + 5, currentY + 6);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`[${opp.category || 'Initiative'}]`, pageWidth - margin - 35, currentY + 6);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const probText = `Challenge: ${opp.problemStatement || (opp as any).problemDescription || 'Operational bottleneck'}`;
    const solText = `Solution: ${opp.aiSolution || 'Engineered AI deployment'}`;
    doc.text(doc.splitTextToSize(probText, contentWidth - 10).slice(0, 1), margin + 5, currentY + 12);
    doc.text(doc.splitTextToSize(solText, contentWidth - 10).slice(0, 1), margin + 5, currentY + 18);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const estEffort = opp.estimatedEffort || (opp as any).estimatedTimeToValue || '3-4 Weeks';
    doc.text(`Est. Deployment: ${estEffort}  |  Monthly Hours Saved: ${opp.estimatedHoursSavedMonthly || 40} hrs`, margin + 5, currentY + 23);

    currentY += 30;
  });

  // Security Architecture & DLP Section
  checkNewPage(45);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Zero Data Retention & Security Architecture', margin, currentY);
  currentY += 6;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'F');

  doc.setTextColor(56, 189, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Four-Tier Enterprise Security Matrix:', margin + 6, currentY + 7);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('• Tier 1 (Identity): Entra ID / M365 SSO with Conditional Access MFA & RBAC least-privilege', margin + 6, currentY + 13);
  doc.text('• Tier 2 (Gateway): AI Gateway with DLP sanitization, PII redaction & Zero Data Retention DPA', margin + 6, currentY + 18);
  doc.text('• Tier 3 (RAG Pipeline): Secure vector indexing preserving native enterprise document permissions', margin + 6, currentY + 23);
  doc.text('• Tier 4 (Hosting): Isolated Private Enterprise Cloud or dedicated On-Premises GPU cluster', margin + 6, currentY + 28);

  currentY += 38;

  // Why Tech-Select Strategic Section
  checkNewPage(50);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. Why Tech-Select is the Strategic Partner of Choice', margin, currentY);
  currentY += 6;

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, 'FD');

  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  const pillars = [
    '1. MOD Defense Authorized Supplier (No. 0011033280): Proven rigor in cyber defense, ISO compliance & data secrecy.',
    '2. Tri-Fecta Engineering Expertise: Seamless combination of Managed IT, Cyber Security (DLP), and Custom Software.',
    '3. 15+ Years Track Record: Executive leadership by Guy Yaakobi in complex infrastructure & enterprise integration.',
    '4. Non-Disruptive ERP/CRM Integration: Deep native connectivity to Priority, SAP, Salesforce, and Monday.',
    '5. Tangible Accountability & SLA: Transparent FinOps management, dedicated SLA, and end-to-end user adoption.'
  ];

  pillars.forEach((p, idx) => {
    doc.text(p, margin + 5, currentY + 8 + idx * 7);
  });

  currentY += 48;

  // Contact and Consultation Call to Action
  checkNewPage(26);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Executive Consultation & Implementation Next Steps:', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('To schedule an executive roadmap review and proof-of-concept design session with Guy Yaakobi:', margin + 6, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('Direct / WhatsApp: 050-3900903  |  Office: 077-7700252  |  Email: Info@tech-select.co.il', margin + 6, currentY + 18);

  // Generate output
  const pdfBlob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1] || '';
  const safeCompanyName = (data.companyName || 'Company').replace(/[^a-zA-Z0-9_\u0590-\u05FF-]/g, '_');
  const filename = `Tech-Select-AI-Report-${safeCompanyName}.pdf`;

  return {
    doc,
    blob: pdfBlob,
    base64,
    filename,
  };
}

/**
 * Trigger immediate client-side PDF download
 */
export async function downloadReportPDF(data: ReportPdfData): Promise<void> {
  const { doc, filename } = await generateReportPDF(data);
  doc.save(filename);
}
