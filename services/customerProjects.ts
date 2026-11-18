import fs from "node:fs";
import path from "node:path";
import {
  fetchGraph,
  resolveSharePointDrive,
  findMonthTarget,
  inspectWorkbookFile,
  normalizeCustomerString,
  BILINGUAL_CUSTOMER_DICTIONARY,
} from "./graphHours";
import { scoreBilingualCustomerMatch } from "./bilingualCustomerMatcher";
import { fetchSharePointListEntries } from "./sharepointLists";

export interface CustomerProjectItem {
  name: string;
  source: "registry" | "excel" | "lists";
  createdAt?: string;
  createdBy?: string;
}

interface StoredCustomerProjectsMap {
  [canonicalCustomerKey: string]: {
    customerName: string;
    projects: Array<{
      name: string;
      createdAt: string;
      createdBy?: string;
      createdByEmail?: string;
    }>;
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_JSON_PATH = path.join(DATA_DIR, "customer_projects.json");
const SHAREPOINT_PROJECTS_FILE = "customer-projects.json";

let cachedRegistry: { data: StoredCustomerProjectsMap; timestamp: number } | null = null;
const projectsDiscoveryCache = new Map<
  string,
  { projects: CustomerProjectItem[]; timestamp: number }
>();

function normalizeProjectString(str: string): string {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-_'"״׳./\\()]+/g, "");
}

function resolveCanonicalCustomerKey(customerName: string): string {
  const clean = String(customerName || "").trim();
  if (!clean) return "general";
  const norm = normalizeCustomerString(clean);

  // Check bilingual dictionary so "אסיו" and "אסיו Asio" share the same bucket
  for (const [dictKey, aliases] of Object.entries(BILINGUAL_CUSTOMER_DICTIONARY)) {
    const dNorm = normalizeCustomerString(dictKey);
    if (norm === dNorm || aliases.some((a) => normalizeCustomerString(a) === norm)) {
      return dNorm;
    }
  }

  // Also check if registry already has a high-confidence bilingual match
  if (cachedRegistry?.data) {
    let bestKey: string | null = null;
    let bestScore = 0;
    for (const [k, entry] of Object.entries(cachedRegistry.data)) {
      if (k === norm) return k;
      const res = scoreBilingualCustomerMatch(entry.customerName || k, clean);
      if (res.score >= 0.8 && res.score > bestScore) {
        bestScore = res.score;
        bestKey = k;
      }
    }
    if (bestKey) return bestKey;
  }

  return norm || "general";
}

function isPlaceholderProjectName(val: string): boolean {
  const s = String(val || "").trim();
  if (!s || s.length < 2) return true;
  const lower = s.toLowerCase();
  if (
    lower === "-" ||
    lower === "—" ||
    lower === "פרויקט שוטף" ||
    lower === "כללי" ||
    lower === "שונות" ||
    lower === "נציג הלקוח" ||
    lower === "תמיכה ושירות מחשוב" ||
    lower === "הושלם"
  ) {
    return true;
  }
  // Ignore pure dates/numbers/times
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(s)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
  if (/^\d+(?:\.\d+)?$/.test(s)) return true;
  if (/^\d{1,2}:\d{2}$/.test(s)) return true;
  return false;
}

async function resolveToolsDriveId(env?: any): Promise<string> {
  const siteUrl =
    "https://graph.microsoft.com/v1.0/sites/techselectltd.sharepoint.com:/sites/Customers";
  const siteRes = await fetchGraph(siteUrl, { method: "GET" }, env);
  if (siteRes.ok) {
    const siteData: any = await siteRes.json();
    const siteId = siteData.id;
    const drivesRes = await fetchGraph(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
      { method: "GET" },
      env
    );
    if (drivesRes.ok) {
      const drivesData: any = await drivesRes.json();
      const drives: any[] = drivesData.value || [];
      const toolsDrive = drives.find((d) => {
        const name = String(d.name || "").toLowerCase().trim();
        const url = String(d.webUrl || "").toLowerCase();
        return name === "tools" || url.includes("/tools");
      });
      if (toolsDrive?.id) return toolsDrive.id;
    }
    const defaultDriveRes = await fetchGraph(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive`,
      { method: "GET" },
      env
    );
    if (defaultDriveRes.ok) {
      const defaultDrive: any = await defaultDriveRes.json();
      if (defaultDrive?.id) return defaultDrive.id;
    }
  }
  const fallback = await resolveSharePointDrive(env);
  return fallback.driveId;
}

function readLocalRegistry(): StoredCustomerProjectsMap {
  try {
    if (typeof fs?.existsSync === "function" && fs.existsSync(PROJECTS_JSON_PATH)) {
      const raw = fs.readFileSync(PROJECTS_JSON_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as StoredCustomerProjectsMap;
      }
    }
  } catch (err) {
    console.warn("[CustomerProjects] Notice reading local registry:", err);
  }
  return {};
}

function writeLocalRegistry(data: StoredCustomerProjectsMap): void {
  try {
    if (typeof fs?.writeFileSync === "function") {
      if (typeof fs?.existsSync === "function" && !fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PROJECTS_JSON_PATH, JSON.stringify(data, null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[CustomerProjects] Notice writing local registry:", err);
  }
}

async function loadRegistry(env?: any, forceRefresh = false): Promise<StoredCustomerProjectsMap> {
  if (!forceRefresh && cachedRegistry && Date.now() - cachedRegistry.timestamp < 45_000) {
    return cachedRegistry.data;
  }

  const localData = readLocalRegistry();
  let merged: StoredCustomerProjectsMap = { ...localData };

  try {
    const driveId = await resolveToolsDriveId(env);
    const fileUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${SHAREPOINT_PROJECTS_FILE}:/content`;
    const res = await fetchGraph(fileUrl, { method: "GET" }, env);
    if (res.ok) {
      const spData = (await res.json()) as StoredCustomerProjectsMap;
      if (spData && typeof spData === "object") {
        for (const [k, bucket] of Object.entries(spData)) {
          if (!merged[k]) {
            merged[k] = bucket;
          } else {
            const seen = new Set(
              merged[k].projects.map((p) => normalizeProjectString(p.name))
            );
            for (const p of bucket.projects || []) {
              const pNorm = normalizeProjectString(p.name);
              if (!seen.has(pNorm)) {
                merged[k].projects.push(p);
                seen.add(pNorm);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      "[CustomerProjects] Notice reading customer-projects.json from SharePoint:",
      (err as any)?.message || err
    );
  }

  cachedRegistry = { data: merged, timestamp: Date.now() };
  return merged;
}

async function saveRegistry(data: StoredCustomerProjectsMap, env?: any): Promise<void> {
  cachedRegistry = { data, timestamp: Date.now() };
  writeLocalRegistry(data);

  try {
    const driveId = await resolveToolsDriveId(env);
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${SHAREPOINT_PROJECTS_FILE}:/content`;
    const uploadRes = await fetchGraph(
      uploadUrl,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data, null, 2),
      },
      env
    );
    if (!uploadRes.ok) {
      const errTxt = await uploadRes.text().catch(() => "");
      console.warn(`[CustomerProjects] SharePoint PUT warning (${uploadRes.status}): ${errTxt}`);
    }
  } catch (err) {
    console.warn(
      "[CustomerProjects] Notice saving customer-projects.json to SharePoint:",
      (err as any)?.message || err
    );
  }
}

function getRegistryProjectsForCustomer(
  registry: StoredCustomerProjectsMap,
  customerName: string
): CustomerProjectItem[] {
  const canonicalKey = resolveCanonicalCustomerKey(customerName);
  const items: CustomerProjectItem[] = [];
  const seen = new Set<string>();

  for (const [key, bucket] of Object.entries(registry)) {
    const keyMatch =
      key === canonicalKey ||
      scoreBilingualCustomerMatch(bucket.customerName || key, customerName).score >= 0.8;
    if (!keyMatch) continue;

    for (const p of bucket.projects || []) {
      const pName = String(p.name || "").trim();
      const pNorm = normalizeProjectString(pName);
      if (!pName || isPlaceholderProjectName(pName) || seen.has(pNorm)) continue;
      seen.add(pNorm);
      items.push({
        name: pName,
        source: "registry",
        createdAt: p.createdAt,
        createdBy: p.createdBy,
      });
    }
  }

  return items;
}

async function discoverExcelProjectsForCustomer(
  customerName: string,
  fileId?: string,
  driveId?: string,
  env?: any
): Promise<CustomerProjectItem[]> {
  try {
    let targetFileId = fileId;
    let targetDriveId = driveId;

    if (!targetFileId) {
      const todayIso = new Date().toISOString().split("T")[0];
      const mt = await findMonthTarget(customerName, todayIso, env);
      if (!mt.found || !mt.fileId) return [];
      targetFileId = mt.fileId;
      targetDriveId = mt.driveId;
    }

    const inspection = await inspectWorkbookFile(
      targetFileId,
      env,
      targetDriveId,
      customerName,
      { preferredTabName: "פרויקטים", quickMode: false }
    );

    if (!inspection?.worksheets?.length) return [];

    const projectSheets = inspection.worksheets.filter(
      (ws) =>
        ws.detectedType === "project" ||
        ws.name.includes("פרויקט") ||
        ws.name.includes("פרוייקט") ||
        ws.name.toLowerCase().includes("project")
    );
    const sheetsToScan = projectSheets.length > 0 ? projectSheets : [];
    const results: CustomerProjectItem[] = [];
    const seen = new Set<string>();

    for (const ws of sheetsToScan) {
      const headers = ws.headers || [];
      let projectColIdx = ws.fieldToColIndex?.project_name;
      if (projectColIdx === undefined) {
        projectColIdx = headers.findIndex((h) => {
          const low = String(h || "").trim().toLowerCase();
          return (
            low.includes("פרויקט") ||
            low.includes("פרוייקט") ||
            low.includes("project")
          );
        });
      }
      if (projectColIdx === undefined || projectColIdx < 0) continue;

      let rowsToRead: any[][] = ws.recentRows || [];
      // Also read full used range/table rows if possible so older projects aren't missed
      try {
        const effDrive = inspection.driveId || targetDriveId;
        if (ws.isTable && ws.tableId && effDrive) {
          const rowsRes = await fetchGraph(
            `https://graph.microsoft.com/v1.0/drives/${effDrive}/items/${targetFileId}/workbook/tables/${ws.tableId}/rows?$top=200`,
            { method: "GET" },
            env
          );
          if (rowsRes.ok) {
            const rowsData: any = await rowsRes.json();
            const vals = (rowsData.value || []).map((r: any) => r.values?.[0]).filter(Array.isArray);
            if (vals.length > 0) rowsToRead = vals;
          }
        } else if (ws.sheetId && effDrive) {
          const usedRes = await fetchGraph(
            `https://graph.microsoft.com/v1.0/drives/${effDrive}/items/${targetFileId}/workbook/worksheets/${ws.sheetId}/usedRange(valuesOnly=true)`,
            { method: "GET" },
            env
          );
          if (usedRes.ok) {
            const usedData: any = await usedRes.json();
            const vals = Array.isArray(usedData.values) ? usedData.values : [];
            const headerOffset = (ws.headerRowIndex ?? 0) + 1;
            if (vals.length > headerOffset) {
              rowsToRead = vals.slice(headerOffset);
            }
          }
        }
      } catch {
        // fallback to recentRows
      }

      for (const row of rowsToRead) {
        const rawCell = String(row?.[projectColIdx] ?? "").trim();
        if (!rawCell || isPlaceholderProjectName(rawCell)) continue;
        // Skip total/summary rows
        if (rawCell.includes("סה\"כ") || rawCell.includes("סה״כ") || rawCell.length > 80) continue;
        const pNorm = normalizeProjectString(rawCell);
        if (seen.has(pNorm)) continue;
        seen.add(pNorm);
        results.push({ name: rawCell, source: "excel" });
      }
    }

    return results;
  } catch (err) {
    console.warn("[CustomerProjects] Excel discovery notice:", (err as any)?.message || err);
    return [];
  }
}

async function discoverListsProjectsForCustomer(
  customerName: string,
  env?: any
): Promise<CustomerProjectItem[]> {
  try {
    const entries = await fetchSharePointListEntries(env, {
      top: 120,
    });
    const results: CustomerProjectItem[] = [];
    const seen = new Set<string>();

    for (const item of entries || []) {
      const custMatch =
        normalizeProjectString(item.customerName) === normalizeProjectString(customerName) ||
        scoreBilingualCustomerMatch(item.customerName || "", customerName).score >= 0.72;
      if (!custMatch) continue;

      const wt = String(item.workType || "").toLowerCase();
      const isProjectEntry =
        wt.includes("פרויקט") || wt.includes("פרוייקט") || wt.includes("project");
      let candidate = String(item.projectName || "").trim();

      const itemTitle = String(item.title || item.rawFields?.Title || "").trim();
      if (!candidate && isProjectEntry && itemTitle) {
        const titleMatch = itemTitle.match(/^(?:פרויקט|פרוייקט)\s+(.+?)\s*-\s*.+$/);
        if (titleMatch && titleMatch[1]) {
          candidate = titleMatch[1].trim();
        }
      }

      if (!candidate || isPlaceholderProjectName(candidate)) continue;
      const pNorm = normalizeProjectString(candidate);
      if (seen.has(pNorm)) continue;
      seen.add(pNorm);
      results.push({ name: candidate, source: "lists" });
    }

    return results;
  } catch (err) {
    console.warn("[CustomerProjects] Lists discovery notice:", (err as any)?.message || err);
    return [];
  }
}

export async function listCustomerProjects(
  options: {
    customerName: string;
    fileId?: string;
    driveId?: string;
    forceRefresh?: boolean;
  },
  env?: any
): Promise<{ customerName: string; projects: CustomerProjectItem[] }> {
  const customerName = String(options.customerName || "").trim();
  if (!customerName) {
    return { customerName: "", projects: [] };
  }

  const cacheKey = `${resolveCanonicalCustomerKey(customerName)}:${options.fileId || ""}`;
  if (!options.forceRefresh) {
    const cached = projectsDiscoveryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30_000) {
      return { customerName, projects: cached.projects };
    }
  }

  const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
    Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

  const [registry, excelProjects, listsProjects] = await Promise.all([
    loadRegistry(env, Boolean(options.forceRefresh)),
    withTimeout(
      discoverExcelProjectsForCustomer(customerName, options.fileId, options.driveId, env),
      4500,
      []
    ),
    withTimeout(discoverListsProjectsForCustomer(customerName, env), 3500, []),
  ]);

  const registryProjects = getRegistryProjectsForCustomer(registry, customerName);

  const merged: CustomerProjectItem[] = [];
  const seen = new Set<string>();

  for (const item of [...registryProjects, ...excelProjects, ...listsProjects]) {
    const pNorm = normalizeProjectString(item.name);
    if (!pNorm || seen.has(pNorm)) continue;
    seen.add(pNorm);
    merged.push(item);
  }

  projectsDiscoveryCache.set(cacheKey, {
    projects: merged,
    timestamp: Date.now(),
  });

  return { customerName, projects: merged };
}

export async function createCustomerProject(
  params: {
    customerName: string;
    projectName: string;
    confirmNewProject: boolean;
    createdBy?: string;
    createdByEmail?: string;
  },
  env?: any
): Promise<{
  success: boolean;
  alreadyExists: boolean;
  project: CustomerProjectItem;
  projects: CustomerProjectItem[];
}> {
  const customerName = String(params.customerName || "").trim();
  const projectName = String(params.projectName || "").trim();

  if (!customerName) {
    throw new Error("נדרש שם לקוח כדי לפתוח פרויקט.");
  }
  if (!projectName || projectName.length < 2) {
    throw new Error("נא להזין שם פרויקט תקין (לפחות 2 תווים).");
  }
  if (isPlaceholderProjectName(projectName)) {
    throw new Error(`שם הפרויקט "${projectName}" אינו תקין. נא להזין שם פרויקט מזוהה.`);
  }
  if (params.confirmNewProject !== true) {
    throw new Error(
      `נדרש אישור מפורש לפני פתיחת פרויקט חדש: האם אתה בטוח שאתה רוצה לפתוח פרויקט חדש בשם "${projectName}" עבור ${customerName}?`
    );
  }

  const existingResult = await listCustomerProjects(
    { customerName, forceRefresh: true },
    env
  );
  const targetNorm = normalizeProjectString(projectName);
  const existingMatch = existingResult.projects.find(
    (p) => normalizeProjectString(p.name) === targetNorm
  );

  if (existingMatch) {
    return {
      success: true,
      alreadyExists: true,
      project: existingMatch,
      projects: existingResult.projects,
    };
  }

  const registry = await loadRegistry(env, true);
  const canonicalKey = resolveCanonicalCustomerKey(customerName);
  const nowIso = new Date().toISOString();

  if (!registry[canonicalKey]) {
    registry[canonicalKey] = {
      customerName,
      projects: [],
    };
  }

  registry[canonicalKey].projects.unshift({
    name: projectName,
    createdAt: nowIso,
    createdBy: params.createdBy,
    createdByEmail: params.createdByEmail,
  });

  await saveRegistry(registry, env);

  // Invalidate discovery caches for this customer
  for (const key of projectsDiscoveryCache.keys()) {
    if (key.startsWith(`${canonicalKey}:`)) {
      projectsDiscoveryCache.delete(key);
    }
  }

  const newItem: CustomerProjectItem = {
    name: projectName,
    source: "registry",
    createdAt: nowIso,
    createdBy: params.createdBy,
  };

  const refreshedProjects = [newItem, ...existingResult.projects];
  return {
    success: true,
    alreadyExists: false,
    project: newItem,
    projects: refreshedProjects,
  };
}
