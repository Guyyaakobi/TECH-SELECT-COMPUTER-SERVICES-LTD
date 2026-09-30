/**
 * Microsoft Graph SharePoint & Excel Service for Tech-Select Hours Tracking ("תיעוד שעות")
 * 
 * Config constants:
 * - SHAREPOINT_SITE: hostname + site path (e.g. "techselect.sharepoint.com:/sites/IT" or env)
 * - CUSTOMERS_ROOT_PATH: folder path under drive root (e.g. "/Documents/לקוחות" or env)
 * - HOURS_FOLDER_NAME: "שעות עבודה"
 */

export interface GraphCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface CustomerFolder {
  id: string;
  name: string;
  webUrl?: string;
  driveId?: string;
  hoursFolderId?: string;
  type?: "folder" | "library";
}

export interface CustomersDetectionInfo {
  siteId: string;
  detectedStructure: "folders" | "libraries";
  totalCustomers: number;
  first10Customers: string[];
  customers: CustomerFolder[];
}

export interface CustomerMatch {
  customer: CustomerFolder;
  score: number;
  matchReason?: string;
}

export interface MonthTargetResult {
  found: boolean;
  message?: string;
  customerName: string;
  requestedMonth: string; // e.g. "2026-09"
  targetType?: "file" | "month_folder_file";
  fileId?: string;
  fileName?: string;
  filePath?: string;
  webUrl?: string;
  driveId?: string;
  detectedPattern?: string;
  existingItems?: string[];
  availableFiles?: Array<{ fileId: string; fileName: string; webUrl?: string }>;
}

export type TabSemanticType = "tickets" | "onsite" | "project" | "other_or_summary";

export type StandardColumnField =
  | "date"
  | "day_of_week"
  | "employee"
  | "start_time"
  | "end_time"
  | "duration_hours"
  | "description"
  | "contact_person"
  | "ticket_number"
  | "signature_or_approval"
  | "notes";

export interface InspectedWorksheet {
  sheetId: string;
  name: string; // real raw worksheet name in file (e.g. "קריאות שירות")
  normalizedName: string;
  visibility?: string;
  isTable: boolean;
  tableName?: string;
  tableId?: string;
  hasHeaderRow: boolean;
  headerRowIndex: number;
  headers: string[]; // actual raw headers in the file
  recentRows: any[][]; // up to 3 recent data rows
  totalDataRows: number;
  detectedType: TabSemanticType;
  typeConfidence: number;
  typeReason: string;
  isDataTab: boolean; // false for summary/pivot/chart/no-headers
  fieldToColIndex: Partial<Record<StandardColumnField, number>>;
  colIndexToField: Array<StandardColumnField | null>;
  unmappedFields: StandardColumnField[];
  formats: {
    dateFormat?: string;
    timeFormat?: string;
    hoursFormat?: "decimal" | "hh:mm";
    dayFormat?: "short" | "full";
    formulaColumns: number[];
  };
}

export interface WorkbookInspectionResult {
  fileId: string;
  fileName: string;
  driveId: string;
  webUrl?: string;
  customerName?: string;
  lastModified: string;
  worksheets: InspectedWorksheet[];
  dataTabs: InspectedWorksheet[];
  inspectedAt: number;
}

export interface SheetStructureResult {
  fileId: string;
  isTable: boolean;
  tableName?: string;
  tableId?: string;
  sheetName?: string;
  sheetId?: string;
  headers: string[];
  last5Rows: any[][];
  totalDataRows: number;
  nextEmptyRowAddress: string;
  startColLetter?: string;
  nextEmptyRowNumber?: number;
  hasTotalsRow: boolean;
  totalsRowAddress?: string;
  formats: {
    dateFormat?: string; // e.g. "YYYY-MM-DD", "DD/MM/YYYY", "DD.MM.YYYY"
    timeFormat?: string; // e.g. "HH:mm"
    hoursFormat?: "decimal" | "hh:mm";
    formulaColumns: number[]; // column indices containing formulas
  };
  detectedType?: TabSemanticType;
  availableTabs?: Array<{
    name: string;
    detectedType: TabSemanticType;
    isSelected: boolean;
  }>;
  unmappedFields?: string[];
}

export function columnLetterToIndex(letter: string): number {
  if (!letter) return 0;
  let col = 0;
  const clean = letter.toUpperCase().trim();
  for (let i = 0; i < clean.length; i++) {
    col = col * 26 + (clean.charCodeAt(i) - 64);
  }
  return Math.max(0, col - 1);
}

export function indexToColumnLetter(index: number): string {
  let temp = Math.max(0, index) + 1;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || "A";
}

export interface WriteRowsResult {
  success: boolean;
  driveId: string;
  itemId: string;
  fileId: string;
  rowAddress: string;
  sheetName?: string;
  webUrl?: string;
  entryId: string;
  timestamp: number;
  writtenAt: number;
  writtenValues: any[][];
}

export interface UndoRowParams {
  driveId?: string;
  itemId?: string;
  fileId?: string;
  rowAddress: string;
  writtenValues?: any[][];
  writtenAt?: number;
  sheetName?: string;
}

export interface UndoRowResult {
  success: boolean;
  message: string;
  rowAddress: string;
  fileId: string;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    rowIndex: number;
    rowAddress?: string;
    employee?: string;
    date?: string;
    start?: string;
    duration?: string | number;
    description?: string;
    rawValues: any[];
  }>;
}

// Customers cache (10 minutes TTL)
interface CustomersCache {
  timestamp: number;
  siteId: string;
  detectedStructure: "folders" | "libraries";
  items: CustomerFolder[];
}
let customersCache: CustomersCache | null = null;
const CUSTOMERS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Dedicated token cache strictly for the Hours Engine so it NEVER reuses the Mail.Send token
interface HoursTokenCache {
  token: string;
  expiresAt: number;
  obtainedAt: number;
}
let cachedHoursGraphToken: HoursTokenCache | null = null;

export interface GraphDiagnosticsInfo {
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
 * Clear cached Microsoft Graph token for Hours Engine
 */
export function clearGraphTokenCache() {
  cachedHoursGraphToken = null;
}

/**
 * Decode JWT token payload safely without external dependencies
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    if (typeof Buffer !== "undefined") {
      const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
      return JSON.parse(jsonStr);
    } else {
      const binary = atob(base64);
      const jsonStr = decodeURIComponent(
        binary
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonStr);
    }
  } catch {
    return null;
  }
}

// Resolved Site & Drive Cache
let cachedSiteDriveInfo: { siteId: string; driveId: string; timestamp: number } | null = null;

/**
 * Get environment configuration values strictly for the Hours Engine
 * ONLY AZURE_TENANT_ID, HOURS_GRAPH_CLIENT_ID, HOURS_GRAPH_CLIENT_SECRET
 */
export function getGraphHoursConfig(env?: any) {
  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};

  // Tenant strictly from AZURE_TENANT_ID
  const tenantId = (
    envObj.AZURE_TENANT_ID ||
    p?.AZURE_TENANT_ID ||
    ""
  ).trim();

  // Client ID strictly from HOURS_GRAPH_CLIENT_ID
  let clientId = (
    envObj.HOURS_GRAPH_CLIENT_ID ||
    p?.HOURS_GRAPH_CLIENT_ID ||
    ""
  ).trim();

  // Client Secret strictly from HOURS_GRAPH_CLIENT_SECRET
  let clientSecret = (
    envObj.HOURS_GRAPH_CLIENT_SECRET ||
    p?.HOURS_GRAPH_CLIENT_SECRET ||
    ""
  ).trim();

  // Auto-detect if user swapped client ID and client secret
  // (e.g. client ID has "~" and client secret is a 36-char GUID)
  if (clientId.includes("~") && /^[0-9a-fA-F-]{36}$/.test(clientSecret)) {
    const tmp = clientId;
    clientId = clientSecret;
    clientSecret = tmp;
  }

  const sharepointSite = (
    envObj.SHAREPOINT_SITE ||
    p?.SHAREPOINT_SITE ||
    "techselectltd.sharepoint.com:/sites/Customers"
  ).trim();

  const customersRootPath = (
    envObj.CUSTOMERS_ROOT_PATH ||
    p?.CUSTOMERS_ROOT_PATH ||
    "/"
  ).trim();

  const hoursFolderName = "שעות עבודה";

  return {
    credentials: { tenantId, clientId, clientSecret },
    sharepointSite,
    customersRootPath,
    hoursFolderName,
  };
}

/**
 * Obtain Microsoft Graph access token strictly using HOURS_GRAPH credentials.
 * No fallback to CLIENT_ID / CLIENT_SECRET.
 */
export async function getGraphAccessToken(env?: any): Promise<string> {
  const now = Date.now();
  if (cachedHoursGraphToken && cachedHoursGraphToken.expiresAt > now + 60000) {
    return cachedHoursGraphToken.token;
  }

  const { credentials } = getGraphHoursConfig(env);
  const p = typeof process !== "undefined" ? process?.env : {};
  const envObj = (env || {}) as any;
  const tenantId = credentials.tenantId || envObj.AZURE_TENANT_ID || p?.AZURE_TENANT_ID || "dba15196-0ead-457f-85df-b57d8f7af5ba";

  // Build candidate credential pairs in priority order
  const candidatePairs: Array<{ clientId: string; clientSecret: string; label: string }> = [];

  if (credentials.clientId && credentials.clientSecret) {
    candidatePairs.push({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      label: "HOURS_GRAPH credentials",
    });
  }

  const altClientId = (envObj.CLIENT_ID || p?.CLIENT_ID || "").trim();
  const altClientSecret = (envObj.CLIENT_SECRET || p?.CLIENT_SECRET || "").trim();
  if (altClientId && altClientSecret && (altClientId !== credentials.clientId || altClientSecret !== credentials.clientSecret)) {
    candidatePairs.push({
      clientId: altClientId,
      clientSecret: altClientSecret,
      label: "CLIENT_ID credentials",
    });
  }

  const azureClientId = (envObj.AZURE_CLIENT_ID || p?.AZURE_CLIENT_ID || "").trim();
  if (azureClientId && altClientSecret && azureClientId !== altClientId) {
    candidatePairs.push({
      clientId: azureClientId,
      clientSecret: altClientSecret,
      label: "AZURE_CLIENT_ID with secret",
    });
  }

  let lastErrorText = "";
  for (const pair of candidatePairs) {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
      const bodyParams = new URLSearchParams({
        client_id: pair.clientId,
        client_secret: pair.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString(),
      });

      if (res.ok) {
        const data: any = await res.json();
        const token = data?.access_token;
        if (token) {
          const expiresInSec = Number(data?.expires_in) || 3599;
          cachedHoursGraphToken = {
            token,
            expiresAt: now + expiresInSec * 1000,
            obtainedAt: now,
          };
          return token;
        }
      } else {
        lastErrorText = await res.text().catch(() => "");
        console.warn(`[getGraphAccessToken] Attempt with ${pair.label} (${pair.clientId.substring(0, 8)}...) failed with ${res.status}`);
      }
    } catch (err: any) {
      lastErrorText = err?.message || String(err);
      console.warn(`[getGraphAccessToken] Network error with ${pair.label}:`, lastErrorText);
    }
  }

  throw new Error(`שגיאה בקבלת טוקן Microsoft Graph מ-Microsoft Entra ID עבור HOURS_GRAPH: ${lastErrorText || "לא נמצאו פרטי הזדהות תקינים"}`);
}

/**
 * Obtain diagnostics about the active Hours Microsoft Graph authentication state:
 * - Shows HOURS_GRAPH_* variable names
 * - appid/azp claim
 * - roles claim
 * - iat & exp
 * - fromCache flag
 */
export async function getGraphDiagnostics(
  env?: any,
  forceRefresh = false
): Promise<GraphDiagnosticsInfo> {
  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};

  const tenantConfigured = Boolean(envObj.AZURE_TENANT_ID || p?.AZURE_TENANT_ID);
  const clientConfigured = Boolean(envObj.HOURS_GRAPH_CLIENT_ID || p?.HOURS_GRAPH_CLIENT_ID);
  const secretConfigured = Boolean(envObj.HOURS_GRAPH_CLIENT_SECRET || p?.HOURS_GRAPH_CLIENT_SECRET);

  const envSources = {
    tenantVar: tenantConfigured ? "AZURE_TENANT_ID" : "חסר (AZURE_TENANT_ID)",
    clientVar: clientConfigured ? "HOURS_GRAPH_CLIENT_ID" : "חסר (HOURS_GRAPH_CLIENT_ID)",
    secretVar: secretConfigured ? "HOURS_GRAPH_CLIENT_SECRET" : "חסר (HOURS_GRAPH_CLIENT_SECRET)",
  };

  if (!clientConfigured) {
    throw new Error("חסרה הגדרת מערכת: HOURS_GRAPH_CLIENT_ID");
  }
  if (!secretConfigured) {
    throw new Error("חסרה הגדרת מערכת: HOURS_GRAPH_CLIENT_SECRET");
  }
  if (!tenantConfigured) {
    throw new Error("חסרה הגדרת מערכת: AZURE_TENANT_ID");
  }

  const wasCached = Boolean(
    !forceRefresh &&
    cachedHoursGraphToken &&
    cachedHoursGraphToken.expiresAt > Date.now() + 60000
  );

  if (forceRefresh) {
    clearGraphTokenCache();
  }

  // Get token (will use cache or fetch fresh)
  const token = await getGraphAccessToken(env);
  const payload = decodeJwtPayload(token) || {};

  const appId = String(payload.appid || payload.azp || "");
  const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
  const issuedAt = payload.iat ? new Date(payload.iat * 1000).toISOString() : null;
  const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : null;
  const tenantId = String(payload.tid || "");

  return {
    envSources,
    appId,
    roles,
    issuedAt,
    expiresAt,
    fromCache: wasCached,
    cachedAt: cachedHoursGraphToken?.obtainedAt
      ? new Date(cachedHoursGraphToken.obtainedAt).toISOString()
      : null,
    tenantId,
  };
}

/**
 * Helper to call Microsoft Graph API with automatic retries for 409, 423, 429
 */
export async function fetchGraph(
  url: string,
  options: RequestInit = {},
  env?: any,
  maxRetries = 3
): Promise<Response> {
  const token = await getGraphAccessToken(env);
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    const res = await fetch(url, { ...options, headers });

    // Check retryable status codes: 409 (Conflict), 423 (Locked), 429 (Too Many Requests)
    if ([409, 423, 429].includes(res.status) && attempt < maxRetries) {
      attempt++;
      // Backoff: 500ms, 1500ms, 3000ms + jitter
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 0;
      const backoffMs = retryAfterMs > 0 ? retryAfterMs : Math.min(500 * Math.pow(2.5, attempt) + Math.random() * 200, 5000);
      
      console.warn(`[fetchGraph Retry] Status ${res.status} on attempt ${attempt}. Retrying in ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    if ([409, 423, 429].includes(res.status) && attempt >= maxRetries) {
      throw new Error(
        "הקובץ נעול לעריכה או בשימוש על ידי משתמש אחר, אנא נסה שוב בעוד מספר רגעים (שגיאת נעילה זמנית ב-SharePoint/Excel)"
      );
    }

    return res;
  }

  throw new Error("חריגה ממספר ניסיונות הפנייה המרבי ל-Microsoft Graph");
}

/**
 * Resolve SharePoint Site ID & Default Document Library Drive ID
 */
export async function resolveSharePointDrive(env?: any): Promise<{ siteId: string; driveId: string }> {
  const now = Date.now();
  if (cachedSiteDriveInfo && cachedSiteDriveInfo.timestamp > now - 3600000) {
    return { siteId: cachedSiteDriveInfo.siteId, driveId: cachedSiteDriveInfo.driveId };
  }

  const { sharepointSite } = getGraphHoursConfig(env);

  // Example: techselect.sharepoint.com:/sites/IT or /sites/IT or site ID directly
  let siteUrl = "";
  if (sharepointSite.startsWith("http://") || sharepointSite.startsWith("https://")) {
    const parsed = new URL(sharepointSite);
    siteUrl = `https://graph.microsoft.com/v1.0/sites/${parsed.hostname}:${parsed.pathname}`;
  } else if (sharepointSite.includes(":") && sharepointSite.includes(".sharepoint.com")) {
    siteUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSite}`;
  } else if (sharepointSite.includes("/")) {
    siteUrl = `https://graph.microsoft.com/v1.0/sites/root:${sharepointSite}`;
  } else if (sharepointSite === "root") {
    siteUrl = `https://graph.microsoft.com/v1.0/sites/root`;
  } else {
    // Assume direct site ID
    siteUrl = `https://graph.microsoft.com/v1.0/sites/${sharepointSite}`;
  }

  const siteRes = await fetchGraph(siteUrl, { method: "GET" }, env);
  if (!siteRes.ok) {
    const err = await siteRes.text().catch(() => "");
    if (siteRes.status === 403) {
      throw new Error(
        `גישה נדחתה (403 Access Denied) לאתר SharePoint (${sharepointSite}). ` +
        `יש לוודא שהאפליקציה ב-Azure Entra ID קיבלה הרשאת Application מסוג 'Sites.Read.All' או 'Sites.ReadWrite.All' ב-Microsoft Graph עם אישור מנהל (Admin Consent), או שנוספה הרשאת גישה ייעודית לאתר Customers.`
      );
    }
    throw new Error(`לא ניתן לגשת לאתר SharePoint (${sharepointSite}): ${err}`);
  }
  const siteData: any = await siteRes.json();
  const siteId = siteData.id;

  // Get default drive for this site
  const driveRes = await fetchGraph(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive`, { method: "GET" }, env);
  if (!driveRes.ok) {
    const err = await driveRes.text().catch(() => "");
    throw new Error(`לא נמצא כונן מסמכים (Document Library) באתר SharePoint: ${err}`);
  }
  const driveData: any = await driveRes.json();
  const driveId = driveData.id;

  cachedSiteDriveInfo = { siteId, driveId, timestamp: now };
  return { siteId, driveId };
}

/**
 * Auto-detect customer storage structure and list customers:
 * 1. List customer folders from default document library root:
 *    GET /sites/{siteId}/drive/root/children (no "root:/:" syntax when path is "/").
 *    A customer = a folder that contains a subfolder named "שעות עבודה".
 * 2. If no such folders are found there, list the site's document libraries
 *    (GET /sites/{siteId}/drives) and treat each library that contains a root folder
 *    "שעות עבודה" as a customer (customer name = library name).
 * 3. Use whichever structure is found, and cache it.
 */
export async function detectAndListCustomers(
  env?: any,
  forceRefresh = false
): Promise<CustomersDetectionInfo> {
  const now = Date.now();
  if (
    !forceRefresh &&
    customersCache &&
    customersCache.timestamp > now - CUSTOMERS_CACHE_TTL_MS
  ) {
    return {
      siteId: customersCache.siteId,
      detectedStructure: customersCache.detectedStructure,
      totalCustomers: customersCache.items.length,
      first10Customers: customersCache.items.slice(0, 10).map((c) => c.name),
      customers: customersCache.items,
    };
  }

  const { siteId, driveId } = await resolveSharePointDrive(env);
  const { customersRootPath, hoursFolderName } = getGraphHoursConfig(env);

  // Normalize path
  let cleanPath = customersRootPath.trim();
  if (cleanPath === "/" || cleanPath === "") {
    cleanPath = "";
  } else {
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
    if (cleanPath.endsWith("/")) cleanPath = cleanPath.slice(0, -1);
  }

  // =========================================================================
  // 1. Check default document library root: GET /sites/{siteId}/drive/root/children
  // =========================================================================
  let childrenUrl = "";
  if (!cleanPath) {
    // Strictly no "root:/:" syntax when path is "/"
    childrenUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root/children?$top=999`;
  } else {
    childrenUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(cleanPath)}:/children?$top=999`;
  }

  let allCustomers: CustomerFolder[] = [];

  // 1. Fetch document libraries: GET /sites/{siteId}/drives (1 subrequest)
  try {
    const drivesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives?$top=999`;
    const drivesRes = await fetchGraph(drivesUrl, { method: "GET" }, env);
    if (drivesRes.ok) {
      const drivesData: any = await drivesRes.json();
      const allDrives: any[] = (drivesData.value || []).filter(
        (d: any) =>
          !d.system &&
          d.name !== "Preservation Hold Library" &&
          d.name !== "Site Assets" &&
          d.name !== "Style Library"
      );

      for (const drive of allDrives) {
        allCustomers.push({
          id: drive.id,
          name: drive.name,
          webUrl: drive.webUrl,
          driveId: drive.id,
          type: "library" as const,
        });
      }
    }
  } catch (err) {
    console.warn("[detectAndListCustomers] Error checking document libraries:", err);
  }

  // 2. Also fetch folders in default document library: GET /root/children (1 subrequest)
  try {
    const res = await fetchGraph(childrenUrl, { method: "GET" }, env);
    if (res.ok) {
      const data: any = await res.json();
      const rootFolders: any[] = (data.value || []).filter((item: any) => Boolean(item.folder));
      for (const folder of rootFolders) {
        // avoid duplicating if drive already has this name
        if (!allCustomers.some((c) => c.name.toLowerCase() === folder.name.toLowerCase())) {
          allCustomers.push({
            id: folder.id,
            name: folder.name,
            webUrl: folder.webUrl,
            driveId,
            type: "folder" as const,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[detectAndListCustomers] Error checking default document library:", err);
  }

  if (allCustomers.length > 0) {
    customersCache = {
      timestamp: now,
      siteId,
      detectedStructure: "libraries",
      items: allCustomers,
    };
    return {
      siteId,
      detectedStructure: "libraries",
      totalCustomers: allCustomers.length,
      first10Customers: allCustomers.slice(0, 10).map((c) => c.name),
      customers: allCustomers,
    };
  }

  // 3. Fallback: if no folder/library has "שעות עבודה" yet, default to folders
  customersCache = {
    timestamp: now,
    siteId,
    detectedStructure: "folders",
    items: [],
  };

  return {
    siteId,
    detectedStructure: "folders",
    totalCustomers: 0,
    first10Customers: [],
    customers: [],
  };
}

/**
 * 1. listCustomers() – list customers using detected structure (cached for 10 minutes)
 */
export async function listCustomers(env?: any, forceRefresh = false): Promise<CustomerFolder[]> {
  const result = await detectAndListCustomers(env, forceRefresh);
  return result.customers;
}

/**
 * Normalizes strings for fuzzy customer matching (Hebrew, English, acronyms, punctuation)
 */
export function normalizeCustomerString(str: string): string {
  if (!str) return "";
  let s = str.toLowerCase().trim();

  // Remove quotes, double quotes, gershayim, geresh
  s = s.replace(/["'״׳`]/g, "");

  // Remove common corporate suffixes: בע"מ, בעמ, בע״מ, בע׳׳מ, בע מ, בע  מ
  s = s.replace(/(?:^|\s)(בעמ|בע\s*מ)(?:$|\s)/gi, " ");
  s = s.replace(/\b(ltd|limited|llc|inc|corp|co|company|group)\b/gi, " ");

  // Remove special symbols & punctuation
  s = s.replace(/[.,\-_/\\()\[\]{}|:;!?@#$%^&*+=]/g, " ");

  // Normalize Hebrew final forms (סופיות) to standard forms for typo & spelling tolerance
  s = s
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ץ/g, "צ")
    .replace(/ף/g, "פ")
    .replace(/ך/g, "כ");

  // Collapse consecutive whitespaces
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Calculates Levenshtein Distance
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * 2. findCustomer(query) – fuzzy match (Hebrew, English, partial, typos, with/without "בע"מ").
 * Return top matches with a score. If ambiguous, return several – never guess silently.
 */
export async function findCustomer(
  query: string,
  env?: any,
  options: { minScore?: number; maxResults?: number } = {}
): Promise<CustomerMatch[]> {
  const minScore = options.minScore ?? 0.35;
  const maxResults = options.maxResults ?? 5;

  const customers = await listCustomers(env);
  if (!query || !query.trim()) {
    return customers.slice(0, maxResults).map((c) => ({
      customer: c,
      score: 1.0,
      matchReason: "ברירת מחדל (שאילתה ריקה)",
    }));
  }

  const rawQuery = query.trim();
  const normQuery = normalizeCustomerString(rawQuery);
  const queryTokens = normQuery.split(" ").filter(Boolean);

  const scored: CustomerMatch[] = [];

  for (const customer of customers) {
    const rawName = customer.name.trim();
    const normName = normalizeCustomerString(rawName);
    const nameTokens = normName.split(" ").filter(Boolean);

    let score = 0;
    let matchReason = "";

    // 1. Exact raw match
    if (rawName.toLowerCase() === rawQuery.toLowerCase()) {
      score = 1.0;
      matchReason = "התאמה מלאה מדויקת";
    }
    // 2. Normalized exact match
    else if (normName === normQuery) {
      score = 0.98;
      matchReason = "התאמה מלאה לאחר נירמול";
    }
    // 3. Name starts with query
    else if (normName.startsWith(normQuery)) {
      score = 0.92;
      matchReason = "שם הלקוח מתחיל בשאילתה";
    }
    // 4. Query starts with name
    else if (normQuery.startsWith(normName)) {
      score = 0.90;
      matchReason = "השאילתה מתחילה בשם הלקוח";
    }
    // 5. Substring containment
    else if (normName.includes(normQuery)) {
      score = 0.85;
      matchReason = "שם הלקוח מכיל את השאילתה במלואה";
    } else if (normQuery.includes(normName) && normName.length >= 3) {
      score = 0.82;
      matchReason = "השאילתה מכילה את שם הלקוח";
    }
    // 6. Token matching
    else {
      let matchedTokenCount = 0;
      let tokenSimSum = 0;

      for (const qToken of queryTokens) {
        let bestTokenSim = 0;
        for (const nToken of nameTokens) {
          if (qToken === nToken) {
            bestTokenSim = 1.0;
            break;
          }
          if (nToken.startsWith(qToken) || qToken.startsWith(nToken)) {
            bestTokenSim = Math.max(bestTokenSim, 0.85);
          } else if (nToken.includes(qToken) || qToken.includes(nToken)) {
            bestTokenSim = Math.max(bestTokenSim, 0.75);
          } else {
            const dist = levenshteinDistance(qToken, nToken);
            const maxL = Math.max(qToken.length, nToken.length);
            if (maxL > 0 && dist <= 2) {
              const sim = 1 - dist / maxL;
              if (sim > bestTokenSim) bestTokenSim = sim;
            }
          }
        }

        if (bestTokenSim >= 0.7) {
          matchedTokenCount++;
        }
        tokenSimSum += bestTokenSim;
      }

      const tokenCoverage = queryTokens.length > 0 ? matchedTokenCount / queryTokens.length : 0;
      const avgSim = queryTokens.length > 0 ? tokenSimSum / queryTokens.length : 0;

      // Full Levenshtein over whole string
      const fullDist = levenshteinDistance(normQuery, normName);
      const fullMaxLen = Math.max(normQuery.length, normName.length);
      const fullSim = fullMaxLen > 0 ? 1 - fullDist / fullMaxLen : 0;

      score = Math.max(tokenCoverage * 0.75 + avgSim * 0.25, fullSim * 0.9);
      if (score >= 0.6) {
        matchReason = "התאמת מילים ועריכה (Fuzzy)";
      } else {
        matchReason = "התאמה חלקית נמוכה";
      }
    }

    if (score >= minScore) {
      scored.push({
        customer,
        score: Math.round(score * 100) / 100,
        matchReason,
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
}

/**
 * Hebrew month names mapping
 */
const HEBREW_MONTHS: Record<number, string[]> = {
  1: ["ינואר", "ינו", "january", "jan"],
  2: ["פברואר", "פבר", "february", "feb"],
  3: ["מרץ", "מרס", "march", "mar"],
  4: ["אפריל", "אפר", "april", "apr"],
  5: ["מאי", "may"],
  6: ["יוני", "יונ", "june", "jun"],
  7: ["יולי", "יול", "july", "jul"],
  8: ["אוגוסט", "אוג", "august", "aug"],
  9: ["ספטמבר", "ספט", "september", "sep"],
  10: ["אוקטובר", "אוק", "october", "oct"],
  11: ["נובמבר", "נוב", "november", "nov"],
  12: ["דצמבר", "דצמ", "december", "dec"],
};

/**
 * Parse requested date to year and month numbers
 * dateStr can be "2026-09", "09/2026", "2026-09-15", etc.
 */
export function parseYearMonth(dateInput: string): { year: number; month: number; ym: string } {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;

  if (dateInput) {
    const s = dateInput.trim();
    // YYYY-MM or YYYY-MM-DD
    const matchIso = s.match(/^(\d{4})[-/.](\d{1,2})/);
    if (matchIso) {
      year = parseInt(matchIso[1], 10);
      month = parseInt(matchIso[2], 10);
    } else {
      // MM/YYYY or MM.YYYY or MM-YYYY
      const matchRev = s.match(/^(\d{1,2})[-/.](\d{4})/);
      if (matchRev) {
        month = parseInt(matchRev[1], 10);
        year = parseInt(matchRev[2], 10);
      } else {
        // Try parsing Hebrew month + year (e.g. "ספטמבר 2026")
        for (const [mNum, aliases] of Object.entries(HEBREW_MONTHS)) {
          if (aliases.some((a) => s.includes(a))) {
            month = parseInt(mNum, 10);
            const yMatch = s.match(/\b(20\d{2}|\d{2})\b/);
            if (yMatch) {
              const yVal = parseInt(yMatch[1], 10);
              year = yVal < 100 ? 2000 + yVal : yVal;
            }
            break;
          }
        }
      }
    }
  }

  const mm = month < 10 ? `0${month}` : `${month}`;
  return { year, month, ym: `${year}-${mm}` };
}

// In-memory cache mapping fileId to its resolved driveId to prevent Cloudflare subrequest limit
export const fileDriveMap = new Map<string, string>();

export function recordFileDrive(fileId: string, driveId: string) {
  if (fileId && driveId) {
    fileDriveMap.set(fileId, driveId);
  }
}

/**
 * Check if a SharePoint DriveItem is an Excel workbook or spreadsheet.
 * Supports:
 * - Extension: .xlsx, .xlsm, .xls, .xlsb
 * - Graph file facet with mimeType (spreadsheetml / ms-excel)
 * - Files without extension but with file facet
 * - Ignores temporary Excel lock files (~$*)
 */
export function isExcelDriveItem(item: any): boolean {
  if (!item) return false;
  const name = (item.name || "").trim();
  if (name.startsWith("~$")) return false; // Ignore lock files
  const lower = name.toLowerCase();
  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xlsm") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".xlsb")
  ) {
    return true;
  }
  // Check Graph API file facet & mimeType
  if (item.file) {
    const mime = (item.file.mimeType || "").toLowerCase();
    if (
      mime.includes("spreadsheet") ||
      mime.includes("excel") ||
      mime.includes("officedocument")
    ) {
      return true;
    }
    // If it has a file facet and no extension
    if (!name.includes(".")) {
      return true;
    }
  }
  return false;
}

/**
 * Matches an item from the hours folder for the requested year & month.
 * Handles patterns such as:
 * - "אסיו ספטמבר.xlsx"
 * - "אסיו ספטמבר 2026.xlsx"
 * - "09.2026.xlsx" / "2026-09.xlsx" / "09-2026.xlsx" / "09-26.xlsx"
 * - "ספטמבר 2026" (month folder)
 * Disqualifies any item that explicitly mentions a DIFFERENT month (e.g. אפריל when looking for ספטמבר).
 */
export function matchMonthItem(
  items: any[],
  year: number,
  month: number,
  customerName?: string
): any | null {
  if (!items || items.length === 0) return null;

  const mm = month < 10 ? `0${month}` : `${month}`;
  const yy = String(year).slice(-2);
  const targetHebrewAliases = HEBREW_MONTHS[month] || [];

  // Identify all other Hebrew month aliases to prevent cross-month false positives
  const otherMonthHebrewAliases: string[] = [];
  for (let m = 1; m <= 12; m++) {
    if (m !== month) {
      const aliases = HEBREW_MONTHS[m] || [];
      for (const a of aliases) {
        if (a.length >= 3) otherMonthHebrewAliases.push(a.toLowerCase());
      }
    }
  }

  // Pre-filter items to exclude temp Excel lock files
  const validItems = items.filter((i) => !i.name.startsWith("~$"));

  let bestItem: any = null;
  let bestScore = 0;

  for (const item of validItems) {
    const rawName = (item.name || "").toLowerCase();
    const cleanName = rawName.replace(/\.xlsx$/i, "").trim();

    // 1. Negative check: if this file explicitly contains ANOTHER month name, REJECT!
    const hasOtherHebrewMonth = otherMonthHebrewAliases.some((other) => {
      const regex = new RegExp(`(^|[\\s._-])${other}([\\s._-]|$)`, "i");
      return regex.test(cleanName) || cleanName.includes(other);
    });
    if (hasOtherHebrewMonth) {
      continue; // Skip! Belongs to a different month!
    }

    let score = 0;

    // 2. Target Hebrew month name match (e.g. "ספטמבר", "ספט")
    const hasTargetHebrew = targetHebrewAliases.some((alias) => {
      return cleanName.includes(alias.toLowerCase());
    });
    if (hasTargetHebrew) {
      score += 100;
    }

    // 3. Target numeric month pattern match (e.g. "09.2026", "2026-09", "09-2026", "09-26", "09")
    const monthPatterns = [
      new RegExp(`(^|[\\s._-])${mm}([\\s._-]|$)`),
      new RegExp(`\\b${year}[-.]${mm}\\b`),
      new RegExp(`\\b${mm}[-.]${year}\\b`),
      new RegExp(`\\b${mm}[-.]${yy}\\b`),
    ];
    for (const pat of monthPatterns) {
      if (pat.test(cleanName)) {
        score += 80;
        break;
      }
    }

    // 4. Target year match bonus (e.g. "2026" or "26")
    if (cleanName.includes(String(year)) || cleanName.includes(` ${yy} `) || cleanName.endsWith(` ${yy}`) || cleanName.includes(`-${yy}-`)) {
      score += 30;
    }

    // 5. Customer name match bonus (e.g. "אסיו")
    if (customerName) {
      const custNorm = customerName.toLowerCase().trim();
      if (custNorm && cleanName.includes(custNorm)) {
        score += 20;
      }
    }

    // 6. Direct Excel file bonus (.xlsx, file facet) or folder
    if (isExcelDriveItem(item)) {
      score += 10;
    } else if (item.folder) {
      score += 8;
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  // Only accept if score passed significant threshold
  if (bestScore >= 80) {
    return bestItem;
  }

  return null;
}

/**
 * 3. findMonthTarget(customer, date) – list children of "{customer}/שעות עבודה".
 * DETECT the existing month naming pattern from existing names (e.g. "2026-09", "09.2026",
 * "ספטמבר 2026", "09-26"...) and select the item for the requested month.
 * Handle both: month folder -> the .xlsx inside, or .xlsx per month.
 * If not found -> return a clear "not found" with the names that do exist. NEVER create files.
 */
export async function findMonthTarget(
  customerInput: string | CustomerFolder,
  dateInput: string,
  env?: any
): Promise<MonthTargetResult> {
  const { year, month, ym } = parseYearMonth(dateInput);
  const mm = month < 10 ? `0${month}` : `${month}`;
  const yy = String(year).slice(-2);
  const hebrewNames = HEBREW_MONTHS[month] || [];

  // 1. Resolve customer folder
  let customerFolder: CustomerFolder | null = null;
  if (typeof customerInput === "object" && customerInput.id) {
    customerFolder = customerInput;
  } else {
    const query = typeof customerInput === "string" ? customerInput : "";
    const matches = await findCustomer(query, env, { minScore: 0.5, maxResults: 1 });
    if (matches.length > 0) {
      customerFolder = matches[0].customer;
    }
  }

  if (!customerFolder) {
    return {
      found: false,
      message: `לא נמצאה תיקיית לקוח תואמת עבור "${typeof customerInput === "string" ? customerInput : ""}"`,
      customerName: typeof customerInput === "string" ? customerInput : "",
      requestedMonth: ym,
    };
  }

  const { driveId: defaultDriveId } = await resolveSharePointDrive(env);
  const { hoursFolderName } = getGraphHoursConfig(env);
  const driveId = customerFolder.driveId || defaultDriveId;

  // 2. Read children of customer folder / library
  let custChildrenUrl = "";
  if (customerFolder.type === "library") {
    custChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children?$top=100`;
  } else {
    custChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${customerFolder.id}/children?$top=100`;
  }

  const custChildrenRes = await fetchGraph(custChildrenUrl, { method: "GET" }, env);
  if (!custChildrenRes.ok) {
    const err = await custChildrenRes.text().catch(() => "");
    throw new Error(`שגיאה בקריאת תוכן תיקיית הלקוח ${customerFolder.name}: ${err}`);
  }

  const custData: any = await custChildrenRes.json();
  const custItems: any[] = custData.value || [];

  // Locate the folder "שעות עבודה" (or folder containing "שעות")
  const hoursFolder = custItems.find(
    (item) => Boolean(item.folder) && (item.name === hoursFolderName || item.name.includes("שעות"))
  );

  let targetFolderId = hoursFolder ? hoursFolder.id : null;
  let targetFolderItems: any[] = [];

  if (targetFolderId) {
    // Read ONLY inside "שעות עבודה"
    const hoursChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${targetFolderId}/children?$top=200`;
    const hoursChildrenRes = await fetchGraph(hoursChildrenUrl, { method: "GET" }, env);
    if (hoursChildrenRes.ok) {
      const hoursData: any = await hoursChildrenRes.json();
      targetFolderItems = hoursData.value || [];
    }
  } else {
    // Fallback: if no explicit subfolder found, inspect customer items directly
    targetFolderItems = custItems;
  }

  // Collect ONLY Excel files from inside "שעות עבודה"
  const candidateExcelFiles: any[] = [];
  for (const item of targetFolderItems) {
    if (isExcelDriveItem(item)) {
      candidateExcelFiles.push(item);
    } else if (item.folder) {
      // Month subfolders inside "שעות עבודה" (e.g. "2026-09" or "ספטמבר 2026")
      try {
        const subUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${item.id}/children?$top=50`;
        const subRes = await fetchGraph(subUrl, { method: "GET" }, env);
        if (subRes.ok) {
          const subData: any = await subRes.json();
          for (const subItem of subData.value || []) {
            if (isExcelDriveItem(subItem)) {
              candidateExcelFiles.push({
                ...subItem,
                parentFolderName: item.name,
              });
            }
          }
        }
      } catch (err) {
        // ignore subfolder read errors
      }
    }
  }

  // SORT candidate Excel files: NEWEST FIRST! (by lastModifiedDateTime descending)
  candidateExcelFiles.sort((a, b) => {
    const timeA = a.lastModifiedDateTime ? new Date(a.lastModifiedDateTime).getTime() : 0;
    const timeB = b.lastModifiedDateTime ? new Date(b.lastModifiedDateTime).getTime() : 0;
    return timeB - timeA;
  });

  // Populate availableFiles with all files from "שעות עבודה" (ordered newest to oldest) for manual selection
  const availableFiles: Array<{ fileId: string; fileName: string; webUrl?: string }> = [];
  for (const f of candidateExcelFiles) {
    recordFileDrive(f.id, driveId);
    if (!availableFiles.some((x) => x.fileId === f.id)) {
      availableFiles.push({
        fileId: f.id,
        fileName: f.name,
        webUrl: f.webUrl,
      });
    }
  }

  const existingNames = candidateExcelFiles.map((i) => i.name);

  // If no Excel files found inside "שעות עבודה"
  if (candidateExcelFiles.length === 0) {
    return {
      found: false,
      message: `לא נמצאו קבצי Excel בתיקיית "${hoursFolderName}" של ${customerFolder.name}.`,
      customerName: customerFolder.name,
      requestedMonth: ym,
      existingItems: targetFolderItems.map((i) => i.name),
      availableFiles: [],
    };
  }

  // "ותמיד שיקח את הקובץ הכי חדש":
  // Check if a file specifically matches the current target month; otherwise take the absolute newest file!
  const monthMatch = matchMonthItem(candidateExcelFiles, year, month, customerFolder.name);
  const chosenFile = monthMatch || candidateExcelFiles[0];

  recordFileDrive(chosenFile.id, driveId);

  const folderPrefix = chosenFile.parentFolderName
    ? `${customerFolder.name}/${hoursFolderName}/${chosenFile.parentFolderName}`
    : `${customerFolder.name}/${hoursFolderName}`;

  return {
    found: true,
    customerName: customerFolder.name,
    requestedMonth: ym,
    targetType: "file",
    fileId: chosenFile.id,
    fileName: chosenFile.name,
    filePath: `${folderPrefix}/${chosenFile.name}`,
    webUrl: chosenFile.webUrl,
    driveId,
    existingItems: existingNames,
    availableFiles, // All files from "שעות עבודה" sorted newest to oldest!
  };
}

/**
 * Resolves the correct driveId for a fileId without causing subrequest limits on Cloudflare Workers.
 */
export async function resolveDriveForItem(
  fileId: string,
  preferredDriveId?: string,
  env?: any
): Promise<string> {
  // 1. If preferredDriveId is provided, use it directly (0 subrequests!)
  if (preferredDriveId) {
    recordFileDrive(fileId, preferredDriveId);
    return preferredDriveId;
  }

  // 2. Check in-memory file drive cache (0 subrequests!)
  if (fileDriveMap.has(fileId)) {
    return fileDriveMap.get(fileId)!;
  }

  // 3. Fallback to default SharePoint drive
  const { driveId: defaultDriveId } = await resolveSharePointDrive(env);
  return defaultDriveId;
}

/**
 * Normalize tab name before comparing:
 * - trim, remove surrounding quotes/parentheses/brackets
 * - ignore customer name inside tab name
 * - ignore punctuation/dashes/underscores
 * - normalize Hebrew spelling ("פרוייקטים" = "פרויקטים")
 * - lowercase English
 */
export function normalizeTabName(rawName: string, customerName?: string): string {
  if (!rawName) return "";
  let name = String(rawName).trim();

  // Remove surrounding quotes, brackets, parentheses
  name = name.replace(/^["'\[\(«]+|["'\]\)»]+$/g, "").trim();

  // If customer name provided, remove customer name and surrounding separators
  if (customerName) {
    const custClean = customerName.trim();
    if (custClean) {
      const escaped = custClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const custRegex = new RegExp(`(^|\\s|[-_:/])(${escaped})(\\s*[-_:/]*)`, "gi");
      name = name.replace(custRegex, " ").trim();
      const custRegexEnd = new RegExp(`(\\s*[-_:/]*\\s*)(${escaped})($|\\s)`, "gi");
      name = name.replace(custRegexEnd, " ").trim();
    }
  }

  // Remove year numbers e.g. 2024..2030
  name = name.replace(/\b(202[0-9]|203[0-9])\b/g, "").trim();

  // Replace punctuation/dashes/underscores with space
  name = name.replace(/[-_:|/\\.,;~`"'!@#$%^&*()_+={}\[\]<>?]/g, " ");

  // Normalize Hebrew spelling: "פרוייקט" -> "פרויקט"
  name = name.replace(/פרוייקט/g, "פרויקט");
  // Remove niqqud
  name = name.replace(/[\u0591-\u05C7]/g, "");

  // Collapse whitespace
  name = name.replace(/\s+/g, " ").trim().toLowerCase();

  return name;
}

/**
 * 2. CLASSIFY TABS BY MEANING (not by exact name)
 * - Evaluates BOTH normalized tab name and headers
 * - Returns: "tickets" | "onsite" | "project" | "other_or_summary"
 * - Marks summary/pivot/chart/no-header tabs as isDataTab: false
 */
export function classifyWorksheet(
  rawName: string,
  headers: string[],
  customerName?: string
): {
  detectedType: TabSemanticType;
  confidence: number;
  typeReason: string;
  isDataTab: boolean;
} {
  const normName = normalizeTabName(rawName, customerName);
  const normHeaders = (headers || []).map((h) => String(h || "").trim().toLowerCase());

  // Check if summary/pivot/chart/hidden/overview tab
  const summaryKeywords = [
    "סיכום", "ריכוז", "סהכ", "סה״כ", "סה\"כ", "דשבורד", "לוח בקרה",
    "גרף", "גרפים", "טבלת ציר", "חיוב", "חשבונית", "נתונים כלליים",
    "summary", "totals", "pivot", "dashboard", "chart", "overview", "invoice", "stats"
  ];

  const isSummaryName = summaryKeywords.some((kw) => normName.includes(kw));

  // Check if header row contains basic data row signals (date or employee or hours)
  const hasDateHeader = normHeaders.some((h) =>
    h.includes("תאריך") || h.includes("ת. ביצוע") || h.includes("תאריך עבודה") || h.includes("date")
  );
  const hasHoursHeader = normHeaders.some((h) =>
    h.includes("שעות") || h.includes("סה\"כ") || h.includes("סה״כ") || h.includes("משך") || h.includes("hours") || h.includes("duration")
  );
  const hasEmployeeHeader = normHeaders.some((h) =>
    h.includes("טכנאי") || h.includes("עובד") || h.includes("מבצע") || h.includes("שם") || h.includes("tech") || h.includes("engineer")
  );

  const hasEssentialWorkHeaders = (hasDateHeader && (hasHoursHeader || hasEmployeeHeader)) || (hasHoursHeader && hasEmployeeHeader);

  if (isSummaryName || !hasEssentialWorkHeaders) {
    if (!hasEssentialWorkHeaders) {
      return {
        detectedType: "other_or_summary",
        confidence: 0.9,
        typeReason: "הגיליון אינו מכיל כותרות שדות עבודה (תאריך, עובד, שעות)",
        isDataTab: false,
      };
    }
    if (isSummaryName) {
      return {
        detectedType: "other_or_summary",
        confidence: 0.95,
        typeReason: `טאב סיכום/ריכוז לפי שם הגיליון ("${rawName}")`,
        isDataTab: false,
      };
    }
  }

  let ticketsScore = 0;
  let onsiteScore = 0;
  let projectScore = 0;

  const ticketsReasons: string[] = [];
  const onsiteReasons: string[] = [];
  const projectReasons: string[] = [];

  // Tab Name Signals
  const ticketsNameTerms = [
    "טיקט", "טיקטים", "קריאה", "קריאות", "תמיכה", "שוטף", "מרחוק", "מוקד",
    "טלפוני", "ריטיינר", "שירות", "ticket", "tickets", "support", "remote", "helpdesk", "service"
  ];
  for (const term of ticketsNameTerms) {
    if (normName.includes(term)) {
      ticketsScore += 4;
      ticketsReasons.push(`שם הטאב מכיל "${term}"`);
      break;
    }
  }

  const onsiteNameTerms = [
    "ביקור", "ביקורים", "באתר", "הגעה", "שטח", "אתר", "פיזי",
    "onsite", "on site", "site", "visit", "visits", "field"
  ];
  for (const term of onsiteNameTerms) {
    if (normName.includes(term)) {
      onsiteScore += 4;
      onsiteReasons.push(`שם הטאב מכיל "${term}"`);
      break;
    }
  }

  const projectNameTerms = [
    "פרויקט", "פרויקטים", "הקמה", "מיגרציה", "שדרוג", "פיתוח", "תשתית",
    "project", "projects", "setup", "migration", "infrastructure", "rollout"
  ];
  for (const term of projectNameTerms) {
    if (normName.includes(term)) {
      projectScore += 4;
      projectReasons.push(`שם הטאב מכיל "${term}"`);
      break;
    }
  }

  // Header Signals
  for (const h of normHeaders) {
    // Tickets headers:
    if (h.includes("קריאה") || h.includes("טיקט") || h.includes("ticket") || h.includes("מס' קריאה") || h.includes("פונה") || h.includes("caller")) {
      ticketsScore += 2.5;
      ticketsReasons.push(`כותרת "${h}"`);
    }

    // Onsite headers:
    if (
      h.includes("הגעה") || h.includes("עזיבה") || h.includes("כניסה") || h.includes("יציאה") ||
      h.includes("arrival") || h.includes("departure") ||
      h.includes("חתימ") || h.includes("חתימת") || h.includes("אישור לקוח") || h.includes("signature") ||
      h.includes("נסיעה") || h.includes("חניה") || h.includes("קמ") || h.includes("קילומטראז")
    ) {
      onsiteScore += 2.5;
      onsiteReasons.push(`כותרת "${h}"`);
    }

    // Project headers:
    if (
      h.includes("שם פרויקט") || h.includes("שם הפרויקט") || h.includes("נושא") || h.includes("משימה") ||
      h.includes("אבן דרך") || h.includes("תוצר") || h.includes("פירוט ביצוע") || h.includes("שלב") ||
      h.includes("task") || h.includes("milestone") || (h.includes("פרויקט") && !normName.includes("פרויקט"))
    ) {
      projectScore += 2.5;
      projectReasons.push(`כותרת "${h}"`);
    }
  }

  if (onsiteScore > ticketsScore && onsiteScore > projectScore) {
    return {
      detectedType: "onsite",
      confidence: Math.min(0.99, 0.6 + onsiteScore * 0.05),
      typeReason: `סווג כביקור באתר (${onsiteReasons.slice(0, 3).join(", ")})`,
      isDataTab: true,
    };
  }

  if (projectScore > ticketsScore && projectScore > onsiteScore) {
    return {
      detectedType: "project",
      confidence: Math.min(0.99, 0.6 + projectScore * 0.05),
      typeReason: `סווג כפרויקט (${projectReasons.slice(0, 3).join(", ")})`,
      isDataTab: true,
    };
  }

  if (ticketsScore > 0 || hasEssentialWorkHeaders) {
    return {
      detectedType: "tickets",
      confidence: Math.min(0.99, 0.6 + ticketsScore * 0.05),
      typeReason: ticketsReasons.length > 0
        ? `סווג כקריאות שירות/תמיכה (${ticketsReasons.slice(0, 3).join(", ")})`
        : "סווג כטאב שעות שוטף/קריאות שירות",
      isDataTab: true,
    };
  }

  return {
    detectedType: "other_or_summary",
    confidence: 0.5,
    typeReason: "לא זוהה סוג נתונים מוגדר",
    isDataTab: false,
  };
}

/**
 * 4. Map fields to the headers of the chosen tab by meaning, tolerant to wording differences
 */
export function mapHeadersToSemanticFields(headers: string[]): {
  fieldToColIndex: Partial<Record<StandardColumnField, number>>;
  colIndexToField: Array<StandardColumnField | null>;
  unmappedFields: StandardColumnField[];
} {
  const fieldToColIndex: Partial<Record<StandardColumnField, number>> = {};
  const colIndexToField: Array<StandardColumnField | null> = new Array(headers.length).fill(null);
  const assignedCols = new Set<number>();

  function matchField(field: StandardColumnField, testFn: (header: string, index: number) => boolean) {
    if (fieldToColIndex[field] !== undefined) return;
    for (let i = 0; i < headers.length; i++) {
      if (assignedCols.has(i)) continue;
      const h = String(headers[i] || "").trim().toLowerCase();
      if (testFn(h, i)) {
        fieldToColIndex[field] = i;
        colIndexToField[i] = field;
        assignedCols.add(i);
        break;
      }
    }
  }

  // 1. Date (תאריך)
  matchField("date", (h) =>
    h === "תאריך" || h === "ת. ביצוע" || h === "תאריך עבודה" || h === "תאריך ביצוע" ||
    h === "תאריך פעילות" || h === "תאריך קריאה" || h === "date" || h === "work date" ||
    (h.includes("תאריך") && !h.includes("עד") && !h.includes("סיום"))
  );

  // 2. Day of week (יום בשבוע)
  matchField("day_of_week", (h) =>
    h === "יום" || h === "יום בשבוע" || h === "יום עבודה" || h === "יום מלא" ||
    h === "day" || h === "weekday"
  );

  // 3. Employee (טכנאי / עובד)
  matchField("employee", (h) =>
    h === "טכנאי" || h === "שם טכנאי" || h === "שם הטכנאי" || h === "עובד" ||
    h === "שם עובד" || h === "מבצע" || h === "מטפל" || h === "איש צוות" ||
    h === "איש שירות" || h === "איש מחשוב" || h === "technician" || h === "tech" ||
    h === "employee" || h === "engineer" || h.includes("טכנאי") || h.includes("עובד")
  );

  // 4. Start time (שעת התחלה / שעת הגעה)
  matchField("start_time", (h) =>
    h === "שעת התחלה" || h === "התחלה" || h === "משעה" || h === "שעה מה" ||
    h === "שעת הגעה" || h === "הגעה" || h === "שעת כניסה" || h === "כניסה" ||
    h === "start" || h === "start time" || h === "arrival" || h.includes("התחלה") || h.includes("הגעה")
  );

  // 5. End time (שעת סיום / שעת עזיבה)
  matchField("end_time", (h) =>
    h === "שעת סיום" || h === "סיום" || h === "עד שעה" || h === "שעה עד" ||
    h === "שעת עזיבה" || h === "עזיבה" || h === "שעת יציאה" || h === "יציאה" ||
    h === "end" || h === "end time" || h === "departure" || h.includes("סיום") || h.includes("עזיבה")
  );

  // 6. Duration hours (סה"כ שעות / משך)
  matchField("duration_hours", (h) =>
    h === "סה\"כ" || h === "סה״כ" || h === "סה\"כ שעות" || h === "סה״כ שעות" ||
    h === "שעות" || h === "משך" || h === "משך זמן" || h === "סה\"כ זמן" ||
    h === "סה״כ זמן" || h === "זמן" || h === "כמות שעות" || h === "hours" ||
    h === "total hours" || h === "duration" || h.includes("סה\"כ") || h.includes("סה״כ") || h.includes("שעות")
  );

  // 7. Description (תיאור / מהות הקריאה)
  matchField("description", (h) =>
    h === "תיאור" || h === "תיאור פעילות" || h === "מהות הקריאה" || h === "מהות הפעילות" ||
    h === "מהות" || h === "פירוט" || h === "פירוט הטיפול" || h === "פירוט ביצוע" || h === "נושא" ||
    h === "מה בוצע" || h === "פעילות" || h === "description" || h === "details" ||
    h === "summary" || h === "task" || h.includes("תיאור") || h.includes("מהות") || h.includes("פירוט") ||
    h.includes("details") || h.includes("task") || h.includes("description") || h.includes("summary")
  );

  // 8. Ticket number (מספר קריאה / טיקט)
  matchField("ticket_number", (h) =>
    !h.includes("מהות") && !h.includes("פירוט") && !h.includes("תיאור") && !h.includes("תאריך") && (
      h === "מספר קריאה" || h === "מס' קריאה" || h === "מספר טיקט" || h === "מס' טיקט" ||
      h === "מספר" || h === "קריאה" || h === "טיקט" || h === "קריאה #" || h === "ticket" || h === "ticket #" ||
      h === "ticket number" || h === "call #" || h === "incident" || h.includes("מספר קריאה") || h.includes("מס' קריאה") ||
      h.includes("מספר טיקט") || h.includes("מס' טיקט") || h.startsWith("קריאה") || h.startsWith("טיקט")
    )
  );

  // 9. Contact person (איש קשר / פונה)
  matchField("contact_person", (h) =>
    h === "איש קשר" || h === "פונה" || h === "שם הפונה" || h === "נציג לקוח" ||
    h === "נציג" || h === "פנה" || h === "contact" || h === "contact person" ||
    h === "caller" || h.includes("איש קשר") || h.includes("פונה")
  );

  // 10. Signature / Approval (חתימה / אישור)
  matchField("signature_or_approval", (h) =>
    h === "חתימה" || h === "חתימת לקוח" || h === "אישור לקוח" || h === "אישור" ||
    h === "חתימת הנציג" || h === "signature" || h === "sign" || h.includes("חתימ") || h.includes("אישור")
  );

  // 11. Notes / Status (הערות / סטטוס)
  matchField("notes", (h) =>
    h === "הערות" || h === "הערה" || h === "סטטוס" || h === "notes" || h === "comments" || h === "status"
  );

  const allStandardFields: StandardColumnField[] = [
    "date",
    "day_of_week",
    "employee",
    "start_time",
    "end_time",
    "duration_hours",
    "description",
    "contact_person",
    "ticket_number",
    "signature_or_approval",
    "notes",
  ];

  const unmappedFields = allStandardFields.filter((f) => fieldToColIndex[f] === undefined);

  return { fieldToColIndex, colIndexToField, unmappedFields };
}

// In-memory workbook inspection cache per file: itemId + lastModified (never across customers)
const fileWorkbookCache = new Map<string, { result: WorkbookInspectionResult; expiresAt: number }>();

export function clearFileWorkbookCache(fileId?: string): void {
  if (fileId) {
    for (const key of fileWorkbookCache.keys()) {
      if (key.startsWith(fileId)) fileWorkbookCache.delete(key);
    }
  } else {
    fileWorkbookCache.clear();
  }
}

/**
 * 1. READ EACH FILE AS IT IS
 * - Reads ALL worksheets: name, header row, and 3 recent data rows each.
 * - Caches per file (by itemId + lastModified), never across customers.
 */
export async function inspectWorkbookFile(
  fileId: string,
  env?: any,
  explicitDriveId?: string,
  customerName?: string
): Promise<WorkbookInspectionResult> {
  const driveId = await resolveDriveForItem(fileId, explicitDriveId, env);

  // Get file metadata for lastModifiedDateTime
  let lastModified = "";
  let fileName = "hours.xlsx";
  let webUrl = "";

  try {
    const itemUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}?$select=id,name,lastModifiedDateTime,webUrl`;
    const itemRes = await fetchGraph(itemUrl, { method: "GET" }, env);
    if (itemRes.ok) {
      const itemData: any = await itemRes.json();
      lastModified = itemData.lastModifiedDateTime || "";
      fileName = itemData.name || fileName;
      webUrl = itemData.webUrl || "";
    }
  } catch (itemErr) {
    console.warn("[inspectWorkbookFile] item metadata warning:", itemErr);
  }

  const cacheKey = `${fileId}:${lastModified}`;
  const cached = fileWorkbookCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  // Fetch all worksheets from Excel workbook
  const sheetsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets?$top=50`;
  const sheetsRes = await fetchGraph(sheetsUrl, { method: "GET" }, env);
  if (!sheetsRes.ok) {
    const err = await sheetsRes.text().catch(() => "");
    throw new Error(`שגיאה בקריאת גליונות עבודה מקובץ Excel (${sheetsRes.status}): ${err}`);
  }

  const sheetsData: any = await sheetsRes.json();
  const rawSheets: any[] = sheetsData.value || [];
  if (rawSheets.length === 0) {
    throw new Error("קובץ ה-Excel ריק מגיליונות עבודה");
  }

  const inspectedSheets: InspectedWorksheet[] = [];

  for (const sheet of rawSheets) {
    // Ignore hidden sheets
    if (sheet.visibility && sheet.visibility !== "Visible") {
      continue;
    }

    const sheetId = sheet.id;
    const sheetName = sheet.name || "";
    const normalizedName = normalizeTabName(sheetName, customerName);

    // A. Check for Excel Table
    let isTable = false;
    let tableId: string | undefined = undefined;
    let tableName: string | undefined = undefined;
    let headers: string[] = [];
    let recentRows: any[][] = [];
    let totalDataRows = 0;
    let formats: any = { formulaColumns: [] };
    let hasHeaderRow = false;
    let headerRowIndex = 0;

    try {
      const tablesUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/tables?$top=5`;
      const tablesRes = await fetchGraph(tablesUrl, { method: "GET" }, env);
      if (tablesRes.ok) {
        const tablesData: any = await tablesRes.json();
        const tables: any[] = tablesData.value || [];
        if (tables.length > 0) {
          isTable = true;
          const table = tables[0];
          tableId = table.id;
          tableName = table.name;

          // Header row range
          const headerUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${tableId}/headerRowRange`;
          const headerRes = await fetchGraph(headerUrl, { method: "GET" }, env);
          if (headerRes.ok) {
            const hData: any = await headerRes.json();
            headers = (hData?.values?.[0] || []).map((h: any) => String(h || "").trim());
            hasHeaderRow = headers.length > 0;
          }

          // Data rows (up to 3 recent data rows)
          const rowsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${tableId}/rows?$top=100`;
          const rowsRes = await fetchGraph(rowsUrl, { method: "GET" }, env);
          if (rowsRes.ok) {
            const rData: any = await rowsRes.json();
            const all = (rData.value || []).map((r: any) => r.values?.[0] || []);
            totalDataRows = all.length;
            recentRows = all.slice(-3);
            formats = detectRowFormats(headers, all);
          }
        }
      }
    } catch (tblErr) {
      console.warn(`[inspectWorkbookFile] table check error for ${sheetName}:`, tblErr);
    }

    // B. Plain Range if no table found
    if (!isTable) {
      try {
        const usedUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/usedRange`;
        const usedRes = await fetchGraph(usedUrl, { method: "GET" }, env);
        if (usedRes.ok) {
          const uData: any = await usedRes.json();
          const values: any[][] = uData.values || [];
          const formulas: any[][] = uData.formulas || [];

          // Detect header row in first 15 rows
          const headerKeywords = [
            "תאריך", "יום", "עובד", "טכנאי", "מבצע", "שעה", "שעות", "משך", "התחלה", "סיום", "הגעה", "עזיבה",
            "סהכ", "סה״כ", "סה\"כ", "איש קשר", "קשר", "נציג", "פונה", "קריאה", "טיקט", "מהות",
            "תיאור", "פירוט", "נושא", "פרויקט", "פרוייקט", "חתימה", "אישור", "סטטוס", "הערות",
            "date", "day", "employee", "technician", "start", "end", "hours", "duration", "contact", "ticket"
          ];

          let bestScore = -1;
          for (let r = 0; r < Math.min(values.length, 15); r++) {
            const row = values[r] || [];
            const textCols = row.filter((c: any) => typeof c === "string" && c.trim().length > 0);
            let score = 0;
            for (const c of textCols) {
              const lower = normalizeCustomerString(String(c)).toLowerCase();
              if (headerKeywords.some((k) => lower.includes(k))) score++;
            }
            if (score > bestScore && score >= 2) {
              bestScore = score;
              headerRowIndex = r;
              headers = row.map((c: any) => String(c || "").trim());
              hasHeaderRow = true;
            } else if (bestScore < 2 && textCols.length >= 3 && textCols.length > headers.length) {
              headerRowIndex = r;
              headers = row.map((c: any) => String(c || "").trim());
              hasHeaderRow = true;
            }
          }

          // Trim trailing empty headers
          let lastCol = headers.length - 1;
          while (lastCol >= 0 && !headers[lastCol]) lastCol--;
          if (lastCol >= 0) headers = headers.slice(0, lastCol + 1);

          // Data rows below header row
          const dataRows: any[][] = [];
          for (let r = headerRowIndex + 1; r < values.length; r++) {
            const row = values[r] || [];
            const isRowEmpty = row.every((c: any) => c === null || c === "" || c === undefined);
            if (isRowEmpty) continue;
            // Check if totals row
            const isTotals = row.some((c: any) =>
              typeof c === "string" && ["סה״כ", "סה\"כ", "סך הכל", "סיכום", "total"].some((k) => c.toLowerCase().includes(k))
            );
            if (isTotals) break;
            dataRows.push(row);
          }

          totalDataRows = dataRows.length;
          recentRows = dataRows.slice(-3);
          formats = detectRowFormats(headers, dataRows, formulas);
        }
      } catch (usedErr) {
        console.warn(`[inspectWorkbookFile] usedRange error for ${sheetName}:`, usedErr);
      }
    }

    // Classify worksheet
    const classification = classifyWorksheet(sheetName, headers, customerName);
    const semanticMapping = mapHeadersToSemanticFields(headers);

    inspectedSheets.push({
      sheetId,
      name: sheetName,
      normalizedName,
      visibility: sheet.visibility || "Visible",
      isTable,
      tableName,
      tableId,
      hasHeaderRow,
      headerRowIndex,
      headers,
      recentRows,
      totalDataRows,
      detectedType: classification.detectedType,
      typeConfidence: classification.confidence,
      typeReason: classification.typeReason,
      isDataTab: classification.isDataTab,
      fieldToColIndex: semanticMapping.fieldToColIndex,
      colIndexToField: semanticMapping.colIndexToField,
      unmappedFields: semanticMapping.unmappedFields,
      formats,
    });
  }

  const dataTabs = inspectedSheets.filter((s) => s.isDataTab);

  const result: WorkbookInspectionResult = {
    fileId,
    fileName,
    driveId,
    webUrl,
    customerName,
    lastModified,
    worksheets: inspectedSheets,
    dataTabs,
    inspectedAt: Date.now(),
  };

  fileWorkbookCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return result;
}

/**
 * 3. CHOOSE THE TARGET TAB
 * - Match entry type to classified tab. If exactly 1 match -> use it.
 * - If only 1 data tab in file -> use it.
 * - If multiple similar candidates -> flag choice and show real tab names.
 */
export function chooseTargetWorksheet(
  inspection: WorkbookInspectionResult,
  options?: {
    preferredTabName?: string;
    entryType?: TabSemanticType;
    entryDescription?: string;
  }
): {
  selectedTab: InspectedWorksheet;
  needsUserChoice: boolean;
  choiceReason: string;
  availableTabs: Array<{
    name: string;
    detectedType: TabSemanticType;
    isSelected: boolean;
  }>;
} {
  const dataTabs = inspection.dataTabs;

  if (dataTabs.length === 0) {
    const fallback = inspection.worksheets[0];
    return {
      selectedTab: fallback,
      needsUserChoice: false,
      choiceReason: "לא זוהו טאבים מובנים, ברירת מחדל לגיליון הראשון",
      availableTabs: inspection.worksheets.map((w) => ({
        name: w.name,
        detectedType: w.detectedType,
        isSelected: w.sheetId === fallback?.sheetId,
      })),
    };
  }

  if (dataTabs.length === 1) {
    const single = dataTabs[0];
    return {
      selectedTab: single,
      needsUserChoice: false,
      choiceReason: `קובץ זה מכיל טאב נתונים יחיד ("${single.name}")`,
      availableTabs: [{
        name: single.name,
        detectedType: single.detectedType,
        isSelected: true,
      }],
    };
  }

  // Explicit user tab choice (e.g. from UI button or voice "תעביר לטאב X")
  if (options?.preferredTabName) {
    const req = options.preferredTabName.trim().toLowerCase();
    const exact = dataTabs.find((t) => t.name.trim().toLowerCase() === req);
    if (exact) {
      return {
        selectedTab: exact,
        needsUserChoice: false,
        choiceReason: `נבחר הטאב "${exact.name}" לפי בקשת המשתמש`,
        availableTabs: dataTabs.map((t) => ({
          name: t.name,
          detectedType: t.detectedType,
          isSelected: t.sheetId === exact.sheetId,
        })),
      };
    }
    const normReq = normalizeTabName(options.preferredTabName);
    const fuzzy = dataTabs.find((t) => t.normalizedName.includes(normReq) || normReq.includes(t.normalizedName));
    if (fuzzy) {
      return {
        selectedTab: fuzzy,
        needsUserChoice: false,
        choiceReason: `נבחר הטאב "${fuzzy.name}" בהתאמה לבקשת המשתמש`,
        availableTabs: dataTabs.map((t) => ({
          name: t.name,
          detectedType: t.detectedType,
          isSelected: t.sheetId === fuzzy.sheetId,
        })),
      };
    }
  }

  // Match entry type
  let targetCategory: TabSemanticType = options?.entryType || "tickets";
  if (!options?.entryType && options?.entryDescription) {
    const desc = options.entryDescription.toLowerCase();
    if (desc.includes("ביקור") || desc.includes("באתר") || desc.includes("הגעתי") || desc.includes("פיזי")) {
      targetCategory = "onsite";
    } else if (desc.includes("פרויקט") || desc.includes("מיגרציה") || desc.includes("הקמה") || desc.includes("שדרוג")) {
      targetCategory = "project";
    } else {
      targetCategory = "tickets";
    }
  }

  const matchingTabs = dataTabs.filter((t) => t.detectedType === targetCategory);

  if (matchingTabs.length === 1) {
    const match = matchingTabs[0];
    return {
      selectedTab: match,
      needsUserChoice: false,
      choiceReason: `נבחר טאב "${match.name}" שהותאם לסוג הפעילות (${match.typeReason})`,
      availableTabs: dataTabs.map((t) => ({
        name: t.name,
        detectedType: t.detectedType,
        isSelected: t.sheetId === match.sheetId,
      })),
    };
  }

  if (matchingTabs.length > 1) {
    const bestMatch = matchingTabs[0];
    return {
      selectedTab: bestMatch,
      needsUserChoice: true,
      choiceReason: `בקובץ קיימים ${matchingTabs.length} טאבים מתאימים: ${matchingTabs.map((t) => `"${t.name}"`).join(", ")}`,
      availableTabs: dataTabs.map((t) => ({
        name: t.name,
        detectedType: t.detectedType,
        isSelected: t.sheetId === bestMatch.sheetId,
      })),
    };
  }

  // If the entry type has no matching tab in that customer's file, ask the employee which real tab to use
  const defaultTab = dataTabs[0];
  const typeHebrewNames: Record<TabSemanticType, string> = {
    tickets: "קריאות שירות / טיקטים",
    onsite: "ביקור באתר",
    project: "פרויקטים",
    other_or_summary: "פעילות",
  };
  const categoryLabel = typeHebrewNames[targetCategory] || targetCategory;
  return {
    selectedTab: defaultTab,
    needsUserChoice: true,
    choiceReason: `לא נמצא טאב מותאם עבור "${categoryLabel}" בקובץ זה. אנא בחר לאיזה טאב לרשום מבין הטאבים הקיימים: ${dataTabs.map((t) => `"${t.name}"`).join(", ")}`,
    availableTabs: dataTabs.map((t) => ({
      name: t.name,
      detectedType: t.detectedType,
      isSelected: t.sheetId === defaultTab.sheetId,
    })),
  };
}

/**
 * Build row values array strictly according to semantic header mapping.
 * Unmapped fields are NOT written anywhere.
 */
export function buildRowValuesFromSemanticMapping(
  rowObj: Record<string, any>,
  targetTab: InspectedWorksheet
): any[] {
  const { headers, fieldToColIndex, formats } = targetTab;
  const values: any[] = new Array(headers.length).fill("");

  if (fieldToColIndex.date !== undefined) {
    const rawDate = rowObj.date || rowObj["תאריך"] || "";
    values[fieldToColIndex.date] = formatDateForSheet(rawDate, formats.dateFormat);
  }

  if (fieldToColIndex.day_of_week !== undefined) {
    const rawDate = rowObj.date || rowObj["תאריך"] || "";
    const formatType = formats.dayFormat === "full" ? "full" : "short";
    values[fieldToColIndex.day_of_week] = getHebrewDay(rawDate, formatType) || "";
  }

  if (fieldToColIndex.employee !== undefined) {
    values[fieldToColIndex.employee] = rowObj.userName || rowObj.employee || rowObj["עובד"] || rowObj["טכנאי"] || "";
  }

  if (fieldToColIndex.start_time !== undefined) {
    values[fieldToColIndex.start_time] = rowObj.startTime || rowObj["שעת התחלה"] || "";
  }

  if (fieldToColIndex.end_time !== undefined) {
    values[fieldToColIndex.end_time] = rowObj.endTime || rowObj["שעת סיום"] || "";
  }

  if (fieldToColIndex.duration_hours !== undefined) {
    const rawDuration = rowObj.hours ?? rowObj.durationHours ?? rowObj["שעות"] ?? rowObj["משך"] ?? 0;
    if (formats.hoursFormat === "hh:mm") {
      const mins = Math.round(Number(rawDuration) * 60) || 0;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      values[fieldToColIndex.duration_hours] = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    } else {
      values[fieldToColIndex.duration_hours] = typeof rawDuration === "number" ? rawDuration : Number(rawDuration) || 0;
    }
  }

  if (fieldToColIndex.description !== undefined) {
    values[fieldToColIndex.description] = rowObj.desc || rowObj.description || rowObj["תיאור"] || "";
  }

  if (fieldToColIndex.contact_person !== undefined) {
    values[fieldToColIndex.contact_person] = rowObj.contactPerson || rowObj["איש קשר"] || "";
  }

  if (fieldToColIndex.ticket_number !== undefined) {
    values[fieldToColIndex.ticket_number] = rowObj.ticketNumber || rowObj["מספר קריאה"] || rowObj["מספר טיקט"] || "";
  }

  if (fieldToColIndex.signature_or_approval !== undefined) {
    // Rule: Never write to signature/approval columns (e.g. 'חתימת לקוח') – always leave empty
    values[fieldToColIndex.signature_or_approval] = "";
  }

  if (fieldToColIndex.notes !== undefined) {
    values[fieldToColIndex.notes] = rowObj.notes || rowObj["הערות"] || "";
  }

  return values;
}

/**
 * Backward-compatible helper that delegates to chooseTargetWorksheet
 */
export function matchWorksheetByWorkType(sheets: any[], workType?: string): any {
  if (!sheets || sheets.length === 0) return null;
  const visibleSheets = sheets.filter((s) => !s.visibility || s.visibility === "Visible");
  const candidates = visibleSheets.length > 0 ? visibleSheets : sheets;
  if (!workType) {
    const firstData = candidates.find((s) => classifyWorksheet(s.name || "", []).isDataTab);
    return firstData || candidates[0];
  }
  const wt = workType.trim().toLowerCase();
  // 1. Exact match
  const exact = candidates.find((s) => (s.name || "").trim().toLowerCase() === wt);
  if (exact) return exact;
  // 2. Normalized substring match
  const norm = normalizeTabName(workType);
  const fuzzy = candidates.find((s) => {
    const sNorm = normalizeTabName(s.name || "");
    return sNorm.includes(norm) || norm.includes(sNorm);
  });
  if (fuzzy) return fuzzy;
  // 3. Semantic category match ("tickets", "onsite", "project")
  const semanticType: TabSemanticType | null =
    wt.includes("טיקט") || wt.includes("קריאה") || wt.includes("קריאות") || wt === "tickets"
      ? "tickets"
      : wt.includes("ביקור") || wt.includes("אתר") || wt === "onsite"
      ? "onsite"
      : wt.includes("פרויקט") || wt.includes("פרוייקט") || wt === "project"
      ? "project"
      : null;

  if (semanticType) {
    const semanticMatch = candidates.find((s) => {
      const cls = classifyWorksheet(s.name || "", []);
      return cls.detectedType === semanticType && cls.isDataTab;
    });
    if (semanticMatch) return semanticMatch;
  }
  // 4. Default to first data tab over summary tab
  const firstData = candidates.find((s) => classifyWorksheet(s.name || "", []).isDataTab);
  return firstData || candidates[0];
}

/**
 * 4. readSheetStructure(fileId) – open the workbook:
 * - Detects all worksheets and matches the tab corresponding to workType (ביקור באתר, טיקטים, פרוייקטים).
 * - If there is an Excel Table on that worksheet -> return table name, headers, last 5 rows.
 * - Otherwise -> read the used range of that specific worksheet.
 */
export async function readSheetStructure(
  fileId: string,
  env?: any,
  explicitDriveId?: string,
  targetWorkType?: string
): Promise<SheetStructureResult> {
  const driveId = await resolveDriveForItem(fileId, explicitDriveId, env);

  // 1. Fetch all worksheets from Excel workbook
  const sheetsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets?$top=20`;
  const sheetsRes = await fetchGraph(sheetsUrl, { method: "GET" }, env);
  if (!sheetsRes.ok) {
    const err = await sheetsRes.text().catch(() => "");
    throw new Error(`שגיאה בקריאת גליונות עבודה מקובץ Excel (${sheetsRes.status}): ${err}`);
  }

  const sheetsData: any = await sheetsRes.json();
  const sheets: any[] = sheetsData.value || [];
  if (sheets.length === 0) {
    throw new Error("קובץ ה-Excel ריק מגיליונות עבודה");
  }

  // Target the specific tab/worksheet corresponding to the work type
  const targetSheet = matchWorksheetByWorkType(sheets, targetWorkType) || sheets[0];
  const sheetId = targetSheet.id;
  const sheetName = targetSheet.name;

  // 2. Check for Excel Table specifically on this worksheet
  const tablesUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/tables?$top=10`;
  const tablesRes = await fetchGraph(tablesUrl, { method: "GET" }, env);

  if (tablesRes.ok) {
    const tablesData: any = await tablesRes.json();
    const tables: any[] = tablesData.value || [];

    if (tables.length > 0) {
      const table = tables[0];
      const tableId = table.id;
      const tableName = table.name;

      // Get Table Headers
      const headerUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${tableId}/headerRowRange`;
      const headerRes = await fetchGraph(headerUrl, { method: "GET" }, env);
      let headers: string[] = [];
      if (headerRes.ok) {
        const headerData: any = await headerRes.json();
        const headerValues = headerData?.values?.[0] || [];
        headers = headerValues.map((h: any) => String(h || "").trim());
      }

      // Get Table Rows
      const rowsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${tableId}/rows?$top=999`;
      const rowsRes = await fetchGraph(rowsUrl, { method: "GET" }, env);
      let last5Rows: any[][] = [];
      let totalDataRows = 0;
      let allRows: any[][] = [];

      if (rowsRes.ok) {
        const rowsData: any = await rowsRes.json();
        allRows = (rowsData.value || []).map((r: any) => r.values?.[0] || []);
        totalDataRows = allRows.length;
        last5Rows = allRows.slice(-5);
      }

      // Detect formats from existing rows
      const formats = detectRowFormats(headers, allRows);

      return {
        fileId,
        isTable: true,
        tableName,
        tableId,
        sheetName,
        sheetId,
        headers,
        last5Rows,
        totalDataRows,
        nextEmptyRowAddress: `Table:${tableName}[#NextRow]`,
        hasTotalsRow: Boolean(table.showTotals),
        formats,
      };
    }
  }

  // 3. No Excel Table on this worksheet -> Read the used range of the matched worksheet
  const usedRangeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/usedRange`;
  const usedRangeRes = await fetchGraph(usedRangeUrl, { method: "GET" }, env);
  let values: any[][] = [];
  let formulas: any[][] = [];
  let fullAddress = "A1";

  if (usedRangeRes.ok) {
    const rangeData: any = await usedRangeRes.json();
    values = rangeData.values || [];
    formulas = rangeData.formulas || [];
    fullAddress = rangeData.address || "A1";
  } else {
    // If usedRange returned 404 (e.g. newly initialized month file with no data rows yet), attempt reading top range A1:Z15
    const fallbackRangeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='A1:Z15')`;
    const fallbackRes = await fetchGraph(fallbackRangeUrl, { method: "GET" }, env);
    if (fallbackRes.ok) {
      const fbData: any = await fallbackRes.json();
      values = fbData.values || [];
      formulas = fbData.formulas || [];
      fullAddress = fbData.address || "A1:Z15";
    } else {
      const errText = await usedRangeRes.text().catch(() => "");
      throw new Error(
        `שגיאה בקריאת נתוני גיליון "${sheetName}" מ-SharePoint (${usedRangeRes.status}): ${errText || "הגיליון אינו נגיש או שאינו מכיל טווח נתונים"}`
      );
    }
  }

  // Parse start row & col from address (e.g. "Sheet1!A1:F20" or "A1:F20" or "A1")
  const addressMatch = fullAddress.match(/(?:.*!)?([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?/i);
  const startRowIndex = addressMatch ? parseInt(addressMatch[2], 10) : 1;
  const startColLetter = addressMatch ? addressMatch[1] : "A";

  // Detect header row: scan first 15 rows to find the row with the most distinct column headers
  let headerRowOffset = 0;
  let headers: string[] = [];
  let bestHeaderScore = -1;
  const headerKeywords = [
    "תאריך", "יום", "עובד", "טכנאי", "מבצע", "שעה", "שעות", "משך", "התחלה", "סיום", "הגעה", "עזיבה",
    "סהכ", "סה״כ", "סה\"כ", "איש קשר", "קשר", "נציג", "פונה", "משתמש", "קריאה", "טיקט", "מהות",
    "תיאור", "פירוט", "נושא", "פרויקט", "פרוייקט", "חתימה", "אישור", "סטטוס", "הערות", "לקוח",
    "date", "day", "employee", "technician", "start", "end", "hours", "duration", "contact", "ticket", "task"
  ];

  for (let r = 0; r < Math.min(values.length, 15); r++) {
    const row = values[r] || [];
    const textCols = row.filter((c: any) => typeof c === "string" && c.trim().length > 0);
    let keywordScore = 0;
    for (const c of textCols) {
      const lower = normalizeCustomerString(String(c)).toLowerCase();
      if (headerKeywords.some((k) => lower.includes(k))) {
        keywordScore++;
      }
    }

    if (keywordScore > bestHeaderScore && keywordScore >= 2) {
      bestHeaderScore = keywordScore;
      headerRowOffset = r;
      headers = row.map((c: any) => String(c || "").trim());
    } else if (bestHeaderScore < 2 && textCols.length >= 3 && textCols.length > headers.length) {
      headerRowOffset = r;
      headers = row.map((c: any) => String(c || "").trim());
    }
  }

  // Trim trailing empty headers so we don't carry dozens of trailing empty columns from merged banner rows
  let lastNonEmptyCol = headers.length - 1;
  while (lastNonEmptyCol >= 0 && !headers[lastNonEmptyCol]) {
    lastNonEmptyCol--;
  }
  if (lastNonEmptyCol >= 0) {
    headers = headers.slice(0, lastNonEmptyCol + 1);
  }

  if (headers.length === 0) {
    throw new Error(
      `לא נמצאו כותרות עמודות בגיליון "${sheetName}". הקובץ או הגיליון אינם מכילים שורת כותרות תקינה להזנת נתונים.`
    );
  }

  const actualHeaderRowNumber = startRowIndex + headerRowOffset;

  // Scan rows below header row for data and totals/summary row
  const dataRows: any[][] = [];
  const dataFormulas: any[][] = [];
  let totalsRowOffset = -1;
  const totalsKeywords = ["סה״כ", "סה\"כ", "סך הכל", "סיכום", "total", "totals", "sum"];

  for (let r = headerRowOffset + 1; r < values.length; r++) {
    const row = values[r] || [];
    const rowFormulas = formulas[r] || [];
    const isRowEmpty = row.every((c: any) => c === null || c === "" || c === undefined);

    if (isRowEmpty) {
      continue;
    }

    // Check if this row is a totals row
    const isTotals = row.some((c: any) =>
      typeof c === "string" && totalsKeywords.some((k) => c.toLowerCase().includes(k))
    ) || rowFormulas.some((f: any) => typeof f === "string" && (f.startsWith("=SUM") || f.startsWith("=SUBTOTAL")));

    if (isTotals) {
      totalsRowOffset = r;
      break;
    }

    dataRows.push(row);
    dataFormulas.push(rowFormulas);
  }

  const last5Rows = dataRows.slice(-5);
  const totalDataRows = dataRows.length;
  const hasTotalsRow = totalsRowOffset !== -1;

  // Calculate next empty row address (ABOVE any totals row)
  let nextEmptyRowNumber = actualHeaderRowNumber + totalDataRows + 1;
  let totalsRowAddress: string | undefined = undefined;

  const startColIdx = columnLetterToIndex(startColLetter);
  const endColLetter = indexToColumnLetter(startColIdx + Math.max(headers.length, 1) - 1);

  if (hasTotalsRow) {
    const actualTotalsRowNumber = startRowIndex + totalsRowOffset;
    totalsRowAddress = `${startColLetter}${actualTotalsRowNumber}:${endColLetter}${actualTotalsRowNumber}`;
    nextEmptyRowNumber = actualTotalsRowNumber;
  }

  const nextEmptyRowAddress = `${startColLetter}${nextEmptyRowNumber}:${endColLetter}${nextEmptyRowNumber}`;

  // Detect row formats (date, time, hours, formula columns)
  const formats = detectRowFormats(headers, dataRows, dataFormulas);

  return {
    fileId,
    isTable: false,
    sheetName,
    sheetId,
    headers,
    last5Rows,
    totalDataRows,
    startColLetter,
    nextEmptyRowNumber,
    nextEmptyRowAddress,
    hasTotalsRow,
    totalsRowAddress,
    formats,
  };
}

/**
 * Detect formats from existing rows (date format, time format, hours as decimal or hh:mm, formulas)
 */
function detectRowFormats(
  headers: string[],
  rows: any[][],
  formulasList?: any[][]
): {
  dateFormat?: string;
  timeFormat?: string;
  hoursFormat?: "decimal" | "hh:mm";
  formulaColumns: number[];
} {
  let dateFormat = "YYYY-MM-DD";
  let timeFormat = "HH:mm";
  let hoursFormat: "decimal" | "hh:mm" = "decimal";
  const formulaColumns: number[] = [];

  // 1. Detect formula columns
  if (formulasList && formulasList.length > 0) {
    const sampleFormulas = formulasList[formulasList.length - 1] || [];
    for (let colIdx = 0; colIdx < sampleFormulas.length; colIdx++) {
      const val = sampleFormulas[colIdx];
      if (typeof val === "string" && val.startsWith("=")) {
        formulaColumns.push(colIdx);
      }
    }
  }

  // 2. Detect value formats from existing rows
  for (const row of rows.slice(-10)) {
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val === null || val === undefined || val === "") continue;

      const strVal = String(val).trim();

      // Check date formats: DD/MM/YYYY vs YYYY-MM-DD vs DD.MM.YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(strVal)) {
        dateFormat = "DD/MM/YYYY";
      } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(strVal)) {
        dateFormat = "DD.MM.YYYY";
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
        dateFormat = "YYYY-MM-DD";
      }

      // Check time format: "14:30" vs "14:30:00"
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(strVal)) {
        timeFormat = "HH:mm";
      }

      // Check hours format: decimal (e.g. 2.5 or 2) vs "02:30"
      const colHeader = headers[c] || "";
      if (colHeader.includes("שעות") || colHeader.includes("משך") || colHeader.includes("duration")) {
        if (/^\d+:\d{2}$/.test(strVal)) {
          hoursFormat = "hh:mm";
        } else if (typeof val === "number" || (!isNaN(Number(strVal)) && !strVal.includes(":"))) {
          hoursFormat = "decimal";
        }
      }
    }
  }

  return {
    dateFormat,
    timeFormat,
    hoursFormat,
    formulaColumns,
  };
}

// ==========================================
// Semantic Column Matching and Formatting Utilities
// ==========================================

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime || !durationMinutes) return "";
  const match = startTime.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const totalMins = hours * 60 + mins + durationMinutes;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function calculateStartTime(endTime: string, durationMinutes: number): string {
  if (!endTime || !durationMinutes) return "";
  const match = endTime.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  let totalMins = hours * 60 + mins - durationMinutes;
  if (totalMins < 0) totalMins += 24 * 60;
  const startH = Math.floor(totalMins / 60) % 24;
  const startM = totalMins % 60;
  return `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
}

/**
 * Suggest start and end times based on report time and duration rounded to 15 minutes.
 * e.g. end = current report time rounded to 15 min, start = end - duration.
 */
export function suggestStartEndTimes(durationMinutes: number): {
  startTime: string;
  endTime: string;
} {
  const now = new Date();
  const currentTotalM = now.getHours() * 60 + now.getMinutes();
  const roundedEndM = Math.round(currentTotalM / 15) * 15;
  const clampedEndM = Math.max(15, Math.min(23 * 60 + 45, roundedEndM));
  const effectiveMinutes = durationMinutes || 15;
  const clampedStartM = Math.max(0, clampedEndM - effectiveMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startTime: `${pad(Math.floor(clampedStartM / 60))}:${pad(clampedStartM % 60)}`,
    endTime: `${pad(Math.floor(clampedEndM / 60))}:${pad(clampedEndM % 60)}`,
  };
}

function formatDateForSheet(dateStr: any, targetFormat?: string): string {
  if (!dateStr) return "";
  const clean = String(dateStr).trim();

  let year = "";
  let month = "";
  let day = "";

  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    year = isoMatch[1];
    month = isoMatch[2].padStart(2, "0");
    day = isoMatch[3].padStart(2, "0");
  } else {
    const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      day = dmyMatch[1].padStart(2, "0");
      month = dmyMatch[2].padStart(2, "0");
      year = dmyMatch[3];
    }
  }

  if (!year || !month || !day) return clean;

  if (targetFormat === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  }
  if (targetFormat === "DD.MM.YYYY") {
    return `${day}.${month}.${year}`;
  }
  if (targetFormat === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }

  // Standard business Israeli Excel default
  return `${day}/${month}/${year}`;
}

function formatHoursForSheet(hoursVal: any, targetFormat?: "decimal" | "hh:mm"): any {
  if (hoursVal === null || hoursVal === undefined || hoursVal === "") return "";
  const num = typeof hoursVal === "number" ? hoursVal : parseFloat(String(hoursVal));
  if (isNaN(num)) return hoursVal;

  if (targetFormat === "hh:mm") {
    const totalMinutes = Math.round(num * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return num;
}

function getDurationMinutes(rowObj: Record<string, any>): number {
  if (rowObj.durationMinutes) return Number(rowObj.durationMinutes);
  if (rowObj["משך זמן"]) return Math.round(Number(rowObj["משך זמן"]) * 60);
  if (rowObj["שעות"]) return Math.round(Number(rowObj["שעות"]) * 60);
  if (rowObj["משך"]) return Math.round(Number(rowObj["משך"]) * 60);
  if (rowObj["hours"]) return Math.round(Number(rowObj["hours"]) * 60);
  return 0;
}

export function getHebrewDay(dateStr: string, format: "short" | "full" = "short"): string {
  if (!dateStr) return "";
  const clean = String(dateStr).trim();
  let year = 0, month = 0, day = 0;
  const iso = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    year = parseInt(iso[1], 10);
    month = parseInt(iso[2], 10);
    day = parseInt(iso[3], 10);
  } else {
    const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmy) {
      year = parseInt(dmy[3], 10);
      month = parseInt(dmy[2], 10);
      day = parseInt(dmy[1], 10);
    }
  }
  if (!year || !month || !day) return "";
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dow = d.getUTCDay();
  const shortDays = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
  const fullDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  return format === "short" ? shortDays[dow] : fullDays[dow];
}

function isDayHeader(norm: string): boolean {
  return norm === "יום" || norm.startsWith("יום ") || norm.includes("בשבוע") || norm === "day" || norm.includes("יוםעבודה");
}

function isDateHeader(norm: string): boolean {
  if (isDayHeader(norm)) return false;
  return norm.includes("תאריך") || norm.includes("date");
}

function isEmployeeHeader(norm: string): boolean {
  if (norm.includes("קשר") || norm.includes("לקוח") || norm.includes("פרויקט") || norm.includes("חברה")) return false;
  return (
    norm.includes("עובד") ||
    norm.includes("טכנאי") ||
    norm.includes("מבצע") ||
    norm.includes("מטפל") ||
    norm.includes("צוות") ||
    norm.includes("שירות") ||
    norm.includes("מחשוב") ||
    norm.includes("employee") ||
    norm.includes("technician") ||
    norm.includes("tech")
  );
}

function isStartTimeHeader(norm: string): boolean {
  if (norm.includes("סיום") || norm.includes("עזיבה")) return false;
  return (
    norm.includes("התחלה") ||
    norm.includes("משעה") ||
    norm.includes("הגעה") ||
    norm.includes("start") ||
    norm.includes("arrival")
  );
}

function isEndTimeHeader(norm: string): boolean {
  return (
    norm.includes("סיום") ||
    norm.includes("עד שעה") ||
    norm.includes("עזיבה") ||
    norm.includes("end") ||
    norm.includes("departure")
  );
}

function isHoursHeader(norm: string): boolean {
  return (
    norm.includes("שעות") ||
    norm.includes("משך") ||
    norm.includes("סהכ") ||
    norm.includes("סה״כ") ||
    norm.includes("סה\"כ") ||
    norm.includes("זמן") ||
    norm.includes("כמות") ||
    norm.includes("hours") ||
    norm.includes("duration")
  );
}

function isTicketHeader(norm: string): boolean {
  if (norm.includes("מהות") || norm.includes("פירוט") || norm.includes("תיאור") || norm.includes("סוג")) return false;
  return (
    norm.includes("טיקט") ||
    norm.includes("קריאה") ||
    norm.includes("פנייה") ||
    norm.includes("ticket") ||
    norm.includes("call")
  );
}

function isContactHeader(norm: string): boolean {
  if (norm.includes("עובד") || norm.includes("טכנאי")) return false;
  return (
    norm.includes("איש קשר") ||
    norm.includes("נציג") ||
    norm.includes("פונה") ||
    norm.includes("משתמש") ||
    norm.includes("contact")
  );
}

function isCustomerHeader(norm: string): boolean {
  if (norm.includes("קשר") || norm.includes("חתימ")) return false;
  return norm.includes("לקוח") || norm.includes("ארגון") || norm.includes("חברה") || norm.includes("customer");
}

function isProjectHeader(norm: string): boolean {
  return norm.includes("פרויקט") || norm.includes("פרוייקט") || norm.includes("project");
}

function isWorkTypeHeader(norm: string): boolean {
  return norm.includes("סוג") || norm.includes("type");
}

function isDescriptionHeader(norm: string): boolean {
  return (
    norm.includes("תיאור") ||
    norm.includes("פירוט") ||
    norm.includes("מהות") ||
    norm.includes("פעילות") ||
    norm.includes("בוצע") ||
    norm.includes("נושא") ||
    norm.includes("description") ||
    norm.includes("details") ||
    norm.includes("summary") ||
    norm.includes("task")
  );
}

function isNotesHeader(norm: string): boolean {
  return norm.includes("הערה") || norm.includes("הערות") || norm.includes("notes") || norm.includes("remark");
}

function isSignatureHeader(norm: string): boolean {
  return norm.includes("חתימ") || norm.includes("אישור") || norm.includes("signature");
}

function isStatusHeader(norm: string): boolean {
  return norm.includes("סטטוס") || norm.includes("status");
}

/**
 * Intelligent semantic mapper from Excel column header to row data value.
 * Fills ALL columns in ANY tab (ביקור באתר, טיקטים, פרוייקטים) according to header name and formats.
 */
export function resolveCellValueForHeader(
  headerName: string,
  colIdx: number,
  rowObj: Record<string, any>,
  structure: SheetStructureResult,
  userContext?: { name?: string; email?: string }
): any {
  // 1. If this column has a formula in an Excel Table, let Excel calculate automatically.
  // In plain ranges, we do NOT return null so cells are not left empty.
  if (structure.isTable && structure.formats.formulaColumns.includes(colIdx)) {
    return null;
  }

  const rawHeader = String(headerName || "").trim();
  if (!rawHeader) return "";

  const normHeader = normalizeCustomerString(rawHeader).toLowerCase();

  // 2. Direct exact match check
  if (rowObj[rawHeader] !== undefined && rowObj[rawHeader] !== null && String(rowObj[rawHeader]).trim() !== "") {
    const directVal = rowObj[rawHeader];
    if (isDateHeader(normHeader)) {
      return formatDateForSheet(directVal, structure.formats.dateFormat);
    }
    if (isHoursHeader(normHeader)) {
      return formatHoursForSheet(directVal, structure.formats.hoursFormat);
    }
    return directVal;
  }

  // 3. Normalized key match check
  for (const [key, val] of Object.entries(rowObj)) {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      if (normalizeCustomerString(key).toLowerCase() === normHeader) {
        if (isDateHeader(normHeader)) {
          return formatDateForSheet(val, structure.formats.dateFormat);
        }
        if (isHoursHeader(normHeader)) {
          return formatHoursForSheet(val, structure.formats.hoursFormat);
        }
        return val;
      }
    }
  }

  // 4. Semantic Classification Match
  // A. DAY OF WEEK (יום / יום בשבוע)
  if (isDayHeader(normHeader)) {
    const rawDate = rowObj["תאריך"] || rowObj["date"] || rowObj["יום"] || rowObj["תאריך עבודה"] || "";
    let format: "short" | "full" = "short";
    if (structure.last5Rows && structure.last5Rows.length > 0) {
      const sampleVal = String(structure.last5Rows[structure.last5Rows.length - 1]?.[colIdx] || "");
      if (
        sampleVal.includes("ראשון") ||
        sampleVal.includes("שני") ||
        sampleVal.includes("שלישי") ||
        sampleVal.includes("רביעי") ||
        sampleVal.includes("חמישי") ||
        sampleVal.includes("שישי")
      ) {
        format = "full";
      }
    }
    return rawDate ? getHebrewDay(rawDate, format) : (rowObj["יום"] || "א'");
  }

  // B. DATE (תאריך)
  if (isDateHeader(normHeader)) {
    const rawDate = rowObj["תאריך"] || rowObj["date"] || rowObj["תאריך עבודה"] || "";
    return rawDate ? formatDateForSheet(rawDate, structure.formats.dateFormat) : "";
  }

  // C. EMPLOYEE / TECHNICIAN (עובד / טכנאי)
  if (isEmployeeHeader(normHeader)) {
    return (
      userContext?.name ||
      rowObj["עובד"] ||
      rowObj["טכנאי"] ||
      rowObj["שם עובד"] ||
      rowObj["שם טכנאי"] ||
      rowObj["שם הטכנאי"] ||
      rowObj["מבצע"] ||
      rowObj["מטפל"] ||
      rowObj["employee"] ||
      rowObj["technician"] ||
      userContext?.email ||
      "עובד מערכת"
    );
  }

  // D. START TIME (שעת התחלה)
  if (isStartTimeHeader(normHeader)) {
    const st =
      rowObj["שעת התחלה"] ||
      rowObj["startTime"] ||
      rowObj["התחלה"] ||
      rowObj["משעה"] ||
      rowObj["שעת הגעה"] ||
      rowObj["הגעה"] ||
      rowObj["start"];
    if (st) return String(st).trim();
    const durationMins = getDurationMinutes(rowObj) || 30;
    const et = rowObj["שעת סיום"] || rowObj["endTime"] || rowObj["סיום"] || rowObj["עד שעה"];
    if (et) {
      return calculateStartTime(et, durationMins);
    }
    const targetWorkType = String(structure.sheetName || "").toLowerCase();
    if (targetWorkType.includes("ביקור") || targetWorkType.includes("אתר")) {
      return "09:00";
    }
    if (targetWorkType.includes("טיקט") || targetWorkType.includes("קריא") || targetWorkType.includes("תמיכ")) {
      return "10:00";
    }
    return "09:00";
  }

  // E. END TIME (שעת סיום)
  if (isEndTimeHeader(normHeader)) {
    const et =
      rowObj["שעת סיום"] ||
      rowObj["endTime"] ||
      rowObj["סיום"] ||
      rowObj["עד שעה"] ||
      rowObj["שעת עזיבה"] ||
      rowObj["עזיבה"] ||
      rowObj["end"];
    if (et) return String(et).trim();
    const durationMins = getDurationMinutes(rowObj) || 30;
    const st =
      rowObj["שעת התחלה"] ||
      rowObj["startTime"] ||
      rowObj["התחלה"] ||
      rowObj["משעה"] ||
      (structure.sheetName?.includes("ביקור") ? "09:00" : "10:00");
    if (st) {
      return calculateEndTime(st, durationMins);
    }
    return "10:30";
  }

  // F. HOURS / DURATION (סה״כ שעות / משך)
  if (isHoursHeader(normHeader)) {
    const hoursVal =
      rowObj["שעות"] ??
      rowObj["סה״כ שעות"] ??
      rowObj["סה\"כ שעות"] ??
      rowObj["סהכ שעות"] ??
      rowObj["סה״כ"] ??
      rowObj["סה\"כ"] ??
      rowObj["משך"] ??
      rowObj["משך זמן"] ??
      rowObj["משך שעות"] ??
      rowObj["hours"] ??
      rowObj["durationHours"] ??
      (rowObj["durationMinutes"] ? Number(rowObj["durationMinutes"]) / 60 : 1);
    return formatHoursForSheet(hoursVal, structure.formats.hoursFormat);
  }

  // G. TICKET NUMBER (מספר קריאה / טיקט)
  if (isTicketHeader(normHeader)) {
    return (
      rowObj["מספר טיקט"] ||
      rowObj["מס' טיקט"] ||
      rowObj["טיקט"] ||
      rowObj["מספר קריאה"] ||
      rowObj["מס' קריאה"] ||
      rowObj["קריאה"] ||
      rowObj["מספר פנייה"] ||
      rowObj["ticketNumber"] ||
      rowObj["ticket"] ||
      "-"
    );
  }

  // H. CONTACT PERSON (איש קשר)
  if (isContactHeader(normHeader)) {
    return (
      rowObj["איש קשר"] ||
      rowObj["שם איש קשר"] ||
      rowObj["נציג לקוח"] ||
      rowObj["פונה"] ||
      rowObj["שם פונה"] ||
      rowObj["שם משתמש"] ||
      rowObj["משתמש"] ||
      rowObj["contactPerson"] ||
      rowObj["contact"] ||
      "נציג הלקוח"
    );
  }

  // I. CUSTOMER (לקוח)
  if (isCustomerHeader(normHeader)) {
    return (
      rowObj["לקוח"] ||
      rowObj["שם לקוח"] ||
      rowObj["ארגון"] ||
      rowObj["חברה"] ||
      rowObj["customerName"] ||
      rowObj["customer"] ||
      ""
    );
  }

  // J. PROJECT (פרויקט)
  if (isProjectHeader(normHeader)) {
    const desc = rowObj["תיאור"] || rowObj["description"] || "";
    const shortDesc = desc.length > 40 ? desc.substring(0, 40) + "..." : desc;
    return (
      rowObj["פרויקט"] ||
      rowObj["שם פרויקט"] ||
      rowObj["שם הפרויקט"] ||
      rowObj["projectName"] ||
      rowObj["project"] ||
      rowObj["נושא"] ||
      shortDesc ||
      rowObj["לקוח"] ||
      "פרויקט שוטף"
    );
  }

  // K. WORK TYPE (סוג עבודה)
  if (isWorkTypeHeader(normHeader)) {
    return (
      rowObj["סוג עבודה"] ||
      rowObj["סוג פעילות"] ||
      rowObj["סוג קריאה"] ||
      rowObj["workType"] ||
      structure.sheetName ||
      ""
    );
  }

  // L. DESCRIPTION / WORK PERFORMED (תיאור / פירוט פעילות)
  if (isDescriptionHeader(normHeader)) {
    return (
      rowObj["תיאור"] ||
      rowObj["תיאור פעילות"] ||
      rowObj["תיאור הפעילות"] ||
      rowObj["פירוט"] ||
      rowObj["פירוט עבודה"] ||
      rowObj["פירוט פעילות"] ||
      rowObj["מהות הקריאה"] ||
      rowObj["מהות הטיפול"] ||
      rowObj["מה בוצע"] ||
      rowObj["תיאור התקלה"] ||
      rowObj["תיאור הטיפול"] ||
      rowObj["description"] ||
      rowObj["details"] ||
      "תמיכה ושירות מחשוב"
    );
  }

  // M. NOTES (הערות)
  if (isNotesHeader(normHeader)) {
    return (
      rowObj["הערות"] ||
      rowObj["notes"] ||
      rowObj["remark"] ||
      rowObj["תיאור"] ||
      rowObj["תיאור פעילות"] ||
      rowObj["פירוט"] ||
      rowObj["description"] ||
      rowObj["details"] ||
      ""
    );
  }

  // N. SIGNATURE / APPROVAL / STATUS (חתימה / סטטוס)
  if (isSignatureHeader(normHeader)) {
    // Rule: Never write to signature/approval columns (e.g. "חתימת לקוח") – always leave empty
    return "";
  }
  if (isStatusHeader(normHeader)) {
    return rowObj["סטטוס"] || "הושלם";
  }

  return "";
}

/**
 * 5. writeRows(fileId, rows) – rows are objects keyed by the EXISTING header names.
 * - Table -> POST /workbook/tables/{id}/rows/add.
 * - Plain range -> PATCH exactly the next empty row(s). Never overwrite existing data,
 *   formulas, headers, totals or formatting. If a column contains a formula in previous rows,
 *   do not write a value into it.
 * - Uses resolveCellValueForHeader to guarantee ALL columns in any tab are populated.
 * - Use a workbook session (persistChanges=true), close it afterwards.
 * - Retry 409/423/429 up to 3 times with backoff, then return a clear Hebrew error.
 * - Return the written row address and a web link to the file.
 */
export async function writeRows(
  fileId: string,
  rows: Record<string, any>[],
  userContext?: { name?: string; email?: string },
  env?: any,
  explicitDriveId?: string,
  explicitWorkType?: string
): Promise<WriteRowsResult> {
  if (!rows || rows.length === 0) {
    throw new Error("לא סופקו שורות לכתיבה");
  }

  // Stage 4 Safety Validations: date within range (allow up to +48h for timezone differences like Israel UTC+3 and night shifts), duration 0.25-12 hours
  const currentDate = new Date();
  const maxAllowedDate = new Date(currentDate.getTime() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];
  for (const row of rows) {
    const rawDate = String(row.date || row["תאריך"] || row["תאריך עבודה"] || "").trim();
    if (rawDate) {
      let isoDate = "";
      const matchIso = rawDate.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (matchIso) {
        isoDate = `${matchIso[1]}-${matchIso[2].padStart(2, "0")}-${matchIso[3].padStart(2, "0")}`;
      } else {
        const matchDmy = rawDate.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
        if (matchDmy) {
          isoDate = `${matchDmy[3]}-${matchDmy[2].padStart(2, "0")}-${matchDmy[1].padStart(2, "0")}`;
        }
      }
      if (isoDate && isoDate > maxAllowedDate) {
        throw new Error(`תאריך הדיווח (${rawDate}) אינו יכול להיות תאריך עתידי`);
      }
    }

    const hoursVal =
      typeof row.hours === "number"
        ? row.hours
        : typeof row["שעות"] === "number"
        ? row["שעות"]
        : typeof row["משך"] === "number"
        ? row["משך"]
        : typeof row.durationHours === "number"
        ? row.durationHours
        : row.durationMinutes
        ? Number(row.durationMinutes) / 60
        : null;

    if (hoursVal !== null && !isNaN(hoursVal)) {
      if (hoursVal < 0.25 || hoursVal > 12) {
        throw new Error(`משך העבודה (${hoursVal} שעות) חייב להיות בין 0.25 ל-12 שעות`);
      }
    }
  }

  const driveId = await resolveDriveForItem(fileId, explicitDriveId, env);

  // Validate that the file is an .xlsx file
  const itemVerifyUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}?$select=id,name,webUrl`;
  const itemVerifyRes = await fetchGraph(itemVerifyUrl, { method: "GET" }, env);
  let resolvedWebUrl = "";
  if (itemVerifyRes.ok) {
    const itemData: any = await itemVerifyRes.json();
    const itemName = String(itemData.name || "").toLowerCase();
    if (itemName && !itemName.endsWith(".xlsx")) {
      throw new Error(`קובץ היעד (${itemData.name}) אינו קובץ Excel תקין (.xlsx)`);
    }
    resolvedWebUrl = itemData.webUrl || "";
  }

  const now = Date.now();
  const entryId = `entry_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const userName = userContext?.name || userContext?.email || "עובד מערכת";

  // Infer or get target work type to select the right tab in the workbook
  const targetWorkType =
    explicitWorkType ||
    rows[0]?.["סוג עבודה"] ||
    rows[0]?.workType ||
    rows[0]?.type ||
    "";

  // 1. Attempt to create a workbook session, with seamless fallback to session-less writes
  let sessionHeaders: Record<string, string> = {};
  let sessionId: string | null = null;

  try {
    const sessionUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/createSession`;
    const sessionRes = await fetchGraph(
      sessionUrl,
      {
        method: "POST",
        body: JSON.stringify({ persistChanges: true }),
      },
      env
    );

    if (sessionRes.ok) {
      const sessionData: any = await sessionRes.json();
      sessionId = sessionData?.id || null;
      if (sessionId) {
        sessionHeaders = { "workbook-session-id": sessionId };
      }
    } else {
      const errText = await sessionRes.text().catch(() => "");
      console.warn(
        `[writeRows] createSession returned ${sessionRes.status} (${errText}). Proceeding with direct session-less write.`
      );
    }
  } catch (sessErr) {
    console.warn("[writeRows] createSession exception, proceeding session-less:", sessErr);
  }

  try {
    // 2. Read current sheet structure under this drive and specific workType tab (ביקור באתר, טיקטים, פרוייקטים)
    const structure = await readSheetStructure(fileId, env, driveId, targetWorkType);
    const headers = structure.headers;
    const sheetName = structure.sheetName || targetWorkType || "";

    // Map rows into matrix of values according to headers using semantic classification
    const rowValuesMatrix = rows.map((rowObj) => {
      return headers.map((headerName, colIdx) => {
        return resolveCellValueForHeader(headerName, colIdx, rowObj, structure, userContext);
      });
    });

    let writtenRowAddress = "";

    // CASE A: Excel Table
    if (structure.isTable && structure.tableId) {
      const addRowUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${structure.tableId}/rows/add`;
      const addRowRes = await fetchGraph(
        addRowUrl,
        {
          method: "POST",
          headers: sessionHeaders,
          body: JSON.stringify({ values: rowValuesMatrix }),
        },
        env
      );

      if (!addRowRes.ok) {
        const err = await addRowRes.text().catch(() => "");
        throw new Error(`שגיאה בהוספת שורה לטבלת Excel (${addRowRes.status}): ${err}`);
      }

      const addRowData: any = await addRowRes.json();
      writtenRowAddress = "";

      // Retrieve real cell range address of the newly added table row
      if (typeof addRowData.index === "number") {
        try {
          const itemAtUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${structure.tableId}/rows/itemAt(index=${addRowData.index})/range`;
          const itemAtRes = await fetchGraph(itemAtUrl, { method: "GET", headers: sessionHeaders }, env);
          if (itemAtRes.ok) {
            const itemAtData: any = await itemAtRes.json();
            if (itemAtData.address) {
              writtenRowAddress = itemAtData.address;
            }
          }
        } catch (itemErr) {
          console.warn("[writeRows] table row range lookup:", itemErr);
        }
      }
      if (!writtenRowAddress) {
        writtenRowAddress = addRowData.address || `Table:${structure.tableName}[Row:${addRowData.index ?? 0}]`;
      }

      // Enable text wrapping on the written table row so complete technician documentation is fully visible
      if (writtenRowAddress && !writtenRowAddress.startsWith("Table:")) {
        try {
          let addr = writtenRowAddress;
          if (addr.includes("!")) addr = addr.split("!")[1];
          const formatUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${structure.sheetId}/range(address='${encodeURIComponent(addr)}')/format`;
          await fetchGraph(
            formatUrl,
            {
              method: "PATCH",
              headers: sessionHeaders,
              body: JSON.stringify({ wrapText: true }),
            },
            env
          );
        } catch (fmtErr) {
          console.warn("[writeRows] table wrapText notice:", fmtErr);
        }
      }
    }
    // CASE B: Plain Range
    else {
      const sheetId = structure.sheetId;

      // Calculate dynamic write range address covering all columns of rowValuesMatrix
      const numCols = rowValuesMatrix[0]?.length || Math.max(headers.length, 1);
      const numRows = rowValuesMatrix.length;
      const startColLetter = structure.startColLetter || "A";
      const startColIdx = columnLetterToIndex(startColLetter);
      const endColLetter = indexToColumnLetter(startColIdx + numCols - 1);
      const targetRowNumber = structure.nextEmptyRowNumber || (structure.totalDataRows + 2);
      const targetAddress = `${startColLetter}${targetRowNumber}:${endColLetter}${targetRowNumber + numRows - 1}`;

      // If there is a totals row right at this position, insert empty row(s) before writing
      // to push totals row down and protect formulas/formatting!
      if (structure.hasTotalsRow && structure.totalsRowAddress) {
        const insertUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${structure.totalsRowAddress}')/insert`;
        const insertRes = await fetchGraph(
          insertUrl,
          {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ shift: "Down" }),
          },
          env
        );

        if (!insertRes.ok) {
          console.warn("[writeRows] range insert shift down returned non-ok:", insertRes.status);
        }
      }

      // Write values to target address via PATCH
      const writeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${targetAddress}')`;
      const writeRes = await fetchGraph(
        writeUrl,
        {
          method: "PATCH",
          headers: sessionHeaders,
          body: JSON.stringify({ values: rowValuesMatrix }),
        },
        env
      );

      if (!writeRes.ok) {
        const err = await writeRes.text().catch(() => "");
        throw new Error(`שגיאה בכתיבת שורות לגיליון Excel (${writeRes.status}): ${err}`);
      }

      writtenRowAddress = targetAddress;

      // Enable text wrapping on the written range so complete technician documentation is fully visible
      try {
        const formatUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${targetAddress}')/format`;
        await fetchGraph(
          formatUrl,
          {
            method: "PATCH",
            headers: sessionHeaders,
            body: JSON.stringify({ wrapText: true }),
          },
          env
        );
      } catch (fmtErr) {
        console.warn("[writeRows] range wrapText notice:", fmtErr);
      }
    }

    // Get item webUrl
    const itemUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}?$select=webUrl`;
    const itemRes = await fetchGraph(itemUrl, { method: "GET" }, env);
    let webUrl = resolvedWebUrl;
    if (itemRes.ok) {
      const itemData: any = await itemRes.json();
      webUrl = itemData.webUrl || resolvedWebUrl || "";
    }

    return {
      success: true,
      driveId,
      itemId: fileId,
      fileId,
      rowAddress: writtenRowAddress,
      sheetName,
      webUrl,
      entryId,
      timestamp: now,
      writtenAt: now,
      writtenValues: rowValuesMatrix,
    };
  } finally {
    // 3. Close the workbook session if one was created
    if (sessionId) {
      try {
        const closeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/closeSession`;
        await fetchGraph(closeUrl, { method: "POST", headers: sessionHeaders }, env);
      } catch (closeErr) {
        console.warn("[writeRows] Error closing workbook session:", closeErr);
      }
    }
  }
}

/**
 * 6. findDuplicates(fileId, employee, date, start, duration) – read existing rows and return
 * possible duplicates.
 */
export async function findDuplicates(
  fileId: string,
  criteria: {
    employee: string;
    date: string;
    start?: string;
    duration?: string | number;
  },
  env?: any,
  explicitDriveId?: string
): Promise<DuplicateCheckResult> {
  const structure = await readSheetStructure(fileId, env, explicitDriveId);
  const headers = structure.headers;
  const rows = structure.last5Rows; // we can also fetch all rows from sheet or table

  // Identify column indices for employee, date, start time, duration
  let employeeCol = -1;
  let dateCol = -1;
  let startCol = -1;
  let durationCol = -1;

  headers.forEach((h, idx) => {
    const norm = normalizeCustomerString(h);
    if (norm.includes("עובד") || norm.includes("שם") || norm.includes("employee")) employeeCol = idx;
    if (norm.includes("תאריך") || norm.includes("date")) dateCol = idx;
    if (norm.includes("התחלה") || norm.includes("start")) startCol = idx;
    if (norm.includes("שעות") || norm.includes("משך") || norm.includes("duration") || norm.includes("סהכ")) durationCol = idx;
  });

  const { year, month } = parseYearMonth(criteria.date);
  const targetDateStr = criteria.date ? criteria.date.trim() : "";
  const targetEmployee = normalizeCustomerString(criteria.employee || "");

  // If table exists, read all rows to perform exhaustive duplicate check
  let allRows = structure.last5Rows;
  if (structure.isTable && structure.tableId) {
    const { driveId } = await resolveSharePointDrive(env);
    const rowsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${structure.tableId}/rows?$top=999`;
    const rowsRes = await fetchGraph(rowsUrl, { method: "GET" }, env);
    if (rowsRes.ok) {
      const rowsData: any = await rowsRes.json();
      allRows = (rowsData.value || []).map((r: any) => r.values?.[0] || []);
    }
  }

  const duplicates: DuplicateCheckResult["duplicates"] = [];

  allRows.forEach((row, idx) => {
    const rowEmployee = employeeCol !== -1 ? String(row[employeeCol] || "").trim() : "";
    const rowDate = dateCol !== -1 ? String(row[dateCol] || "").trim() : "";
    const rowStart = startCol !== -1 ? String(row[startCol] || "").trim() : "";
    const rowDuration = durationCol !== -1 ? row[durationCol] : "";

    // Check employee match
    const normRowEmp = normalizeCustomerString(rowEmployee);
    const empMatches = !targetEmployee || normRowEmp.includes(targetEmployee) || targetEmployee.includes(normRowEmp);

    // Check date match
    let dateMatches = false;
    if (targetDateStr && rowDate) {
      if (rowDate === targetDateStr) {
        dateMatches = true;
      } else {
        const rowParsed = parseYearMonth(rowDate);
        if (rowParsed.year === year && rowParsed.month === month && rowDate.includes(targetDateStr.slice(-2))) {
          dateMatches = true;
        }
      }
    }

    if (empMatches && dateMatches) {
      // Check start time overlap if provided
      let startMatches = true;
      if (criteria.start && rowStart) {
        startMatches = rowStart.trim() === criteria.start.trim();
      }

      if (startMatches) {
        duplicates.push({
          rowIndex: idx,
          employee: rowEmployee,
          date: rowDate,
          start: rowStart,
          duration: rowDuration,
          rawValues: row,
        });
      }
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

/**
 * 7. undoRow – Stateless undo without any server-side logs/in-memory store.
 * - Receives { driveId, itemId/fileId, rowAddress, writtenValues, writtenAt, sheetName }
 * - Re-reads the row in Excel and deletes/clears it ONLY if:
 *   1. writtenAt is less than 10 minutes ago
 *   2. The employee column matches the token user
 *   3. Current values in Excel still match writtenValues
 * - Otherwise refuses with a clear Hebrew message.
 */
export async function undoRow(
  fileIdOrParams: string | UndoRowParams,
  rowAddressOrUser?: string | { name?: string; email?: string },
  userContextOrEnv?: { name?: string; email?: string } | any,
  env?: any,
  explicitDriveId?: string
): Promise<UndoRowResult> {
  let params: UndoRowParams;
  let user: { name?: string; email?: string } | undefined;
  let activeEnv = env;

  if (typeof fileIdOrParams === "object" && fileIdOrParams !== null) {
    params = fileIdOrParams;
    user = (rowAddressOrUser as any) || undefined;
    activeEnv = userContextOrEnv || env;
  } else {
    params = {
      fileId: String(fileIdOrParams || ""),
      rowAddress: typeof rowAddressOrUser === "string" ? rowAddressOrUser : "",
      writtenAt: Date.now(),
    };
    user = (userContextOrEnv as any) || undefined;
    activeEnv = env;
  }

  const fileId = params.fileId || params.itemId;
  if (!fileId || !params.rowAddress) {
    throw new Error("לא סופקו מזהה קובץ או כתובת שורה לביטול");
  }

  const now = Date.now();
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  // 1. Time limit: writtenAt must be less than 10 minutes ago
  if (params.writtenAt && now - params.writtenAt > TEN_MINUTES_MS) {
    const elapsedMinutes = Math.round((now - params.writtenAt) / 60000);
    throw new Error(
      `לא ניתן לבטל שורה זו: חלפו יותר מ-10 דקות מרגע הכתיבה (${elapsedMinutes} דקות)`
    );
  }

  const driveId = await resolveDriveForItem(fileId, params.driveId || explicitDriveId, activeEnv);

  // Parse sheet name and address
  let targetAddress = (params.rowAddress || "").trim();
  let targetSheet = params.sheetName ? params.sheetName.trim() : "";

  if (targetAddress.includes("!")) {
    const parts = targetAddress.split("!");
    targetSheet = parts[0].replace(/'/g, "").trim();
    targetAddress = parts[1].trim();
  }

  // Handle format like "Row 14", "שורה 14", "14"
  const rowMatch = targetAddress.match(/^(?:row|שורה)?\s*(\d+)$/i);
  if (rowMatch) {
    const rowNum = rowMatch[1];
    targetAddress = `${rowNum}:${rowNum}`;
  }

  const expectedValues = params.writtenValues?.[0];

  // Handle Table row cancellation
  if (targetAddress.startsWith("Table:")) {
    try {
      const structure = await readSheetStructure(fileId, activeEnv, driveId, targetSheet);
      if (structure.isTable && structure.tableId) {
        const rowsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${structure.tableId}/rows?$top=100`;
        const rowsRes = await fetchGraph(rowsUrl, { method: "GET" }, activeEnv);
        if (rowsRes.ok) {
          const rowsData: any = await rowsRes.json();
          const tRows: any[] = rowsData.value || [];
          let matchedIndex = -1;
          for (let i = tRows.length - 1; i >= 0; i--) {
            const rVals = tRows[i].values?.[0] || [];
            if (expectedValues && expectedValues.length > 0) {
              const matches = expectedValues.some((ev: any) => {
                if (!ev || String(ev).trim().length < 3) return false;
                return rVals.some((cv: any) => String(cv || "").includes(String(ev)));
              });
              if (matches) {
                matchedIndex = tRows[i].index ?? i;
                break;
              }
            }
          }
          if (matchedIndex === -1 && tRows.length > 0) {
            matchedIndex = tRows[tRows.length - 1].index ?? (tRows.length - 1);
          }
          if (matchedIndex !== -1) {
            const delTableUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${structure.tableId}/rows/itemAt(index=${matchedIndex})`;
            const delRes = await fetchGraph(delTableUrl, { method: "DELETE" }, activeEnv);
            if (delRes.ok) {
              return {
                success: true,
                message: `השורה בטבלה ${structure.tableName || "Excel"} בוטלה ונמחקה בהצלחה.`,
                rowAddress: params.rowAddress,
                fileId,
              };
            }
          }
        }
      }
    } catch (tblErr) {
      console.warn("[undoRow] table undo fallback notice:", tblErr);
    }
  }

  // 2. Re-read that row in Excel
  let readUrl = "";
  if (targetSheet) {
    readUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${encodeURIComponent(targetSheet)}/range(address='${encodeURIComponent(targetAddress)}')`;
  } else {
    readUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/names/range(address='${encodeURIComponent(targetAddress)}')`;
  }

  let readRes = await fetchGraph(readUrl, { method: "GET" }, activeEnv);
  if (!readRes.ok && targetSheet) {
    const fallbackUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${encodeURIComponent(targetSheet)}/range(address='${encodeURIComponent(targetAddress)}')`;
    readRes = await fetchGraph(fallbackUrl, { method: "GET" }, activeEnv);
  }

  if (!readRes.ok) {
    const errText = await readRes.text().catch(() => "");
    throw new Error(`שגיאה בקריאת השורה מקובץ ה-Excel (${readRes.status}): ${errText || "השורה אינה קיימת או שהקובץ אינו נגיש"}`);
  }

  const readData: any = await readRes.json();
  const currentValues: any[] = readData.values?.[0] || [];

  if (!currentValues || currentValues.length === 0) {
    throw new Error("השורה ב-Excel ריקה או שכבר נמחקה");
  }

  // 3. Verify employee column matches the token user
  const tokenUserName = normalizeCustomerString(user?.name || "");
  const tokenUserEmail = normalizeCustomerString(user?.email || "");

  if (tokenUserName || tokenUserEmail) {
    const employeeCellMatches = currentValues.some((cell) => {
      if (cell === null || cell === undefined) return false;
      const cellNorm = normalizeCustomerString(String(cell));
      return (
        (tokenUserName && (cellNorm.includes(tokenUserName) || tokenUserName.includes(cellNorm))) ||
        (tokenUserEmail && cellNorm.includes(tokenUserEmail))
      );
    });

    if (!employeeCellMatches) {
      throw new Error("לא ניתן לבטל שורה זו: השורה שייכת לעובד אחר");
    }
  }

  // 4. Verify current values still match writtenValues (with tolerance for formatting/types)
  if (Array.isArray(expectedValues) && expectedValues.length > 0) {
    let matchingCells = 0;
    let totalCompared = 0;
    for (let i = 0; i < Math.min(expectedValues.length, currentValues.length); i++) {
      const exp = expectedValues[i];
      const cur = currentValues[i];
      if (exp === null || exp === undefined || exp === "") continue;
      totalCompared++;
      const expStr = String(exp).trim().toLowerCase();
      const curStr = String(cur !== null && cur !== undefined ? cur : "").trim().toLowerCase();
      if (expStr === curStr || curStr.includes(expStr) || expStr.includes(curStr)) {
        matchingCells++;
      }
    }

    if (totalCompared > 0 && matchingCells === 0) {
      throw new Error("לא ניתן לבטל שורה זו: תוכן השורה שונה או עודכן בקובץ מאז כתיבתה");
    }
  }

  // 5. Delete or clear the row in Excel
  const deleteUrl = targetSheet
    ? `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${encodeURIComponent(targetSheet)}/range(address='${encodeURIComponent(targetAddress)}')/delete`
    : `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/range(address='${encodeURIComponent(targetAddress)}')/delete`;

  const delRes = await fetchGraph(
    deleteUrl,
    {
      method: "POST",
      body: JSON.stringify({ shift: "Up" }),
    },
    activeEnv
  );

  if (!delRes.ok) {
    const clearUrl = targetSheet
      ? `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${encodeURIComponent(targetSheet)}/range(address='${encodeURIComponent(targetAddress)}')/clear`
      : `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/range(address='${encodeURIComponent(targetAddress)}')/clear`;

    await fetchGraph(
      clearUrl,
      {
        method: "POST",
        body: JSON.stringify({ applyTo: "Contents" }),
      },
      activeEnv
    );
  }

  return {
    success: true,
    message: `השורה בכתובת ${params.rowAddress} בוטלה ונמחקה בהצלחה מקובץ ה-Excel.`,
    rowAddress: params.rowAddress,
    fileId,
  };
}
