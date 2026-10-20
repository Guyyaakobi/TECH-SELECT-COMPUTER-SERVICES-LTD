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

import { fetchGraph, resolveSharePointDrive, BILINGUAL_CUSTOMER_DICTIONARY } from "./graphHours";
import {
  scoreBilingualCustomerMatch,
  expandBilingualCustomerQueries,
} from "./bilingualCustomerMatcher";
import { queryCentralLog } from "./hoursCentralLog";

export interface SharePointListColumn {
  id: string;
  name: string; // internal name
  displayName: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  choice?: {
    choices?: string[];
    allowTextEntry?: boolean;
    allowFillIn?: boolean;
    allowMultipleValues?: boolean;
    displayAs?: string;
  };
  lookup?: {
    listId?: string;
    columnName?: string;
    allowMultipleValues?: boolean;
  };
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
 * Decodes SharePoint hex-encoded column names (e.g. "_x05e2__x05d5__x05d1__x05d3_" -> "עובד")
 */
export function decodeSharePointColName(name: string): string {
  if (!name) return "";
  return name.replace(/_x([0-9a-fA-F]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Normalizes Hebrew & English strings for column & choice matching
 * Strips SharePoint hex encodings, punctuation, whitespace, and invisible RTL/LTR bidi marks
 */
function normalizeColString(str: string): string {
  const decoded = decodeSharePointColName(str || "");
  return decoded
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00A0'"״׳]/g, "")
    .toLowerCase()
    .replace(/[_\s\-\.\/\\:;,\(\)\[\]]/g, "")
    .trim();
}

/**
 * Normalizes work type strictly to one of the choices in SharePoint Lists:
 * "ביקור באתר" (Onsite Visit), "טיקטים" (Tickets/Support), "פרויקטים" (Projects)
 */
export function normalizeListWorkType(rawType?: string): "ביקור באתר" | "פרויקטים" | "טיקטים" {
  const norm = String(rawType || "").trim().toLowerCase();
  if (norm.includes("פרויקט") || norm.includes("project") || norm.includes("הקמ") || norm.includes("מיגרצי")) {
    return "פרויקטים";
  }
  if (
    norm.includes("ביקור") ||
    norm.includes("ביקורים") ||
    norm.includes("הגעה") ||
    norm.includes("באתר") ||
    norm.includes("onsite") ||
    norm.includes("visit")
  ) {
    return "ביקור באתר";
  }
  // Default for tickets, service calls, remote sessions, phone calls
  return "טיקטים";
}

/**
 * Bilingual employee dictionary and name variations for Microsoft Lists employee columns
 */
export const BILINGUAL_EMPLOYEE_DICTIONARY: Record<string, string[]> = {
  "גיא יעקובי": [
    "guy yaakobi",
    "guy",
    "גיא",
    "גיא יעקבי",
    "גיא יעקובי",
    "g@tech-select.co.il",
    "guy@tech-select.co.il",
    "guyyaakobi@gmail.com",
    "guy@techselectltd.onmicrosoft.com",
    "guyy",
  ],
  "ניב בורו": [
    "niv boro",
    "niv",
    "ניב",
    "ניב בורו",
    "ניבבורו",
    "niv@tech-select.co.il",
    "niv.b@tech-select.co.il",
    "nivb@tech-select.co.il",
    "niv-boro",
  ],
  "תבור כהן": [
    "tavor cohen",
    "tavor",
    "תבור",
    "תבור כהן",
    "tavor@tech-select.co.il",
    "tavorc@tech-select.co.il",
  ],
  "אירית יעקובי": [
    "irit yaakobi",
    "irit",
    "אירית",
    "אירית יעקבי",
    "אירית יעקובי",
    "irit@tech-select.co.il",
  ],
  "רועי": [
    "roei",
    "roy",
    "רועי",
    "רועי כהן",
    "roy@tech-select.co.il",
    "roei@tech-select.co.il",
  ],
  "יוסף": [
    "יוסף",
    "יוסף איאסה",
    "איאסה",
    "יוסי",
    "יוסי כהן",
    "yosef",
    "yosef aiasa",
    "yosef ayasa",
    "yosef a",
    "yosefa",
    "aiasa",
    "ayasa",
    "yossi",
    "yosi",
    "joseph",
    "yosef@tech-select.co.il",
    "yosefa@tech-select.co.il",
    "yosef.a@tech-select.co.il",
    "yossi@tech-select.co.il",
    "yosi@tech-select.co.il",
    "yosef@techselectltd.onmicrosoft.com",
  ],
  "ודים": [
    "vadim",
    "vadim gavrilov",
    "ואדים",
    "ודים",
    "ודים גברילוב",
    "גברילוב",
    "vadim@tech-select.co.il",
    "vadimg@tech-select.co.il",
  ],
  "עומר": [
    "omer",
    "עומר",
    "omer@tech-select.co.il",
  ],
  "אולג": [
    "oleg",
    "אולג",
    "oleg@tech-select.co.il",
  ],
  "אריאל": [
    "ariel",
    "ariel mori",
    "אריאל",
    "אריאל מורי",
    "מורי",
    "ariel@tech-select.co.il",
    "arielm@tech-select.co.il",
  ],
  "אוריאל": [
    "uriel",
    "uriel fahima",
    "uriel pahima",
    "אוריאל",
    "אוריאל פחימה",
    "פחימה",
    "uriel@tech-select.co.il",
    "urielf@tech-select.co.il",
  ],
  "ולד": [
    "vlad",
    "ולד",
    "ולאד",
    "vlad@tech-select.co.il",
  ],
  "אמיר": [
    "amir",
    "amir ben arouya",
    "amir ben aroya",
    "אמיר",
    "אמיר בן ארויה",
    "בן ארויה",
    "amir@tech-select.co.il",
    "amirb@tech-select.co.il",
  ],
  "שי": [
    "shai",
    "שי",
    "shaia",
    "ShaiA@tech-select.co.il",
    "shai@tech-select.co.il",
  ],
  "אירנה": [
    "irena",
    "irina",
    "אירנה",
    "אירינה",
    "irena@tech-select.co.il",
    "irina@tech-select.co.il",
  ],
};

export function resolveEffectiveName(name?: string, email?: string): string {
  const cleanName = (name || "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00A0]/g, "")
    .trim();
  const cleanEmail = (email || "").toLowerCase().trim();
  const isGenericName =
    !cleanName ||
    cleanName.includes("@") ||
    cleanName === "משתמש" ||
    cleanName === "עובד" ||
    cleanName === "עובד מערכת" ||
    cleanName.toLowerCase() === "user";

  // 1. Try matching cleanName against BILINGUAL_EMPLOYEE_DICTIONARY (exact, normalized, or first word)
  if (!isGenericName) {
    const nLower = cleanName.toLowerCase();
    const nNorm = normalizeColString(cleanName);
    const nFirstWordNorm = normalizeColString(cleanName.split(/\s+/)[0]);

    for (const [canonicalName, aliases] of Object.entries(BILINGUAL_EMPLOYEE_DICTIONARY)) {
      const canNorm = normalizeColString(canonicalName);
      const canFwNorm = normalizeColString(canonicalName.split(/\s+/)[0]);
      if (
        canonicalName.toLowerCase() === nLower ||
        canNorm === nNorm ||
        (nFirstWordNorm.length >= 2 && canFwNorm === nFirstWordNorm) ||
        aliases.some((a) => {
          if (a.includes("@")) return false;
          const aLower = a.toLowerCase().trim();
          const aNorm = normalizeColString(a);
          const aFwNorm = normalizeColString(a.trim().split(/\s+/)[0]);
          return (
            aLower === nLower ||
            aNorm === nNorm ||
            (nFirstWordNorm.length >= 2 && aFwNorm === nFirstWordNorm)
          );
        })
      ) {
        return canonicalName;
      }
    }

    // If cleanName is already an explicit Hebrew name (e.g. a specific employee not in dictionary),
    // never let a fallback email (like g@tech-select.co.il) overwrite it with a different person!
    if (/[\u0590-\u05FF]/.test(cleanName)) {
      return cleanName;
    }
  }

  // 2. Try matching cleanEmail or emailPrefix against BILINGUAL_EMPLOYEE_DICTIONARY
  if (cleanEmail) {
    const emailPrefix = cleanEmail.split("@")[0].toLowerCase().trim();
    for (const [canonicalName, aliases] of Object.entries(BILINGUAL_EMPLOYEE_DICTIONARY)) {
      if (
        aliases.some((a) => {
          const aLower = a.toLowerCase().trim();
          return cleanEmail === aLower || emailPrefix === aLower;
        })
      ) {
        return canonicalName;
      }
    }
  }

  if (!isGenericName) {
    return cleanName;
  }

  if (cleanEmail) {
    const prefix = cleanEmail.split("@")[0].toLowerCase().trim().replace(/[._-]/g, " ");
    if (prefix) return prefix;
  }

  return cleanName || "עובד";
}

export function doesEmployeeMatchQuery(
  entryName: string,
  entryEmail: string,
  queryName?: string,
  queryEmail?: string
): boolean {
  const qName = (queryName || "").trim();
  const qEmail = (queryEmail || "").trim().toLowerCase();
  if (!qName && !qEmail) return true;

  const eName = (entryName || "").trim();
  const eEmail = (entryEmail || "").trim().toLowerCase();

  // 1. Direct email match
  if (qEmail && eEmail && (eEmail === qEmail || eEmail.includes(qEmail) || qEmail.includes(eEmail))) {
    return true;
  }

  // 2. Canonical name resolution via BILINGUAL_EMPLOYEE_DICTIONARY
  const canonicalQuery = resolveEffectiveName(qName, qEmail).toLowerCase();
  const canonicalEntry = resolveEffectiveName(eName, eEmail).toLowerCase();
  if (
    canonicalQuery &&
    canonicalEntry &&
    canonicalQuery !== "עובד" &&
    canonicalEntry !== "עובד" &&
    (canonicalQuery === canonicalEntry ||
      canonicalEntry.includes(canonicalQuery) ||
      canonicalQuery.includes(canonicalEntry))
  ) {
    return true;
  }

  // 3. Check all aliases in BILINGUAL_EMPLOYEE_DICTIONARY
  for (const [canon, aliases] of Object.entries(BILINGUAL_EMPLOYEE_DICTIONARY)) {
    const allTerms = [canon.toLowerCase(), ...aliases.map((a) => a.toLowerCase().trim())];
    const queryMatchesGroup =
      (qName && allTerms.some((t) => t === qName.toLowerCase() || (qName.length >= 2 && t.includes(qName.toLowerCase())))) ||
      (qEmail && allTerms.some((t) => t === qEmail || t === qEmail.split("@")[0]));
    const entryMatchesGroup =
      (eName && allTerms.some((t) => t === eName.toLowerCase() || (eName.length >= 2 && eName.toLowerCase().includes(t)))) ||
      (eEmail && allTerms.some((t) => t === eEmail || t === eEmail.split("@")[0]));

    if (queryMatchesGroup && entryMatchesGroup) {
      return true;
    }
  }

  // 4. Direct substring match on name or email prefix
  if (qName && eName) {
    const qLower = qName.toLowerCase();
    const eLower = eName.toLowerCase();
    if (eLower.includes(qLower) || qLower.includes(eLower)) return true;
  }
  if (qEmail && eName) {
    const prefix = qEmail.split("@")[0].toLowerCase();
    if (prefix.length >= 2 && eName.toLowerCase().includes(prefix)) return true;
  }

  return false;
}

export const KNOWN_TEAM_MEMBERS: Array<{ name: string; email: string; shortName: string }> = [
  { name: "גיא יעקובי", email: "g@tech-select.co.il", shortName: "גיא" },
  { name: "ודים", email: "vadim@tech-select.co.il", shortName: "ודים" },
  { name: "ניב בורו", email: "niv@tech-select.co.il", shortName: "ניב" },
  { name: "תבור כהן", email: "tavor@tech-select.co.il", shortName: "תבור" },
  { name: "אירית יעקובי", email: "irit@tech-select.co.il", shortName: "אירית" },
  { name: "רועי", email: "roy@tech-select.co.il", shortName: "רועי" },
  { name: "יוסף", email: "yosef@tech-select.co.il", shortName: "יוסף" },
  { name: "עומר", email: "omer@tech-select.co.il", shortName: "עומר" },
  { name: "אולג", email: "oleg@tech-select.co.il", shortName: "אולג" },
  { name: "אריאל", email: "ariel@tech-select.co.il", shortName: "אריאל" },
  { name: "אוריאל", email: "uriel@tech-select.co.il", shortName: "אוריאל" },
  { name: "ולד", email: "vlad@tech-select.co.il", shortName: "ולד" },
  { name: "אמיר", email: "amir@tech-select.co.il", shortName: "אמיר" },
  { name: "שי", email: "ShaiA@tech-select.co.il", shortName: "שי" },
  { name: "אירנה", email: "irina@tech-select.co.il", shortName: "אירנה" },
];

export function resolveEmployeeEmail(name?: string, fallbackEmail?: string): string {
  if (!name) return fallbackEmail || "g@tech-select.co.il";
  const cleanName = name.trim().toLowerCase();
  const cleanNorm = normalizeColString(cleanName);
  const firstWordNorm = normalizeColString(cleanName.split(/\s+/)[0]);

  for (const [canonicalName, aliases] of Object.entries(BILINGUAL_EMPLOYEE_DICTIONARY)) {
    const canNorm = normalizeColString(canonicalName);
    const canFwNorm = normalizeColString(canonicalName.split(/\s+/)[0]);
    const isMatch =
      cleanName === canonicalName.toLowerCase() ||
      cleanNorm === canNorm ||
      (firstWordNorm.length >= 2 && firstWordNorm === canFwNorm) ||
      aliases.some((a) => {
        const aLower = a.toLowerCase().trim();
        const aNorm = normalizeColString(a);
        return (
          cleanName === aLower ||
          cleanNorm === aNorm ||
          (!aLower.includes("@") && (cleanName.includes(aLower) || aLower.includes(cleanName)))
        );
      });
    if (isMatch) {
      const foundMail = aliases.find((a) => a.includes("@"));
      if (foundMail) return foundMail;
    }
  }
  return fallbackEmail || "g@tech-select.co.il";
}

/**
 * Robust choice matching against Microsoft Lists Choice column "עובד":
 * Dynamically resolves the creator's display name to the exact choice value in the list (e.g. "ניב", "גיא", "ודים", "יוסף").
 * NEVER falls back to hardcoded choices[0] or wrong employees!
 */
export function matchEmployeeNameToChoice(
  handlerUserDisplay: string,
  handlerEmail: string,
  choices: string[]
): string | undefined {
  if (!choices || choices.length === 0) return undefined;

  const cleanDisplay = (handlerUserDisplay || "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00A0]/g, "")
    .trim();
  const cleanEmail = (handlerEmail || "").trim().toLowerCase();
  const emailPrefix = cleanEmail.split("@")[0].toLowerCase().trim();

  // 1. Direct exact match (case-insensitive & trimmed)
  if (cleanDisplay) {
    const exactMatch = choices.find((ch) => ch.trim().toLowerCase() === cleanDisplay.toLowerCase());
    if (exactMatch) return exactMatch;
  }

  // 2. Direct normalized match (strips invisible RTL/LTR marks, accents, whitespace, special chars)
  const dispNorm = normalizeColString(cleanDisplay);
  if (dispNorm) {
    const normMatch = choices.find((ch) => normalizeColString(ch) === dispNorm);
    if (normMatch) return normMatch;
  }

  // 3. First name / single word match (Hebrew or English directly)
  if (cleanDisplay) {
    const firstWordDisplay = cleanDisplay.split(/\s+/)[0].trim();
    if (firstWordDisplay.length >= 2) {
      const fwNorm = normalizeColString(firstWordDisplay);
      const fwMatch = choices.find((ch) => {
        const chNorm = normalizeColString(ch);
        const chFirstWord = ch.trim().split(/\s+/)[0].trim();
        const chFwNorm = normalizeColString(chFirstWord);
        return chNorm === fwNorm || chFwNorm === fwNorm;
      });
      if (fwMatch) return fwMatch;
    }
  }

  // 4. Match via BILINGUAL_EMPLOYEE_DICTIONARY
  let matchedCanonical: string | undefined;
  let matchedAliases: string[] = [];

  for (const [canonicalName, aliases] of Object.entries(BILINGUAL_EMPLOYEE_DICTIONARY)) {
    const canNorm = normalizeColString(canonicalName);
    const canFirstWordNorm = normalizeColString(canonicalName.split(/\s+/)[0]);
    const dispFirstWordNorm = dispNorm ? normalizeColString(cleanDisplay.split(/\s+/)[0]) : "";

    const isMatch =
      dispNorm === canNorm ||
      dispNorm === canFirstWordNorm ||
      (dispFirstWordNorm.length >= 2 && dispFirstWordNorm === canFirstWordNorm) ||
      cleanDisplay.toLowerCase() === canonicalName.toLowerCase() ||
      cleanDisplay.toLowerCase().startsWith(canonicalName.toLowerCase() + " ") ||
      aliases.some((a) => {
        const aLower = a.toLowerCase().trim();
        const aNorm = normalizeColString(a);
        const aFwNorm = !aLower.includes("@") ? normalizeColString(aLower.split(/\s+/)[0]) : "";
        return (
          dispNorm === aNorm ||
          (dispFirstWordNorm.length >= 2 && aFwNorm.length >= 2 && dispFirstWordNorm === aFwNorm) ||
          cleanDisplay.toLowerCase() === aLower ||
          cleanDisplay.toLowerCase().startsWith(aLower + " ") ||
          cleanDisplay.toLowerCase().split(/\s+/)[0] === aLower ||
          (cleanEmail && cleanEmail === aLower) ||
          (emailPrefix && emailPrefix === aLower)
        );
      });

    if (isMatch) {
      matchedCanonical = canonicalName;
      matchedAliases = aliases;
      break;
    }
  }

  if (matchedCanonical) {
    const canNorm = normalizeColString(matchedCanonical);
    const canFwNorm = normalizeColString(matchedCanonical.split(/\s+/)[0]);

    // Check which choice in choices belongs to this identified employee
    const choiceMatch = choices.find((ch) => {
      const chNorm = normalizeColString(ch);
      const chFwNorm = normalizeColString(ch.trim().split(/\s+/)[0]);
      if (!chNorm) return false;

      if (chNorm === canNorm || chFwNorm === canFwNorm || chNorm === canFwNorm || chFwNorm === canNorm) {
        return true;
      }

      return matchedAliases.some((a) => {
        if (a.includes("@")) {
          const prefNorm = normalizeColString(a.split("@")[0]);
          return chNorm === prefNorm;
        }
        const aNorm = normalizeColString(a);
        const aFwNorm = normalizeColString(a.trim().split(/\s+/)[0]);
        return (
          chNorm === aNorm ||
          chFwNorm === aNorm ||
          (aFwNorm.length >= 2 && (chNorm === aFwNorm || chFwNorm === aFwNorm)) ||
          (aNorm.length >= 2 && chNorm.length >= 2 && (chNorm.includes(aNorm) || aNorm.includes(chNorm)))
        );
      });
    });

    if (choiceMatch) return choiceMatch;
  }

  // 5. Email prefix match against choices
  if (emailPrefix && emailPrefix.length >= 2) {
    const prefNorm = normalizeColString(emailPrefix);
    const prefMatch = choices.find((ch) => {
      const chNorm = normalizeColString(ch);
      return chNorm === prefNorm;
    });
    if (prefMatch) return prefMatch;
  }

  // 6. Substring match (min 2 chars)
  if (dispNorm && dispNorm.length >= 2) {
    const subMatch = choices.find((ch) => {
      const chNorm = normalizeColString(ch);
      return (chNorm.length >= 2 && dispNorm.includes(chNorm)) || (dispNorm.length >= 2 && chNorm.includes(dispNorm));
    });
    if (subMatch) return subMatch;
  }

  return undefined;
}

const siteUserLookupCache = new Map<string, number>();

/**
 * Resolves SharePoint Site User Lookup ID for Person / Group columns:
 * Checks SharePoint siteUsers for the creator's SSO email / UPN, and checks target list historical items.
 */
export async function resolveSiteUserLookupId(
  siteId: string,
  email?: string,
  name?: string,
  env?: any,
  userOid?: string,
  userUpn?: string,
  listId?: string
): Promise<number | null> {
  const cleanEmail = (email || userUpn || "").toLowerCase().trim();
  const cacheKey = `${siteId}:${listId || "list"}:${cleanEmail || name || "default"}`;
  if (siteUserLookupCache.has(cacheKey)) {
    return siteUserLookupCache.get(cacheKey)!;
  }

  // 1. Resolve site user by creator's SSO email from /sites/{siteId}/siteUsers
  if (cleanEmail) {
    try {
      const siteUsersUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/siteUsers?$top=100`;
      const res = await fetchGraph(siteUsersUrl, { method: "GET" }, env);
      if (res.ok) {
        const data: any = await res.json();
        const users = data.value || [];
        for (const u of users) {
          const uMail = (u.email || u.mail || "").toLowerCase().trim();
          const uUpn = (u.userPrincipalName || "").toLowerCase().trim();
          const uLogin = (u.loginName || "").toLowerCase().trim();
          if (
            uMail === cleanEmail ||
            uUpn === cleanEmail ||
            uLogin.includes(cleanEmail) ||
            (uMail && cleanEmail.includes(uMail))
          ) {
            const uid = Number(u.id);
            if (uid > 0) {
              console.log(`[resolveSiteUserLookupId] Found verified site user LookupId ${uid} for SSO email "${cleanEmail}"`);
              siteUserLookupCache.set(cacheKey, uid);
              return uid;
            }
          }
        }
      }
    } catch (uErr) {
      console.warn("[resolveSiteUserLookupId] Notice reading siteUsers:", uErr);
    }
  }

  // 2. Inspect existing items in target list to extract AuthorLookupId or existing user LookupId
  if (listId) {
    try {
      const itemsUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=25&$orderby=lastModifiedDateTime desc`;
      const itemsRes = await fetchGraph(itemsUrl, { method: "GET" }, env);
      if (itemsRes.ok) {
        const itemsData: any = await itemsRes.json();
        for (const it of (itemsData.value || [])) {
          const f = it.fields || {};
          // Check specifically for user/handler column lookup ID first
          for (const [k, v] of Object.entries(f)) {
            if (
              (k.includes("05de__x05e9") || k.includes("LookupId") || k === "AuthorLookupId" || k === "EditorLookupId") &&
              typeof v === "number" &&
              v > 0
            ) {
              console.log(`[resolveSiteUserLookupId] Found verified site user LookupId ${v} from item field "${k}"`);
              siteUserLookupCache.set(cacheKey, v);
              return v;
            }
          }
        }
      }
    } catch (itErr) {
      console.warn("[resolveSiteUserLookupId] Notice reading existing list items:", itErr);
    }
  }

  return null;
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
  let bestWorkTypeScore = 0;
  let bestHandlerScore = 0;

  if (columnsRes.ok) {
    const colsData: any = await columnsRes.json();
    for (const c of (colsData.value || [])) {
      if (c.readOnly) continue; // Skip read-only system columns like ID, Created, Modified

      const colName = c.name;
      // Skip SharePoint system columns that should never be mapped to user data
      if (/^(contenttype|contenttypeid|docicon|fsobjtype|linktitle|attachments|_complianceflags|folderchildcount|itemchildcount)$/i.test(colName)) {
        continue;
      }

      const colDisplay = c.displayName || c.name;
      const dispNorm = normalizeColString(colDisplay);
      const nameNorm = normalizeColString(colName);
      const colNorm = normalizeColString(colDisplay + " " + colName);

      const colType = c.text
        ? "text"
        : c.number
        ? "number"
        : c.dateTime
        ? "dateTime"
        : c.choice
        ? "choice"
        : c.lookup
        ? "lookup"
        : c.personOrGroup
        ? "person"
        : "other";

      columns.push({
        id: c.id,
        name: colName,
        displayName: colDisplay,
        type: colType,
        required: Boolean(c.required),
        readOnly: Boolean(c.readOnly),
        choice: c.choice,
        lookup: c.lookup,
      });

      // Semantic mapping according to the exact 9 columns:
      // 1. כותרת (Title)
      if (colName === "Title" || dispNorm === "title" || dispNorm === "כותרת" || colNorm.includes("כותרת")) {
        columnMap["title"] = colName;
      }

      // 2. סוג / סוג הפעילות (WorkType / Activity Type: טיקטים, ביקור באתר, פרויקטים)
      // Scored mapping so "סוג הפעילות" / "סוג פעילות" always beats loose or system matches
      let currentWorkTypeScore = 0;
      if (dispNorm === "סוגהפעילות" || dispNorm === "סוגפעילות") {
        currentWorkTypeScore = 100;
      } else if (dispNorm.includes("סוגהפעילות") || dispNorm.includes("סוגפעילות")) {
        currentWorkTypeScore = 95;
      } else if (dispNorm === "סוגהעבודה" || dispNorm === "סוגעבודה") {
        currentWorkTypeScore = 90;
      } else if (dispNorm === "סוגשירות" || dispNorm === "סוגהשירות" || dispNorm === "סוגקריאה" || dispNorm.includes("אופיפעילות") || dispNorm.includes("אופיהפעילות")) {
        currentWorkTypeScore = 85;
      } else if (c.type === "choice" && c.choice?.choices?.some((ch: string) => /ביקור|פרויקט|טיקט|קריא|שרות|שירות|תמיכ/i.test(ch))) {
        currentWorkTypeScore = 82;
      } else if (dispNorm === "סוג" || colName === "WorkType" || colName === "ActivityType") {
        currentWorkTypeScore = 75;
      } else if (dispNorm === "activitytype" || dispNorm === "worktype") {
        currentWorkTypeScore = 70;
      } else if (dispNorm.includes("קטגוריה") || dispNorm.includes("קטגורייתפעילות")) {
        currentWorkTypeScore = 65;
      }

      if (currentWorkTypeScore > bestWorkTypeScore) {
        bestWorkTypeScore = currentWorkTypeScore;
        columnMap["workType"] = colName;
      }

      // 3. לקוח (Customer: "לקוח", "שם לקוח", "שם הלקוח", "חברה", "Customer", "Client")
      if (
        dispNorm === "לקוח" ||
        dispNorm.startsWith("לקוח") ||
        dispNorm.includes("לקוח") ||
        dispNorm.includes("שםהלקוח") ||
        dispNorm.includes("שםלקוח") ||
        dispNorm.includes("חברה") ||
        dispNorm.includes("ארגון") ||
        dispNorm.includes("customer") ||
        dispNorm.includes("client") ||
        dispNorm.includes("account") ||
        nameNorm === "לקוח" ||
        nameNorm.includes("customer") ||
        nameNorm.includes("client") ||
        nameNorm.includes("company") ||
        nameNorm.includes("account") ||
        nameNorm.includes("_x05dc__x05e7__x05d5__x05d7_") ||
        colName === "Customer" ||
        colName === "Client"
      ) {
        columnMap["customer"] = colName;
      }

      // 4. עובד / משתמש / מטפל (Handler / Technician / User - SSO User)
      let currentHandlerScore = 0;
      const decodedColName = decodeSharePointColName(colName);
      const decodedNorm = normalizeColString(decodedColName);

      if (
        dispNorm === "משתמש" ||
        decodedNorm === "משתמש" ||
        colName === "_x05de__x05e9__x05ea__x05de__x05e9_"
      ) {
        currentHandlerScore = 150;
      } else if (
        dispNorm === "שםמשתמש" ||
        dispNorm === "שםהמשתמש" ||
        decodedNorm.includes("משתמש") ||
        decodedNorm.includes("שםמשתמש")
      ) {
        currentHandlerScore = 140;
      } else if (
        dispNorm === "עובד" ||
        decodedNorm === "עובד" ||
        colName === "_x05e2__x05d5__x05d1__x05d3_"
      ) {
        currentHandlerScore = 120;
      } else if (dispNorm === "שםהעובד" || dispNorm === "שםעובד" || decodedNorm.includes("שםעובד")) {
        currentHandlerScore = 115;
      } else if (dispNorm === "משתמשהמערכת" || dispNorm === "משתמשמערכת") {
        currentHandlerScore = 110;
      } else if (dispNorm === "מטפל" || dispNorm === "שםהמטפל" || dispNorm === "שםמטפל" || decodedNorm === "מטפל" || colName === "_x05de__x05d8__x05e4__x05dc_") {
        currentHandlerScore = 100;
      } else if (dispNorm === "טכנאי" || dispNorm === "שםהטכנאי" || dispNorm === "שםטכנאי" || decodedNorm === "טכנאי" || colName === "_x05d8__x05db__x05e0__x05d0__x05d9_") {
        currentHandlerScore = 95;
      } else if (colName === "User" || colName === "UserName" || colName === "Employee" || colName === "Handler" || colName === "Technician") {
        currentHandlerScore = 90;
      } else if (dispNorm === "user" || dispNorm === "username" || dispNorm === "employee" || dispNorm === "technician" || dispNorm === "handler") {
        currentHandlerScore = 85;
      } else if (
        (dispNorm.includes("משתמש") || dispNorm.includes("עובד") || dispNorm.includes("מטפל") || dispNorm.includes("טכנאי") || dispNorm.includes("צוות") || decodedNorm.includes("משתמש") || decodedNorm.includes("עובד") || decodedNorm.includes("מטפל")) &&
        !dispNorm.includes("הערות") &&
        !dispNorm.includes("סוג") &&
        !dispNorm.includes("תאריך") &&
        !dispNorm.includes("שעות") &&
        !dispNorm.includes("לקוח") &&
        !dispNorm.includes("קצה")
      ) {
        currentHandlerScore = 75;
      } else if (nameNorm.includes("user") || nameNorm.includes("employee") || nameNorm.includes("handler") || nameNorm.includes("technician")) {
        currentHandlerScore = 70;
      } else if (colType === "person" || (c as any).personOrGroup) {
        if (colName !== "Author" && colName !== "Editor" && colName !== "CreatedBy" && colName !== "ModifiedBy") {
          currentHandlerScore = 65;
        }
      }

      if (currentHandlerScore > bestHandlerScore) {
        bestHandlerScore = currentHandlerScore;
        columnMap["handler"] = colName;
      }

      if (
        dispNorm === "עובד" ||
        decodedNorm === "עובד" ||
        colName === "_x05e2__x05d5__x05d1__x05d3_" ||
        dispNorm === "שםהעובד" ||
        dispNorm === "שםעובד" ||
        (!columnMap["worker"] && (dispNorm.includes("עובד") || dispNorm === "מטפל" || dispNorm === "טכנאי"))
      ) {
        columnMap["worker"] = colName;
      }

      // 5. שעת התחלה (Start Time)
      if (
        dispNorm.includes("שעתהתחלה") ||
        dispNorm === "התחלה" ||
        dispNorm.includes("starttime") ||
        dispNorm === "start" ||
        nameNorm.includes("start")
      ) {
        columnMap["startTime"] = colName;
      }

      // 6. שעת סיום (End Time)
      if (
        dispNorm.includes("שעתסיום") ||
        dispNorm === "סיום" ||
        dispNorm.includes("endtime") ||
        dispNorm === "end" ||
        nameNorm.includes("end")
      ) {
        columnMap["endTime"] = colName;
      }

      // 7. תאריך (Date)
      if (dispNorm.includes("תאריך") || dispNorm === "יום" || dispNorm.includes("date") || nameNorm.includes("date")) {
        columnMap["date"] = colName;
      }

      // 8. כמה זמן הושקע (Hours / Duration)
      if (
        dispNorm.includes("כמהזמנהושקע") ||
        dispNorm.includes("זמנהושקע") ||
        dispNorm.includes("הושקע") ||
        dispNorm.includes("כמהזמן") ||
        dispNorm.includes("משך") ||
        dispNorm.includes("שעות") ||
        dispNorm.includes("duration") ||
        dispNorm.includes("hours") ||
        nameNorm.includes("duration") ||
        nameNorm.includes("hours")
      ) {
        columnMap["duration"] = colName;
      }

      // 9. מה נעשה (Description) - MUST NOT match 'סוג הפעילות' or choice columns!
      const isDescCandidate = currentWorkTypeScore === 0 && c.type !== "choice" && !c.choice && (
        dispNorm.includes("מהנעשה") ||
        dispNorm.includes("תיאור") ||
        dispNorm.includes("מהבוצע") ||
        dispNorm.includes("מהותהטיפול") ||
        dispNorm.includes("מהותהקריאה") ||
        dispNorm.includes("פירוט") ||
        (dispNorm.includes("פעילות") && !dispNorm.includes("סוג") && !dispNorm.includes("אופי") && !dispNorm.includes("קטגורי")) ||
        dispNorm.includes("description") ||
        dispNorm.includes("details") ||
        nameNorm.includes("description") ||
        nameNorm.includes("details")
      );

      if (isDescCandidate && colName !== columnMap["workType"]) {
        columnMap["description"] = colName;
      }
    }

    // Safeguard: Ensure description and workType never share the same internal column name
    if (columnMap["description"] && columnMap["description"] === columnMap["workType"]) {
      delete columnMap["description"];
    }

    // 3. Dynamic schema discovery: Inspect recent items (e.g. manually created entries)
    // to dynamically resolve exact internal field names for customer and workType
    try {
      const recentUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=5&$orderby=lastModifiedDateTime desc`;
      const recentRes = await fetchGraph(recentUrl, { method: "GET" }, env);
      if (recentRes.ok) {
        const recentData: any = await recentRes.json();
        for (const item of (recentData.value || [])) {
          const fieldsObj = item.fields || {};
          for (const [k, v] of Object.entries(fieldsObj)) {
            if (
              k === "Title" ||
              k === "id" ||
              k === "ID" ||
              k.startsWith("@") ||
              (k.startsWith("_") && !k.startsWith("_x")) ||
              k.startsWith("LinkTitle") ||
              k.startsWith("DocIcon")
            ) {
              continue;
            }

            // If workType is still unmapped and value matches one of the 3 work types
            if (!columnMap["workType"] && typeof v === "string") {
              const vNorm = normalizeColString(v);
              if (
                vNorm === "טיקטים" ||
                vNorm === "פרויקטים" ||
                vNorm === "ביקור" ||
                vNorm === "טיקט" ||
                vNorm === "פרויקט" ||
                vNorm === "ביקורבאתר" ||
                vNorm === "קריאותשירות" ||
                vNorm === "תמיכהמרחוק"
              ) {
                console.log(`[resolveSharePointList] Discovered workType internal field "${k}" from existing item value "${v}"`);
                columnMap["workType"] = k;
              }
            }

            // If customer is still unmapped and column definition indicates customer
            if (!columnMap["customer"] && k !== columnMap["workType"] && k !== columnMap["date"] && k !== columnMap["duration"] && k !== columnMap["description"]) {
              const colDef = columns.find((col) => col.name === k);
              if (colDef) {
                const dNorm = normalizeColString(colDef.displayName || "");
                if (dNorm.includes("לקוח") || dNorm.includes("חברה") || dNorm.includes("ארגון") || dNorm.includes("customer") || dNorm.includes("client")) {
                  console.log(`[resolveSharePointList] Discovered customer internal field "${k}" from column definition (${colDef.displayName})`);
                  columnMap["customer"] = k;
                }
              }
            }

            // If handler is still unmapped and field indicates employee/handler/user
            if (!columnMap["handler"] && k !== columnMap["workType"] && k !== columnMap["customer"] && k !== columnMap["date"] && k !== columnMap["duration"] && k !== columnMap["description"]) {
              const baseK = k.replace(/LookupId$/, "");
              const decBase = decodeSharePointColName(baseK);
              const decNorm = normalizeColString(decBase);
              const colDef = columns.find((col) => col.name === baseK || col.name === k);
              const dNorm = normalizeColString(colDef?.displayName || "");
              if (
                decNorm.includes("משתמש") || decNorm.includes("עובד") || decNorm.includes("מטפל") || decNorm.includes("טכנאי") ||
                dNorm.includes("משתמש") || dNorm.includes("עובד") || dNorm.includes("מטפל") || dNorm.includes("טכנאי") ||
                dNorm.includes("employee") || dNorm.includes("handler") || dNorm.includes("user") ||
                /user|employee|handler/i.test(baseK) ||
                baseK === "_x05de__x05e9__x05ea__x05de__x05e9_"
              ) {
                console.log(`[resolveSharePointList] Discovered handler internal field "${baseK}" from item inspection (decoded: ${decBase}, display: ${colDef?.displayName})`);
                columnMap["handler"] = baseK;
              }
            }
          }
        }
      }
    } catch (recentErr) {
      console.warn("[resolveSharePointList] Notice: inspection of recent items:", recentErr);
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
    userId?: string;
    userOid?: string;
    userName?: string;
    userUpn?: string;
    workType?: string;
    startTime?: string;
    endTime?: string;
    ticketNumber?: string;
    contactPerson?: string;
    fileWebUrl?: string;
    additionalEmployees?: string[];
    teamMembers?: string[];
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

    // 1. כותרת (Title): Always prominently include customer name and ticket / summary
    let titleVal = "";
    if (entryData.ticketNumber) {
      const cleanTicket = String(entryData.ticketNumber).replace(/^(טיקט|ticket)\s*/i, "").trim();
      titleVal = `טיקט ${cleanTicket} - ${customer}`;
    } else {
      const cleanDesc = desc.length <= 40 ? desc : desc.substring(0, 35);
      titleVal = `${customer} - ${cleanDesc}`;
    }

    // 2. סוג (סוג: טיקטים, פרויקטים, ביקור)
    const workTypeVal = normalizeListWorkType(entryData.workType);

    // 3. לקוח (Customer: e.g. "אסיו Asio", "הייספ לאב HSL")
    const customerVal = customer;

    // Helper to format Choice columns safely against actual SharePoint choices
    const resolveChoiceValue = (val: string, colDef?: SharePointListColumn): string => {
      const choices = colDef?.choice?.choices;
      if (!choices || choices.length === 0) return val;

      const cleanVal = String(val || "").trim();
      if (!cleanVal) return choices[0];

      // Exact match
      const exact = choices.find((ch) => ch.trim().toLowerCase() === cleanVal.toLowerCase());
      if (exact) return exact;

      // Normalized match
      const valNorm = normalizeColString(cleanVal);
      const normMatch = choices.find((ch) => normalizeColString(ch) === valNorm);
      if (normMatch) return normMatch;

      // Semantic matching for work types / activity types:
      // A. Visits / Onsite
      if (
        valNorm.includes("ביקור") ||
        valNorm.includes("הגעה") ||
        valNorm.includes("אתר") ||
        valNorm.includes("באתר") ||
        valNorm.includes("פיז") ||
        valNorm.includes("onsite") ||
        valNorm.includes("visit")
      ) {
        const visitChoice = choices.find((ch) =>
          /ביקור|הגעה|אתר|באתר|פיז|onsite|visit/i.test(ch)
        );
        if (visitChoice) return visitChoice;
      }

      // B. Projects
      if (
        valNorm.includes("פרויקט") ||
        valNorm.includes("פרוייקט") ||
        valNorm.includes("הקמ") ||
        valNorm.includes("מיגרצי") ||
        valNorm.includes("שדרוג") ||
        valNorm.includes("הטמע") ||
        valNorm.includes("project")
      ) {
        const projChoice = choices.find((ch) =>
          /פרויקט|פרוייקט|הקמ|מיגרצי|שדרוג|הטמע|project/i.test(ch)
        );
        if (projChoice) return projChoice;
      }

      // C. Tickets / Service Calls / Remote Support / Phone
      if (
        valNorm.includes("טיקט") ||
        valNorm.includes("קריא") ||
        valNorm.includes("שרות") ||
        valNorm.includes("שירות") ||
        valNorm.includes("תמיכ") ||
        valNorm.includes("מרחוק") ||
        valNorm.includes("טלפון") ||
        valNorm.includes("support") ||
        valNorm.includes("ticket") ||
        valNorm.includes("helpdesk") ||
        valNorm.includes("remote")
      ) {
        const ticketChoice = choices.find((ch) =>
          /טיקט|קריא|שרות|שירות|תמיכ|מרחוק|טלפון|support|ticket|helpdesk|remote/i.test(ch)
        );
        if (ticketChoice) return ticketChoice;
      }

      // Substring match
      const subMatch = choices.find((ch) => {
        const chNorm = normalizeColString(ch);
        return chNorm.includes(valNorm) || valNorm.includes(chNorm);
      });
      if (subMatch) return subMatch;

      // Safe default: prefer a ticket/service choice or first available choice
      const defaultChoice = choices.find((ch) => /טיקט|קריא|שרות|שירות|תמיכ/i.test(ch)) || choices[0];
      return defaultChoice || val;
    };

    // 4. משתמש / מטפל / עובד - According to creator SSO email:
    // "שאתה מקים ב Lists שורה, תחת עמודת משתמש, תשלח את כתובת המייל של מקים התיעוד. את המייל אתה יכול לדעת לפי ה SSO של המקים"
    const handlerEmail = (
      entryData.employeeEmail ||
      (entryData as any).userEmail ||
      entryData.userUpn ||
      (entryData.userName && entryData.userName.includes("@") ? entryData.userName : "") ||
      "g@tech-select.co.il"
    ).trim().toLowerCase();

    // Extract raw employee name from any possible property
    const rawHandlerName = (
      entryData.employeeName ||
      (entryData as any).employee ||
      (entryData as any).handler ||
      (entryData as any)["עובד"] ||
      (entryData as any)["מטפל"] ||
      (entryData.userName && !entryData.userName.includes("@") ? entryData.userName : "") ||
      ""
    ).trim();

    // Resolve handler display name dynamically using resolveEffectiveName
    const handlerName = resolveEffectiveName(rawHandlerName, handlerEmail);
    const handlerOid = (entryData.userOid || entryData.userId || "").trim();
    const handlerUpn = (entryData.userUpn || entryData.userName || handlerEmail).trim();
    // Connected user display name
    const handlerUserDisplay = handlerName;

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
    const assignCol = (
      semanticKey: string,
      value: any,
      fallbackKeywords: string[],
      options?: { isChoice?: boolean; isCustomer?: boolean }
    ) => {
      let internalName = columnMap[semanticKey];
      let targetColDef = internalName ? columns.find((c) => c.name === internalName) : undefined;

      if (!internalName) {
        // Try finding matching column among list columns
        targetColDef = columns.find((c) => {
          // Never reuse column mapped to another semantic key
          if (Object.values(columnMap).includes(c.name)) return false;
          // For description: Never match a choice column or type column
          if (semanticKey === "description") {
            if (c.type === "choice" || c.choice) return false;
            const dLow = (c.displayName || "").toLowerCase();
            if (dLow.includes("סוג") || dLow.includes("אופי") || dLow.includes("קטגורי")) return false;
          }
          const dNorm = normalizeColString(c.displayName || "");
          const nNorm = normalizeColString(c.name || "");
          return fallbackKeywords.some(
            (kw) =>
              dNorm === kw ||
              dNorm.startsWith(kw) ||
              dNorm.includes(kw) ||
              nNorm === kw ||
              nNorm.includes(kw)
          );
        });
        if (targetColDef) {
          internalName = targetColDef.name;
          columnMap[semanticKey] = internalName;
        }
      }

      if (!internalName) {
        console.warn(`[SharePoint Lists] Notice: Column for semantic key "${semanticKey}" not found. Keywords:`, fallbackKeywords);
        return;
      }

      // Safeguard: description must NEVER overwrite workType column
      if (semanticKey === "description" && columnMap["workType"] && internalName === columnMap["workType"]) {
        console.warn(`[SharePoint Lists] Prevented description from writing to workType column "${internalName}"`);
        return;
      }

      let formattedValue = value;

      // Handle Choice column
      if (targetColDef?.type === "choice" || targetColDef?.choice || options?.isChoice) {
        formattedValue = resolveChoiceValue(String(value || ""), targetColDef);
        if (targetColDef?.choice?.allowMultipleValues && !Array.isArray(formattedValue)) {
          formattedValue = [formattedValue];
        }
      }

      // Handle Customer choice column if customer dropdown is used
      if (options?.isCustomer && (targetColDef?.type === "choice" || targetColDef?.choice)) {
        const choices = targetColDef.choice?.choices || [];
        if (choices.length > 0) {
          const rawVal = String(value || "").trim();
          const custNorm = normalizeColString(rawVal);
          let matchedChoice = choices.find((ch) => {
            const chNorm = normalizeColString(ch);
            return chNorm === custNorm || chNorm.includes(custNorm) || custNorm.includes(chNorm);
          });

          // Advanced bilingual semantic matching against each choice
          if (!matchedChoice) {
            let bestScore = 0;
            let bestChoiceMatch: string | undefined;
            for (const ch of choices) {
              const res = scoreBilingualCustomerMatch(ch, rawVal);
              if (res.score > bestScore && res.score >= 0.65) {
                bestScore = res.score;
                bestChoiceMatch = ch;
              }
            }
            if (bestChoiceMatch) {
              matchedChoice = bestChoiceMatch;
            }
          }

          // Bilingual dictionary and variant matching for customers
          if (!matchedChoice) {
            const valLower = rawVal.toLowerCase().trim();
            for (const [dictKey, aliases] of Object.entries(BILINGUAL_CUSTOMER_DICTIONARY)) {
              const keyMatch = valLower === dictKey || valLower.includes(dictKey) || dictKey.includes(valLower);
              const aliasMatch = aliases.some((a) => valLower === a || valLower.includes(a) || a.includes(valLower));
              if (keyMatch || aliasMatch) {
                matchedChoice = choices.find((ch) => {
                  const chNorm = normalizeColString(ch);
                  if (chNorm === normalizeColString(dictKey) || chNorm.includes(normalizeColString(dictKey))) return true;
                  return aliases.some((a) => chNorm === normalizeColString(a) || chNorm.includes(normalizeColString(a)));
                });
                if (matchedChoice) break;
              }
            }
          }

          if (matchedChoice) {
            formattedValue = matchedChoice;
          } else {
            // CRITICAL: NEVER overwrite user's customer with choices[0]!
            // Retain user's actual customer name ("קיסר דיגום")
            formattedValue = rawVal;
          }
        }
      }

      // Handle Number column
      if (targetColDef?.type === "number") {
        formattedValue = Number(value || 0);
      }

      // Handle DateTime column (prevent 500 if raw HH:MM is passed)
      if (targetColDef?.type === "dateTime") {
        const sVal = String(value || "").trim();
        if (/^\d{1,2}:\d{2}$/.test(sVal)) {
          formattedValue = `${isoDate}T${sVal.padStart(5, "0")}:00Z`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(sVal)) {
          formattedValue = `${sVal}T00:00:00Z`;
        }
      }

      fields[internalName] = formattedValue;
    };

    // 1. כותרת
    if (columnMap["title"] && columnMap["title"] !== "Title") {
      fields[columnMap["title"]] = titleVal;
    }

    // 2. סוג / סוג הפעילות
    assignCol(
      "workType",
      workTypeVal,
      [
        "סוגהפעילות",
        "סוגפעילות",
        "סוגהעבודה",
        "סוגעבודה",
        "סוגהשירות",
        "סוגשירות",
        "סוגקריאה",
        "אופיהפעילות",
        "אופיפעילות",
        "קטגורייתפעילות",
        "קטגוריה",
        "activitytype",
        "worktype",
        "סוג",
        "type",
      ],
      { isChoice: true }
    );

    // 3. לקוח
    assignCol(
      "customer",
      customerVal,
      ["לקוח", "שםלקוח", "שםהלקוח", "חברה", "ארגון", "customer", "client", "account"],
      { isCustomer: true }
    );

    const siteUserId = await resolveSiteUserLookupId(
      siteId,
      handlerEmail,
      handlerName,
      env,
      handlerOid,
      handlerUpn,
      listId
    );

    // 4. מטפל / עובד / משתמש (SSO user name & email & ID)
    // Identify all columns in the list that represent handler / user / employee
    const candidateHandlerCols: string[] = [];
    if (columnMap["handler"]) candidateHandlerCols.push(columnMap["handler"]);

    for (const c of columns) {
      const dNorm = normalizeColString(c.displayName || "");
      const nNorm = normalizeColString(c.name || "");
      const decNorm = normalizeColString(decodeSharePointColName(c.name || ""));
      const isHandlerLike =
        dNorm === "משתמש" || dNorm === "שםמשתמש" || dNorm === "שםהמשתמש" || dNorm === "משתמשמערכת" ||
        dNorm === "עובד" || dNorm === "שםעובד" || dNorm === "שםהעובד" || dNorm === "מטפל" || dNorm === "טכנאי" ||
        decNorm === "משתמש" || decNorm === "עובד" || decNorm === "מטפל" || decNorm === "טכנאי" ||
        nNorm === "user" || nNorm === "username" || nNorm === "employee" || nNorm === "handler" ||
        c.name === "_x05de__x05e9__x05ea__x05de__x05e9_" || c.name === "_x05e2__x05d5__x05d1__x05d3_";
      if (isHandlerLike && !candidateHandlerCols.includes(c.name) && c.name !== "Author" && c.name !== "Editor" && c.name !== "CreatedBy" && c.name !== "ModifiedBy") {
        candidateHandlerCols.push(c.name);
      }
    }

    if (candidateHandlerCols.length === 0) {
      // Find matching user column in list columns
      const defaultCol = columns.find(
        (c) =>
          c.name === "_x05de__x05e9__x05ea__x05de__x05e9_" ||
          normalizeColString(c.displayName || "") === "משתמש" ||
          normalizeColString(c.name || "").includes("user")
      );
      if (defaultCol) {
        candidateHandlerCols.push(defaultCol.name);
      }
    }

    const shortWorkerName = (handlerUserDisplay || "עובד").trim().split(/\s+/)[0] || handlerUserDisplay;

    for (const hCol of candidateHandlerCols) {
      const hColDef = columns.find((c) => c.name === hCol);
      const isChoice = Boolean(hColDef?.type === "choice" || hColDef?.choice);

      if (isChoice) {
        const choices = hColDef?.choice?.choices || [];
        const isWorkerCol =
          normalizeColString(hColDef?.displayName || "").includes("עובד") ||
          normalizeColString(decodeSharePointColName(hColDef?.name || "")).includes("עובד") ||
          hColDef?.name === "_x05e2__x05d5__x05d1__x05d3_";

        const matchedEmpChoice = matchEmployeeNameToChoice(handlerUserDisplay, handlerEmail, choices);

        if (matchedEmpChoice) {
          fields[hCol] = matchedEmpChoice;
        } else if (isWorkerCol) {
          // Ensure worker column is always populated and add choice to SharePoint column if missing
          fields[hCol] = shortWorkerName;
        } else {
          // For משתמש column, send SSO email
          fields[hCol] = handlerEmail;
        }
      } else {
        const dNorm = normalizeColString(hColDef?.displayName || "");
        const decNorm = normalizeColString(decodeSharePointColName(hColDef?.name || ""));
        if (dNorm.includes("עובד") || decNorm.includes("עובד") || hColDef?.name === "_x05e2__x05d5__x05d1__x05d3_") {
          fields[hCol] = shortWorkerName;
        } else {
          // Send the creator's SSO email address under user / משתמש column!
          fields[hCol] = handlerEmail;
        }
      }
    }

    // Explicit worker column guarantee: if list has "עובד" column, always assign matched choice
    const explicitWorkerCol = columns.find((c) => {
      const dNorm = normalizeColString(c.displayName || "");
      const decNorm = normalizeColString(decodeSharePointColName(c.name || ""));
      return (
        dNorm === "עובד" ||
        dNorm === "שםעובד" ||
        decNorm === "עובד" ||
        c.name === "_x05e2__x05d5__x05d1__x05d3_" ||
        (dNorm.includes("עובד") && !dNorm.includes("משתמש"))
      );
    });

    if (explicitWorkerCol) {
      const choices = explicitWorkerCol.choice?.choices || [];
      const matched = matchEmployeeNameToChoice(handlerUserDisplay, handlerEmail, choices);
      if (matched) {
        fields[explicitWorkerCol.name] = matched;
      } else {
        // If employee is not yet in the SharePoint Choice column's choices array, add it via Graph PATCH
        if (explicitWorkerCol.id && explicitWorkerCol.choice && Array.isArray(explicitWorkerCol.choice.choices) && shortWorkerName) {
          const updatedChoices = [...explicitWorkerCol.choice.choices, shortWorkerName];
          explicitWorkerCol.choice.choices = updatedChoices;
          try {
            await fetchGraph(
              `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/columns/${explicitWorkerCol.id}`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  choice: {
                    choices: updatedChoices,
                  },
                }),
              },
              env
            );
          } catch (patchErr) {
            console.warn(`[SharePoint Lists] Could not append "${shortWorkerName}" to Choice column choices:`, patchErr);
          }
        }
        fields[explicitWorkerCol.name] = shortWorkerName;
      }
    }

    // Only set _x05de__x05e9__x05ea__x05de__x05e9_ if it actually exists in list schema
    if (columns.some((c) => c.name === "_x05de__x05e9__x05ea__x05de__x05e9_")) {
      fields["_x05de__x05e9__x05ea__x05de__x05e9_"] = handlerEmail;
    }

    // 5. שעת התחלה
    assignCol("startTime", startTimeStr, ["שעתהתחלה", "התחלה", "starttime", "start"]);

    // 6. שעת סיום
    assignCol("endTime", endTimeStr, ["שעתסיום", "סיום", "endtime", "end"]);

    // 7. תאריך
    assignCol("date", isoDate, ["תאריך", "יום", "date"]);

    // 8. כמה זמן הושקע
    assignCol("duration", durationVal, ["כמהזמנהושקע", "זמנהושקע", "הושקע", "כמהזמן", "משך", "שעות", "duration", "hours"]);

    // 9. מה נעשה (Description) - Explicitly avoid 'סוג הפעילות'
    assignCol("description", whatWasDone, [
      "מהנעשה",
      "תיאור",
      "תיאורפעילות",
      "תיאורהפעילות",
      "מהבוצע",
      "מהותהטיפול",
      "מהותהקריאה",
      "פירוט",
      "פירוטפעילות",
      "description",
      "details",
    ]);

    const itemCreateUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;

    // Attempt 1: Full structured payload with all 9 mapped fields
    let res = await fetchGraph(
      itemCreateUrl,
      {
        method: "POST",
        body: JSON.stringify({ fields }),
      },
      env
    );

    // If failed (status 500 or 400 - e.g. Person lookup constraint, invalid field, or type error)
    if (!res.ok) {
      const errTxt = await res.text().catch(() => "");
      console.warn(`[SharePoint Lists] Initial write returned status ${res.status}. Analyzing and adapting payload...`, errTxt);

      const isPrimitiveError = /primitive|SP\.FieldUser|FieldUser|type.*User/i.test(errTxt);
      const isMissingPropError = /does not exist|Property.*LookupId/i.test(errTxt);

      // Attempt 2: Intelligent adaptation based on error response
      const adaptedFields = { ...fields };
      const currentHandlerCol = columnMap["handler"] || "_x05de__x05e9__x05ea__x05de__x05e9_";

      if (isPrimitiveError) {
        // SharePoint says column cannot be a primitive string -> It is a Person column
        if (siteUserId && siteUserId > 0) {
          console.log(`[SharePoint Lists] Detected Person column from error. Switching to verified LookupId (${siteUserId}) for "${currentHandlerCol}"`);
          delete adaptedFields[currentHandlerCol];
          delete adaptedFields["_x05de__x05e9__x05ea__x05de__x05e9_"];
          adaptedFields[currentHandlerCol + "LookupId"] = siteUserId;
          adaptedFields["_x05de__x05e9__x05ea__x05de__x05e9_LookupId"] = siteUserId;
        } else {
          console.log(`[SharePoint Lists] Detected Person column without verified LookupId. Removing direct field to allow record creation`);
          delete adaptedFields[currentHandlerCol];
          delete adaptedFields["_x05de__x05e9__x05ea__x05de__x05e9_"];
          delete adaptedFields[currentHandlerCol + "LookupId"];
          delete adaptedFields["_x05de__x05e9__x05ea__x05de__x05e9_LookupId"];
        }
      } else if (isMissingPropError) {
        // SharePoint says LookupId property does not exist -> It is a Text/Choice column, so use creator SSO email!
        console.log(`[SharePoint Lists] Detected Text/Choice column from error. Switching to creator SSO email for "${currentHandlerCol}"`);
        for (const k of Object.keys(adaptedFields)) {
          if (k.endsWith("LookupId")) {
            const baseCol = k.replace(/LookupId$/, "");
            delete adaptedFields[k];
            adaptedFields[baseCol] = handlerEmail;
          }
        }
        adaptedFields[currentHandlerCol] = handlerEmail;
        adaptedFields["_x05de__x05e9__x05ea__x05de__x05e9_"] = handlerEmail;
      } else {
        // General fallback: try string representation of creator SSO email
        for (const k of Object.keys(adaptedFields)) {
          if (k.endsWith("LookupId")) {
            const baseCol = k.replace(/LookupId$/, "");
            delete adaptedFields[k];
            adaptedFields[baseCol] = handlerEmail;
          }
        }
        adaptedFields[currentHandlerCol] = handlerEmail;
        adaptedFields["_x05de__x05e9__x05ea__x05de__x05e9_"] = handlerEmail;
      }

      // Check if error mentions another specific property not existing
      const missingPropMatch = errTxt.match(/Property ['"]([^'"]+)['"] does not exist/i);
      if (missingPropMatch) {
        const badProp = missingPropMatch[1];
        console.warn(`[SharePoint Lists] Removing non-existent property "${badProp}"`);
        delete adaptedFields[badProp];
      }

      res = await fetchGraph(
        itemCreateUrl,
        {
          method: "POST",
          body: JSON.stringify({ fields: adaptedFields }),
        },
        env
      );

      // Attempt 3: If still failing, try resilient core fields fallback
      if (!res.ok) {
        const errTxt2 = await res.text().catch(() => "");
        console.warn(`[SharePoint Lists] Attempt 2 returned status ${res.status}. Trying resilient core fields fallback...`, errTxt2);

        const safeCoreFields: Record<string, any> = {
          Title: titleVal,
        };
        const workTypeCol = columnMap["workType"];
        if (workTypeCol && fields[workTypeCol]) {
          safeCoreFields[workTypeCol] = fields[workTypeCol];
        }
        // Check if customer field failed or can be included safely
        const customerCol = columnMap["customer"];
        if (customerCol && fields[customerCol] && !errTxt2.toLowerCase().includes(customerCol.toLowerCase())) {
          safeCoreFields[customerCol] = fields[customerCol];
        }

        // Include matched employee choice under worker column if present
        const workerColName = columnMap["worker"] || columns.find((c) => c.name === "_x05e2__x05d5__x05d1__x05d3_" || normalizeColString(c.displayName || "") === "עובד")?.name;
        if (workerColName && fields[workerColName] && !errTxt2.toLowerCase().includes(workerColName.toLowerCase())) {
          safeCoreFields[workerColName] = fields[workerColName];
        }

        // Include handler as creator email unless primitive error explicitly occurred without siteUserId
        if (siteUserId && siteUserId > 0) {
          safeCoreFields[currentHandlerCol + "LookupId"] = siteUserId;
          if (columns.some((c) => c.name === "_x05de__x05e9__x05ea__x05de__x05e9_")) {
            safeCoreFields["_x05de__x05e9__x05ea__x05de__x05e9_LookupId"] = siteUserId;
          }
        } else if (!isPrimitiveError) {
          safeCoreFields[currentHandlerCol] = handlerEmail;
          if (columns.some((c) => c.name === "_x05de__x05e9__x05ea__x05de__x05e9_")) {
            safeCoreFields["_x05de__x05e9__x05ea__x05de__x05e9_"] = handlerEmail;
          }
        }

        if (columnMap["date"] && fields[columnMap["date"]]) {
          safeCoreFields[columnMap["date"]] = fields[columnMap["date"]];
        }
        if (columnMap["duration"] && fields[columnMap["duration"]]) {
          safeCoreFields[columnMap["duration"]] = fields[columnMap["duration"]];
        }
        if (columnMap["description"] && fields[columnMap["description"]] && columnMap["description"] !== workTypeCol) {
          safeCoreFields[columnMap["description"]] = whatWasDone;
        }

        res = await fetchGraph(
          itemCreateUrl,
          {
            method: "POST",
            body: JSON.stringify({ fields: safeCoreFields }),
          },
          env
        );

        // Attempt 4: Minimal resilient core payload with clean title
        if (!res.ok) {
          console.warn(`[SharePoint Lists] Attempt 3 returned status ${res.status}. Trying minimal resilient core payload...`);
          const minimalFields: Record<string, any> = {
            Title: titleVal,
          };
          if (workTypeCol && fields[workTypeCol]) {
            minimalFields[workTypeCol] = fields[workTypeCol];
          }
          if (columnMap["date"]) minimalFields[columnMap["date"]] = isoDate;
          if (columnMap["duration"]) minimalFields[columnMap["duration"]] = durationVal;
          if (columnMap["description"] && columnMap["description"] !== workTypeCol) {
            minimalFields[columnMap["description"]] = whatWasDone;
          }

          res = await fetchGraph(
            itemCreateUrl,
            {
              method: "POST",
              body: JSON.stringify({ fields: minimalFields }),
            },
            env
          );

          // Attempt 5: Absolute emergency fallback (clean Title only!)
          if (!res.ok) {
            console.warn(`[SharePoint Lists] Attempt 4 returned status ${res.status}. Final fallback to Title only...`);
            res = await fetchGraph(
              itemCreateUrl,
              {
                method: "POST",
                body: JSON.stringify({ fields: { Title: titleVal } }),
              },
              env
            );
          }
        }
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
        סוג: (columnMap["workType"] ? fields[columnMap["workType"]] : null) || workTypeVal,
        לקוח: (columnMap["customer"] ? fields[columnMap["customer"]] : null) || customerVal,
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
 * Delete an item from Microsoft Lists (used for Stateless Undo & Central Log deletion)
 */
export async function deleteSharePointListItem(
  listItemId?: string,
  env?: any,
  criteria?: {
    customerName?: string;
    date?: string;
    employeeName?: string;
    description?: string;
  }
): Promise<{ success: boolean; deletedId?: string; error?: string }> {
  try {
    const listInfo = await resolveSharePointList(env);
    const { siteId, listId } = listInfo;

    // 1. Direct ID deletion if listItemId is valid
    if (listItemId && String(listItemId).trim()) {
      const cleanId = String(listItemId).trim();
      const deleteUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${encodeURIComponent(cleanId)}`;
      const res = await fetchGraph(deleteUrl, { method: "DELETE" }, env);

      if (res.ok || res.status === 204 || res.status === 404) {
        console.log(`[deleteSharePointListItem] Successfully deleted list item ${cleanId}`);
        return { success: true, deletedId: cleanId };
      }
      console.warn(`[deleteSharePointListItem] Notice: Direct deletion of item ${cleanId} returned ${res.status}. Falling back to criteria match...`);
    }

    // 2. Criteria-based deletion fallback (finds recent matching items by customer, date, or description)
    if (criteria && (criteria.customerName || criteria.date || criteria.description)) {
      const fetchUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=35&$orderby=lastModifiedDateTime desc`;
      const itemsRes = await fetchGraph(fetchUrl, { method: "GET" }, env);
      if (itemsRes.ok) {
        const itemsData: any = await itemsRes.json();
        const items = itemsData.value || [];

        const cCust = normalizeColString(criteria.customerName || "");
        const cDate = String(criteria.date || "").trim();
        const cDesc = normalizeColString(criteria.description || "");

        for (const item of items) {
          const f = item.fields || {};
          const title = normalizeColString(f.Title || "");
          const custVal = normalizeColString(f[listInfo.columnMap["customer"] || ""] || "");
          const dateVal = String(f[listInfo.columnMap["date"] || ""] || "").trim();
          const descVal = normalizeColString(f[listInfo.columnMap["description"] || ""] || "");

          const custMatches = !cCust || title.includes(cCust) || custVal.includes(cCust) || cCust.includes(title);
          const dateMatches = !cDate || dateVal.includes(cDate) || (cDate.split("-").length === 3 && dateVal.includes(cDate.split("-")[2]));
          const descMatches = !cDesc || descVal.includes(cDesc.slice(0, 12)) || title.includes(cDesc.slice(0, 12)) || cDesc.includes(descVal.slice(0, 12));

          if (custMatches && (dateMatches || descMatches)) {
            const foundId = String(item.id);
            const delUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${encodeURIComponent(foundId)}`;
            const delRes = await fetchGraph(delUrl, { method: "DELETE" }, env);
            if (delRes.ok || delRes.status === 204 || delRes.status === 404) {
              console.log(`[deleteSharePointListItem] Successfully deleted matched list item ${foundId} for customer "${criteria.customerName}"`);
              return { success: true, deletedId: foundId };
            }
          }
        }
      }
    }

    return { success: true };
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

export interface SharePointListEntry {
  id: string;
  webUrl?: string;
  customerName: string;
  workType: string;
  employeeName: string;
  employeeEmail: string;
  startTime: string;
  endTime: string;
  date: string;
  durationHours: number;
  durationFormatted: string;
  description: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  rawFields?: Record<string, any>;
}

function calculateHoursFromTimes(start: string, end: string): number {
  try {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    if (!isNaN(sH) && !isNaN(eH)) {
      const startMins = sH * 60 + (sM || 0);
      const endMins = eH * 60 + (eM || 0);
      const diff = endMins - startMins;
      if (diff > 0) return Math.round((diff / 60) * 100) / 100;
    }
  } catch {}
  return 1.0;
}

function parseSharePointItemDate(rawVal: any, createdDateTime?: string): string {
  if (rawVal === null || rawVal === undefined || rawVal === "") {
    return createdDateTime ? String(createdDateTime).split("T")[0] : "";
  }
  const s = String(rawVal).trim();
  // 1. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmyMatch) {
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }
  // 3. ISO date string e.g. 2026-10-11T14:30:00Z
  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const yr = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, "0");
      const da = String(dt.getDate()).padStart(2, "0");
      return `${yr}-${mo}-${da}`;
    }
  } catch {}
  return createdDateTime ? String(createdDateTime).split("T")[0] : s.split("T")[0];
}

function extractRawWorkerVal(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return extractRawWorkerVal(raw[0]);
  }
  if (typeof raw === "object") {
    return String(raw.LookupValue || raw.Title || raw.displayName || raw.name || raw.value || raw.Email || "");
  }
  return String(raw);
}

/**
 * Fetch entries directly from Microsoft Lists for reporting and insights
 */
export async function fetchSharePointListEntries(
  env?: any,
  filterOptions?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    customer?: string;
    employee?: string;
    employeeEmail?: string;
    query?: string;
    top?: number;
  }
): Promise<SharePointListEntry[]> {
  try {
    const listInfo = await resolveSharePointList(env);
    const { siteId, listId, columnMap, columns } = listInfo;
    const requestedTop = filterOptions?.top || (filterOptions?.startDate || filterOptions?.employee || filterOptions?.employeeEmail ? 400 : 200);
    const pageTop = Math.min(requestedTop, 200);

    // Try lastModifiedDateTime desc first with HonorNonIndexedQueriesWarningMayFailRandomly header, and fall back without orderby
    let itemsRes = await fetchGraph(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=${pageTop}&$orderby=lastModifiedDateTime desc`,
      {
        method: "GET",
        headers: {
          Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly",
        },
      },
      env
    );

    if (!itemsRes.ok) {
      console.warn(`[fetchSharePointListEntries] Orderby query returned ${itemsRes.status}. Retrying without orderby...`);
      itemsRes = await fetchGraph(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=${pageTop}`,
        { method: "GET" },
        env
      );
    }

    if (!itemsRes.ok) {
      console.warn(`[fetchSharePointListEntries] Graph GET returned status ${itemsRes.status}`);
      return [];
    }

    const itemsData: any = await itemsRes.json();
    const rawItems: any[] = [...(itemsData.value || [])];

    // Follow up to 2 pagination links if present so newest items at the end of large lists are never missed
    let nextLink: string | undefined = itemsData["@odata.nextLink"];
    let pageCount = 0;
    while (nextLink && pageCount < 2 && rawItems.length < requestedTop) {
      pageCount++;
      try {
        const nextRes = await fetchGraph(nextLink, { method: "GET" }, env);
        if (!nextRes.ok) break;
        const nextData: any = await nextRes.json();
        if (Array.isArray(nextData.value)) {
          rawItems.push(...nextData.value);
        }
        nextLink = nextData["@odata.nextLink"];
      } catch {
        break;
      }
    }

    const result: SharePointListEntry[] = [];

    for (const item of rawItems) {
      const f = item.fields || {};

      // Extract Customer Name
      let customerName = extractRawWorkerVal(
        f[columnMap["customer"] || ""] ||
        f["_x05dc__x05e7__x05d5__x05d7_"] ||
        f["לקוח"] ||
        f["Customer"] ||
        f["Title"] ||
        ""
      );

      // Extract Work Type
      let workType = extractRawWorkerVal(
        f[columnMap["workType"] || ""] ||
        f["_x05e1__x05d5__x05d2_"] ||
        f["סוג"] ||
        f["סוגהפעילות"] ||
        f["WorkType"] ||
        "קריאות שירות"
      );

      // Extract Employee Name & Email: check worker column, handler column, and any employee/user columns in schema
      let rawWorkerVal = extractRawWorkerVal(
        f["_x05e2__x05d5__x05d1__x05d3_"] ||
        f["עובד"] ||
        f[columnMap["worker"] || ""] ||
        f["Employee"] ||
        f["מטפל"]
      );

      let rawUserVal = extractRawWorkerVal(
        f["_x05de__x05e9__x05ea__x05de__x05e9_"] ||
        f["משתמש"] ||
        f[columnMap["handler"] || ""] ||
        f["User"]
      );

      if (!rawWorkerVal && !rawUserVal && columns && columns.length > 0) {
        for (const col of columns) {
          const dNorm = normalizeColString(col.displayName || "");
          const decNorm = normalizeColString(decodeSharePointColName(col.name || ""));
          if (
            dNorm.includes("עובד") ||
            dNorm.includes("מטפל") ||
            dNorm.includes("טכנאי") ||
            decNorm.includes("עובד") ||
            decNorm.includes("מטפל")
          ) {
            const val = extractRawWorkerVal(f[col.name]);
            if (val) {
              rawWorkerVal = val;
              break;
            }
          } else if (dNorm.includes("משתמש") || decNorm.includes("משתמש")) {
            const val = extractRawWorkerVal(f[col.name]);
            if (val) {
              rawUserVal = val;
              break;
            }
          }
        }
      }

      // Fallback to SharePoint item createdBy user if custom columns were left blank
      const createdByName = item.createdBy?.user?.displayName || "";
      const createdByEmail = item.createdBy?.user?.email || "";

      const employeeEmail =
        (rawUserVal && rawUserVal.includes("@") ? rawUserVal : "") ||
        (rawWorkerVal && rawWorkerVal.includes("@") ? rawWorkerVal : "") ||
        f["UserEmail"] ||
        f["Email"] ||
        createdByEmail ||
        "";

      const employeeName = resolveEffectiveName(
        rawWorkerVal || (rawUserVal && !rawUserVal.includes("@") ? rawUserVal : "") || createdByName,
        employeeEmail
      );

      // Extract Start Time & End Time
      let startTime = String(f[columnMap["startTime"] || ""] || f["שעתהתחלה"] || f["startTime"] || "").trim();
      let endTime = String(f[columnMap["endTime"] || ""] || f["שעתסיום"] || f["endTime"] || "").trim();
      if (startTime.includes("T")) {
        const m = startTime.match(/T(\d{2}:\d{2})/);
        if (m) startTime = m[1];
      }
      if (endTime.includes("T")) {
        const m = endTime.match(/T(\d{2}:\d{2})/);
        if (m) endTime = m[1];
      }

      // Extract Date with comprehensive parser supporting DD/MM/YYYY, ISO, etc.
      const rawDateVal =
        f[columnMap["date"] || ""] ||
        f["_x05ea__x05d0__x05e8__x05d9__x05da_"] ||
        f["תאריך"] ||
        f["date"] ||
        f["Date"] ||
        item.createdDateTime ||
        "";
      const date = parseSharePointItemDate(rawDateVal, item.createdDateTime);

      // Extract Duration
      let rawDur =
        f[columnMap["duration"] || ""] ||
        f["_x05db__x05de__x05d4__x05d6__x05de__x05df__x05d4__x05d5__x05e9__x05e7__x05e2_"] ||
        f["כמהזמנהושקע"] ||
        f["שעות"] ||
        f["duration"] ||
        f["hours"];
      let durationHours = 0;
      if (typeof rawDur === "number") {
        durationHours = rawDur;
      } else if (typeof rawDur === "string" && rawDur.includes(":")) {
        const [dh, dm] = rawDur.trim().split(":").map(Number);
        if (!isNaN(dh)) durationHours = Math.round((dh + (dm || 0) / 60) * 100) / 100;
      } else {
        durationHours = parseFloat(String(rawDur || "0"));
      }
      if (isNaN(durationHours) || durationHours <= 0) {
        if (startTime && endTime) {
          durationHours = calculateHoursFromTimes(startTime, endTime);
        } else {
          durationHours = 1.0;
        }
      }

      // Extract Description
      let description = extractRawWorkerVal(
        f[columnMap["description"] || ""] ||
        f["_x05de__x05d4_"] ||
        f["מהנעשה"] ||
        f["תיאור"] ||
        f["description"] ||
        f["Title"] ||
        ""
      );

      // Filter checks
      if (filterOptions?.date && date !== filterOptions.date) {
        continue;
      }
      if (filterOptions?.startDate && filterOptions?.endDate) {
        if (date < filterOptions.startDate || date > filterOptions.endDate) {
          continue;
        }
      }
      if (filterOptions?.customer) {
        const cLower = filterOptions.customer.toLowerCase();
        if (!customerName.toLowerCase().includes(cLower) && !description.toLowerCase().includes(cLower)) {
          continue;
        }
      }
      if (filterOptions?.employee || filterOptions?.employeeEmail) {
        if (!doesEmployeeMatchQuery(employeeName, employeeEmail, filterOptions.employee, filterOptions.employeeEmail)) {
          continue;
        }
      }
      if (filterOptions?.query) {
        const qLower = filterOptions.query.toLowerCase();
        const fullTxt = `${customerName} ${employeeName} ${employeeEmail} ${description} ${workType}`.toLowerCase();
        if (!fullTxt.includes(qLower)) {
          continue;
        }
      }

      const listBaseUrl = listInfo.webUrl || "https://techselectltd.sharepoint.com/sites/Customers/Lists/List";
      result.push({
        id: String(item.id),
        webUrl: item.webUrl || `${listBaseUrl}/DispForm.aspx?ID=${item.id}`,
        customerName: String(customerName).trim(),
        workType: String(workType).trim(),
        employeeName: String(employeeName).trim(),
        employeeEmail: String(employeeEmail).trim(),
        startTime: String(startTime).trim(),
        endTime: String(endTime).trim(),
        date,
        durationHours: Math.round(durationHours * 100) / 100,
        durationFormatted: `${Math.round(durationHours * 100) / 100} שעות`,
        description: String(description).trim(),
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
        rawFields: f,
      });
    }

    // Sort newest date first, then highest numeric ID first
    result.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    return result;
  } catch (err: any) {
    console.warn("[fetchSharePointListEntries] Error:", err);
    return [];
  }
}

export interface UserListsDayGroup {
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM/YYYY
  dayNameHe: string; // e.g. "יום שני"
  isToday: boolean;
  isYesterday: boolean;
  totalHours: number;
  entriesCount: number;
  customers: string[];
  entries: SharePointListEntry[];
}

export interface UserListsDailySummaryResult {
  employeeName: string;
  employeeEmail: string;
  todayDate: string;
  todayDisplayDate: string;
  todayHours: number;
  todayEntriesCount: number;
  todayEntries: SharePointListEntry[];
  weekHours: number;
  weekEntriesCount: number;
  monthHours: number;
  monthEntriesCount: number;
  totalHoursAllTime: number;
  totalEntriesAllTime: number;
  byDay: UserListsDayGroup[];
  availableEmployees: Array<{ name: string; email: string }>;
  listWebUrl: string;
}

function getIsraelDateIso(offsetDays = 0): string {
  try {
    const now = new Date();
    if (offsetDays !== 0) {
      now.setDate(now.getDate() + offsetDays);
    }
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value || String(now.getFullYear());
    const m = parts.find((p) => p.type === "month")?.value || String(now.getMonth() + 1).padStart(2, "0");
    const d = parts.find((p) => p.type === "day")?.value || String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    const d = new Date();
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  }
}

function formatIsoToDisplayDmy(iso: string): string {
  const parts = (iso || "").split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

function getHebrewDayOfWeek(iso: string): string {
  const daysHe = [
    "יום ראשון",
    "יום שני",
    "יום שלישי",
    "יום רביעי",
    "יום חמישי",
    "יום שישי",
    "יום שבת",
  ];
  try {
    const [y, m, d] = iso.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dt = new Date(y, m - 1, d);
      return daysHe[dt.getDay()] || "";
    }
  } catch {}
  return "";
}

/**
 * Queries Microsoft Lists directly and builds a per-day breakdown for the specified user
 * ("כמה תיעדתי היום" & כמה תיעד בכל יום לפי ה-LISTS)
 */
export async function getUserListsDailySummary(
  options: {
    employeeName?: string;
    employeeEmail?: string;
    top?: number;
  },
  env?: any
): Promise<UserListsDailySummaryResult> {
  const todayIso = getIsraelDateIso(0);
  const yesterdayIso = getIsraelDateIso(-1);
  const rawInputName = (options.employeeName || "").trim();
  const isGenericName = !rawInputName || rawInputName === "עובד" || rawInputName === "עובד מערכת" || rawInputName.toLowerCase() === "user";
  const effectiveEmail = (options.employeeEmail || "").trim();
  const effectiveEmployeeName = resolveEffectiveName(isGenericName ? "" : rawInputName, effectiveEmail);

  // Fetch all recent entries from Microsoft Lists so we can both filter for the user and list available employees
  const allEntries = await fetchSharePointListEntries(env, {
    top: options.top || 400,
  });

  // Also merge any dual-write entries from Central Log that might not yet be indexed by SharePoint Lists
  try {
    const centralRecords = queryCentralLog({ includeCancelled: false });
    for (const r of centralRecords) {
      const rId = r.sharepointListItemId || r.id;
      const alreadyExists = allEntries.some(
        (ae) =>
          ae.id === String(rId) ||
          (ae.date === r.date &&
            ae.customerName === r.customerName &&
            ae.description === r.description &&
            Math.abs(ae.durationHours - r.durationHours) < 0.05)
      );
      if (!alreadyExists) {
        allEntries.push({
          id: String(rId),
          webUrl: r.sharepointListWebUrl || "https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx",
          customerName: r.customerName,
          workType: r.workType,
          employeeName: resolveEffectiveName(r.employeeName, r.employeeEmail),
          employeeEmail: r.employeeEmail || "",
          startTime: r.startTime,
          endTime: r.endTime,
          date: r.date,
          durationHours: r.durationHours,
          durationFormatted: r.durationFormatted || `${r.durationHours} שעות`,
          description: r.description,
          createdDateTime: r.createdAt,
        });
      }
    }
  } catch {}

  // Filter entries belonging to this user
  const userEntries = allEntries.filter((entry) =>
    doesEmployeeMatchQuery(
      entry.employeeName,
      entry.employeeEmail,
      isGenericName ? effectiveEmployeeName : rawInputName,
      effectiveEmail
    )
  );

  // Calculate week start (Sunday of current week in Israel time) and month prefix
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const todayObj = new Date(ty, tm - 1, td);
  const sundayObj = new Date(todayObj);
  sundayObj.setDate(todayObj.getDate() - todayObj.getDay());
  const weekStartIso = `${sundayObj.getFullYear()}-${String(sundayObj.getMonth() + 1).padStart(2, "0")}-${String(sundayObj.getDate()).padStart(2, "0")}`;
  const monthPrefix = `${ty}-${String(tm).padStart(2, "0")}`;

  let todayHours = 0;
  let todayEntriesCount = 0;
  const todayEntries: SharePointListEntry[] = [];

  let weekHours = 0;
  let weekEntriesCount = 0;

  let monthHours = 0;
  let monthEntriesCount = 0;

  let totalHoursAllTime = 0;
  const dayMap = new Map<string, SharePointListEntry[]>();

  for (const entry of userEntries) {
    const d = entry.date || todayIso;
    const h = Number(entry.durationHours) || 0;

    totalHoursAllTime += h;

    if (d === todayIso) {
      todayHours += h;
      todayEntriesCount++;
      todayEntries.push(entry);
    }
    if (d >= weekStartIso && d <= todayIso) {
      weekHours += h;
      weekEntriesCount++;
    }
    if (d.startsWith(monthPrefix)) {
      monthHours += h;
      monthEntriesCount++;
    }

    if (!dayMap.has(d)) {
      dayMap.set(d, []);
    }
    dayMap.get(d)!.push(entry);
  }

  // Ensure Today is always represented in byDay even if 0 entries so user clearly sees Today's status
  if (!dayMap.has(todayIso)) {
    dayMap.set(todayIso, []);
  }

  const sortedDates = Array.from(dayMap.keys()).sort((a, b) => b.localeCompare(a));

  const byDay: UserListsDayGroup[] = sortedDates.map((dateIso) => {
    const entriesForDay = dayMap.get(dateIso) || [];
    const dayHours = Math.round(entriesForDay.reduce((acc, e) => acc + (Number(e.durationHours) || 0), 0) * 100) / 100;
    const customers = Array.from(
      new Set(entriesForDay.map((e) => e.customerName).filter(Boolean))
    );

    return {
      date: dateIso,
      displayDate: formatIsoToDisplayDmy(dateIso),
      dayNameHe: getHebrewDayOfWeek(dateIso),
      isToday: dateIso === todayIso,
      isYesterday: dateIso === yesterdayIso,
      totalHours: dayHours,
      entriesCount: entriesForDay.length,
      customers,
      entries: entriesForDay,
    };
  });

  // Collect available employees from KNOWN_TEAM_MEMBERS + any extra names seen in Lists
  const empMap = new Map<string, { name: string; email: string }>();
  for (const tm of KNOWN_TEAM_MEMBERS) {
    empMap.set(tm.name, { name: tm.name, email: tm.email });
  }
  for (const e of allEntries) {
    const canon = resolveEffectiveName(e.employeeName, e.employeeEmail);
    if (canon && canon !== "עובד" && !empMap.has(canon)) {
      empMap.set(canon, { name: canon, email: e.employeeEmail || "" });
    }
  }

  let listWebUrl = "https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx";
  try {
    const info = await resolveSharePointList(env);
    if (info.webUrl) listWebUrl = info.webUrl;
  } catch {}

  return {
    employeeName: effectiveEmployeeName,
    employeeEmail: effectiveEmail,
    todayDate: todayIso,
    todayDisplayDate: formatIsoToDisplayDmy(todayIso),
    todayHours: Math.round(todayHours * 100) / 100,
    todayEntriesCount,
    todayEntries,
    weekHours: Math.round(weekHours * 100) / 100,
    weekEntriesCount,
    monthHours: Math.round(monthHours * 100) / 100,
    monthEntriesCount,
    totalHoursAllTime: Math.round(totalHoursAllTime * 100) / 100,
    totalEntriesAllTime: userEntries.length,
    byDay,
    availableEmployees: Array.from(empMap.values()),
    listWebUrl,
  };
}
