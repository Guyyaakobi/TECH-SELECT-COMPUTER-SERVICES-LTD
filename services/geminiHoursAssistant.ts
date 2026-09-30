import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import {
  findCustomer,
  findMonthTarget,
  readSheetStructure,
  findDuplicates,
  writeRows,
  undoRow,
  CustomerFolder,
} from "./graphHours";
import { AuthenticatedUser } from "../server/hoursAuthMiddleware";

export interface HoursAssistantEntryDraft {
  id: string; // card unique ID
  customerName: string;
  customerFolder?: string;
  fileId?: string;
  fileName?: string;
  filePath?: string;
  webUrl?: string;
  targetRow?: number | string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  durationMinutes: number; // e.g. 15, 30, 45, 60
  durationHours: number; // e.g. 0.25, 0.5, 0.75, 1.0
  durationFormatted: string; // e.g. "15 דקות (0.25 שעה)"
  startTime?: string;
  endTime?: string;
  workType: "טלפון" | "שלט רחוק" | "באתר";
  contactPerson?: string;
  ticketNumber?: string;
  description: string;
  duplicateWarning?: string | null;
  isReadyForConfirmation: boolean;
  missingFields?: string[];
  mappedRow?: Record<string, any>;
}

export interface WrittenEntryResult {
  id: string;
  fileId: string;
  fileName: string;
  filePath: string;
  webUrl: string;
  targetRow: number | string;
  rowAddress: string;
  entryId: string;
  customerName: string;
  date: string;
  durationFormatted: string;
  description: string;
  workType: string;
  writtenAt: number;
  expiresAt: number; // 10 minutes
  canUndo: boolean;
}

export interface AssistantChatParams {
  user: AuthenticatedUser;
  message?: string;
  audio?: {
    data: string; // base64
    mimeType: string;
  };
  history?: Array<{
    role: "user" | "model";
    text: string;
    cards?: any[];
  }>;
  action?: "confirm_entry" | "confirm_all" | "undo_entry" | "edit_draft";
  cardId?: string;
  draftData?: any;
  activeDrafts?: HoursAssistantEntryDraft[];
  env?: any;
}

export interface AssistantChatResult {
  reply: string;
  transcript?: string;
  drafts: HoursAssistantEntryDraft[];
  writtenEntries: WrittenEntryResult[];
  undoneCardIds: string[];
  isConfirmed: boolean;
  suggestedAction?: "confirm" | "clarify" | "undo" | "none";
}

// In-memory store for written entries eligible for 10-minute undo in the session
const sessionWrittenEntries = new Map<string, WrittenEntryResult>();

// Clean up expired entries lazily during request execution (avoids global scope timers in Cloudflare Workers)
function cleanExpiredEntries(): void {
  const now = Date.now();
  for (const [key, val] of sessionWrittenEntries.entries()) {
    if (val.expiresAt < now) {
      sessionWrittenEntries.delete(key);
    }
  }
}

/**
 * Format today's date and context in Asia/Jerusalem
 */
function getJerusalemContext(): {
  nowIso: string;
  todayIso: string;
  yesterdayIso: string;
  todayHebrew: string;
  currentYear: number;
  currentMonth: number;
  lastMonthYear: number;
  lastMonth: number;
  fullDateDescription: string;
} {
  const now = new Date();
  const jerusalemStr = now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
  const jDate = new Date(jerusalemStr);

  const currentYear = jDate.getFullYear();
  const currentMonth = jDate.getMonth() + 1;
  const currentDay = jDate.getDate();

  const mm = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
  const dd = currentDay < 10 ? `0${currentDay}` : `${currentDay}`;
  const todayIso = `${currentYear}-${mm}-${dd}`;

  // Yesterday
  const yDate = new Date(jDate.getTime() - 24 * 60 * 60 * 1000);
  const yYear = yDate.getFullYear();
  const yMonth = yDate.getMonth() + 1;
  const yDay = yDate.getDate();
  const ymm = yMonth < 10 ? `0${yMonth}` : `${yMonth}`;
  const ydd = yDay < 10 ? `0${yDay}` : `${yDay}`;
  const yesterdayIso = `${yYear}-${ymm}-${ydd}`;

  // Last Month
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 1) {
    lastMonth = 12;
    lastMonthYear = currentYear - 1;
  }

  const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const dayOfWeekName = daysOfWeek[jDate.getDay()];
  const todayHebrew = `${dd}/${mm}/${currentYear}`;

  const fullDateDescription = `היום: יום ${dayOfWeekName}, ${todayHebrew} (${todayIso}), שעון ישראל (Asia/Jerusalem). אתמול: ${yesterdayIso}. חודש שעבר: ${lastMonthYear}-${lastMonth < 10 ? "0" + lastMonth : lastMonth}.`;

  return {
    nowIso: now.toISOString(),
    todayIso,
    yesterdayIso,
    todayHebrew,
    currentYear,
    currentMonth,
    lastMonthYear,
    lastMonth,
    fullDateDescription,
  };
}

/**
 * Rounds duration string or number to 15-minute increments
 */
export function roundToQuarterHour(input: string | number): {
  minutes: number;
  hours: number;
  formatted: string;
} {
  let minutes = 15;

  if (typeof input === "number") {
    if (input <= 8) {
      // treat as decimal hours (e.g. 0.25, 0.5, 1)
      minutes = Math.round((input * 60) / 15) * 15;
    } else {
      minutes = Math.round(input / 15) * 15;
    }
  } else if (typeof input === "string") {
    const s = input.trim().toLowerCase();
    if (s.includes("רבע שעה") || s === "15" || s.includes("15 דק")) {
      minutes = 15;
    } else if (s.includes("חצי שעה") || s === "30" || s.includes("30 דק") || s.includes("חצי")) {
      minutes = 30;
    } else if (s.includes("שלושת רבעי") || s === "45" || s.includes("45 דק")) {
      minutes = 45;
    } else if (s === "שעה" || s === "60" || s.includes("שעה אחת") || s === "1") {
      minutes = 60;
    } else if (s.includes("שעה וחצי") || s === "90") {
      minutes = 90;
    } else if (s.includes("שעתיים") || s === "120") {
      minutes = 120;
    } else {
      // Look for numbers like "20 דקות", "40 דקות", "0.5", "1.5"
      const decimalMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:שעות|שעה|h|hours)?$/);
      if (decimalMatch && parseFloat(decimalMatch[1]) <= 12) {
        minutes = Math.round((parseFloat(decimalMatch[1]) * 60) / 15) * 15;
      } else {
        const minMatch = s.match(/(\d+)\s*(?:דקות|דק|min|m)/);
        if (minMatch) {
          const rawM = parseInt(minMatch[1], 10);
          minutes = Math.round(rawM / 15) * 15;
        } else {
          const numMatch = s.match(/(\d+(?:\.\d+)?)/);
          if (numMatch) {
            const val = parseFloat(numMatch[1]);
            if (val <= 8) {
              minutes = Math.round((val * 60) / 15) * 15;
            } else {
              minutes = Math.round(val / 15) * 15;
            }
          }
        }
      }
    }
  }

  if (minutes < 15) minutes = 15;
  const hours = parseFloat((minutes / 60).toFixed(2));
  const formatted = `${minutes} דקות (${hours} ${hours === 1 ? "שעה" : "שעות"})`;

  return { minutes, hours, formatted };
}

/**
 * Infer Work Type
 */
export function inferWorkType(text: string): "טלפון" | "שלט רחוק" | "באתר" {
  if (!text) return "טלפון";
  const s = text.toLowerCase();
  if (
    s.includes("שלט רחוק") ||
    s.includes("מרחוק") ||
    s.includes("התחברתי") ||
    s.includes("שליטה") ||
    s.includes("אנידסק") ||
    s.includes("anydesk") ||
    s.includes("teamviewer") ||
    s.includes("השתלטתי")
  ) {
    return "שלט רחוק";
  }
  if (
    s.includes("באתר") ||
    s.includes("הגעתי") ||
    s.includes("נסעתי") ||
    s.includes("ביקור") ||
    s.includes("במשרד") ||
    s.includes("אצל הלקוח") ||
    s.includes("פיזית")
  ) {
    return "באתר";
  }
  return "טלפון";
}

/**
 * Main Assistant Chat Processor
 */
export async function processAssistantChat(
  params: AssistantChatParams,
  env?: any
): Promise<AssistantChatResult> {
  cleanExpiredEntries();
  const activeEnv = env || process.env;
  const { user, message, audio, history = [], action, cardId, activeDrafts = [] } = params;

  // 1. Direct Action: Undo written entry
  if (action === "undo_entry" && cardId) {
    const existing = sessionWrittenEntries.get(cardId);
    if (!existing) {
      return {
        reply: "לא נמצאה רשומה לביטול או שחלפו יותר מ-10 דקות.",
        drafts: activeDrafts,
        writtenEntries: Array.from(sessionWrittenEntries.values()),
        undoneCardIds: [],
        isConfirmed: false,
      };
    }
    const undoRes = await undoRow(existing.fileId, existing.rowAddress, user, activeEnv);
    sessionWrittenEntries.delete(cardId);
    return {
      reply: `הרשומה עבור ${existing.customerName} בוטלה בהצלחה ונמחקה מקובץ ה-Excel.`,
      drafts: activeDrafts,
      writtenEntries: Array.from(sessionWrittenEntries.values()),
      undoneCardIds: [cardId],
      isConfirmed: false,
    };
  }

  // 2. Direct Action: Confirm specific entry via UI button "אשר והזן"
  if (action === "confirm_entry" && cardId) {
    const targetDraft = activeDrafts.find((d) => d.id === cardId);
    if (!targetDraft) {
      return {
        reply: "לא נמצאה טיוטה להזנה.",
        drafts: activeDrafts,
        writtenEntries: Array.from(sessionWrittenEntries.values()),
        undoneCardIds: [],
        isConfirmed: false,
      };
    }

    if (!targetDraft.fileId) {
      // Find month target
      const mt = await findMonthTarget(targetDraft.customerFolder || targetDraft.customerName, targetDraft.date, activeEnv);
      if (!mt.found || !mt.fileId) {
        return {
          reply: `לא נמצא קובץ שעות עבור ${targetDraft.customerName} לחודש המבוקש.`,
          drafts: activeDrafts,
          writtenEntries: Array.from(sessionWrittenEntries.values()),
          undoneCardIds: [],
          isConfirmed: false,
        };
      }
      targetDraft.fileId = mt.fileId;
      targetDraft.fileName = mt.fileName;
      targetDraft.filePath = mt.filePath;
      targetDraft.webUrl = mt.webUrl;
    }

    // Prepare row object
    const rowPayload = targetDraft.mappedRow || {
      תאריך: targetDraft.date,
      עובד: user.name,
      משך: targetDraft.durationHours,
      "סוג עבודה": targetDraft.workType,
      תיאור: targetDraft.description,
    };

    const writeRes = await writeRows(targetDraft.fileId, [rowPayload], user, activeEnv);
    const rowNumMatch = (writeRes.rowAddress || "").match(/\d+/);
    const targetRow = rowNumMatch ? parseInt(rowNumMatch[0], 10) : 1;

    const writtenItem: WrittenEntryResult = {
      id: targetDraft.id,
      fileId: targetDraft.fileId,
      fileName: targetDraft.fileName || "hours.xlsx",
      filePath: targetDraft.filePath || "",
      webUrl: writeRes.webUrl || targetDraft.webUrl || "",
      targetRow,
      rowAddress: writeRes.rowAddress || `Row ${targetRow}`,
      entryId: writeRes.entryId || targetDraft.id,
      customerName: targetDraft.customerName,
      date: targetDraft.date,
      durationFormatted: targetDraft.durationFormatted,
      description: targetDraft.description,
      workType: targetDraft.workType,
      writtenAt: writeRes.timestamp || Date.now(),
      expiresAt: (writeRes.timestamp || Date.now()) + 10 * 60 * 1000,
      canUndo: true,
    };

    sessionWrittenEntries.set(targetDraft.id, writtenItem);
    const remainingDrafts = activeDrafts.filter((d) => d.id !== cardId);

    return {
      reply: `נרשם בהצלחה ✓ השורה נוספה לקובץ ${targetDraft.fileName || ""} בשורה ${writtenItem.targetRow}.`,
      drafts: remainingDrafts,
      writtenEntries: [writtenItem, ...Array.from(sessionWrittenEntries.values()).filter((w) => w.id !== writtenItem.id)],
      undoneCardIds: [],
      isConfirmed: true,
    };
  }

  // 3. Initialize Gemini Client Server-Side
  const apiKey = activeEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("משתנה סביבה GEMINI_API_KEY חסר בשרת.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const jCtx = getJerusalemContext();

  // Assistant Tools
  const toolDeclarations: FunctionDeclaration[] = [
    {
      name: "find_customer",
      description: "Search SharePoint customer folders by fuzzy name matching. Returns matching customers with score, folder path, and ambiguity status.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: "Customer name or partial name in Hebrew or English (e.g., 'כהן', 'אלקטרה', 'גולד')",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "find_month_target",
      description: "Locate the Excel hours file for a customer for a given month/date (e.g. '2026-09' or '2026-09-30'). Returns fileId, fileName, webUrl, and parentPath.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerFolderName: {
            type: Type.STRING,
            description: "Exact customer name or folder name returned by find_customer",
          },
          date: {
            type: Type.STRING,
            description: "Date in YYYY-MM-DD, YYYY-MM, or DD/MM/YYYY format",
          },
        },
        required: ["customerFolderName", "date"],
      },
    },
    {
      name: "read_sheet_structure",
      description: "Read table structure, column headers, and next empty row index from the customer Excel file to format row columns properly.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          fileId: {
            type: Type.STRING,
            description: "The fileId of the target Excel file",
          },
        },
        required: ["fileId"],
      },
    },
    {
      name: "find_duplicates",
      description: "Check if an entry for this employee on this date (and start/duration) already exists in the target file. Always call before asking confirmation.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          fileId: {
            type: Type.STRING,
            description: "The fileId of the target Excel file",
          },
          date: {
            type: Type.STRING,
            description: "Date of entry (YYYY-MM-DD or DD/MM/YYYY)",
          },
          start: {
            type: Type.STRING,
            description: "Optional start time e.g. '14:00'",
          },
          duration: {
            type: Type.STRING,
            description: "Optional duration e.g. '0.25' or '15 דקות'",
          },
        },
        required: ["fileId", "date"],
      },
    },
    {
      name: "propose_entries",
      description: "Propose or update structured entry drafts to display as summary cards to the employee. Call this when you have extracted details before asking confirmation.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          entries: {
            type: Type.ARRAY,
            description: "List of entries extracted from the employee's request",
            items: {
              type: Type.OBJECT,
              properties: {
                customerName: { type: Type.STRING, description: "Customer name" },
                date: { type: Type.STRING, description: "Date in YYYY-MM-DD or DD/MM/YYYY" },
                duration: { type: Type.STRING, description: "Duration e.g. '15 דקות' / '0.25 שעה'" },
                workType: { type: Type.STRING, description: "Work type: 'טלפון' | 'שלט רחוק' | 'באתר'" },
                description: { type: Type.STRING, description: "Professional short Hebrew billing description" },
                startTime: { type: Type.STRING, description: "Optional start time" },
                contactPerson: { type: Type.STRING, description: "Optional contact person" },
                ticketNumber: { type: Type.STRING, description: "Optional ticket number" },
                isReady: { type: Type.BOOLEAN, description: "True if customer, date, duration, description are all present" },
                missingFields: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of missing mandatory fields if any: ['לקוח', 'תאריך', 'משך', 'תיאור']",
                },
              },
              required: ["customerName", "date", "description", "workType"],
            },
          },
        },
        required: ["entries"],
      },
    },
    {
      name: "write_rows",
      description: "CRITICAL: Write rows to the Excel sheet. NEVER CALL THIS TOOL BEFORE THE USER HAS EXPLICITLY CONFIRMED (e.g., 'כן', 'מאשר', 'תזין', 'אשר והזן').",
      parameters: {
        type: Type.OBJECT,
        properties: {
          fileId: { type: Type.STRING, description: "Target file ID" },
          rows: {
            type: Type.ARRAY,
            description: "Array of row objects with keys matching Excel column headers",
            items: { type: Type.OBJECT },
          },
        },
        required: ["fileId", "rows"],
      },
    },
    {
      name: "undo_row",
      description: "Undo and cancel a row written in the last 10 minutes.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          fileId: { type: Type.STRING, description: "Target file ID" },
          rowAddress: { type: Type.STRING, description: "Row address or entry ID to undo" },
        },
        required: ["fileId", "rowAddress"],
      },
    },
  ];

  // System Instruction
  const systemInstruction = `You are a work-hours logging assistant for Tech-Select employees. Speak short, practical Hebrew.
Most entries are phone calls with customers, also remote sessions and on-site visits.

CURRENT SYSTEM CONTEXT:
- ${jCtx.fullDateDescription}
- Employee name: "${user.name}". Employee email: "${user.email}".
- The employee name comes STRICTLY from the signed-in user. NEVER ask for employee name under any circumstances.

EXTRACTION RULES:
- The employee may describe one OR several entries in one message (even a whole day).
- Extract per entry:
  1. Date: default today (${jCtx.todayIso}, Asia/Jerusalem). Understand "אתמול" (${jCtx.yesterdayIso}), "ביום ראשון", "שלשום", or explicit dates. If last month is mentioned (e.g. August, "חודש שעבר"), target last month's file (${jCtx.lastMonthYear}-${jCtx.lastMonth < 10 ? "0" + jCtx.lastMonth : jCtx.lastMonth}).
  2. Customer: call find_customer. If customer match is ambiguous (multiple options with close scores), ask the employee to choose between the options.
  3. Duration: round to 15 minutes (15 min = 0.25h, 30 min = 0.5h, 45 min = 0.75h, 60 min = 1h). If missing, ask for it!
  4. Work type: "טלפון" / "שלט רחוק" / "באתר" – infer from wording (e.g. "דיברתי", "שיחה" -> טלפון; "התחברתי", "שליטה מרחוק", "AnyDesk" -> שלט רחוק; "ביקור", "הייתי אצל", "באתר" -> באתר).
  5. Description: rewrite as a short, clear, professional Hebrew sentence suitable for billing, faithful to what was said. Do not invent details.
  6. Contact person at customer (optional).
  7. Ticket number (optional).

MANDATORY WORKFLOW:
1. Ask ONLY for missing mandatory fields (customer, date, duration, description) – all in ONE question.
2. For each identified customer, call find_month_target with the customer name and entry date.
3. Call read_sheet_structure to inspect existing columns and formats.
4. Call find_duplicates to check for existing rows for this employee/date. If duplicates are found, warn the user clearly.
5. Call propose_entries with the extracted details so summary cards appear in the UI.
6. Show the summary and ask "מאשר להזין?".
7. CRITICAL RULE: NEVER call write_rows before explicit confirmation from the employee (such as "אשר והזן", "כן", "מאשר", "תזין", "מאשרת").
8. Accept corrections in free speech ("תשנה לחצי שעה", "זה היה אצל אלקטרה") and show the summary again.
9. When the user confirms ("כן", "מאשר", "תזין"), call write_rows, then state "נרשם ✓" with target file and row.
10. If audio is provided: Your first line MUST be the exact Hebrew transcript:
[תמלול]: <התמלול המדויק בעברית>
followed by your natural Hebrew response or tool calls.`;

  // Build Conversation Contents for Gemini
  const contents: any[] = [];

  // Append history
  for (const h of history) {
    if (h.role === "user" || h.role === "model") {
      contents.push({
        role: h.role,
        parts: [{ text: h.text }],
      });
    }
  }

  // Active drafts context if present
  let activeDraftsPrompt = "";
  if (activeDrafts.length > 0) {
    activeDraftsPrompt = `\n[טיוטות פתוחות בממשק כרגע: ${JSON.stringify(
      activeDrafts.map((d) => ({
        id: d.id,
        customerName: d.customerName,
        date: d.date,
        duration: d.durationFormatted,
        workType: d.workType,
        description: d.description,
        fileId: d.fileId,
        fileName: d.fileName,
        targetRow: d.targetRow,
        isReady: d.isReadyForConfirmation,
      }))
    )}]`;
  }

  // Build current user message parts
  const currentParts: any[] = [];
  if (audio && audio.data) {
    currentParts.push({
      inlineData: {
        mimeType: audio.mimeType || "audio/webm",
        data: audio.data,
      },
    });
    currentParts.push({
      text: `הקלטת קול מהעובד. תמלל במדויק בקו [תמלול]: ... ופעל לפיה.${activeDraftsPrompt}`,
    });
  } else {
    currentParts.push({
      text: `${message || ""}${activeDraftsPrompt}`,
    });
  }

  contents.push({
    role: "user",
    parts: currentParts,
  });

  // Track state across tool calls
  let collectedDrafts: HoursAssistantEntryDraft[] = [...activeDrafts];
  const newWrittenEntries: WrittenEntryResult[] = [];
  let userTranscript: string | undefined = undefined;
  let isConfirmed = false;

  // Tool execution loop (max 7 iterations)
  let loopCount = 0;
  let finalResponseText = "";

  while (loopCount < 7) {
    loopCount++;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content) {
      contents.push(candidate.content);
    }

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      finalResponseText = response.text || "";
      break;
    }

    // Execute tool calls
    for (const call of calls) {
      const { name, args } = call;
      let toolResult: any = {};

      try {
        if (name === "find_customer") {
          const query = String(args.query || "");
          const matches = await findCustomer(query, activeEnv);
          const topMatches = matches.slice(0, 5).map((m) => ({
            name: m.customer.name,
            webUrl: m.customer.webUrl,
            driveId: m.customer.driveId,
            score: m.score,
            matchReason: m.matchReason,
          }));

          const isAmbiguous =
            topMatches.length > 1 &&
            topMatches[0].score < 0.95 &&
            topMatches[1].score > 0.4 &&
            Math.abs(topMatches[0].score - topMatches[1].score) < 0.2;

          toolResult = {
            query,
            isAmbiguous,
            matches: topMatches,
            bestMatch: topMatches[0] || null,
          };
        } else if (name === "find_month_target") {
          const customerFolderName = String(args.customerFolderName || "");
          const date = String(args.date || jCtx.todayIso);
          const target = await findMonthTarget(customerFolderName, date, activeEnv);
          toolResult = target;
        } else if (name === "read_sheet_structure") {
          const fileId = String(args.fileId || "");
          const structure = await readSheetStructure(fileId, activeEnv);
          toolResult = structure;
        } else if (name === "find_duplicates") {
          const fileId = String(args.fileId || "");
          const date = String(args.date || jCtx.todayIso);
          const dupRes = await findDuplicates(
            fileId,
            {
              employee: user.name,
              date,
              start: typeof args.start === "string" ? args.start : undefined,
              duration: typeof args.duration === "string" ? args.duration : undefined,
            },
            activeEnv
          );
          toolResult = dupRes;
        } else if (name === "propose_entries") {
          const rawEntries: any[] = Array.isArray(args.entries) ? args.entries : [];
          const enriched: HoursAssistantEntryDraft[] = [];

          for (const raw of rawEntries) {
            const customerName = String(raw.customerName || "").trim();
            const date = String(raw.date || jCtx.todayIso).trim();
            const rawDuration = raw.duration || "";
            const { minutes, hours, formatted } = roundToQuarterHour(rawDuration);
            const workType = (raw.workType as any) || inferWorkType(raw.description || "");
            const desc = String(raw.description || "").trim();

            const missingFields: string[] = [];
            if (!customerName) missingFields.push("לקוח");
            if (!date) missingFields.push("תאריך");
            if (!rawDuration && !minutes) missingFields.push("משך");
            if (!desc) missingFields.push("תיאור");

            const isReady = missingFields.length === 0;
            const draftId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

            // Auto-enrich target month file and duplicates if possible
            let fileId: string | undefined = undefined;
            let fileName: string | undefined = undefined;
            let filePath: string | undefined = undefined;
            let webUrl: string | undefined = undefined;
            let targetRow: number | string | undefined = undefined;
            let duplicateWarning: string | null = null;
            let mappedRow: Record<string, any> | undefined = undefined;

            try {
              if (customerName) {
                const mt = await findMonthTarget(customerName, date, activeEnv);
                if (mt.found && mt.fileId) {
                  fileId = mt.fileId;
                  fileName = mt.fileName;
                  filePath = mt.filePath;
                  webUrl = mt.webUrl;

                  const struct = await readSheetStructure(fileId, activeEnv);
                  const rowNumMatch = (struct.nextEmptyRowAddress || "").match(/\d+/);
                  targetRow = rowNumMatch ? parseInt(rowNumMatch[0], 10) : struct.totalDataRows + 2;

                  // Check duplicates
                  const dup = await findDuplicates(fileId, { employee: user.name, date }, activeEnv);
                  if (dup.hasDuplicates) {
                    duplicateWarning = `נמצאו ${dup.duplicates.length} דיווחים קודמים עבורך בתאריך זה (${date})`;
                  }

                  mappedRow = {
                    תאריך: date,
                    עובד: user.name,
                    משך: hours,
                    "סוג עבודה": workType,
                    תיאור: desc,
                  };
                }
              }
            } catch (enrichErr) {
              console.warn("[propose_entries] auto-enrich error:", enrichErr);
            }

            enriched.push({
              id: draftId,
              customerName,
              customerFolder: customerName,
              fileId,
              fileName,
              filePath,
              webUrl,
              targetRow,
              date,
              durationMinutes: minutes,
              durationHours: hours,
              durationFormatted: formatted,
              startTime: raw.startTime,
              contactPerson: raw.contactPerson,
              ticketNumber: raw.ticketNumber,
              workType,
              description: desc,
              duplicateWarning,
              isReadyForConfirmation: isReady,
              missingFields,
              mappedRow,
            });
          }

          collectedDrafts = enriched;
          toolResult = {
            success: true,
            count: enriched.length,
            entries: enriched,
          };
        } else if (name === "write_rows") {
          const fileId = String(args.fileId || "");
          const rows: any[] = Array.isArray(args.rows) ? args.rows : [];
          const writeRes = await writeRows(fileId, rows, user, activeEnv);

          isConfirmed = true;
          const rowNumMatch = (writeRes.rowAddress || "").match(/\d+/);
          const targetRow = rowNumMatch ? parseInt(rowNumMatch[0], 10) : 1;

          // Create written entry records
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const writtenItem: WrittenEntryResult = {
              id: `written_${Date.now()}_${i}`,
              fileId,
              fileName: "hours.xlsx",
              filePath: "",
              webUrl: writeRes.webUrl || "",
              targetRow,
              rowAddress: writeRes.rowAddress || `Row ${targetRow}`,
              entryId: writeRes.entryId || `entry_${Date.now()}`,
              customerName: r.customer || r.לקוח || "לקוח",
              date: r.date || r.תאריך || jCtx.todayIso,
              durationFormatted: `${r.hours || r.משך || r.שעות || ""} שעות`,
              description: r.description || r.תיאור || "",
              workType: r.workType || r["סוג עבודה"] || "טלפון",
              writtenAt: writeRes.timestamp || Date.now(),
              expiresAt: (writeRes.timestamp || Date.now()) + 10 * 60 * 1000,
              canUndo: true,
            };
            sessionWrittenEntries.set(writtenItem.id, writtenItem);
            newWrittenEntries.push(writtenItem);
          }

          collectedDrafts = [];
          toolResult = {
            success: true,
            writeRes,
          };
        } else if (name === "undo_row") {
          const fileId = String(args.fileId || "");
          const rowAddress = String(args.rowAddress || "");
          const undoRes = await undoRow(fileId, rowAddress, user, activeEnv);
          toolResult = undoRes;
        }
      } catch (toolErr: any) {
        console.error(`[Assistant Tool ${name}] Error:`, toolErr);
        toolResult = { error: toolErr?.message || "Tool execution failed" };
      }

      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name,
              response: toolResult,
            },
          },
        ],
      });
    }
  }

  // Parse [תמלול]: ... if audio was sent
  let cleanReply = finalResponseText.trim();
  const transcriptMatch = cleanReply.match(/^\[תמלול\]:\s*(.+)$/m);
  if (transcriptMatch) {
    userTranscript = transcriptMatch[1].trim();
    cleanReply = cleanReply.replace(/^\[תמלול\]:\s*.+$/m, "").trim();
  }

  return {
    reply: cleanReply,
    transcript: userTranscript,
    drafts: collectedDrafts,
    writtenEntries:
      newWrittenEntries.length > 0
        ? newWrittenEntries
        : Array.from(sessionWrittenEntries.values()),
    undoneCardIds: [],
    isConfirmed,
    suggestedAction: isConfirmed
      ? "none"
      : collectedDrafts.some((d) => d.isReadyForConfirmation)
      ? "confirm"
      : "clarify",
  };
}
