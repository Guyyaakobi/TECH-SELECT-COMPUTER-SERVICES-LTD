import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  CloudUpload,
  ExternalLink,
} from "lucide-react";
import {
  apiGetCentralLog,
  apiDeleteCentralLogEntry,
  apiSyncCentralLogToSharePoint,
  CentralLogItemClient,
} from "../../services/hoursApiClient";

interface CentralHoursLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    id?: string;
    oid?: string;
    username?: string;
    upn?: string;
    isAdmin?: boolean;
  };
}

export const CentralHoursLogModal: React.FC<CentralHoursLogModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [entries, setEntries] = useState<CentralLogItemClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    webUrl?: string;
    error?: string;
  } | null>(null);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const res = await apiGetCentralLog({
        includeCancelled: true,
      });
      setEntries(res.entries || []);
    } catch (err) {
      console.error("[CentralHoursLogModal] Error fetching log:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSharePoint = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await apiSyncCentralLogToSharePoint();
      setSyncResult({
        success: true,
        message: res.message || "קובץ LOG.xlsx סונכרן בהצלחה ל-SharePoint Tools!",
        webUrl: res.webUrl,
      });
    } catch (err: any) {
      console.error("[CentralHoursLogModal] SharePoint sync error:", err);
      setSyncResult({
        success: false,
        message: err?.message || "שגיאה בסנכרון ל-SharePoint Tools",
        error: String(err?.message || err),
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLog();
    }
  }, [isOpen]);

  const isGuy = currentUser?.email?.toLowerCase() === "g@tech-select.co.il";
  if (!isOpen || !isGuy) return null;

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await apiDeleteCentralLogEntry(id);
      // Update local state to cancelled
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "בוטל" as const } : e))
      );
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("[CentralHoursLogModal] Error deleting entry:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const todayIso = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayIso = yesterdayDate.toISOString().split("T")[0];

  const filteredEntries = entries.filter((e) => {
    if (dateFilter === "today" && e.date !== todayIso) return false;
    if (dateFilter === "yesterday" && e.date !== yesterdayIso) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const text = `${e.customerName} ${e.employeeName} ${e.description} ${e.workType} ${e.date}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const activeFiltered = filteredEntries.filter((e) => e.status !== "בוטל");
  const totalHours = Math.round(
    activeFiltered.reduce((sum, e) => sum + (e.durationHours || 0), 0) * 100
  ) / 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#172B4D]/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" dir="rtl">
      <div className="w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-xl border border-[#DBEAFE] overflow-hidden flex flex-col text-[#172B4D]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DBEAFE] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <span>יומן תיעוד מרכזי (קובץ LOG תחת TOOLS)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] font-medium">
                  סנכרון מהיר
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                תיעוד שעות לחיוב לקוח מרוכז עם אפשרות עדכון וייצוא
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/hours/export-excel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ייצא את כל הנתונים מ-Microsoft Lists לקובץ Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ייצוא ל-Excel מ-Lists</span>
            </a>

            <button
              onClick={handleSyncSharePoint}
              disabled={syncing}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE]/80 border border-[#DBEAFE] text-[#2563EB] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="סנכרן וצור קובץ LOG.xlsx ישירות בספריית Tools ב-SharePoint"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${syncing ? "animate-bounce" : ""}`} />
              <span>{syncing ? "מסנכרן ל-SharePoint..." : "סנכרן ל-SharePoint Tools"}</span>
            </button>

            <a
              href="/api/hours/log/export"
              download="TOOLS_LOG.xlsx"
              className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-[#172B4D] font-medium flex items-center gap-1.5 transition-colors"
              title="הורד קובץ Excel של יומן השעות המרכזי"
            >
              <Download className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>הורד Excel (LOG)</span>
            </a>

            <button
              onClick={fetchLog}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] transition-colors cursor-pointer"
              title="רענן נתונים"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#06B6D4]" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-slate-500 hover:text-[#172B4D] cursor-pointer font-bold transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncResult && (
          <div
            className={`px-6 py-3 border-b text-xs flex items-center justify-between transition-all ${
              syncResult.success
                ? "bg-[#EFF6FF] border-[#DBEAFE] text-[#172B4D]"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#06B6D4] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div className="leading-relaxed">
                <span className="font-bold">{syncResult.message}</span>
                {!syncResult.success && (
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    לסנכרון ישיר מהשרת ל-SharePoint נדרש להוסיף הרשאת <code>Sites.ReadWrite.All</code> (מסוג Application עם Admin Consent) לאפליקציה ב-Azure.
                    בינתיים ניתן להוריד את הקובץ בלחיצה על <strong>הורד Excel (LOG)</strong> ולגרור אותו ישירות לתיקיית Tools.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://techselectltd.sharepoint.com/sites/Customers/Tools/Forms/AllItems.aspx"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white border border-[#DBEAFE] text-[#2563EB] hover:bg-[#EFF6FF] font-medium flex items-center gap-1 text-[11px]"
              >
                <span>פתח ספריית Tools ב-SharePoint</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setSyncResult(null)}
                className="text-slate-400 hover:text-[#172B4D] text-xs px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Filters and Stats Bar */}
        <div className="p-4 border-b border-[#DBEAFE]/70 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי לקוח, עובד, תיאור..."
                className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
              />
            </div>

            {/* Date filter buttons */}
            <div className="flex items-center gap-1 bg-[#EFF6FF] p-0.5 rounded-xl border border-[#DBEAFE] text-xs">
              <button
                onClick={() => setDateFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFilter === "all" ? "bg-[#2563EB] text-white shadow-2xs" : "text-[#172B4D] hover:text-[#2563EB]"
                }`}
              >
                הכל ({entries.length})
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFilter === "today" ? "bg-[#2563EB] text-white shadow-2xs" : "text-[#172B4D] hover:text-[#2563EB]"
                }`}
              >
                היום
              </button>
              <button
                onClick={() => setDateFilter("yesterday")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFilter === "yesterday" ? "bg-[#2563EB] text-white shadow-2xs" : "text-[#172B4D] hover:text-[#2563EB]"
                }`}
              >
                אתמול
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>סה״כ שעות לחיוב: <strong className="text-[#172B4D]">{totalHours}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>רשומות פעילות: <strong className="text-[#172B4D]">{activeFiltered.length}</strong></span>
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-[#F8FAFC]">
          {loading && entries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#06B6D4]" />
              <p className="text-sm text-[#172B4D] font-medium">טוען נתונים מיומן התיעוד המרכזי...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold text-[#172B4D]">לא נמצאו רשומות מתאימות ביומן התיעוד</p>
              <p className="text-xs text-slate-400 mt-1">כל תיעוד שמאושר נרשם כאן אוטומטית במקביל</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-[#EFF6FF] text-[#172B4D] font-semibold sticky top-0 border-b border-[#DBEAFE] z-10">
                <tr>
                  <th className="py-2.5 px-3">תאריך</th>
                  <th className="py-2.5 px-3">שם לקוח</th>
                  <th className="py-2.5 px-3">עובד</th>
                  <th className="py-2.5 px-3">סוג</th>
                  <th className="py-2.5 px-3">שעות לחיוב</th>
                  <th className="py-2.5 px-3 min-w-[280px]">תיאור פעילות</th>
                  <th className="py-2.5 px-3">סטטוס</th>
                  <th className="py-2.5 px-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]/60 bg-white">
                {filteredEntries.map((row) => {
                  const isCancelled = row.status === "בוטל";
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isCancelled ? "opacity-50 bg-[#F8FAFC]/60" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#172B4D] whitespace-nowrap">
                        {row.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-[#172B4D] whitespace-nowrap">
                        {row.employeeName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] font-medium">
                          {row.workType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#2563EB] whitespace-nowrap">
                        {row.durationFormatted || `${row.durationHours} שע'`}
                      </td>
                      <td className="py-2.5 px-3 text-[#172B4D] leading-relaxed">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>בוטל</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                            <CheckCircle2 className="w-3 h-3 text-[#06B6D4]" />
                            <span>פעיל</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {!isCancelled && (
                          confirmDeleteId === row.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleDelete(row.id)}
                                disabled={deletingId === row.id}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                {deletingId === row.id ? "מוחק..." : "אשר מחיקה"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#172B4D] text-[11px] cursor-pointer transition-colors"
                              >
                                ביטול
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(row.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="בטל / מחק שורה זו מיומן התיעוד"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#DBEAFE] bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>מציג {filteredEntries.length} מתוך {entries.length} רשומות</span>
            <span>•</span>
            <span>קובץ ה-LOG נשמר תחת תיקיית TOOLS ומסונכרן מיידית</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold cursor-pointer transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
