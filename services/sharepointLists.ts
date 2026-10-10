/**
 * Microsoft SharePoint Lists Integration Service
 * Dual-write and synchronization service for Tech-Select hours tracking.
 *
 * Target List:
 * https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx?env=WebViewList
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
  } catch (driveErr) {
    // If resolveSharePointDrive fails, fallback to direct site URL query
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
  // Match by webUrl ending with /Lists/List or name === "List" or displayName === "List"
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
    // If still not matched, use the first list or create a synthetic fallback
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
        type: c.text ? "text" : c.number ? "number" : c.dateTime ? "dateTime" : c.choice ? "choice" : "other",
        required: Boolean(c.required),
        readOnly: Boolean(c.readOnly),
      });

      // Semantic mapping
      if (colName === "Title" || colNorm === "title" || colNorm.includes("כותרת")) {
        columnMap["title"] = colName;
      }
      if (colNorm.includes("customer") || colNorm.includes("לקוח") || colNorm.includes("שםלקוח") || colNorm.includes("חברה")) {
        columnMap["customer"] = colName;
      }
      if (colNorm.includes("date") || colNorm.includes("תאריך") || colNorm.includes("יום")) {
        columnMap["date"] = colName;
      }
      if (colNorm.includes("employee") || colNorm.includes("עובד") || colNorm.includes("טכנאי") || colNorm.includes("technician")) {
        columnMap["employee"] = colName;
      }
      if (colNorm.includes("hour") || colNorm.includes("משך") || colNorm.includes("שעות") || colNorm.includes("duration") || colNorm.includes("סהכשעות")) {
        columnMap["hours"] = colName;
      }
      if (colNorm.includes("desc") || colNorm.includes("תיאור") || colNorm.includes("פעילות") || colNorm.includes("details") || colNorm.includes("הערות") || colNorm.includes("פירוט")) {
        columnMap["description"] = colName;
      }
      if (colNorm.includes("worktype") || colNorm.includes("סוגעבודה") || colNorm.includes("סוג") || colNorm.includes("קטגוריה")) {
        columnMap["workType"] = colName;
      }
      if (colNorm.includes("start") || colNorm.includes("שעתהתחלה") || colNorm.includes("התחלה")) {
        columnMap["startTime"] = colName;
      }
      if (colNorm.includes("end") || colNorm.includes("שעתסיום") || colNorm.includes("סיום")) {
        columnMap["endTime"] = colName;
      }
      if (colNorm.includes("ticket") || colNorm.includes("קריאה") || colNorm.includes("טיקט") || colNorm.includes("מספרקריאה")) {
        columnMap["ticket"] = colName;
      }
      if (colNorm.includes("contact") || colNorm.includes("אישקשר") || colNorm.includes("טלפון")) {
        columnMap["contact"] = colName;
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
 * Format and write an entry into Microsoft Lists
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
    const { siteId, listId, columnMap, webUrl: listWebUrl } = listInfo;

    const customer = entryData.customerName || "לקוח כללי";
    const hours = Number(entryData.durationHours || 0);
    const employee = entryData.employeeName || entryData.employeeEmail || "טכנאי Tech-Select";
    const date = entryData.date || new Date().toISOString().split("T")[0];
    const desc = entryData.description || "";
    const workType = entryData.workType || "קריאות שירות";

    // Build Title: e.g. "טק סלקט - 1.5 שעות (גיא יעקובי)"
    const titleVal = `${customer} - ${hours} שעות (${employee})`;

    // Prepare fields payload
    const fields: Record<string, any> = {
      Title: titleVal,
    };

    // If customer column is mapped and distinct from Title
    if (columnMap["customer"] && columnMap["customer"] !== "Title") {
      fields[columnMap["customer"]] = customer;
    }
    // Date
    if (columnMap["date"] && columnMap["date"] !== "Title") {
      fields[columnMap["date"]] = date;
    }
    // Employee
    if (columnMap["employee"] && columnMap["employee"] !== "Title") {
      fields[columnMap["employee"]] = employee;
    }
    // Hours
    if (columnMap["hours"] && columnMap["hours"] !== "Title") {
      fields[columnMap["hours"]] = hours;
    }
    // Description
    if (columnMap["description"] && columnMap["description"] !== "Title") {
      fields[columnMap["description"]] = desc;
    }
    // WorkType
    if (columnMap["workType"] && columnMap["workType"] !== "Title") {
      fields[columnMap["workType"]] = workType;
    }
    // Start / End
    if (entryData.startTime && columnMap["startTime"]) {
      fields[columnMap["startTime"]] = entryData.startTime;
    }
    if (entryData.endTime && columnMap["endTime"]) {
      fields[columnMap["endTime"]] = entryData.endTime;
    }
    // Ticket
    if (entryData.ticketNumber && columnMap["ticket"]) {
      fields[columnMap["ticket"]] = entryData.ticketNumber;
    }
    // Contact
    if (entryData.contactPerson && columnMap["contact"]) {
      fields[columnMap["contact"]] = entryData.contactPerson;
    }

    const itemCreateUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;
    
    // Attempt 1: Full payload with mapped columns
    let res = await fetchGraph(
      itemCreateUrl,
      {
        method: "POST",
        body: JSON.stringify({ fields }),
      },
      env
    );

    // If failed due to a specific column type constraint (e.g. choice or lookup validation),
    // fallback gracefully to core Title + text payload
    if (!res.ok && res.status === 400) {
      console.warn("[SharePoint Lists] Initial write returned 400. Trying safe core fields fallback...");
      const safeFields: Record<string, any> = {
        Title: `${customer} | ${date} | ${hours} שעות | ${employee}${desc ? " | " + desc : ""}`,
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
      fieldsWritten: fields,
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
