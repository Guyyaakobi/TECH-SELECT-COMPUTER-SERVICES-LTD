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
  Palette,
  Sparkles,
  Check,
  SlidersHorizontal,
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

  // Modern Color Palette Switcher State ("cyan" = Deep Cyber, "amber" = Obsidian Amber)
  const [colorPalette, setColorPalette] = useState<"cyan" | "amber">(() => {
    try {
      const saved = localStorage.getItem("techselect_hours_palette");
      return saved === "amber" ? "amber" : "cyan";
    } catch {
      return "cyan";
    }
  });
  const [showPaletteMenu, setShowPaletteMenu] = useState<boolean>(false);

  const handlePaletteChange = (palette: "cyan" | "amber") => {
    setColorPalette(palette);
    try {
      localStorage.setItem("techselect_hours_palette", palette);
    } catch {
      // ignore
    }
    setShowPaletteMenu(false);
  };

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
      className="h-[100dvh] min-h-[100dvh] bg-[#fafafc] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden"
    >
      {/* Soft Ethereal Blue Glow in the Center (Exactly like the video) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <div className="w-[36rem] sm:w-[48rem] h-[26rem] sm:h-[34rem] bg-gradient-to-tr from-sky-200/50 via-blue-100/40 to-indigo-100/30 rounded-full blur-3xl opacity-80" />
      </div>

      {/* Top Header - Ultra-clean, translucent white, slim on mobile */}
      <header className="relative z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-black text-slate-900 tracking-wider">TECH-SELECT</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600 border border-blue-200/80">
                תיעוד שעות
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">פורטל עובדים פנימי &middot; Microsoft 365</p>
          </div>
        </div>

        {/* User Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(account || serverUser) ? (
            <>
              <div className="flex items-center gap-2 text-right bg-slate-100/90 border border-slate-200/80 rounded-full py-1 px-2.5 sm:px-3.5 shadow-2xs">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                  {displayName.charAt(0)}
                </div>
                <div className="max-w-[120px] sm:max-w-[180px] truncate">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{displayName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTestPanel(!showTestPanel)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer shadow-2xs shrink-0 ${
                  showTestPanel
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
                }`}
                title="אבחון חיבור שרת (Microsoft Graph)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">אבחון שרת</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
                title="התנתק מחשבון Microsoft 365"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                <span className="hidden sm:inline">התנתק</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowTestPanel(!showTestPanel)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer shadow-2xs shrink-0 ${
                  showTestPanel
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
                }`}
                title="אבחון חיבור שרת (Microsoft Graph)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px]">אבחון</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px]">נדרש זיהוי עובד</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area - Full fluid height for mobile & desktop, NO boxed cube */}
      <main className="relative z-10 flex-1 flex flex-col w-full h-full overflow-hidden">
        {/* Missing System Configuration Screen */}
        {missingConfig && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-amber-50 border border-amber-200 text-right shadow-sm">
              <div className="flex items-center gap-3 text-amber-700 mb-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-bold text-amber-900">
                  חסרה הגדרת מערכת: {missingConfig}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed mb-4">
                השרת אינו מוגדר עם המשתנה הנדרש עבור אימות Microsoft 365.
                יש להגדיר את <span className="font-mono text-amber-900 font-semibold" dir="ltr">{missingConfig}</span> בסביבת השרת (Cloudflare Environment Bindings / .env).
              </p>
              <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-200 text-xs text-amber-900 font-mono" dir="ltr">
                GET /api/hours/config &rarr; {missingConfig} is empty
              </div>
            </div>
          </div>
        )}

        {/* Loading State Spinner */}
        {!missingConfig && loading && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 sm:p-12 rounded-3xl bg-white/90 border border-slate-200/80 backdrop-blur-xl text-center shadow-lg">
              <div className="w-12 h-12 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-base font-semibold text-slate-800 mb-1">{loadingMessage}</p>
              <p className="text-xs text-slate-500">אימות ארגוני ישיר &middot; Single-Tenant Entra ID</p>
            </div>
          </div>
        )}

        {/* Error Message Screen */}
        {!missingConfig && !loading && errorMessage && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl bg-red-50 border border-red-200 text-right shadow-sm">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-bold text-red-900">הודעת מערכת</h3>
              </div>
              <p className="text-xs sm:text-sm text-red-800 leading-relaxed whitespace-pre-line mb-4">
                {errorMessage}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-xs font-semibold text-red-800 transition-colors cursor-pointer"
                >
                  סגור הודעה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Screen (Only visible if automatic redirect failed or encountered error) */}
        {!missingConfig && !loading && !account && !serverUser && (showFallbackButton || errorMessage) && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 sm:p-10 rounded-3xl bg-white/95 border border-slate-200 shadow-xl text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                מסך זיהוי עובד
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
                מערכת תיעוד ודיווח שעות &middot; TECH-SELECT LTD
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right mb-6">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    גישה מורשית לעובדי החברה בלבד. יש להזדהות באמצעות חשבון Microsoft 365 הארגוני המשויך לדומיין{" "}
                    <span className="text-blue-600 font-mono font-semibold" dir="ltr">@tech-select.co.il</span>.
                  </p>
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={handleManualLogin}
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-blue-500/20 cursor-pointer active:scale-98 mb-4"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4 flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-[#f25022] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#7fba00] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#00a4ef] rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#ffb900] rounded-xs" />
                </div>
                <span>התחברות באמצעות Microsoft 365</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>אימות ארגוני ישיר (Single-Tenant Entra ID)</span>
              </div>
            </div>
          </div>
        )}

        {/* Authenticated State: Pure, Seamless AI Assistant directly filling the view */}
        {!missingConfig && !loading && (account || serverUser) && (
          <div className="w-full h-full flex flex-col flex-1 overflow-hidden relative">
            <HoursAssistantChat
              currentUser={{
                name: displayName,
                email: userEmail,
              }}
            />
          </div>
        )}
      </main>

      {/* Diagnostics / Test Panel Modal Overlay */}
      {showTestPanel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto relative text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">לוח אבחון שרת ובדיקות מנוע שעות</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestPanel(false)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              >
                סגור פאנל
              </button>
            </div>
            <HoursTestPanel
              currentUser={{
                name: displayName,
                email: userEmail,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
