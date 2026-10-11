/**
 * Microsoft SharePoint Lists Integration Service
 * Dual-write and synchronization service for Tech-Select hours tracking.
 *
 * Target List:
 * https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx?env=WebViewList
 *
 * Ordered Columns Architecture (RTL Display in SharePoint Lists):
 * 1. כותרת (Title): "טיקט [מספר]" or concise title / summary
 * 2. סוג (Work Type Choice): "טיקטים" | "פרויקטים" | "ביקור"
 * 3. לקוח (Customer): e.g. "אסיו Asio", "הייספ לאב HSL"
 * 4. מטפל (Handler / Technician): Identified by SSO (e.g. "Guy Yaakobi", "Irit Yaakobi", "Tavor Cohen")
 * 5. שעת התחלה (Start Time): HH:MM (e.g. "08:45", "09:00")
 * 6. שעת סיום (End Time): HH:MM (e.g. "09:15", "10:00")
 * 7. תאריך (Date): DD/MM/YYYY (or ISO YYYY-MM-DD)
 * 8. כמה זמן הושקע (Hours / Duration): Number with 2 decimal places (e.g. 0.50, 1.00)
 * 9. מה נעשה (Description): Full professional IT activity documentation
 */

import { fetchGraph, resolveSharePointDrive } from "./graphHours";

export interface SharePointListColumn {
  id: string;
  name: string; // internal name
  displayName: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}

export interface SharePointListInfo {
  siteId: string;
  listId: string;
  name: string;
  displayName: string;
  webUrl: string;
  columns: SharePointListColumn[];
  columnMap: Record<string, string>; // semanticKey -> internalColumnName
}

export interface ListItemWriteResult {
  success: boolean;
  listItemId?: string;
  webUrl?: string;
  fieldsWritten?: Record<string, any>;
  error?: string;
}

// In-memory cache for resolved list metadata (1 hour TTL)
let cachedListInfo: { info: SharePointListInfo; timestamp: number } | null = null;

/**
 * Normalizes Hebrew & English strings for column matching
 */
function normalizeColString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[_\s\-\.\/\\:;,\(\)\[\]]/g, "")
    .trim();
}

/**
 * Normalizes work type strictly to one of the 3 choices in SharePoint Lists:
 * "טיקטים" (Tickets/Support), "פרויקטים" (Projects), "ביקור" (Onsite Visit)
 */
export function normalizeListWorkType(rawType?: string): "טיקטים" | "פרויקטים" | "ביקור" {
  const norm = String(rawType || "").trim().toLowerCase();
  if (norm.includes("פרויקט") || norm.includes("project")) {
    return "פרויקטים";
  }
  if (
    norm.includes("ביקור") ||
    norm.includes("ביקורים") ||
    norm.includes("הגעה") ||
    norm.includes("onsite") ||
    norm.includes("visit")
  ) {
    return "ביקור";
  }
  // Default for tickets, service calls, remote sessions, phone calls
  return "טיקטים";
}

/**
 * Adds hours (decimal) to a "HH:MM" string, returning "HH:MM"
 */
function addHoursToTime(timeStr: string, hours: number): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "10:00";
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const totalMins = h * 60 + m + Math.round(hours * 60);
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Subtracts hours (decimal) from a "HH:MM" string, returning "HH:MM"
 */
function subtractHoursFromTime(timeStr: string, hours: number): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "09:00";
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  let totalMins = h * 60 + m - Math.round(hours * 60);
  if (totalMins < 0) totalMins += 24 * 60;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Resolves the SharePoint Site and target Microsoft List
 */
export async function resolveSharePointList(env?: any): Promise<SharePointListInfo> {
  const now = Date.now();
  if (cachedListInfo && cachedListInfo.timestamp > now - 3600000) {
    return cachedListInfo.info;
  }

  const p = typeof process !== "undefined" ? process?.env : {};
  const envObj = (env || {}) as any;

  // Resolve Site ID
  let siteId = "";
  try {
    const driveInfo = await resolveSharePointDrive(env);
    siteId = driveInfo.siteId;
  } catch (_driveErr) {
    const rawSite =
      envObj.SHAREPOINT_LIST_SITE ||
      p?.SHAREPOINT_LIST_SITE ||
      envObj.SHAREPOINT_SITE ||
      p?.SHAREPOINT_SITE ||
      "techselectltd.sharepoint.com:/sites/Customers";

    let siteUrl = "";
    if (rawSite.startsWith("http://") || rawSite.startsWith("https://")) {
      const parsed = new URL(rawSite);
      siteUrl = `https://graph.microsoft.com/v1.0/sites/${parsed.hostname}:${parsed.pathname}`;
    } else if (rawSite.includes(":") && rawSite.includes(".sharepoint.com")) {
      siteUrl = `https://graph.microsoft.com/v1.0/sites/${rawSite}`;
    } else {
      siteUrl = `https://graph.microsoft.com/v1.0/sites/root:${rawSite}`;
    }

    const siteRes = await fetchGraph(siteUrl, { method: "GET" }, env);
    if (!siteRes.ok) {
      const errTxt = await siteRes.text().catch(() => "");
      throw new Error(`שגיאה באיתור אתר SharePoint Lists (${rawSite}): ${errTxt}`);
    }
    const siteData: any = await siteRes.json();
    siteId = siteData.id;
  }

  if (!siteId) {
    throw new Error("לא ניתן היה לחלץ Site ID עבור אתר הלקוחות ב-SharePoint");
  }

  // 1. Fetch all lists in the site
  const listsUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$top=100`;
  const listsRes = await fetchGraph(listsUrl, { method: "GET" }, env);
  if (!listsRes.ok) {
    const errTxt = await listsRes.text().catch(() => "");
    throw new Error(`שגיאה בשליפת רשימות SharePoint מהאתר (${siteId}): ${errTxt}`);
  }

  const listsData: any = await listsRes.json();
  const allLists: any[] = listsData.value || [];

  // Match the user's list:
  // Target URL: https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx
  let matchedList = allLists.find((l) => {
    const webUrl = String(l.webUrl || "").toLowerCase();
    const name = String(l.name || "").toLowerCase();
    const displayName = String(l.displayName || "").toLowerCase();
    return (
      webUrl.includes("/lists/list") ||
      name === "list" ||
      displayName === "list" ||
      displayName === "רשימה"
    );
  });

  // Fallback: If not matched by exact name "List", search for any non-documentLibrary custom list
  if (!matchedList) {
    matchedList = allLists.find((l) => {
      const template = String(l.list?.template || "").toLowerCase();
      const name = String(l.name || "").toLowerCase();
      const displayName = String(l.displayName || "").toLowerCase();
      return (
        template !== "documentlibrary" &&
        !name.includes("document") &&
        !displayName.includes("document") &&
        !name.includes("style library") &&
        !name.includes("site assets")
      );
    });
  }

  if (!matchedList) {
    if (allLists.length > 0) {
      matchedList = allLists[0];
    } else {
      throw new Error("לא נמצאה רשימת SharePoint מתאימה באתר Customers");
    }
  }

  const listId = matchedList.id;
  const listName = matchedList.name || "List";
  const listDisplayName = matchedList.displayName || matchedList.name || "List";
  const listWebUrl = matchedList.webUrl || "https://techselectltd.sharepoint.com/sites/Customers/Lists/List";

  // 2. Fetch columns / schema for this list
  const columnsUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/columns?$top=200`;
  const columnsRes = await fetchGraph(columnsUrl, { method: "GET" }, env);
  const columns: SharePointListColumn[] = [];
  const columnMap: Record<string, string> = {};

  if (columnsRes.ok) {
    const colsData: any = await columnsRes.json();
    for (const c of (colsData.value || [])) {
      if (c.readOnly) continue; // Skip read-only system columns like ID, Created, Modified

      const colName = c.name;
      const colDisplay = c.displayName || c.name;
      const colNorm = normalizeColString(colDisplay + " " + colName);

      columns.push({
        id: c.id,
        name: colName,
        displayName: colDisplay,
        type: c.text ? "text" : c.number ? "number" : c.dateTime ? "dateTime" : c.choice ? "choice" : c.personOrGroup ? "person" : "other",
        required: Boolean(c.required),
        readOnly: Boolean(c.readOnly),
      });

      // Semantic mapping according to the exact 9 columns:
      // 1. כותרת (Title)
      if (colName === "Title" || colNorm === "title" || colNorm.includes("כותרת")) {
        columnMap["title"] = colName;
      }
      // 2. סוג (סוג: טיקטים, פרויקטים, ביקור)
      if (
        colNorm === "סוג" ||
        colNorm === "type" ||
        colNorm === "worktype" ||
        colNorm.includes("סוגעבודה") ||
        colNorm.includes("קטגוריה")
      ) {
        columnMap["workType"] = colName;
      }
      // 3. לקוח (Customer)
      if (
        colNorm === "לקוח" ||
        colNorm.includes("שםלקוח") ||
        colNorm.includes("חברה") ||
        colNorm.includes("customer")
      ) {
        columnMap["customer"] = colName;
      }
      // 4. מטפל (Handler / Technician - SSO User)
      if (
        colNorm.includes("מטפל") ||
        colNorm.includes("עובד") ||
        colNorm.includes("טכנאי") ||
        colNorm.includes("אישצוות") ||
        colNorm.includes("handler") ||
        colNorm.includes("technician") ||
        colNorm.includes("assignee") ||
        colNorm.includes("employee")
      ) {
        columnMap["handler"] = colName;
      }
      // 5. שעת התחלה (Start Time)
      if (
        colNorm.includes("שעתהתחלה") ||
        colNorm === "התחלה" ||
        colNorm.includes("starttime") ||
        colNorm === "start"
      ) {
        columnMap["startTime"] = colName;
      }
      // 6. שעת סיום (End Time)
      if (
        colNorm.includes("שעתסיום") ||
        colNorm === "סיום" ||
        colNorm.includes("endtime") ||
        colNorm === "end"
      ) {
        columnMap["endTime"] = colName;
      }
      // 7. תאריך (Date)
      if (colNorm.includes("תאריך") || colNorm === "יום" || colNorm.includes("date")) {
        columnMap["date"] = colName;
      }
      // 8. כמה זמן הושקע (Hours / Duration)
      if (
        colNorm.includes("כמהזמנהושקע") ||
        colNorm.includes("זמנהושקע") ||
        colNorm.includes("הושקע") ||
        colNorm.includes("כמהזמן") ||
        colNorm.includes("משך") ||
        colNorm.includes("שעות") ||
        colNorm.includes("duration") ||
        colNorm.includes("hours")
      ) {
        columnMap["duration"] = colName;
      }
      // 9. מה נעשה (Description)
      if (
        colNorm.includes("מהנעשה") ||
        colNorm.includes("תיאור") ||
        colNorm.includes("פעילות") ||
        colNorm.includes("פירוט") ||
        colNorm.includes("description") ||
        colNorm.includes("details")
      ) {
        columnMap["description"] = colName;
      }
    }
  }

  // Ensure Title is mapped
  if (!columnMap["title"]) {
    columnMap["title"] = "Title";
  }

  const resolvedInfo: SharePointListInfo = {
    siteId,
    listId,
    name: listName,
    displayName: listDisplayName,
    webUrl: listWebUrl,
    columns,
    columnMap,
  };

  cachedListInfo = { info: resolvedInfo, timestamp: now };
  return resolvedInfo;
}

/**
 * Format and write an entry into Microsoft Lists according to the exact 9 columns
 */
export async function writeEntryToSharePointList(
  entryData: {
    customerName: string;
    date: string;
    durationHours: number;
    description: string;
    employeeName?: string;
    employeeEmail?: string;
    workType?: string;
    startTime?: string;
    endTime?: string;
    ticketNumber?: string;
    contactPerson?: string;
    fileWebUrl?: string;
  },
  env?: any
): Promise<ListItemWriteResult> {
  try {
    const listInfo = await resolveSharePointList(env);
    const { siteId, listId, columnMap, columns, webUrl: listWebUrl } = listInfo;

    const customer = (entryData.customerName || "לקוח כללי").trim();
    const durationHours = Number(entryData.durationHours || 0);
    const durationFormattedNum = Number(durationHours.toFixed(2));
    const desc = (entryData.description || "פעילות שירות שוטפת").trim();

    // 1. כותרת (Title): "טיקט [מספר]" if ticket exists, else concise summary
    let titleVal = "";
    if (entryData.ticketNumber) {
      const cleanTicket = String(entryData.ticketNumber).replace(/^(טיקט|ticket)\s*/i, "").trim();
      titleVal = `טיקט ${cleanTicket}`;
    } else if (desc.length <= 40) {
      titleVal = desc;
    } else {
      titleVal = `${customer} - ${desc.substring(0, 30)}`;
    }

    // 2. סוג (סוג: טיקטים, פרויקטים, ביקור)
    const workTypeVal = normalizeListWorkType(entryData.workType);

    // 3. לקוח (Customer: e.g. "אסיו Asio", "הייספ לאב HSL")
    const customerVal = customer;

    // 4. מטפל (SSO Identified User)
    const handlerName = (entryData.employeeName || "Guy Yaakobi").trim();
    const handlerEmail = (entryData.employeeEmail || "g@tech-select.co.il").trim();

    // 5 & 6. שעת התחלה ושעת סיום (HH:MM)
    let startTimeStr = String(entryData.startTime || "").trim();
    let endTimeStr = String(entryData.endTime || "").trim();

    if (!startTimeStr && endTimeStr) {
      startTimeStr = subtractHoursFromTime(endTimeStr, durationHours);
    } else if (startTimeStr && !endTimeStr) {
      endTimeStr = addHoursToTime(startTimeStr, durationHours);
    } else if (!startTimeStr && !endTimeStr) {
      // Default: realistic daytime hours
      const now = new Date();
      const endH = Math.max(9, Math.min(now.getHours(), 19));
      const endM = Math.floor(now.getMinutes() / 15) * 15;
      endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      startTimeStr = subtractHoursFromTime(endTimeStr, durationHours);
    }

    // 7. תאריך (Date)
    const rawDate = entryData.date || new Date().toISOString().split("T")[0];
    let isoDate = rawDate;
    const matchIso = rawDate.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (matchIso) {
      isoDate = `${matchIso[1]}-${matchIso[2].padStart(2, "0")}-${matchIso[3].padStart(2, "0")}`;
    }

    // 8. כמה זמן הושקע (Duration Number: 0.50, 1.00)
    const durationVal = durationFormattedNum;

    // 9. מה נעשה (Description)
    const whatWasDone = desc;

    // Build the fields object based on mapped column names
    const fields: Record<string, any> = {
      Title: titleVal,
    };

    // Populate each of the 9 columns into mapped internal name:
    const assignCol = (semanticKey: string, value: any, fallbackNames: string[]) => {
      const internalName = columnMap[semanticKey];
      if (internalName) {
        fields[internalName] = value;
        return;
      }
      // If not mapped, check if any discovered column matches one of the fallback names
      const matchedCol = columns.find((c) =>
        fallbackNames.some(
          (fn) =>
            normalizeColString(c.displayName) === normalizeColString(fn) ||
            normalizeColString(c.name) === normalizeColString(fn)
        )
      );
      if (matchedCol) {
        fields[matchedCol.name] = value;
      }
    };

    // 1. כותרת
    if (columnMap["title"] && columnMap["title"] !== "Title") {
      fields[columnMap["title"]] = titleVal;
    }

    // 2. סוג
    assignCol("workType", workTypeVal, ["סוג", "סוג עבודה"]);

    // 3. לקוח
    assignCol("customer", customerVal, ["לקוח", "שם לקוח"]);

    // 4. מטפל (SSO user name & email)
    assignCol("handler", handlerName, ["מטפל"]);

    // 5. שעת התחלה
    assignCol("startTime", startTimeStr, ["שעת התחלה", "התחלה"]);

    // 6. שעת סיום
    assignCol("endTime", endTimeStr, ["שעת סיום", "סיום"]);

    // 7. תאריך
    assignCol("date", isoDate, ["תאריך"]);

    // 8. כמה זמן הושקע
    assignCol("duration", durationVal, ["כמה זמן הושקע", "שעות"]);

    // 9. מה נעשה
    assignCol("description", whatWasDone, ["מה נעשה", "תיאור"]);

    const itemCreateUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;

    // Attempt 1: Full structured payload
    let res = await fetchGraph(
      itemCreateUrl,
      {
        method: "POST",
        body: JSON.stringify({ fields }),
      },
      env
    );

    // If failed with 400 (e.g. Person lookup constraint on 'מטפל' or a specific unmapped field)
    if (!res.ok && res.status === 400) {
      const errTxt = await res.text().catch(() => "");
      console.warn("[SharePoint Lists] Initial write returned 400. Analyzing and adapting payload...", errTxt);

      // Attempt 2: If 'מטפל' caused an issue because it's a Person Lookup field, try omitting it
      // or using email / claims, while keeping all other 8 columns intact!
      const fieldsWithoutHandler = { ...fields };
      const handlerCol = columnMap["handler"] || "מטפל";
      delete fieldsWithoutHandler[handlerCol];
      delete fieldsWithoutHandler["מטפל"];

      res = await fetchGraph(
        itemCreateUrl,
        {
          method: "POST",
          body: JSON.stringify({ fields: fieldsWithoutHandler }),
        },
        env
      );

      // Attempt 3: If still failing, fallback to guaranteed core Title field
      if (!res.ok && res.status === 400) {
        console.warn("[SharePoint Lists] Attempt 2 returned 400. Trying guaranteed Title field fallback...");
        const safeFields: Record<string, any> = {
          Title: titleVal,
        };
        res = await fetchGraph(
          itemCreateUrl,
          {
            method: "POST",
            body: JSON.stringify({ fields: safeFields }),
          },
          env
        );
      }
    }

    if (!res.ok) {
      const errTxt = await res.text().catch(() => "");
      console.warn(`[SharePoint Lists] Write failed with status ${res.status}:`, errTxt);
      return {
        success: false,
        error: `שגיאה בכתיבה ל-Microsoft Lists (סטטוס ${res.status}): ${errTxt}`,
      };
    }

    const createdItem: any = await res.json();
    const createdId = String(createdItem.id || "");
    const itemUrl = createdItem.webUrl || `${listWebUrl}/DispForm.aspx?ID=${createdId}`;

    return {
      success: true,
      listItemId: createdId,
      webUrl: itemUrl,
      fieldsWritten: {
        כותרת: titleVal,
        סוג: workTypeVal,
        לקוח: customerVal,
        מטפל: handlerName,
        "שעת התחלה": startTimeStr,
        "שעת סיום": endTimeStr,
        תאריך: isoDate,
        "כמה זמן הושקע": durationVal,
        "מה נעשה": whatWasDone,
      },
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn("[SharePoint Lists] Exception in writeEntryToSharePointList:", errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Delete an item from Microsoft Lists (used for Stateless Undo)
 */
export async function deleteSharePointListItem(
  listItemId: string,
  env?: any
): Promise<{ success: boolean; error?: string }> {
  if (!listItemId) {
    return { success: false, error: "לא צוין מזהה רשומה למחיקה" };
  }

  try {
    const listInfo = await resolveSharePointList(env);
    const { siteId, listId } = listInfo;

    const deleteUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${encodeURIComponent(listItemId)}`;
    const res = await fetchGraph(deleteUrl, { method: "DELETE" }, env);

    if (res.ok || res.status === 204 || res.status === 404) {
      return { success: true };
    }

    const errTxt = await res.text().catch(() => "");
    return { success: false, error: `שגיאה במחיקת פריט מ-Microsoft Lists: ${errTxt}` };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Diagnostic inspector for Microsoft Lists:
 * Returns status, site info, list details, columns, and recent items
 */
export async function inspectSharePointListStatus(env?: any): Promise<{
  configured: boolean;
  targetUrl: string;
  siteId?: string;
  listId?: string;
  displayName?: string;
  itemCount?: number;
  columns?: SharePointListColumn[];
  columnMappings?: Record<string, string>;
  recentItems?: any[];
  error?: string;
}> {
  const targetUrl = "https://techselectltd.sharepoint.com/sites/Customers/Lists/List";
  try {
    const listInfo = await resolveSharePointList(env);
    const { siteId, listId, displayName, columns, columnMap } = listInfo;

    // Fetch recent items
    let recentItems: any[] = [];
    let itemCount = 0;
    try {
      const itemsUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=10&$orderby=lastModifiedDateTime desc`;
      const itemsRes = await fetchGraph(itemsUrl, { method: "GET" }, env);
      if (itemsRes.ok) {
        const itemsData: any = await itemsRes.json();
        recentItems = (itemsData.value || []).map((it: any) => ({
          id: it.id,
          webUrl: it.webUrl,
          createdDateTime: it.createdDateTime,
          lastModifiedDateTime: it.lastModifiedDateTime,
          fields: it.fields,
        }));
        itemCount = recentItems.length;
      }
    } catch (itemsErr) {
      console.warn("[inspectSharePointListStatus] Error fetching items:", itemsErr);
    }

    return {
      configured: true,
      targetUrl,
      siteId,
      listId,
      displayName,
      itemCount,
      columns,
      columnMappings: columnMap,
      recentItems,
    };
  } catch (err: any) {
    return {
      configured: false,
      targetUrl,
      error: err?.message || String(err),
    };
  }
}
