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
  BarChart3,
  FileSpreadsheet,
  ListChecks,
} from "lucide-react";
import {
  fetchHoursConfig,
  AzureHoursConfig,
} from "../../config/hoursConfig";
import {
  initMsal,
  getApiToken,
  setCachedApiToken,
  clearCachedApiToken,
  isJwtTokenExpired,
  loginWithMicrosoft,
  logoutFromMicrosoft,
  purgeAllMsalAndHoursAuthStorage,
} from "../../services/hoursAuth";
import { HoursAssistantChat } from "./HoursAssistantChat";
import { HoursTestPanel } from "./HoursTestPanel";
import { TodayHoursModal } from "./TodayHoursModal";
import { CentralHoursLogModal } from "./CentralHoursLogModal";
import { MyLoggedHoursModal } from "./MyLoggedHoursModal";
import { HoursErrorBoundary } from "./HoursErrorBoundary";
import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";

interface ServerUserInfo {
  name: string;
  email: string;
  oid: string;
  id?: string;
  username?: string;
  upn?: string;
  isAdmin?: boolean;
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
  const [showDailySummaryModal, setShowDailySummaryModal] = useState<boolean>(false);
  const [showCentralLogModal, setShowCentralLogModal] = useState<boolean>(false);
  const [showMyLoggedHoursModal, setShowMyLoggedHoursModal] = useState<boolean>(false);
  const [quotaRefreshTrigger, setQuotaRefreshTrigger] = useState<number>(0);

  // Generation counter so clicking Logout at ANY stage immediately cancels any in-flight initAuth
  const authGenRef = useRef<number>(0);

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
    document.title = "TECH-SELECT | שעות לחיוב לקוח";
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
    const myGen = ++authGenRef.current;

    async function initAuth() {
      try {
        setLoading(true);
        setErrorMessage(null);
        setMissingConfig(null);

        // Fast check: if user explicitly logged out and there is no OAuth callback in URL hash/search,
        // show the clean Login screen immediately without waiting!
        const hasAuthCallbackInUrl =
          typeof window !== "undefined" &&
          (window.location.hash.includes("code=") ||
            window.location.hash.includes("id_token=") ||
            window.location.hash.includes("access_token=") ||
            window.location.search.includes("code="));

        const urlParamsInitial = new URLSearchParams(window.location.search);
        const wasLoggedOutInitially =
          !hasAuthCallbackInUrl &&
          (urlParamsInitial.get("logged_out") === "1" ||
            sessionStorage.getItem("hours_logged_out_explicitly") === "true" ||
            Boolean(localStorage.getItem("hours_logged_out_explicitly")));

        // Step 1: Load Azure configuration at RUNTIME from server endpoint
        setLoadingMessage("טוען הגדרות שרת מאובטחות (/api/hours/config)...");
        let config: AzureHoursConfig;
        try {
          config = await fetchHoursConfig();
        } catch (fetchErr: any) {
          if (authGenRef.current !== myGen) return;
          console.error("[HoursTracker] Failed to load server config:", fetchErr);
          setLoading(false);
          setErrorMessage(fetchErr?.message || "נכשלה טעינת הגדרות שרת (/api/hours/config).");
          return;
        }

        if (authGenRef.current !== myGen) return;

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
        if (authGenRef.current !== myGen) return;
        setPcaInstance(pca);

        // If user explicitly logged out, immediately stop here and show login screen
        if (wasLoggedOutInitially) {
          purgeAllMsalAndHoursAuthStorage(pca);
          if (urlParamsInitial.has("logged_out")) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setAccount(null);
          setServerUser(null);
          setShowFallbackButton(true);
          setLoading(false);
          return;
        }

        // Step 3: Handle any incoming redirect response from Microsoft login
        setLoadingMessage("בודק אימות מול Microsoft 365...");
        const redirectResponse = await pca.handleRedirectPromise();
        if (authGenRef.current !== myGen) return;

        // Check if the user explicitly clicked Logout (either via URL query param or storage flag)
        const urlParams = new URLSearchParams(window.location.search);
        const isExplicitLogout =
          !redirectResponse &&
          (urlParams.get("logged_out") === "1" ||
            sessionStorage.getItem("hours_logged_out_explicitly") === "true" ||
            Boolean(localStorage.getItem("hours_logged_out_explicitly")));

        if (isExplicitLogout) {
          purgeAllMsalAndHoursAuthStorage(pca);
          if (urlParams.has("logged_out")) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setAccount(null);
          setServerUser(null);
          setShowFallbackButton(true);
          setLoading(false);
          return;
        }

        let currentAccount: AccountInfo | null = null;
        if (redirectResponse) {
          try {
            sessionStorage.removeItem("hours_logged_out_explicitly");
            localStorage.removeItem("hours_logged_out_explicitly");
          } catch {}

          if (redirectResponse.account) {
            currentAccount = redirectResponse.account;
            pca.setActiveAccount(currentAccount);
          }
          const freshToken = redirectResponse.idToken || redirectResponse.accessToken;
          if (freshToken) {
            setCachedApiToken(freshToken, 3600);
          }
        }

        if (!currentAccount) {
          const accounts = pca.getAllAccounts();
          if (accounts.length > 0) {
            currentAccount = pca.getActiveAccount() || accounts[0];
            pca.setActiveAccount(currentAccount);
          } else {
            // Check if user has a valid non-expired persistent token from prior login
            const persistentToken = localStorage.getItem("hours_persistent_auth_token_v3");
            const rawSavedUser = localStorage.getItem("hours_saved_server_user_v2");
            if (persistentToken && rawSavedUser && !isJwtTokenExpired(persistentToken, 120)) {
              try {
                const parsedUser = JSON.parse(rawSavedUser);
                if (parsedUser && parsedUser.email) {
                  setServerUser(parsedUser);
                  setLoading(false);
                  return;
                }
              } catch {}
            } else if (persistentToken && isJwtTokenExpired(persistentToken, 120)) {
              clearCachedApiToken();
            }
          }
        }

        if (authGenRef.current !== myGen) return;

        // Step 4: When there is no signed-in user, redirect automatically to Microsoft 365 sign-in
        if (!currentAccount) {
          setLoadingMessage("מעביר אוטומטית להתחברות Microsoft 365...");
          try {
            await loginWithMicrosoft(pca, config.apiScope);
            return;
          } catch (redirectErr: any) {
            if (authGenRef.current !== myGen) return;
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
          let token = await getApiToken(pca, config.apiScope);
          if (authGenRef.current !== myGen) return;

          let response = await fetch("/api/hours/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          // If cached token got 401, force refresh once via MSAL silent token acquisition
          if (response.status === 401) {
            clearCachedApiToken();
            token = await getApiToken(pca, config.apiScope, true);
            if (authGenRef.current !== myGen) return;
            response = await fetch("/api/hours/me", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          }

          if (authGenRef.current !== myGen) return;

          if (!response.ok) {
            if (response.status === 401) {
              clearCachedApiToken();
              throw new Error("פג תוקף הרשאת החיבור מול Microsoft 365 (401). נא להתחבר מחדש.");
            }
            const errData = await response.json().catch(() => ({}));
            throw new Error(
              errData.message || errData.error || `אימות שרת נכשל (קוד שגיאה: ${response.status})`
            );
          }

          setCachedApiToken(token);
          const userData: ServerUserInfo = await response.json();
          if (authGenRef.current !== myGen) return;
          setServerUser(userData);
          try {
            localStorage.setItem("hours_saved_server_user_v2", JSON.stringify(userData));
          } catch {}
        } catch (apiErr: any) {
          if (authGenRef.current !== myGen) return;
          console.warn("[HoursTracker] /api/hours/me info note:", apiErr);
          const isAuthExpired =
            String(apiErr?.message || "").includes("401") ||
            String(apiErr?.message || "").includes("פג תוקף");

          if (isAuthExpired) {
            clearCachedApiToken();
            setAccount(null);
            setServerUser(null);
            setShowFallbackButton(true);
            setErrorMessage("פג תוקף החיבור ל-Microsoft 365. אנא לחץ על כפתור ההתחברות כדי להתחבר מחדש.");
          } else if (currentAccount) {
            const accOid = currentAccount.localAccountId || currentAccount.homeAccountId?.split(".")[0] || "";
            const fallbackUser: ServerUserInfo = {
              name: currentAccount.name || (currentAccount.username ? currentAccount.username.split("@")[0] : "עובד"),
              email: currentAccount.username || "g@tech-select.co.il",
              oid: accOid,
              id: accOid,
              username: currentAccount.username || "g@tech-select.co.il",
              upn: currentAccount.username || "g@tech-select.co.il",
              isAdmin: ["g@tech-select.co.il"].includes(
                (currentAccount.username || "").toLowerCase()
              ),
            };
            setServerUser(fallbackUser);
            try {
              localStorage.setItem("hours_saved_server_user_v2", JSON.stringify(fallbackUser));
            } catch {}
          }
        }
      } catch (err: any) {
        if (authGenRef.current !== myGen) return;
        console.error("[HoursTracker] Auth initialization error:", err);
        setShowFallbackButton(true);
        setErrorMessage(
          err?.message || "אירעה שגיאה בעת ההתחברות ל-Microsoft 365. אנא ודא שהינך מחובר לחשבון הארגוני ונסה שוב."
        );
      } finally {
        if (authGenRef.current === myGen) {
          setLoading(false);
        }
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

  // Instant, unstoppable Logout handler usable at ANY stage (loading, active chat, error, etc.)
  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Cancel any in-flight initAuth immediately
    authGenRef.current += 1;

    setShowMyLoggedHoursModal(false);
    setShowDailySummaryModal(false);
    setShowCentralLogModal(false);
    setShowTestPanel(false);
    setErrorMessage(null);
    setAccount(null);
    setServerUser(null);
    setShowFallbackButton(true);
    setLoading(false);

    try {
      await logoutFromMicrosoft(pcaInstance || undefined);
    } catch (err: any) {
      console.error("[HoursTracker] Logout error:", err);
      clearCachedApiToken();
      purgeAllMsalAndHoursAuthStorage(pcaInstance || undefined);
      try {
        sessionStorage.setItem("hours_logged_out_explicitly", "true");
        localStorage.setItem("hours_logged_out_explicitly", String(Date.now()));
      } catch {}
    }
  };

  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#ffffff";
    document.documentElement.style.backgroundColor = "#ffffff";
    return () => {
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, []);

  const displayName = serverUser?.name || account?.name || "עובד";
  const userEmail = serverUser?.email || account?.username || "g@tech-select.co.il";
  const userOid =
    serverUser?.oid ||
    serverUser?.id ||
    account?.localAccountId ||
    (account?.idTokenClaims as any)?.oid ||
    account?.homeAccountId?.split(".")[0] ||
    "";
  const username = account?.username || serverUser?.username || serverUser?.email || userEmail;
  const isGuy = userEmail.trim().toLowerCase() === "g@tech-select.co.il" || username.trim().toLowerCase() === "g@tech-select.co.il";
  const isGuyOrAdmin = Boolean(
    serverUser?.isAdmin ||
    isGuy
  );

  const currentUserObj = {
    name: displayName,
    email: userEmail,
    id: userOid,
    oid: userOid,
    username,
    upn: username,
    isAdmin: isGuyOrAdmin,
  };

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] h-[100dvh] w-full bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white relative overflow-hidden pt-[env(safe-area-inset-top)]"
    >
      {/* Top Header - Minimalist Luxury Navbar (ChatGPT / Gemini Style) */}
      <header className="relative z-20 h-13 sm:h-14 border-b border-slate-200/70 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-900 tracking-tight whitespace-nowrap">
              שעות לחיוב לקוח
            </span>
            <span className="hidden sm:inline text-slate-300 font-light">·</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-400 tracking-wide whitespace-nowrap">
              TECH-SELECT
            </span>
          </div>
        </div>

        {/* Right & Left Header Controls: Clean Minimalist Pills + Always-Accessible Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
          {(account || serverUser) ? (
            <>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0">
                {/* "כמה תיעדתי היום" Button for EVERY User */}
                <button
                  type="button"
                  onClick={() => setShowMyLoggedHoursModal(true)}
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  title="בדוק כמה שעות לחיוב לקוח תיעדת היום ובכל יום מתוך Microsoft Lists"
                >
                  <ListChecks className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>כמה תיעדתי היום</span>
                </button>

                {/* Today's Hours Summary Button for Manager Guy & Admins */}
                {isGuyOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDailySummaryModal(true)}
                    className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                    title="דוח וריכוז שעות עבודה יומי לכל העובדים (מנהל)"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="sm:hidden">דוח יומי</span>
                    <span className="hidden sm:inline">שעות היום (מנהל)</span>
                  </button>
                )}

                {/* Central LOG Button for Guy g@tech-select.co.il */}
                {isGuy && (
                  <button
                    type="button"
                    onClick={() => setShowCentralLogModal(true)}
                    className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                    title="יומן שעות מרכזי (LOG) לכל העובדים"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="sm:hidden">LOG</span>
                    <span className="hidden sm:inline">יומן מרכזי</span>
                  </button>
                )}

                {serverUser?.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowTestPanel(!showTestPanel)}
                    className={`text-xs p-1.5 sm:px-3 sm:py-1.5 rounded-full border font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      showTestPanel
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90"
                    }`}
                    title="פאנל בדיקות טכני וסריקת מבנה קבצים"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden lg:inline">בדיקה טכנית</span>
                  </button>
                )}

                <div className="hidden md:flex items-center gap-2 text-right bg-slate-50 border border-slate-200/80 rounded-full py-1 px-2.5 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {displayName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                    {displayName}
                  </span>
                </div>
              </div>

              {/* PINNED LOGOUT BUTTON: Always visible, clean, accessible at any stage */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                title="התנתק / יציאה מהחשבון והחלפת משתמש בכל שלב"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>יציאה</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                <span>הזדהות</span>
              </div>
              {loading && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                  title="עצור חיבור אוטומטי והתנתק"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>איפוס</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {(account || serverUser) ? (
        <main className="relative z-10 flex-1 w-full h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.5rem)] overflow-hidden flex flex-col bg-white">
          {/* Per-User "כמה תיעדתי היום" Modal (Directly queries Microsoft Lists) */}
          {showMyLoggedHoursModal && (
            <MyLoggedHoursModal
              isOpen={showMyLoggedHoursModal}
              onClose={() => {
                setShowMyLoggedHoursModal(false);
                setQuotaRefreshTrigger((prev) => prev + 1);
              }}
              currentUser={currentUserObj}
            />
          )}

          {/* Daily Hours Summary Modal for Manager Guy & Admins */}
          {showDailySummaryModal && (
            <TodayHoursModal
              isOpen={showDailySummaryModal}
              onClose={() => setShowDailySummaryModal(false)}
            />
          )}

          {/* Central Hours Log Modal for Guy */}
          {showCentralLogModal && (
            <CentralHoursLogModal
              isOpen={showCentralLogModal}
              onClose={() => setShowCentralLogModal(false)}
              currentUser={currentUserObj}
            />
          )}

          {/* Admin Test Panel Modal Overlay */}
          {showTestPanel && serverUser?.isAdmin && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span>פאנל בדיקה טכני ומבנה קבצים</span>
                  </div>
                  <button
                    onClick={() => setShowTestPanel(false)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer font-bold"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <HoursTestPanel
                    currentUser={currentUserObj}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Full-Window Hours Assistant */}
          <HoursErrorBoundary
            fallbackTitle="אירעה שגיאה בטעינת מערכת שעות לחיוב לקוח"
            fallbackMessage="המערכת נתקלה בשגיאה זמנית. ניתן ללחוץ על 'נסה להציג שוב' או לרענן את העמוד."
          >
            <HoursAssistantChat
              currentUser={currentUserObj}
              onOpenTodaySummary={() => setShowDailySummaryModal(true)}
              onOpenMyLoggedHours={() => setShowMyLoggedHoursModal(true)}
              onLogout={handleLogout}
              quotaRefreshTrigger={quotaRefreshTrigger}
            />
          </HoursErrorBoundary>
        </main>
      ) : (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10 bg-white">
          <div className="w-full max-w-sm transition-all">
            {/* Missing System Configuration Screen */}
            {missingConfig && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-right mb-6">
                <div className="flex items-center gap-2.5 text-slate-900 mb-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold">
                    חסרה הגדרת מערכת: {missingConfig}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  השרת אינו מוגדר עם המשתנה הנדרש עבור אימות Microsoft 365.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-mono" dir="ltr">
                  GET /api/hours/config &rarr; {missingConfig} is empty
                </div>
              </div>
            )}

            {/* Loading State Spinner */}
            {!missingConfig && loading && (
              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 text-center shadow-xs">
                <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-900 mb-1">{loadingMessage}</p>
                <p className="text-xs text-slate-400 mb-5">Microsoft 365 Single Sign-On</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mx-auto px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>התנתק / החלף משתמש</span>
                </button>
              </div>
            )}

            {/* Error Message Screen */}
            {!missingConfig && !loading && errorMessage && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-right mb-5">
                <div className="flex items-center gap-2 text-slate-900 mb-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-slate-700" />
                  <h3 className="text-xs font-semibold">הודעת מערכת</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                  {errorMessage}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    סגור
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>נקה חיבור</span>
                  </button>
                </div>
              </div>
            )}

            {/* Minimalist Sign-in Card */}
            {!missingConfig && !loading && !account && !serverUser && (showFallbackButton || errorMessage) && (
              <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-5 h-5" />
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-1.5 tracking-tight">
                  שעות לחיוב לקוח
                </h2>
                <p className="text-xs text-slate-400 font-normal mb-6">
                  TECH-SELECT · כניסת עובדים מורשים
                </p>

                <button
                  onClick={handleManualLogin}
                  className="w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] mb-4"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-[#f25022]" />
                    <div className="w-1.5 h-1.5 bg-[#7fba00]" />
                    <div className="w-1.5 h-1.5 bg-[#00a4ef]" />
                    <div className="w-1.5 h-1.5 bg-[#ffb900]" />
                  </div>
                  <span>התחברות עם Microsoft 365</span>
                </button>

                <p className="text-[11px] text-slate-400">
                  חשבון ארגוני <span className="font-mono text-slate-500" dir="ltr">@tech-select.co.il</span>
                </p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
};
