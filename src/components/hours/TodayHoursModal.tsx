import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Clock,
  Users,
  Building2,
  FileSpreadsheet,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  apiGetTodayHoursSummary,
  DailyHoursReportClient,
  EmployeeDailySummaryClient,
  CustomerDailySummaryClient,
  LoggedHourEntryClient,
} from "../../services/hoursApiClient";

interface TodayHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAssistant?: (prompt: string) => void;
}

export const TodayHoursModal: React.FC<TodayHoursModalProps> = ({
  isOpen,
  onClose,
  onAskAssistant,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [report, setReport] = useState<DailyHoursReportClient | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "customers" | "entries">("employees");
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchReport = async (dateStr?: string) => {
    try {
      setLoading(true);
      setError(null);
      const target = dateStr || selectedDate;
      let data: DailyHoursReportClient;
      if (target === "week") {
        data = await apiGetTodayHoursSummary({ period: "week", date: "this_week" });
      } else {
        data = await apiGetTodayHoursSummary(target);
      }
      setReport(data);
    } catch (err: any) {
      console.error("[TodayHoursModal] Error fetching daily report:", err);
      setError(err?.message || "נכשלה טעינת דוח שעות יומי");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedDate === "custom" ? customDate : selectedDate);
    }
  }, [isOpen, selectedDate, customDate]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    if (!report) return;
    const lines = [
      `📊 *ריכוז שעות עבודה - ${report.date}*`,
      `סה״כ שעות: ${report.totalHours} שעות (${report.totalEntries} דיווחים)`,
      `עובדים פעילים: ${report.activeEmployeesCount} | לקוחות שטופלו: ${report.activeCustomersCount}`,
      "",
      "*פירוט לפי עובדים:*",
      ...report.byEmployee.map(
        (e) => `• *${e.employeeName}*: ${e.totalHours} שעות (${e.customers.join(", ")})`
      ),
      "",
      "*פירוט לפי לקוחות:*",
      ...report.byCustomer.map(
        (c) => `• *${c.customerName}*: ${c.totalHours} שעות (${c.employees.join(", ")})`
      ),
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  ריכוז שעות עבודה יומי
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-800 border border-blue-200">
                  מנהל (g@tech-select.co.il)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                צפייה מרוכזת בשעות שנרשמו היום בכל קבצי הלקוחות ב-SharePoint
              </p>
            </div>
          </div>

          {/* Quick Date Switcher & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setSelectedDate("today")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "today"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                היום
              </button>
              <button
                onClick={() => setSelectedDate("yesterday")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "yesterday"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                אתמול
              </button>
              <button
                onClick={() => setSelectedDate("week")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "week"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                השבוע
              </button>
            </div>

            <button
              onClick={() => fetchReport(selectedDate === "custom" ? customDate : selectedDate)}
              disabled={loading}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              title="רענן נתונים"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              onClick={handleCopySummary}
              disabled={!report || report.totalEntries === 0}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="העתק סיכום ללוח"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "הועתק!" : "העתק סיכום"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {report && (
          <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>סה״כ שעות</span>
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {report.totalHours} <span className="text-xs font-normal text-slate-500">שעות</span>
                </div>
                <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                  {report.totalHoursFormatted}
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>עובדים פעילים</span>
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {report.activeEmployeesCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {report.activeEmployeesCount === 1 ? "עובד אחד דיווח" : "עובדים שדיווחו היום"}
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>לקוחות שטופלו</span>
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {report.activeCustomersCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  לקוחות שקיבלו שירות
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>דיווחים שנרשמו</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {report.totalEntries}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  רשומות בקבצי Excel
                </div>
              </div>
            </div>

            {/* Segmented View Tabs */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "employees"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>לפי עובד ({report.byEmployee.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("customers")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "customers"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>לפי לקוח ({report.byCustomer.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("entries")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "entries"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>כל הדיווחים ({report.totalEntries})</span>
                </button>
              </div>

              {onAskAssistant && (
                <button
                  onClick={() => {
                    onClose();
                    onAskAssistant("כמה רשמו היום שעות?");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>שאל את העוזר על שעות אלו</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading && (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">סורק ומסכם שעות עבודה מ-SharePoint...</p>
              <p className="text-xs text-slate-400 mt-1">בודק קבצי לקוחות פעילים ומאמת דיווחים</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && report && report.totalEntries === 0 && (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                טרם נרשמו שעות עבודה לתאריך זה ({report.date})
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                כאשר עובדים ידווחו שעות באמצעות העוזר הקולי או ישירות ב-Excel, הדיווחים יופיעו כאן בזמן אמת.
              </p>
            </div>
          )}

          {/* TAB 1: BY EMPLOYEE */}
          {!loading && report && report.totalEntries > 0 && activeTab === "employees" && (
            <div className="space-y-3">
              {report.byEmployee.map((emp) => {
                const isExpanded = expandedEmployee === emp.employeeName;
                return (
                  <div
                    key={emp.employeeName}
                    className="rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedEmployee(isExpanded ? null : emp.employeeName)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                          {emp.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{emp.employeeName}</span>
                            {emp.employeeEmail && (
                              <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                                {emp.employeeEmail}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {emp.customers.map((c) => (
                              <span
                                key={c}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200/80"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="text-base font-black text-blue-600">
                            {emp.totalHours} <span className="text-xs font-normal text-slate-500">שעות</span>
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {emp.entriesCount} דיווחים
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Rows */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                        {emp.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-slate-600 font-medium">
                              <span className="font-bold text-slate-900">{entry.customerName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                                {entry.durationHours} שעות {entry.startTime ? `(${entry.startTime} - ${entry.endTime || ""})` : ""}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[11px]">
                              {entry.description}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                              <span>טאב: {entry.workType || entry.sheetName || "קריאות שירות"}</span>
                              {entry.ticketNumber && <span>קריאה: {entry.ticketNumber}</span>}
                              {entry.contactPerson && <span>איש קשר: {entry.contactPerson}</span>}
                              {entry.webUrl && (
                                <a
                                  href={entry.webUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-0.5 mr-auto"
                                >
                                  <span>פתח קובץ</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: BY CUSTOMER */}
          {!loading && report && report.totalEntries > 0 && activeTab === "customers" && (
            <div className="space-y-3">
              {report.byCustomer.map((cust) => {
                const isExpanded = expandedCustomer === cust.customerName;
                return (
                  <div
                    key={cust.customerName}
                    className="rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedCustomer(isExpanded ? null : cust.customerName)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900">{cust.customerName}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-500">עובדים:</span>
                            {cust.employees.map((e) => (
                              <span
                                key={e}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="text-base font-black text-emerald-700">
                            {cust.totalHours} <span className="text-xs font-normal text-slate-500">שעות</span>
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {cust.entriesCount} דיווחים
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Rows */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                        {cust.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-slate-600 font-medium">
                              <span className="font-bold text-blue-700">{entry.employeeName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                {entry.durationHours} שעות {entry.startTime ? `(${entry.startTime} - ${entry.endTime || ""})` : ""}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[11px]">
                              {entry.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ALL ENTRIES */}
          {!loading && report && report.totalEntries > 0 && activeTab === "entries" && (
            <div className="space-y-2.5">
              {report.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{entry.customerName}</span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        {entry.employeeName}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black text-xs">
                      {entry.durationHours} שעות
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs font-normal">
                    {entry.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                    {entry.startTime && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{entry.startTime} עד {entry.endTime || ""}</span>
                      </span>
                    )}
                    <span>טאב: {entry.workType || entry.sheetName || "שעות"}</span>
                    {entry.ticketNumber && <span>קריאה: {entry.ticketNumber}</span>}
                    {entry.contactPerson && <span>איש קשר: {entry.contactPerson}</span>}
                    {entry.webUrl && (
                      <a
                        href={entry.webUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-0.5 mr-auto font-medium"
                      >
                        <span>פתח ב-Excel</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
