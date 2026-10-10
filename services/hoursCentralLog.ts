import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { fetchGraph, resolveSharePointDrive } from "./graphHours";

export interface CentralLogRecord {
  id: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  employeeName: string;
  employeeEmail?: string;
  workType: string; // ביקור / טיקט / פרויקט
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationHours: number; // e.g. 2.5
  durationFormatted: string; // e.g. "02:30" or "2.5 שעות"
  description: string; // מה בוצע
  status: "פעיל" | "בוטל" | "נמחק"; // Active / Canceled / Deleted
  createdAt: string; // ISO string
  updatedAt?: string;
  cancelledAt?: string;
  ticketNumber?: string;
  contactPerson?: string;
  sharepointTargetFile?: string;
  sharepointTargetRow?: string;
  sharepointTargetSheet?: string;
  sharepointListItemId?: string;
  sharepointListWebUrl?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_JSON_PATH = path.join(DATA_DIR, "hours_tools_log.json");
const LOG_EXCEL_PATH = path.join(DATA_DIR, "TOOLS_LOG.xlsx");

// Persistent in-memory cache across all requests in the process
const inMemoryCentralLog: CentralLogRecord[] = [];

// Ensure directory exists if filesystem is accessible
try {
  if (typeof fs?.existsSync === "function" && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[CentralLog] Notice creating data directory:", err);
}

/**
 * Load all central log entries from local storage or memory
 */
export function loadCentralLog(): CentralLogRecord[] {
  try {
    if (typeof fs?.existsSync === "function" && fs.existsSync(LOG_JSON_PATH)) {
      const raw = fs.readFileSync(LOG_JSON_PATH, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Merge with in-memory cache
        for (const item of list) {
          if (!inMemoryCentralLog.some((m) => m.id === item.id)) {
            inMemoryCentralLog.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[CentralLog] Notice reading local log:", err);
  }
  return [...inMemoryCentralLog];
}

/**
 * Save all central log entries to local JSON, Excel workbook, and memory
 */
export function saveCentralLog(entries: CentralLogRecord[]): void {
  try {
    // Keep in-memory cache synchronized
    inMemoryCentralLog.length = 0;
    inMemoryCentralLog.push(...entries);

    if (typeof fs?.writeFileSync === "function") {
      if (typeof fs?.existsSync === "function" && !fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(LOG_JSON_PATH, JSON.stringify(entries, null, 2), "utf8");

      // Also write to Excel workbook matching Guy's requested columns
      const excelRows = entries.map((e) => ({
        "תאריך": e.date,
        "שם לקוח": e.customerName,
        "עובד": e.employeeName,
        "סוג": e.workType,
        "משעה": e.startTime || "",
        "עד שעה": e.endTime || "",
        "סיכום שעות": e.durationHours,
        "מה בוצע": e.description,
        "סטטוס": e.status,
        "מזהה תיעוד": e.id,
        "תאריך רישום": e.createdAt,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LOG");
      XLSX.writeFile(workbook, LOG_EXCEL_PATH);
    }
  } catch (err) {
    console.warn("[CentralLog] Notice saving central log:", err);
  }
}

/**
 * Append or update an entry in the Central LOG (Dual-Write)
 */
export async function recordCentralLogEntry(
  entry: Omit<CentralLogRecord, "id" | "createdAt" | "status"> & {
    id?: string;
    status?: "פעיל" | "בוטל" | "נמחק";
  },
  env?: any
): Promise<CentralLogRecord> {
  const current = loadCentralLog();
  const id = entry.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newRecord: CentralLogRecord = {
    id,
    date: entry.date,
    customerName: entry.customerName,
    employeeName: entry.employeeName,
    employeeEmail: entry.employeeEmail,
    workType: entry.workType,
    startTime: entry.startTime || "",
    endTime: entry.endTime || "",
    durationHours: entry.durationHours,
    durationFormatted: entry.durationFormatted,
    description: entry.description,
    status: entry.status || "פעיל",
    createdAt: now,
    ticketNumber: entry.ticketNumber,
    contactPerson: entry.contactPerson,
    sharepointTargetFile: entry.sharepointTargetFile,
    sharepointTargetRow: entry.sharepointTargetRow,
    sharepointTargetSheet: entry.sharepointTargetSheet,
  };

  const existingIdx = current.findIndex((item) => item.id === id);
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...newRecord, updatedAt: now };
  } else {
    current.unshift(newRecord); // newest first
  }

  saveCentralLog(current);

  // Background sync attempt to SharePoint TOOLS/LOG if available
  attemptSharePointLogSync(newRecord, env).catch((err) => {
    console.warn("[CentralLog] SharePoint background sync notice:", err?.message || err);
  });

  return newRecord;
}

/**
 * Mark an entry as canceled/deleted in the Central LOG (Undo/Delete Support)
 */
export async function deleteOrCancelCentralLogEntry(
  entryIdOrMatcher: string | { customerName?: string; date?: string; employeeName?: string; description?: string },
  env?: any
): Promise<{ success: boolean; modifiedCount: number; record?: CentralLogRecord }> {
  const current = loadCentralLog();
  const now = new Date().toISOString();
  let modifiedCount = 0;
  let lastRecord: CentralLogRecord | undefined;

  for (let i = 0; i < current.length; i++) {
    const r = current[i];
    let match = false;
    if (typeof entryIdOrMatcher === "string") {
      match = r.id === entryIdOrMatcher || (r.sharepointTargetRow && r.sharepointTargetRow.includes(entryIdOrMatcher));
    } else {
      match =
        (!entryIdOrMatcher.customerName || r.customerName === entryIdOrMatcher.customerName) &&
        (!entryIdOrMatcher.date || r.date === entryIdOrMatcher.date) &&
        (!entryIdOrMatcher.employeeName || r.employeeName === entryIdOrMatcher.employeeName);
    }

    if (match && r.status !== "בוטל") {
      current[i].status = "בוטל";
      current[i].cancelledAt = now;
      modifiedCount++;
      lastRecord = current[i];
    }
  }

  if (modifiedCount > 0) {
    saveCentralLog(current);
  }

  return { success: modifiedCount > 0, modifiedCount, record: lastRecord };
}

/**
 * Query Central LOG for fast retrieval when Guy asks questions
 */
export function queryCentralLog(filter: {
  date?: string;
  startDate?: string;
  endDate?: string;
  employee?: string;
  customer?: string;
  workType?: string;
  query?: string;
  includeCancelled?: boolean;
}): CentralLogRecord[] {
  const all = loadCentralLog();
  return all.filter((r) => {
    if (!filter.includeCancelled && r.status === "בוטל") return false;

    if (filter.date && r.date !== filter.date) return false;
    if (filter.startDate && r.date < filter.startDate) return false;
    if (filter.endDate && r.date > filter.endDate) return false;

    if (filter.employee) {
      const qEmp = filter.employee.toLowerCase().trim();
      const rEmp = (r.employeeName || "").toLowerCase();
      const rMail = (r.employeeEmail || "").toLowerCase();
      if (!rEmp.includes(qEmp) && !rMail.includes(qEmp)) return false;
    }

    if (filter.customer) {
      const qCust = filter.customer.toLowerCase().trim();
      const rCust = (r.customerName || "").toLowerCase();
      if (!rCust.includes(qCust)) return false;
    }

    if (filter.workType) {
      const qType = filter.workType.toLowerCase().trim();
      const rType = (r.workType || "").toLowerCase();
      if (!rType.includes(qType)) return false;
    }

    if (filter.query) {
      const q = filter.query.toLowerCase().trim();
      const fullText = `${r.customerName} ${r.employeeName} ${r.workType} ${r.description} ${r.date}`.toLowerCase();
      if (!fullText.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Fast daily summary for Guy's questions ("מי עבד אתמול?", "מה בוצע היום?")
 */
export function getCentralLogDailySummary(targetDateIso: string): {
  date: string;
  totalEntries: number;
  totalHours: number;
  totalFormatted: string;
  byEmployee: Array<{
    name: string;
    hours: number;
    formatted: string;
    entriesCount: number;
    customers: string[];
    details: Array<{ customer: string; type: string; hours: number; desc: string }>;
  }>;
  byCustomer: Array<{
    customer: string;
    hours: number;
    formatted: string;
    entriesCount: number;
    employees: string[];
  }>;
  entries: CentralLogRecord[];
} {
  const records = queryCentralLog({ date: targetDateIso, includeCancelled: false });

  let totalHours = 0;
  const empMap = new Map<string, { hours: number; customers: Set<string>; details: any[] }>();
  const custMap = new Map<string, { hours: number; employees: Set<string>; count: number }>();

  for (const r of records) {
    totalHours += r.durationHours;

    // Employee
    const empName = r.employeeName || "עובד";
    if (!empMap.has(empName)) {
      empMap.set(empName, { hours: 0, customers: new Set(), details: [] });
    }
    const e = empMap.get(empName)!;
    e.hours += r.durationHours;
    e.customers.add(r.customerName);
    e.details.push({
      customer: r.customerName,
      type: r.workType,
      hours: r.durationHours,
      desc: r.description,
    });

    // Customer
    const cust = r.customerName || "לקוח כללי";
    if (!custMap.has(cust)) {
      custMap.set(cust, { hours: 0, employees: new Set(), count: 0 });
    }
    const c = custMap.get(cust)!;
    c.hours += r.durationHours;
    c.employees.add(empName);
    c.count += 1;
  }

  const formatHrs = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}:${mins < 10 ? "0" + mins : mins}`;
  };

  const byEmployee = Array.from(empMap.entries()).map(([name, data]) => ({
    name,
    hours: Math.round(data.hours * 100) / 100,
    formatted: formatHrs(data.hours),
    entriesCount: data.details.length,
    customers: Array.from(data.customers),
    details: data.details,
  }));

  const byCustomer = Array.from(custMap.entries()).map(([customer, data]) => ({
    customer,
    hours: Math.round(data.hours * 100) / 100,
    formatted: formatHrs(data.hours),
    entriesCount: data.count,
    employees: Array.from(data.employees),
  }));

  return {
    date: targetDateIso,
    totalEntries: records.length,
    totalHours: Math.round(totalHours * 100) / 100,
    totalFormatted: formatHrs(totalHours),
    byEmployee,
    byCustomer,
    entries: records,
  };
}

/**
 * Resolve Tools Document Library Drive on SharePoint site https://techselectltd.sharepoint.com/sites/Customers/Tools
 */
export async function resolveToolsLibraryDrive(env?: any): Promise<{ siteId: string; driveId: string; webUrl?: string }> {
  const siteUrl = "https://graph.microsoft.com/v1.0/sites/techselectltd.sharepoint.com:/sites/Customers";
  const siteRes = await fetchGraph(siteUrl, { method: "GET" }, env);
  if (!siteRes.ok) {
    const errText = await siteRes.text().catch(() => "");
    throw new Error(`שגיאת גישה לאתר Customers ב-SharePoint (${siteRes.status}): ${errText}`);
  }
  const siteData: any = await siteRes.json();
  const siteId = siteData.id;

  // 1. Check all document libraries (drives) on the site for one named "Tools"
  const drivesRes = await fetchGraph(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, { method: "GET" }, env);
  if (drivesRes.ok) {
    const drivesData: any = await drivesRes.json();
    const drives: any[] = drivesData.value || [];
    const toolsDrive = drives.find((d) => {
      const name = String(d.name || "").toLowerCase().trim();
      const url = String(d.webUrl || "").toLowerCase();
      return name === "tools" || url.includes("/tools");
    });
    if (toolsDrive) {
      return { siteId, driveId: toolsDrive.id, webUrl: toolsDrive.webUrl };
    }
  }

  // 2. Fallback to default document library
  const defaultDriveRes = await fetchGraph(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive`, { method: "GET" }, env);
  if (defaultDriveRes.ok) {
    const defaultDriveData: any = await defaultDriveRes.json();
    return { siteId, driveId: defaultDriveData.id, webUrl: defaultDriveData.webUrl };
  }

  throw new Error("לא נמצאה ספריית Tools או ספריית מסמכים באתר Customers ב-SharePoint");
}

/**
 * Upload and sync complete Central LOG.xlsx directly to SharePoint Tools library
 * Target: https://techselectltd.sharepoint.com/sites/Customers/Tools/LOG.xlsx
 */
export async function uploadCentralLogFileToSharePoint(env?: any): Promise<{ success: boolean; webUrl?: string; message: string }> {
  const { driveId } = await resolveToolsLibraryDrive(env);
  const currentEntries = loadCentralLog();

  const excelRows = currentEntries.map((e) => ({
    "תאריך": e.date,
    "שם לקוח": e.customerName,
    "עובד": e.employeeName,
    "סוג": e.workType,
    "משעה": e.startTime || "",
    "עד שעה": e.endTime || "",
    "סיכום שעות": e.durationHours,
    "מה בוצע": e.description,
    "סטטוס": e.status,
    "מזהה תיעוד": e.id,
    "תאריך רישום": e.createdAt,
  }));

  if (excelRows.length === 0) {
    excelRows.push({
      "תאריך": new Date().toISOString().split("T")[0],
      "שם לקוח": "Tech-Select יומן שעות",
      "עובד": "מערכת",
      "סוג": "אתחול",
      "משעה": "",
      "עד שעה": "",
      "סיכום שעות": 0,
      "מה בוצע": "אתחול קובץ יומן שעות מרכזי תחת Tools",
      "סטטוס": "פעיל",
      "מזהה תיעוד": "init",
      "תאריך רישום": new Date().toISOString(),
    });
  }

  const ws = XLSX.utils.json_to_sheet(excelRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LOG");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/LOG.xlsx:/content`;
  const uploadRes = await fetchGraph(
    uploadUrl,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      body: buffer,
    },
    env
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "");
    throw new Error(`שגיאת העלאת קובץ LOG ל-SharePoint Tools (${uploadRes.status}): ${errText}`);
  }

  const uploadData: any = await uploadRes.json();
  return {
    success: true,
    webUrl: uploadData.webUrl || "https://techselectltd.sharepoint.com/sites/Customers/Tools/Forms/AllItems.aspx",
    message: `קובץ LOG.xlsx נוצר וסונכרן בהצלחה בספריית Tools ב-SharePoint!`,
  };
}

/**
 * Background attempt to sync with SharePoint Tools library LOG.xlsx
 */
async function attemptSharePointLogSync(_record: CentralLogRecord, env?: any): Promise<void> {
  try {
    await uploadCentralLogFileToSharePoint(env);
  } catch (err) {
    // Silent notice in background: will never block the user
    console.warn("[attemptSharePointLogSync] Notice:", (err as any)?.message || err);
  }
}
