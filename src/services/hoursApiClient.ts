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
  const res = await fetch(cleanEndpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.error || `שגיאת שרת (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

/**
 * 1. Fetch Customers List
 */
export async function apiListCustomers(forceRefresh = false): Promise<any[]> {
  const data = await fetchHoursApi<{ customers: any[] }>(
    `/api/hours/customers${forceRefresh ? "?refresh=true" : ""}`
  );
  return data.customers || [];
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
export async function apiWriteRows(fileId: string, rows: Record<string, any>[]): Promise<any> {
  return fetchHoursApi<any>(`/api/hours/write-rows`, {
    method: "POST",
    body: JSON.stringify({ fileId, rows }),
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
