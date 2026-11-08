import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  Edit3,
  Undo2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Phone,
  Laptop,
  MapPin,
  Sparkles,
  Ticket,
  FolderKanban,
  Check,
  RefreshCw,
  FolderOpen,
  User,
  Users,
  Plus,
  Search,
} from "lucide-react";
import {
  HoursAssistantEntryDraft,
  WrittenEntryResult,
  apiFindMonthTarget,
  apiListCustomers,
  getCustomStoredEmployees,
} from "../../services/hoursApiClient";

interface HoursEntryCardProps {
  draft?: HoursAssistantEntryDraft;
  written?: WrittenEntryResult;
  currentUser?: {
    name?: string;
    email?: string;
    id?: string;
    oid?: string;
    username?: string;
    upn?: string;
    isAdmin?: boolean;
  };
  onConfirm?: (cardId: string, directDraft?: HoursAssistantEntryDraft) => void;
  onUndo?: (cardId: string, entry?: WrittenEntryResult) => void;
  onUpdateDraft?: (updated: HoursAssistantEntryDraft) => void;
  onEditWritten?: (
    cardId: string,
    entry: WrittenEntryResult,
    updates: {
      customerName?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      durationHours?: number;
      durationMinutes?: number;
      durationFormatted?: string;
      description?: string;
      workType?: string;
    }
  ) => Promise<void> | void;
  isConfirming?: boolean;
  isUndoing?: boolean;
  isSavingWrittenEdit?: boolean;
}

const PRESET_TEAM_MEMBERS = [
  "גיא יעקובי",
  "ודים",
  "ניב בורו",
  "תבור כהן",
  "אירית יעקובי",
  "יוסף",
  "אולג",
  "אריאל",
  "אוריאל",
  "ולד",
  "אמיר",
  "שי",
];

const PRESET_EMPLOYEE_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: "גיא יעקובי", aliases: ["גיא יעקובי", "גיא", "guy yaakobi", "guy"] },
  { canonical: "ודים", aliases: ["ודים", "ואדים", "vadim"] },
  { canonical: "ניב בורו", aliases: ["ניב בורו", "ניב", "niv boro", "niv"] },
  { canonical: "תבור כהן", aliases: ["תבור כהן", "תבור", "tavor cohen", "tavor"] },
  { canonical: "אירית יעקובי", aliases: ["אירית יעקובי", "אירית", "irit yaakobi", "irit"] },
  { canonical: "יוסף", aliases: ["יוסף", "יוסי", "yosef", "yossi"] },
  { canonical: "אולג", aliases: ["אולג", "oleg"] },
  { canonical: "אריאל", aliases: ["אריאל", "ariel"] },
  { canonical: "אוריאל", aliases: ["אוריאל", "uriel", "oriel"] },
  { canonical: "ולד", aliases: ["ולד", "ולאד", "ולדיסלב", "ולדימיר", "vlad", "vladislav", "vladimir"] },
  { canonical: "אמיר", aliases: ["אמיר", "amir"] },
  { canonical: "שי", aliases: ["שי", "shai", "shay"] },
];

function getAllTeamMembersList(): string[] {
  const custom = getCustomStoredEmployees();
  const merged = [...PRESET_TEAM_MEMBERS];
  for (const item of custom) {
    const name = typeof item === "string" ? item : item?.name;
    if (name && !merged.includes(name)) {
      merged.push(name);
    }
  }
  return merged;
}

export function matchPresetTeamMember(rawInput?: string): string | null {
  const clean = String(rawInput || "")
    .trim()
    .toLowerCase()
    .replace(/["'״׳]/g, "");
  if (!clean) return null;

  const customMembers = getCustomStoredEmployees();
  const dynamicAliases = [
    ...PRESET_EMPLOYEE_ALIASES,
    ...customMembers
      .map((m) => (typeof m === "string" ? { name: m, aliases: [] } : m))
      .filter((m) => m?.name && !PRESET_EMPLOYEE_ALIASES.some((p) => p.canonical === m.name))
      .map((m) => ({
        canonical: m.name,
        aliases: [
          m.name.toLowerCase(),
          m.name.split(/\s+/)[0]?.toLowerCase(),
          ...(Array.isArray(m.aliases) ? m.aliases.map((a) => a.toLowerCase()) : []),
        ].filter(Boolean),
      })),
  ];

  for (const item of dynamicAliases) {
    if (
      item.canonical.toLowerCase() === clean ||
      item.aliases.some((a) => a.toLowerCase() === clean)
    ) {
      return item.canonical;
    }
  }

  for (const item of dynamicAliases) {
    if (
      item.canonical.toLowerCase().includes(clean) ||
      item.aliases.some((a) => a.toLowerCase().includes(clean) || clean.includes(a.toLowerCase()))
    ) {
      return item.canonical;
    }
  }

  return null;
}

function sanitizePresetEmployees(
  list: string[] | undefined,
  fallbackUser?: string
): string[] {
  const matched: string[] = [];
  if (Array.isArray(list)) {
    for (const item of list) {
      const canonical = matchPresetTeamMember(item);
      if (canonical && !matched.includes(canonical)) {
        matched.push(canonical);
      }
    }
  }
  if (matched.length === 0) {
    const allMembers = getAllTeamMembersList();
    const fallbackCanonical = matchPresetTeamMember(fallbackUser) || allMembers[0];
    matched.push(fallbackCanonical);
  }
  return matched;
}

let cachedSharePointCustomers: Array<{ id: string; name: string; webUrl?: string }> | null = null;

// Helper to compute exact 24h times and duration
export function computeTimesAndDuration(
  startTimeStr?: string,
  endTimeStr?: string,
  fallbackDurationMinutes: number = 30
): {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  durationHours: number;
  durationFormatted: string;
} {
  const cleanStart = String(startTimeStr || "").trim();
  const cleanEnd = String(endTimeStr || "").trim();

  let sMins = -1;
  let eMins = -1;

  const mStart = cleanStart.match(/^(\d{1,2}):(\d{2})/);
  if (mStart) {
    sMins = parseInt(mStart[1], 10) * 60 + parseInt(mStart[2], 10);
  }

  const mEnd = cleanEnd.match(/^(\d{1,2}):(\d{2})/);
  if (mEnd) {
    eMins = parseInt(mEnd[1], 10) * 60 + parseInt(mEnd[2], 10);
  }

  let finalStart = cleanStart;
  let finalEnd = cleanEnd;
  let finalDiff = fallbackDurationMinutes || 30;

  if (sMins >= 0 && eMins >= 0) {
    let diff = eMins - sMins;
    if (diff <= 0) diff += 24 * 60; // crossed midnight or overnight
    finalDiff = Math.max(15, diff);
  } else if (sMins >= 0 && eMins < 0) {
    const endTotal = (sMins + finalDiff) % (24 * 60);
    const eh = Math.floor(endTotal / 60);
    const em = endTotal % 60;
    finalEnd = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  } else if (eMins >= 0 && sMins < 0) {
    let startTotal = eMins - finalDiff;
    if (startTotal < 0) startTotal += 24 * 60;
    const sh = Math.floor(startTotal / 60);
    const sm = startTotal % 60;
    finalStart = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
  }

  const durationHours = +(finalDiff / 60).toFixed(2);
  const dh = Math.floor(finalDiff / 60);
  const dm = finalDiff % 60;
  let durationFormatted = "";
  if (dh > 0 && dm > 0) {
    durationFormatted = `${dh}:${String(dm).padStart(2, "0")} שעות`;
  } else if (dh > 0) {
    durationFormatted = `${dh} ${dh === 1 ? "שעה" : "שעות"}`;
  } else {
    durationFormatted = `${dm} דקות`;
  }

  return {
    startTime: finalStart,
    endTime: finalEnd,
    durationMinutes: finalDiff,
    durationHours,
    durationFormatted,
  };
}

export const HoursEntryCard: React.FC<HoursEntryCardProps> = ({
  draft,
  written,
  currentUser,
  onConfirm,
  onUndo,
  onUpdateDraft,
  onEditWritten,
  isConfirming = false,
  isUndoing = false,
  isSavingWrittenEdit = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingWritten, setIsEditingWritten] = useState(false);
  const [writtenEditCustomer, setWrittenEditCustomer] = useState(written?.customerName || "");
  const [writtenEditStart, setWrittenEditStart] = useState(written?.startTime || "09:00");
  const [writtenEditEnd, setWrittenEditEnd] = useState(written?.endTime || "10:00");
  const [writtenEditDuration, setWrittenEditDuration] = useState(written?.durationFormatted || "1 שעה");
  const [writtenEditDescription, setWrittenEditDescription] = useState(written?.description || "");
  const [writtenEditDate, setWrittenEditDate] = useState(written?.date || "");
  const [writtenEditWorkType, setWrittenEditWorkType] = useState(written?.workType || "טיקטים");

  useEffect(() => {
    if (!written) return;
    setWrittenEditCustomer(written.customerName || "");
    setWrittenEditStart(written.startTime || "09:00");
    setWrittenEditEnd(written.endTime || "10:00");
    setWrittenEditDuration(written.durationFormatted || "1 שעה");
    setWrittenEditDescription(written.description || "");
    setWrittenEditDate(written.date || "");
    setWrittenEditWorkType(written.workType || "טיקטים");
  }, [
    written?.customerName,
    written?.startTime,
    written?.endTime,
    written?.durationFormatted,
    written?.description,
    written?.date,
    written?.workType,
  ]);
  const [editCustomer, setEditCustomer] = useState(draft?.customerName || "");
  const [editDate, setEditDate] = useState(draft?.date || "");
  const [editDuration, setEditDuration] = useState(draft?.durationFormatted || "");
  const [editStartTime, setEditStartTime] = useState(draft?.startTime || "");
  const [editEndTime, setEditEndTime] = useState(draft?.endTime || "");
  const [editWorkType, setEditWorkType] = useState<string>(
    draft?.targetTabName || draft?.workType || ""
  );
  const [editActivityType, setEditActivityType] = useState<string>(
    draft?.activityType || (draft?.workType && !["שעות", "Sheet1"].includes(draft.workType) ? draft.workType : "טיקטים")
  );
  const [editDescription, setEditDescription] = useState(draft?.description || "");
  const defaultEmployee = matchPresetTeamMember(currentUser?.name) || PRESET_TEAM_MEMBERS[0];
  const [editEmployees, setEditEmployees] = useState<string[]>(() =>
    sanitizePresetEmployees(draft?.assignedEmployees, defaultEmployee)
  );
  const [customEmployeeInput, setCustomEmployeeInput] = useState("");
  const [employeeLookupMessage, setEmployeeLookupMessage] = useState<string | null>(null);

  // Customer picker state
  const [customerList, setCustomerList] = useState<Array<{ id: string; name: string; webUrl?: string }>>(
    cachedSharePointCustomers || []
  );
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isResolvingCustomerFile, setIsResolvingCustomerFile] = useState(false);

  const loadSharePointCustomers = async (force = false) => {
    if (!force && cachedSharePointCustomers && cachedSharePointCustomers.length > 0) {
      setCustomerList(cachedSharePointCustomers);
      return;
    }
    setIsLoadingCustomers(true);
    try {
      const res = await apiListCustomers();
      if (res.customers && Array.isArray(res.customers)) {
        cachedSharePointCustomers = res.customers;
        setCustomerList(res.customers);
      }
    } catch (err) {
      console.warn("Failed to load SharePoint customers:", err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if ((isEditing || isEditingWritten) && customerList.length === 0 && !isLoadingCustomers) {
      loadSharePointCustomers();
    }
  }, [isEditing, isEditingWritten]);

  // Sync state when draft updates from assistant (e.g. voice corrections)
  useEffect(() => {
    if (!draft) return;
    setEditCustomer(draft.customerName || "");
    setEditDate(draft.date || "");
    setEditDuration(draft.durationFormatted || "");
    setEditStartTime(draft.startTime || "");
    setEditEndTime(draft.endTime || "");
    setEditWorkType(draft.targetTabName || draft.workType || "");
    const initialActivityType =
      draft.activityType ||
      (draft.workType && !["שעות", "Sheet1"].includes(draft.workType) ? draft.workType : "טיקטים");
    setEditActivityType(initialActivityType);
    setEditDescription(draft.description || "");
    setEditEmployees(sanitizePresetEmployees(draft.assignedEmployees, currentUser?.name));
  }, [
    draft?.customerName,
    draft?.date,
    draft?.durationFormatted,
    draft?.startTime,
    draft?.endTime,
    draft?.workType,
    draft?.activityType,
    draft?.targetTabName,
    draft?.description,
    draft?.assignedEmployees,
    currentUser?.name,
  ]);

  // Quick helper to calculate end time from start time and minutes
  const calcEndTimeFromDuration = (startTimeStr: string, durationMinutes: number) => {
    if (!startTimeStr) return "";
    const match = startTimeStr.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return "";
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const total = hours * 60 + mins + (durationMinutes || 30);
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  // File selector state
  const [isSelectingFile, setIsSelectingFile] = useState(!draft?.fileId && !draft?.fileName);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileList, setFileList] = useState<Array<{ fileId: string; fileName: string; webUrl?: string }>>(
    draft?.availableFiles || []
  );

  useEffect(() => {
    if (draft?.availableFiles && draft.availableFiles.length > 0) {
      setFileList(draft.availableFiles);
    }
  }, [draft?.availableFiles]);

  // Resolve and switch the Excel file when the user selects or changes the customer
  const resolveCustomerExcelFile = async (
    targetCustomerName: string,
    targetDate?: string,
    baseDraft?: HoursAssistantEntryDraft
  ): Promise<Partial<HoursAssistantEntryDraft>> => {
    const cleanCustomer = targetCustomerName.trim();
    if (!cleanCustomer) return {};
    const currentDraft = baseDraft || draft;
    const dateToUse = (targetDate || editDate || currentDraft?.date || "").trim();

    setIsResolvingCustomerFile(true);
    setIsLoadingFiles(true);
    try {
      const res = await apiFindMonthTarget(cleanCustomer, dateToUse, {
        inspect: true,
        workType: editActivityType || currentDraft?.activityType || currentDraft?.workType,
      });

      const resolvedName = res.customerName || cleanCustomer;
      const availFiles = Array.isArray(res.availableFiles) ? res.availableFiles : [];
      setFileList(availFiles);

      if (res.found && res.fileId) {
        const nextTabName =
          res.targetTabName || editWorkType || currentDraft?.targetTabName || "טיקטים";
        setEditWorkType(nextTabName);
        setIsSelectingFile(false);

        const patch: Partial<HoursAssistantEntryDraft> = {
          customerName: resolvedName,
          fileId: res.fileId,
          fileName: res.fileName,
          filePath: res.filePath || `${resolvedName}/שעות עבודה/${res.fileName || ""}`,
          webUrl: res.webUrl,
          driveId: res.driveId || currentDraft?.driveId,
          availableFiles: availFiles,
          targetTabName: nextTabName,
          detectedTabType: res.detectedTabType || currentDraft?.detectedTabType,
          availableTabs: res.availableTabs || currentDraft?.availableTabs,
          targetRow: res.targetRow || currentDraft?.targetRow,
        };

        if (currentDraft && onUpdateDraft) {
          onUpdateDraft({
            ...currentDraft,
            ...patch,
            mappedRow: {
              ...(currentDraft.mappedRow || {}),
              לקוח: resolvedName,
            },
          });
        }
        return patch;
      } else {
        // Customer has no auto-matched file yet: clear old customer's file and show file selector if files exist
        const fallbackFile = availFiles.length === 1 ? availFiles[0] : undefined;
        const patch: Partial<HoursAssistantEntryDraft> = {
          customerName: resolvedName,
          fileId: fallbackFile?.fileId || "",
          fileName: fallbackFile?.fileName || "",
          filePath: fallbackFile
            ? `${resolvedName}/שעות עבודה/${fallbackFile.fileName}`
            : "",
          webUrl: fallbackFile?.webUrl || "",
          availableFiles: availFiles,
          targetRow: undefined,
        };
        if (!fallbackFile) {
          setIsSelectingFile(true);
        }
        if (currentDraft && onUpdateDraft) {
          onUpdateDraft({
            ...currentDraft,
            ...patch,
            mappedRow: {
              ...(currentDraft.mappedRow || {}),
              לקוח: resolvedName,
            },
          });
        }
        return patch;
      }
    } catch (err) {
      console.warn("Failed to resolve Excel file for customer:", cleanCustomer, err);
      return { customerName: cleanCustomer };
    } finally {
      setIsResolvingCustomerFile(false);
      setIsLoadingFiles(false);
    }
  };

  const handleSelectCustomerInEdit = async (selectedCustomerName: string) => {
    setEditCustomer(selectedCustomerName);
    setCustomerSearchQuery("");
    setIsCustomerDropdownOpen(false);
    await resolveCustomerExcelFile(selectedCustomerName, editDate || draft?.date);
  };

  // Load customer files from SharePoint
  const loadCustomerFiles = async () => {
    const cust = (editCustomer || draft?.customerName || "").trim();
    if (!cust) return;
    await resolveCustomerExcelFile(cust, editDate || draft?.date);
  };

  const handleSelectFile = (file: { fileId: string; fileName: string; webUrl?: string }) => {
    if (!draft || !onUpdateDraft) return;
    const custName = editCustomer.trim() || draft.customerName || "";
    onUpdateDraft({
      ...draft,
      customerName: custName,
      fileId: file.fileId,
      fileName: file.fileName,
      filePath: `${custName}/שעות עבודה/${file.fileName}`,
      webUrl: file.webUrl,
    });
    setIsSelectingFile(false);
  };

  // Undo countdown timer for written entry (10 minutes)
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    if (!written) return;
    const updateTimer = () => {
      const remaining = Math.max(0, written.expiresAt - Date.now());
      setTimeLeftMs(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [written]);

  // Handle saving manual edits
  const [isLocalConfirming, setIsLocalConfirming] = useState(false);

  const buildAndSaveEditedDraft = async (): Promise<HoursAssistantEntryDraft | null> => {
    if (!draft) return null;

    const timeCalcs = computeTimesAndDuration(
      editStartTime.trim() || draft.startTime || "",
      editEndTime.trim() || draft.endTime || "",
      draft.durationMinutes || 30
    );

    const finalEmployees = sanitizePresetEmployees(editEmployees, currentUser?.name);
    const trimmedCustomer = editCustomer.trim();
    const trimmedDate = editDate.trim();

    let filePatch: Partial<HoursAssistantEntryDraft> = {};
    if (
      trimmedCustomer &&
      (trimmedCustomer !== (draft.customerName || "").trim() ||
        trimmedDate !== (draft.date || "").trim() ||
        !draft.fileId)
    ) {
      filePatch = await resolveCustomerExcelFile(trimmedCustomer, trimmedDate, draft);
    }

    const finalCustomerName = filePatch.customerName || trimmedCustomer;

    const updated: HoursAssistantEntryDraft = {
      ...draft,
      ...filePatch,
      customerName: finalCustomerName,
      date: trimmedDate,
      startTime: timeCalcs.startTime,
      endTime: timeCalcs.endTime,
      durationMinutes: timeCalcs.durationMinutes,
      durationHours: timeCalcs.durationHours,
      durationFormatted: editDuration.trim() || timeCalcs.durationFormatted,
      isTimeSuggested: false,
      workType: editActivityType,
      activityType: editActivityType,
      targetTabName: filePatch.targetTabName || editWorkType,
      description: editDescription.trim(),
      assignedEmployees: finalEmployees,
      mappedRow: {
        ...(draft.mappedRow || {}),
        "שעת התחלה": timeCalcs.startTime,
        "שעת סיום": timeCalcs.endTime,
        "שעת כניסה": timeCalcs.startTime,
        "כניסה": timeCalcs.startTime,
        "משעה": timeCalcs.startTime,
        "שעת יציאה": timeCalcs.endTime,
        "יציאה": timeCalcs.endTime,
        "עד שעה": timeCalcs.endTime,
        משך: timeCalcs.durationHours,
        שעות: timeCalcs.durationHours,
        "סה״כ שעות": timeCalcs.durationHours,
        "סה\"כ שעות": timeCalcs.durationHours,
        תאריך: trimmedDate,
        לקוח: finalCustomerName,
        תיאור: editDescription.trim(),
        עובד: finalEmployees[0],
        "שם עובד": finalEmployees[0],
        employeeName: finalEmployees[0],
      },
      isReadyForConfirmation: Boolean(
        finalCustomerName && trimmedDate && editDescription.trim()
      ),
    };
    if (onUpdateDraft) {
      onUpdateDraft(updated);
    }
    setIsEditing(false);
    return updated;
  };

  const handleSaveEdit = async () => {
    await buildAndSaveEditedDraft();
  };

  // Format countdown string
  const formatTimeLeft = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  const getWorkTypeIcon = (wt: string) => {
    const s = (wt || "").toLowerCase();
    if (s.includes("ביקור") || s.includes("אתר") || s.includes("onsite") || s.includes("visit")) {
      return <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />;
    }
    if (s.includes("פרויקט") || s.includes("פרוייקט") || s.includes("project")) {
      return <FolderKanban className="w-3.5 h-3.5 text-[#2563EB]" />;
    }
    return <Ticket className="w-3.5 h-3.5 text-[#2563EB]" />;
  };

  const getListsWorkTypeBadge = (wt?: string) => {
    const norm = String(wt || "").toLowerCase();
    if (norm.includes("פרויקט") || norm.includes("project")) {
      return { label: "פרויקטים", bg: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]" };
    }
    if (
      norm.includes("ביקור") ||
      norm.includes("ביקורים") ||
      norm.includes("הגעה") ||
      norm.includes("onsite") ||
      norm.includes("visit")
    ) {
      return { label: "ביקור באתר", bg: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]" };
    }
    return { label: "טיקטים", bg: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]" };
  };

  // ==========================================
  // 1. Written Entry State ("נרשם ✓")
  // ==========================================
  if (written) {
    const canStillUndo = timeLeftMs > 0 && written.canUndo;
    const workTypeBadge = getListsWorkTypeBadge(written.workType);
    const handlerDisplay = written.employeeName || currentUser?.name || "עובד";

    return (
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#DBEAFE] p-3.5 sm:p-5 shadow-2xs text-right my-2 text-[#172B4D]">
        {/* Clean Minimalist Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-[#DBEAFE]/70">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>תועד בהצלחה</span>
            </span>

            <span className="text-sm font-bold text-[#172B4D] truncate">
              {written.customerName}
            </span>

            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${workTypeBadge.bg}`}>
              {workTypeBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onEditWritten && (
              <button
                type="button"
                onClick={() => setIsEditingWritten(!isEditingWritten)}
                disabled={isSavingWrittenEdit}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#DBEAFE] text-[#172B4D] hover:text-[#2563EB] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="ערוך שעות לחיוב או תיאור פעילות שתועדו"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{isEditingWritten ? "סגור" : "ערוך"}</span>
              </button>
            )}

            {canStillUndo ? (
              <button
                onClick={() => onUndo && onUndo(written.id, written)}
                disabled={isUndoing}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 border border-[#DBEAFE] hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="ביטול ומחיקת השורה תוך 10 דקות"
              >
                <Undo2 className={`w-3.5 h-3.5 ${isUndoing ? "animate-spin" : ""}`} />
                <span>בטל ({formatTimeLeft(timeLeftMs)})</span>
              </button>
            ) : null}
          </div>
        </div>

        {isEditingWritten ? (
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#172B4D]">
                עריכת תיעוד פעילות (מתעדכן ב-Lists וב-Excel)
              </span>
            </div>

            {/* Quick Billable Duration Chips */}
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1.5">
                בחירה מהירה של היקף שעות לחיוב
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "15 דק׳", mins: 15 },
                  { label: "30 דק׳", mins: 30 },
                  { label: "45 דק׳", mins: 45 },
                  { label: "שעה", mins: 60 },
                  { label: "1.5 ש׳", mins: 90 },
                  { label: "שעתיים", mins: 120 },
                  { label: "3 ש׳", mins: 180 },
                  { label: "4 ש׳", mins: 240 },
                ].map((preset) => {
                  const newEnd = calcEndTimeFromDuration(writtenEditStart || "09:00", preset.mins);
                  const calcs = computeTimesAndDuration(writtenEditStart || "09:00", newEnd, preset.mins);
                  const isActive = writtenEditDuration === calcs.durationFormatted;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => {
                        const start = writtenEditStart || "09:00";
                        const end = calcEndTimeFromDuration(start, preset.mins);
                        const c = computeTimesAndDuration(start, end, preset.mins);
                        setWrittenEditStart(c.startTime);
                        setWrittenEditEnd(c.endTime);
                        setWrittenEditDuration(c.durationFormatted);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold"
                          : "bg-white hover:bg-[#EFF6FF] text-[#172B4D] border-[#DBEAFE]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Fields: משעה, עד שעה, היקף שעות */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">משעה</label>
                <input
                  type="time"
                  lang="en-GB"
                  step="60"
                  value={writtenEditStart}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWrittenEditStart(val);
                    if (val && writtenEditEnd) {
                      const c = computeTimesAndDuration(val, writtenEditEnd, 60);
                      setWrittenEditDuration(c.durationFormatted);
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-mono text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">עד שעה</label>
                <input
                  type="time"
                  lang="en-GB"
                  step="60"
                  value={writtenEditEnd}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWrittenEditEnd(val);
                    if (writtenEditStart && val) {
                      const c = computeTimesAndDuration(writtenEditStart, val, 60);
                      setWrittenEditDuration(c.durationFormatted);
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-mono text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">
                  היקף שעות לחיוב
                </label>
                <input
                  type="text"
                  value={writtenEditDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWrittenEditDuration(val);
                    const numMatch = val.match(/(\d+(?:\.\d+)?)/);
                    if (numMatch) {
                      const num = parseFloat(numMatch[1]);
                      const mins = val.includes("דק") ? Math.round(num) : Math.round(num * 60);
                      if (mins > 0 && mins <= 720) {
                        const start = writtenEditStart || "09:00";
                        setWrittenEditEnd(calcEndTimeFromDuration(start, mins));
                      }
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-semibold text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                  placeholder="למשל: 1.5 שעות"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">
                תיאור הפעילות
              </label>
              <textarea
                rows={3}
                value={writtenEditDescription}
                onChange={(e) => setWrittenEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] resize-y"
                placeholder="עדכן את תיאור הפעילות..."
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSavingWrittenEdit}
                onClick={async () => {
                  if (!onEditWritten) return;
                  const c = computeTimesAndDuration(
                    writtenEditStart || written.startTime || "09:00",
                    writtenEditEnd || written.endTime || "10:00",
                    60
                  );
                  await onEditWritten(written.id, written, {
                    customerName: written.customerName,
                    date: writtenEditDate || written.date,
                    startTime: c.startTime,
                    endTime: c.endTime,
                    durationHours: c.durationHours,
                    durationMinutes: c.durationMinutes,
                    durationFormatted: writtenEditDuration.trim() || c.durationFormatted,
                    description: writtenEditDescription.trim() || written.description,
                    workType: writtenEditWorkType || written.workType,
                  });
                  setIsEditingWritten(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {isSavingWrittenEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>מעדכן...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>שמור שינויים</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingWritten(false)}
                className="py-2 px-3 rounded-xl bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-[#172B4D] text-xs font-medium cursor-pointer transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Compact Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-[#EFF6FF]/60 border border-[#DBEAFE]">
                <span className="text-slate-500 block text-[10px]">שעות לחיוב</span>
                <span className="font-bold text-[#2563EB] font-mono">{written.durationFormatted}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]/70">
                <span className="text-slate-500 block text-[10px]">משעה – עד שעה</span>
                <span className="font-mono font-medium text-[#172B4D]" dir="ltr">
                  {written.startTime || "09:00"} – {written.endTime || "10:00"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]/70">
                <span className="text-slate-500 block text-[10px]">תאריך</span>
                <span className="font-semibold text-[#172B4D]">{written.date}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]/70">
                <span className="text-slate-500 block text-[10px]">מתעד</span>
                <span className="font-semibold text-[#172B4D] truncate block">{handlerDisplay}</span>
              </div>
            </div>

            {/* Clean Description */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]/70 text-xs sm:text-[13px] text-[#172B4D] leading-relaxed mb-3">
              <p className="whitespace-pre-wrap">{written.description}</p>
            </div>
          </>
        )}

        {/* Minimal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2.5 border-t border-[#DBEAFE]/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-[#06B6D4]" />
              <span>Excel (שורה {written.targetRow})</span>
            </span>
            {written.listItemId ? (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-[#06B6D4]" />
                <span>Microsoft Lists</span>
              </span>
            ) : written.listsSyncResult?.error ? (
              <span
                className="text-amber-700 inline-flex items-center gap-1"
                title={written.listsSyncResult.error}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>התרעת Lists</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {written.webUrl && (
              <a
                href={written.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
              >
                <span>Excel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <a
              href="https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx?env=WebViewList"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
            >
              <span>Lists</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. Draft / Summary Card State
  // ==========================================
  if (!draft) return null;

  const draftWorkTypeBadge = getListsWorkTypeBadge(
    draft?.activityType || draft?.workType || draft?.targetTabName
  );
  const effectiveAvailableTabs = React.useMemo(() => {
    const base = Array.isArray(draft?.availableTabs) ? [...draft.availableTabs] : [];
    const hasProject = base.some(
      (t) =>
        t.detectedType === "project" ||
        t.name.includes("פרויקט") ||
        t.name.includes("פרוייקט") ||
        t.name.toLowerCase().includes("project")
    );
    if (!hasProject) {
      base.push({
        name: "פרויקטים",
        detectedType: "project",
        isSelected: draftWorkTypeBadge.label === "פרויקטים",
      });
    }
    return base;
  }, [draft?.availableTabs, draftWorkTypeBadge.label]);
  const assignedList = sanitizePresetEmployees(draft?.assignedEmployees, currentUser?.name);

  const filteredCustomersForEdit = customerList.filter((c) => {
    const q = (customerSearchQuery || editCustomer || "").trim().toLowerCase();
    if (!q || q === (draft.customerName || "").trim().toLowerCase()) return true;
    return c.name.toLowerCase().includes(q);
  });

  const handleLookupExistingEmployee = () => {
    const q = customEmployeeInput.trim();
    if (!q) return;
    const matched = matchPresetTeamMember(q);
    if (matched) {
      if (!editEmployees.includes(matched)) {
        setEditEmployees((prev) => [...prev, matched]);
      }
      setCustomEmployeeInput("");
      setEmployeeLookupMessage(null);
    } else {
      setEmployeeLookupMessage(`השם "${q}" אינו מופיע ברשימת העובדים הקיימים`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#DBEAFE] p-3.5 sm:p-5 shadow-2xs text-right my-2 text-[#172B4D]">
      {/* Minimalist Header: Customer, Work Type Badge & Edit Toggle */}
      <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-[#DBEAFE]/70">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="text-sm sm:text-[15px] font-bold text-[#172B4D] truncate">
                {draft.customerName || "לקוח"}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${draftWorkTypeBadge.bg}`}>
                {draftWorkTypeBadge.label}
              </span>
              {draft.ticketNumber && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] shrink-0">
                  #{draft.ticketNumber.replace(/^(טיקט|ticket)\s*/i, "")}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>{assignedList.join(", ")}</span>
              {draft.contactPerson &&
                !(draft.unmappedFields && draft.unmappedFields.includes("contact_person")) && (
                  <>
                    <span>•</span>
                    <span>איש קשר: {draft.contactPerson}</span>
                  </>
                )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#172B4D] hover:text-[#2563EB] border border-[#DBEAFE] text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          title="עריכת פרטי התיעוד"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>{isEditing ? "סגור" : "ערוך"}</span>
        </button>
      </div>

      {/* Duplicate Warning if any */}
      {draft.duplicateWarning && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">שים לב:</span> {draft.duplicateWarning}
          </div>
        </div>
      )}

      {/* Missing Fields Warning if any */}
      {draft.missingFields && draft.missingFields.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50/80 border border-red-200/80 text-xs text-red-800">
          <span className="font-semibold">חסרים שדות:</span> {draft.missingFields.join(", ")}
        </div>
      )}

      {/* Main Fields / Inline Edit Form */}
      {isEditing ? (
        <div className="space-y-3 mb-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-500 font-medium">
                  שם לקוח (בחירה מהרשימה תעדכן את קובץ ה-Excel)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !isCustomerDropdownOpen;
                    setIsCustomerDropdownOpen(nextOpen);
                    if (nextOpen && customerList.length === 0) {
                      loadSharePointCustomers(true);
                    }
                  }}
                  className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isCustomerDropdownOpen ? "סגור רשימה" : "בחר לקוח אחר"}</span>
                  {isCustomerDropdownOpen ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={editCustomer}
                  onFocus={() => {
                    setIsCustomerDropdownOpen(true);
                    if (customerList.length === 0) {
                      loadSharePointCustomers();
                    }
                  }}
                  onChange={(e) => {
                    setEditCustomer(e.target.value);
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editCustomer.trim()) {
                      e.preventDefault();
                      handleSelectCustomerInEdit(editCustomer.trim());
                    }
                  }}
                  placeholder="חפש או בחר לקוח..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-semibold text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !isCustomerDropdownOpen;
                    setIsCustomerDropdownOpen(nextOpen);
                    if (nextOpen && customerList.length === 0) {
                      loadSharePointCustomers(true);
                    }
                  }}
                  className="absolute left-2 text-[#2563EB] hover:text-[#1D4ED8] p-0.5 cursor-pointer"
                  title="פתח רשימת לקוחות"
                >
                  {isLoadingCustomers ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                  ) : isCustomerDropdownOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {isCustomerDropdownOpen && (
                <div className="mt-1.5 p-2 rounded-xl bg-white border border-[#DBEAFE] shadow-md z-20 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#DBEAFE]/60">
                    <div className="relative flex-1">
                      <Search className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        placeholder="סינון לקוחות..."
                        className="w-full pr-7 pl-2 py-1 rounded-md bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => loadSharePointCustomers(true)}
                      disabled={isLoadingCustomers}
                      className="text-[10px] text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-[#EFF6FF] cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCustomers ? "animate-spin" : ""}`} />
                      <span>רענן</span>
                    </button>
                  </div>

                  {isLoadingCustomers ? (
                    <div className="py-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                      <span>טוען רשימת לקוחות מ-SharePoint...</span>
                    </div>
                  ) : filteredCustomersForEdit.length > 0 ? (
                    <div className="max-h-44 overflow-y-auto space-y-1">
                      {filteredCustomersForEdit.map((cust) => {
                        const isSelected =
                          editCustomer.trim().toLowerCase() === cust.name.trim().toLowerCase();
                        return (
                          <button
                            key={cust.id || cust.name}
                            type="button"
                            onClick={() => handleSelectCustomerInEdit(cust.name)}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#2563EB] text-white font-semibold"
                                : "bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#172B4D]"
                            }`}
                          >
                            <span className="truncate">{cust.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-500 space-y-1.5">
                      <p>לא נמצא לקוח תואם בסינון</p>
                      {editCustomer.trim() && (
                        <button
                          type="button"
                          onClick={() => handleSelectCustomerInEdit(editCustomer.trim())}
                          className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[11px] font-semibold cursor-pointer"
                        >
                          חפש קובץ אקסל עבור "{editCustomer.trim()}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">תאריך</label>
              <input
                type="text"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                onBlur={() => {
                  if (editCustomer.trim() && editDate.trim() && editDate.trim() !== draft.date) {
                    resolveCustomerExcelFile(editCustomer.trim(), editDate.trim());
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          {/* Target Excel File status inside Edit Mode (auto-updates when customer changes) */}
          <div className="p-2.5 rounded-xl bg-white border border-[#DBEAFE] space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {isResolvingCustomerFile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4] animate-spin shrink-0" />
                    <span className="text-[11px] text-[#2563EB] font-medium truncate">
                      מאתר קובץ Excel מתאים עבור {editCustomer}...
                    </span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="text-[11px] text-slate-500 shrink-0">קובץ אקסל:</span>
                    <span className="font-mono text-[#172B4D] font-semibold text-[11px] truncate" dir="ltr">
                      {draft.fileName || "לא זוהה קובץ יעד — בחר מהרשימה"}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !isSelectingFile;
                  setIsSelectingFile(next);
                  if (next && fileList.length === 0) {
                    loadCustomerFiles();
                  }
                }}
                className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] font-medium inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>{isSelectingFile ? "סגור קבצים" : "החלף קובץ"}</span>
                {isSelectingFile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {isSelectingFile && (
              <div className="pt-1.5 border-t border-[#DBEAFE]/60 space-y-1">
                {isLoadingFiles ? (
                  <div className="py-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                    <span>טוען קבצי Excel של {editCustomer || draft.customerName}...</span>
                  </div>
                ) : fileList.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {fileList.map((f) => {
                      const isSelected = draft.fileId === f.fileId || draft.fileName === f.fileName;
                      return (
                        <button
                          key={f.fileId}
                          type="button"
                          onClick={() => handleSelectFile(f)}
                          className={`w-full text-right px-2.5 py-1 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer border ${
                            isSelected
                              ? "bg-[#2563EB] border-[#2563EB] text-white font-semibold"
                              : "bg-[#F8FAFC] border-[#DBEAFE] text-[#172B4D] hover:bg-[#EFF6FF]"
                          }`}
                          dir="ltr"
                        >
                          <span className="truncate">{f.fileName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-1.5 text-center text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={loadCustomerFiles}
                      className="text-[#2563EB] underline text-[11px] cursor-pointer"
                    >
                      סרוק קבצי Excel עבור {editCustomer || draft.customerName}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Fields: משעה, עד שעה, משך זמן */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">משעה</label>
              <input
                type="time"
                lang="en-GB"
                step="60"
                value={editStartTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditStartTime(val);
                  if (val) {
                    const timeCalcs = computeTimesAndDuration(
                      val,
                      editEndTime,
                      draft?.durationMinutes || 30
                    );
                    setEditEndTime(timeCalcs.endTime);
                    setEditDuration(timeCalcs.durationFormatted);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-mono text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">עד שעה</label>
              <input
                type="time"
                lang="en-GB"
                step="60"
                value={editEndTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditEndTime(val);
                  if (val && editStartTime) {
                    const timeCalcs = computeTimesAndDuration(
                      editStartTime,
                      val,
                      draft?.durationMinutes || 30
                    );
                    setEditDuration(timeCalcs.durationFormatted);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-mono text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">שעות לחיוב</label>
              <input
                type="text"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-semibold text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                placeholder="1 שעה"
              />
            </div>
          </div>

          {/* Billable Duration Only (No Start/End Clock Inputs) */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">
              היקף שעות לחיוב
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: "15 דק׳", mins: 15 },
                { label: "30 דק׳", mins: 30 },
                { label: "45 דק׳", mins: 45 },
                { label: "שעה", mins: 60 },
                { label: "1.5 ש׳", mins: 90 },
                { label: "שעתיים", mins: 120 },
                { label: "3 ש׳", mins: 180 },
                { label: "4 ש׳", mins: 240 },
              ].map((preset) => {
                const start = editStartTime || "09:00";
                const end = calcEndTimeFromDuration(start, preset.mins);
                const c = computeTimesAndDuration(start, end, preset.mins);
                const isActive = editDuration === c.durationFormatted;
                return (
                  <button
                    key={preset.mins}
                    type="button"
                    onClick={() => {
                      setEditStartTime(c.startTime);
                      setEditEndTime(c.endTime);
                      setEditDuration(c.durationFormatted);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold"
                        : "bg-white hover:bg-[#EFF6FF] text-[#172B4D] border-[#DBEAFE]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={editDuration}
              onChange={(e) => {
                const val = e.target.value;
                setEditDuration(val);
                const numMatch = val.match(/(\d+(?:\.\d+)?)/);
                if (numMatch) {
                  const num = parseFloat(numMatch[1]);
                  const mins = val.includes("דק") ? Math.round(num) : Math.round(num * 60);
                  if (mins > 0 && mins <= 720) {
                    const start = editStartTime || "09:00";
                    setEditEndTime(calcEndTimeFromDuration(start, mins));
                  }
                }
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs font-semibold text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
              placeholder="1 שעה"
            />
          </div>

          {/* Field: סוג הפעילות */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">
              סוג הפעילות
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "טיקטים", label: "טיקטים", icon: <Ticket className="w-3.5 h-3.5" /> },
                { id: "ביקור באתר", label: "ביקור באתר", icon: <MapPin className="w-3.5 h-3.5" /> },
                { id: "פרויקטים", label: "פרויקטים", icon: <FolderKanban className="w-3.5 h-3.5" /> },
              ].map((opt) => {
                const isSelected =
                  (opt.id === "טיקטים" && (editActivityType.includes("טיקט") || editActivityType.includes("שירות") || editActivityType === "טיקטים")) ||
                  (opt.id === "ביקור באתר" && (editActivityType.includes("ביקור") || editActivityType.includes("onsite"))) ||
                  (opt.id === "פרויקטים" && (editActivityType.includes("פרויקט") || editActivityType.includes("project")));

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setEditActivityType(opt.id);
                      const matchingTab = effectiveAvailableTabs.find((t) => {
                        const tNorm = t.name.toLowerCase();
                        if (opt.id === "ביקור באתר") return tNorm.includes("ביקור") || tNorm.includes("onsite") || t.detectedType === "onsite";
                        if (opt.id === "פרויקטים") return tNorm.includes("פרויקט") || tNorm.includes("פרוייקט") || tNorm.includes("project") || t.detectedType === "project";
                        return tNorm.includes("טיקט") || tNorm.includes("קריא") || tNorm.includes("שירות") || t.detectedType === "tickets";
                      });
                      setEditWorkType(matchingTab ? matchingTab.name : opt.id);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold"
                        : "bg-white text-[#172B4D] border-[#DBEAFE] hover:bg-[#EFF6FF]"
                    }`}
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {effectiveAvailableTabs.length > 0 && (
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">טאב באקסל</label>
              <div className="flex flex-wrap gap-1.5">
                {effectiveAvailableTabs.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setEditWorkType(t.name);
                      const tNorm = t.name.toLowerCase();
                      if (t.detectedType === "project" || tNorm.includes("פרויקט") || tNorm.includes("פרוייקט") || tNorm.includes("project")) {
                        setEditActivityType("פרויקטים");
                      } else if (t.detectedType === "onsite" || tNorm.includes("ביקור") || tNorm.includes("onsite")) {
                        setEditActivityType("ביקור באתר");
                      } else if (t.detectedType === "tickets" || tNorm.includes("טיקט") || tNorm.includes("קריא") || tNorm.includes("שירות")) {
                        setEditActivityType("טיקטים");
                      }
                    }}
                    className={`py-1 px-2.5 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                      editWorkType === t.name ||
                      (t.name === "פרויקטים" && editActivityType === "פרויקטים" && !effectiveAvailableTabs.some((x) => x.name === editWorkType))
                        ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold"
                        : "bg-white text-[#172B4D] border-[#DBEAFE] hover:bg-[#EFF6FF]"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Field: מי עבד על המשימה (רק מרשימת העובדים הקיימים) */}
          <div className="p-2.5 rounded-xl bg-white border border-[#DBEAFE]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-[#172B4D] font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                עובדים בתיעוד ({editEmployees.length})
              </label>
              {editEmployees.length > 1 && (
                <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] font-medium px-2 py-0.5 rounded-full">
                  {editEmployees.length} שורות נפרדות
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {getAllTeamMembersList().filter((memberName) => {
                const q = customEmployeeInput.trim().toLowerCase();
                if (!q) return true;
                const matched = matchPresetTeamMember(q);
                return memberName.toLowerCase().includes(q) || matched === memberName;
              }).map((memberName) => {
                const isSelected = editEmployees.includes(memberName);
                return (
                  <button
                    key={memberName}
                    type="button"
                    onClick={() => {
                      setEmployeeLookupMessage(null);
                      setEditEmployees((prev) => {
                        if (prev.includes(memberName)) {
                          if (prev.length === 1) return prev;
                          return prev.filter((e) => e !== memberName);
                        } else {
                          return [...prev, memberName];
                        }
                      });
                    }}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-[#2563EB] text-white border-[#2563EB] font-medium"
                        : "bg-[#F8FAFC] text-[#172B4D] border-[#DBEAFE] hover:bg-[#EFF6FF]"
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-[#2563EB]" />}
                    <span>{memberName}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customEmployeeInput}
                onChange={(e) => {
                  setCustomEmployeeInput(e.target.value);
                  setEmployeeLookupMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customEmployeeInput.trim()) {
                    e.preventDefault();
                    handleLookupExistingEmployee();
                  }
                }}
                placeholder="חפש עובד מרשימת העובדים הקיימים..."
                className="flex-1 bg-[#F8FAFC] border border-[#DBEAFE] text-[16px] sm:text-xs px-2.5 py-1 rounded-lg text-[#172B4D] placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={handleLookupExistingEmployee}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Search className="w-3 h-3" />
                <span>בחר</span>
              </button>
            </div>
            {employeeLookupMessage && (
              <p className="text-[11px] text-amber-700 mt-1">{employeeLookupMessage}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">
              תיאור פעילות
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#DBEAFE] text-[16px] sm:text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] resize-y"
              placeholder="פרט את הפעולות שבוצעו..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              disabled={isResolvingCustomerFile}
              className="flex-1 py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {isResolvingCustomerFile ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>מעדכן קובץ אקסל...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>שמור שינויים</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="py-2 px-3 rounded-xl bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-[#172B4D] text-xs font-medium cursor-pointer transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sleek Segmented Work-Type Selector */}
          <div className="mb-3 bg-[#EFF6FF]/80 border border-[#DBEAFE] p-1 rounded-xl grid grid-cols-3 gap-1">
            {[
              { id: "טיקטים", label: "טיקטים", icon: <Ticket className="w-3.5 h-3.5 shrink-0" /> },
              { id: "ביקור באתר", label: "ביקור באתר", icon: <MapPin className="w-3.5 h-3.5 shrink-0" /> },
              { id: "פרויקטים", label: "פרויקטים", icon: <FolderKanban className="w-3.5 h-3.5 shrink-0" /> },
            ].map((opt) => {
              const isSelected =
                (opt.id === "טיקטים" && draftWorkTypeBadge.label === "טיקטים") ||
                (opt.id === "ביקור באתר" && (draftWorkTypeBadge.label === "ביקור באתר" || draftWorkTypeBadge.label === "ביקור")) ||
                (opt.id === "פרויקטים" && draftWorkTypeBadge.label === "פרויקטים");

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (onUpdateDraft) {
                      const matchingTab = effectiveAvailableTabs.find((t) => {
                        const tNorm = t.name.toLowerCase();
                        if (opt.id === "ביקור באתר") return tNorm.includes("ביקור") || tNorm.includes("onsite") || t.detectedType === "onsite";
                        if (opt.id === "פרויקטים") return tNorm.includes("פרויקט") || tNorm.includes("פרוייקט") || tNorm.includes("project") || t.detectedType === "project";
                        return tNorm.includes("טיקט") || tNorm.includes("קריא") || tNorm.includes("שירות") || t.detectedType === "tickets";
                      });

                      const nextTabName = matchingTab ? matchingTab.name : opt.id;
                      onUpdateDraft({
                        ...draft,
                        workType: opt.id,
                        activityType: opt.id,
                        targetTabName: nextTabName,
                        availableTabs: effectiveAvailableTabs.map((t) => ({
                          ...t,
                          isSelected: t.name === nextTabName,
                        })),
                      });
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#2563EB] text-white font-semibold shadow-2xs"
                      : "text-[#172B4D]/75 hover:text-[#2563EB] hover:bg-white/60"
                  }`}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time & Duration Controls: משעה | עד שעה | סה״כ שעות לחיוב */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] mb-3 space-y-2.5">
            {/* Clock Time Inputs: משעה and עד שעה */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white px-2.5 py-1.5 rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-[#172B4D]">משעה</span>
                <input
                  type="time"
                  lang="en-GB"
                  step="60"
                  value={draft.startTime || "09:00"}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const timeCalcs = computeTimesAndDuration(
                      newStart,
                      draft.endTime || "10:00",
                      draft.durationMinutes || 60
                    );
                    if (onUpdateDraft) {
                      onUpdateDraft({
                        ...draft,
                        startTime: newStart,
                        endTime: timeCalcs.endTime,
                        durationMinutes: timeCalcs.durationMinutes,
                        durationHours: timeCalcs.durationHours,
                        durationFormatted: timeCalcs.durationFormatted,
                        isTimeSuggested: false,
                        mappedRow: {
                          ...(draft.mappedRow || {}),
                          "שעת התחלה": newStart,
                          "שעת סיום": timeCalcs.endTime,
                          "שעת כניסה": newStart,
                          "כניסה": newStart,
                          "משעה": newStart,
                          "שעת יציאה": timeCalcs.endTime,
                          "יציאה": timeCalcs.endTime,
                          "עד שעה": timeCalcs.endTime,
                          משך: timeCalcs.durationHours,
                          שעות: timeCalcs.durationHours,
                          "סה״כ שעות": timeCalcs.durationHours,
                          "סה\"כ שעות": timeCalcs.durationHours,
                        },
                      });
                    }
                  }}
                  className="text-[16px] sm:text-xs font-mono font-bold text-[#2563EB] bg-transparent focus:outline-none cursor-pointer"
                  dir="ltr"
                />
              </div>

              <div className="bg-white px-2.5 py-1.5 rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-[#172B4D]">עד שעה</span>
                <input
                  type="time"
                  lang="en-GB"
                  step="60"
                  value={draft.endTime || "10:00"}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    const timeCalcs = computeTimesAndDuration(
                      draft.startTime || "09:00",
                      newEnd,
                      draft.durationMinutes || 60
                    );
                    if (onUpdateDraft) {
                      onUpdateDraft({
                        ...draft,
                        startTime: timeCalcs.startTime,
                        endTime: newEnd,
                        durationMinutes: timeCalcs.durationMinutes,
                        durationHours: timeCalcs.durationHours,
                        durationFormatted: timeCalcs.durationFormatted,
                        isTimeSuggested: false,
                        mappedRow: {
                          ...(draft.mappedRow || {}),
                          "שעת התחלה": timeCalcs.startTime,
                          "שעת סיום": newEnd,
                          "שעת כניסה": timeCalcs.startTime,
                          "כניסה": timeCalcs.startTime,
                          "משעה": timeCalcs.startTime,
                          "שעת יציאה": newEnd,
                          "יציאה": newEnd,
                          "עד שעה": newEnd,
                          משך: timeCalcs.durationHours,
                          שעות: timeCalcs.durationHours,
                          "סה״כ שעות": timeCalcs.durationHours,
                          "סה\"כ שעות": timeCalcs.durationHours,
                        },
                      });
                    }
                  }}
                  className="text-[16px] sm:text-xs font-mono font-bold text-[#2563EB] bg-transparent focus:outline-none cursor-pointer"
                  dir="ltr"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white px-2.5 py-1.5 rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-[#172B4D]">תאריך</span>
                <span className="font-medium text-[#172B4D]">{draft.date}</span>
              </div>
            </div>

            {/* Direct Stepper & Number Input for Total Hours */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-[#DBEAFE]/60">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#172B4D]">סה״כ שעות לחיוב:</label>

                <div className="flex items-center bg-white border border-[#DBEAFE] rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateDraft) {
                        const currentH = draft.durationHours || 1;
                        const nextH = Math.max(0.25, Math.round((currentH - 0.25) * 100) / 100);
                        const mins = Math.round(nextH * 60);
                        const baseStart = draft.startTime || "09:00";
                        const newEnd = calcEndTimeFromDuration(baseStart, mins);
                        const durationLbl = nextH === 1 ? "1 שעה" : `${nextH} שעות`;
                        onUpdateDraft({
                          ...draft,
                          durationMinutes: mins,
                          durationHours: nextH,
                          durationFormatted: durationLbl,
                          startTime: baseStart,
                          endTime: newEnd,
                          isTimeSuggested: false,
                          mappedRow: {
                            ...(draft.mappedRow || {}),
                            "שעת התחלה": baseStart,
                            "שעת סיום": newEnd,
                            "שעת כניסה": baseStart,
                            "כניסה": baseStart,
                            "משעה": baseStart,
                            "שעת יציאה": newEnd,
                            "יציאה": newEnd,
                            "עד שעה": newEnd,
                            משך: nextH,
                            שעות: nextH,
                            "סה״כ שעות": nextH,
                            "סה\"כ שעות": nextH,
                          },
                        });
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                    title="הפחת 15 דקות"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={draft.durationHours ?? 1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0 && onUpdateDraft) {
                        const mins = Math.round(val * 60);
                        const baseStart = draft.startTime || "09:00";
                        const newEnd = calcEndTimeFromDuration(baseStart, mins);
                        const durationLbl = val === 1 ? "1 שעה" : `${val} שעות`;
                        onUpdateDraft({
                          ...draft,
                          durationMinutes: mins,
                          durationHours: val,
                          durationFormatted: durationLbl,
                          startTime: baseStart,
                          endTime: newEnd,
                          isTimeSuggested: false,
                          mappedRow: {
                            ...(draft.mappedRow || {}),
                            "שעת התחלה": baseStart,
                            "שעת סיום": newEnd,
                            "שעת כניסה": baseStart,
                            "כניסה": baseStart,
                            "משעה": baseStart,
                            "שעת יציאה": newEnd,
                            "יציאה": newEnd,
                            "עד שעה": newEnd,
                            משך: val,
                            שעות: val,
                            "סה״כ שעות": val,
                            "סה\"כ שעות": val,
                          },
                        });
                      }
                    }}
                    className="w-14 sm:w-16 text-center text-xs font-bold text-[#2563EB] font-mono bg-transparent focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateDraft) {
                        const currentH = draft.durationHours || 1;
                        const nextH = Math.round((currentH + 0.25) * 100) / 100;
                        const mins = Math.round(nextH * 60);
                        const baseStart = draft.startTime || "09:00";
                        const newEnd = calcEndTimeFromDuration(baseStart, mins);
                        const durationLbl = nextH === 1 ? "1 שעה" : `${nextH} שעות`;
                        onUpdateDraft({
                          ...draft,
                          durationMinutes: mins,
                          durationHours: nextH,
                          durationFormatted: durationLbl,
                          startTime: baseStart,
                          endTime: newEnd,
                          isTimeSuggested: false,
                          mappedRow: {
                            ...(draft.mappedRow || {}),
                            "שעת התחלה": baseStart,
                            "שעת סיום": newEnd,
                            "שעת כניסה": baseStart,
                            "כניסה": baseStart,
                            "משעה": baseStart,
                            "שעת יציאה": newEnd,
                            "יציאה": newEnd,
                            "עד שעה": newEnd,
                            משך: nextH,
                            שעות: nextH,
                            "סה״כ שעות": nextH,
                            "סה\"כ שעות": nextH,
                          },
                        });
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                    title="הוסף 15 דקות"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500 font-semibold">שעות</span>
              </div>
            </div>

            {/* Quick Duration Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { mins: 15, h: 0.25, lbl: "15 דק׳" },
                { mins: 30, h: 0.5, lbl: "30 דק׳" },
                { mins: 45, h: 0.75, lbl: "45 דק׳" },
                { mins: 60, h: 1, lbl: "שעה" },
                { mins: 90, h: 1.5, lbl: "1.5 ש׳" },
                { mins: 120, h: 2, lbl: "שעתיים" },
                { mins: 180, h: 3, lbl: "3 ש׳" },
                { mins: 240, h: 4, lbl: "4 ש׳" },
              ].map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  onClick={() => {
                    if (onUpdateDraft) {
                      const baseStart = draft.startTime || "09:00";
                      const newEnd = calcEndTimeFromDuration(baseStart, d.mins);
                      const durationLbl = d.h === 1 ? "1 שעה" : `${d.h} שעות`;
                      onUpdateDraft({
                        ...draft,
                        durationMinutes: d.mins,
                        durationHours: d.h,
                        durationFormatted: durationLbl,
                        startTime: baseStart,
                        endTime: newEnd,
                        isTimeSuggested: false,
                        mappedRow: {
                          ...(draft.mappedRow || {}),
                          "שעת התחלה": baseStart,
                          "שעת סיום": newEnd,
                          "שעת כניסה": baseStart,
                          "כניסה": baseStart,
                          "משעה": baseStart,
                          "שעת יציאה": newEnd,
                          "יציאה": newEnd,
                          "עד שעה": newEnd,
                          משך: d.h,
                          שעות: d.h,
                          "סה״כ שעות": d.h,
                          "סה\"כ שעות": d.h,
                        },
                      });
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    draft.durationMinutes === d.mins
                      ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold"
                      : "bg-white text-[#172B4D] border-[#DBEAFE] hover:bg-[#EFF6FF]"
                  }`}
                >
                  {d.lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Description Box */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]/80 text-xs sm:text-[13px] text-[#172B4D] leading-relaxed mb-3">
            <span className="text-[10px] text-slate-400 font-medium block mb-1">
              תיאור פעילות
            </span>
            <p className="font-medium text-[#172B4D] whitespace-pre-wrap">
              {draft.description || "טרם הוזן תיאור"}
            </p>
          </div>

          {/* Minimal 1-Line SharePoint Target File Indicator */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE]/80 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span className="font-mono text-[#172B4D] text-[11px] truncate" dir="ltr">
                  {draft.fileName || "לא זוהה קובץ יעד"}
                </span>
                {draft.targetRow ? (
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    (שורה {draft.targetRow})
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !isSelectingFile;
                  setIsSelectingFile(nextState);
                  if (nextState && fileList.length === 0) {
                    loadCustomerFiles();
                  }
                }}
                className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>{draft.fileName ? "החלף" : "בחר קובץ"}</span>
                {isSelectingFile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {isSelectingFile && (
              <div className="mt-1.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>קבצי Excel ({draft.customerName}):</span>
                  <button
                    type="button"
                    onClick={loadCustomerFiles}
                    disabled={isLoadingFiles}
                    className="inline-flex items-center gap-1 text-[10px] text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? "animate-spin" : ""}`} />
                    <span>רענן</span>
                  </button>
                </div>

                {isLoadingFiles ? (
                  <div className="py-2.5 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                    <span>טוען קבצים...</span>
                  </div>
                ) : fileList.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {fileList.map((f) => {
                      const isSelected = draft.fileId === f.fileId || draft.fileName === f.fileName;
                      return (
                        <button
                          key={f.fileId}
                          type="button"
                          onClick={() => handleSelectFile(f)}
                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer border ${
                            isSelected
                              ? "bg-[#2563EB] border-[#2563EB] text-white font-semibold"
                              : "bg-white border-[#DBEAFE] text-[#172B4D] hover:bg-[#EFF6FF]"
                          }`}
                          dir="ltr"
                        >
                          <span className="truncate">{f.fileName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2 text-center text-slate-500 text-xs">
                    <button
                      type="button"
                      onClick={loadCustomerFiles}
                      className="text-[#2563EB] underline text-[11px] cursor-pointer"
                    >
                      סרוק קבצים מ-SharePoint
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Primary CTA Button in Full Blue */}
      <div className="flex flex-row items-center gap-2">
        <button
          onClick={async () => {
            if (isConfirming || isLocalConfirming) return;
            setIsLocalConfirming(true);
            try {
              let effectiveDraft = draft;
              if (isEditing) {
                const saved = await buildAndSaveEditedDraft();
                if (saved) effectiveDraft = saved;
              }
              if (!effectiveDraft.fileId && !effectiveDraft.fileName) {
                setIsSelectingFile(true);
                if (fileList.length === 0) {
                  await loadCustomerFiles();
                }
                return;
              }
              if (onConfirm) {
                await onConfirm(effectiveDraft.id, effectiveDraft);
              }
            } finally {
              setIsLocalConfirming(false);
            }
          }}
          disabled={isConfirming || isLocalConfirming || !draft.isReadyForConfirmation}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
        >
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isConfirming || isLocalConfirming ? "animate-spin" : ""}`} />
          <span className="truncate">
            {isConfirming || isLocalConfirming
              ? assignedList.length > 1
                ? `מזין ${assignedList.length} שורות...`
                : "מזין תיעוד..."
              : assignedList.length > 1
              ? `אשר והזן (${assignedList.length} עובדים)`
              : "אשר והזן"}
          </span>
        </button>
      </div>
    </div>
  );
};
