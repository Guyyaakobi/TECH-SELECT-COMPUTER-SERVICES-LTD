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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" dir="rtl">
      <div className="w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>יומן שעות מרכזי (קובץ LOG תחת TOOLS)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  שליפה מהירה
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                תיעוד כפול ומקביל לכלל הלקוחות והעובדים עם אפשרות מחיקה ועדכון
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncSharePoint}
              disabled={syncing}
              className="text-xs px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="סנכרן וצור קובץ LOG.xlsx ישירות בספריית Tools ב-SharePoint"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${syncing ? "animate-bounce" : ""}`} />
              <span>{syncing ? "מסנכרן ל-SharePoint..." : "סנכרן ל-SharePoint Tools"}</span>
            </button>

            <a
              href="/api/hours/log/export"
              download="TOOLS_LOG.xlsx"
              className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              title="הורד קובץ Excel של יומן השעות המרכזי"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>הורד Excel (LOG)</span>
            </a>

            <button
              onClick={fetchLog}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="רענן נתונים"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer font-bold transition-colors"
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
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-medium flex items-center gap-1 text-[11px]"
              >
                <span>פתח ספריית Tools ב-SharePoint</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setSyncResult(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Filters and Stats Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי לקוח, עובד, תיאור..."
                className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Date filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setDateFilter("all")}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  dateFilter === "all" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                הכל ({entries.length})
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  dateFilter === "today" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                היום
              </button>
              <button
                onClick={() => setDateFilter("yesterday")}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  dateFilter === "yesterday" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                אתמול
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>סה״כ שעות: <strong className="text-slate-900">{totalHours}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>רשומות פעילות: <strong className="text-slate-900">{activeFiltered.length}</strong></span>
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          {loading && entries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm">טוען נתונים מיומן השעות המרכזי...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">לא נמצאו רשומות מתאימות ביומן השעות</p>
              <p className="text-xs text-slate-400 mt-1">כל דיווח שמאושר נרשם כאן אוטומטית במקביל</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3">תאריך</th>
                  <th className="py-2.5 px-3">שם לקוח</th>
                  <th className="py-2.5 px-3">עובד</th>
                  <th className="py-2.5 px-3">סוג</th>
                  <th className="py-2.5 px-3">שעות</th>
                  <th className="py-2.5 px-3">משעה - עד שעה</th>
                  <th className="py-2.5 px-3 min-w-[280px]">מה בוצע</th>
                  <th className="py-2.5 px-3">סטטוס</th>
                  <th className="py-2.5 px-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {filteredEntries.map((row) => {
                  const isCancelled = row.status === "בוטל";
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCancelled ? "opacity-50 bg-slate-50/40" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {row.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {row.employeeName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {row.workType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-700 whitespace-nowrap">
                        {row.durationFormatted || `${row.durationHours} שע'`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap" dir="ltr">
                        {row.startTime && row.endTime ? `${row.startTime} - ${row.endTime}` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 leading-relaxed">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>בוטל</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
                                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] cursor-pointer transition-colors"
                              >
                                ביטול
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(row.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="בטל / מחק שורה זו מיומן השעות"
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
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>מציג {filteredEntries.length} מתוך {entries.length} רשומות</span>
            <span>•</span>
            <span>קובץ ה-LOG נשמר תחת תיקיית TOOLS ומסונכרן מיידית</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
