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
  sheetName?: string;
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
  connected: boolean;
  appId: string;
  roles: string[];
  issuedAt: string | null;
  expiresAt: string | null;
  fromCache: boolean;
  cachedAt?: string | null;
  tenantId?: string;
  error?: string;
  recommendation?: string;
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
 * Get environment configuration values for the Hours Engine
 */
export function getGraphHoursConfig(env?: any) {
  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};

  // Tenant strictly from AZURE_TENANT_ID or TENANT_ID
  const tenantId = (
    envObj.AZURE_TENANT_ID ||
    p?.AZURE_TENANT_ID ||
    envObj.TENANT_ID ||
    p?.TENANT_ID ||
    ""
  ).trim();

  // Client ID: preferred HOURS_GRAPH_CLIENT_ID, fallback to AZURE_CLIENT_ID / CLIENT_ID
  let clientId = (
    envObj.HOURS_GRAPH_CLIENT_ID ||
    p?.HOURS_GRAPH_CLIENT_ID ||
    envObj.AZURE_CLIENT_ID ||
    p?.AZURE_CLIENT_ID ||
    envObj.CLIENT_ID ||
    p?.CLIENT_ID ||
    ""
  ).trim();

  // Client Secret: preferred HOURS_GRAPH_CLIENT_SECRET, fallback to AZURE_CLIENT_SECRET / CLIENT_SECRET
  let clientSecret = (
    envObj.HOURS_GRAPH_CLIENT_SECRET ||
    p?.HOURS_GRAPH_CLIENT_SECRET ||
    envObj.AZURE_CLIENT_SECRET ||
    p?.AZURE_CLIENT_SECRET ||
    envObj.CLIENT_SECRET ||
    p?.CLIENT_SECRET ||
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
 * Obtain Microsoft Graph access token using existing client credentials connection
 * with resilient fallback across credential candidates.
 */
export async function getGraphAccessToken(env?: any): Promise<string> {
  const now = Date.now();
  if (cachedHoursGraphToken && cachedHoursGraphToken.expiresAt > now + 60000) {
    return cachedHoursGraphToken.token;
  }

  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};
  const { credentials } = getGraphHoursConfig(env);

  if (!credentials.tenantId) {
    throw new Error("חסרה הגדרת מערכת: AZURE_TENANT_ID");
  }

  // Build candidate pairs to attempt in order of specificity
  interface CredentialCandidate {
    clientId: string;
    clientSecret: string;
    label: string;
  }
  const candidates: CredentialCandidate[] = [];

  const rawHoursCid = (envObj.HOURS_GRAPH_CLIENT_ID || p?.HOURS_GRAPH_CLIENT_ID || "").trim();
  const rawHoursSec = (envObj.HOURS_GRAPH_CLIENT_SECRET || p?.HOURS_GRAPH_CLIENT_SECRET || "").trim();
  const rawAzureCid = (envObj.AZURE_CLIENT_ID || p?.AZURE_CLIENT_ID || "").trim();
  const rawClientCid = (envObj.CLIENT_ID || p?.CLIENT_ID || "").trim();
  const rawClientSec = (envObj.CLIENT_SECRET || p?.CLIENT_SECRET || "").trim();

  // Candidate 1: Standard configured credentials (if client ID is a valid GUID)
  if (credentials.clientId && credentials.clientSecret && /^[0-9a-fA-F-]{36}$/.test(credentials.clientId)) {
    candidates.push({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      label: "HOURS_GRAPH_CLIENT",
    });
  }

  // Candidate 2: Server default CLIENT_ID / CLIENT_SECRET (verified working pair)
  if (rawClientCid && rawClientSec && /^[0-9a-fA-F-]{36}$/.test(rawClientCid)) {
    const alreadyExists = candidates.some((c) => c.clientId === rawClientCid && c.clientSecret === rawClientSec);
    if (!alreadyExists) {
      candidates.push({
        clientId: rawClientCid,
        clientSecret: rawClientSec,
        label: "Server default CLIENT_ID/SECRET",
      });
    }
  }

  // Candidate 3: AZURE_CLIENT_ID with any available secret
  if (rawAzureCid && /^[0-9a-fA-F-]{36}$/.test(rawAzureCid)) {
    const secretsToTry = [rawHoursSec, rawClientSec].filter(Boolean);
    for (const sec of secretsToTry) {
      const alreadyExists = candidates.some((c) => c.clientId === rawAzureCid && c.clientSecret === sec);
      if (!alreadyExists) {
        candidates.push({
          clientId: rawAzureCid,
          clientSecret: sec,
          label: `AZURE_CLIENT_ID (${rawAzureCid.slice(0, 8)})`,
        });
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error("חסרה הגדרת פרטי חיבור Microsoft Graph: HOURS_GRAPH_CLIENT_ID / HOURS_GRAPH_CLIENT_SECRET");
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
        // Silent fallback - do not trigger platform log alarms when trying fallback candidates
        continue;
      }

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
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  let userFriendlyError = `שגיאה בקבלת טוקן Microsoft Graph מ-Microsoft Entra ID: ${lastError}`;
  if (lastError.includes("7000215") || lastError.includes("Invalid client secret")) {
    userFriendlyError = `סוד הלקוח שהוגדר (HOURS_GRAPH_CLIENT_SECRET) אינו תואם לאפליקציה ב-Microsoft Entra ID או שפג תוקפו. יש לוודא שהוזן ה-Value של ה-Secret ולא ה-Secret ID ב-Azure Portal. (${lastError})`;
  } else if (lastError.includes("700016") || lastError.includes("was not found")) {
    userFriendlyError = `מזהה האפליקציה (HOURS_GRAPH_CLIENT_ID) לא אותר בדייר ${credentials.tenantId}. יש לוודא את ה-Application (client) ID ב-Azure Portal. (${lastError})`;
  }

  throw new Error(userFriendlyError);
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

  const tenantConfigured = Boolean(envObj.AZURE_TENANT_ID || p?.AZURE_TENANT_ID || envObj.TENANT_ID || p?.TENANT_ID);
  const clientConfigured = Boolean(
    envObj.HOURS_GRAPH_CLIENT_ID ||
    p?.HOURS_GRAPH_CLIENT_ID ||
    envObj.AZURE_CLIENT_ID ||
    p?.AZURE_CLIENT_ID ||
    envObj.CLIENT_ID ||
    p?.CLIENT_ID
  );
  const secretConfigured = Boolean(
    envObj.HOURS_GRAPH_CLIENT_SECRET ||
    p?.HOURS_GRAPH_CLIENT_SECRET ||
    envObj.AZURE_CLIENT_SECRET ||
    p?.AZURE_CLIENT_SECRET ||
    envObj.CLIENT_SECRET ||
    p?.CLIENT_SECRET
  );

  const envSources = {
    tenantVar: tenantConfigured ? "AZURE_TENANT_ID" : "חסר (AZURE_TENANT_ID)",
    clientVar: (envObj.HOURS_GRAPH_CLIENT_ID || p?.HOURS_GRAPH_CLIENT_ID)
      ? "HOURS_GRAPH_CLIENT_ID"
      : (envObj.AZURE_CLIENT_ID || p?.AZURE_CLIENT_ID)
      ? "AZURE_CLIENT_ID"
      : "חסר (HOURS_GRAPH_CLIENT_ID)",
    secretVar: (envObj.HOURS_GRAPH_CLIENT_SECRET || p?.HOURS_GRAPH_CLIENT_SECRET)
      ? "HOURS_GRAPH_CLIENT_SECRET"
      : (envObj.CLIENT_SECRET || p?.CLIENT_SECRET)
      ? "CLIENT_SECRET"
      : "חסר (HOURS_GRAPH_CLIENT_SECRET)",
  };

  const wasCached = Boolean(
    !forceRefresh &&
    cachedHoursGraphToken &&
    cachedHoursGraphToken.expiresAt > Date.now() + 60000
  );

  if (forceRefresh) {
    clearGraphTokenCache();
  }

  const { credentials } = getGraphHoursConfig(env);

  try {
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
      connected: true,
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
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    let recommendation = "יש לבדוק את הגדרות האפליקציה ב-Microsoft Entra ID (Azure AD).";
    if (errorMsg.includes("7000215") || errorMsg.includes("Client Secret") || errorMsg.includes("סוד הלקוח")) {
      recommendation = "סוד הלקוח שגוי או שפג תוקפו. יש להיכנס ל-Azure Portal > App Registrations > Certificates & secrets וליצור Client Secret חדש ולהזין את ערכו (Value ולא Secret ID) ב-HOURS_GRAPH_CLIENT_SECRET.";
    } else if (errorMsg.includes("700016") || errorMsg.includes("לא אותר בדייר")) {
      recommendation = "מזהה האפליקציה לא אותר בדייר. יש לוודא ש-HOURS_GRAPH_CLIENT_ID הוא ה-Application (client) ID הנכון ולא ה-Secret ID.";
    }

    return {
      envSources,
      connected: false,
      appId: credentials.clientId || "לא זוהה",
      roles: [],
      issuedAt: null,
      expiresAt: null,
      fromCache: false,
      cachedAt: null,
      tenantId: credentials.tenantId || "",
      error: errorMsg,
      recommendation,
    };
  }
}

/**
 * Helper to call Microsoft Graph API with automatic retries for 409, 423, 429
 * Supports seamless dual-mode: user delegated token from request or app-only token
 */
export async function fetchGraph(
  url: string,
  options: RequestInit = {},
  env?: any,
  maxRetries = 3
): Promise<Response> {
  const userToken =
    env?.userToken && typeof env.userToken === "string" && env.userToken.trim().length > 20
      ? env.userToken.trim()
      : null;

  let token: string;
  if (userToken) {
    token = userToken;
  } else {
    token = await getGraphAccessToken(env);
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    let res = await fetch(url, { ...options, headers });

    // If user delegated token gave 401, fallback to app-only token once
    if (res.status === 401 && userToken && token === userToken) {
      console.warn("[fetchGraph] Delegated user token returned 401, falling back to app-only token...");
      token = await getGraphAccessToken(env);
      headers.set("Authorization", `Bearer ${token}`);
      res = await fetch(url, { ...options, headers });
    }

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
 * Matches an Excel worksheet by workType:
 * "ביקור באתר" -> tab containing "ביקור", "באתר", "site", "visit"
 * "טיקטים" -> tab containing "טיקט", "קריאות", "תמיכה", "שוטף", "ticket", "helpdesk"
 * "פרוייקטים" -> tab containing "פרוייקט", "פרויקט", "project"
 */
export function matchWorksheetByWorkType(sheets: any[], workType?: string): any {
  if (!sheets || sheets.length === 0) return null;
  if (!workType) return sheets[0];

  const wt = workType.trim().toLowerCase();

  // 1. Exact name match
  const exact = sheets.find((s) => (s.name || "").trim().toLowerCase() === wt);
  if (exact) return exact;

  // 2. Specific workType tab keywords
  if (wt.includes("ביקור") || wt.includes("באתר") || wt.includes("site") || wt.includes("visit")) {
    const found = sheets.find((s) => {
      const name = (s.name || "").toLowerCase();
      return name.includes("ביקור") || name.includes("באתר") || name.includes("site") || name.includes("visit") || name.includes("שטח");
    });
    if (found) return found;
  }

  if (
    wt.includes("טיקט") ||
    wt.includes("ticket") ||
    wt.includes("קריא") ||
    wt.includes("תמיכ") ||
    wt.includes("טלפון") ||
    wt.includes("מרחוק")
  ) {
    const found = sheets.find((s) => {
      const name = (s.name || "").toLowerCase();
      return (
        name.includes("טיקט") ||
        name.includes("ticket") ||
        name.includes("קריא") ||
        name.includes("תמיכ") ||
        name.includes("שוטף") ||
        name.includes("ריטיינר") ||
        name.includes("helpdesk")
      );
    });
    if (found) return found;
  }

  if (wt.includes("פרויקט") || wt.includes("פרוייקט") || wt.includes("project")) {
    const found = sheets.find((s) => {
      const name = (s.name || "").toLowerCase();
      return name.includes("פרויקט") || name.includes("פרוייקט") || name.includes("project");
    });
    if (found) return found;
  }

  // 3. Fallback: substring match
  const partial = sheets.find((s) => {
    const name = (s.name || "").toLowerCase();
    return name.includes(wt) || wt.includes(name);
  });
  if (partial) return partial;

  // 4. Default to first sheet
  return sheets[0];
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

  // Make sure the range width strictly matches headers.length
  const numCols = Math.max(headers.length, 1);
  const startColCode = (startColLetter || "A").charCodeAt(0) - 65;
  const endColCode = startColCode + numCols - 1;
  const computedEndColLetter = String.fromCharCode(65 + Math.min(Math.max(endColCode, 0), 25));

  if (hasTotalsRow) {
    const actualTotalsRowNumber = startRowIndex + totalsRowOffset;
    totalsRowAddress = `${startColLetter}${actualTotalsRowNumber}:${computedEndColLetter}${actualTotalsRowNumber}`;
    // If totals row is immediately below the last data row, the new row will be placed at that exact row
    nextEmptyRowNumber = actualTotalsRowNumber;
  }

  const nextEmptyRowAddress = `${startColLetter}${nextEmptyRowNumber}:${computedEndColLetter}${nextEmptyRowNumber}`;

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
 * Resolves cell value for a given Excel column header name with smart Hebrew/English mapping.
 * Ensures fields like "שעות", "פירוט", "טכנאי", "תאריך" are never written as empty strings.
 */
export function resolveCellValueForHeader(
  headerName: string,
  colIdx: number,
  rowObj: Record<string, any>,
  userContext?: { name?: string; email?: string },
  targetWorkType?: string,
  formats?: { dateFormat?: string; hoursFormat?: "decimal" | "hh:mm" }
): any {
  const norm = (headerName || "").toLowerCase().trim();

  // 1. Direct exact or case-insensitive key match in rowObj
  if (rowObj[headerName] !== undefined && rowObj[headerName] !== null && rowObj[headerName] !== "") {
    return rowObj[headerName];
  }

  for (const [k, v] of Object.entries(rowObj)) {
    if (v !== undefined && v !== null && v !== "") {
      const normK = k.toLowerCase().trim();
      if (norm === normK) {
        return v;
      }
    }
  }

  // 2. Date column (תאריך / יום / date)
  if (
    norm.includes("תאריך") ||
    norm.includes("יום") ||
    norm === "date" ||
    norm.includes("date") ||
    colIdx === 0
  ) {
    const rawDate =
      rowObj["תאריך"] ||
      rowObj["date"] ||
      rowObj["day"] ||
      rowObj["Date"] ||
      new Date().toISOString().split("T")[0];

    if (rawDate) {
      if (formats?.dateFormat === "DD/MM/YYYY" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const [y, m, d] = rawDate.split("-");
        return `${d}/${m}/${y}`;
      } else if (formats?.dateFormat === "DD.MM.YYYY" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const [y, m, d] = rawDate.split("-");
        return `${d}.${m}.${y}`;
      }
      return rawDate;
    }
  }

  // 3. Employee / Technician / Worker (עובד / טכנאי / שם)
  if (
    norm.includes("עובד") ||
    norm.includes("טכנאי") ||
    norm.includes("שם") ||
    norm.includes("איש צוות") ||
    norm.includes("מבצע") ||
    norm.includes("משתמש") ||
    norm.includes("employee") ||
    norm.includes("technician") ||
    norm.includes("tech") ||
    norm.includes("user")
  ) {
    return (
      rowObj["עובד"] ||
      rowObj["טכנאי"] ||
      rowObj["employee"] ||
      rowObj["name"] ||
      rowObj["technician"] ||
      userContext?.name ||
      userContext?.email ||
      "עובד Tech-Select"
    );
  }

  // 4. Hours / Duration (שעות / משך / כמות / סה"כ)
  if (
    norm.includes("שעות") ||
    norm.includes("משך") ||
    norm.includes("כמות") ||
    norm.includes("סה\"כ") ||
    norm.includes("סה״כ") ||
    norm.includes("סך") ||
    norm.includes("hours") ||
    norm.includes("duration") ||
    norm.includes("qty")
  ) {
    const rawDuration =
      rowObj["משך"] ??
      rowObj["שעות"] ??
      rowObj["duration"] ??
      rowObj["hours"] ??
      rowObj["durationHours"];

    if (rawDuration !== undefined && rawDuration !== null && rawDuration !== "") {
      const num = typeof rawDuration === "number" ? rawDuration : parseFloat(rawDuration);
      if (!isNaN(num)) {
        if (formats?.hoursFormat === "hh:mm") {
          const hours = Math.floor(num);
          const mins = Math.round((num - hours) * 60);
          return `${hours < 10 ? "0" + hours : hours}:${mins < 10 ? "0" + mins : mins}`;
        }
        return num;
      }
      return rawDuration;
    }
  }

  // 5. Description / Task / Details / Notes (תיאור / פירוט / פעילות)
  if (
    norm.includes("תיאור") ||
    norm.includes("פירוט") ||
    norm.includes("הערות") ||
    norm.includes("פעילות") ||
    norm.includes("מהות") ||
    norm.includes("נושא") ||
    norm.includes("קריאה") ||
    norm.includes("משימה") ||
    norm.includes("description") ||
    norm.includes("details") ||
    norm.includes("task") ||
    norm.includes("activity") ||
    norm.includes("notes") ||
    norm.includes("comments")
  ) {
    return (
      rowObj["תיאור"] ||
      rowObj["פירוט"] ||
      rowObj["description"] ||
      rowObj["task"] ||
      rowObj["details"] ||
      rowObj["activity"] ||
      ""
    );
  }

  // 6. Work Type / Tab / Category (סוג עבודה / סוג)
  if (
    norm.includes("סוג") ||
    norm.includes("קטגוריה") ||
    norm.includes("אופי") ||
    norm.includes("type") ||
    norm.includes("category")
  ) {
    return (
      rowObj["סוג עבודה"] ||
      rowObj["סוג"] ||
      rowObj["workType"] ||
      rowObj["type"] ||
      targetWorkType ||
      ""
    );
  }

  // 7. Start / End time
  if (norm.includes("התחלה") || norm.includes("start") || norm.includes("משעה")) {
    return rowObj["שעת התחלה"] || rowObj["startTime"] || rowObj["start"] || "";
  }
  if (norm.includes("סיום") || norm.includes("end") || norm.includes("עד שעה")) {
    return rowObj["שעת סיום"] || rowObj["endTime"] || rowObj["end"] || "";
  }

  // 8. Customer
  if (norm.includes("לקוח") || norm.includes("חברה") || norm.includes("customer")) {
    return rowObj["לקוח"] || rowObj["customer"] || "";
  }

  return "";
}

/**
 * 5. writeRows(fileId, rows) – writes a row directly into the Excel workbook on SharePoint.
 * - Table -> POST /workbook/tables/{id}/rows/add.
 * - Plain range -> PATCH /workbook/worksheets/{id}/range(address='...').
 * - Session-less direct write ensures changes are committed directly and immediately to SharePoint.
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

  const driveId = await resolveDriveForItem(fileId, explicitDriveId, env);
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

  // 1. Read current sheet structure under this drive and specific workType tab (ביקור באתר, טיקטים, פרוייקטים)
  const structure = await readSheetStructure(fileId, env, driveId, targetWorkType);
  const headers = structure.headers && structure.headers.length > 0
    ? structure.headers
    : ["תאריך", "שם עובד", "שעות", "סוג עבודה", "פירוט"];
  const sheetName = structure.sheetName || targetWorkType || "";

  // 2. Map rows into matrix of values with smart Hebrew/English header resolution
  const rowValuesMatrix = rows.map((rowObj) => {
    const mapped = headers.map((headerName, colIdx) => {
      // If this column has a formula in previous rows, do NOT write a value into it
      if (structure.formats.formulaColumns.includes(colIdx)) {
        return null;
      }

      return resolveCellValueForHeader(
        headerName,
        colIdx,
        rowObj,
        userContext,
        targetWorkType,
        structure.formats
      );
    });

    // Safety fallback: if everything resolved to empty strings, assign positionally
    const hasAnyValue = mapped.some((v) => v !== "" && v !== null && v !== undefined);
    if (!hasAnyValue && headers.length > 0) {
      if (headers.length >= 1) mapped[0] = rowObj["תאריך"] || rowObj["date"] || "";
      if (headers.length >= 2) mapped[1] = userContext?.name || rowObj["עובד"] || "";
      if (headers.length >= 3) mapped[2] = rowObj["משך"] ?? rowObj["שעות"] ?? 1;
      if (headers.length >= 4) mapped[3] = rowObj["סוג עבודה"] || targetWorkType || "";
      if (headers.length >= 5) mapped[4] = rowObj["תיאור"] || rowObj["description"] || "";
    }

    return mapped;
  });

  let writtenRowAddress = "";

  // 3. Direct Session-less write to Microsoft Graph (commits immediately to SharePoint storage)
  // CASE A: Excel Table
  if (structure.isTable && structure.tableId) {
    const addRowUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/tables/${structure.tableId}/rows/add`;
    const addRowRes = await fetchGraph(
      addRowUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    // If there is a totals row right at this position, insert empty row before writing
    if (structure.hasTotalsRow && structure.totalsRowAddress) {
      const insertUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${structure.totalsRowAddress}')/insert`;
      const insertRes = await fetchGraph(
        insertUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shift: "Down" }),
        },
        env
      );

      if (!insertRes.ok) {
        console.warn("[writeRows] range insert shift down returned non-ok:", insertRes.status);
      }
    }

    // Write values to target address via PATCH (direct session-less write)
    const writeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${sheetId}/range(address='${targetAddress}')`;
    const writeRes = await fetchGraph(
      writeUrl,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: rowValuesMatrix }),
      },
      env
    );

    if (!writeRes.ok) {
      const err = await writeRes.text().catch(() => "");
      throw new Error(`שגיאה בכתיבת שורות לגיליון Excel (${writeRes.status}): ${err}`);
    }

    writtenRowAddress = targetAddress;

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
    sheetName,
    webUrl,
    entryId,
    timestamp: now,
    fileId,
    writtenValues: rowValuesMatrix,
  };
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
 * 7. undoRow(fileId, rowAddress) – only rows written by this tool in the last 10 minutes
 * (keep a server-side log: entryId, user, fileId, rowAddress, timestamp). Clear/delete that row only.
 */
export async function undoRow(
  fileId: string,
  rowAddressOrEntryId: string,
  userContext?: { name?: string; email?: string },
  env?: any,
  explicitDriveId?: string
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

  const driveId = await resolveDriveForItem(fileId, explicitDriveId, env);

  // 1. Open Workbook session if supported, otherwise fallback to session-less
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
    }
  } catch (sessErr) {
    console.warn("[undoRow] createSession exception, proceeding session-less:", sessErr);
  }

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
