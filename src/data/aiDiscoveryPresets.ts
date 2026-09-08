import { AIDiscoveryFormData, AIExcellenceReport, AIOpportunityItem, AIReadinessDimension, AIRoadmapPhase } from '../types';

export interface AIDiscoveryPreset {
  id: string;
  nameHe: string;
  nameEn: string;
  badgeHe: string;
  badgeEn: string;
  descriptionHe: string;
  descriptionEn: string;
  iconName: string;
  data: AIDiscoveryFormData;
}

export const AI_DISCOVERY_PRESETS: AIDiscoveryPreset[] = [
  {
    id: 'tech_saas',
    nameHe: 'חברת הייטק ו-SaaS (75 עובדים)',
    nameEn: 'Tech & SaaS Enterprise (75 Employees)',
    badgeHe: 'הייטק ופיתוח',
    badgeEn: 'High-Tech & R&D',
    descriptionHe: 'ארגון טכנולוגי המתמודד עם עומסי תקשורת, צורך בחיפוש ידע מהיר בקוד וב-Notion/Jira, ורצון באוטומציית מכירות ו-Onboarding.',
    descriptionEn: 'Tech company facing communication overload, internal knowledge fragmentation in Jira/Notion, and sales outreach automation.',
    iconName: 'Code2',
    data: {
      fullName: 'רועי שחר',
      email: 'roi@innovatetech.io',
      phone: '054-8899123',
      companyName: 'Innovate SaaS Ltd',
      role: 'executive',
      department: 'הנהלה ומוצר',
      companySize: '21-100',
      aiFamiliarity: 4,
      currentAITools: ['ChatGPT', 'Claude', 'GitHub Copilot'],
      industry: 'הייטק, תוכנה ו-Cloud',
      mainProcesses: ['פיתוח תוכנה', 'שיווק ומכירות B2B', 'תמיכת לקוחות Tier 1-2', 'גיוס ו-HR'],
      docStorage: ['SharePoint/OneDrive', 'Google Workspace', 'ERP/CRM Files'],
      hasM365: true,
      hasERP_CRM: true,
      erpCrmDetails: 'HubSpot CRM + Jira + Slack',
      sensitiveDataNature: ['Personal / PII / GDPR', 'Financial'],
      regulatoryRestrictions: 'SOC2 Type II, GDPR, ISO 27001',
      timeWastingActivities: [
        'Email management',
        'Document search & filing',
        'Meeting summaries & follow-ups',
        'Quote & Proposal creation'
      ],
      customPainPoints: 'העובדים משתמשים בכלי AI פרטיים ללא פיקוח (Shadow AI). המידע הארגוני מפוזר ב-Slack, Jira ו-Drive וקשה לחלץ תובנות מוצר.',
      estimatedDailyWastedHoursPerEmployee: 1.8,
      errorProneProcesses: 'העברת משימות מפגישות ל-Jira ומענה ראשוני ללקוחות חו״ל',
      dreamGoalTomorrow: 'פורטל AI פנימי מאובטח שמתחבר לכל בסיס הידע, מתמצת פגישות אוטומטית ומסייע לאנשי המכירות לבנות הצעות מחיר ברגע.',
      tasksToStopDoing: ['סיכום ידני של פגישות הנהלה', 'מענה ידני על שאלות חוזרות בתמיכה', 'חיפוש מסמכים ב-3 מערכות שונות'],
      decisionMetricsNeeded: ['משפך המכירות ושיעור ההמרה', 'עומס משימות פיתוח', 'קצב סגירת פניות תמיכה'],
      allowCloudExport: 'with_dpa_sso',
      complianceNeeds: ['SOC2', 'ISO 27001'],
      budgetHorizon: 'quarterly_roadmap'
    }
  },
  {
    id: 'law_finance',
    nameHe: 'משרד עורכי דין / שירותים פיננסיים (35 עובדים)',
    nameEn: 'Law & Corporate Finance Firm (35 Staff)',
    badgeHe: 'סודיות ורגולציה',
    badgeEn: 'High Confidentiality',
    descriptionHe: 'ארגון עתיר מסמכים, חוזים רגישים ומידע לקוחות חסוי. דורש הגנה מחמירה מפני דליפת מידע ופתרון AI עם איסור מוחלט על שימוש במידע ל-Training.',
    descriptionEn: 'Document-heavy organization with strict confidentiality, NDA contracts, and privacy requirements forbidding cloud data training.',
    iconName: 'Scale',
    data: {
      fullName: 'עו"ד דנה רוזנפלד',
      email: 'dana@rosen-law.co.il',
      phone: '052-4433211',
      companyName: 'רוזנפלד ושות׳ חברת עורכי דין',
      role: 'executive',
      department: 'שותפים ומשפט מסחרי',
      companySize: '21-100',
      aiFamiliarity: 3,
      currentAITools: ['ChatGPT'],
      industry: 'משפטים, ראיית חשבון ופיננסים',
      mainProcesses: ['ניתוח והשוואת חוזים', 'Due Diligence', 'רגולציה ודיווחים', 'ניהול תיקי לקוחות'],
      docStorage: ['Local File Server', 'SharePoint/OneDrive'],
      hasM365: true,
      hasERP_CRM: true,
      erpCrmDetails: 'עודכנית / פלטינום + M365 Business Premium',
      sensitiveDataNature: ['Financial', 'Legal / Medical', 'Personal / PII / GDPR'],
      regulatoryRestrictions: 'חוק הגנת הפרטיות 2024, חיסיון עו"ד-לקוח, תקנות הלבנת הון',
      timeWastingActivities: [
        'Document search & filing',
        'Manual data entry / Copy-paste',
        'Email management'
      ],
      customPainPoints: 'השוואה ידנית של הסכמים ארוכים (Redlining), חיפוש תקדימים בקלסרי עבר, וחשש כבד מעורכי דין שמעלים הסכמים סודיים ל-ChatGPT החינמי.',
      estimatedDailyWastedHoursPerEmployee: 2.2,
      errorProneProcesses: 'איתור סעיפי שיפוי והצמדה בהסכמים מרובי נספחים',
      dreamGoalTomorrow: 'מנוע חיפוש והשוואת חוזים פרטי (RAG מקומי) שפועל בתוך ה-Tenant הסגור של המשרד, מפיק השוואות בתוך שניות ומבטיח אפס דליפת מידע.',
      tasksToStopDoing: ['הקלדת נתונים מרובי שדות ממסמכי סריקה', 'קריאה חוזרת של 80 עמודי הסכם לאיתור סעיף בודד'],
      decisionMetricsNeeded: ['שעות חיוב פר לקוח', 'סטטוס בדיקות נאותות (Due Diligence)', 'רווחיות תיקים'],
      allowCloudExport: 'with_dpa_sso',
      complianceNeeds: ['ISO 27001', 'HIPAA/Privacy'],
      budgetHorizon: 'quarterly_roadmap'
    }
  },
  {
    id: 'defense_airgap',
    nameHe: 'סביבה ביטחונית / מפעל רגיש (120 עובדים)',
    nameEn: 'Defense & Classified Sector (120 Staff)',
    badgeHe: 'ספק משהב״ט & Air-Gap',
    badgeEn: 'MOD & Air-Gap Certified',
    descriptionHe: 'ארגון בעל סיווג ביטחוני, הפועל ברשתות נפרדות (Air-Gap) ומחייב מודלי AI מקומיים על גבי שרתי GPU פנימיים ללא חיבור לאינטרנט.',
    descriptionEn: 'Classified facility with air-gapped network requiring local GPU-based LLMs, zero cloud egress, and strict security clearance compliance.',
    iconName: 'ShieldAlert',
    data: {
      fullName: 'אלון ברק',
      email: 'alon.b@defensetech-sys.co.il',
      phone: '050-7766554',
      companyName: 'מערכות הגנה וטכנולוגיה בע״מ',
      role: 'it_director',
      department: 'מחשוב, אבטחת מידע ותשתיות',
      companySize: '101-500',
      aiFamiliarity: 3,
      currentAITools: ['None'],
      industry: 'תעשיות ביטחוניות, חומרה וסייבר',
      mainProcesses: ['הנדסה ופיתוח חומרה', 'ייצור מכלולים', 'בדיקות איכות ותקינה', 'ניהול שרשרת אספקה'],
      docStorage: ['Local File Server'],
      hasM365: false,
      hasERP_CRM: true,
      erpCrmDetails: 'Priority ERP On-Premise + SolidWorks PDM',
      sensitiveDataNature: ['Defense / Security IP', 'Financial'],
      regulatoryRestrictions: 'הנחיות מלמ״ב, ספק מורשה משרד הביטחון, תקן תעופה AS9100',
      timeWastingActivities: [
        'Document search & filing',
        'Technical troubleshooting',
        'Manual data entry / Copy-paste'
      ],
      customPainPoints: 'המהנדסים והטכנאים חסומים לחלוטין מאינטרנט. הם נאלצים לחפש במאות מדריכים טכניים ומפרטי רכיבים בקבצי PDF ידנית, מה שיוצר עיכובי ייצור.',
      estimatedDailyWastedHoursPerEmployee: 2.0,
      errorProneProcesses: 'הצלבת מספרי קטלוג בין שרטוטי הנדסה למערכת ה-ERP',
      dreamGoalTomorrow: 'שרת AI מקומי (On-Premise GPU) הפועל ברשת הסגורה (Air-Gapped), מאנדקס את כל ספרות התחזוקה ומאפשר למהנדסים לקבל תשובות טכניות מיידיות.',
      tasksToStopDoing: ['חיפוש ידני בתיקיות שרת של שרטוטים ישנים', 'הזנה כפולה של מק״טים'],
      decisionMetricsNeeded: ['זמני השבתת קווי ייצור', 'קצב סיום בקרות איכות', 'זמני אספקה'],
      allowCloudExport: 'strictly_local',
      complianceNeeds: ['MOD/Defense Approval', 'ISO 27001'],
      budgetHorizon: 'enterprise_transformation'
    }
  },
  {
    id: 'industry_logistics',
    nameHe: 'מפעל תעשייתי וחברת הפצה (180 עובדים)',
    nameEn: 'Industrial & Supply Chain Firm (180 Staff)',
    badgeHe: 'תעשייה ולוגיסטיקה',
    badgeEn: 'Manufacturing & Logistics',
    descriptionHe: 'ארגון תפעולי המשלב משרדים, מחסנים וקווי ייצור. צוואר הבקבוק העיקרי הוא קליטת הזמנות רכש, מענה ללקוחות והשוואת הצעות מחיר מספקים.',
    descriptionEn: 'Operational business combining manufacturing, warehouse logistics, PO intake bottlenecks, and supplier quote comparisons.',
    iconName: 'Factory',
    data: {
      fullName: 'מיכאל אהרוני',
      email: 'michael@isra-pack.co.il',
      phone: '053-9988776',
      companyName: 'ישרא-פאק תעשיות לוגיסטיקה',
      role: 'ceo',
      department: 'הנהלה כללית',
      companySize: '101-500',
      aiFamiliarity: 2,
      currentAITools: ['ChatGPT'],
      industry: 'תעשייה, ייצור, יבוא ולוגיסטיקה',
      mainProcesses: ['ניהול מלאי והפצה', 'שירות לקוחות והזמנות', 'רכש והתקשרויות ספקים', 'כספים והנהלת חשבונות'],
      docStorage: ['Local File Server', 'ERP/CRM Files', 'SharePoint/OneDrive'],
      hasM365: true,
      hasERP_CRM: true,
      erpCrmDetails: 'Priority ERP + Outlook + Excel',
      sensitiveDataNature: ['Financial', 'Standard Business'],
      regulatoryRestrictions: 'ISO 9001, ביקורות כספיות',
      timeWastingActivities: [
        'Manual data entry / Copy-paste',
        'Quote & Proposal creation',
        'Customer support repetitive queries',
        'Email management'
      ],
      customPainPoints: 'מאות הזמנות רכש מגיעות ב-PDF ובווטסאפ ומוקלדות ידנית ל-Priority. אנשי המכירות שורפים חצי יום על חישוב מחירי הובלה ותמחור.',
      estimatedDailyWastedHoursPerEmployee: 2.4,
      errorProneProcesses: 'הקלדת חשבוניות והזמנות ספקים מ-PDF ל-ERP',
      dreamGoalTomorrow: 'סוכן AI שקולט אוטומטית קובצי הזמנות רכש מספקים ומייצר פקודת יומן/הזמנה ב-Priority, ובוט שירות לקוחות שמשיב על סטטוס משלוח 24/7.',
      tasksToStopDoing: ['הקלדת הזמנות ידנית מ-PDF', 'חישובים חוזרים באקסלים למחירוני שילוח'],
      decisionMetricsNeeded: ['רווחיות פר הזמנה', 'זמני אספקה למחסן', 'מלאי מת'],
      allowCloudExport: 'with_dpa_sso',
      complianceNeeds: ['ISO 27001'],
      budgetHorizon: 'immediate_quick_win'
    }
  }
];

// Calculation Engine for AI Discovery Synthesis
export function generateExcellenceReport(data: AIDiscoveryFormData): AIExcellenceReport {
  const complianceNeeds = data.complianceNeeds || [];
  const docStorage = data.docStorage || [];
  const timeWastingActivities = data.timeWastingActivities || [];
  const currentAITools = data.currentAITools || [];
  const industry = data.industry || 'שירותים עסקיים ותעשייה';
  const companySize = data.companySize || '21-100';

  const isStrictLocal = data.allowCloudExport === 'strictly_local' || complianceNeeds.includes('MOD/Defense Approval');
  const isAirGap = isStrictLocal && industry.includes('ביטחון');
  const hasM365 = data.hasM365 ?? true;
  const companySizeNum = companySize === '1-20' ? 15 : companySize === '21-100' ? 65 : companySize === '101-500' ? 220 : 650;
  
  // Wasted hours calculations
  const wastedHoursPerDay = data.estimatedDailyWastedHoursPerEmployee || 1.8;
  const workDaysPerMonth = 22;
  const totalMonthlyHours = Math.round(companySizeNum * wastedHoursPerDay * workDaysPerMonth);
  const potentialSavingsRatio = 0.38; // 38% average AI automation target
  const monthlyHoursSaved = Math.round(totalMonthlyHours * potentialSavingsRatio);
  const annualHoursSaved = monthlyHoursSaved * 12;
  const avgHourlyCostNIS = 145; // average employee cost per hour
  const estimatedAnnualFinancialSavingsNIS = Math.round(annualHoursSaved * avgHourlyCostNIS * 0.75); // conservative factor
  const paybackMonths = isAirGap ? 4.5 : companySizeNum > 50 ? 2.8 : 3.5;

  // Scoring algorithm (objective mathematical grading)
  const techScore = hasM365 ? 82 : docStorage.includes('SharePoint/OneDrive') ? 74 : 58;
  const dataReadinessScore = docStorage.includes('Local File Server') && !docStorage.includes('SharePoint/OneDrive') ? 56 : 76;
  const processReadinessScore = timeWastingActivities.length >= 3 ? 84 : 68;
  const adoptionScore = ((data.aiFamiliarity || 3) * 16) + (currentAITools.includes('ChatGPT') ? 14 : 0);
  const securityScore = isStrictLocal ? 92 : complianceNeeds.length > 0 ? 84 : 68;
  const governanceScore = currentAITools.length > 0 && !hasM365 ? 44 : 68; // shadow AI penalty

  const overallReadinessScore = Math.round((techScore * 0.2) + (dataReadinessScore * 0.15) + (processReadinessScore * 0.25) + (adoptionScore * 0.15) + (securityScore * 0.15) + (governanceScore * 0.1));
  const securityReadinessScore = securityScore;
  const automationPotentialScore = Math.min(96, Math.round(processReadinessScore * 1.08));

  // Build Dimensions
  const dimensions: AIReadinessDimension[] = [
    {
      key: 'technology',
      labelHe: 'תשתיות וטכנולוגיה',
      labelEn: 'Technology & Cloud Foundation',
      score: techScore,
      target: 92,
      benchmark: 65,
      summaryHe: hasM365 ? 'תשתית Microsoft 365 מהווה בסיס מצוין להטמעה ישירה' : 'נדרש יישור קו בתשתיות ענן או הקמת שרת בינה מלאכותית ייעודי',
      summaryEn: hasM365 ? 'Existing M365 environment provides rapid deployment readiness' : 'Requires baseline cloud consolidation or dedicated AI host'
    },
    {
      key: 'data',
      labelHe: 'מוכנות ואינדוקס דאטה',
      labelEn: 'Data Readiness & Governance',
      score: dataReadinessScore,
      target: 88,
      benchmark: 58,
      summaryHe: docStorage.includes('Local File Server') ? 'מידע מבוזר דורש תהליך RAG והגדרת הרשאות קפדנית' : 'מאגרי המידע נגישים ומאפשרים אינדוקס מהיר',
      summaryEn: 'Internal repositories require structured indexing and permission matrix'
    },
    {
      key: 'processes',
      labelHe: 'פוטנציאל אוטומציית תהליכים',
      labelEn: 'Process Automation Potential',
      score: processReadinessScore,
      target: 95,
      benchmark: 60,
      summaryHe: `זוהו ${Math.max(1, timeWastingActivities.length)} תהליכי ליבה עם צווארי בקבוק וחיסכון משמעותי`,
      summaryEn: `Identified ${Math.max(1, timeWastingActivities.length)} core business bottlenecks with high ROI`
    },
    {
      key: 'adoption',
      labelHe: 'אימוץ עובדים ו-AI Literacy',
      labelEn: 'Employee AI Literacy',
      score: Math.min(95, Math.round(adoptionScore)),
      target: 90,
      benchmark: 52,
      summaryHe: 'פתיחות גבוהה לשילוב AI לצד צורך בהדרכות פרקטיות ונהלי עבודה',
      summaryEn: 'High employee appetite, requiring structured enablement and guidelines'
    },
    {
      key: 'security',
      labelHe: 'אבטחת מידע וסודיות (Cyber/Privacy)',
      labelEn: 'Security & Data Privacy',
      score: securityScore,
      target: 96,
      benchmark: 64,
      summaryHe: isStrictLocal ? 'דרישת Air-Gap / On-Prem מחייבת שרת מקומי חסין' : 'נדרש Tenant ארגוני עם DPA ואיסור אימון על נתוני החברה',
      summaryEn: isStrictLocal ? 'Air-Gap environment requires on-prem GPU hosting' : 'Enterprise tenant with zero-retention DPA required'
    },
    {
      key: 'governance',
      labelHe: 'ממשל AI ומניעת Shadow AI',
      labelEn: 'AI Governance & Shadow AI Risk',
      score: governanceScore,
      target: 85,
      benchmark: 40,
      summaryHe: governanceScore < 50 ? 'סיכון מוגבר ל-Shadow AI ושימוש בכלים פרטיים ללא ניטור' : 'קיימת מודעות ונדרשת מדיניות ארגונית מוסדרת',
      summaryEn: governanceScore < 50 ? 'Elevated Shadow AI risk from unmanaged consumer tools' : 'Solid baseline requiring formal enterprise policy'
    }
  ];

  // Dynamic Opportunities Generation
  const opportunities: AIOpportunityItem[] = [];

  // Opp 1: Knowledge AI / RAG
  opportunities.push({
    id: 'opp-rag-knowledge',
    title: 'חיפוש חכם ואיחזור ידע במסמכי הארגון (Enterprise RAG)',
    titleEn: 'Enterprise RAG & Internal Knowledge Engine',
    department: 'כלל הארגון / הנהלה ותפעול',
    departmentEn: 'All Departments / Operations',
    category: 'knowledge',
    problemStatement: 'חיפוש ידני ומייגע של מסמכים, נהלים, חוזים ומפרטים המפוזרים בתיקיות ובמערכות שונות.',
    aiSolution: isStrictLocal
      ? 'הקמת מנוע RAG מקומי על שרת GPU מבודד (Llama 3 / DeepSeek On-Prem) המאנדקס את כלל קבצי החברה בתוך הרשת המקומית.'
      : 'שכבת AI Orchestration + RAG המאנדקסת את SharePoint/ERP ומאפשרת לשאול שאלות ולקבל תשובה מצוטטת עם מקור מדויק.',
    howItWorks: 'סריקה רציפה של המאגרים הארגוניים תוך כיבוד הרשאות הגישה הקיימות של העובד (RBAC).',
    businessValue: `חיסכון של 45-60 דקות ביום לעובד, מניעת טעויות והנגשת מידע קריטי להנהלה ברגע.`,
    impactScore: 9,
    complexityScore: isStrictLocal ? 6 : 4,
    securityRiskScore: 2,
    estimatedEffort: isStrictLocal ? 'Weeks' : 'Days',
    priority: 'CRITICAL',
    recommendedTech: isStrictLocal ? 'Private Local LLM + Vector DB On-Prem' : (hasM365 ? 'Microsoft 365 Copilot Studio / Azure RAG' : 'Private Enterprise RAG Gateway'),
    techType: isStrictLocal ? 'private_llm' : 'rag_knowledge',
    estimatedHoursSavedMonthly: Math.round(companySizeNum * 12)
  });

  // Opp 2: Workflow / Email & Meeting Automation
  if (timeWastingActivities.includes('Email management') || timeWastingActivities.includes('Meeting summaries & follow-ups')) {
    opportunities.push({
      id: 'opp-meeting-email',
      title: 'אוטומציית מיילים, סיכומי פגישות ומעקב משימות',
      titleEn: 'Executive Communication & Meeting AI Agent',
      department: 'הנהלה, שיווק וניהול פרויקטים',
      departmentEn: 'Management & Project Leads',
      category: 'quick_win',
      problemStatement: 'זמן רב מושקע בניסוח מיילים, מענה חוזר לפניות, וסיכום ידני של ישיבות עבודה ופרויקטים.',
      aiSolution: 'סוכן AI המחובר לתיבת הדואר ולפגישות (Teams / Zoom), מתמצת שיחות, מחלץ משימות ורושם טיוטות מענה מאושרות.',
      howItWorks: 'הפקת סיכום פגישה מובנה תוך 60 שניות מסיום השיחה, חלוקת משימות אחראים ותזכורות אוטומטיות.',
      businessValue: 'קיצור זמני תגובה ב-70%, שקיפות ניהולית מלאה ושחרור שעות ניהול יקרות להובלה אסטרטגית.',
      impactScore: 8,
      complexityScore: 3,
      securityRiskScore: 3,
      estimatedEffort: 'Days',
      priority: 'HIGH',
      recommendedTech: hasM365 ? 'Copilot for M365 + Power Automate' : 'Custom Secure AI Agent with SSO',
      techType: hasM365 ? 'copilot_m365' : 'custom_agent',
      estimatedHoursSavedMonthly: Math.round(companySizeNum * 8)
    });
  }

  // Opp 3: Data Entry & ERP / CRM Automation
  if (timeWastingActivities.includes('Manual data entry / Copy-paste') || timeWastingActivities.includes('Quote & Proposal creation')) {
    opportunities.push({
      id: 'opp-data-erp',
      title: 'קליטה אוטומטית של הזמנות רכש, הצעות מחיר וחשבוניות (Document AI)',
      titleEn: 'Document AI & ERP Data Entry Automation',
      department: 'כספים, רכש ותפעול',
      departmentEn: 'Finance, Procurement & Ops',
      category: 'productivity',
      problemStatement: 'הקלדה ידנית של קובצי PDF, הזמנות מספקים וחשבוניות לתוך מערכת ה-ERP/CRM, הגורמת לעיכובים וטעויות אנוש.',
      aiSolution: 'צינור Document AI חכם שקורא מסמכי ספקים, מחלץ שדות מק״ט, כמויות ומחירים, ומזין פקודת יומן/הזמנה ב-ERP.',
      howItWorks: 'OCR מתקדם עם מודל שפה מובנה המאמת נתונים מול מחירוני עבר ומסמן חריגות לאישור אנושי בלחיצה.',
      businessValue: 'אפס טעויות הקלדה, חיסכון של 85% בזמן עיבוד מסמך והאצת אספקות.',
      impactScore: 9,
      complexityScore: 5,
      securityRiskScore: 3,
      estimatedEffort: 'Weeks',
      priority: 'CRITICAL',
      recommendedTech: 'AI Gateway + Python Integration / ERP API Connector',
      techType: 'custom_agent',
      estimatedHoursSavedMonthly: Math.round(companySizeNum * 10)
    });
  }

  // Opp 4: Customer Support / Internal Helpdesk
  if (timeWastingActivities.includes('Customer support repetitive queries') || timeWastingActivities.includes('Technical troubleshooting')) {
    opportunities.push({
      id: 'opp-ai-helpdesk',
      title: 'מוקד תמיכה וסיוע טכני חכם (AI Helpdesk Tier-1)',
      titleEn: 'Smart AI Helpdesk & Customer Support Copilot',
      department: 'שירות לקוחות, IT ותמיכה טכנית',
      departmentEn: 'Customer Support & IT Helpdesk',
      category: 'service',
      problemStatement: 'עומס פניות חוזרות בנושאי תמיכה בסיסיים, הגדרות, סטטוס הזמנות ותקלות נפוצות.',
      aiSolution: 'סוכן AI ייעודי הפותר 40%-60% מהפניות השגרתיות באופן אוטונומי, ומכין תקציר ופתרון מוצע לנציג בפניות מורכבות.',
      howItWorks: 'אינטגרציה לפורטל תמיכה / WhatsApp / מייל עם חיבור לבסיס הידע ונהלי השירות של החברה.',
      businessValue: 'מענה מיידי 24/7 ללקוחות ועובדים, צמצום זמני המתנה ושיפור דרמטי בשביעות הרצון.',
      impactScore: 8,
      complexityScore: 4,
      securityRiskScore: 3,
      estimatedEffort: 'Weeks',
      priority: 'HIGH',
      recommendedTech: 'Multi-Channel AI Agent + Knowledge Base RAG',
      techType: 'custom_agent',
      estimatedHoursSavedMonthly: Math.round(companySizeNum * 7)
    });
  }

  // Opp 5: Cyber & Security / Shadow AI Mitigation
  opportunities.push({
    id: 'opp-ai-security-governance',
    title: 'ממשל אבטחה, הגנת DLP וחסימת Shadow AI',
    titleEn: 'AI Security Governance, DLP & Shadow AI Mitigation',
    department: 'אבטחת מידע, הנהלה ו-IT',
    departmentEn: 'Cybersecurity, CISO & IT',
    category: 'cyber',
    problemStatement: 'שימוש לא מבוקר של עובדים בכלים ציבוריים עלול לחשוף מידע מסחרי רגיש, קוד מקור וסודות עסקיים.',
    aiSolution: 'הטמעת AI Gateway ארגוני עם מנגנון מניעת דליפת מידע (DLP), הצפנה, התחברות ב-SSO וניטור מלא של כלל השאילתות.',
    howItWorks: 'ערוץ גישה מאושר ומאובטח המנקה מידע רגיש (PII Anonymization) ומבטיח עמידה ברגולציה ובדרישות DPA.',
    businessValue: 'שליטה מלאה של ה-CISO וההנהלה, אפס דליפות מידע ועמידה בתקני ISO 27001 / SOC2.',
    impactScore: 9,
    complexityScore: 3,
    securityRiskScore: 1,
    estimatedEffort: 'Days',
    priority: 'CRITICAL',
    recommendedTech: isStrictLocal ? 'Air-Gap Local Security Isolation' : 'Enterprise AI Gateway + Microsoft Entra ID SSO',
    techType: 'hybrid_gateway',
    estimatedHoursSavedMonthly: Math.round(companySizeNum * 4)
  });

  // Recommended Architecture
  const architecture = {
    layerIdentity: hasM365 ? 'Microsoft Entra ID (Azure AD) + MFA & Conditional Access' : 'Enterprise SSO / Identity Provider',
    layerGateway: isStrictLocal ? 'Local Air-Gap Security Enclave' : 'Tech-Select AI Orchestrator & DLP Anonymizer',
    layerKnowledge: docStorage.includes('SharePoint/OneDrive') ? 'SharePoint Enterprise Graph + Vector DB' : 'Encrypted Hybrid RAG Knowledge Store',
    layerEngines: isStrictLocal 
      ? ['On-Premise GPU Cluster', 'Enterprise Local LLM Engine (Air-Gapped)', 'Local Vector Embeddings']
      : hasM365
        ? ['Microsoft 365 Copilot Core', 'Enterprise Cloud AI (Zero-Retention DPA)', 'Secure Enterprise API Gateway']
        : ['Enterprise AI Orchestration Gateway', 'Custom Python Automation Microservices'],
    hostingType: (isStrictLocal ? 'Private Air-Gap / On-Prem' : (hasM365 ? 'Enterprise Tenant' : 'Hybrid Gateway')) as any
  };

  // Security Assessment Details
  const securityAssessment = {
    overallStatus: (isStrictLocal ? 'High-Risk Sensitive' : complianceNeeds.length > 0 ? 'Requires Controls' : 'Secure & Ready') as any,
    keyRisks: [
      'שימוש בלתי מנוטר בכלי AI ציבוריים חינמיים ע״י עובדים (Shadow AI)',
      'חשיפת נתוני לקוחות, חוזים ומידע פיננסי למודלים המאמנים על נתוני קצה',
      docStorage.includes('Local File Server') ? 'חוסר בהרשאות גישה גרנולריות (RBAC) במאגרי הקבצים הישנים' : 'צורך בהגדרת מדיניות שימור מידע ומחיקה אוטומטית (DPA)'
    ],
    safeguards: [
      'הסכם עיבוד נתונים ארגוני (Zero Data Retention DPA)',
      'הצפנה מלאה מקצה לקצה במנוחה ובתנועה (AES-256 / TLS 1.3)',
      'הפרדת סביבות מוחלטת (Tenant Isolation)',
      'Audit Logging מלא לכלל הפעולות והשאילתות'
    ],
    shadowAIPenetrationRisk: (governanceScore < 50 ? 'High' : 'Medium') as any
  };

  // Roadmap (4 Phases)
  const roadmap: AIRoadmapPhase[] = [
    {
      phaseNumber: 1,
      timeline: '0–30 ימים',
      timelineEn: '0–30 Days',
      titleHe: 'שלב 1: יישור קו, מדיניות ו-Quick Wins',
      titleEn: 'Phase 1: Foundation, Policy & Quick Wins',
      descriptionHe: 'סגירת פרצות Shadow AI, הגדרת מדיניות ארגונית, חיבור SSO והפעלת כלי פרודוקטיביות מיידיים.',
      descriptionEn: 'Shadow AI lockdown, enterprise governance policy, SSO integration and immediate productivity enablement.',
      initiatives: [
        'גיבוש מדיניות AI ארגונית מחייבת (AI Acceptable Use Policy)',
        'חסימת כלים חינמיים לא מאובטחים וחיבור פורטל AI ארגוני מאובטח',
        'הפעלת סיכומי פגישות ואוטומציית תקשורת להנהלה'
      ],
      deliverables: ['מסמך מדיניות AI', 'פורטל מאובטח מחובר SSO', 'סדנת הדרכה מרוכזת להנהלה'],
      kpi: 'חיסכון של 15 שעות שבועיות להנהלה ו-100% הגנה מפני דליפת מידע',
      investmentLevel: 'Low'
    },
    {
      phaseNumber: 2,
      timeline: '30–90 ימים',
      timelineEn: '30–90 Days',
      titleHe: 'שלב 2: אינדוקס ידע ארגוני ואוטומציית מסמכים (RAG)',
      titleEn: 'Phase 2: Enterprise Knowledge Base & Document Automation',
      descriptionHe: 'חיבור מאגרי המידע הארגוניים (SharePoint/ERP/קבצים), הקמת מנוע RAG והטמעת קריאת מסמכים אוטומטית.',
      descriptionEn: 'Connecting internal storage (SharePoint/ERP), deploying RAG knowledge search and OCR document processing.',
      initiatives: [
        'מיפוי ואינדוקס מאגרי מסמכים, נהלים וחוזים עם הרשאות RBAC',
        'בניית סוכן חיפוש ידע חכם לכלל עובדי החברה',
        'אוטומציית קליטת חשבוניות / הזמנות רכש מ-PDF למערכת הניהול'
      ],
      deliverables: ['מנוע חיפוש ידע פעיל', 'צינור קליטת מסמכים אוטומטי', 'דשבורד מעקב שימוש'],
      kpi: 'צמצום של 65% בזמני איתור מידע ו-80% הפחתה בהקלדה ידנית',
      investmentLevel: 'Medium'
    },
    {
      phaseNumber: 3,
      timeline: '90–180 ימים',
      timelineEn: '90–180 Days',
      titleHe: 'שלב 3: סוכני AI אוטונומיים ואינטגרציית ליבה',
      titleEn: 'Phase 3: Autonomous AI Agents & Core Integrations',
      descriptionHe: 'הקמת סוכני AI מותאמים אישית לשירות לקוחות, תמיכה טכנית, מכירות וסינכרון ישיר ל-ERP/CRM.',
      descriptionEn: 'Custom AI agents for customer operations, IT support, automated pricing and bi-directional ERP sync.',
      initiatives: [
        'השקת AI Helpdesk לטיפול עצמאי בפניות שגרתיות 24/7',
        'אוטומציית הצעות מחיר ובדיקות התאמה ללקוחות',
        isStrictLocal ? 'שדרוג יכולות שרת ה-GPU המקומי למודלים רב-מודאליים' : 'אינטגרציות API עמוקות לכלל מערכות ה-SaaS'
      ],
      deliverables: ['מוקד תמיכה אוטומטי', 'מחולל הצעות מחיר חכם', 'API Connectors מלאים'],
      kpi: 'פתרון אוטומטי של 50% מפניות התמיכה והכפלת מהירות הפקת הצעות מחיר',
      investmentLevel: 'Medium'
    },
    {
      phaseNumber: 4,
      timeline: '180+ ימים',
      timelineEn: '180+ Days',
      titleHe: 'שלב 4: טרנספורמציה ארגונית מבוססת AI (AI-Driven Enterprise)',
      titleEn: 'Phase 4: Full AI Transformation & Continuous Intelligence',
      descriptionHe: 'הפיכת הארגון ל-AI-First: דשבורדים חיזויים להנהלה, אופטימיזציית FinOps שוטפת ושיפור מודלים מתמיד.',
      descriptionEn: 'AI-First company culture: Predictive executive dashboards, continuous FinOps cost governance, and model fine-tuning.',
      initiatives: [
        'דשבורד חיזוי ביצועים עסקיים ותובנות מגמה להנהלה',
        'בקרה ו-FinOps תקציבי למניעת עלויות טוקנים מיותרות',
        'הערכת מוכנות חוזרת (Assessment v2) למדידת התקדמות והתפתחות'
      ],
      deliverables: ['Executive AI Dashboard', 'FinOps Cost Governor', 'דוח AI Excellence מעודכן (v2)'],
      kpi: 'עלייה מציון מוכנות 54/100 ל-90/100 ושיפור תפוקה כולל של 35%',
      investmentLevel: 'Strategic'
    }
  ];

  return {
    id: `TS-AID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    generatedAt: new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' }),
    version: 'v1.0 (Official Assessment)',
    companyName: data.companyName || 'ארגון עסקי',
    contactPerson: data.fullName || 'מנהל מוביל',
    role: data.role === 'ceo' ? 'מנכ״ל / בעלים' : data.role === 'executive' ? 'הנהלה בכירה' : data.role === 'it_director' ? 'מנהל IT וטכנולוגיה' : 'מנהל פעילות',
    companySize: `${companySizeNum} עובדים`,
    industry: data.industry || 'כללי',
    overallReadinessScore,
    securityReadinessScore,
    automationPotentialScore,
    governanceScore,
    dimensions,
    opportunities,
    roi: {
      monthlyHoursSaved,
      annualHoursSaved,
      estimatedAnnualFinancialSavingsNIS,
      paybackMonths
    },
    recommendedArchitecture: architecture,
    securityAssessment,
    roadmap,
    employeeSurveySummary: {
      totalResponses: Math.max(12, Math.round(companySizeNum * 0.45)),
      topWishes: [
        'אוטומציה לסיכום פגישות ומענה למיילים (78%)',
        'חיפוש מהיר במסמכי החברה ומציאת חוזים ישנים (72%)',
        'הפסקת הקלדה ידנית מ-PDF ל-ERP (64%)',
        'מענה אוטומטי לשאלות לקוחות חוזרות (58%)'
      ],
      adoptionRate: 68,
      sentimentScore: 84
    }
  };
}

// Normalization Engine: Safely bridges raw backend Gemini outputs with strict AIExcellenceReport interface
export function normalizeAIReport(
  raw: any,
  fallback: AIExcellenceReport
): AIExcellenceReport {
  if (!raw) return fallback;

  // 1. Basic metadata
  const companyName = raw.companyName || fallback.companyName;
  const contactPerson = raw.contactPerson || raw.contactName || fallback.contactPerson;
  const role = raw.role || fallback.role;
  const companySize = raw.companySize || fallback.companySize;
  const industry = raw.industry || fallback.industry;

  // 2. Scores
  const overallReadinessScore = Number(raw.overallReadinessScore) || fallback.overallReadinessScore;
  const securityReadinessScore = Number(raw.securityReadinessScore) || fallback.securityReadinessScore;
  const automationPotentialScore = Number(raw.automationPotentialScore) || fallback.automationPotentialScore;
  const governanceScore = Number(raw.governanceScore || (100 - (Number(raw.shadowAIRiskScore) || 32))) || fallback.governanceScore;

  // 3. ROI Quantification
  const monthlyHours = Number(
    raw.roi?.monthlyHoursSaved || 
    raw.financialAnalysis?.estimatedMonthlyHoursSaved || 
    fallback.roi.monthlyHoursSaved
  );
  const annualHours = Number(
    raw.roi?.annualHoursSaved || 
    (monthlyHours * 12) || 
    fallback.roi.annualHoursSaved
  );
  const savingsNIS = Number(
    raw.roi?.estimatedAnnualFinancialSavingsNIS || 
    raw.financialAnalysis?.estimatedYearlySavingsNIS || 
    fallback.roi.estimatedAnnualFinancialSavingsNIS
  );
  const payback = Number(
    raw.roi?.paybackMonths || 
    raw.financialAnalysis?.paybackPeriodMonths || 
    fallback.roi.paybackMonths
  );

  const roi = {
    monthlyHoursSaved: monthlyHours,
    annualHoursSaved: annualHours,
    estimatedAnnualFinancialSavingsNIS: savingsNIS,
    paybackMonths: payback
  };

  // 4. Assessment Dimensions
  let dimensions = fallback.dimensions;
  if (Array.isArray(raw.dimensions) && raw.dimensions.length > 0 && raw.dimensions[0]?.key) {
    dimensions = raw.dimensions;
  } else if (Array.isArray(raw.radarMetrics) && raw.radarMetrics.length > 0) {
    dimensions = raw.radarMetrics.map((rm: any, idx: number) => ({
      key: rm.key || `dimension_${idx + 1}`,
      labelHe: rm.axis || rm.labelHe || `ציר ${idx + 1}`,
      labelEn: rm.axisEn || rm.labelEn || `Dimension ${idx + 1}`,
      score: Number(rm.score) || 75,
      target: Number(rm.targetScore || rm.target) || 90,
      benchmark: Number(rm.industryAvg || rm.benchmark) || 55,
      summaryHe: rm.description || rm.summaryHe || 'מיפוי והמלצה מערכתית',
      summaryEn: rm.descriptionEn || rm.summaryEn || 'Systemic recommendation'
    }));
  }

  // 5. Portfolio Opportunities
  let opportunities = fallback.opportunities;
  if (Array.isArray(raw.opportunities) && raw.opportunities.length > 0) {
    opportunities = raw.opportunities.map((opp: any, idx: number) => {
      const fallbackOpp = fallback.opportunities[idx % fallback.opportunities.length] || fallback.opportunities[0];
      return {
        id: opp.id || `opp-${idx + 1}`,
        title: opp.title || opp.titleHe || fallbackOpp?.title || 'יוזמת AI מותאמת',
        titleEn: opp.titleEn || fallbackOpp?.titleEn || opp.title || 'AI Initiative',
        department: opp.department || opp.category || fallbackOpp?.department || 'כלל הארגון',
        departmentEn: opp.departmentEn || fallbackOpp?.departmentEn || 'Enterprise',
        category: opp.category || fallbackOpp?.category || 'productivity',
        problemStatement: opp.problemStatement || opp.problemDescription || fallbackOpp?.problemStatement || 'עומס תהליכי ידני',
        aiSolution: opp.aiSolution || fallbackOpp?.aiSolution || 'הטמעת כלי AI מאובטח',
        howItWorks: opp.howItWorks || opp.workflow || fallbackOpp?.howItWorks || 'אינטגרציה מאובטחת לתשתיות הארגון',
        businessValue: opp.businessValue || opp.value || fallbackOpp?.businessValue || 'חיסכון ישיר בשעות עבודה',
        impactScore: Number(opp.impactScore) || (opp.impact === 'Critical' ? 9 : opp.impact === 'High' ? 8 : 7),
        complexityScore: Number(opp.complexityScore) || (opp.complexity === 'High' ? 6 : opp.complexity === 'Medium' ? 4 : 2),
        securityRiskScore: Number(opp.securityRiskScore) || 2,
        estimatedEffort: opp.estimatedEffort || opp.estimatedTimeToValue || 'Weeks',
        priority: (opp.priority || (opp.impact === 'Critical' ? 'CRITICAL' : opp.impact === 'High' ? 'HIGH' : 'MEDIUM')) as any,
        recommendedTech: opp.recommendedTech || (Array.isArray(opp.recommendedTools) ? opp.recommendedTools.join(', ') : fallbackOpp?.recommendedTech || 'AI Gateway & RAG'),
        techType: opp.techType || fallbackOpp?.techType || 'custom_agent',
        estimatedHoursSavedMonthly: Number(opp.estimatedHoursSavedMonthly) || fallbackOpp?.estimatedHoursSavedMonthly || 40
      };
    });
  }

  // 6. Recommended Architecture Blueprint
  let recommendedArchitecture = fallback.recommendedArchitecture;
  if (raw.recommendedArchitecture && raw.recommendedArchitecture.layerIdentity) {
    recommendedArchitecture = raw.recommendedArchitecture;
  } else if (raw.architectureRecommendations) {
    const arch = raw.architectureRecommendations;
    recommendedArchitecture = {
      layerIdentity: arch.tier1_Identity || fallback.recommendedArchitecture.layerIdentity,
      layerGateway: arch.tier2_Gateway || fallback.recommendedArchitecture.layerGateway,
      layerKnowledge: arch.tier3_DataPipeline || fallback.recommendedArchitecture.layerKnowledge,
      layerEngines: Array.isArray(arch.tier4_ModelCluster) 
        ? arch.tier4_ModelCluster 
        : [arch.tier4_ModelCluster || 'Enterprise Azure OpenAI / Anthropic Private / Local GPU'],
      hostingType: fallback.recommendedArchitecture.hostingType
    };
  }

  // 7. Security Assessment
  let securityAssessment = fallback.securityAssessment;
  if (raw.securityAssessment && raw.securityAssessment.overallStatus) {
    securityAssessment = raw.securityAssessment;
  }

  // 8. Roadmap Phases
  let roadmap = fallback.roadmap;
  if (Array.isArray(raw.roadmap) && raw.roadmap.length > 0 && raw.roadmap[0]?.titleHe) {
    roadmap = raw.roadmap;
  } else if (Array.isArray(raw.roadmapPhases) && raw.roadmapPhases.length > 0) {
    roadmap = raw.roadmapPhases.map((rp: any, idx: number) => {
      const fbPhase = fallback.roadmap[idx % fallback.roadmap.length] || fallback.roadmap[0];
      return {
        phaseNumber: idx + 1,
        timeline: rp.timeline || fbPhase?.timeline || `חודש ${idx + 1}`,
        timelineEn: rp.timelineEn || fbPhase?.timelineEn || `Month ${idx + 1}`,
        titleHe: rp.phase || rp.titleHe || fbPhase?.titleHe || `שלב ${idx + 1}`,
        titleEn: rp.titleEn || fbPhase?.titleEn || `Phase ${idx + 1}`,
        descriptionHe: Array.isArray(rp.goals) ? rp.goals.join('. ') : (rp.descriptionHe || fbPhase?.descriptionHe || ''),
        descriptionEn: fbPhase?.descriptionEn || '',
        initiatives: Array.isArray(rp.goals) ? rp.goals : (fbPhase?.initiatives || []),
        deliverables: Array.isArray(rp.deliverables) ? rp.deliverables : (fbPhase?.deliverables || []),
        kpi: rp.kpi || fbPhase?.kpi || 'השגת יעדי החיסכון והבטיחות שנקבעו',
        investmentLevel: fbPhase?.investmentLevel || 'Strategic'
      };
    });
  }

  return {
    id: raw.id || fallback.id,
    generatedAt: raw.generatedAt || fallback.generatedAt,
    version: raw.version || fallback.version,
    companyName,
    contactPerson,
    role,
    companySize,
    industry,
    overallReadinessScore,
    securityReadinessScore,
    automationPotentialScore,
    governanceScore,
    dimensions,
    opportunities,
    roi,
    recommendedArchitecture,
    securityAssessment,
    roadmap,
    executiveSummary: raw.executiveSummary || fallback.executiveSummary,
    customNotes: raw.customNotes,
    emailSentStatus: raw.emailSentStatus,
    employeeSurveySummary: fallback.employeeSurveySummary
  };
}
