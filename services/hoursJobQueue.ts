/**
 * NEXUS OS - Hours Job Queue & Subrequest Controller
 * 
 * Purpose:
 * Prevents "Too many subrequests by single Worker invocation" errors in Cloudflare Workers
 * (which enforces a strict hard limit of 50 subrequests per single fetch event invocation).
 * 
 * Invariant (Constitution & User Directive):
 * 1. Standard task recording ("תיעוד משימה רגיל", single row write) MUST execute immediately & synchronously.
 *    It must NEVER enter a queue, preserving zero latency and instant user confirmation.
 * 2. Heavy / complex operations (multi-row batch writing, deep workbook inspection across all tabs,
 *    bulk duplicate scans across multiple dates/employees, mass catalog sync) are classified as HEAVY
 *    and processed via this Job Queue in small, controlled slices (max 10-12 subrequests per slice).
 * 3. Each slice runs in its own Worker invocation (via step polling or bounded invocation),
 *    ensuring NO SINGLE WORKER INVOCATION ever exceeds safe subrequest thresholds.
 */

import { writeRows, readSheetStructure, findDuplicates, inspectWorkbookFile } from "./graphHours";

export type HoursJobType =
  | "batch_write_rows"
  | "deep_workbook_inspection"
  | "bulk_duplicate_check"
  | "mass_customers_sync";

export type HoursJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface HoursJobSliceResult {
  sliceIndex: number;
  itemsCount: number;
  data: any;
  subrequestsUsed?: number;
  timestamp: number;
}

export interface HoursJob<TPayload = any, TResult = any> {
  id: string;
  type: HoursJobType;
  status: HoursJobStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  userContext?: {
    name?: string;
    email?: string;
    oid?: string;
  };
  totalUnits: number;
  processedUnits: number;
  progressPercent: number;
  currentSliceIndex: number;
  totalSlices: number;
  sliceSize: number;
  payload: TPayload;
  slices: any[][];
  results: TResult[];
  errors: Array<{
    sliceIndex: number;
    error: string;
    timestamp: number;
  }>;
  stageDescription: string;
  metadata?: Record<string, any>;
}

export interface RequestComplexityEvaluation {
  isHeavy: boolean;
  reason: string;
  recommendedType?: HoursJobType;
  estimatedUnits: number;
  estimatedSubrequests: number;
}

/**
 * Global In-Memory Job Storage
 * (With automatic 2-hour TTL cleanup to prevent memory leaks)
 */
const jobsMap = new Map<string, HoursJob>();

// Cleanup stale jobs older than 2 hours
function cleanupStaleJobs() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of jobsMap.entries()) {
    if (job.updatedAt < twoHoursAgo) {
      jobsMap.delete(id);
    }
  }
}

/**
 * 1. Intelligent Request Complexity Classifier
 * 
 * Determines whether an incoming operation against the hours spreadsheet is
 * "LIGHT" (fast synchronous path) vs "HEAVY/COMPLEX" (Job Queue path).
 */
export function evaluateHoursRequestComplexity(
  operation: "write-rows" | "sheet-structure" | "find-duplicates" | "customers" | "inspection",
  payload: any
): RequestComplexityEvaluation {
  // A. Write Rows:
  if (operation === "write-rows") {
    const rows = payload?.rows;
    const rowCount = Array.isArray(rows) ? rows.length : 0;

    // RULE 1: Single task recording (or empty) MUST stay synchronous & immediate!
    if (rowCount <= 1 && !payload?.forceQueue) {
      return {
        isHeavy: false,
        reason: "תיעוד משימה רגיל (שורה בודדת) מבוצע מיידית וסינכרונית ללא תור",
        estimatedUnits: rowCount || 1,
        estimatedSubrequests: 4,
      };
    }

    // Multiple rows (batch/bulk) requires controlled slicing:
    return {
      isHeavy: true,
      reason: `הזנת ${rowCount} שורות ברצף דורשת עיבוד מבוקר במנות למניעת חריגת תעבורה (Subrequests)`,
      recommendedType: "batch_write_rows",
      estimatedUnits: rowCount,
      estimatedSubrequests: rowCount * 4 + 3,
    };
  }

  // B. Sheet Structure & Workbook Inspection:
  if (operation === "sheet-structure" || operation === "inspection") {
    const isDeep = Boolean(payload?.deep || payload?.scanAllTabs);
    const sheetCount = typeof payload?.sheetCount === "number" ? payload.sheetCount : 0;

    if (isDeep || sheetCount > 4) {
      return {
        isHeavy: true,
        reason: "סריקה עמוקה של כלל גיליונות הקובץ דורשת תור מבוקר",
        recommendedType: "deep_workbook_inspection",
        estimatedUnits: sheetCount || 6,
        estimatedSubrequests: (sheetCount || 6) * 3,
      };
    }

    return {
      isHeavy: false,
      reason: "קריאת מבנה גיליון ממוקדת מבוצעת מיידית",
      estimatedUnits: 1,
      estimatedSubrequests: 3,
    };
  }

  // C. Duplicate Finding:
  if (operation === "find-duplicates") {
    const isMultiDate = Boolean(payload?.startDate && payload?.endDate && payload.startDate !== payload.endDate);
    const isMultiEmployee = Array.isArray(payload?.employees) && payload.employees.length > 1;

    if (isMultiDate || isMultiEmployee) {
      return {
        isHeavy: true,
        reason: "בדיקת כפילויות על פני טווח תאריכים או עובדים מרובים דורשת עיבוד מבוקר",
        recommendedType: "bulk_duplicate_check",
        estimatedUnits: isMultiEmployee ? payload.employees.length : 10,
        estimatedSubrequests: 20,
      };
    }

    return {
      isHeavy: false,
      reason: "בדיקת כפילות לתאריך ועובד בודד מבוצעת סינכרונית",
      estimatedUnits: 1,
      estimatedSubrequests: 2,
    };
  }

  // D. Customers Directory:
  if (operation === "customers") {
    if (payload?.deepSync === true || payload?.forceFullScan === true) {
      return {
        isHeavy: true,
        reason: "סנכרון עמוק של כלל תיקיות וספריות הלקוחות ב-SharePoint",
        recommendedType: "mass_customers_sync",
        estimatedUnits: 40,
        estimatedSubrequests: 30,
      };
    }

    return {
      isHeavy: false,
      reason: "שליפת רשימת לקוחות עם מטמון מבוצעת סינכרונית",
      estimatedUnits: 1,
      estimatedSubrequests: 2,
    };
  }

  return {
    isHeavy: false,
    reason: "פעולה סטנדרטית",
    estimatedUnits: 1,
    estimatedSubrequests: 2,
  };
}

/**
 * 2. Slice configuration by job type
 * Keeps each slice safely under ~8-12 subrequests per step
 */
function getSliceSizeForJobType(type: HoursJobType): number {
  switch (type) {
    case "batch_write_rows":
      // 2 rows per slice = ~5-7 Graph subrequests per worker turn
      return 2;
    case "deep_workbook_inspection":
      // 2 worksheets per slice = ~6 Graph subrequests
      return 2;
    case "bulk_duplicate_check":
      return 2;
    case "mass_customers_sync":
      return 5;
    default:
      return 2;
  }
}

/**
 * 3. Create & Enqueue a Heavy Hours Job
 */
export function createHoursJob<TPayload = any>(params: {
  type: HoursJobType;
  payload: TPayload;
  userContext?: { name?: string; email?: string; oid?: string };
  metadata?: Record<string, any>;
}): HoursJob<TPayload> {
  cleanupStaleJobs();

  const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const sliceSize = getSliceSizeForJobType(params.type);

  // Divide raw items into slices
  let itemsToSlice: any[] = [];
  if (params.type === "batch_write_rows") {
    const rawRows = (params.payload as any)?.rows || [];
    itemsToSlice = Array.isArray(rawRows) ? rawRows : [];
  } else if (params.type === "deep_workbook_inspection") {
    const rawSheets = (params.payload as any)?.sheets || [];
    itemsToSlice = Array.isArray(rawSheets) ? rawSheets : [];
  } else if (params.type === "bulk_duplicate_check") {
    const queries = (params.payload as any)?.queries || [];
    itemsToSlice = Array.isArray(queries) ? queries : [];
  } else {
    itemsToSlice = [params.payload];
  }

  const slices: any[][] = [];
  for (let i = 0; i < itemsToSlice.length; i += sliceSize) {
    slices.push(itemsToSlice.slice(i, i + sliceSize));
  }

  if (slices.length === 0) {
    slices.push([]);
  }

  const totalUnits = itemsToSlice.length;
  const now = Date.now();

  const job: HoursJob<TPayload> = {
    id,
    type: params.type,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    userContext: params.userContext,
    totalUnits,
    processedUnits: 0,
    progressPercent: 0,
    currentSliceIndex: 0,
    totalSlices: slices.length,
    sliceSize,
    payload: params.payload,
    slices,
    results: [],
    errors: [],
    stageDescription: `ממתין לתחילת עיבוד מבוקר (${slices.length} מנות, ${totalUnits} יחידות)`,
    metadata: params.metadata,
  };

  jobsMap.set(id, job);
  return job;
}

/**
 * 4. Get Job by ID
 */
export function getHoursJob(jobId: string): HoursJob | null {
  cleanupStaleJobs();
  return jobsMap.get(jobId) || null;
}

/**
 * 5. Cancel Job
 */
export function cancelHoursJob(jobId: string, reason = "בוטל על ידי המשתמש"): HoursJob | null {
  const job = jobsMap.get(jobId);
  if (!job) return null;

  if (job.status !== "completed" && job.status !== "failed") {
    job.status = "cancelled";
    job.updatedAt = Date.now();
    job.stageDescription = `הפעולה בוטלה: ${reason}`;
  }
  return job;
}

/**
 * 6. Execute a single controlled slice of a Job
 * 
 * CRITICAL FOR CLOUDFLARE WORKERS:
 * This runs ONLY the current slice (e.g. 2 rows) and returns immediately.
 * The worker invocation makes only 5-8 subrequests and finishes cleanly.
 * The next slice is executed on the next step call.
 */
export async function executeJobSlice(
  jobId: string,
  env?: any
): Promise<HoursJob> {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`משימה ${jobId} לא נמצאה בתור`);
  }

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return job;
  }

  job.status = "processing";
  job.updatedAt = Date.now();
  if (!job.startedAt) {
    job.startedAt = Date.now();
  }

  const sliceIndex = job.currentSliceIndex;
  if (sliceIndex >= job.slices.length) {
    job.status = "completed";
    job.completedAt = Date.now();
    job.progressPercent = 100;
    job.stageDescription = "הפעולה הושלמה בהצלחה";
    return job;
  }

  const currentItems = job.slices[sliceIndex] || [];
  job.stageDescription = `מעבד מנה ${sliceIndex + 1} מתוך ${job.totalSlices} (${currentItems.length} פריטים)...`;

  try {
    // A. Execute slice for batch_write_rows:
    if (job.type === "batch_write_rows") {
      const payload: any = job.payload;
      const fileId: string = payload.fileId;
      const driveId: string | undefined = payload.driveId;
      const workType: string | undefined = payload.workType;
      const userContext = job.userContext;

      if (currentItems.length > 0) {
        // Write this controlled slice (1-2 rows) to Excel
        const writeResult = await writeRows(fileId, currentItems, userContext, env, driveId, workType);
        job.results.push(writeResult);
      }
    }

    // B. Execute slice for deep_workbook_inspection:
    else if (job.type === "deep_workbook_inspection") {
      const payload: any = job.payload;
      const fileId: string = payload.fileId;
      const driveId: string | undefined = payload.driveId;
      const customerName: string | undefined = payload.customerName;

      // Inspect slice of sheets
      const partialInspection = await inspectWorkbookFile(fileId, env, driveId, customerName, {
        sheetIdsToInspect: currentItems.map((s: any) => s.id || s),
        quickMode: false,
      });
      job.results.push(partialInspection);
    }

    // C. Execute slice for bulk_duplicate_check:
    else if (job.type === "bulk_duplicate_check") {
      const payload: any = job.payload;
      const fileId: string = payload.fileId;
      for (const item of currentItems) {
        const dupResult = await findDuplicates(fileId, item, env);
        job.results.push(dupResult);
      }
    }

    // Advance counters
    job.processedUnits += currentItems.length;
    job.currentSliceIndex = sliceIndex + 1;
    job.progressPercent = job.totalUnits > 0
      ? Math.min(100, Math.round((job.processedUnits / job.totalUnits) * 100))
      : 100;

    // Check if finished
    if (job.currentSliceIndex >= job.slices.length) {
      job.status = "completed";
      job.completedAt = Date.now();
      job.progressPercent = 100;
      job.stageDescription = `הושלם בהצלחה (${job.processedUnits} מתוך ${job.totalUnits} יחידות עובדו)`;
    } else {
      job.stageDescription = `הושלמה מנה ${sliceIndex + 1} מתוך ${job.totalSlices} (${job.progressPercent}%)`;
    }

    job.updatedAt = Date.now();
    return job;
  } catch (sliceErr: any) {
    console.error(`[HoursJobQueue] Error executing slice ${sliceIndex} for job ${job.id}:`, sliceErr);
    job.errors.push({
      sliceIndex,
      error: sliceErr?.message || String(sliceErr),
      timestamp: Date.now(),
    });

    // Mark as failed if critical error
    job.status = "failed";
    job.updatedAt = Date.now();
    job.stageDescription = `שגיאה בעיבוד מנה ${sliceIndex + 1}: ${sliceErr?.message || "שגיאת תקשורת"}`;
    return job;
  }
}

/**
 * 7. In-flight subrequest tracker per worker invocation
 */
let subrequestsInCurrentInvocation = 0;

export function recordWorkerSubrequest(): number {
  subrequestsInCurrentInvocation++;
  return subrequestsInCurrentInvocation;
}

export function resetWorkerSubrequestCount(): void {
  subrequestsInCurrentInvocation = 0;
}

export function getWorkerSubrequestCount(): number {
  return subrequestsInCurrentInvocation;
}
