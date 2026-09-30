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
  onConfirm?: (cardId: string) => void;
  onUndo?: (cardId: string) => void;
  onUpdateDraft?: (updated: HoursAssistantEntryDraft) => void;
  isConfirming?: boolean;
  isUndoing?: boolean;
}

export const HoursEntryCard: React.FC<HoursEntryCardProps> = ({
  draft,
  written,
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
    setEditDescription(draft.description || "");
  }, [
    draft?.customerName,
    draft?.date,
    draft?.durationFormatted,
    draft?.startTime,
    draft?.endTime,
    draft?.workType,
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
    const updated: HoursAssistantEntryDraft = {
      ...draft,
      customerName: editCustomer.trim(),
      date: editDate.trim(),
      durationFormatted: editDuration.trim(),
      startTime: editStartTime.trim() || draft.startTime,
      endTime: editEndTime.trim() || draft.endTime,
      isTimeSuggested: false,
      workType: editWorkType,
      description: editDescription.trim(),
      isReadyForConfirmation: Boolean(
        editCustomer.trim() && editDate.trim() && editDuration.trim() && editDescription.trim()
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

  // ==========================================
  // 1. Written Entry State ("נרשם ✓")
  // ==========================================
  if (written) {
    const canStillUndo = timeLeftMs > 0 && written.canUndo;

    return (
      <div className="relative overflow-hidden rounded-2xl bg-emerald-50/90 border border-emerald-200/80 p-4 sm:p-5 shadow-sm text-right my-2 text-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-emerald-200/60">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>נרשם ✓</span>
            </span>
            <span className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
              {written.customerName}
            </span>
          </div>

          {/* Undo Button with 10-Minute Countdown */}
          {canStillUndo ? (
            <button
              onClick={() => onUndo && onUndo(written.id)}
              disabled={isUndoing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xs"
              title="ביטול ומחיקת השורה תוך 10 דקות"
            >
              <Undo2 className={`w-3.5 h-3.5 ${isUndoing ? "animate-spin" : ""}`} />
              <span>בטל ({formatTimeLeft(timeLeftMs)})</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">חלפו 10 דקות (לא ניתן לבטל)</span>
          )}
        </div>

        {/* Written Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">תאריך</span>
            <span className="font-semibold text-slate-800">{written.date}</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">משך</span>
            <span className="font-bold text-emerald-700">{written.durationFormatted}</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">טאב באקסל</span>
            <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
              {getWorkTypeIcon(written.workType)}
              {written.sheetName || written.workType}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[10px]">שורה</span>
            <span className="font-bold text-emerald-800 font-mono" dir="ltr">
              שורה {written.targetRow}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs text-slate-800 leading-relaxed mb-3 shadow-xs">
          <span className="text-[10px] text-slate-500 block mb-0.5">תיאור חיוב:</span>
          {written.description}
        </div>

        {/* Link to Excel File */}
        {written.webUrl && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-200/60">
            <span className="text-slate-600 text-[11px] truncate max-w-[200px]" dir="ltr">
              {written.fileName}
            </span>
            <a
              href={written.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold underline transition-colors"
            >
              <span>פתח קובץ ב-Excel Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. Draft / Summary Card State
  // ==========================================
  if (!draft) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-sm text-right my-2 text-slate-800">
      {/* Top Banner: Customer Name & Status */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {draft.customerName || "לקוח לא זוהה"}
            </h4>
            <span className="text-[10px] text-slate-500">סיכום רשומה לתיעוד</span>
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
              <label className="block text-[11px] text-slate-600 font-medium mb-1">שעת התחלה:</label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditStartTime(val);
                  if (val && draft?.durationMinutes) {
                    setEditEndTime(calcEndTimeFromDuration(val, draft.durationMinutes));
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 font-medium mb-1">שעת סיום:</label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                dir="ltr"
              />
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
            <label className="block text-[11px] text-slate-600 font-medium mb-1">תיאור חיוב:</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
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
          {/* Item 2: TAB IN THE SUMMARY - Always prominent & 1-tap change */}
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-[11px] font-semibold flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                טאב בקובץ:
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60 inline-flex items-center gap-1">
                {getWorkTypeIcon(draft.targetTabName || draft.workType)}
                {draft.targetTabName || draft.workType}
              </span>
            </div>

            {/* Tap or voice to change tab - Built strictly from this file's real data tabs */}
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
                            workType: tab.name,
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
            ) : (
              <div className="text-xs font-bold text-blue-700 bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1.5">
                {getWorkTypeIcon(draft.targetTabName || draft.workType)}
                <span>{draft.targetTabName || draft.workType}</span>
              </div>
            )}
            <span className="text-[9px] text-slate-400 mt-1.5 block text-center">
              * לחץ על טאב לשינוי מיידי או אמור בקולך (לדוגמה: "תעביר לטאב פרויקטים")
            </span>
          </div>

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
              <span className="font-bold text-blue-600 mt-0.5 block">
                {draft.durationFormatted || "לא צוין"}
              </span>
            </div>

            {/* Item 1: SUGGESTED START/END TIMES (editable, marked 'משוער') */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs col-span-2">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-slate-600 text-[11px] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  שעות פעילות:
                </span>
                {draft.isTimeSuggested && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                    משוער
                  </span>
                )}
              </div>

              {/* Editable Start/End Time Inputs (tap to edit) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-between gap-1 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium">התחלה:</span>
                  <input
                    type="time"
                    value={draft.startTime || ""}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const durationM = draft.durationMinutes || 30;
                      const newEnd = newStart ? calcEndTimeFromDuration(newStart, durationM) : draft.endTime;
                      if (onUpdateDraft) {
                        onUpdateDraft({
                          ...draft,
                          startTime: newStart,
                          endTime: newEnd,
                          isTimeSuggested: false,
                        });
                      }
                    }}
                    className="text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 cursor-pointer"
                    dir="ltr"
                    title="הקש לשינוי שעת התחלה"
                  />
                </div>

                <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-between gap-1 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium">סיום:</span>
                  <input
                    type="time"
                    value={draft.endTime || ""}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      if (onUpdateDraft) {
                        onUpdateDraft({
                          ...draft,
                          endTime: newEnd,
                          isTimeSuggested: false,
                        });
                      }
                    }}
                    className="text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 cursor-pointer"
                    dir="ltr"
                    title="הקש לשינוי שעת סיום"
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
            <span className="text-[10px] text-slate-500 block mb-0.5">תיאור חיוב:</span>
            <p className="font-medium text-slate-900">{draft.description || "טרם הוזן תיאור"}</p>
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
            if (onConfirm) onConfirm(draft.id);
          }}
          disabled={isConfirming || !draft.isReadyForConfirmation}
          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <CheckCircle2 className={`w-4 h-4 ${isConfirming ? "animate-spin" : ""}`} />
          <span>{isConfirming ? "מזין שורה לקובץ..." : "אשר והזן"}</span>
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
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
