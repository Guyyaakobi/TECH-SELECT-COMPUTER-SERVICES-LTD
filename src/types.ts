export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  shortDesc: string;
  fullDesc: string;
  titleEn?: string;
  subtitleEn?: string;
  shortDescEn?: string;
  fullDescEn?: string;
  iconName: string;
  features: string[];
  featuresEn?: string[];
  techStack: string[];
  benefits: string[];
  benefitsEn?: string[];
  sla: string;
  slaEn?: string;
  popular?: boolean;
  highlightHe?: string;
  highlightEn?: string;
  highlightBadgeHe?: string;
  highlightBadgeEn?: string;
}

export interface SectorItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  challenges: string[];
  solutions: string[];
}

export interface ArticleItem {
  id: string;
  title: string;
  titleEn?: string;
  category: 'cyber' | 'cloud' | 'it-management' | 'backup' | 'network' | 'hardware' | 'ai-security';
  categoryLabel: string;
  categoryLabelEn?: string;
  summary: string;
  summaryEn?: string;
  content: string;
  contentEn?: string;
  readTime: string;
  readTimeEn?: string;
  date: string;
  author: string;
  authorEn?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface ITCalculatorState {
  workstations: number;
  servers: number;
  cloudUsers: number;
  securityTier: 'basic' | 'pro' | 'enterprise';
  backupNeeded: boolean;
  supportHours: 'business' | 'extended' | '24_7';
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    points: number;
    explanation?: string;
  }[];
}

// ==========================================
// AI Discovery & Excellence Framework Types
// ==========================================

export type AIRoleLevel = 'ceo' | 'executive' | 'dept_head' | 'it_director' | 'employee' | 'other';
export type AISecurityRequirement = 'standard_cloud' | 'enterprise_tenant' | 'api_tokens' | 'private_onprem' | 'air_gap_defense';
export type AITechStackCategory = 'copilot_m365' | 'rag_knowledge' | 'private_llm' | 'custom_agent' | 'hybrid_gateway' | 'finops_ai';

export interface AIDiscoveryFormData {
  // Step 1: Profile
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  role: AIRoleLevel;
  customRole?: string;
  department: string;
  companySize: string; // "1-20", "21-100", "101-500", "500+"
  aiFamiliarity: number; // 1-5
  currentAITools: string[]; // ["ChatGPT", "Microsoft Copilot", "Claude", "Gemini", "Internal AI", "None"]
  
  // Step 2: Organization & Tech Ecosystem
  industry: string;
  mainProcesses: string[];
  docStorage: string[]; // ["SharePoint/OneDrive", "Google Workspace", "Local File Server", "ERP/CRM Files", "Paper/Physical"]
  hasM365: boolean;
  hasERP_CRM: boolean;
  erpCrmDetails?: string;
  sensitiveDataNature: string[]; // ["Financial", "Personal / PII / GDPR", "Defense / Security IP", "Legal / Medical", "Standard Business"]
  regulatoryRestrictions: string;
  
  // Step 3: Pain Points & Bottlenecks
  timeWastingActivities: string[]; // ["Email management", "Document search & filing", "Manual data entry / Copy-paste", "Quote & Proposal creation", "Customer support repetitive queries", "Meeting summaries & follow-ups", "Technical troubleshooting"]
  customPainPoints: string;
  estimatedDailyWastedHoursPerEmployee: number; // e.g. 1.5 hours
  errorProneProcesses: string;
  
  // Step 4: The Vision / "Day After"
  dreamGoalTomorrow: string;
  tasksToStopDoing: string[];
  decisionMetricsNeeded: string[];
  
  // Step 5: Security & Governance
  allowCloudExport: 'yes' | 'with_dpa_sso' | 'strictly_local' | 'unknown';
  complianceNeeds: string[]; // ["ISO 27001", "SOC2", "HIPAA/Privacy", "MOD/Defense Approval", "None"]
  budgetHorizon: 'immediate_quick_win' | 'quarterly_roadmap' | 'enterprise_transformation';
}

export interface AIOpportunityItem {
  id: string;
  title: string;
  titleEn: string;
  department: string;
  departmentEn: string;
  category: 'quick_win' | 'strategic' | 'knowledge' | 'productivity' | 'service' | 'cyber';
  problemStatement: string;
  aiSolution: string;
  howItWorks: string;
  businessValue: string;
  impactScore: number; // 1-10
  complexityScore: number; // 1-10
  securityRiskScore: number; // 1-10 (higher = more risk)
  estimatedEffort: 'Days' | 'Weeks' | 'Months';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedTech: string;
  techType: AITechStackCategory;
  estimatedHoursSavedMonthly: number;
}

export interface AIReadinessDimension {
  key: string;
  labelHe: string;
  labelEn: string;
  score: number; // 0-100
  target: number;
  benchmark: number;
  summaryHe: string;
  summaryEn: string;
}

export interface AIRoadmapPhase {
  phaseNumber: number;
  timeline: string;
  timelineEn: string;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  initiatives: string[];
  deliverables: string[];
  kpi: string;
  investmentLevel: 'Low' | 'Medium' | 'Strategic';
}

export interface AIExcellenceReport {
  id: string;
  generatedAt: string;
  version: string;
  companyName: string;
  contactPerson: string;
  role: string;
  companySize: string;
  industry: string;
  
  // High level scores
  overallReadinessScore: number;
  securityReadinessScore: number;
  automationPotentialScore: number;
  governanceScore: number;
  
  // Breakdown
  dimensions: AIReadinessDimension[];
  
  // Opportunities
  opportunities: AIOpportunityItem[];
  
  // Financial & ROI
  roi: {
    monthlyHoursSaved: number;
    annualHoursSaved: number;
    estimatedAnnualFinancialSavingsNIS: number;
    paybackMonths: number;
  };
  
  // Architecture & Tech Stack
  recommendedArchitecture: {
    layerIdentity: string;
    layerGateway: string;
    layerKnowledge: string;
    layerEngines: string[];
    hostingType: 'Cloud SaaS' | 'Enterprise Tenant' | 'Private Air-Gap / On-Prem' | 'Hybrid Gateway';
  };
  
  // Security & Governance
  securityAssessment: {
    overallStatus: 'Secure & Ready' | 'Requires Controls' | 'High-Risk Sensitive';
    keyRisks: string[];
    safeguards: string[];
    shadowAIPenetrationRisk: 'Low' | 'Medium' | 'High';
  };
  
  // Roadmap
  roadmap: AIRoadmapPhase[];
  
  // Executive text summary generated by Gemini
  executiveSummary?: string;
  customNotes?: string;
  emailSentStatus?: {
    sent: boolean;
    sentTo: string;
    timestamp?: string;
    error?: string;
  };

  // Employee 360 Survey Summary (if aggregated)
  employeeSurveySummary?: {
    totalResponses: number;
    topWishes: string[];
    adoptionRate: number;
    sentimentScore: number;
  };
}

export interface AIConsultationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

