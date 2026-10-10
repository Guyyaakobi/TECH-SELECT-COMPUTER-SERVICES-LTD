import { getApiToken } from "./hoursAuth";

/**
 * Generic authenticated fetch wrapper for /api/hours/* endpoints
 */
export async function fetchHoursApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getApiToken();
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
    const res = await fetch(cleanEndpoint, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody?.error || `שגיאת שרת (${res.status})`;
      throw new Error(message);
    }

    return res.json();
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
 * 3. Find Month Target (month folder -> xlsx inside OR direct xlsx)
 */
export async function apiFindMonthTarget(customer: string, date: string): Promise<any> {
  return fetchHoursApi<any>(
    `/api/hours/month-target?customer=${encodeURIComponent(customer)}&date=${encodeURIComponent(date)}`
  );
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
  description: string;
  workType: string;
  writtenAt: number;
  expiresAt: number;
  canUndo: boolean;
}

export interface AssistantChatRequest {
  user?: {
    name: string;
    email: string;
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
  action?: "confirm_entry" | "confirm_all" | "undo_entry" | "edit_draft";
  cardId?: string;
  draftData?: any;
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
export async function apiTestWriteMicrosoftList(payload?: {
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



