import React, { useEffect, useState, useRef } from "react";
import { LogOut, UserCheck, AlertCircle, Clock, ShieldCheck, RefreshCw } from "lucide-react";
import {
  AZURE_TENANT_ID,
  AZURE_CLIENT_ID,
  RANDOM_SLUG,
  getRedirectUri,
  getAuthority,
} from "../../config/hoursConfig";
import {
  getMsalInstance,
  getApiToken,
  loginWithMicrosoft,
  logoutFromMicrosoft,
} from "../../services/hoursAuth";
import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";

interface ServerUserInfo {
  name: string;
  email: string;
  oid: string;
}

export const HoursTrackerPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("מתחבר למערכת Microsoft 365...");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [serverUser, setServerUser] = useState<ServerUserInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pcaInstance, setPcaInstance] = useState<PublicClientApplication | null>(null);
  const isInitializingRef = useRef(false);

  // 1. Meta tag: ensure <meta name="robots" content="noindex,nofollow"> is present
  useEffect(() => {
    document.title = "TECH-SELECT | תיעוד שעות";
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

  // 2. Initialize MSAL and process redirect or immediate login
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    async function initAuth() {
      try {
        setLoading(true);
        setErrorMessage(null);

        // Check if configuration constants are filled
        const hasTenantConfig = Boolean(AZURE_TENANT_ID && AZURE_TENANT_ID.trim().length > 0);
        const hasClientConfig = Boolean(AZURE_CLIENT_ID && AZURE_CLIENT_ID.trim().length > 0);

        if (!hasTenantConfig || !hasClientConfig) {
          setLoading(false);
          setErrorMessage(
            "נדרשת הגדרת פרטי Microsoft 365: יש להזין את AZURE_TENANT_ID ואת AZURE_CLIENT_ID בקובץ ההגדרות (src/config/hoursConfig.ts) או במשתני הסביבה (.env) כדי להפעיל את ההתחברות הארגונית."
          );
          return;
        }

        const pca = await getMsalInstance();
        setPcaInstance(pca);

        // Process any pending redirect response from Microsoft login
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

        // If no user is signed in, immediately redirect to Microsoft 365 sign-in page
        if (!currentAccount) {
          setLoadingMessage("מעביר להתחברות Microsoft 365...");
          await loginWithMicrosoft(pca);
          return;
        }

        setAccount(currentAccount);
        setLoadingMessage("מאמת הרשאות וטוען פרטי עובד משרת Tech-Select...");

        // Acquire API token and call backend /api/hours/me
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

  const handleRetryLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setLoadingMessage("מעביר להתחברות Microsoft 365...");
      await loginWithMicrosoft(pcaInstance || undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || "ההתחברות נכשלה.");
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
      {/* Background Subtle Tech Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#07090e]/80 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Tech-Select Logo Icon */}
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">TECH-SELECT</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                כלי פנימי
              </span>
            </div>
            <h1 className="text-sm font-semibold text-slate-300">תיעוד שעות</h1>
          </div>
        </div>

        {/* User Status & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {(account || serverUser) && (
            <div className="flex items-center gap-2.5 text-right bg-white/5 border border-white/10 rounded-full py-1 px-3 sm:px-4">
              <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-400/40">
                {displayName.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-200 leading-tight">{displayName}</p>
                {userEmail && <p className="text-[10px] text-slate-400 leading-none">{userEmail}</p>}
              </div>
            </div>
          )}

          {account && (
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 transition-all cursor-pointer active:scale-95"
              title="התנתק מחשבון Microsoft 365"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>התנתק</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg">
          {/* Loading State */}
          {loading && (
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-200">{loadingMessage}</p>
              <p className="text-xs text-slate-400 mt-1">חיבור מאובטח באמצעות Microsoft Entra ID</p>
            </div>
          )}

          {/* Error Message Screen */}
          {!loading && errorMessage && (
            <div className="p-6 sm:p-8 rounded-2xl bg-red-950/20 border border-red-500/30 backdrop-blur-xl text-right shadow-2xl">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-base font-bold">הודעת מערכת</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-6">
                {errorMessage}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetryLogin}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>התחבר שוב עם Microsoft 365</span>
                </button>
              </div>
            </div>
          )}

          {/* Authenticated State Placeholder: "תיעוד שעות – בקרוב" + employee name */}
          {!loading && !errorMessage && (account || serverUser) && (
            <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

              {/* Icon badge */}
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-400/30 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>

              {/* Required Text: "תיעוד שעות – בקרוב" */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                תיעוד שעות – בקרוב
              </h2>

              {/* Employee name display */}
              <p className="text-base sm:text-lg font-medium text-cyan-300 mb-6">
                שלום, <span className="font-bold underline decoration-cyan-400/40">{displayName}</span>
              </p>

              {/* User details card */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-right mb-6">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-xs">
                  <span className="text-slate-400">עובד מחובר:</span>
                  <span className="font-semibold text-slate-200">{displayName}</span>
                </div>
                {userEmail && (
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-xs">
                    <span className="text-slate-400">דוא״ל ארגוני:</span>
                    <span className="font-mono text-slate-300 text-[11px]" dir="ltr">{userEmail}</span>
                  </div>
                )}
                {serverUser?.oid && (
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-slate-400">אימות שרת (OID):</span>
                    <span className="font-mono text-cyan-400 text-[10px]" dir="ltr">
                      {serverUser.oid.slice(0, 16)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Security badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>מאומת ומאובטח בחיבור יחיד (Single-Tenant Microsoft 365)</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-slate-500 text-xs border-t border-white/5">
        TECH-SELECT LTD &copy; {new Date().getFullYear()} &middot; מערכת פנימית מוגנת
      </footer>
    </div>
  );
};
