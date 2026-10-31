import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  RefreshCw,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  AlertCircle,
  ListChecks,
  User,
  CalendarDays,
  Edit3,
  Save,
} from "lucide-react";
import {
  apiGetMyListsDailySummary,
  apiAssistantChat,
  UserListsDailySummaryClient,
  UserListsDayGroupClient,
  UserListsEntryClient,
} from "../../services/hoursApiClient";

interface MyLoggedHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    email: string;
    isAdmin?: boolean;
  };
}

export const MyLoggedHoursModal: React.FC<MyLoggedHoursModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [summary, setSummary] = useState<UserListsDailySummaryClient | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<{ name: string; email: string }>({
    name: currentUser.name,
    email: currentUser.email,
  });
  const [periodFilter, setPeriodFilter] = useState<"all" | "today" | "week" | "custom">("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editHoursVal, setEditHoursVal] = useState<string>("1");
  const [editStartVal, setEditStartVal] = useState<string>("");
  const [editEndVal, setEditEndVal] = useState<string>("");
  const [editDescVal, setEditDescVal] = useState<string>("");
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);

  const startEditingModalEntry = (entry: UserListsEntryClient) => {
    setEditingEntryId(entry.id);
    setEditHoursVal(String(entry.durationHours || 1));
    setEditStartVal(entry.startTime || "09:00");
    setEditEndVal(entry.endTime || "10:00");
    setEditDescVal(entry.description || "");
  };

  const handleSaveModalEntryEdit = async (entry: UserListsEntryClient) => {
    try {
      setSavingEntryId(entry.id);
      const numHours = Math.max(0.25, parseFloat(editHoursVal) || entry.durationHours || 1);
      await apiAssistantChat({
        user: currentUser,
        action: "edit_entry",
        cardId: entry.id,
        editData: {
          id: entry.id,
          listItemId: entry.id,
          customerName: entry.customerName,
          date: entry.date,
          startTime: editStartVal.trim() || entry.startTime,
          endTime: editEndVal.trim() || entry.endTime,
          durationHours: numHours,
          durationMinutes: Math.round(numHours * 60),
          durationFormatted: `${numHours} שעות`,
          description: editDescVal.trim() || entry.description,
          workType: entry.workType,
          employeeName: entry.employeeName || currentUser.name,
          oldDescription: entry.description,
        },
      });
      setEditingEntryId(null);
      await fetchSummary(selectedEmployee.name, selectedEmployee.email);
    } catch (err: any) {
      console.error("[MyLoggedHoursModal] Error updating entry:", err);
      setError(err?.message || "שגיאה בעדכון התיעוד ב-Microsoft Lists");
    } finally {
      setSavingEntryId(null);
    }
  };

  const fetchSummary = async (empName?: string, empEmail?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetMyListsDailySummary({
        employeeName: empName ?? selectedEmployee.name,
        employeeEmail: empEmail ?? selectedEmployee.email,
      });
      setSummary(data);

      // Expand today by default, and also the latest day with entries
      const initialExpanded: Record<string, boolean> = {};
      if (data.todayDate) {
        initialExpanded[data.todayDate] = true;
      }
      const firstActiveDay = data.byDay.find((d) => d.entriesCount > 0);
      if (firstActiveDay) {
        initialExpanded[firstActiveDay.date] = true;
      }
      setExpandedDates(initialExpanded);
    } catch (err: any) {
      console.error("[MyLoggedHoursModal] Error fetching user Lists summary:", err);
      setError(err?.message || "נכשלה שליפת נתוני השעות מתוך Microsoft Lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedEmployee({ name: currentUser.name, email: currentUser.email });
      fetchSummary(currentUser.name, currentUser.email);
    }
  }, [isOpen, currentUser.name, currentUser.email]);

  const toggleDateExpand = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const filteredDays = useMemo<UserListsDayGroupClient[]>(() => {
    if (!summary) return [];

    // Compute Sunday of current week for "week" filter
    let weekStartIso = "";
    if (summary.todayDate) {
      const [ty, tm, td] = summary.todayDate.split("-").map(Number);
      const todayObj = new Date(ty, tm - 1, td);
      const sundayObj = new Date(todayObj);
      sundayObj.setDate(todayObj.getDate() - todayObj.getDay());
      weekStartIso = `${sundayObj.getFullYear()}-${String(sundayObj.getMonth() + 1).padStart(2, "0")}-${String(sundayObj.getDate()).padStart(2, "0")}`;
    }

    return summary.byDay
      .filter((day) => {
        if (periodFilter === "today") return day.isToday;
        if (periodFilter === "week") return day.date >= weekStartIso && day.date <= summary.todayDate;
        if (periodFilter === "custom" && customDate) return day.date === customDate;
        return true;
      })
      .map((day) => {
        if (!searchQuery.trim()) return day;
        const q = searchQuery.trim().toLowerCase();
        const matchingEntries = day.entries.filter(
          (e) =>
            e.customerName.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.workType.toLowerCase().includes(q)
        );
        const newTotalHours =
          Math.round(matchingEntries.reduce((acc, e) => acc + (Number(e.durationHours) || 0), 0) * 100) / 100;
        const newCustomers = Array.from(new Set(matchingEntries.map((e) => e.customerName).filter(Boolean)));
        return {
          ...day,
          entries: matchingEntries,
          entriesCount: matchingEntries.length,
          totalHours: newTotalHours,
          customers: newCustomers,
        };
      })
      .filter((day) => {
        if (searchQuery.trim()) return day.entriesCount > 0;
        // Always show Today, and for other days show days that have entries (or custom selected date)
        return day.isToday || day.entriesCount > 0 || (periodFilter === "custom" && day.date === customDate);
      });
  }, [summary, periodFilter, customDate, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-5 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[92dvh] sm:h-auto sm:max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-200/90 flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-50/70 via-blue-50/50 to-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ListChecks className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                  כמה תיעדתי היום &middot; פירוט יומי
                </h2>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>בדיקה ישירה מול Microsoft Lists</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                שעות לחיוב לקוח מ-Lists עבור{" "}
                <strong className="text-slate-800">{summary?.employeeName || selectedEmployee.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Employee switcher if admin or multiple employees available */}
            {currentUser.isAdmin && summary?.availableEmployees && summary.availableEmployees.length > 0 && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs max-w-[125px] sm:max-w-none">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={selectedEmployee.name}
                  onChange={(e) => {
                    const chosenName = e.target.value;
                    const found = summary.availableEmployees.find((emp) => emp.name === chosenName);
                    const nextEmp = {
                      name: chosenName,
                      email: found?.email || "",
                    };
                    setSelectedEmployee(nextEmp);
                    fetchSummary(nextEmp.name, nextEmp.email);
                  }}
                  className="text-[11px] sm:text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer truncate"
                  title="בחר עובד לבדיקה מול Lists"
                >
                  {!summary.availableEmployees.some((emp) => emp.name === selectedEmployee.name) && (
                    <option value={selectedEmployee.name}>{selectedEmployee.name}</option>
                  )}
                  {summary.availableEmployees.map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchSummary(selectedEmployee.name, selectedEmployee.email)}
              disabled={loading}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="בדוק שוב מול Microsoft Lists"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">רענן מ-Lists</span>
            </button>

            {summary?.listWebUrl && (
              <a
                href={summary.listWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="פתח את רשימת Microsoft Lists"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">פתח Lists</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              title="סגור"
            >
              &times;
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        {summary && (
          <div className="p-2.5 sm:p-4 sm:px-6 bg-slate-50/80 border-b border-slate-200/80 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Today Card - Highlighted with 7-Hour Daily Quota Status */}
              <div
                className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-white shadow-sm ${
                  summary.todayHours >= 7
                    ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                    : "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-white/90 mb-0.5 sm:mb-1">
                  <span className="font-semibold truncate">היום ({summary.todayDisplayDate})</span>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
                  {summary.todayHours}{" "}
                  <span className="text-[11px] sm:text-xs font-normal text-white/90">/ 7 שעות</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-white/95 font-semibold mt-0.5 truncate">
                  {summary.todayHours >= 7
                    ? `🏆 הגעת למכסה היומית! (${summary.todayEntriesCount} תיעודים)`
                    : `⚡ חסרות ${Math.max(0, Math.round((7 - summary.todayHours) * 100) / 100)} ש׳ למכסה היומית`}
                </div>
              </div>

              {/* This Week Card */}
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">
                  <span>סה״כ השבוע</span>
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {summary.weekHours}{" "}
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500">שעות</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-blue-600 font-medium mt-0.5 truncate">
                  {summary.weekEntriesCount} תיעודים השבוע
                </div>
              </div>

              {/* This Month Card */}
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">
                  <span>סה״כ החודש</span>
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {summary.monthHours}{" "}
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500">שעות</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-indigo-600 font-medium mt-0.5 truncate">
                  {summary.monthEntriesCount} תיעודים החודש
                </div>
              </div>

              {/* Active Days Count Card */}
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">
                  <span>סה״כ ב-Lists</span>
                  <ListChecks className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {summary.totalHoursAllTime}{" "}
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500">שעות</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  {summary.totalEntriesAllTime} רשומות ב-Lists
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-200/70">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
                <button
                  onClick={() => setPeriodFilter("all")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    periodFilter === "all"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  כל הימים ({summary.byDay.filter((d) => d.isToday || d.entriesCount > 0).length})
                </button>
                <button
                  onClick={() => setPeriodFilter("today")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    periodFilter === "today"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  היום ({summary.todayHours} ש׳)
                </button>
                <button
                  onClick={() => setPeriodFilter("week")}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    periodFilter === "week"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  השבוע ({summary.weekHours} ש׳)
                </button>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      if (e.target.value) {
                        setPeriodFilter("custom");
                      } else {
                        setPeriodFilter("all");
                      }
                    }}
                    className="text-[11px] sm:text-xs text-slate-700 focus:outline-none bg-transparent cursor-pointer"
                    title="בחר תאריך ספציפי לבדיקה"
                  />
                  {periodFilter === "custom" && customDate && (
                    <button
                      onClick={() => {
                        setCustomDate("");
                        setPeriodFilter("all");
                      }}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1 cursor-pointer"
                      title="נקה תאריך"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Search by customer or description */}
              <div className="relative w-full sm:flex-1 sm:min-w-[180px] sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="סינון לפי לקוח או תיאור..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Body Content - Per-Day List from Microsoft Lists */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2.5 sm:space-y-3 bg-[#f8fafd]">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-800">
                פונה ל-Microsoft Lists ובודק את השעות שתועדו...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                שולף ומחשב כמה תיעדת בכל יום ישירות מתוך ה-LISTS
              </p>
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">שגיאה בשליפת נתונים מ-Microsoft Lists</h4>
                <p className="text-xs mt-1">{error}</p>
                <button
                  onClick={() => fetchSummary(selectedEmployee.name, selectedEmployee.email)}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                >
                  נסה שוב
                </button>
              </div>
            </div>
          ) : filteredDays.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-6">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">
                לא נמצאו תיעודים ב-Microsoft Lists עבור הסינון הנוכחי
              </p>
              <p className="text-xs text-slate-500 mt-1">
                כל שעה שתתעד במערכת שעות לחיוב לקוח תופיע כאן אוטומטית לפי יום.
              </p>
            </div>
          ) : (
            filteredDays.map((day) => {
              const isExpanded = Boolean(expandedDates[day.date]);
              return (
                <div
                  key={day.date}
                  className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-2xs ${
                    day.isToday
                      ? "border-emerald-300 ring-1 ring-emerald-500/20"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  {/* Day Header Row */}
                  <button
                    type="button"
                    onClick={() => toggleDateExpand(day.date)}
                    className={`w-full px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-right cursor-pointer transition-colors ${
                      day.isToday
                        ? "bg-emerald-50/50 hover:bg-emerald-50/80"
                        : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          day.isToday
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : day.entriesCount > 0
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {day.dayNameHe}, {day.displayDate}
                          </span>
                          {day.isToday && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                              היום
                            </span>
                          )}
                          {day.isYesterday && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              אתמול
                            </span>
                          )}
                        </div>

                        {day.customers.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-slate-500">לקוחות:</span>
                            {day.customers.slice(0, 5).map((cust) => (
                              <span
                                key={cust}
                                className="text-[11px] px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium"
                              >
                                {cust}
                              </span>
                            ))}
                            {day.customers.length > 5 && (
                              <span className="text-[11px] text-slate-400">
                                +{day.customers.length - 5} נוספים
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5">
                            לא נמצאו רשומות ב-Microsoft Lists ליום זה
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Total Hours for that Day */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left">
                        <div
                          className={`text-base sm:text-lg font-black ${
                            day.totalHours > 0 ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {day.totalHours}{" "}
                          <span className="text-xs font-normal text-slate-500">שעות</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {day.entriesCount} {day.entriesCount === 1 ? "תיעוד ב-Lists" : "תיעודים ב-Lists"}
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Day Entries */}
                  {isExpanded && (
                    <div className="border-t border-slate-200/80 bg-slate-50/40 divide-y divide-slate-200/60">
                      {day.entries.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          טרם נרשמו שעות לחיוב לקוח ב-Microsoft Lists בתאריך {day.displayDate}.
                        </div>
                      ) : (
                        day.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3.5 sm:px-5 hover:bg-white transition-colors flex flex-col gap-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>{entry.customerName || "לקוח כללי"}</span>
                                  </span>

                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {entry.workType || "טיקטים"}
                                  </span>

                                  {(entry.startTime || entry.endTime) && (
                                    <span
                                      className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"
                                      dir="ltr"
                                    >
                                      {entry.startTime || "--:--"} - {entry.endTime || "--:--"}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                  {entry.description || "ללא פירוט נוסף"}
                                </p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                                  {entry.durationHours} שעות
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    editingEntryId === entry.id
                                      ? setEditingEntryId(null)
                                      : startEditingModalEntry(entry)
                                  }
                                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="ערוך שעות או תיאור ב-Lists"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{editingEntryId === entry.id ? "סגור" : "ערוך"}</span>
                                </button>

                                {entry.webUrl && (
                                  <a
                                    href={entry.webUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
                                    title="צפה בשורה זו ב-Microsoft Lists"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Lists</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {editingEntryId === entry.id && (
                              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2.5 mt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                                      שעות לחיוב:
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        step="0.25"
                                        min="0.25"
                                        max="12"
                                        value={editHoursVal}
                                        onChange={(e) => setEditHoursVal(e.target.value)}
                                        className="w-20 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                                      />
                                      <div className="flex gap-1">
                                        {[0.5, 1, 1.5, 2].map((h) => (
                                          <button
                                            key={h}
                                            type="button"
                                            onClick={() => setEditHoursVal(String(h))}
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                              Number(editHoursVal) === h
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50"
                                            }`}
                                          >
                                            {h}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                                      שעת התחלה:
                                    </label>
                                    <input
                                      type="time"
                                      lang="en-GB"
                                      value={editStartVal}
                                      onChange={(e) => setEditStartVal(e.target.value)}
                                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800"
                                      dir="ltr"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                                      שעת סיום:
                                    </label>
                                    <input
                                      type="time"
                                      lang="en-GB"
                                      value={editEndVal}
                                      onChange={(e) => setEditEndVal(e.target.value)}
                                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800"
                                      dir="ltr"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                                    תיאור הפעילות / הודעה:
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editDescVal}
                                    onChange={(e) => setEditDescVal(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={savingEntryId === entry.id}
                                    onClick={() => handleSaveModalEntryEdit(entry)}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    {savingEntryId === entry.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                    <span>שמור שינויים ב-Lists</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingEntryId(null)}
                                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                                  >
                                    ביטול
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
