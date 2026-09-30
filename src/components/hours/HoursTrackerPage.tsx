import React, { useEffect, useState, useRef } from "react";
import {
  LogOut,
  UserCheck,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Lock,
  Building2,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  RANDOM_SLUG,
  getRedirectUri,
  getAuthority,
  getActiveTenantId,
  getActiveClientId,
  saveAzureCredentials,
} from "../../config/hoursConfig";
import {
  getMsalInstance,
  getApiToken,
  loginWithMicrosoft,
  logoutFromMicrosoft,
  resetMsalInstance,
} from "../../services/hoursAuth";
import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";

interface ServerUserInfo {
  name: string;
  email: string;
  oid: string;
}

export const HoursTrackerPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("טוען מערכת זיהוי...");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [serverUser, setServerUser] = useState<ServerUserInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pcaInstance, setPcaInstance] = useState<PublicClientApplication | null>(null);

  // Configuration state for tenant & client ID
  const [tenantId, setTenantId] = useState<string>(() => getActiveTenantId());
  const [clientId, setClientId] = useState<string>(() => getActiveClientId());
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState<boolean>(false);

  const isInitializingRef = useRef(false);

  // 1. Meta tag: ensure <meta name="robots" content="noindex,nofollow"> is present & Title
  useEffect(() => {
    document.title = "TECH-SELECT | מסך זיהוי עובד - תיעוד שעות";
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "he";

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const existingRobots = robotsMeta ? robotsMeta.getAttribute("content") : null;

    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = "noindex,nofollow";

    return () => {
      if (robotsMeta) {
        if (existingRobots) {
          robotsMeta.content = existingRobots;
        } else {
          robotsMeta.remove();
        }
      }
    };
  }, []);

  // 2. Initialize MSAL and process any incoming redirect tokens
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    async function initAuth() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const currentTenant = getActiveTenantId();
        const currentClient = getActiveClientId();

        // If credentials are not yet configured, stop loading and present the identification screen with configuration setup
        if (!currentTenant || !currentClient) {
          setLoading(false);
          return;
        }

        const pca = await getMsalInstance();
        setPcaInstance(pca);

        // Process any pending redirect response from Microsoft login
        setLoadingMessage("בודק נתוני זיהוי מול Microsoft 365...");
        const redirectResponse = await pca.handleRedirectPromise();

        let currentAccount: AccountInfo | null = null;
        if (redirectResponse?.account) {
          currentAccount = redirectResponse.account;
          pca.setActiveAccount(currentAccount);
        } else {
          const accounts = pca.getAllAccounts();
          if (accounts.length > 0) {
            currentAccount = pca.getActiveAccount() || accounts[0];
            pca.setActiveAccount(currentAccount);
          }
        }

        // If user is already authenticated with MSAL, verify with backend /api/hours/me
        if (currentAccount) {
          setAccount(currentAccount);
          setLoadingMessage("מאמת הרשאות וטוען נתוני עובד מהשרת...");

          try {
            const token = await getApiToken(pca);
            const response = await fetch("/api/hours/me", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(
                errData.message || `אימות שרת נכשל (קוד שגיאה: ${response.status})`
              );
            }

            const userData: ServerUserInfo = await response.json();
            setServerUser(userData);
          } catch (apiErr: any) {
            console.error("[HoursTracker] API Error:", apiErr);
            setErrorMessage(
              apiErr?.message || "נכשלה גישה לשרת האימות (/api/hours/me). אנא נסה שוב מאוחר יותר."
            );
          }
        }
      } catch (err: any) {
        console.error("[HoursTracker] Auth initialization error:", err);
        setErrorMessage(
          err?.message || "אירעה שגיאה בעת ההתחברות ל-Microsoft 365. אנא ודא שהינך מחובר לחשבון הארגוני ונסה שוב."
        );
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const handleStartLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setLoadingMessage("מעביר למסך ההתחברות של Microsoft 365...");

      const currentTenant = getActiveTenantId();
      const currentClient = getActiveClientId();

      if (!currentTenant || !currentClient) {
        setIsConfigOpen(true);
        setErrorMessage("נדרש להגדיר מזהה ארגון (Tenant ID) ומזהה אפליקציה (Client ID) של Microsoft 365 להפעלת הזיהוי.");
        setLoading(false);
        return;
      }

      const pca = pcaInstance || (await getMsalInstance());
      await loginWithMicrosoft(pca);
    } catch (err: any) {
      console.error("[HoursTracker] Login error:", err);
      setErrorMessage(err?.message || "נכשל ניסיון ההתחברות מול Microsoft.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setLoadingMessage("מתנתק מהמערכת...");
      await logoutFromMicrosoft(pcaInstance || undefined);
    } catch (err: any) {
      console.error("[HoursTracker] Logout error:", err);
      setErrorMessage(err?.message || "ההתנתקות נכשלה.");
      setLoading(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim() || !clientId.trim()) {
      setErrorMessage("נא למלא את שני השדות (Tenant ID ו-Client ID).");
      return;
    }

    saveAzureCredentials(tenantId.trim(), clientId.trim());
    resetMsalInstance();
    setConfigSavedSuccess(true);
    setErrorMessage(null);

    try {
      setLoading(true);
      setLoadingMessage("מאתחל חיבור מול Microsoft 365 עם הפרטים החדשים...");
      const pca = await getMsalInstance();
      setPcaInstance(pca);
      setTimeout(() => {
        setLoading(false);
        setConfigSavedSuccess(false);
      }, 1000);
    } catch (err: any) {
      setErrorMessage("שגיאה באתחול החיבור עם הפרטים שהוזנו: " + err?.message);
      setLoading(false);
    }
  };

  const isConfigured = Boolean(getActiveTenantId() && getActiveClientId());
  const displayName = serverUser?.name || account?.name || "עובד Tech-Select";
  const userEmail = serverUser?.email || account?.username || "";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
    >
      {/* Background Tech Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#07090e]/80 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">TECH-SELECT</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                פורטל פנימי
              </span>
            </div>
            <h1 className="text-sm font-semibold text-slate-300">מסך זיהוי ותיעוד שעות</h1>
          </div>
        </div>

        {/* User Status & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {(account || serverUser) ? (
            <>
              <div className="flex items-center gap-2.5 text-right bg-white/5 border border-white/10 rounded-full py-1 px-3 sm:px-4">
                <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-400/40">
                  {displayName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-slate-200 leading-tight">{displayName}</p>
                  {userEmail && <p className="text-[10px] text-slate-400 leading-none">{userEmail}</p>}
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 transition-all cursor-pointer active:scale-95"
                title="התנתק מחשבון Microsoft 365"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>התנתק</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>נדרש זיהוי עובד</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-lg">
          {/* Loading State Spinner */}
          {loading && (
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-base font-semibold text-white mb-1">{loadingMessage}</p>
              <p className="text-xs text-slate-400">חיבור ארגוני מאובטח &middot; Tech-Select Entra ID</p>
            </div>
          )}

          {/* Error Message Screen */}
          {!loading && errorMessage && (
            <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 backdrop-blur-xl text-right shadow-2xl mb-6">
              <div className="flex items-center gap-3 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-bold">הודעת מערכת</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                {errorMessage}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  סגור הודעה
                </button>
              </div>
            </div>
          )}

          {/* STATE 1: Unauthenticated -> Primary Identification Screen ("מסך זיהוי עובד") */}
          {!loading && !account && !serverUser && (
            <div className="relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

              {/* Main Identification Badge Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                <ShieldCheck className="w-10 h-10 text-cyan-300" />
              </div>

              {/* Screen Title */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                מסך זיהוי עובד
              </h2>
              <p className="text-sm text-cyan-300/90 font-medium mb-6">
                מערכת תיעוד ודיווח שעות &middot; TECH-SELECT LTD
              </p>

              {/* Identification Explanatory Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 text-right mb-6">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">גישה מורשית לעובדי החברה בלבד</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      כדי לתעד שעות במערכת, יש להזדהות באמצעות חשבון Microsoft 365 הארגוני המשויך לדומיין{" "}
                      <span className="text-cyan-300 font-mono" dir="ltr">@tech-select.co.il</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Action Button: Connect with Microsoft 365 */}
              <button
                onClick={handleStartLogin}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-xl shadow-blue-600/25 cursor-pointer active:scale-98 border border-blue-400/30 mb-4"
              >
                {/* Microsoft 4-Color Grid Icon */}
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4 flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-[#f25022] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#7fba00] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#00a4ef] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#ffb900] rounded-xs" />
                </div>
                <span>התחברות באמצעות Microsoft 365</span>
              </button>

              {/* Single-Tenant Verification Tag */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-6">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>אימות ארגוני ישיר (Single-Tenant Entra ID)</span>
              </div>

              {/* Collapsible Admin Entra ID Setup Drawer */}
              <div className="border-t border-white/10 pt-4 text-right">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>הגדרות חיבור Entra ID (למנהל המערכת)</span>
                  </span>
                  {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isConfigOpen && (
                  <form onSubmit={handleSaveCredentials} className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 text-right space-y-3">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      ניתן להזין כאן את מזהי ה-Azure של טק-סלקט (הנתונים נשמרים מקומית בדפדפן לצורך זיהוי מיידי):
                    </p>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        AZURE_TENANT_ID (מזהה ה-Directory)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        placeholder="e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        AZURE_CLIENT_ID (מזהה ה-App Registration)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="e.g. 11111111-2222-3333-4444-555555555555"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {configSavedSuccess && (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ההגדרות נשמרו בהצלחה!</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                      >
                        שמור והפעל חיבור
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* STATE 2: Authenticated -> "תיעוד שעות – בקרוב" + Employee Name */}
          {!loading && (account || serverUser) && (
            <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

              {/* Icon badge */}
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-400/30 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Clock className="w-8 h-8 text-cyan-300" />
              </div>

              {/* Required Header: "תיעוד שעות – בקרוב" */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                תיעוד שעות – בקרוב
              </h2>

              {/* Employee Name Greeting */}
              <p className="text-base sm:text-lg font-medium text-cyan-300 mb-6">
                שלום, <span className="font-bold underline decoration-cyan-400/40">{displayName}</span>
              </p>

              {/* Authenticated Employee Details Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-right mb-6">
                <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                  <span className="text-slate-400">עובד מאומת:</span>
                  <span className="font-semibold text-slate-200">{displayName}</span>
                </div>
                {userEmail && (
                  <div className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                    <span className="text-slate-400">דוא״ל ארגוני:</span>
                    <span className="font-mono text-slate-300 text-[11px]" dir="ltr">{userEmail}</span>
                  </div>
                )}
                {serverUser?.oid && (
                  <div className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-400">מזהה אימות שרת (OID):</span>
                    <span className="font-mono text-cyan-400 text-[10px]" dir="ltr">
                      {serverUser.oid.slice(0, 16)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Security confirmation badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>מאומת ומאובטח בחיבור יחיד (Single-Tenant Microsoft 365)</span>
              </div>

              <div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>התנתקות מהמערכת</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-slate-500 text-xs border-t border-white/5">
        TECH-SELECT LTD &copy; {new Date().getFullYear()} &middot; מערכת פנימית מוגנת &middot; מסך זיהוי עובד
      </footer>
    </div>
  );
};
