import { getApiToken, clearCachedApiToken } from "./hoursAuth";
import * as XLSX from "xlsx";

/**
 * Generic authenticated fetch wrapper for /api/hours/* endpoints
 * Features automatic 401 interceptor: if token expired, automatically refreshes and retries once
 */
export async function fetchHoursApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getApiToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const controller = new AbortController();
  const timeoutMs = 120000; // 120s timeout to allow full Gemini reasoning and SharePoint search
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(cleanEndpoint, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    // Automatic 401 Token Refresh Interceptor:
    // If the server returns 401 Unauthorized, immediately clear cached token,
    // silently acquire a fresh token, and retry the request once before failing!
    if (res.status === 401) {
      try {
        console.info("[fetchHoursApi] 401 detected, attempting transparent token auto-refresh...");
        clearCachedApiToken();
        const freshToken = await getApiToken(undefined, undefined, true);
        if (freshToken) {
          headers.set("Authorization", `Bearer ${freshToken}`);
          res = await fetch(cleanEndpoint, {
            ...options,
            headers,
            signal: options.signal || controller.signal,
          });
        }
      } catch (retryErr) {
        console.warn("[fetchHoursApi] Transparent token auto-refresh failed:", retryErr);
      }
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody?.error || `שגיאת שרת (${res.status})`;
      throw new Error(message);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      throw new Error(`נתיב ה-API אינו זמין בשרת (${cleanEndpoint})`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("הבקשה לשרת ארכה זמן רב מהרגיל ולא התקבלה תשובה. נא לנסות שוב.");
    }
    throw err;
  }
}

export interface CustomersApiResponse {
  siteId?: string;
  detectedStructure?: "folders" | "libraries";
  totalCustomers?: number;
  first10Customers?: string[];
  customers: any[];
}

/**
 * 1. Fetch Customers List & Detection Metadata
 */
export async function apiListCustomers(forceRefresh = false): Promise<CustomersApiResponse> {
  const data = await fetchHoursApi<CustomersApiResponse>(
    `/api/hours/customers${forceRefresh ? "?refresh=true" : ""}`
  );
  return {
    siteId: data.siteId,
    detectedStructure: data.detectedStructure || "folders",
    totalCustomers: data.totalCustomers ?? (data.customers || []).length,
    first10Customers: data.first10Customers || (data.customers || []).slice(0, 10).map((c: any) => c.name || c),
    customers: data.customers || [],
  };
}

/**
 * 2. Search Customer (Fuzzy)
 */
export async function apiSearchCustomer(query: string): Promise<any[]> {
  const data = await fetchHoursApi<{ query: string; results: any[] }>(
    `/api/hours/customers/search?q=${encodeURIComponent(query)}`
  );
  return data.results || [];
}

/**
 * 3. Find Month Target (month folder -> xlsx inside OR direct xlsx, plus optional workbook inspection)
 */
export async function apiFindMonthTarget(
  customer: string,
  date: string,
  options?: { inspect?: boolean; workType?: string }
): Promise<any> {
  const params = new URLSearchParams({
    customer,
    date,
  });
  if (options?.inspect) params.set("inspect", "true");
  if (options?.workType) params.set("workType", options.workType);
  return fetchHoursApi<any>(`/api/hours/month-target?${params.toString()}`);
}

/**
 * 4. Read Sheet Structure
 */
export async function apiReadSheetStructure(fileId: string): Promise<any> {
  return fetchHoursApi<any>(
    `/api/hours/sheet-structure?fileId=${encodeURIComponent(fileId)}`
  );
}

export interface HoursJobProgress {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  processedUnits: number;
  totalUnits: number;
  progressPercent: number;
  currentSliceIndex: number;
  totalSlices: number;
  stageDescription: string;
}

/**
 * Get Status or Step a Queued Hours Job
 */
export async function apiGetJobStatus(jobId: string, step = false): Promise<any> {
  return fetchHoursApi<any>(
    `/api/hours/jobs?jobId=${encodeURIComponent(jobId)}${step ? "&step=true" : ""}`
  );
}

/**
 * Step a Queued Hours Job (Executes next slice in fresh Worker invocation)
 */
export async function apiStepJob(jobId: string): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/jobs`, {
    method: "POST",
    body: JSON.stringify({ action: "step", jobId }),
  });
}

/**
 * Cancel a Queued Hours Job
 */
export async function apiCancelJob(jobId: string, reason?: string): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/jobs`, {
    method: "POST",
    body: JSON.stringify({ action: "cancel", jobId, reason }),
  });
}

/**
 * Poll and step a Queued Hours Job until completion
 * Ensures that each slice executes in a separate Worker invocation,
 * completely avoiding the "Too many subrequests" limit!
 */
export async function pollHoursJobUntilComplete(
  jobId: string,
  onProgress?: (progress: HoursJobProgress) => void,
  maxWaitMs = 120000
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // Calling with step=true triggers the next slice on the server
    const job = await apiGetJobStatus(jobId, true);

    if (onProgress) {
      onProgress({
        jobId: job.id || jobId,
        status: job.status,
        processedUnits: job.processedUnits ?? 0,
        totalUnits: job.totalUnits ?? 0,
        progressPercent: job.progressPercent ?? 0,
        currentSliceIndex: job.currentSliceIndex ?? 0,
        totalSlices: job.totalSlices ?? 1,
        stageDescription: job.stageDescription || "",
      });
    }

    if (job.status === "completed") {
      // If multiple slice results exist, flatten or pick primary
      const allResults = job.results || [];
      const firstSuccess = allResults[0] || {};
      return {
        ...firstSuccess,
        queued: true,
        jobId,
        allResults,
        totalUnits: job.totalUnits,
        processedUnits: job.processedUnits,
        stageDescription: job.stageDescription,
      };
    }

    if (job.status === "failed") {
      const errMsg =
        job.errors?.[0]?.error ||
        job.stageDescription ||
        "שגיאה בעיבוד מנות המשימה בתור";
      throw new Error(errMsg);
    }

    if (job.status === "cancelled") {
      throw new Error("הפעולה בוטלה בתור המשימות");
    }

    // Short pause between step polling turns (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  throw new Error("פסק זמן (Timeout) בהמתנה לסיום עיבוד המשימות בתור");
}

/**
 * 5. Write Rows
 * - Regular single task write (rows.length <= 1) is 100% synchronous & immediate (zero queue delay).
 * - Heavy / batch write (rows.length > 1) is automatically processed in controlled slices via Job Queue.
 */
export async function apiWriteRows(
  fileId: string,
  rows: Record<string, any>[],
  options?: {
    driveId?: string;
    confirm?: boolean;
    workType?: string;
    forceQueue?: boolean;
    user?: { name?: string; email?: string; id?: string; oid?: string; username?: string; upn?: string };
    onProgress?: (progress: HoursJobProgress) => void;
  }
): Promise<any> {
  const initialRes = await fetchHoursApi<any>(`/api/hours/write-rows`, {
    method: "POST",
    body: JSON.stringify({
      fileId,
      rows,
      confirm: options?.confirm ?? true,
      driveId: options?.driveId,
      workType: options?.workType,
      forceQueue: options?.forceQueue,
      user: options?.user,
    }),
  });

  // FAST PATH: Single task write executed immediately and synchronously
  if (!initialRes.queued) {
    return initialRes;
  }

  // HEAVY PATH: Routed to Job Queue -> drive step polling until complete
  return await pollHoursJobUntilComplete(initialRes.jobId, options?.onProgress);
}

/**
 * 6. Find Duplicates
 */
export async function apiFindDuplicates(
  fileId: string,
  criteria: { employee: string; date: string; start?: string; duration?: string | number }
): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/find-duplicates`, {
    method: "POST",
    body: JSON.stringify({ fileId, ...criteria }),
  });
}

/**
 * 7. Undo Row
 */
export async function apiUndoRow(fileId: string, rowAddress: string): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/undo`, {
    method: "POST",
    body: JSON.stringify({ fileId, rowAddress }),
  });
}

export interface HoursDiagnosticsData {
  envSources: {
    tenantVar: string;
    clientVar: string;
    secretVar: string;
  };
  appId: string;
  roles: string[];
  issuedAt: string | null;
  expiresAt: string | null;
  fromCache: boolean;
  cachedAt?: string | null;
  tenantId?: string;
}

/**
 * 8. Get Graph Token Diagnostics
 */
export async function apiGetHoursDiagnostics(forceRefresh = false): Promise<HoursDiagnosticsData> {
  if (forceRefresh) {
    return fetchHoursApi<HoursDiagnosticsData>(`/api/hours/diagnostics/refresh`, {
      method: "POST",
    });
  }
  return fetchHoursApi<HoursDiagnosticsData>(`/api/hours/diagnostics`);
}

export interface HoursAssistantEntryDraft {
  id: string;
  customerName: string;
  projectName?: string;
  customerFolder?: string;
  fileId?: string;
  driveId?: string;
  fileName?: string;
  filePath?: string;
  webUrl?: string;
  targetRow?: number | string;
  date: string;
  durationMinutes: number;
  durationHours: number;
  durationFormatted: string;
  startTime?: string;
  endTime?: string;
  isTimeSuggested?: boolean;
  workType: string;
  activityType?: string;
  targetTabName?: string;
  detectedTabType?: "tickets" | "onsite" | "project" | "other_or_summary";
  availableTabs?: Array<{
    name: string;
    detectedType: "tickets" | "onsite" | "project" | "other_or_summary";
    isSelected: boolean;
  }>;
  needsUserTabChoice?: boolean;
  tabChoiceReason?: string;
  headers?: string[];
  unmappedFields?: string[];
  columnMapping?: Array<{
    field: string;
    label: string;
    headerName?: string;
    isExists: boolean;
    value?: any;
  }>;
  contactPerson?: string;
  ticketNumber?: string;
  description: string;
  duplicateWarning?: string | null;
  isReadyForConfirmation: boolean;
  missingFields?: string[];
  mappedRow?: Record<string, any>;
  availableFiles?: Array<{ fileId: string; fileName: string; webUrl?: string }>;
  assignedEmployees?: string[];
  candidates?: any[];
}

export interface WrittenEntryResult {
  id: string;
  fileId: string;
  driveId?: string;
  itemId?: string;
  fileName: string;
  filePath: string;
  sheetName?: string;
  webUrl: string;
  targetRow: number | string;
  rowAddress: string;
  writtenValues?: any[][];
  entryId: string;
  customerName: string;
  date: string;
  durationFormatted: string;
  durationHours?: number;
  durationMinutes?: number;
  description: string;
  workType: string;
  activityType?: string;
  writtenAt: number;
  expiresAt: number;
  canUndo: boolean;
  listItemId?: string;
  listItemWebUrl?: string;
  listsSyncResult?: { success: boolean; error?: string };
  ticketNumber?: string;
  startTime?: string;
  endTime?: string;
  employeeName?: string;
  skippedOccupiedRows?: number;
}

export interface AssistantChatRequest {
  user?: {
    name: string;
    email: string;
    id?: string;
    oid?: string;
    username?: string;
    upn?: string;
    isAdmin?: boolean;
  };
  message?: string;
  audio?: {
    data: string;
    mimeType: string;
  };
  history?: Array<{
    role: "user" | "model";
    text: string;
  }>;
  action?: "confirm_entry" | "confirm_all" | "undo_entry" | "edit_draft" | "edit_entry";
  cardId?: string;
  draftData?: any;
  editData?: {
    id?: string;
    cardId?: string;
    listItemId?: string;
    fileId?: string;
    driveId?: string;
    rowAddress?: string;
    targetRow?: number | string;
    sheetName?: string;
    customerName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    durationMinutes?: number;
    durationFormatted?: string;
    description?: string;
    workType?: string;
    employeeName?: string;
    oldDescription?: string;
  };
  activeDrafts?: HoursAssistantEntryDraft[];
  undoData?: {
    driveId?: string;
    itemId?: string;
    fileId?: string;
    rowAddress?: string;
    writtenValues?: any[][];
    writtenAt?: number;
    sheetName?: string;
    customerName?: string;
    listItemId?: string;
  };
  writtenEntries?: WrittenEntryResult[];
}

export interface AssistantChatResponse {
  reply: string;
  transcript?: string;
  drafts: HoursAssistantEntryDraft[];
  writtenEntries: WrittenEntryResult[];
  undoneCardIds: string[];
  isConfirmed: boolean;
  suggestedAction?: "confirm" | "clarify" | "undo" | "none";
}

/**
 * 9. Stage 3 AI Assistant Chat (Voice + Text + Multi-entry Confirmation)
 */
export async function apiAssistantChat(req: AssistantChatRequest): Promise<AssistantChatResponse> {
  return fetchHoursApi<AssistantChatResponse>(`/api/hours/assistant/chat`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export interface ClassificationTestWorksheet {
  name: string;
  detectedType: "tickets" | "onsite" | "project" | "other_or_summary";
  typeConfidence: number;
  typeReason: string;
  isDataTab: boolean;
  isTable: boolean;
  tableName?: string;
  totalDataRows: number;
  headers: string[];
  headerMappings: Array<{
    colIdx: number;
    headerName: string;
    mappedField: string | null;
  }>;
  unmappedRequiredFields: string[];
  isLowConfidence: boolean;
}

export interface ClassificationCustomerResult {
  customerName: string;
  found: boolean;
  fileName?: string;
  filePath?: string;
  webUrl?: string;
  message?: string;
  existingFiles?: string[];
  worksheets?: ClassificationTestWorksheet[];
}

export interface ClassificationTestResponse {
  month: string;
  totalCustomersChecked: number;
  results: ClassificationCustomerResult[];
}

/**
 * 10. Real Classification Test in Admin Panel
 */
export async function apiTestClassification(
  customerNames?: string[],
  month?: string
): Promise<ClassificationTestResponse> {
  return fetchHoursApi<ClassificationTestResponse>(`/api/hours/admin/test-classification`, {
    method: "POST",
    body: JSON.stringify({ customerNames, month }),
  });
}

export interface LoggedHourEntryClient {
  id: string;
  fileId: string;
  driveId?: string;
  rowAddress?: string;
  customerName: string;
  employeeName: string;
  employeeEmail?: string;
  date: string;
  durationHours: number;
  durationMinutes: number;
  durationFormatted: string;
  startTime?: string;
  endTime?: string;
  description: string;
  workType?: string;
  contactPerson?: string;
  ticketNumber?: string;
  sheetName?: string;
  webUrl?: string;
  loggedAt: number;
  source?: "app" | "sharepoint_scan";
}

export interface EmployeeDailySummaryClient {
  employeeName: string;
  employeeEmail?: string;
  totalHours: number;
  totalMinutes: number;
  totalHoursFormatted: string;
  entriesCount: number;
  customers: string[];
  entries: LoggedHourEntryClient[];
}

export interface CustomerDailySummaryClient {
  customerName: string;
  totalHours: number;
  totalMinutes: number;
  totalHoursFormatted: string;
  entriesCount: number;
  employees: string[];
  entries: LoggedHourEntryClient[];
}

export interface DailyHoursReportClient {
  date: string;
  isToday: boolean;
  totalHours: number;
  totalMinutes: number;
  totalHoursFormatted: string;
  totalEntries: number;
  activeEmployeesCount: number;
  activeCustomersCount: number;
  byEmployee: EmployeeDailySummaryClient[];
  byCustomer: CustomerDailySummaryClient[];
  entries: LoggedHourEntryClient[];
  lastUpdated: number;
  scanError?: string;
  periodTitle?: string;
  filterCustomer?: string;
  filterEmployee?: string;
  dateRange?: { startDate: string; endDate: string };
}

/**
 * 11. Fetch Today's (or specific date/period/customer) Hours Report & Breakdown
 */
export async function apiGetTodayHoursSummary(
  optionsOrDate?:
    | string
    | {
        date?: string;
        period?: "day" | "week" | "month";
        customer?: string;
        employee?: string;
      }
): Promise<DailyHoursReportClient> {
  const params = new URLSearchParams();
  if (typeof optionsOrDate === "string") {
    if (optionsOrDate) params.set("date", optionsOrDate);
  } else if (optionsOrDate) {
    if (optionsOrDate.date) params.set("date", optionsOrDate.date);
    if (optionsOrDate.period) params.set("period", optionsOrDate.period);
    if (optionsOrDate.customer) params.set("customer", optionsOrDate.customer);
    if (optionsOrDate.employee) params.set("employee", optionsOrDate.employee);
  }
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchHoursApi<DailyHoursReportClient>(`/api/hours/today-summary${q}`, {
    method: "GET",
  });
}

export interface CentralLogItemClient {
  id: string;
  date: string;
  customerName: string;
  employeeName: string;
  employeeEmail?: string;
  workType: string;
  startTime?: string;
  endTime?: string;
  durationHours: number;
  durationFormatted: string;
  description: string;
  status: "פעיל" | "בוטל" | "נמחק";
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
  ticketNumber?: string;
  contactPerson?: string;
  sharepointTargetFile?: string;
  sharepointTargetRow?: string;
  sharepointTargetSheet?: string;
}

/**
 * 12. Query Central Log (g@tech-select.co.il)
 */
export async function apiGetCentralLog(filter?: {
  date?: string;
  employee?: string;
  customer?: string;
  q?: string;
  includeCancelled?: boolean;
}): Promise<{ count: number; entries: CentralLogItemClient[] }> {
  const params = new URLSearchParams();
  if (filter?.date) params.set("date", filter.date);
  if (filter?.employee) params.set("employee", filter.employee);
  if (filter?.customer) params.set("customer", filter.customer);
  if (filter?.q) params.set("q", filter.q);
  if (filter?.includeCancelled !== undefined)
    params.set("includeCancelled", String(filter.includeCancelled));
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchHoursApi<{ count: number; entries: CentralLogItemClient[] }>(
    `/api/hours/log${q}`,
    { method: "GET" }
  );
}

/**
 * 13. Delete / Cancel Central Log Entry
 */
export async function apiDeleteCentralLogEntry(id: string): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/log/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * 14. Sync Central Log to SharePoint Tools/LOG.xlsx
 */
export async function apiSyncCentralLogToSharePoint(): Promise<{
  success: boolean;
  webUrl?: string;
  message?: string;
}> {
  return fetchHoursApi<{ success: boolean; webUrl?: string; message?: string }>(
    `/api/hours/log/sync-sharepoint`,
    { method: "POST" }
  );
}

/**
 * 15. Inspect Microsoft Lists Status & Schema
 */
export async function apiInspectMicrosoftLists(): Promise<{
  configured: boolean;
  targetUrl: string;
  siteId?: string;
  listId?: string;
  displayName?: string;
  itemCount?: number;
  columns?: any[];
  columnMappings?: Record<string, string>;
  recentItems?: any[];
  error?: string;
}> {
  return fetchHoursApi<any>(`/api/hours/lists/inspect`, {
    method: "GET",
  });
}

/**
 * 16. Test write an item to Microsoft Lists
 */
export function apiTestWriteMicrosoftList(payload?: {
  customerName?: string;
  durationHours?: number;
  description?: string;
  workType?: string;
}): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/lists/test`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export interface UserListsEntryClient {
  id: string;
  webUrl?: string;
  customerName: string;
  workType: string;
  employeeName: string;
  employeeEmail: string;
  startTime: string;
  endTime: string;
  date: string;
  durationHours: number;
  durationFormatted: string;
  description: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
}

export interface UserListsDayGroupClient {
  date: string;
  displayDate: string;
  dayNameHe: string;
  isToday: boolean;
  isYesterday: boolean;
  totalHours: number;
  entriesCount: number;
  customers: string[];
  entries: UserListsEntryClient[];
}

export interface UserListsDailySummaryClient {
  employeeName: string;
  employeeEmail: string;
  todayDate: string;
  todayDisplayDate: string;
  todayHours: number;
  todayEntriesCount: number;
  todayEntries: UserListsEntryClient[];
  weekHours: number;
  weekEntriesCount: number;
  monthHours: number;
  monthEntriesCount: number;
  totalHoursAllTime: number;
  totalEntriesAllTime: number;
  byDay: UserListsDayGroupClient[];
  availableEmployees: Array<{ name: string; email: string }>;
  listWebUrl: string;
}

/**
 * 17. Fetch per-user daily logged hours breakdown directly from Microsoft Lists ("כמה תיעדתי היום")
 * Includes automatic fallback to /api/hours/today-summary if /api/hours/my-lists-hours is unavailable.
 */
export async function apiGetMyListsDailySummary(options?: {
  employeeName?: string;
  employeeEmail?: string;
}): Promise<UserListsDailySummaryClient> {
  const params = new URLSearchParams();
  if (options?.employeeName) params.set("employeeName", options.employeeName);
  if (options?.employeeEmail) params.set("employeeEmail", options.employeeEmail);
  const q = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await fetchHoursApi<UserListsDailySummaryClient>(`/api/hours/my-lists-hours${q}`, {
      method: "GET",
    });
    if (res && Array.isArray(res.byDay)) {
      return res;
    }
  } catch (err) {
    console.warn("[apiGetMyListsDailySummary] Primary endpoint fallback triggered:", err);
  }

  // Fallback to /api/hours/today-summary?mode=my-lists
  const fallbackParams = new URLSearchParams(params);
  fallbackParams.set("mode", "my-lists");
  fallbackParams.set("period", "month");
  if (options?.employeeName && options.employeeName !== "עובד") {
    fallbackParams.set("employee", options.employeeName);
  }
  const fallbackData = await fetchHoursApi<any>(`/api/hours/today-summary?${fallbackParams.toString()}`, {
    method: "GET",
  });

  if (fallbackData && Array.isArray(fallbackData.byDay)) {
    return fallbackData as UserListsDailySummaryClient;
  }

  // Transform DailyHoursReport into UserListsDailySummaryClient if legacy today-summary format returned
  const todayIso = new Date().toISOString().split("T")[0];
  const entriesList: any[] = Array.isArray(fallbackData?.entries) ? fallbackData.entries : [];
  const dayMap = new Map<string, UserListsEntryClient[]>();
  const daysHe = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "יום שבת"];

  let todayHours = 0;
  let todayEntriesCount = 0;
  const todayEntries: UserListsEntryClient[] = [];
  let totalHours = 0;

  for (const e of entriesList) {
    const d = e.date || todayIso;
    const h = Number(e.durationHours) || 0;
    totalHours += h;
    const mapped: UserListsEntryClient = {
      id: String(e.id || `${d}_${Math.random()}`),
      webUrl: e.webUrl || "https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx",
      customerName: e.customerName || "",
      workType: e.workType || "טיקטים",
      employeeName: e.employeeName || options?.employeeName || "עובד",
      employeeEmail: e.employeeEmail || options?.employeeEmail || "",
      startTime: e.startTime || "",
      endTime: e.endTime || "",
      date: d,
      durationHours: h,
      durationFormatted: e.durationFormatted || `${h} שעות`,
      description: e.description || "",
    };
    if (d === todayIso) {
      todayHours += h;
      todayEntriesCount++;
      todayEntries.push(mapped);
    }
    if (!dayMap.has(d)) dayMap.set(d, []);
    dayMap.get(d)!.push(mapped);
  }

  if (!dayMap.has(todayIso)) {
    dayMap.set(todayIso, []);
  }

  const byDay: UserListsDayGroupClient[] = Array.from(dayMap.keys())
    .sort((a, b) => b.localeCompare(a))
    .map((dateIso) => {
      const dayEntries = dayMap.get(dateIso) || [];
      const parts = dateIso.split("-");
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateIso;
      const dt = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date();
      return {
        date: dateIso,
        displayDate,
        dayNameHe: daysHe[dt.getDay()] || "",
        isToday: dateIso === todayIso,
        isYesterday: false,
        totalHours: Math.round(dayEntries.reduce((acc, x) => acc + x.durationHours, 0) * 100) / 100,
        entriesCount: dayEntries.length,
        customers: Array.from(new Set(dayEntries.map((x) => x.customerName).filter(Boolean))),
        entries: dayEntries,
      };
    });

  const tParts = todayIso.split("-");
  return {
    employeeName: options?.employeeName || "עובד",
    employeeEmail: options?.employeeEmail || "",
    todayDate: todayIso,
    todayDisplayDate: tParts.length === 3 ? `${tParts[2]}/${tParts[1]}/${tParts[0]}` : todayIso,
    todayHours: Math.round(todayHours * 100) / 100,
    todayEntriesCount,
    todayEntries,
    weekHours: Math.round(totalHours * 100) / 100,
    weekEntriesCount: entriesList.length,
    monthHours: Math.round(totalHours * 100) / 100,
    monthEntriesCount: entriesList.length,
    totalHoursAllTime: Math.round(totalHours * 100) / 100,
    totalEntriesAllTime: entriesList.length,
    byDay,
    availableEmployees: [],
    listWebUrl: "https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx",
  };
}

/**
 * 18. Generate and download a real .xlsx file directly in the browser without navigating away
 */
export function downloadEntriesAsExcel(
  entries: Array<{
    date?: string;
    customerName?: string;
    workType?: string;
    sheetName?: string;
    employeeName?: string;
    employeeEmail?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    description?: string;
    status?: string;
    webUrl?: string;
  }>,
  fileNamePrefix = "TechSelect_Hours_Report",
  sheetName = "דיווח שעות"
): void {
  const rowsForExcel = (entries || []).map((e, idx) => ({
    "#": idx + 1,
    "תאריך": e.date || "",
    "לקוח": e.customerName || "",
    "סוג פעילות": e.workType || e.sheetName || "טיקטים",
    "עובד": e.employeeName || "",
    "שעת התחלה": e.startTime || "",
    "שעת סיום": e.endTime || "",
    "סה״כ שעות לחיוב": Number(e.durationHours || 0),
    "תיאור הפעילות": e.description || "",
    ...(e.status ? { "סטטוס": e.status } : {}),
  }));

  // Add a total summary row at the bottom
  const totalHours =
    Math.round(
      rowsForExcel.reduce((sum, r) => sum + (Number(r["סה״כ שעות לחיוב"]) || 0), 0) * 100
    ) / 100;

  if (rowsForExcel.length > 0) {
    rowsForExcel.push({
      "#": "" as any,
      "תאריך": "",
      "לקוח": "",
      "סוג פעילות": "",
      "עובד": "",
      "שעת התחלה": "",
      "שעת סיום": "סה״כ שעות:",
      "סה״כ שעות לחיוב": totalHours,
      "תיאור הפעילות": `${entries.length} רשומות`,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rowsForExcel);
  // Set RTL view for Hebrew Excel sheets
  if (!worksheet["!views"]) worksheet["!views"] = [];
  worksheet["!views"].push({ rightToLeft: true });

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 13 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 55 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const dateSuffix = new Date().toISOString().split("T")[0];
  const cleanName = `${fileNamePrefix}_${dateSuffix}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", cleanName);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * 19. Authenticated Server Excel Export with instant client-side fallback
 */
export async function apiDownloadExportExcel(options?: {
  date?: string;
  period?: string;
  customer?: string;
  employee?: string;
  fallbackEntries?: any[];
  fileNamePrefix?: string;
}): Promise<void> {
  // If we already have the exact entries loaded on screen, generate the .xlsx immediately (<20ms)!
  if (options?.fallbackEntries && options.fallbackEntries.length > 0) {
    downloadEntriesAsExcel(
      options.fallbackEntries,
      options.fileNamePrefix || `TechSelect_Hours_${options.date || "Report"}`
    );
    return;
  }

  // Otherwise fetch from /api/hours/export-excel with Bearer token
  let token = await getApiToken();
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.period) params.set("period", options.period);
  if (options?.customer) params.set("customer", options.customer);
  if (options?.employee) params.set("employee", options.employee);
  const q = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`/api/hours/export-excel${q}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = res.headers.get("content-type") || "";
  if (res.ok && contentType.includes("spreadsheet")) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${options?.fileNamePrefix || "TechSelect_Lists_Report"}_${options?.date || new Date().toISOString().split("T")[0]}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
    return;
  }

  // Fallback: fetch today-summary and export via XLSX in browser
  const report = await apiGetTodayHoursSummary({
    date: options?.date || "today",
    period: (options?.period as any) || "day",
    customer: options?.customer,
    employee: options?.employee,
  });
  downloadEntriesAsExcel(
    report.entries || [],
    options?.fileNamePrefix || `TechSelect_Hours_${report.date || "Report"}`
  );
}

export interface ManagedEmployeeItem {
  name: string;
  email: string;
  shortName: string;
  aliases?: string[];
}

const CUSTOM_EMPLOYEES_STORAGE_KEY = "techselect_custom_employees_v1";
const CUSTOM_CUSTOMERS_STORAGE_KEY = "techselect_custom_customers_v1";
const TEAM_MANAGERS_STORAGE_KEY = "techselect_team_managers_v1";

export interface ManagedCustomerItem {
  id: string;
  name: string;
  webUrl?: string;
}

export interface TeamManagerAssignmentItem {
  managerEmail: string;
  managerName: string;
  employees: string[];
  updatedAt: string;
}

export function getStoredTeamManagers(): TeamManagerAssignmentItem[] {
  try {
    const raw = localStorage.getItem(TEAM_MANAGERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTeamManagers(list: TeamManagerAssignmentItem[]): void {
  try {
    localStorage.setItem(TEAM_MANAGERS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function getCustomStoredCustomers(): ManagedCustomerItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CUSTOMERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomStoredCustomer(cust: ManagedCustomerItem): void {
  try {
    const current = getCustomStoredCustomers();
    const idx = current.findIndex((c) => c.name.trim().toLowerCase() === cust.name.trim().toLowerCase());
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...cust };
    } else {
      current.push(cust);
    }
    localStorage.setItem(CUSTOM_CUSTOMERS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function getCustomStoredEmployees(): ManagedEmployeeItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EMPLOYEES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomStoredEmployee(emp: ManagedEmployeeItem): void {
  try {
    const current = getCustomStoredEmployees();
    const idx = current.findIndex(
      (e) =>
        e.name.toLowerCase() === emp.name.toLowerCase() ||
        (e.email && emp.email && e.email.toLowerCase() === emp.email.toLowerCase())
    );
    if (idx >= 0) {
      current[idx] = emp;
    } else {
      current.push(emp);
    }
    localStorage.setItem(CUSTOM_EMPLOYEES_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

/**
 * 20. Manager Directory API: Get Customers, Employees & Team Managers
 */
export async function apiGetManagedDirectory(forceRefresh = false): Promise<{
  customers: Array<{ id: string; name: string; webUrl?: string }>;
  totalCustomers: number;
  employees: ManagedEmployeeItem[];
  teamManagers: TeamManagerAssignmentItem[];
}> {
  const { getGraphDelegatedToken } = await import("./hoursAuth");
  const graphToken = await getGraphDelegatedToken();
  const headers: Record<string, string> = {};
  if (graphToken) {
    headers["X-Graph-Token"] = graphToken;
  }

  const data = await fetchHoursApi<{
    customers: Array<{ id: string; name: string; webUrl?: string }>;
    totalCustomers: number;
    employees: ManagedEmployeeItem[];
    teamManagers?: TeamManagerAssignmentItem[];
  }>(`/api/hours/manage${forceRefresh ? "?refresh=true" : ""}`, {
    method: "GET",
    headers,
  });

  // Merge locally stored custom customers & employees so multi-worker isolates never lose newly added items
  const serverCustomers = Array.isArray(data?.customers) ? [...data.customers] : [];
  for (const localCust of getCustomStoredCustomers()) {
    const existingIdx = serverCustomers.findIndex(
      (sc) => sc.name.trim().toLowerCase() === localCust.name.trim().toLowerCase()
    );
    if (existingIdx === -1) {
      serverCustomers.push(localCust);
    } else if (!serverCustomers[existingIdx].webUrl && localCust.webUrl) {
      serverCustomers[existingIdx].webUrl = localCust.webUrl;
    }
  }
  serverCustomers.sort((a, b) => a.name.localeCompare(b.name, "he"));

  const serverEmployees = Array.isArray(data?.employees) ? [...data.employees] : [];
  for (const localEmp of getCustomStoredEmployees()) {
    if (
      !serverEmployees.some(
        (se) => se.name.trim().toLowerCase() === localEmp.name.trim().toLowerCase()
      )
    ) {
      serverEmployees.push(localEmp);
    }
  }

  const serverManagers = Array.isArray(data?.teamManagers) ? data.teamManagers : [];
  if (serverManagers.length > 0) {
    saveStoredTeamManagers(serverManagers);
  }
  const effectiveManagers = serverManagers.length > 0 ? serverManagers : getStoredTeamManagers();

  return {
    customers: serverCustomers,
    totalCustomers: serverCustomers.length,
    employees: serverEmployees,
    teamManagers: effectiveManagers,
  };
}

/**
 * 20b. Fast Team Hierarchy Fetch (for determining if current user is a Team Manager on page load)
 */
export async function apiGetTeamHierarchy(forceRefresh = false): Promise<{
  teamManagers: TeamManagerAssignmentItem[];
  employees: ManagedEmployeeItem[];
}> {
  try {
    const { getGraphDelegatedToken } = await import("./hoursAuth");
    const graphToken = await getGraphDelegatedToken();
    const headers: Record<string, string> = {};
    if (graphToken) {
      headers["X-Graph-Token"] = graphToken;
    }
    const data = await fetchHoursApi<{
      teamManagers?: TeamManagerAssignmentItem[];
      employees?: ManagedEmployeeItem[];
    }>(`/api/hours/manage?mode=hierarchy${forceRefresh ? "&refresh=true" : ""}`, {
      method: "GET",
      headers,
    });
    const serverManagers = Array.isArray(data?.teamManagers) ? data.teamManagers : [];
    if (serverManagers.length > 0) {
      saveStoredTeamManagers(serverManagers);
    }
    return {
      teamManagers: serverManagers.length > 0 ? serverManagers : getStoredTeamManagers(),
      employees: Array.isArray(data?.employees) ? data.employees : [],
    };
  } catch {
    return {
      teamManagers: getStoredTeamManagers(),
      employees: getCustomStoredEmployees(),
    };
  }
}

/**
 * 21. Manager Directory API: Add Customer
 */
export async function apiAddManagedCustomer(params: {
  name: string;
  englishName?: string;
  aliases?: string[];
  createSharePointFolder?: boolean;
}): Promise<{
  success: boolean;
  customer: { id: string; name: string; webUrl?: string };
  aliases: string[];
  createdInSharePoint: boolean;
  hoursFolderUrl?: string;
  sharePointError?: string;
}> {
  const { getGraphDelegatedToken } = await import("./hoursAuth");
  const graphToken = await getGraphDelegatedToken();
  const headers: Record<string, string> = {};
  if (graphToken) {
    headers["X-Graph-Token"] = graphToken;
  }

  const res = await fetchHoursApi<{
    success: boolean;
    customer: { id: string; name: string; webUrl?: string };
    aliases: string[];
    createdInSharePoint: boolean;
    hoursFolderUrl?: string;
    sharePointError?: string;
  }>(`/api/hours/manage`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      entityType: "customer",
      ...params,
    }),
  });

  if (res?.customer?.name) {
    saveCustomStoredCustomer({
      id: res.customer.id || `custom_${res.customer.name}`,
      name: res.customer.name,
      webUrl: res.hoursFolderUrl || res.customer.webUrl,
    });
  }

  return res;
}

/**
 * 22. Manager Directory API: Add Employee
 */
export async function apiAddManagedEmployee(params: {
  name: string;
  email: string;
  shortName?: string;
  aliases?: string[];
}): Promise<{
  success: boolean;
  employee: ManagedEmployeeItem;
}> {
  const res = await fetchHoursApi<{ success: boolean; employee: ManagedEmployeeItem }>(
    `/api/hours/manage`,
    {
      method: "POST",
      body: JSON.stringify({
        entityType: "employee",
        ...params,
      }),
    }
  );
  if (res?.employee) {
    saveCustomStoredEmployee(res.employee);
  }
  return res;
}

/**
 * 23. Manager Directory API: Save Team Manager & Assigned Employees
 */
export async function apiSaveTeamManager(params: {
  managerEmail: string;
  managerName: string;
  employees: string[];
  remove?: boolean;
}): Promise<{
  success: boolean;
  teamManagers: TeamManagerAssignmentItem[];
}> {
  const { getGraphDelegatedToken } = await import("./hoursAuth");
  const graphToken = await getGraphDelegatedToken();
  const headers: Record<string, string> = {};
  if (graphToken) {
    headers["X-Graph-Token"] = graphToken;
  }

  const res = await fetchHoursApi<{
    success: boolean;
    teamManagers: TeamManagerAssignmentItem[];
  }>(`/api/hours/manage`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      entityType: "team_manager",
      ...params,
    }),
  });

  if (Array.isArray(res?.teamManagers)) {
    saveStoredTeamManagers(res.teamManagers);
  }
  return res;
}



