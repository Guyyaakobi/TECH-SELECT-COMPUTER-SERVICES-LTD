import React, { useState, useEffect, useMemo } from "react";
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
  ShieldCheck,
} from "lucide-react";
import {
  apiGetTodayHoursSummary,
  apiDownloadExportExcel,
  DailyHoursReportClient,
  EmployeeDailySummaryClient,
  CustomerDailySummaryClient,
  LoggedHourEntryClient,
  TeamManagerAssignmentItem,
} from "../../services/hoursApiClient";

interface TodayHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAssistant?: (prompt: string) => void;
  currentUser?: { name: string; email: string; isAdmin?: boolean } | null;
  isSuperAdmin?: boolean;
  teamManagers?: TeamManagerAssignmentItem[];
  myTeamAssignment?: TeamManagerAssignmentItem | null;
  onOpenTeamSettings?: () => void;
}

const EMPLOYEE_ALIASES_MAP: Record<string, string[]> = {
  "גיא יעקובי": ["גיא", "guy", "guy yaakobi", "g@tech-select.co.il"],
  "ניב בורו": ["ניב", "niv", "niv boro", "niv@tech-select.co.il"],
  "ודים": ["ודים", "ואדים", "ודים גברילוב", "vadim", "vadim gavrilov", "vadim@tech-select.co.il"],
  "תבור כהן": ["תבור", "tavor", "tavor cohen", "tavor@tech-select.co.il"],
  "אירית יעקובי": ["אירית", "irit", "irit yaakobi", "irit@tech-select.co.il"],
  "יוסף": ["יוסף", "יוסי", "יוסף איאסה", "yosef", "yossi", "yosef@tech-select.co.il"],
  "אולג": ["אולג", "oleg", "oleg@tech-select.co.il"],
  "אריאל": ["אריאל", "אריאל מורי", "ariel", "ariel mori", "ariel@tech-select.co.il"],
  "אוריאל": ["אוריאל", "אוריאל פחימה", "uriel", "uriel fahima", "uriel@tech-select.co.il"],
  "ולד": ["ולד", "ולאד", "vlad", "vlad@tech-select.co.il"],
  "אמיר": ["אמיר", "אמיר בן ארויה", "amir", "amir@tech-select.co.il"],
  "שי": ["שי", "shai", "shaia", "shaia@tech-select.co.il", "shai@tech-select.co.il"],
};

function doesEmployeeBelongToAllowedList(
  entryName: string,
  entryEmail: string | undefined,
  allowedMembers: string[],
  managerEmail?: string
): boolean {
  const eName = String(entryName || "").trim().toLowerCase();
  const eFirstWord = eName.split(/\s+/)[0] || "";
  const eEmail = String(entryEmail || "").trim().toLowerCase();

  if (managerEmail && eEmail && eEmail === managerEmail.trim().toLowerCase()) {
    return true;
  }

  for (const target of allowedMembers) {
    const tClean = String(target || "").trim().toLowerCase();
    if (!tClean) continue;
    const tFirstWord = tClean.split(/\s+/)[0] || "";

    if (
      eName === tClean ||
      (tFirstWord.length >= 2 && eFirstWord === tFirstWord) ||
      (tClean.length >= 2 && eName.includes(tClean)) ||
      (eName.length >= 2 && tClean.includes(eName))
    ) {
      return true;
    }

    // Check alias dictionary
    for (const [canon, aliases] of Object.entries(EMPLOYEE_ALIASES_MAP)) {
      const group = [canon.toLowerCase(), ...aliases.map((a) => a.toLowerCase())];
      const targetInGroup = group.some((g) => g === tClean || g === tFirstWord);
      const entryInGroup =
        group.some((g) => g === eName || (eFirstWord.length >= 2 && g === eFirstWord)) ||
        (eEmail && group.includes(eEmail));
      if (targetInGroup && entryInGroup) {
        return true;
      }
    }
  }

  return false;
}

function buildFilteredReport(
  rawReport: DailyHoursReportClient | null,
  activeTeamFilter: TeamManagerAssignmentItem | null
): DailyHoursReportClient | null {
  if (!rawReport) return null;
  if (!activeTeamFilter) return rawReport;

  const allowedNames = Array.from(
    new Set([activeTeamFilter.managerName, ...(activeTeamFilter.employees || [])].filter(Boolean))
  );

  const filteredEntries = (rawReport.entries || []).filter((entry) =>
    doesEmployeeBelongToAllowedList(
      entry.employeeName,
      entry.employeeEmail,
      allowedNames,
      activeTeamFilter.managerEmail
    )
  );

  const empMap = new Map<string, EmployeeDailySummaryClient>();
  const custMap = new Map<string, CustomerDailySummaryClient>();
  let totalHours = 0;

  const formatHrs = (h: number) => {
    const wh = Math.floor(h);
    const mn = Math.round((h - wh) * 60);
    return `${String(wh).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
  };

  for (const entry of filteredEntries) {
    const hrs = Number(entry.durationHours) || 0;
    totalHours += hrs;

    const empKey = entry.employeeName || "עובד";
    const existingEmp: EmployeeDailySummaryClient = empMap.get(empKey) || {
      employeeName: empKey,
      employeeEmail: entry.employeeEmail,
      totalHours: 0,
      totalMinutes: 0,
      totalHoursFormatted: "00:00",
      entriesCount: 0,
      customers: [],
      entries: [],
    };
    existingEmp.totalHours = Math.round((existingEmp.totalHours + hrs) * 100) / 100;
    existingEmp.totalMinutes = Math.round(existingEmp.totalHours * 60);
    existingEmp.totalHoursFormatted = formatHrs(existingEmp.totalHours);
    existingEmp.entriesCount += 1;
    if (entry.customerName && !existingEmp.customers.includes(entry.customerName)) {
      existingEmp.customers.push(entry.customerName);
    }
    existingEmp.entries.push(entry);
    empMap.set(empKey, existingEmp);

    const custKey = entry.customerName || "לקוח";
    const existingCust: CustomerDailySummaryClient = custMap.get(custKey) || {
      customerName: custKey,
      totalHours: 0,
      totalMinutes: 0,
      totalHoursFormatted: "00:00",
      entriesCount: 0,
      employees: [],
      entries: [],
    };
    existingCust.totalHours = Math.round((existingCust.totalHours + hrs) * 100) / 100;
    existingCust.totalMinutes = Math.round(existingCust.totalHours * 60);
    existingCust.totalHoursFormatted = formatHrs(existingCust.totalHours);
    existingCust.entriesCount += 1;
    if (entry.employeeName && !existingCust.employees.includes(entry.employeeName)) {
      existingCust.employees.push(entry.employeeName);
    }
    existingCust.entries.push(entry);
    custMap.set(custKey, existingCust);
  }

  const roundedTotal = Math.round(totalHours * 100) / 100;
  const formatted = formatHrs(roundedTotal);

  const byEmployee = Array.from(empMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  const byCustomer = Array.from(custMap.values()).sort((a, b) => b.totalHours - a.totalHours);

  return {
    ...rawReport,
    totalHours: roundedTotal,
    totalHoursFormatted: formatted,
    totalEntries: filteredEntries.length,
    activeEmployeesCount: byEmployee.length,
    activeCustomersCount: byCustomer.length,
    byEmployee,
    byCustomer,
    entries: filteredEntries,
  };
}

export const TodayHoursModal: React.FC<TodayHoursModalProps> = ({
  isOpen,
  onClose,
  onAskAssistant,
  currentUser,
  isSuperAdmin = false,
  teamManagers = [],
  myTeamAssignment = null,
  onOpenTeamSettings,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [rawReport, setRawReport] = useState<DailyHoursReportClient | null>(null);
  const [selectedManagerFilterEmail, setSelectedManagerFilterEmail] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "customers" | "entries">("employees");
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Determine active team filter:
  // - If user is NOT super-admin (e.g. Niv or Vadim), lock to their myTeamAssignment
  // - If user IS super-admin (Guy), allow switching between "all" and any configured teamManager
  const activeTeamFilter: TeamManagerAssignmentItem | null = useMemo(() => {
    if (!isSuperAdmin && myTeamAssignment) {
      return myTeamAssignment;
    }
    if (isSuperAdmin && selectedManagerFilterEmail !== "all") {
      return (
        teamManagers.find(
          (m) => m.managerEmail.toLowerCase() === selectedManagerFilterEmail.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [isSuperAdmin, myTeamAssignment, selectedManagerFilterEmail, teamManagers]);

  const report = useMemo(
    () => buildFilteredReport(rawReport, activeTeamFilter),
    [rawReport, activeTeamFilter]
  );

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await apiDownloadExportExcel({
        date: report?.date || selectedDate,
        period: selectedDate,
        fallbackEntries: report?.entries || [],
        fileNamePrefix: `TechSelect_Hours_${report?.date || selectedDate}`,
      });
    } catch (err: any) {
      console.error("[TodayHoursModal] Excel export error:", err);
      setError(err?.message || "שגיאה בייצוא לקובץ Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  const fetchReport = async (dateStr?: string) => {
    try {
      setLoading(true);
      setError(null);
      const target = dateStr || selectedDate;
      let data: DailyHoursReportClient;
      if (target === "week") {
        data = await apiGetTodayHoursSummary({ period: "week", date: "this_week" });
      } else if (target === "last_week") {
        data = await apiGetTodayHoursSummary({ period: "week", date: "last_week" });
      } else {
        data = await apiGetTodayHoursSummary(target);
      }
      setRawReport(data);
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
    const teamTitle = activeTeamFilter ? ` (צוות ${activeTeamFilter.managerName})` : "";
    const lines = [
      `📊 *ריכוז שעות עבודה${teamTitle} - ${report.date}*`,
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
      className="fixed inset-0 z-50 bg-[#172B4D]/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-xl border border-[#DBEAFE] overflow-hidden flex flex-col text-right animate-in fade-in zoom-in-95 duration-200 text-[#172B4D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#DBEAFE] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#172B4D]">
                  {activeTeamFilter && !isSuperAdmin
                    ? `ריכוז צוות — ${activeTeamFilter.managerName}`
                    : "ריכוז תיעוד שעות לחיוב לקוח"}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {isSuperAdmin
                      ? `מנהל מערכת (${currentUser?.email || "g@tech-select.co.il"})`
                      : `מנהל צוות (${activeTeamFilter?.managerName || currentUser?.name || currentUser?.email || ""})`}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activeTeamFilter
                  ? `מציג פעילות שעות עבור צוות ${activeTeamFilter.managerName}: ${[
                      activeTeamFilter.managerName,
                      ...activeTeamFilter.employees.filter((e) => e !== activeTeamFilter.managerName),
                    ].join(", ")}`
                  : "צפייה מרוכזת בתיעוד שעות לחיוב שנרשם בקבצי הלקוחות ב-SharePoint"}
              </p>
            </div>
          </div>

          {/* Quick Date Switcher & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#EFF6FF] border border-[#DBEAFE] p-1 rounded-xl text-xs font-semibold text-[#172B4D]">
              <button
                onClick={() => setSelectedDate("today")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "today"
                    ? "bg-[#2563EB] text-white shadow-2xs font-bold"
                    : "hover:text-[#2563EB]"
                }`}
              >
                היום
              </button>
              <button
                onClick={() => setSelectedDate("yesterday")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "yesterday"
                    ? "bg-[#2563EB] text-white shadow-2xs font-bold"
                    : "hover:text-[#2563EB]"
                }`}
              >
                אתמול
              </button>
              <button
                onClick={() => setSelectedDate("week")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "week"
                    ? "bg-[#2563EB] text-white shadow-2xs font-bold"
                    : "hover:text-[#2563EB]"
                }`}
              >
                השבוע
              </button>
              <button
                onClick={() => setSelectedDate("last_week")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedDate === "last_week"
                    ? "bg-[#2563EB] text-white shadow-2xs font-bold"
                    : "hover:text-[#2563EB]"
                }`}
              >
                שבוע שעבר
              </button>
            </div>

            <button
              onClick={() => fetchReport(selectedDate === "custom" ? customDate : selectedDate)}
              disabled={loading}
              className="p-2 rounded-xl bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] transition-colors cursor-pointer"
              title="רענן נתונים"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#06B6D4]" : ""}`} />
            </button>

            <button
              onClick={handleCopySummary}
              disabled={!report || report.totalEntries === 0}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-xs font-medium text-[#172B4D] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              title="העתק סיכום ללוח"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#06B6D4]" /> : <Copy className="w-3.5 h-3.5 text-[#2563EB]" />}
              <span>{copied ? "הועתק!" : "העתק סיכום"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="הורד קובץ Excel (.xlsx) של התיעודים המוצגים"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exportingExcel ? "מייצא..." : "ייצוא ל-Excel"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-slate-500 hover:text-[#172B4D] flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Super-Admin Team Selector Bar (visible to Guy so he can switch between All Company or any Manager's team) */}
        {isSuperAdmin && (
          <div className="px-5 py-2.5 bg-white border-b border-[#DBEAFE]/70 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 ml-1">תצוגת צוות:</span>
              <button
                type="button"
                onClick={() => setSelectedManagerFilterEmail("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  selectedManagerFilterEmail === "all"
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "bg-[#F8FAFC] text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
                }`}
              >
                כל החברה
              </button>
              {teamManagers.map((mgr) => (
                <button
                  key={mgr.managerEmail}
                  type="button"
                  onClick={() => setSelectedManagerFilterEmail(mgr.managerEmail)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    selectedManagerFilterEmail.toLowerCase() === mgr.managerEmail.toLowerCase()
                      ? "bg-[#2563EB] text-white shadow-2xs"
                      : "bg-[#F8FAFC] text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
                  }`}
                >
                  <span>הצוות של {mgr.managerName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedManagerFilterEmail.toLowerCase() === mgr.managerEmail.toLowerCase()
                        ? "bg-white/20 text-white"
                        : "bg-[#EFF6FF] text-[#2563EB]"
                    }`}
                  >
                    {mgr.employees.length}
                  </span>
                </button>
              ))}
            </div>

            {onOpenTeamSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTeamSettings();
                }}
                className="px-2.5 py-1 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE]/70 border border-[#DBEAFE] text-[#2563EB] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ניהול ראשי צוות ושיוך עובדים</span>
              </button>
            )}
          </div>
        )}

        {/* KPI Summary Cards */}
        {report && (
          <div className="p-4 sm:px-6 bg-white border-b border-[#DBEAFE] shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                <div className="flex items-center justify-between text-xs text-[#2563EB] mb-1 font-medium">
                  <span>סה״כ שעות לחיוב</span>
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
                  {report.totalHours} <span className="text-xs font-normal text-slate-500">שעות</span>
                </div>
                <div className="text-[11px] text-[#2563EB] font-medium mt-0.5">
                  {report.totalHoursFormatted}
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DBEAFE]/80">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>עובדים מתעדים</span>
                  <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
                  {report.activeEmployeesCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {report.activeEmployeesCount === 1 ? "עובד אחד תיעד" : "עובדים שתיעדו"}
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DBEAFE]/80">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>לקוחות שטופלו</span>
                  <Building2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
                  {report.activeCustomersCount}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  לקוחות שקיבלו שירות
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DBEAFE]/80">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>תיעודים שנרשמו</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563EB]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
                  {report.totalEntries}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  רשומות בקבצי Excel
                </div>
              </div>
            </div>

            {/* Segmented View Tabs */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#DBEAFE]/70">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "employees"
                      ? "bg-[#2563EB] text-white shadow-2xs"
                      : "bg-white text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>לפי עובד ({report.byEmployee.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("customers")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "customers"
                      ? "bg-[#2563EB] text-white shadow-2xs"
                      : "bg-white text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>לפי לקוח ({report.byCustomer.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("entries")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "entries"
                      ? "bg-[#2563EB] text-white shadow-2xs"
                      : "bg-white text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>כל התיעודים ({report.totalEntries})</span>
                </button>
              </div>

              {onAskAssistant && (
                <button
                  onClick={() => {
                    onClose();
                    onAskAssistant("כמה רשמו היום שעות?");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE]/70 border border-[#DBEAFE] text-[#2563EB] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>שאל את העוזר על שעות אלו</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#F8FAFC]">
          {loading && (
            <div className="py-16 text-center">
              <div className="w-10 h-10 rounded-full border-3 border-[#DBEAFE] border-t-[#06B6D4] animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#172B4D]">סורק ומסכם שעות לחיוב מ-SharePoint...</p>
              <p className="text-xs text-slate-400 mt-1">בודק קבצי לקוחות פעילים ומאמת תיעודים</p>
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
              <div className="w-14 h-14 rounded-3xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#172B4D] mb-1">
                טרם תועדו שעות לחיוב לתאריך זה ({report.date})
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                כאשר עובדים יתעדו פעילויות לחיוב לקוח, התיעודים יופיעו כאן בזמן אמת.
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
                    className="rounded-2xl border border-[#DBEAFE] bg-white hover:border-[#2563EB]/30 transition-all shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedEmployee(isExpanded ? null : emp.employeeName)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                          {emp.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#172B4D]">{emp.employeeName}</span>
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
                                className="text-[10px] px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#172B4D] font-medium border border-[#DBEAFE]"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="text-base font-black text-[#2563EB]">
                            {emp.totalHours} <span className="text-xs font-normal text-slate-500">שעות לחיוב</span>
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {emp.entriesCount} תיעודים
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#2563EB]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#2563EB]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Rows */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-[#DBEAFE]/70 bg-[#F8FAFC] space-y-2">
                        {emp.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-white border border-[#DBEAFE] text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[#172B4D] font-medium">
                              <span className="font-bold text-[#172B4D]">{entry.customerName}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] font-bold">
                                {entry.durationHours} שעות לחיוב
                              </span>
                            </div>
                            <p className="text-[#172B4D] leading-relaxed whitespace-pre-line text-[11px]">
                              {entry.description}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-[#DBEAFE]/60">
                              <span>סוג פעילות: {entry.workType || entry.sheetName || "טיקטים"}</span>
                              {entry.ticketNumber && <span>קריאה: {entry.ticketNumber}</span>}
                              {entry.contactPerson && <span>איש קשר: {entry.contactPerson}</span>}
                              {entry.webUrl && (
                                <a
                                  href={entry.webUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2563EB] hover:underline flex items-center gap-0.5 mr-auto"
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
                    className="rounded-2xl border border-[#DBEAFE] bg-white hover:border-[#2563EB]/30 transition-all shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedCustomer(isExpanded ? null : cust.customerName)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#172B4D]">{cust.customerName}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-500">עובדים:</span>
                            {cust.employees.map((e) => (
                              <span
                                key={e}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#DBEAFE] text-[#172B4D] font-semibold"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="text-base font-black text-[#2563EB]">
                            {cust.totalHours} <span className="text-xs font-normal text-slate-500">שעות לחיוב</span>
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {cust.entriesCount} תיעודים
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#2563EB]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#2563EB]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Rows */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-[#DBEAFE]/70 bg-[#F8FAFC] space-y-2">
                        {cust.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-white border border-[#DBEAFE] text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[#172B4D] font-medium">
                              <span className="font-bold text-[#2563EB]">{entry.employeeName}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] font-bold">
                                {entry.durationHours} שעות לחיוב
                              </span>
                            </div>
                            <p className="text-[#172B4D] leading-relaxed whitespace-pre-line text-[11px]">
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
                  className="p-3.5 rounded-2xl bg-white border border-[#DBEAFE] hover:border-[#2563EB]/30 shadow-2xs text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#172B4D] text-sm">{entry.customerName}</span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] font-semibold text-[11px]">
                        {entry.employeeName}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] font-black text-xs">
                      {entry.durationHours} שעות לחיוב
                    </span>
                  </div>

                  <p className="text-[#172B4D] leading-relaxed whitespace-pre-line text-xs font-normal">
                    {entry.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1.5 border-t border-[#DBEAFE]/60">
                    <span>סוג פעילות: {entry.workType || entry.sheetName || "טיקטים"}</span>
                    {entry.ticketNumber && <span>קריאה: {entry.ticketNumber}</span>}
                    {entry.contactPerson && <span>איש קשר: {entry.contactPerson}</span>}
                    {entry.webUrl && (
                      <a
                        href={entry.webUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-0.5 mr-auto font-medium"
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
