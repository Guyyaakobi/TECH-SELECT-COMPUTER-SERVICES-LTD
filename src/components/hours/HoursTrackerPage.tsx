import React, { useEffect, useState, useRef } from "react";
import {
  LogOut,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Lock,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchHoursConfig,
  AzureHoursConfig,
} from "../../config/hoursConfig";
import {
  initMsal,
  getApiToken,
  setCachedApiToken,
  loginWithMicrosoft,
  logoutFromMicrosoft,
} from "../../services/hoursAuth";
import { HoursAssistantChat } from "./HoursAssistantChat";
import { HoursTestPanel } from "./HoursTestPanel";
import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";

interface ServerUserInfo {
  name: string;
  email: string;
  oid: string;
}

export const HoursTrackerPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("טוען הגדרות מערכת...");
  const [missingConfig, setMissingConfig] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [serverUser, setServerUser] = useState<ServerUserInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pcaInstance, setPcaInstance] = useState<PublicClientApplication | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<AzureHoursConfig | null>(null);
  const [showFallbackButton, setShowFallbackButton] = useState<boolean>(false);
  const [showTestPanel, setShowTestPanel] = useState<boolean>(false);

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

  // 2. Fetch runtime config from server -> initialize MSAL -> auto redirect or verify
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    async function initAuth() {
      try {
        setLoading(true);
        setErrorMessage(null);
        setMissingConfig(null);

        // Step 1: Load Azure configuration at RUNTIME from server endpoint
        setLoadingMessage("טוען הגדרות שרת מאובטחות (/api/hours/config)...");
        let config: AzureHoursConfig;
        try {
          config = await fetchHoursConfig();
        } catch (fetchErr: any) {
          console.error("[HoursTracker] Failed to load server config:", fetchErr);
          setLoading(false);
          setErrorMessage(fetchErr?.message || "נכשלה טעינת הגדרות שרת (/api/hours/config).");
          return;
        }

        // Validate required config attributes
        if (!config.tenantId) {
          setLoading(false);
          setMissingConfig("AZURE_TENANT_ID");
          return;
        }

        if (!config.clientId) {
          setLoading(false);
          setMissingConfig("AZURE_CLIENT_ID");
          return;
        }

        setRuntimeConfig(config);

        // Step 2: Initialize MSAL with server-provided runtime config
        setLoadingMessage("מאתחל מודול אימות Microsoft 365...");
        const pca = await initMsal(config);
        setPcaInstance(pca);

        // Step 3: Handle any incoming redirect response from Microsoft login
        setLoadingMessage("בודק אימות מול Microsoft 365...");
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

        // Step 4: When there is no signed-in user, redirect automatically to Microsoft 365 sign-in
        if (!currentAccount) {
          setLoadingMessage("מעביר אוטומטית להתחברות Microsoft 365...");
          try {
            await loginWithMicrosoft(pca, config.apiScope);
            return;
          } catch (redirectErr: any) {
            console.error("[HoursTracker] Auto-redirect failed:", redirectErr);
            setShowFallbackButton(true);
            setLoading(false);
            setErrorMessage(
              "ההעברה האוטומטית ל-Microsoft 365 נחסמה על ידי הדפדפן או נכשלה. אנא לחץ על כפתור ההתחברות למטה."
            );
            return;
          }
        }

        // Step 5: User is signed in -> acquire token & verify against /api/hours/me
        setAccount(currentAccount);
        setLoadingMessage("מאמת הרשאות וטוען פרטי עובד מהשרת...");

        try {
          const token = await getApiToken(pca, config.apiScope);
          setCachedApiToken(token);
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
      } catch (err: any) {
        console.error("[HoursTracker] Auth initialization error:", err);
        setShowFallbackButton(true);
        setErrorMessage(
          err?.message || "אירעה שגיאה בעת ההתחברות ל-Microsoft 365. אנא ודא שהינך מחובר לחשבון הארגוני ונסה שוב."
        );
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // Manual fallback button trigger
  const handleManualLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setLoadingMessage("מעביר להתחברות Microsoft 365...");

      if (!runtimeConfig || !pcaInstance) {
        const config = runtimeConfig || (await fetchHoursConfig());
        const pca = pcaInstance || (await initMsal(config));
        await loginWithMicrosoft(pca, config.apiScope);
      } else {
        await loginWithMicrosoft(pcaInstance, runtimeConfig.apiScope);
      }
    } catch (err: any) {
      console.error("[HoursTracker] Manual login error:", err);
      setErrorMessage(err?.message || "נכשל ניסיון ההתחברות מול Microsoft 365.");
      setLoading(false);
      setShowFallbackButton(true);
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
            <h1 className="text-sm font-semibold text-slate-300">תיעוד שעות</h1>
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
        <div className={`w-full ${(account || serverUser) ? "max-w-4xl" : "max-w-lg"} transition-all`}>
          {/* Missing System Configuration Screen */}
          {missingConfig && (
            <div className="p-6 sm:p-8 rounded-3xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl text-right shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">
                  חסרה הגדרת מערכת: {missingConfig}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                השרת אינו מוגדר עם המשתנה הנדרש עבור אימות Microsoft 365.
                יש להגדיר את <span className="font-mono text-amber-300 font-semibold" dir="ltr">{missingConfig}</span> בסביבת השרת (Cloudflare Environment Bindings / .env).
              </p>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-400 font-mono" dir="ltr">
                GET /api/hours/config &rarr; {missingConfig} is empty
              </div>
            </div>
          )}

          {/* Loading State Spinner */}
          {!missingConfig && loading && (
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-base font-semibold text-white mb-1">{loadingMessage}</p>
              <p className="text-xs text-slate-400">אימות ארגוני ישיר &middot; Single-Tenant Entra ID</p>
            </div>
          )}

          {/* Error Message Screen */}
          {!missingConfig && !loading && errorMessage && (
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

          {/* Fallback Screen (Only visible if automatic redirect failed or encountered error) */}
          {!missingConfig && !loading && !account && !serverUser && (showFallbackButton || errorMessage) && (
            <div className="relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                <ShieldCheck className="w-8 h-8 text-cyan-300" />
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">
                מסך זיהוי עובד
              </h2>
              <p className="text-xs sm:text-sm text-cyan-300/90 font-medium mb-6">
                מערכת תיעוד ודיווח שעות &middot; TECH-SELECT LTD
              </p>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-right mb-6">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    גישה מורשית לעובדי החברה בלבד. יש להזדהות באמצעות חשבון Microsoft 365 הארגוני המשויך לדומיין{" "}
                    <span className="text-cyan-300 font-mono" dir="ltr">@tech-select.co.il</span>.
                  </p>
                </div>
              </div>

              {/* Fallback button */}
              <button
                onClick={handleManualLogin}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-xl shadow-blue-600/25 cursor-pointer active:scale-98 border border-blue-400/30 mb-4"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4 flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-[#f25022] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#7fba00] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#00a4ef] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#ffb900] rounded-xs" />
                </div>
                <span>התחברות באמצעות Microsoft 365</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>אימות ארגוני ישיר (Single-Tenant Entra ID)</span>
              </div>
            </div>
          )}

          {/* Authenticated State: Stage 3 AI Assistant + Collapsible Test Panel */}
          {!missingConfig && !loading && (account || serverUser) && (
            <>
              {/* Stage 3 AI Assistant (Voice + Text, Mobile-First) */}
              <HoursAssistantChat
                currentUser={{
                  name: displayName,
                  email: userEmail,
                }}
              />

              {/* Stage 2 Technical Test Panel (hidden by default behind small toggle) */}
              <div className="w-full mt-6 flex flex-col items-center">
                <button
                  onClick={() => setShowTestPanel(!showTestPanel)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>מצב בדיקה (טכני / Stage 2)</span>
                  {showTestPanel ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showTestPanel && (
                  <div className="w-full mt-4">
                    <HoursTestPanel
                      currentUser={{
                        name: displayName,
                        email: userEmail,
                      }}
                    />
                  </div>
                )}
              </div>
            </>
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
