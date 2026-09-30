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

/**
 * 5. Write Rows
 */
export async function apiWriteRows(
  fileId: string,
  rows: Record<string, any>[],
  options?: { driveId?: string; confirm?: boolean; workType?: string }
): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/write-rows`, {
    method: "POST",
    body: JSON.stringify({
      fileId,
      rows,
      confirm: options?.confirm ?? true,
      driveId: options?.driveId,
      workType: options?.workType,
    }),
  });
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


