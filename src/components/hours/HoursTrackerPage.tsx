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
    document.body.style.backgroundColor = "#f8fafd";
    document.documentElement.style.backgroundColor = "#f8fafd";
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
      className="min-h-[100dvh] h-[100dvh] w-full bg-[#f8fafd] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden"
    >
      {/* Soft Ethereal Blue Glow in the Center */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <div className="w-[36rem] sm:w-[46rem] h-[26rem] sm:h-[32rem] bg-gradient-to-tr from-sky-200/50 via-blue-100/45 to-indigo-100/30 rounded-full blur-3xl opacity-80" />
      </div>

      {/* Top Header - Ultra-clean responsive navbar with ALWAYS-ACCESSIBLE Logout button */}
      <header className="relative z-20 h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between gap-2 shadow-2xs shrink-0">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white shadow-2xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="hidden sm:inline text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              TECH-SELECT
            </span>
            <span className="hidden sm:inline text-slate-300 font-light">|</span>
            <span className="text-xs sm:text-xs font-bold sm:font-semibold text-slate-800 sm:text-slate-700 sm:bg-slate-100/90 sm:px-2.5 sm:py-0.5 sm:rounded-full sm:border sm:border-slate-200 whitespace-nowrap truncate">
              שעות לחיוב לקוח
            </span>
          </div>
        </div>

        {/* Right & Left Header Controls: Scrollable tools + Pinned Always-Visible Logout Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 justify-end">
          {(account || serverUser) ? (
            <>
              {/* Scrollable Action Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 min-w-0">
                {/* "כמה תיעדתי היום" Button for EVERY User */}
                <button
                  type="button"
                  onClick={() => setShowMyLoggedHoursModal(true)}
                  className="btn-hover-subtle text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-full border border-emerald-300/90 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs transition-colors whitespace-nowrap shrink-0"
                  title="בדוק כמה שעות לחיוב לקוח תיעדת היום ובכל יום מתוך Microsoft Lists"
                >
                  <ListChecks className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>כמה תיעדתי היום</span>
                </button>

                {/* Today's Hours Summary Button for Manager Guy & Admins */}
                {isGuyOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDailySummaryModal(true)}
                    className="btn-hover-subtle text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-full border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs transition-colors whitespace-nowrap shrink-0"
                    title="דוח וריכוז שעות עבודה יומי לכל העובדים (מנהל)"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="sm:hidden">שעות היום</span>
                    <span className="hidden sm:inline">שעות היום (מנהל)</span>
                  </button>
                )}

                {/* Central LOG Button for Guy g@tech-select.co.il */}
                {isGuy && (
                  <button
                    type="button"
                    onClick={() => setShowCentralLogModal(true)}
                    className="btn-hover-subtle text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-xl sm:rounded-full border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs transition-colors whitespace-nowrap shrink-0"
                    title="יומן שעות מרכזי (LOG) לכל העובדים"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="sm:hidden">LOG</span>
                    <span className="hidden sm:inline">יומן מרכזי (LOG)</span>
                  </button>
                )}

                {serverUser?.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowTestPanel(!showTestPanel)}
                    className={`btn-hover-subtle text-xs p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-full border font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      showTestPanel
                        ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                    title="פאנל בדיקות טכני וסריקת מבנה קבצים"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">מצב בדיקה טכני</span>
                  </button>
                )}

                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-right bg-slate-50 border border-slate-200/80 rounded-full p-1 sm:py-1 sm:px-3 shadow-2xs shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {displayName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-slate-800 hidden md:inline whitespace-nowrap">
                    {displayName}
                  </span>
                </div>
              </div>

              {/* PINNED LOGOUT BUTTON: Outside scroll container, NEVER disabled, ALWAYS clickable */}
              <button
                type="button"
                onClick={handleLogout}
                className="btn-hover-subtle px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold text-red-600 hover:text-white bg-red-50/90 hover:bg-red-600 border border-red-200 hover:border-red-600 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs transition-all"
                title="התנתק / יציאה מהחשבון והחלפת משתמש בכל שלב"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>יציאה</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>נדרש זיהוי עובד</span>
              </div>
              {loading && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-xl sm:rounded-full text-[11px] font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                  title="עצור חיבור אוטומטי והתנתק"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>יציאה / איפוס</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area: Full Viewport Gemini Window when authenticated */}
      {(account || serverUser) ? (
        <main className="relative z-10 flex-1 w-full h-[calc(100dvh-3.5rem)] overflow-hidden flex flex-col bg-[#f8fafd]">
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
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>פאנל בדיקה טכני ומבנה קבצים (Stage 2)</span>
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

          {/* Full-Window Gemini Hours Assistant */}
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
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">
          <div className="w-full max-w-md transition-all">
            {/* Missing System Configuration Screen */}
            {missingConfig && (
              <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border border-amber-200 text-right shadow-sm mb-6">
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
            )}

            {/* Loading State Spinner */}
            {!missingConfig && loading && (
              <div className="p-8 sm:p-10 rounded-3xl bg-white/90 border border-slate-200/80 backdrop-blur-xl text-center shadow-lg">
                <div className="w-12 h-12 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-base font-semibold text-slate-800 mb-1">{loadingMessage}</p>
                <p className="text-xs text-slate-500 mb-5">אימות ארגוני ישיר &middot; Single-Tenant Entra ID</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mx-auto px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>התנתק / החלף משתמש</span>
                </button>
              </div>
            )}

            {/* Error Message Screen */}
            {!missingConfig && !loading && errorMessage && (
              <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-right shadow-sm mb-6">
                <div className="flex items-center gap-3 text-red-600 mb-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-red-900">הודעת מערכת</h3>
                </div>
                <p className="text-xs sm:text-sm text-red-800 leading-relaxed whitespace-pre-line mb-4">
                  {errorMessage}
                </p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-xs font-semibold text-red-800 transition-colors cursor-pointer"
                  >
                    סגור הודעה
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-red-600 text-red-700 hover:text-white border border-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>התנתק ונקה חיבור</span>
                  </button>
                </div>
              </div>
            )}

            {/* Fallback Screen (Only visible if automatic redirect failed or encountered error) */}
            {!missingConfig && !loading && !account && !serverUser && (showFallbackButton || errorMessage) && (
              <div className="p-6 sm:p-10 rounded-3xl bg-white/95 border border-slate-200 shadow-xl text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                  מסך זיהוי עובד
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
                  מערכת שעות לחיוב לקוח &middot; TECH-SELECT LTD
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
            )}
          </div>
        </main>
      )}

      {/* Clean Light Footer (Only shown when not authenticated) */}
      {!account && !serverUser && (
        <footer className="relative z-10 py-4 text-center text-slate-400 text-xs border-t border-slate-200/60 bg-white/50">
          TECH-SELECT LTD &copy; {new Date().getFullYear()} &middot; מערכת פנימית מוגנת &middot; מסך זיהוי עובד
        </footer>
      )}
    </div>
  );
};
