import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  UserPlus,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  ExternalLink,
  Search,
  Users,
} from "lucide-react";
import {
  apiGetManagedDirectory,
  apiAddManagedCustomer,
  apiAddManagedEmployee,
  ManagedEmployeeItem,
} from "../../services/hoursApiClient";

interface ManageDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectoryUpdated?: () => void;
}

export const ManageDirectoryModal: React.FC<ManageDirectoryModalProps> = ({
  isOpen,
  onClose,
  onDirectoryUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"customer" | "employee">("customer");
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; webUrl?: string }>>([]);
  const [employees, setEmployees] = useState<ManagedEmployeeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Customer form state
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEnglish, setCustomerEnglish] = useState<string>("");
  const [customerAliases, setCustomerAliases] = useState<string>("");
  const [createSpFolder, setCreateSpFolder] = useState<boolean>(true);
  const [submittingCustomer, setSubmittingCustomer] = useState<boolean>(false);

  // Employee form state
  const [employeeName, setEmployeeName] = useState<string>("");
  const [employeeEmail, setEmployeeEmail] = useState<string>("");
  const [employeeAliases, setEmployeeAliases] = useState<string>("");
  const [submittingEmployee, setSubmittingEmployee] = useState<boolean>(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    webUrl?: string;
  } | null>(null);

  const loadDirectory = async (forceRefresh = false) => {
    try {
      setLoadingList(true);
      const data = await apiGetManagedDirectory(forceRefresh);
      setCustomers(data.customers || []);
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("[ManageDirectoryModal] Error loading directory:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      loadDirectory(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    if (!cleanName) {
      setFeedback({ type: "error", message: "נא להזין את שם הלקוח" });
      return;
    }

    try {
      setSubmittingCustomer(true);
      setFeedback(null);
      const parsedAliases = customerAliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await apiAddManagedCustomer({
        name: cleanName,
        englishName: customerEnglish.trim() || undefined,
        aliases: parsedAliases,
        createSharePointFolder: createSpFolder,
      });

      setCustomerName("");
      setCustomerEnglish("");
      setCustomerAliases("");

      if (createSpFolder && !res.createdInSharePoint && res.sharePointError) {
        setFeedback({
          type: "error",
          message: `הלקוח "${cleanName}" נוסף למערכת, אך הקמת הספרייה ב-SharePoint נכשלה: ${res.sharePointError}`,
        });
      } else {
        setFeedback({
          type: "success",
          message: res.createdInSharePoint
            ? `הלקוח "${cleanName}" הוקם כספריית לקוח ב-SharePoint (במיקום של כל הלקוחות) יחד עם תיקיית "שעות עבודה"!`
            : `הלקוח "${cleanName}" נוסף בהצלחה למילון הלקוחות של המערכת!`,
          webUrl: res.hoursFolderUrl || res.customer?.webUrl,
        });
      }

      await loadDirectory(true);
      onDirectoryUpdated?.();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "שגיאה בהוספת לקוח",
      });
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = employeeName.trim();
    if (!cleanName) {
      setFeedback({ type: "error", message: "נא להזין את שם העובד" });
      return;
    }

    try {
      setSubmittingEmployee(true);
      setFeedback(null);
      const parsedAliases = employeeAliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await apiAddManagedEmployee({
        name: cleanName,
        email: employeeEmail.trim(),
        aliases: parsedAliases,
      });

      setEmployeeName("");
      setEmployeeEmail("");
      setEmployeeAliases("");
      setFeedback({
        type: "success",
        message: `העובד "${res.employee.name}" (${res.employee.email}) נוסף בהצלחה לצוות וזמין מיד לבחירה ולזיהוי קולי!`,
      });

      await loadDirectory();
      onDirectoryUpdated?.();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "שגיאה בהוספת עובד",
      });
    } finally {
      setSubmittingEmployee(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    !searchQuery.trim()
      ? true
      : c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const filteredEmployees = employees.filter((emp) =>
    !searchQuery.trim()
      ? true
      : emp.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-[#172B4D]/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-xl border border-[#DBEAFE] overflow-hidden flex flex-col text-right text-[#172B4D] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DBEAFE] bg-[#F8FAFC] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              {activeTab === "customer" ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172B4D]">
                ניהול והוספת לקוחות ועובדים
              </h2>
              <p className="text-xs text-slate-500">
                הוספה מהירה למילון הזיהוי של ה-AI, לבחירה בכרטיסים ול-SharePoint
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EFF6FF] border border-[#DBEAFE] text-slate-500 hover:text-[#172B4D] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Switcher */}
        <div className="px-5 pt-3.5 pb-3 border-b border-[#DBEAFE]/70 bg-white flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("customer");
              setFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === "customer"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#F8FAFC] text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>הוספת לקוח ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("employee");
              setFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === "employee"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#F8FAFC] text-[#172B4D] hover:bg-[#EFF6FF] border border-[#DBEAFE]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>הוספת עובד צוות ({employees.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                feedback.type === "success"
                  ? "bg-[#EFF6FF] border-[#DBEAFE] text-[#172B4D]"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="font-semibold">{feedback.message}</span>
              </div>
              {feedback.webUrl && (
                <a
                  href={feedback.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#DBEAFE] text-[#2563EB] hover:bg-[#EFF6FF] font-semibold flex items-center gap-1 shrink-0"
                >
                  <span>פתח ב-SharePoint</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {activeTab === "customer" ? (
            <form
              onSubmit={handleAddCustomer}
              className="p-4 rounded-2xl bg-white border border-[#DBEAFE] space-y-3.5 shadow-2xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    שם הלקוח / התיקייה (חובה)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="למשל: אלפא מערכות"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    שם באנגלית (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={customerEnglish}
                    onChange={(e) => setCustomerEnglish(e.target.value)}
                    placeholder="למשל: Alpha Systems"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  כינויים נוספים לזיהוי קולי / טקסטואלי (מופרדים בפסיק)
                </label>
                <input
                  type="text"
                  value={customerAliases}
                  onChange={(e) => setCustomerAliases(e.target.value)}
                  placeholder="למשל: אלפא, Alpha, אלפא טק"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#172B4D] cursor-pointer select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={createSpFolder}
                  onChange={(e) => setCreateSpFolder(e.target.checked)}
                  className="rounded border-[#DBEAFE] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <FolderPlus className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>
                  הקם אוטומטית ספריית לקוח (Document Library) ותיקיית <strong>"שעות עבודה"</strong> באתר הלקוחות ב-SharePoint
                </span>
              </label>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingCustomer}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {submittingCustomer ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{submittingCustomer ? "מוסיף לקוח..." : "הוסף לקוח למערכת"}</span>
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleAddEmployee}
              className="p-4 rounded-2xl bg-white border border-[#DBEAFE] space-y-3.5 shadow-2xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    שם העובד בעברית (חובה)
                  </label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="למשל: דניאל כהן"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    אימייל ארגוני (Microsoft 365)
                  </label>
                  <input
                    type="email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="daniel@tech-select.co.il"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  שמות קצרים / כינויים באנגלית לזיהוי משותף (אופציונלי, מופרדים בפסיק)
                </label>
                <input
                  type="text"
                  value={employeeAliases}
                  onChange={(e) => setEmployeeAliases(e.target.value)}
                  placeholder="למשל: דניאל, Daniel"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingEmployee}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {submittingEmployee ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>{submittingEmployee ? "מוסיף עובד..." : "הוסף עובד לצוות"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Directory List Preview */}
          <div className="p-4 rounded-2xl bg-white border border-[#DBEAFE] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#172B4D]">
                {activeTab === "customer"
                  ? `לקוחות פעילים ב-SharePoint (${filteredCustomers.length})`
                  : `עובדי צוות פעילים (${filteredEmployees.length})`}
              </span>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="סינון מהיר..."
                  className="w-full pr-8 pl-2.5 py-1 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {loadingList ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                <span>טוען נתונים...</span>
              </div>
            ) : activeTab === "customer" ? (
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1">
                {filteredCustomers.map((c) => (
                  <span
                    key={c.id || c.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] text-xs font-medium text-[#172B4D]"
                  >
                    <span>{c.name}</span>
                    {c.webUrl && (
                      <a
                        href={c.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:text-[#1D4ED8]"
                        title="פתח תיקייה ב-SharePoint"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.name}
                    className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-bold text-[#172B4D]">{emp.name}</span>
                    <span className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
                      {emp.email}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
