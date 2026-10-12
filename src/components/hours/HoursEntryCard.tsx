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
} from "lucide-react";
import {
  HoursAssistantEntryDraft,
  WrittenEntryResult,
  apiFindMonthTarget,
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
  isConfirming?: boolean;
  isUndoing?: boolean;
}

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
  isConfirming = false,
  isUndoing = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
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

  // Load customer files from SharePoint
  const loadCustomerFiles = async () => {
    if (!draft?.customerName) return;
    setIsLoadingFiles(true);
    try {
      const res = await apiFindMonthTarget(draft.customerName, draft.date || "");
      if (res.availableFiles && Array.isArray(res.availableFiles)) {
        setFileList(res.availableFiles);
      }
      if (res.found && res.fileId && !draft.fileId && onUpdateDraft) {
        onUpdateDraft({
          ...draft,
          fileId: res.fileId,
          fileName: res.fileName,
          filePath: res.filePath,
          webUrl: res.webUrl,
        });
      }
    } catch (err) {
      console.warn("Failed to load customer files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectFile = (file: { fileId: string; fileName: string; webUrl?: string }) => {
    if (!draft || !onUpdateDraft) return;
    onUpdateDraft({
      ...draft,
      fileId: file.fileId,
      fileName: file.fileName,
      filePath: `${draft.customerName || ""}/שעות עבודה/${file.fileName}`,
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
  const handleSaveEdit = () => {
    if (!draft || !onUpdateDraft) return;

    const timeCalcs = computeTimesAndDuration(
      editStartTime.trim() || draft.startTime || "",
      editEndTime.trim() || draft.endTime || "",
      draft.durationMinutes || 30
    );

    const updated: HoursAssistantEntryDraft = {
      ...draft,
      customerName: editCustomer.trim(),
      date: editDate.trim(),
      startTime: timeCalcs.startTime,
      endTime: timeCalcs.endTime,
      durationMinutes: timeCalcs.durationMinutes,
      durationHours: timeCalcs.durationHours,
      durationFormatted: editDuration.trim() || timeCalcs.durationFormatted,
      isTimeSuggested: false,
      workType: editActivityType,
      activityType: editActivityType,
      targetTabName: editWorkType,
      description: editDescription.trim(),
      mappedRow: {
        ...(draft.mappedRow || {}),
        "שעת התחלה": timeCalcs.startTime,
        "שעת סיום": timeCalcs.endTime,
        משך: timeCalcs.durationHours,
        שעות: timeCalcs.durationHours,
        "סה״כ שעות": timeCalcs.durationHours,
        "סה\"כ שעות": timeCalcs.durationHours,
        תאריך: editDate.trim(),
        לקוח: editCustomer.trim(),
        תיאור: editDescription.trim(),
      },
      isReadyForConfirmation: Boolean(
        editCustomer.trim() && editDate.trim() && editDescription.trim()
      ),
    };
    onUpdateDraft(updated);
    setIsEditing(false);
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
      return <MapPin className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (s.includes("פרויקט") || s.includes("פרוייקט") || s.includes("project")) {
      return <FolderKanban className="w-3.5 h-3.5 text-purple-500" />;
    }
    return <Ticket className="w-3.5 h-3.5 text-blue-500" />;
  };

  const getListsWorkTypeBadge = (wt?: string) => {
    const norm = String(wt || "").toLowerCase();
    if (norm.includes("פרויקט") || norm.includes("project")) {
      return { label: "פרויקטים", bg: "bg-amber-100 text-amber-800 border-amber-300" };
    }
    if (
      norm.includes("ביקור") ||
      norm.includes("ביקורים") ||
      norm.includes("הגעה") ||
      norm.includes("onsite") ||
      norm.includes("visit")
    ) {
      return { label: "ביקור באתר", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    }
    return { label: "טיקטים", bg: "bg-blue-100 text-blue-800 border-blue-300" };
  };

  // ==========================================
  // 1. Written Entry State ("נרשם ✓")
  // ==========================================
  if (written) {
    const canStillUndo = timeLeftMs > 0 && written.canUndo;
    const workTypeBadge = getListsWorkTypeBadge(written.workType);
    const handlerDisplay = written.employeeName || currentUser?.name || "עובד";
    const titleDisplay = written.ticketNumber
      ? `טיקט ${written.ticketNumber.replace(/^(טיקט|ticket)\s*/i, "")}`
      : written.description && written.description.length <= 40
      ? written.description
      : `${written.customerName} - ${written.durationFormatted}`;

    return (
      <div className="relative overflow-hidden rounded-2xl bg-emerald-50/90 border border-emerald-200/80 p-4 sm:p-5 shadow-sm text-right my-2 text-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-emerald-200/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>נרשם בהצלחה ✓</span>
            </span>

            {/* 1. כותרת */}
            <span className="text-xs font-bold text-slate-900 font-mono">
              {titleDisplay}
            </span>

            {/* 2. סוג (טיקטים, פרויקטים, ביקור) */}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${workTypeBadge.bg}`}>
              {workTypeBadge.label}
            </span>
          </div>

          {/* Undo Button with 10-Minute Countdown */}
          {canStillUndo ? (
            <button
              onClick={() => onUndo && onUndo(written.id, written)}
              disabled={isUndoing}
              className="btn-hover-subtle inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
              title="ביטול ומחיקת השורה תוך 10 דקות"
            >
              <Undo2 className={`w-3.5 h-3.5 ${isUndoing ? "animate-spin" : ""}`} />
              <span>בטל ({formatTimeLeft(timeLeftMs)})</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">חלפו 10 דקות (לא ניתן לבטל)</span>
          )}
        </div>

        {/* 9-Columns Order Grid: לקוח, מטפל, שעת התחלה, שעת סיום, תאריך, כמה זמן הושקע */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs mb-3">
          {/* 3. לקוח */}
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">לקוח</span>
            <span className="font-bold text-slate-900 truncate block">{written.customerName}</span>
          </div>

          {/* 4. משתמש (SSO User) */}
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">משתמש (SSO)</span>
            <span className="font-bold text-blue-700 flex items-center gap-1 truncate">
              <User className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span className="truncate">{handlerDisplay}</span>
            </span>
          </div>

          {/* 5. שעת התחלה */}
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">שעת התחלה</span>
            <span className="font-mono font-semibold text-slate-800" dir="ltr">{written.startTime || "09:00"}</span>
          </div>

          {/* 6. שעת סיום */}
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">שעת סיום</span>
            <span className="font-mono font-semibold text-slate-800" dir="ltr">{written.endTime || "10:00"}</span>
          </div>

          {/* 7. תאריך */}
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">תאריך</span>
            <span className="font-semibold text-slate-800">{written.date}</span>
          </div>

          {/* 8. כמה זמן הושקע */}
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">כמה זמן הושקע</span>
            <span className="font-bold text-emerald-700 font-mono">{written.durationFormatted}</span>
          </div>
        </div>

        {/* 9. מה נעשה (Description) */}
        <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs text-slate-800 leading-relaxed mb-3 shadow-xs">
          <span className="text-[10px] text-slate-600 font-bold block mb-1">מה נעשה:</span>
          <p className="whitespace-pre-wrap">{written.description}</p>
        </div>

        {/* Dual-write Confirmation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-emerald-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>נרשם ב-Excel (טאב: {written.sheetName || written.workType}, שורה {written.targetRow})</span>
            </span>
            {written.listItemId ? (
              <span className="text-purple-700 font-semibold text-[11px] inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-purple-600" />
                <span>סונכרן ל-Microsoft Lists ✓ (סוג: {workTypeBadge.label})</span>
              </span>
            ) : written.listsSyncResult?.error ? (
              <span
                className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium text-[11px] inline-flex items-center gap-1"
                title={written.listsSyncResult.error}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>התרעת Lists: {written.listsSyncResult.error.length > 45 ? `${written.listsSyncResult.error.substring(0, 42)}...` : written.listsSyncResult.error}</span>
              </span>
            ) : (
              <span
                className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-medium text-[11px] inline-flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>ממתין לסנכרון Lists</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {written.webUrl && (
              <a
                href={written.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold underline transition-colors"
              >
                <span>פתח ב-Excel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <a
              href="https://techselectltd.sharepoint.com/sites/Customers/Lists/List/AllItems.aspx?env=WebViewList"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold underline transition-colors"
            >
              <span>צפה ב-Lists</span>
              <ExternalLink className="w-3.5 h-3.5" />
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

  const draftWorkTypeBadge = getListsWorkTypeBadge(draft?.targetTabName || draft?.workType);
  const draftHandlerDisplay = currentUser?.name || "עובד";
  const draftTitleDisplay = draft?.ticketNumber
    ? `טיקט ${draft.ticketNumber.replace(/^(טיקט|ticket)\s*/i, "")}`
    : draft?.projectName
    ? `פרוייקט: ${draft.projectName}`
    : draft?.description && draft.description.length <= 40
    ? draft.description
    : `${draft?.customerName || "לקוח"} - ${draft?.durationFormatted || "שעות"}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-sm text-right my-2 text-slate-800">
      {/* Top Banner: כותרת, סוג ולקוח */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                {draftTitleDisplay}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${draftWorkTypeBadge.bg}`}>
                {draftWorkTypeBadge.label}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>לקוח: <strong>{draft.customerName}</strong></span>
              <span>•</span>
              <span className="text-blue-600">משתמש: {draftHandlerDisplay}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            title="עריכה ידנית"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ערוך</span>
          </button>
        </div>
      </div>

      {/* Duplicate Warning if any */}
      {draft.duplicateWarning && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">אזהרת כפילות:</span> {draft.duplicateWarning}
          </div>
        </div>
      )}

      {/* Missing Fields Warning if any */}
      {draft.missingFields && draft.missingFields.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          <span className="font-bold">חסרים שדות חובה:</span> {draft.missingFields.join(", ")}
        </div>
      )}

      {/* Main Fields / Inline Edit Form */}
      {isEditing ? (
        <div className="space-y-3 mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-[11px] text-slate-600 font-medium mb-1">שם לקוח:</label>
            <input
              type="text"
              value={editCustomer}
              onChange={(e) => setEditCustomer(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-600 font-medium mb-1">תאריך:</label>
              <input
                type="text"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 font-medium mb-1">משך זמן (מעוגל ל-15 דק׳):</label>
              <input
                type="text"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                placeholder="0.25 שעה / 15 דקות"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-600 font-medium mb-1">שעת התחלה (24 שעות):</label>
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
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 font-medium mb-1">שעת סיום (24 שעות):</label>
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
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                dir="ltr"
              />
            </div>
          </div>

          {/* Field: סוג הפעילות (לדיווח ו-Microsoft Lists) */}
          <div>
            <label className="block text-[11px] text-slate-700 font-bold mb-1">
              סוג הפעילות (לדיווח ו-Microsoft Lists):
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { id: "טיקטים", label: "טיקטים / שירות", icon: <Ticket className="w-3.5 h-3.5" />, activeBg: "bg-blue-600 text-white border-blue-600" },
                { id: "ביקור באתר", label: "ביקור באתר", icon: <MapPin className="w-3.5 h-3.5" />, activeBg: "bg-emerald-600 text-white border-emerald-600" },
                { id: "פרויקטים", label: "פרויקטים", icon: <FolderKanban className="w-3.5 h-3.5" />, activeBg: "bg-amber-600 text-white border-amber-600" },
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
                      // Auto-sync excel tab if matching tab exists in file
                      const matchingTab = draft?.availableTabs?.find((t) => {
                        const tNorm = t.name.toLowerCase();
                        if (opt.id === "ביקור באתר") return tNorm.includes("ביקור") || tNorm.includes("onsite");
                        if (opt.id === "פרויקטים") return tNorm.includes("פרויקט") || tNorm.includes("project");
                        return tNorm.includes("טיקט") || tNorm.includes("קריא") || tNorm.includes("שירות");
                      });
                      if (matchingTab) setEditWorkType(matchingTab.name);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs ${
                      isSelected
                        ? `${opt.activeBg} font-bold`
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-600 font-medium mb-1">טאב באקסל (מתוך הקובץ):</label>
            {draft.availableTabs && draft.availableTabs.length > 0 ? (
              <div
                className={`grid gap-1.5 ${
                  draft.availableTabs.length <= 2
                    ? "grid-cols-2"
                    : draft.availableTabs.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-4"
                }`}
              >
                {draft.availableTabs.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setEditWorkType(t.name)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs ${
                      editWorkType === t.name
                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {getWorkTypeIcon(t.name)}
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={editWorkType}
                onChange={(e) => setEditWorkType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                placeholder="שם הטאב באקסל"
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] text-slate-700 font-bold mb-1">
              תיאור פעילות / תיעוד טכני מלא (קריטי ללקוח ולקובץ האקסל):
            </label>
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs resize-y"
              placeholder="פרט את כל הפעולות שבוצעו, שרתים, תקלות, בדיקות - אל תחסוך במילים"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>שמור שינויים</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Item: סוג הפעילות (לדיווח ו-Microsoft Lists) - Always prominent & 1-tap change */}
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 text-xs font-bold flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-blue-600" />
                סוג הפעילות (לדיווח ו-Lists):
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${draftWorkTypeBadge.bg}`}>
                {draftWorkTypeBadge.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "טיקטים", label: "טיקטים / שירות", icon: <Ticket className="w-3.5 h-3.5" />, activeBg: "bg-blue-600 text-white border-blue-600" },
                { id: "ביקור באתר", label: "ביקור באתר", icon: <MapPin className="w-3.5 h-3.5" />, activeBg: "bg-emerald-600 text-white border-emerald-600" },
                { id: "פרויקטים", label: "פרויקטים", icon: <FolderKanban className="w-3.5 h-3.5" />, activeBg: "bg-amber-600 text-white border-amber-600" },
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
                        // Find matching tab if available in this workbook
                        const matchingTab = draft.availableTabs?.find((t) => {
                          const tNorm = t.name.toLowerCase();
                          if (opt.id === "ביקור באתר") return tNorm.includes("ביקור") || tNorm.includes("onsite");
                          if (opt.id === "פרויקטים") return tNorm.includes("פרויקט") || tNorm.includes("project");
                          return tNorm.includes("טיקט") || tNorm.includes("קריא") || tNorm.includes("שירות");
                        });

                        onUpdateDraft({
                          ...draft,
                          workType: opt.id,
                          activityType: opt.id,
                          targetTabName: matchingTab ? matchingTab.name : draft.targetTabName,
                          availableTabs: draft.availableTabs?.map((t) => ({
                            ...t,
                            isSelected: matchingTab ? t.name === matchingTab.name : t.isSelected,
                          })),
                        });
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      isSelected
                        ? `${opt.activeBg} font-bold shadow-xs border`
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] text-slate-400 mt-1.5 block text-center">
              * סוג הפעילות נשמר בדיווח השעות ומסונכרן אוטומטית לעמודת "סוג הפעילות" ב-Microsoft Lists
            </span>
          </div>

          {/* Item 2: TAB IN THE SUMMARY - Shown if multiple tabs or to indicate Excel sheet */}
          {draft.availableTabs && draft.availableTabs.length > 1 && (
            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 text-[11px] font-semibold flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                  טאב יעד בקובץ האקסל:
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60 inline-flex items-center gap-1">
                  {getWorkTypeIcon(draft.targetTabName || draft.workType)}
                  {draft.targetTabName || draft.workType}
                </span>
              </div>

              <div
                className={`grid gap-1.5 ${
                  draft.availableTabs.length <= 2
                    ? "grid-cols-2"
                    : draft.availableTabs.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-4"
                }`}
              >
                {draft.availableTabs.map((tab) => {
                  const currentName = draft.targetTabName || draft.workType;
                  const isSelected = currentName === tab.name;
                  return (
                    <button
                      key={tab.name}
                      type="button"
                      onClick={() => {
                        if (onUpdateDraft) {
                          onUpdateDraft({
                            ...draft,
                            targetTabName: tab.name,
                            availableTabs: draft.availableTabs?.map((t) => ({
                              ...t,
                              isSelected: t.name === tab.name,
                            })),
                          });
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs border border-blue-600 font-bold"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                      title={`העבר לטאב ${tab.name}`}
                    >
                      {getWorkTypeIcon(tab.name)}
                      <span className="truncate">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Read-only Grid of Details */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                תאריך
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{draft.date}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                משך זמן
              </span>
              <span className="font-bold text-blue-600 mt-0.5 block truncate">
                {draft.durationFormatted || "לא צוין"}
              </span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  { mins: 15, h: 0.25, lbl: "15ד'" },
                  { mins: 30, h: 0.5, lbl: "30ד'" },
                  { mins: 45, h: 0.75, lbl: "45ד'" },
                  { mins: 60, h: 1, lbl: "1ש'" },
                  { mins: 90, h: 1.5, lbl: "1.5ש'" },
                  { mins: 120, h: 2, lbl: "2ש'" },
                ].map((d) => (
                  <button
                    key={d.mins}
                    type="button"
                    onClick={() => {
                      if (onUpdateDraft) {
                        const newEnd = draft.startTime
                          ? calcEndTimeFromDuration(draft.startTime, d.mins)
                          : draft.endTime;
                        const durationLbl = d.h === 1 ? "1 שעה" : `${d.h} שעות`;
                        onUpdateDraft({
                          ...draft,
                          durationMinutes: d.mins,
                          durationHours: d.h,
                          durationFormatted: durationLbl,
                          endTime: newEnd,
                          isTimeSuggested: false,
                          mappedRow: {
                            ...(draft.mappedRow || {}),
                            "שעת התחלה": draft.startTime,
                            "שעת סיום": newEnd,
                            משך: d.h,
                            שעות: d.h,
                            "סה״כ שעות": d.h,
                            "סה\"כ שעות": d.h,
                          },
                        });
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                      draft.durationMinutes === d.mins
                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {d.lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Item 1: 24-HOUR START/END TIMES (Modern, clean, editable, with Firefox 24h support) */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs col-span-2">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-slate-600 text-[11px] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  שעות פעילות (24 שעות):
                </span>
                {draft.isTimeSuggested && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                    משוער
                  </span>
                )}
              </div>

              {/* Editable Start/End Time Inputs (24h native format across Chrome & Firefox) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-between gap-1 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium">התחלה:</span>
                  <input
                    type="time"
                    lang="en-GB"
                    step="60"
                    value={draft.startTime || ""}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const timeCalcs = computeTimesAndDuration(
                        newStart,
                        draft.endTime || "",
                        draft.durationMinutes || 30
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
                            משך: timeCalcs.durationHours,
                            שעות: timeCalcs.durationHours,
                            "סה״כ שעות": timeCalcs.durationHours,
                            "סה\"כ שעות": timeCalcs.durationHours,
                          },
                        });
                      }
                    }}
                    className="text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 cursor-pointer"
                    dir="ltr"
                    title="הקש לשינוי שעת התחלה (שעון 24 שעות)"
                  />
                </div>

                <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-between gap-1 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium">סיום:</span>
                  <input
                    type="time"
                    lang="en-GB"
                    step="60"
                    value={draft.endTime || ""}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const timeCalcs = computeTimesAndDuration(
                        draft.startTime || "",
                        newEnd,
                        draft.durationMinutes || 30
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
                            משך: timeCalcs.durationHours,
                            שעות: timeCalcs.durationHours,
                            "סה״כ שעות": timeCalcs.durationHours,
                            "סה\"כ שעות": timeCalcs.durationHours,
                          },
                        });
                      }
                    }}
                    className="text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 cursor-pointer"
                    dir="ltr"
                    title="הקש לשינוי שעת סיום (שעון 24 שעות)"
                  />
                </div>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">
                * ניתן לשנות בלחיצה או בקולך (לדוגמה: "התחלתי ב-10")
              </span>
            </div>

            {/* Contact Person & Ticket Number with "לא קיים בקובץ" support */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <User className="w-3 h-3 text-blue-500" />
                איש קשר
              </span>
              <span className="text-xs font-semibold mt-0.5 block">
                {draft.unmappedFields && draft.unmappedFields.includes("contact_person") ? (
                  <span className="text-slate-400 font-normal italic text-[11px]">לא קיים בקובץ</span>
                ) : (
                  <span className="text-slate-800">{draft.contactPerson || "לא צוין"}</span>
                )}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <Ticket className="w-3 h-3 text-blue-500" />
                מספר קריאה / טיקט
              </span>
              <span className="text-xs font-semibold mt-0.5 block">
                {draft.unmappedFields && draft.unmappedFields.includes("ticket_number") ? (
                  <span className="text-slate-400 font-normal italic text-[11px]">לא קיים בקובץ</span>
                ) : (
                  <span className="text-slate-800 font-mono">{draft.ticketNumber || "ללא טיקט"}</span>
                )}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed mb-3 shadow-xs">
            <span className="text-[10px] text-slate-600 font-bold block mb-1">
              תיאור פעילות / תיעוד טכני מלא:
            </span>
            <p className="font-medium text-slate-900 whitespace-pre-wrap">{draft.description || "טרם הוזן תיאור"}</p>
          </div>

          {/* File Path & Target Row Info with Manual File Selector */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 mb-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                קובץ יעד ב-SharePoint:
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextState = !isSelectingFile;
                  setIsSelectingFile(nextState);
                  if (nextState && fileList.length === 0) {
                    loadCustomerFiles();
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <FolderOpen className="w-3 h-3" />
                <span>{draft.fileName ? "החלף קובץ" : "בחר קובץ ידנית"}</span>
                {isSelectingFile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Currently selected file display */}
            <div className="mt-1.5 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="font-mono text-slate-900 font-semibold text-xs truncate max-w-[220px] sm:max-w-xs" dir="ltr">
                {draft.fileName || (
                  <span className="text-amber-600 font-sans text-xs">⚠️ לא זוהה קובץ אוטומטית - בחר מהרשימה מטה</span>
                )}
              </span>
              {draft.targetRow ? (
                <span className="font-mono text-emerald-700 text-[11px] font-bold shrink-0" dir="ltr">
                  שורה {draft.targetRow}
                </span>
              ) : null}
            </div>

            {/* Interactive File Selector Dropdown / List */}
            {isSelectingFile && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>קבצי Excel בתיקיית שעות עבודה ({draft.customerName}):</span>
                  <button
                    type="button"
                    onClick={loadCustomerFiles}
                    disabled={isLoadingFiles}
                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? "animate-spin" : ""}`} />
                    <span>רענן רשימה</span>
                  </button>
                </div>

                {isLoadingFiles ? (
                  <div className="py-3 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>טוען קבצים מ-SharePoint...</span>
                  </div>
                ) : fileList.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {fileList.map((f) => {
                      const isSelected = draft.fileId === f.fileId || draft.fileName === f.fileName;
                      return (
                        <button
                          key={f.fileId}
                          type="button"
                          onClick={() => handleSelectFile(f)}
                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer border ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-900 font-bold"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                          dir="ltr"
                        >
                          <span className="truncate">{f.fileName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2 text-center text-slate-500 text-xs">
                    <p>לא נמצאו קבצי Excel ברשימה המקומית.</p>
                    <button
                      type="button"
                      onClick={loadCustomerFiles}
                      className="mt-1 text-blue-600 underline text-[11px] cursor-pointer"
                    >
                      לחץ כאן לסריקת קבצים מ-SharePoint
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Buttons: "אשר והזן" / "ערוך" */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
        <button
          onClick={() => {
            if (!draft.fileId && !draft.fileName) {
              setIsSelectingFile(true);
              if (fileList.length === 0) {
                loadCustomerFiles();
              }
              return;
            }
            if (onConfirm) onConfirm(draft.id, draft);
          }}
          disabled={isConfirming || !draft.isReadyForConfirmation}
          className="btn-primary-subtle w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <CheckCircle2 className={`w-4 h-4 ${isConfirming ? "animate-spin" : ""}`} />
          <span>{isConfirming ? "מזין שורה לקובץ..." : "אשר והזן"}</span>
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-hover-subtle w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? "בטל עריכה" : "ערוך שדות"}</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-2.5">
        ניתן לאשר גם בקולך: אמור <span className="text-blue-600 font-semibold">"כן"</span> או{" "}
        <span className="text-blue-600 font-semibold">"מאשר"</span>
      </p>
    </div>
  );
};
