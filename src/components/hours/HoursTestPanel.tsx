import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Folder,
  FileSpreadsheet,
  Layers,
  Edit3,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code,
  Calendar,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Key,
  Clock,
  Database,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  apiListCustomers,
  apiSearchCustomer,
  apiFindMonthTarget,
  apiReadSheetStructure,
  apiWriteRows,
  apiUndoRow,
  apiFindDuplicates,
  apiGetHoursDiagnostics,
  type HoursDiagnosticsData,
} from "../../services/hoursApiClient";

interface HoursTestPanelProps {
  currentUser?: {
    name?: string;
    email?: string;
  };
}

export const HoursTestPanel: React.FC<HoursTestPanelProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Step 1: Customer search
  const [customerQuery, setCustomerQuery] = useState<string>("");
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);
  const [customersResult, setCustomersResult] = useState<any[] | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [rawCustomersResult, setRawCustomersResult] = useState<any | null>(null);
  const [detectionInfo, setDetectionInfo] = useState<{
    siteId?: string;
    detectedStructure?: "folders" | "libraries";
    totalCustomers?: number;
    first10Customers?: string[];
  } | null>(null);

  // Step 2: Month target
  const today = new Date();
  const currentYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [monthQuery, setMonthQuery] = useState<string>(currentYm);
  const [monthLoading, setMonthLoading] = useState<boolean>(false);
  const [monthResult, setMonthResult] = useState<any | null>(null);
  const [rawMonthResult, setRawMonthResult] = useState<any | null>(null);

  // Step 3: Sheet structure
  const [structureLoading, setStructureLoading] = useState<boolean>(false);
  const [sheetStructure, setSheetStructure] = useState<any | null>(null);
  const [rawStructureResult, setRawStructureResult] = useState<any | null>(null);

  // Step 4: Write test row
  const [writeLoading, setWriteLoading] = useState<boolean>(false);
  const [writeResult, setWriteResult] = useState<any | null>(null);
  const [rawWriteResult, setRawWriteResult] = useState<any | null>(null);

  // Step 5: Undo
  const [undoLoading, setUndoLoading] = useState<boolean>(false);
  const [undoResult, setUndoResult] = useState<any | null>(null);
  const [rawUndoResult, setRawUndoResult] = useState<any | null>(null);

  // Step 6: Duplicates check
  const [dupLoading, setDupLoading] = useState<boolean>(false);
  const [dupResult, setDupResult] = useState<any | null>(null);

  // Diagnostics card state (server-side check)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState<boolean>(false);
  const [diagnosticsData, setDiagnosticsData] = useState<HoursDiagnosticsData | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  // Global error box
  const [panelError, setPanelError] = useState<string | null>(null);

  const handleFetchDiagnostics = async (forceRefresh = false) => {
    try {
      setDiagnosticsLoading(true);
      setDiagnosticsError(null);
      const data = await apiGetHoursDiagnostics(forceRefresh);
      setDiagnosticsData(data);
    } catch (err: any) {
      setDiagnosticsError(err?.message || "שגיאה בבדיקת אבחון Graph");
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchDiagnostics(false);
  }, []);

  // 1. Search Customers
  const handleSearchCustomer = async (isAll = false) => {
    try {
      setCustomersLoading(true);
      setPanelError(null);
      if (isAll || !customerQuery.trim()) {
        const data = await apiListCustomers(true);
        setDetectionInfo({
          siteId: data.siteId,
          detectedStructure: data.detectedStructure,
          totalCustomers: data.totalCustomers,
          first10Customers: data.first10Customers,
        });
        setCustomersResult(
          (data.customers || []).map((c: any) => ({
            customer: c,
            score: 1.0,
            matchReason:
              data.detectedStructure === "libraries"
                ? "ספריית מסמכים (Document Library)"
                : "תיקיית לקוח",
          }))
        );
        setRawCustomersResult(data);
      } else {
        const matches = await apiSearchCustomer(customerQuery);
        setCustomersResult(matches);
        setRawCustomersResult(matches);
      }
    } catch (err: any) {
      setPanelError(`שגיאה באיתור לקוחות: ${err?.message || err}`);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Auto-detect structure and list customers on mount
  React.useEffect(() => {
    handleSearchCustomer(true);
  }, []);

  // 2. Select Customer and Find Month
  const handleSelectCustomer = async (cust: any) => {
    setSelectedCustomer(cust);
    setMonthResult(null);
    setSheetStructure(null);
    setWriteResult(null);
    setUndoResult(null);
    await handleFindMonth(cust, monthQuery);
  };

  const handleFindMonth = async (cust = selectedCustomer, month = monthQuery) => {
    if (!cust) {
      setPanelError("יש לבחור לקוח תחילה");
      return;
    }
    try {
      setMonthLoading(true);
      setPanelError(null);
      const res = await apiFindMonthTarget(cust.name || cust.customer?.name || cust, month);
      setMonthResult(res);
      setRawMonthResult(res);

      if (res.found && res.fileId) {
        await handleReadStructure(res.fileId);
      }
    } catch (err: any) {
      setPanelError(`שגיאה באיתור קובץ חודש: ${err?.message || err}`);
    } finally {
      setMonthLoading(false);
    }
  };

  // 3. Read Structure
  const handleReadStructure = async (fileId = monthResult?.fileId) => {
    if (!fileId) {
      setPanelError("לא נמצא מזהה קובץ (fileId)");
      return;
    }
    try {
      setStructureLoading(true);
      setPanelError(null);
      const res = await apiReadSheetStructure(fileId);
      setSheetStructure(res);
      setRawStructureResult(res);
    } catch (err: any) {
      setPanelError(`שגיאה בקריאת מבנה קובץ: ${err?.message || err}`);
    } finally {
      setStructureLoading(false);
    }
  };

  // 4. Write Test Row
  const handleWriteTestRow = async () => {
    const fileId = monthResult?.fileId;
    if (!fileId) {
      setPanelError("יש לאתר קובץ חודשי תחילה");
      return;
    }
    try {
      setWriteLoading(true);
      setPanelError(null);
      setUndoResult(null);

      // Construct test row according to detected headers
      const empName = currentUser?.name || "עובד בדיקה";
      const headers: string[] = sheetStructure?.headers || ["תאריך", "עובד", "שעות", "תיאור"];

      const testRow: Record<string, any> = {};
      headers.forEach((h) => {
        const norm = h.toLowerCase();
        if (norm.includes("תאריך") || norm.includes("date")) {
          testRow[h] = new Date().toISOString().split("T")[0];
        } else if (norm.includes("עובד") || norm.includes("שם") || norm.includes("employee")) {
          testRow[h] = empName;
        } else if (norm.includes("התחלה") || norm.includes("start")) {
          testRow[h] = "09:00";
        } else if (norm.includes("סיום") || norm.includes("end")) {
          testRow[h] = "10:00";
        } else if (norm.includes("שעות") || norm.includes("משך") || norm.includes("duration") || norm.includes("סהכ")) {
          testRow[h] = sheetStructure?.formats?.hoursFormat === "hh:mm" ? "01:00" : 1.0;
        } else if (norm.includes("תיאור") || norm.includes("task") || norm.includes("פעילות")) {
          testRow[h] = "בדיקת מערכת אוטומטית - Stage 2 SharePoint Engine";
        } else {
          testRow[h] = "בדיקה";
        }
      });

      const res = await apiWriteRows(fileId, [testRow]);
      setWriteResult(res);
      setRawWriteResult(res);

      // Re-read structure to see updated row count
      await handleReadStructure(fileId);
    } catch (err: any) {
      setPanelError(`שגיאה בכתיבת שורת בדיקה: ${err?.message || err}`);
    } finally {
      setWriteLoading(false);
    }
  };

  // 5. Undo Row
  const handleUndoRow = async () => {
    const fileId = monthResult?.fileId || writeResult?.fileId;
    const rowAddress = writeResult?.rowAddress || writeResult?.entryId;
    if (!fileId || !rowAddress) {
      setPanelError("אין שורה זמינה לביטול מהבדיקה הנוכחית");
      return;
    }
    try {
      setUndoLoading(true);
      setPanelError(null);
      const res = await apiUndoRow(fileId, rowAddress);
      setUndoResult(res);
      setRawUndoResult(res);

      // Re-read structure
      await handleReadStructure(fileId);
    } catch (err: any) {
      setPanelError(`שגיאה בביטול שורה: ${err?.message || err}`);
    } finally {
      setUndoLoading(false);
    }
  };

  // 6. Check Duplicates
  const handleCheckDuplicates = async () => {
    const fileId = monthResult?.fileId;
    if (!fileId) return;
    try {
      setDupLoading(true);
      const empName = currentUser?.name || "עובד בדיקה";
      const dateStr = new Date().toISOString().split("T")[0];
      const res = await apiFindDuplicates(fileId, {
        employee: empName,
        date: dateStr,
      });
      setDupResult(res);
    } catch (err: any) {
      setPanelError(`שגיאה בבדיקת כפילויות: ${err?.message || err}`);
    } finally {
      setDupLoading(false);
    }
  };

  return (
    <div className="w-full mt-6 rounded-2xl border border-cyan-500/30 bg-[#0b101b]/95 backdrop-blur-xl shadow-2xl overflow-hidden text-right font-sans">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                בדיקת מערכת – SharePoint / Excel Engine
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                שלב 2
              </span>
            </div>
            <p className="text-xs text-slate-400">
              חיפוש לקוח &larr; זיהוי תבנית חודש &larr; קריאת מבנה גיליון &larr; כתיבה &larr; ביטול שורה (Undo)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span>{isOpen ? "כווץ פאנל" : "הצג פאנל"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Error Banner if any */}
          {panelError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 whitespace-pre-wrap">{panelError}</div>
              <button
                onClick={() => setPanelError(null)}
                className="text-red-400 hover:text-white cursor-pointer px-1 font-bold"
              >
                &times;
              </button>
            </div>
          )}

          {/* DIAGNOSTICS CARD (Server-Side Check) */}
          <section className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-cyan-500/30 space-y-4 shadow-lg shadow-cyan-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>אבחון שרת: חיבור Microsoft Graph (App-Only Token)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Server Diagnostics
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    זיהוי משתני סביבה פעילים, תביעות טוקן (Claims: appid, roles) וסטטוס מטמון
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFetchDiagnostics(true)}
                disabled={diagnosticsLoading}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
                title="איפוס מטמון הטוקן וקבלת טוקן חדש מ-Microsoft Entra ID"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsLoading ? "animate-spin" : ""}`} />
                <span>רענן טוקן</span>
              </button>
            </div>

            {diagnosticsError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                  <span className="flex-1 font-semibold">{diagnosticsError}</span>
                </div>
                <div className="text-[11px] text-red-300/90 bg-black/40 p-2.5 rounded border border-red-500/20 space-y-1">
                  <p>מנוע התיעוד מוגדר לפעול אך ורק באמצעות משתני HOURS_GRAPH (ללא שום שימוש ב-CLIENT_ID/SECRET):</p>
                  <ul className="list-disc list-inside font-mono text-[10px] space-y-0.5 text-slate-300">
                    <li>AZURE_TENANT_ID</li>
                    <li>HOURS_GRAPH_CLIENT_ID</li>
                    <li>HOURS_GRAPH_CLIENT_SECRET</li>
                  </ul>
                </div>
              </div>
            )}

            {diagnosticsLoading && !diagnosticsData ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>טוען נתוני אבחון שרת...</span>
              </div>
            ) : diagnosticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1. Environment Variables Names Used */}
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>שמות משתני הסביבה הפעילים במנוע:</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">דייר (Tenant ID):</span>
                      <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {diagnosticsData.envSources.tenantVar}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">מזהה לקוח (Client ID):</span>
                      <span className="font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                        {diagnosticsData.envSources.clientVar}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">סוד לקוח (Client Secret):</span>
                      <span className="font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        {diagnosticsData.envSources.secretVar}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Token Claims: App ID & Timing */}
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>פרטי הטוקן הפעיל (Token Claims):</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">App ID ("appid" / "azp"):</span>
                      <span className="font-mono text-amber-300 text-[10px] font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20" dir="ltr">
                        {diagnosticsData.appId || "לא זוהה"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">זמן הנפקה (Issued At):</span>
                      <span className="text-slate-200 font-mono text-[10px]" dir="ltr">
                        {diagnosticsData.issuedAt
                          ? new Date(diagnosticsData.issuedAt).toLocaleTimeString("he-IL", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }) +
                            " (" +
                            new Date(diagnosticsData.issuedAt).toLocaleDateString("he-IL") +
                            ")"
                          : "לא זמין"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">סטטוס מטמון (Cache):</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          diagnosticsData.fromCache
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {diagnosticsData.fromCache ? "מהמטמון (From Memory Cache)" : "טוקן חדש (Fresh Token)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Roles Claim (Application Permissions) */}
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>הרשאות אפליקציה ("roles" claim):</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {diagnosticsData.roles.length} הרשאות מזוהות
                    </span>
                  </div>

                  {diagnosticsData.roles && diagnosticsData.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {diagnosticsData.roles.map((role, idx) => {
                        const isSharePoint = role.toLowerCase().includes("sites");
                        return (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border flex items-center gap-1 ${
                              isSharePoint
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            }`}
                          >
                            {isSharePoint && <Check className="w-3 h-3 text-emerald-400" />}
                            <span>{role}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>לא נמצאו הרשאות (Roles) בטוקן הנוכחי.</span>
                    </div>
                  )}

                  {/* Contextual warning if Sites permissions are absent */}
                  {!diagnosticsData.roles.some((r) => r.toLowerCase().includes("sites")) && (
                    <p className="text-[10px] text-amber-300/90 bg-amber-950/20 border border-amber-500/20 p-2 rounded">
                      שים לב: הטוקן אינו מכיל את הרשאת <strong>Sites.Read.All</strong> או <strong>Sites.ReadWrite.All</strong> הנדרשת לקריאה וכתיבה באקסל וב-SharePoint.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          {/* STEP 1: Customer Search */}
          <section className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>איתור תיקיית לקוח (Fuzzy Search & Cache)</span>
              </div>
              <span className="text-[11px] text-slate-400">מטמון 10 דקות פעיל</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer(false)}
                  placeholder="הקלד שם לקוח (למשל: אקסטרה, טק סלקט, בע״מ, באנגלית...)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              </div>
              <button
                onClick={() => handleSearchCustomer(false)}
                disabled={customersLoading}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {customersLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>חפש</span>
              </button>
              <button
                onClick={() => handleSearchCustomer(true)}
                disabled={customersLoading}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                title="טען את כל תיקיות הלקוחות ב-CUSTOMERS_ROOT_PATH"
              >
                <span>טען הכל</span>
              </button>
            </div>

            {/* Auto-Detection Status Card (Requirement 4) */}
            {detectionInfo && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 border border-cyan-500/30 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">אתר SharePoint שאותר:</span>
                    <span className="font-mono text-[11px] text-cyan-300 font-semibold" dir="ltr">
                      {detectionInfo.siteId || "טוען מזהה אתר..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">מבנה לקוחות שזוהה:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        detectionInfo.detectedStructure === "libraries"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      {detectionInfo.detectedStructure === "libraries"
                        ? "ספריות מסמכים (Document Libraries)"
                        : "תיקיות בספריית מסמכים (Folders in Document Library)"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">מספר לקוחות שזוהו עם תיקיית 'שעות עבודה':</span>
                  <span className="font-bold text-white text-xs bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {detectionInfo.totalCustomers ?? 0} לקוחות
                  </span>
                </div>

                {detectionInfo.first10Customers && detectionInfo.first10Customers.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1 font-medium">
                      10 הלקוחות הראשונים שזוהו (לחץ לסינון/בחירה):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detectionInfo.first10Customers.map((custName, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomerQuery(custName);
                            handleSearchCustomer(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-cyan-500/20 text-[11px] text-slate-200 border border-white/10 hover:border-cyan-400/40 cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <span className="text-cyan-400 text-[9px] font-mono">{idx + 1}.</span>
                          <span>{custName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customers Search Results List */}
            {customersResult && customersResult.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-48 overflow-y-auto">
                <p className="text-[11px] text-slate-400">נמצאו {customersResult.length} תוצאות:</p>
                {customersResult.map((item, idx) => {
                  const cust = item.customer || item;
                  const isSelected = selectedCustomer?.id === cust.id || selectedCustomer?.name === cust.name;
                  return (
                    <div
                      key={cust.id || idx}
                      onClick={() => handleSelectCustomer(cust)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-white"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-amber-400"}`} />
                        <span className="font-semibold">{cust.name}</span>
                        {item.matchReason && (
                          <span className="text-[10px] text-slate-400">({item.matchReason})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.score !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              item.score >= 0.8
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            ציון: {Math.round(item.score * 100)}%
                          </span>
                        )}
                        <span className="text-[10px] text-cyan-400 underline">בחר לקוח</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Raw Customers JSON */}
            {rawCustomersResult && (
              <details className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-300">
                  צפה ב-JSON הגולמי של שלב 1 (Raw Customer Results)
                </summary>
                <pre className="mt-2 text-[10px] overflow-x-auto text-emerald-400" dir="ltr">
                  {JSON.stringify(rawCustomersResult, null, 2)}
                </pre>
              </details>
            )}
          </section>

          {/* STEP 2: Pick Month & Detect Pattern */}
          <section className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>איתור יעד חודשי וזיהוי תבנית שמות ב-"{selectedCustomer?.name || "לקוח"}/שעות עבודה"</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={monthQuery}
                  onChange={(e) => setMonthQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindMonth()}
                  placeholder="הזן חודש (למשל: 2026-09, 09.2026, ספטמבר 2026, 09-26...)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              </div>
              <button
                onClick={() => handleFindMonth()}
                disabled={monthLoading || !selectedCustomer}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {monthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                <span>אתר קובץ חודש</span>
              </button>
            </div>

            {/* Month Target Result Details */}
            {monthResult && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">סטטוס מציאת קובץ:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      monthResult.found
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {monthResult.found ? "נמצא קובץ בהצלחה" : "לא נמצא (לעולם לא יוצר קובץ אוטומטית)"}
                  </span>
                </div>

                {monthResult.detectedPattern && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">תבנית שמות שזוהתה בתיקייה:</span>
                    <span className="font-mono text-cyan-300">{monthResult.detectedPattern}</span>
                  </div>
                )}

                {monthResult.filePath && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">נתיב קובץ מלא:</span>
                    <span className="font-mono text-slate-200" dir="ltr">{monthResult.filePath}</span>
                  </div>
                )}

                {monthResult.targetType && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">מבנה ארגון:</span>
                    <span className="text-slate-200">
                      {monthResult.targetType === "month_folder_file"
                        ? "תיקיית חודש המכילה קובץ .xlsx"
                        : "קובץ .xlsx ישיר לחודש"}
                    </span>
                  </div>
                )}

                {monthResult.message && (
                  <p className="text-slate-300 mt-1">{monthResult.message}</p>
                )}

                {/* If not found, show existing items */}
                {!monthResult.found && monthResult.existingItems && monthResult.existingItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[11px] text-slate-400 mb-1">פריטים שקיימים בפועל בתיקייה:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {monthResult.existingItems.map((item: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {monthResult.webUrl && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">קישור ל-SharePoint:</span>
                    <a
                      href={monthResult.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] underline"
                    >
                      <span>פתח ב-Excel Online</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Raw Month Target JSON */}
            {rawMonthResult && (
              <details className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-300">
                  צפה ב-JSON הגולמי של שלב 2 (Raw Month Target)
                </summary>
                <pre className="mt-2 text-[10px] overflow-x-auto text-emerald-400" dir="ltr">
                  {JSON.stringify(rawMonthResult, null, 2)}
                </pre>
              </details>
            )}
          </section>

          {/* STEP 3: Sheet Structure & Format Detection */}
          {monthResult?.found && (
            <section className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>מבנה גיליון ה-Excel, עמודות, שורת סיכום ופורמטים שזוהו</span>
                </div>
                <button
                  onClick={() => handleReadStructure()}
                  disabled={structureLoading}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] flex items-center gap-1 border border-white/10"
                >
                  <RefreshCw className={`w-3 h-3 ${structureLoading ? "animate-spin" : ""}`} />
                  <span>רענן מבנה</span>
                </button>
              </div>

              {sheetStructure && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded">
                      <span className="text-slate-400">סוג מבנה:</span>
                      <span className="font-semibold text-cyan-300">
                        {sheetStructure.isTable ? `Excel Table (${sheetStructure.tableName})` : "Plain Range (טווח רגיל)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded">
                      <span className="text-slate-400">כתובת שורה פנויה הבאה:</span>
                      <span className="font-mono text-emerald-300 font-bold" dir="ltr">
                        {sheetStructure.nextEmptyRowAddress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded">
                      <span className="text-slate-400">שורת סיכום / סה״כ:</span>
                      <span className="text-slate-200">
                        {sheetStructure.hasTotalsRow ? `קיימת שורת סה״כ (${sheetStructure.totalsRowAddress || "למטה"})` : "אין שורת סה״כ"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded">
                      <span className="text-slate-400">פורמט שעות שזוהה:</span>
                      <span className="font-mono text-cyan-300">
                        {sheetStructure.formats?.hoursFormat === "hh:mm" ? "hh:mm (שעות:דקות)" : "decimal (עשרוני, למשל 1.5)"}
                      </span>
                    </div>
                  </div>

                  {/* Headers */}
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">כותרות עמודות שזוהו:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(sheetStructure.headers || []).map((h: string, idx: number) => {
                        const isFormula = sheetStructure.formats?.formulaColumns?.includes(idx);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] border ${
                              isFormula
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-blue-500/10 border-blue-500/30 text-blue-200"
                            }`}
                          >
                            {h} {isFormula && "(נוסחה - מוגן)"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Last 5 rows preview */}
                  {sheetStructure.last5Rows && sheetStructure.last5Rows.length > 0 && (
                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1">
                        תצוגת 5 שורות אחרונות (סך הכל {sheetStructure.totalDataRows} שורות נתונים):
                      </span>
                      <div className="overflow-x-auto border border-white/5 rounded-lg">
                        <table className="w-full text-right text-[10px]">
                          <thead className="bg-white/5 text-slate-400">
                            <tr>
                              {(sheetStructure.headers || []).map((h: string, i: number) => (
                                <th key={i} className="p-1.5 font-medium border-b border-white/5">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {sheetStructure.last5Rows.map((row: any[], rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-white/[0.02]">
                                {row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="p-1.5 whitespace-nowrap font-mono text-[9px]">
                                    {cell !== null && cell !== undefined ? String(cell) : ""}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Structure JSON */}
              {rawStructureResult && (
                <details className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-300">
                    צפה ב-JSON הגולמי של שלב 3 (Raw Structure)
                  </summary>
                  <pre className="mt-2 text-[10px] overflow-x-auto text-emerald-400" dir="ltr">
                    {JSON.stringify(rawStructureResult, null, 2)}
                  </pre>
                </details>
              )}
            </section>
          )}

          {/* STEP 4 & 5: Write Test Row & Undo */}
          {monthResult?.found && sheetStructure && (
            <section className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>כתיבת שורת בדיקה (Write Row) וביטול מיידי (Undo Row)</span>
                </div>
                <span className="text-[10px] text-slate-400">נעילה &middot; Session מנוהל &middot; ביטול עד 10 דק'</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleWriteTestRow}
                  disabled={writeLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {writeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>כתוב שורת בדיקה</span>
                </button>

                <button
                  onClick={handleUndoRow}
                  disabled={undoLoading || !writeResult}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {undoLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                  <span>בטל שורה שנכתבה (Undo)</span>
                </button>

                <button
                  onClick={handleCheckDuplicates}
                  disabled={dupLoading}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>בדוק כפילויות</span>
                </button>
              </div>

              {/* Write Result Feedback */}
              {writeResult && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>שורת הבדיקה נכתבה בהצלחה לקובץ!</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <p>
                      כתובת השורה שנכתבה:{" "}
                      <span className="font-mono text-cyan-300 font-bold" dir="ltr">{writeResult.rowAddress}</span>
                    </p>
                    <p>
                      מזהה יומן ביטול (Entry ID):{" "}
                      <span className="font-mono text-slate-400" dir="ltr">{writeResult.entryId}</span>
                    </p>
                  </div>
                  {writeResult.webUrl && (
                    <a
                      href={writeResult.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline mt-1"
                    >
                      <span>פתח ב-Excel Online כדי לראות את השורה בפועל</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Raw Write JSON */}
              {rawWriteResult && (
                <details className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-300">
                    צפה ב-JSON הגולמי של שלב 4 (Raw Write Result)
                  </summary>
                  <pre className="mt-2 text-[10px] overflow-x-auto text-emerald-400" dir="ltr">
                    {JSON.stringify(rawWriteResult, null, 2)}
                  </pre>
                </details>
              )}

              {/* Undo Result Feedback */}
              {undoResult && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{undoResult.message || "השורה בוטלה ונמחקה בהצלחה!"}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    כתובת שבוטלה: <span className="font-mono text-slate-200" dir="ltr">{undoResult.rowAddress}</span>
                  </p>
                </div>
              )}

              {/* Raw Undo JSON */}
              {rawUndoResult && (
                <details className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <summary className="cursor-pointer font-mono text-[10px] text-slate-500 hover:text-slate-300">
                    צפה ב-JSON הגולמי של שלב 5 (Raw Undo Result)
                  </summary>
                  <pre className="mt-2 text-[10px] overflow-x-auto text-emerald-400" dir="ltr">
                    {JSON.stringify(rawUndoResult, null, 2)}
                  </pre>
                </details>
              )}

              {/* Duplicate Check Feedback */}
              {dupResult && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">בדיקת כפילויות:</span>
                    <span className={dupResult.hasDuplicates ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                      {dupResult.hasDuplicates ? `נמצאו ${dupResult.duplicates?.length} כפילויות אפשריות` : "לא נמצאו כפילויות"}
                    </span>
                  </div>
                  {dupResult.duplicates && dupResult.duplicates.length > 0 && (
                    <pre className="text-[10px] overflow-x-auto text-amber-300 p-2 rounded bg-black/30" dir="ltr">
                      {JSON.stringify(dupResult.duplicates, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
