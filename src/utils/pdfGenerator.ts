import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
 * Escapes HTML entities for safe DOM injection
 */
function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an executive-grade, beautifully structured PDF report document for Tech-Select AI Discovery.
 * Uses high-resolution HTML Canvas rendering with native Hebrew RTL font support to guarantee
 * zero gibberish, zero scrambled letters, and crisp print-ready output.
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

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  const companyName = data.companyName || 'ארגון / חברה';
  const contactPerson = data.contactPerson || 'מנהל / הנהלה';
  const role = data.role || 'הנהלה בכירה';
  const phone = data.phone || 'לא צוין';
  const email = data.email || 'לא צוין';
  const companySize = data.companySize || '21-100 עובדים';
  const erp = data.erp || 'ERP / CRM / Cloud M365';
  const nowStr = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const monthlyHours =
    data.report?.roi?.monthlyHoursSaved ||
    (data.report as any)?.financialAnalysis?.estimatedMonthlyHoursSaved ||
    240;
  const yearlySavingsNIS =
    data.report?.roi?.estimatedAnnualFinancialSavingsNIS ||
    (data.report as any)?.financialAnalysis?.estimatedYearlySavingsNIS ||
    monthlyHours * 100 * 12;
  const payback =
    data.report?.roi?.paybackMonths ||
    (data.report as any)?.financialAnalysis?.paybackPeriodMonths ||
    2.8;

  const executiveSummary =
    data.report?.executiveSummary ||
    'ניתוח ארכיטקטורת ה-AI מציג פוטנציאל התייעלות משמעותי עבור הארגון. שילוב סוכני אוטומציה ו-RAG מאובטח יאפשר חיסכון ניכר בשעות עבודה תוך שמירה מוחלטת על אבטחת מידע, הרשאות RBAC ועמידה במדיניות Zero Data Retention.';

  const opportunities = (data.report?.opportunities || []).slice(0, 4);
  if (opportunities.length === 0) {
    opportunities.push(
      {
        id: 'opp-1',
        title: 'סוכן ידע פנים-ארגוני מאובטח (Enterprise RAG)',
        category: 'Enterprise RAG',
        problemDescription: 'חיפוש מידע חוזר ואיבוד זמן באיתור נהלים ומסמכים',
        aiSolution: 'אינדוקס וקטורי פרטי עם שימור הרשאות משתמש ומניעת זליגת מידע',
        estimatedTimeToValue: '3-4 שבועות',
        estimatedHoursSavedMonthly: 120,
      } as any,
      {
        id: 'opp-2',
        title: 'אוטומציית מסמכים ואינטגרציית מערכות ERP/CRM',
        category: 'Automation',
        problemDescription: 'הזנה ידנית של חשבוניות, הזמנות ומסמכים במערכות הליבה',
        aiSolution: 'צינור חילוץ נתונים מבוסס AI עם מנגנון אימות ובקרה אנושית',
        estimatedTimeToValue: '4-6 שבועות',
        estimatedHoursSavedMonthly: 90,
      } as any
    );
  }

  const oppsPage1 = opportunities.slice(0, 2);
  const oppsPage2 = opportunities.slice(2, 4);

  if (isBrowser) {
    // Build isolated off-screen container for rendering
    const container = document.createElement('div');
    container.id = 'tech-select-pdf-container';
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = '794px'; // 210mm at 96 DPI
    container.style.zIndex = '-9999';
    container.style.background = '#ffffff';

    const pageStyle = `
      width: 794px;
      height: 1123px;
      box-sizing: border-box;
      padding: 38px 46px 32px 46px;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      direction: rtl;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    `;

    const headerHtml = (pageNum: number) => `
      <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; direction: rtl;">
          <div style="text-align: right;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">TECH-SELECT</span>
              <span style="background: #0284c7; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">AI &amp; IT PRACTICE</span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px; font-weight: 600;">
              טק-סלקט שירותי מחשוב בע"מ | ספק מורשה משרד הביטחון: 0011033280
            </div>
          </div>
          <div style="text-align: left; direction: ltr;">
            <span style="background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 12px; border: 1px solid #cbd5e1;">
              עמוד ${pageNum} מתוך 2
            </span>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-weight: 500;">
              ${escapeHtml(nowStr)}
            </div>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; direction: rtl;">
        <div>
          טק-סלקט שירותי מחשוב בע"מ | יגאל אלון 88, תל אביב | משרד: 077-7700252 | ישיר: 050-3900903
        </div>
        <div style="color: #0284c7; font-weight: 600;">
          support@tech-select.co.il | סודי ומסחרי
        </div>
      </div>
    `;

    // -------------------------------------------------------------
    // PAGE 1 HTML
    // -------------------------------------------------------------
    const page1Html = `
      <div class="pdf-page" style="${pageStyle}">
        <div>
          ${headerHtml(1)}

          <!-- Title Banner -->
          <div style="background: linear-gradient(135deg, #0b0f19 0%, #1e293b 100%); color: #ffffff; border-radius: 10px; padding: 18px 22px; margin-bottom: 16px; border: 1px solid #38bdf8;">
            <div style="font-size: 18px; font-weight: 800; color: #38bdf8; margin-bottom: 4px;">
              דוח אסטרטגי: ארכיטקטורת AI וניתוח כדאיות עסקית (ROI)
            </div>
            <div style="font-size: 12px; color: #cbd5e1;">
              מסמך הערכה מנהלי מותאם אישית | הוכן על ידי חטיבת ההנדסה והארכיטקטורה של טק-סלקט
            </div>
          </div>

          <!-- Customer & Executive Info Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              פרופיל הארגון והפנייה:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11.5px; color: #334155;">
              <div><strong>שם החברה:</strong> ${escapeHtml(companyName)}</div>
              <div><strong>דוא"ל:</strong> ${escapeHtml(email)}</div>
              <div><strong>איש קשר:</strong> ${escapeHtml(contactPerson)} (${escapeHtml(role)})</div>
              <div><strong>גודל חברה:</strong> ${escapeHtml(companySize)}</div>
              <div><strong>טלפון / נייד:</strong> ${escapeHtml(phone)}</div>
              <div><strong>מערכות ליבה:</strong> ${escapeHtml(erp)}</div>
            </div>
          </div>

          <!-- Financial ROI Box -->
          <div style="background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 16px 20px; color: #ffffff; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: #6ee7b7; margin-bottom: 10px;">
              תחזית חיסכון כספי ותפעולי (ROI Projections):
            </div>
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <div style="font-size: 11px; color: #a7f3d0; margin-bottom: 4px;">חיסכון חודשי בשעות</div>
                <div style="font-size: 20px; font-weight: 900; color: #ffffff;">${monthlyHours} שעות</div>
              </div>
              <div style="border-right: 1px solid #047857; padding-right: 20px;">
                <div style="font-size: 11px; color: #a7f3d0; margin-bottom: 4px;">חיסכון שנתי מוערך</div>
                <div style="font-size: 20px; font-weight: 900; color: #ffffff;">₪${Number(yearlySavingsNIS).toLocaleString()}</div>
              </div>
              <div style="border-right: 1px solid #047857; padding-right: 20px;">
                <div style="font-size: 11px; color: #a7f3d0; margin-bottom: 4px;">החזר השקעה (Payback)</div>
                <div style="font-size: 20px; font-weight: 900; color: #ffffff;">${payback} חודשים</div>
              </div>
            </div>
          </div>

          <!-- Executive Summary -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              1. תקציר מנהלים מאת הארכיטקט הראשי (Tech-Select Chief Architect)
            </div>
            <div style="background: #f1f5f9; border-right: 4px solid #0284c7; border-radius: 6px; padding: 12px 16px; font-size: 11.5px; line-height: 1.6; color: #1e293b;">
              ${escapeHtml(executiveSummary)}
            </div>
          </div>

          <!-- AI Opportunities Section (Part 1) -->
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
              2. יוזמות AI מותאמות לארגון (Key Opportunities):
            </div>
            ${oppsPage1
              .map(
                (opp, idx) => `
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 12.5px; font-weight: 800; color: #0284c7;">
                    ${idx + 1}. ${escapeHtml(opp.title || (opp as any).titleHe || 'יוזמת AI')}
                  </span>
                  <span style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                    ${escapeHtml(opp.category || 'פתרון ארגוני')}
                  </span>
                </div>
                <div style="font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 4px;">
                  <strong>אתגר:</strong> ${escapeHtml(opp.problemStatement || (opp as any).problemDescription || 'עומס תהליכי ידני')}
                </div>
                <div style="font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 6px;">
                  <strong>פתרון AI:</strong> ${escapeHtml(opp.aiSolution || 'אוטומציה ייעודית מבוססת מודלי שפה מאובטחים')}
                </div>
                <div style="display: flex; gap: 16px; font-size: 10.5px; color: #475569; font-weight: 600;">
                  <span>זמן פריסה מוערך: ${escapeHtml(opp.estimatedEffort || (opp as any).estimatedTimeToValue || '3-4 שבועות')}</span>
                  <span>חיסכון חודשי: ${opp.estimatedHoursSavedMonthly || 40} שעות</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        ${footerHtml}
      </div>
    `;

    // -------------------------------------------------------------
    // PAGE 2 HTML
    // -------------------------------------------------------------
    const page2Html = `
      <div class="pdf-page" style="${pageStyle}">
        <div>
          ${headerHtml(2)}

          ${
            oppsPage2.length > 0
              ? `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
                המשך יוזמות יישום בארגון:
              </div>
              ${oppsPage2
                .map(
                  (opp, idx) => `
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 12.5px; font-weight: 800; color: #0284c7;">
                      ${idx + 3}. ${escapeHtml(opp.title || (opp as any).titleHe || 'יוזמת AI')}
                    </span>
                    <span style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                      ${escapeHtml(opp.category || 'פתרון ארגוני')}
                    </span>
                  </div>
                  <div style="font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 4px;">
                    <strong>אתגר:</strong> ${escapeHtml(opp.problemStatement || (opp as any).problemDescription || 'עומס תהליכי ידני')}
                  </div>
                  <div style="font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 6px;">
                    <strong>פתרון AI:</strong> ${escapeHtml(opp.aiSolution || 'אוטומציה ייעודית מבוססת מודלי שפה מאובטחים')}
                  </div>
                  <div style="display: flex; gap: 16px; font-size: 10.5px; color: #475569; font-weight: 600;">
                    <span>זמן פריסה מוערך: ${escapeHtml(opp.estimatedEffort || (opp as any).estimatedTimeToValue || '3-4 שבועות')}</span>
                    <span>חיסכון חודשי: ${opp.estimatedHoursSavedMonthly || 40} שעות</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }

          <!-- Security Architecture Card (4 Tiers) -->
          <div style="background: #0b0f19; border: 1px solid #1e293b; border-radius: 10px; padding: 16px 20px; color: #ffffff; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: #38bdf8; margin-bottom: 10px;">
              3. ארכיטקטורת אבטחה ב-4 שכבות ומדיניות Zero Data Retention:
            </div>
            <div style="font-size: 11px; line-height: 1.6; color: #cbd5e1;">
              <div style="margin-bottom: 6px;">
                <strong style="color: #60a5fa;">• שכבה 1 (זהויות והרשאות):</strong> אימות מול Microsoft Entra ID עם MFA מותנה והקשחת הרשאות מינימליות (Least Privilege).
              </div>
              <div style="margin-bottom: 6px;">
                <strong style="color: #60a5fa;">• שכבה 2 (שער AI ו-DLP):</strong> מניעת דליפת מידע רגיש, סינון PII אוטומטי, והסכמי DPA המבטיחים שהמידע אינו משמש לאימון מודלים.
              </div>
              <div style="margin-bottom: 6px;">
                <strong style="color: #60a5fa;">• שכבה 3 (סוכני RAG מאובטחים):</strong> אינדוקס וקטורי מבודד השומר במדויק על מבנה התיקיות והרשאות המסמכים הארגוניים.
              </div>
              <div>
                <strong style="color: #60a5fa;">• שכבה 4 (תשתיות ואירוח):</strong> ענן פרטי מנוהל בישראל או אשכול GPU ייעודי בהתאם לדרישות הרגולציה והסודיות של הלקוח.
              </div>
            </div>
          </div>

          <!-- Why Tech-Select Pillars -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px;">
              4. מדוע ארגונים בוחרים ב-Tech-Select כשותף ה-IT וה-AI האסטרטגי:
            </div>
            <div style="font-size: 11px; line-height: 1.6; color: #1e293b;">
              <div style="margin-bottom: 4px;"><strong>1. ספק מורשה משרד הביטחון (0011033280):</strong> עמידה בתקני סייבר מחמירים, ביקורות תקופתיות וסודיות מלאה.</div>
              <div style="margin-bottom: 4px;"><strong>2. שילוב תלת-עולמי מנצח:</strong> שליטה מוחלטת ב-IT ארגוני, סייבר ו-DLP, ופיתוח תוכנה ייעודי עם ממשקי API.</div>
              <div style="margin-bottom: 4px;"><strong>3. מעל 15 שנה של ניסיון הנדסי:</strong> הובלה ישירה של גיא יעקובי בארכיטקטורות ענן היברידי ואינטגרציות מורכבות.</div>
              <div style="margin-bottom: 4px;"><strong>4. אינטגרציה עמוקה למערכות הליבה:</strong> חיבור שקוף לפריוריטי (Priority), SAP, Salesforce, Monday ועוד ללא השבתות.</div>
              <div><strong>5. שקיפות מלאה (FinOps) ו-SLA קשיח:</strong> מודל תמחור ברור, שליטה בעלויות API והטמעה מלאה בקרב צוות העובדים.</div>
            </div>
          </div>

          <!-- Contact & Next Steps Box -->
          <div style="background: #f8fafc; border: 2px solid #0284c7; border-radius: 10px; padding: 14px 18px;">
            <div style="font-size: 13px; font-weight: 800; color: #0284c7; margin-bottom: 4px;">
              שיחת ייעוץ אסטרטגית ותכנון מפת דרכים:
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">
              לתיאום פגישת ארכיטקטורה מותאמת אישית ותכנון פיילוט POC עם גיא יעקובי:
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; color: #0f172a; direction: rtl;">
              <div>📞 ישיר / וואטסאפ: 050-3900903</div>
              <div>🏢 משרד: 077-7700252</div>
              <div>✉️ מייל: Info@tech-select.co.il</div>
            </div>
          </div>
        </div>

        ${footerHtml}
      </div>
    `;

    container.innerHTML = page1Html + page2Html;
    document.body.appendChild(container);

    try {
      const pageElements = container.querySelectorAll('.pdf-page');

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x retina scale for crisp rendering
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          doc.addPage();
        }
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
    } finally {
      // Clean up DOM container
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  } else {
    // Basic fallback for non-DOM environments
    doc.text('Tech-Select AI Executive Assessment', 20, 20);
    doc.text(`Company: ${companyName}`, 20, 30);
  }

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
