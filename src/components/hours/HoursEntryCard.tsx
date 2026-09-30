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
  const [editWorkType, setEditWorkType] = useState<"ביקור באתר" | "טיקטים" | "פרוייקטים">(
    (draft?.workType as any) || "טיקטים"
  );
  const [editDescription, setEditDescription] = useState(draft?.description || "");

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
    if (wt === "ביקור באתר" || wt === "באתר") return <MapPin className="w-3.5 h-3.5 text-amber-400" />;
    if (wt === "פרוייקטים" || wt === "פרויקטים") return <FolderKanban className="w-3.5 h-3.5 text-purple-400" />;
    return <Ticket className="w-3.5 h-3.5 text-cyan-400" />;
  };

  // ==========================================
  // 1. Written Entry State ("נרשם ✓")
  // ==========================================
  if (written) {
    const canStillUndo = timeLeftMs > 0 && written.canUndo;

    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-black/60 border border-emerald-500/40 p-4 sm:p-5 shadow-xl text-right my-2">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>נרשם ✓</span>
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
              {written.customerName}
            </span>
          </div>

          {/* Undo Button with 10-Minute Countdown */}
          {canStillUndo ? (
            <button
              onClick={() => onUndo && onUndo(written.id)}
              disabled={isUndoing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <span className="text-slate-400 block text-[10px]">תאריך</span>
            <span className="font-semibold text-slate-200">{written.date}</span>
          </div>
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <span className="text-slate-400 block text-[10px]">משך</span>
            <span className="font-semibold text-emerald-300">{written.durationFormatted}</span>
          </div>
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <span className="text-slate-400 block text-[10px]">טאב באקסל</span>
            <span className="font-semibold text-slate-200 inline-flex items-center gap-1">
              {getWorkTypeIcon(written.workType)}
              {written.sheetName || written.workType}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <span className="text-slate-400 block text-[10px]">שורה</span>
            <span className="font-semibold text-cyan-300 font-mono" dir="ltr">
              שורה {written.targetRow}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-200 leading-relaxed mb-3">
          <span className="text-[10px] text-slate-400 block mb-0.5">תיאור חיוב:</span>
          {written.description}
        </div>

        {/* Link to Excel File */}
        {written.webUrl && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <span className="text-slate-400 text-[11px] truncate max-w-[200px]" dir="ltr">
              {written.fileName}
            </span>
            <a
              href={written.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium hover:underline transition-colors"
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-black/80 border border-blue-500/30 p-4 sm:p-5 shadow-xl text-right my-2">
      {/* Top Banner: Customer Name & Status */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {draft.customerName || "לקוח לא זוהה"}
            </h4>
            <span className="text-[10px] text-slate-400">סיכום רשומה לתיעוד</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="עריכה ידנית"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ערוך</span>
          </button>
        </div>
      </div>

      {/* Duplicate Warning if any */}
      {draft.duplicateWarning && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">אזהרת כפילות:</span> {draft.duplicateWarning}
          </div>
        </div>
      )}

      {/* Missing Fields Warning if any */}
      {draft.missingFields && draft.missingFields.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-300">
          <span className="font-bold">חסרים שדות חובה:</span> {draft.missingFields.join(", ")}
        </div>
      )}

      {/* Main Fields / Inline Edit Form */}
      {isEditing ? (
        <div className="space-y-3 mb-4 p-3 rounded-xl bg-black/40 border border-white/10">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">שם לקוח:</label>
            <input
              type="text"
              value={editCustomer}
              onChange={(e) => setEditCustomer(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">תאריך:</label>
              <input
                type="text"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">משך זמן (מעוגל ל-15 דק׳):</label>
              <input
                type="text"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="0.25 שעה / 15 דקות"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">סוג עבודה (טאב באקסל):</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["ביקור באתר", "טיקטים", "פרוייקטים"] as const).map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setEditWorkType(wt)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    editWorkType === wt
                      ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {getWorkTypeIcon(wt)}
                  <span>{wt}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">תיאור חיוב:</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>שמור שינויים</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Read-only Grid of Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                תאריך
              </span>
              <span className="font-semibold text-slate-200 mt-0.5 block">{draft.date}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                משך זמן
              </span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                {draft.durationFormatted || "לא צוין"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                {getWorkTypeIcon(draft.workType)}
                סוג עבודה (טאב באקסל)
              </span>
              <span className="font-semibold text-slate-200 mt-0.5 block">{draft.workType}</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-200 leading-relaxed mb-3">
            <span className="text-[10px] text-slate-400 block mb-0.5">תיאור חיוב:</span>
            <p className="font-medium">{draft.description || "טרם הוזן תיאור"}</p>
          </div>

          {/* File Path & Target Row Info with Manual File Selector */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-950/30 to-black/40 border border-blue-500/25 text-xs text-slate-300 mb-4 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                קובץ יעד באקסל:
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
                className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-white border border-blue-400/30 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
              >
                <FolderOpen className="w-3 h-3" />
                <span>{draft.fileName ? "החלף קובץ" : "בחר קובץ ידנית"}</span>
                {isSelectingFile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Currently selected file display */}
            <div className="mt-1.5 flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
              <span className="font-mono text-cyan-300 font-semibold text-xs truncate max-w-[220px] sm:max-w-xs" dir="ltr">
                {draft.fileName || (
                  <span className="text-amber-400 font-sans text-xs">⚠️ לא זוהה קובץ אוטומטית - בחר מהרשימה מטה</span>
                )}
              </span>
              {draft.targetRow ? (
                <span className="font-mono text-emerald-400 text-[11px] font-bold shrink-0" dir="ltr">
                  שורה {draft.targetRow}
                </span>
              ) : null}
            </div>

            {/* Interactive File Selector Dropdown / List */}
            {isSelectingFile && (
              <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>קבצי Excel זמינים בתיקיית הלקוח ({draft.customerName}):</span>
                  <button
                    type="button"
                    onClick={loadCustomerFiles}
                    disabled={isLoadingFiles}
                    className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? "animate-spin" : ""}`} />
                    <span>רענן רשימה</span>
                  </button>
                </div>

                {isLoadingFiles ? (
                  <div className="py-3 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
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
                              ? "bg-blue-600/40 border-blue-400 text-white font-bold"
                              : "bg-black/30 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                          dir="ltr"
                        >
                          <span className="truncate">{f.fileName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2 text-center text-slate-400 text-xs">
                    <p>לא נמצאו קבצי Excel ברשימה המקומית.</p>
                    <button
                      type="button"
                      onClick={loadCustomerFiles}
                      className="mt-1 text-blue-400 underline text-[11px] cursor-pointer"
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
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-white/10">
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
          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all duration-250 ease-out hover:scale-[1.02] hover:shadow-cyan-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <CheckCircle2 className={`w-4 h-4 ${isConfirming ? "animate-spin" : ""}`} />
          <span>{isConfirming ? "מזין שורה לקובץ..." : "אשר והזן"}</span>
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:border-white/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? "בטל עריכה" : "ערוך שדות"}</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-2">
        ניתן לאשר גם בקולך: אמור <span className="text-cyan-300 font-semibold">"כן"</span> או{" "}
        <span className="text-cyan-300 font-semibold">"מאשר"</span>
      </p>
    </div>
  );
};
