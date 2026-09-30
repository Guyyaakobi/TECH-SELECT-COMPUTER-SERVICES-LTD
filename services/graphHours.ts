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
  hasTotalsRow: boolean;
  totalsRowAddress?: string;
  formats: {
    dateFormat?: string; // e.g. "YYYY-MM-DD", "DD/MM/YYYY", "DD.MM.YYYY"
    timeFormat?: string; // e.g. "HH:mm"
    hoursFormat?: "decimal" | "hh:mm";
    formulaColumns: number[]; // column indices containing formulas
  };
}

export interface WriteRowsResult {
  success: boolean;
  rowAddress: string;
  webUrl?: string;
  entryId: string;
  timestamp: number;
  fileId: string;
  writtenValues: any[];
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

export interface UndoLogEntry {
  entryId: string;
  user: string;
  fileId: string;
  rowAddress: string;
  timestamp: number;
  isTable: boolean;
  tableId?: string;
  rowIndex?: number;
  sheetId?: string;
}

// Global server-side undo log (in-memory)
const undoLog: UndoLogEntry[] = [];

// Customers cache (10 minutes TTL)
interface CustomersCache {
  timestamp: number;
  siteId: string;
  detectedStructure: "folders" | "libraries";
  items: CustomerFolder[];
}
let customersCache: CustomersCache | null = null;
const CUSTOMERS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Token cache
interface TokenCache {
  token: string;
  expiresAt: number;
}
let cachedGraphToken: TokenCache | null = null;

// Resolved Site & Drive Cache
let cachedSiteDriveInfo: { siteId: string; driveId: string; timestamp: number } | null = null;

/**
 * Get environment configuration values
 */
export function getGraphHoursConfig(env?: any) {
  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};

  const tenantId = (
    envObj.AZURE_TENANT_ID ||
    envObj.TENANT_ID ||
    p?.AZURE_TENANT_ID ||
    p?.TENANT_ID ||
    ""
  ).trim();

  // Support explicit HOURS_GRAPH_CLIENT_ID & HOURS_GRAPH_CLIENT_SECRET
  let hoursClientId = (
    envObj.HOURS_GRAPH_CLIENT_ID ||
    p?.HOURS_GRAPH_CLIENT_ID ||
    ""
  ).trim();

  let hoursClientSecret = (
    envObj.HOURS_GRAPH_CLIENT_SECRET ||
    p?.HOURS_GRAPH_CLIENT_SECRET ||
    ""
  ).trim();

  // Auto-detect if user swapped client ID and client secret
  // (e.g. client ID has "~" and client secret is a 36-char GUID)
  if (hoursClientId.includes("~") && /^[0-9a-fA-F-]{36}$/.test(hoursClientSecret)) {
    const tmp = hoursClientId;
    hoursClientId = hoursClientSecret;
    hoursClientSecret = tmp;
  }

  // Fallback to AZURE_CLIENT_ID / CLIENT_ID if HOURS_GRAPH_* not provided
  const clientId = (
    hoursClientId ||
    envObj.AZURE_CLIENT_ID ||
    envObj.CLIENT_ID ||
    p?.AZURE_CLIENT_ID ||
    p?.CLIENT_ID ||
    ""
  ).trim();

  const clientSecret = (
    hoursClientSecret ||
    envObj.AZURE_CLIENT_SECRET ||
    envObj.CLIENT_SECRET ||
    p?.AZURE_CLIENT_SECRET ||
    p?.CLIENT_SECRET ||
    ""
  ).trim();

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
 * Obtain Microsoft Graph access token using existing client credentials connection
 * with resilient fallback across credential pairs.
 */
export async function getGraphAccessToken(env?: any): Promise<string> {
  const now = Date.now();
  if (cachedGraphToken && cachedGraphToken.expiresAt > now + 60000) {
    return cachedGraphToken.token;
  }

  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};
  const { credentials } = getGraphHoursConfig(env);

  if (!credentials.tenantId) {
    throw new Error(
      "חסרה הגדרת מזהה דייר Microsoft Graph בשרת (TENANT_ID או AZURE_TENANT_ID)"
    );
  }

  // Build candidate pairs to try
  const candidates: Array<{ clientId: string; clientSecret: string; label: string }> = [];

  // Candidate 1: Preferred Hours credentials from config
  if (credentials.clientId && credentials.clientSecret) {
    candidates.push({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      label: "HOURS_GRAPH credentials",
    });
  }

  // Candidate 2: Server default CLIENT_ID / CLIENT_SECRET
  const serverClientId = (envObj.CLIENT_ID || p?.CLIENT_ID || "").trim();
  const serverClientSecret = (envObj.CLIENT_SECRET || p?.CLIENT_SECRET || "").trim();
  if (
    serverClientId &&
    serverClientSecret &&
    (serverClientId !== credentials.clientId || serverClientSecret !== credentials.clientSecret)
  ) {
    candidates.push({
      clientId: serverClientId,
      clientSecret: serverClientSecret,
      label: "Server default CLIENT_ID/SECRET",
    });
  }

  // Candidate 3: Inverted credentials in case client_id and secret were supplied inverted
  if (credentials.clientId && credentials.clientSecret) {
    candidates.push({
      clientId: credentials.clientSecret,
      clientSecret: credentials.clientId,
      label: "Inverted credentials candidate",
    });
  }

  let lastError = "";

  for (const cand of candidates) {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(credentials.tenantId)}/oauth2/v2.0/token`;
      const bodyParams = new URLSearchParams({
        client_id: cand.clientId,
        client_secret: cand.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `[${cand.label}] HTTP ${res.status}: ${errText}`;
        console.warn(`[getGraphAccessToken] Failed candidate ${cand.label}:`, lastError);
        continue;
      }

      const data: any = await res.json();
      const token = data?.access_token;
      if (token) {
        const expiresInSec = Number(data?.expires_in) || 3599;
        cachedGraphToken = {
          token,
          expiresAt: now + expiresInSec * 1000,
        };
        return token;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[getGraphAccessToken] Error testing candidate ${cand.label}:`, lastError);
    }
  }

  throw new Error(`שגיאה בקבלת טוקן Microsoft Graph מ-Microsoft Entra ID: ${lastError}`);
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

  let folderCustomers: CustomerFolder[] = [];
  try {
    const res = await fetchGraph(childrenUrl, { method: "GET" }, env);
    if (res.ok) {
      const data: any = await res.json();
      const rootFolders: any[] = (data.value || []).filter((item: any) => Boolean(item.folder));

      // Check which folders contain a subfolder named "שעות עבודה"
      // Check in concurrent batches of 10
      const batchSize = 10;
      for (let i = 0; i < rootFolders.length; i += batchSize) {
        const batch = rootFolders.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (folder) => {
            try {
              const subUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folder.id}/children?$top=100`;
              const subRes = await fetchGraph(subUrl, { method: "GET" }, env);
              if (!subRes.ok) return null;
              const subData: any = await subRes.json();
              const subItems: any[] = subData.value || [];
              const hoursItem = subItems.find(
                (item) => Boolean(item.folder) && (item.name === hoursFolderName || item.name.includes("שעות"))
              );
              if (hoursItem) {
                return {
                  id: folder.id,
                  name: folder.name,
                  webUrl: folder.webUrl,
                  driveId,
                  hoursFolderId: hoursItem.id,
                  type: "folder" as const,
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );

        for (const item of batchResults) {
          if (item) folderCustomers.push(item);
        }
      }
    }
  } catch (err) {
    console.warn("[detectAndListCustomers] Error checking default document library:", err);
  }

  // If customer folders with "שעות עבודה" were found in the default document library
  if (folderCustomers.length > 0) {
    customersCache = {
      timestamp: now,
      siteId,
      detectedStructure: "folders",
      items: folderCustomers,
    };
    return {
      siteId,
      detectedStructure: "folders",
      totalCustomers: folderCustomers.length,
      first10Customers: folderCustomers.slice(0, 10).map((c) => c.name),
      customers: folderCustomers,
    };
  }

  // =========================================================================
  // 2. If no such folders found: list document libraries (GET /sites/{siteId}/drives)
  // Treat each library that contains a root folder "שעות עבודה" as a customer (customer name = library name).
  // =========================================================================
  let libraryCustomers: CustomerFolder[] = [];
  try {
    const drivesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives?$top=999`;
    const drivesRes = await fetchGraph(drivesUrl, { method: "GET" }, env);
    if (drivesRes.ok) {
      const drivesData: any = await drivesRes.json();
      const allDrives: any[] = (drivesData.value || []).filter(
        (d: any) => !d.system && d.name !== "Preservation Hold Library"
      );

      const batchSize = 10;
      for (let i = 0; i < allDrives.length; i += batchSize) {
        const batch = allDrives.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (drive) => {
            try {
              const driveRootUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children?$top=100`;
              const driveRootRes = await fetchGraph(driveRootUrl, { method: "GET" }, env);
              if (!driveRootRes.ok) return null;
              const driveRootData: any = await driveRootRes.json();
              const driveRootItems: any[] = driveRootData.value || [];
              const hoursItem = driveRootItems.find(
                (item) => Boolean(item.folder) && (item.name === hoursFolderName || item.name.includes("שעות"))
              );
              if (hoursItem) {
                return {
                  id: drive.id,
                  name: drive.name,
                  webUrl: drive.webUrl,
                  driveId: drive.id,
                  hoursFolderId: hoursItem.id,
                  type: "library" as const,
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );

        for (const item of batchResults) {
          if (item) libraryCustomers.push(item);
        }
      }
    }
  } catch (err) {
    console.warn("[detectAndListCustomers] Error checking document libraries:", err);
  }

  if (libraryCustomers.length > 0) {
    customersCache = {
      timestamp: now,
      siteId,
      detectedStructure: "libraries",
      items: libraryCustomers,
    };
    return {
      siteId,
      detectedStructure: "libraries",
      totalCustomers: libraryCustomers.length,
      first10Customers: libraryCustomers.slice(0, 10).map((c) => c.name),
      customers: libraryCustomers,
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

  // 2. Find "שעות עבודה" inside customer folder / library
  let hoursFolderId = customerFolder.hoursFolderId;

  if (!hoursFolderId) {
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

    // Look for folder named "שעות עבודה" (or containing "שעות")
    const hoursFolder = custItems.find(
      (item) => Boolean(item.folder) && (item.name === hoursFolderName || item.name.includes("שעות"))
    );

    if (!hoursFolder) {
      return {
        found: false,
        message: `תיקיית "${hoursFolderName}" לא קיימת בתוך תיקיית הלקוח "${customerFolder.name}". (קיימות: ${custItems.map((i) => i.name).join(", ") || "אין פריטים"})`,
        customerName: customerFolder.name,
        requestedMonth: ym,
        existingItems: custItems.map((i) => i.name),
      };
    }
    hoursFolderId = hoursFolder.id;
  }

  // 3. List children inside "שעות עבודה"
  const hoursChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${hoursFolderId}/children?$top=200`;
  const hoursChildrenRes = await fetchGraph(hoursChildrenUrl, { method: "GET" }, env);
  if (!hoursChildrenRes.ok) {
    const err = await hoursChildrenRes.text().catch(() => "");
    throw new Error(`שגיאה בקריאת תוכן תיקיית "${hoursFolderName}": ${err}`);
  }

  const hoursData: any = await hoursChildrenRes.json();
  const hoursItems: any[] = hoursData.value || [];
  const existingNames = hoursItems.map((i) => i.name);

  // 4. DETECT naming pattern from existing items
  let detectedPattern = "YYYY-MM"; // default
  for (const name of existingNames) {
    if (/\b\d{4}[-.]\d{2}\b/.test(name)) {
      detectedPattern = "YYYY-MM";
      break;
    } else if (/\b\d{2}[.]\d{4}\b/.test(name)) {
      detectedPattern = "MM.YYYY";
      break;
    } else if (/\b\d{2}[-]\d{4}\b/.test(name)) {
      detectedPattern = "MM-YYYY";
      break;
    } else if (/\b\d{2}[-.]\d{2}\b/.test(name)) {
      detectedPattern = "MM-YY";
      break;
    } else if (Object.values(HEBREW_MONTHS).some((arr) => arr.some((h) => name.includes(h)))) {
      detectedPattern = "HEBREW_MONTH_YYYY";
      break;
    }
  }

  // Candidate patterns for the requested month:
  // e.g. "2026-09", "09.2026", "09-2026", "09-26", "09.26", "2026.09", "ספטמבר 2026", "ספטמבר 26", etc.
  const candidates: string[] = [
    `${year}-${mm}`,
    `${mm}.${year}`,
    `${mm}-${year}`,
    `${mm}-${yy}`,
    `${mm}.${yy}`,
    `${year}.${mm}`,
    `${mm}_${year}`,
    `${year}_${mm}`,
  ];
  for (const h of hebrewNames) {
    candidates.push(`${h} ${year}`);
    candidates.push(`${h} ${yy}`);
    candidates.push(`${h}_${year}`);
    candidates.push(`${h}-${year}`);
    candidates.push(`${mm} ${h} ${year}`);
    candidates.push(`שעות ${h} ${year}`);
  }

  // Check matching items in hoursItems
  // Check both A) Month folder -> .xlsx inside, and B) Direct .xlsx file
  let matchedItem: any = null;

  for (const item of hoursItems) {
    const cleanItemName = item.name.toLowerCase().replace(/\.xlsx$/i, "").trim();

    const matchesCandidate = candidates.some((c) => {
      const cleanC = c.toLowerCase().trim();
      return cleanItemName === cleanC || cleanItemName.includes(cleanC) || cleanC.includes(cleanItemName);
    });

    if (matchesCandidate) {
      matchedItem = item;
      break;
    }
  }

  // If no direct candidate match, do fuzzy token search on existing items
  if (!matchedItem) {
    for (const item of hoursItems) {
      const cleanItemName = item.name.toLowerCase();
      const hasMonthNum = cleanItemName.includes(mm) || cleanItemName.includes(` ${month} `) || cleanItemName.includes(`-${month}-`);
      const hasYear = cleanItemName.includes(String(year)) || cleanItemName.includes(yy);
      const hasHebrew = hebrewNames.some((h) => cleanItemName.includes(h.toLowerCase()));

      if ((hasMonthNum && hasYear) || (hasHebrew && hasYear)) {
        matchedItem = item;
        break;
      }
    }
  }

  // If NOT found: return clear "not found" with existing names. NEVER create files!
  if (!matchedItem) {
    return {
      found: false,
      message: `לא נמצא קובץ או תיקייה עבור חודש ${mm}/${year} בתיקיית "${hoursFolderName}" של ${customerFolder.name}.`,
      customerName: customerFolder.name,
      requestedMonth: ym,
      detectedPattern,
      existingItems: existingNames,
    };
  }

  // Case A: matched item is a folder -> find the .xlsx inside
  if (matchedItem.folder) {
    const folderChildrenUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${matchedItem.id}/children?$top=50`;
    const folderRes = await fetchGraph(folderChildrenUrl, { method: "GET" }, env);
    if (!folderRes.ok) {
      const err = await folderRes.text().catch(() => "");
      throw new Error(`שגיאה בקריאת תיקיית חודש ${matchedItem.name}: ${err}`);
    }
    const folderData: any = await folderRes.json();
    const folderItems: any[] = folderData.value || [];

    // Find .xlsx file inside
    const xlsxFile = folderItems.find((i) => i.name.toLowerCase().endsWith(".xlsx") && !i.name.startsWith("~$"));
    if (!xlsxFile) {
      return {
        found: false,
        message: `נמצאה תיקיית חודש "${matchedItem.name}", אך לא נמצא בתוכה קובץ Excel (.xlsx).`,
        customerName: customerFolder.name,
        requestedMonth: ym,
        detectedPattern,
        existingItems: folderItems.map((i) => i.name),
      };
    }

    return {
      found: true,
      customerName: customerFolder.name,
      requestedMonth: ym,
      targetType: "month_folder_file",
      fileId: xlsxFile.id,
      fileName: xlsxFile.name,
      filePath: `${customerFolder.name}/${hoursFolderName}/${matchedItem.name}/${xlsxFile.name}`,
      webUrl: xlsxFile.webUrl,
      driveId,
      detectedPattern,
      existingItems: existingNames,
    };
  }

  // Case B: matched item is directly an .xlsx file
  if (matchedItem.name.toLowerCase().endsWith(".xlsx")) {
    return {
      found: true,
      customerName: customerFolder.name,
      requestedMonth: ym,
      targetType: "file",
      fileId: matchedItem.id,
      fileName: matchedItem.name,
      filePath: `${customerFolder.name}/${hoursFolderName}/${matchedItem.name}`,
      webUrl: matchedItem.webUrl,
      driveId,
      detectedPattern,
      existingItems: existingNames,
    };
  }

  return {
    found: false,
    message: `נמצא פריט תואם "${matchedItem.name}" אך אינו קובץ Excel או תיקייה.`,
    customerName: customerFolder.name,
    requestedMonth: ym,
    detectedPattern,
    existingItems: existingNames,
  };
}

/**
 * 4. readSheetStructure(fileId) – open the workbook:
 * - If there is an Excel Table -> return table name, headers, last 5 rows.
 * - Otherwise -> read the used range, detect the header row, the columns, the last data row,
 *   and whether there is a totals/summary row below. Return headers, last 5 rows,
 *   and the exact address of the next empty row (above any totals row).
 * - Detect the formats used in existing rows (date format, time format, hours as decimal or hh:mm).
 */
export async function readSheetStructure(fileId: string, env?: any): Promise<SheetStructureResult> {
  const { driveId } = await resolveSharePointDrive(env);

  // 1. Check for Excel Tables first
  const tablesUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables?$top=10`;
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
        headers,
        last5Rows,
        totalDataRows,
        nextEmptyRowAddress: `Table:${tableName}[#NextRow]`,
        hasTotalsRow: Boolean(table.showTotals),
        formats,
      };
    }
  }

  // 2. No Excel Table -> Read the used range of the active/first worksheet
  const sheetsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets?$top=5`;
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

  const sheet = sheets[0];
  const sheetId = sheet.id;
  const sheetName = sheet.name;

  // Read used range with values, formulas, and address
  const usedRangeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/usedRange`;
  const usedRangeRes = await fetchGraph(usedRangeUrl, { method: "GET" }, env);
  if (!usedRangeRes.ok) {
    // If sheet is completely empty:
    return {
      fileId,
      isTable: false,
      sheetName,
      sheetId,
      headers: ["תאריך", "עובד", "שעת התחלה", "שעת סיום", "סה״כ שעות", "תיאור פעילות"],
      last5Rows: [],
      totalDataRows: 0,
      nextEmptyRowAddress: "A2",
      hasTotalsRow: false,
      formats: {
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm",
        hoursFormat: "decimal",
        formulaColumns: [],
      },
    };
  }

  const rangeData: any = await usedRangeRes.json();
  const values: any[][] = rangeData.values || [];
  const formulas: any[][] = rangeData.formulas || [];
  const fullAddress: string = rangeData.address || "A1";

  // Parse start row & col from address (e.g. "Sheet1!A1:F20" or "A1:F20")
  const addressMatch = fullAddress.match(/(?:.*!)?([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
  const startRowIndex = addressMatch ? parseInt(addressMatch[2], 10) : 1;
  const startColLetter = addressMatch ? addressMatch[1] : "A";
  const endColLetter = addressMatch ? addressMatch[3] : "F";

  // Detect header row: scan first 5 rows to find the row with the most text headers
  let headerRowOffset = 0;
  let headers: string[] = [];
  const headerKeywords = ["תאריך", "עובד", "שעה", "שעות", "תיאור", "התחלה", "סיום", "לקוח", "date", "employee", "hours", "task"];

  for (let r = 0; r < Math.min(values.length, 5); r++) {
    const row = values[r] || [];
    const textCols = row.filter((c: any) => typeof c === "string" && c.trim().length > 0);
    const hasKeyword = row.some((c: any) =>
      typeof c === "string" && headerKeywords.some((k) => c.toLowerCase().includes(k))
    );

    if (hasKeyword || (textCols.length >= 2 && textCols.length > headers.length)) {
      headerRowOffset = r;
      headers = row.map((c: any) => String(c || "").trim());
    }
  }

  if (headers.length === 0 && values.length > 0) {
    headers = (values[0] || []).map((c: any, idx: number) => String(c || `עמודה ${idx + 1}`).trim());
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

  if (hasTotalsRow) {
    const actualTotalsRowNumber = startRowIndex + totalsRowOffset;
    totalsRowAddress = `${startColLetter}${actualTotalsRowNumber}:${endColLetter}${actualTotalsRowNumber}`;
    // If totals row is immediately below the last data row, the new row will be placed at that exact row
    // (using shift down or insertion)
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

/**
 * 5. writeRows(fileId, rows) – rows are objects keyed by the EXISTING header names.
 * - Table -> POST /workbook/tables/{id}/rows/add.
 * - Plain range -> PATCH exactly the next empty row(s). Never overwrite existing data,
 *   formulas, headers, totals or formatting. If a column contains a formula in previous rows,
 *   do not write a value into it.
 * - Use a workbook session (persistChanges=true), close it afterwards.
 * - Retry 409/423/429 up to 3 times with backoff, then return a clear Hebrew error.
 * - Return the written row address and a web link to the file.
 */
export async function writeRows(
  fileId: string,
  rows: Record<string, any>[],
  userContext?: { name?: string; email?: string },
  env?: any
): Promise<WriteRowsResult> {
  if (!rows || rows.length === 0) {
    throw new Error("לא סופקו שורות לכתיבה");
  }

  const { driveId } = await resolveSharePointDrive(env);
  const now = Date.now();
  const entryId = `entry_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const userName = userContext?.name || userContext?.email || "עובד מערכת";

  // 1. Create a workbook session (persistChanges: true)
  const sessionUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/createSession`;
  const sessionRes = await fetchGraph(
    sessionUrl,
    {
      method: "POST",
      body: JSON.stringify({ persistChanges: true }),
    },
    env
  );

  if (!sessionRes.ok) {
    const err = await sessionRes.text().catch(() => "");
    throw new Error(`שגיאה בפתיחת Workbook Session ב-Excel (${sessionRes.status}): ${err}`);
  }

  const sessionData: any = await sessionRes.json();
  const sessionId = sessionData?.id;
  if (!sessionId) {
    throw new Error("לא התקבל workbook-session-id משרת Microsoft Graph");
  }

  const sessionHeaders = {
    "workbook-session-id": sessionId,
  };

  try {
    // 2. Read current sheet structure under this session
    const structure = await readSheetStructure(fileId, env);
    const headers = structure.headers;

    // Map rows into matrix of values according to headers
    const rowValuesMatrix = rows.map((rowObj) => {
      return headers.map((headerName, colIdx) => {
        // If this column has a formula in previous rows, do NOT write a value into it
        if (structure.formats.formulaColumns.includes(colIdx)) {
          return null;
        }

        // Try exact header match
        if (rowObj[headerName] !== undefined) {
          return rowObj[headerName];
        }

        // Fuzzy match header name if not exact
        const normHeader = normalizeCustomerString(headerName);
        for (const [key, val] of Object.entries(rowObj)) {
          if (normalizeCustomerString(key) === normHeader) {
            return val;
          }
        }

        return "";
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
      writtenRowAddress = addRowData.address || `Table:${structure.tableName}[Row]`;

      // Log into server-side undo log
      undoLog.push({
        entryId,
        user: userName,
        fileId,
        rowAddress: writtenRowAddress,
        timestamp: now,
        isTable: true,
        tableId: structure.tableId,
        rowIndex: structure.totalDataRows,
      });
    }
    // CASE B: Plain Range
    else {
      const sheetId = structure.sheetId;
      const targetAddress = structure.nextEmptyRowAddress;

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

      // Log into server-side undo log
      undoLog.push({
        entryId,
        user: userName,
        fileId,
        rowAddress: writtenRowAddress,
        timestamp: now,
        isTable: false,
        sheetId,
      });
    }

    // Get item webUrl
    const itemUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}?$select=webUrl`;
    const itemRes = await fetchGraph(itemUrl, { method: "GET" }, env);
    let webUrl = "";
    if (itemRes.ok) {
      const itemData: any = await itemRes.json();
      webUrl = itemData.webUrl || "";
    }

    return {
      success: true,
      rowAddress: writtenRowAddress,
      webUrl,
      entryId,
      timestamp: now,
      fileId,
      writtenValues: rowValuesMatrix,
    };
  } finally {
    // 3. Always close the workbook session in finally block
    try {
      const closeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/closeSession`;
      await fetchGraph(closeUrl, { method: "POST", headers: sessionHeaders }, env);
    } catch (closeErr) {
      console.warn("[writeRows] Error closing workbook session:", closeErr);
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
  env?: any
): Promise<DuplicateCheckResult> {
  const structure = await readSheetStructure(fileId, env);
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
 * 7. undoRow(fileId, rowAddress) – only rows written by this tool in the last 10 minutes
 * (keep a server-side log: entryId, user, fileId, rowAddress, timestamp). Clear/delete that row only.
 */
export async function undoRow(
  fileId: string,
  rowAddressOrEntryId: string,
  userContext?: { name?: string; email?: string },
  env?: any
): Promise<UndoRowResult> {
  const now = Date.now();
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  // Find in undo log
  const entryIdx = undoLog.findIndex((e) => {
    const isSameFile = e.fileId === fileId;
    const isSameTarget = e.rowAddress === rowAddressOrEntryId || e.entryId === rowAddressOrEntryId;
    return isSameFile && isSameTarget;
  });

  if (entryIdx === -1) {
    throw new Error(
      "לא ניתן לבטל שורה זו: השורה אינה קיימת ביומן הפעולות האחרונות או שנכתבה בהפעלה אחרת"
    );
  }

  const entry = undoLog[entryIdx];

  // Check 10 minutes limit
  if (now - entry.timestamp > TEN_MINUTES_MS) {
    throw new Error(
      `לא ניתן לבטל שורה זו: חלפו יותר מ-10 דקות מרגע הכתיבה (${Math.round((now - entry.timestamp) / 60000)} דקות)`
    );
  }

  const { driveId } = await resolveSharePointDrive(env);

  // 1. Open Workbook session
  const sessionUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/createSession`;
  const sessionRes = await fetchGraph(
    sessionUrl,
    {
      method: "POST",
      body: JSON.stringify({ persistChanges: true }),
    },
    env
  );

  if (!sessionRes.ok) {
    const err = await sessionRes.text().catch(() => "");
    throw new Error(`שגיאה בפתיחת Workbook Session לביטול שורה (${sessionRes.status}): ${err}`);
  }

  const sessionData: any = await sessionRes.json();
  const sessionId = sessionData.id;
  const sessionHeaders = { "workbook-session-id": sessionId };

  try {
    // Delete/clear the row based on whether it was a table or plain range
    if (entry.isTable && entry.tableId && entry.rowIndex !== undefined) {
      // Delete table row by index
      const deleteRowUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${entry.tableId}/rows/itemAt(index=${entry.rowIndex})`;
      const delRes = await fetchGraph(
        deleteRowUrl,
        {
          method: "DELETE",
          headers: sessionHeaders,
        },
        env
      );

      if (!delRes.ok) {
        // Fallback: clear range values
        console.warn("[undoRow] table row delete returned non-ok, falling back to clear");
      }
    } else {
      // Plain range: delete row and shift up or clear values
      const sheetId = entry.sheetId;
      const rangeAddress = entry.rowAddress;
      const deleteRangeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${rangeAddress}')/delete`;
      const delRes = await fetchGraph(
        deleteRangeUrl,
        {
          method: "POST",
          headers: sessionHeaders,
          body: JSON.stringify({ shift: "Up" }),
        },
        env
      );

      if (!delRes.ok) {
        // If delete fails, clear the contents of the range so data is not retained
        const clearUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${rangeAddress}')/clear`;
        await fetchGraph(
          clearUrl,
          {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ applyTo: "Contents" }),
          },
          env
        );
      }
    }

    // Remove from undo log
    undoLog.splice(entryIdx, 1);

    return {
      success: true,
      message: `השורה בכתובת ${entry.rowAddress} בוטלה ונמחקה בהצלחה מקובץ ה-Excel.`,
      rowAddress: entry.rowAddress,
      fileId,
    };
  } finally {
    try {
      const closeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/closeSession`;
      await fetchGraph(closeUrl, { method: "POST", headers: sessionHeaders }, env);
    } catch (closeErr) {
      console.warn("[undoRow] Error closing session:", closeErr);
    }
  }
}
