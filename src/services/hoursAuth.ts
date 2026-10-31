import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  AccountInfo,
} from "@azure/msal-browser";
import {
  AzureHoursConfig,
  getAuthority,
  getRedirectUri,
} from "../config/hoursConfig";

let msalInstance: PublicClientApplication | null = null;
let currentConfig: AzureHoursConfig | null = null;
let cachedUserToken: { token: string; expiresAt: number } | null = null;

export function isMsalInitialized(): boolean {
  return msalInstance !== null;
}

// 7-day persistent window for tenant users so they don't get kicked out
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Helper to inspect whether a storage key or value belongs to MSAL / Microsoft 365 SSO / Hours Auth
 */
function isSsoOrHoursStorageEntry(key: string, value: string | null): boolean {
  const k = key.toLowerCase();
  if (
    k.startsWith("msal.") ||
    k.includes("msal") ||
    k.includes("login.windows.net") ||
    k.includes("login.microsoftonline.com") ||
    k.includes("microsoft") ||
    k.includes("idtoken") ||
    k.includes("accesstoken") ||
    k.includes("refreshtoken") ||
    k.includes("client.info") ||
    k.includes("authority") ||
    k === "hours_bearer_token" ||
    k === "hours_bearer_token_exp" ||
    k === "hours_persistent_auth_token_v3" ||
    k === "hours_persistent_token_exp_v3" ||
    k === "hours_token_saved_time" ||
    k === "hours_saved_server_user_v2"
  ) {
    return true;
  }

  // Also detect MSAL JSON cache objects stored under GUID/account keys in localStorage/sessionStorage
  if (value && value.startsWith("{")) {
    if (
      value.includes('"credentialType"') ||
      value.includes('"homeAccountId"') ||
      value.includes('"authorityType"') ||
      value.includes('"clientInfo"') ||
      (value.includes('"secret"') && value.includes('"realm"'))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Completely purges all tokens, MSAL cache entries, persistent SSO data, and cookies from the browser
 */
export function purgeAllMsalAndHoursAuthStorage(pca?: PublicClientApplication): void {
  cachedUserToken = null;

  if (typeof window === "undefined") return;

  // 1. Clear active account in MSAL instance
  try {
    const instance = pca || msalInstance;
    if (instance) {
      instance.setActiveAccount(null);
      if (typeof (instance as any).clearCache === "function") {
        (instance as any).clearCache().catch(() => {});
      }
    }
  } catch {}

  // 2. Purge all matching keys in localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (isSsoOrHoursStorageEntry(key, val)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {}

  // 3. Purge all matching keys in sessionStorage
  try {
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      // Preserve explicit logout marker so the page knows not to auto-login immediately
      if (key === "hours_logged_out_explicitly") continue;
      const val = sessionStorage.getItem(key);
      if (isSsoOrHoursStorageEntry(key, val)) {
        sessionKeysToRemove.push(key);
      }
    }
    for (const key of sessionKeysToRemove) {
      sessionStorage.removeItem(key);
    }
  } catch {}

  // 4. Clear any accessible cookies related to MSAL / SSO / Hours auth
  try {
    if (document.cookie) {
      const cookies = document.cookie.split(";");
      const hostname = window.location.hostname;
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = (eqPos > -1 ? cookie.slice(0, eqPos) : cookie).trim();
        if (!name) continue;
        const lowerName = name.toLowerCase();
        if (
          lowerName.includes("msal") ||
          lowerName.includes("auth") ||
          lowerName.includes("token") ||
          lowerName.includes("sso") ||
          lowerName.includes("hours") ||
          lowerName.includes("aad")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname}`;
        }
      }
    }
  } catch {}

  // 5. Clear any MSAL IndexedDB databases if created by the browser
  try {
    if (window.indexedDB && typeof window.indexedDB.databases === "function") {
      window.indexedDB
        .databases()
        .then((dbs) => {
          dbs.forEach((db) => {
            if (db.name && (db.name.toLowerCase().includes("msal") || db.name.toLowerCase().includes("auth"))) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        })
        .catch(() => {});
    }
  } catch {}
}

export function clearCachedApiToken(): void {
  cachedUserToken = null;
  try {
    sessionStorage.removeItem("hours_bearer_token");
    sessionStorage.removeItem("hours_bearer_token_exp");
    localStorage.removeItem("hours_bearer_token");
    localStorage.removeItem("hours_bearer_token_exp");
    localStorage.removeItem("hours_persistent_auth_token_v3");
    localStorage.removeItem("hours_persistent_token_exp_v3");
    localStorage.removeItem("hours_token_saved_time");
    localStorage.removeItem("hours_saved_server_user_v2");
  } catch {}
}

export function setCachedApiToken(token: string, expiresInSec = 3600): void {
  if (!token) return;
  // Calculate standard expiration (at least 300s, default 1 hour)
  const expiresAt = Date.now() + Math.max(300, expiresInSec - 120) * 1000;
  // Also calculate 7-day persistent expiration
  const persistentExp = Date.now() + SEVEN_DAYS_MS;

  cachedUserToken = {
    token,
    expiresAt,
  };

  try {
    // Clear any previous explicit logout flags once a fresh token is set
    sessionStorage.removeItem("hours_logged_out_explicitly");
    localStorage.removeItem("hours_logged_out_explicitly");

    // 1. Session Storage
    sessionStorage.setItem("hours_bearer_token", token);
    sessionStorage.setItem("hours_bearer_token_exp", String(expiresAt));

    // 2. Persistent Local Storage (keeps user connected for days until explicit logout)
    localStorage.setItem("hours_bearer_token", token);
    localStorage.setItem("hours_bearer_token_exp", String(expiresAt));
    localStorage.setItem("hours_persistent_auth_token_v3", token);
    localStorage.setItem("hours_persistent_token_exp_v3", String(persistentExp));
    localStorage.setItem("hours_token_saved_time", String(Date.now()));
  } catch {}
}

/**
 * Decodes a JWT payload and checks whether its `exp` claim is expired (or expiring within minRemainingSec).
 * Returns false if the string is not a standard 3-part JWT with an `exp` claim.
 */
export function isJwtTokenExpired(token: string | null | undefined, minRemainingSec = 120): boolean {
  if (!token || typeof token !== "string") return true;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp === "number") {
      const expiresAtMs = payload.exp * 1000;
      return expiresAtMs - Date.now() <= minRemainingSec * 1000;
    }
  } catch {
    // If decoding fails, do not treat as expired here
  }
  return false;
}

export function getCachedApiToken(minRemainingSec = 120): string | null {
  const minMs = minRemainingSec * 1000;

  try {
    // If user explicitly logged out, never return a cached token
    if (
      typeof window !== "undefined" &&
      (sessionStorage.getItem("hours_logged_out_explicitly") === "true" ||
        Boolean(localStorage.getItem("hours_logged_out_explicitly")))
    ) {
      cachedUserToken = null;
      return null;
    }
  } catch {}

  // 1. In-memory valid token
  if (
    cachedUserToken &&
    cachedUserToken.expiresAt - Date.now() > minMs &&
    !isJwtTokenExpired(cachedUserToken.token, minRemainingSec)
  ) {
    return cachedUserToken.token;
  }

  try {
    // 2. Check localStorage standard cache
    const stored = localStorage.getItem("hours_bearer_token") || sessionStorage.getItem("hours_bearer_token");
    const exp =
      Number(localStorage.getItem("hours_bearer_token_exp") || sessionStorage.getItem("hours_bearer_token_exp")) || 0;
    if (stored && exp - Date.now() > minMs && !isJwtTokenExpired(stored, minRemainingSec)) {
      cachedUserToken = { token: stored, expiresAt: exp };
      return stored;
    }

    // 3. Check persistent token cache — only return if the underlying JWT itself has not expired!
    const persistent = localStorage.getItem("hours_persistent_auth_token_v3");
    const persistentExp = Number(localStorage.getItem("hours_persistent_token_exp_v3")) || 0;
    if (persistent && persistentExp > Date.now() && !isJwtTokenExpired(persistent, minRemainingSec)) {
      cachedUserToken = { token: persistent, expiresAt: persistentExp };
      return persistent;
    }
  } catch {}

  return null;
}

export function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    throw new Error("מערכת האימות טרם אותחלה. יש להמתין לקבלת הגדרות שרת.");
  }
  return msalInstance;
}

/**
 * Initializes the MSAL singleton instance with runtime server configuration
 */
export async function initMsal(config: AzureHoursConfig): Promise<PublicClientApplication> {
  if (
    msalInstance &&
    currentConfig?.clientId === config.clientId &&
    currentConfig?.tenantId === config.tenantId
  ) {
    return msalInstance;
  }

  currentConfig = config;

  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId || "00000000-0000-0000-0000-000000000000",
      authority: getAuthority(config.tenantId),
      redirectUri: typeof window !== "undefined" ? getRedirectUri() : "",
      postLogoutRedirectUri: typeof window !== "undefined" ? getRedirectUri() : "",
    },
    cache: {
      cacheLocation: "localStorage",
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        loggerCallback: (level, message, containsPii) => {
          if (!containsPii && level === LogLevel.Error) {
            console.error("[MSAL]", message);
          }
        },
      },
    },
  };

  const instance = new PublicClientApplication(msalConfig);
  await instance.initialize();
  msalInstance = instance;
  return instance;
}

/**
 * Helper to acquire API Token:
 * Checks memory & localStorage persistent cache first.
 * Then attempts acquireTokenSilent with fallback to User.Read, MSAL localStorage cache,
 * and persistent token if valid.
 */
function findMsalLocalStorageToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (
      sessionStorage.getItem("hours_logged_out_explicitly") === "true" ||
      localStorage.getItem("hours_logged_out_explicitly")
    ) {
      return null;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      // Match MSAL ID token or Access token entries
      if (key.includes("idtoken") || key.includes("accesstoken")) {
        const itemStr = localStorage.getItem(key);
        if (itemStr && itemStr.startsWith("{") && itemStr.includes("secret")) {
          const parsed = JSON.parse(itemStr);
          const secret = parsed.secret || parsed.idToken || parsed.accessToken;
          const exp = Number(parsed.expiresOn || parsed.extendedExpiresOn || 0) * 1000;
          if (secret && (!exp || exp > Date.now() + 60000) && !isJwtTokenExpired(secret, 60)) {
            return secret;
          }
        }
      }
    }
  } catch {}
  return null;
}

export async function getApiToken(
  pca?: PublicClientApplication,
  customScope?: string,
  forceRefresh = false
): Promise<string> {
  if (
    typeof window !== "undefined" &&
    (sessionStorage.getItem("hours_logged_out_explicitly") === "true" ||
      Boolean(localStorage.getItem("hours_logged_out_explicitly")))
  ) {
    throw new Error("המשתמש התנתק מהמערכת. יש להתחבר מחדש.");
  }

  // 1. Return cached valid token if available and not forcing refresh
  if (!forceRefresh) {
    const cached = getCachedApiToken(180);
    if (cached) {
      return cached;
    }
  }

  const instance = pca || (msalInstance ? getMsalInstance() : null);
  if (!instance) {
    const lsToken =
      findMsalLocalStorageToken() ||
      localStorage.getItem("hours_persistent_auth_token_v3") ||
      sessionStorage.getItem("hours_bearer_token");
    if (lsToken && !isJwtTokenExpired(lsToken, 30)) {
      setCachedApiToken(lsToken, 3600);
      return lsToken;
    }
    throw new Error("מערכת האימות טרם אותחלה. יש לבצע התחברות.");
  }

  const accounts = instance.getAllAccounts();
  const activeAccount = instance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

  if (!activeAccount) {
    const lsToken =
      findMsalLocalStorageToken() ||
      localStorage.getItem("hours_persistent_auth_token_v3") ||
      sessionStorage.getItem("hours_bearer_token");
    if (lsToken && !isJwtTokenExpired(lsToken, 30)) {
      setCachedApiToken(lsToken, 3600);
      return lsToken;
    }
    throw new Error("לא נמצא חשבון פעיל מחובר. יש לבצע התחברות למערכת.");
  }

  if (!instance.getActiveAccount()) {
    instance.setActiveAccount(activeAccount);
  }

  const targetScope = customScope || currentConfig?.apiScope || "User.Read";

  // Try silent token acquisition
  try {
    const tokenRequest = {
      scopes: [targetScope],
      account: activeAccount,
      redirectUri: getRedirectUri(),
      forceRefresh: Boolean(forceRefresh),
    };

    const response = await Promise.race([
      instance.acquireTokenSilent(tokenRequest),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout during silent token refresh")), 6000)
      ),
    ]);

    const token = response?.idToken || response?.accessToken;
    if (token) {
      setCachedApiToken(token, 3600);
      return token;
    }
  } catch (err: any) {
    console.warn("[getApiToken] Silent token acquisition warning:", err?.message || err);
    // If custom scope failed, fallback to User.Read with timeout
    if (targetScope !== "User.Read") {
      try {
        const fallbackRes = await Promise.race([
          instance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: activeAccount,
            redirectUri: getRedirectUri(),
            forceRefresh: Boolean(forceRefresh),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout during fallback silent token refresh")), 5000)
          ),
        ]);
        const fallbackToken = fallbackRes?.idToken || fallbackRes?.accessToken;
        if (fallbackToken) {
          setCachedApiToken(fallbackToken, 3600);
          return fallbackToken;
        }
      } catch (fallbackErr) {
        console.warn("[getApiToken] Fallback silent token acquisition failed:", fallbackErr);
      }
    }
  }

  // Fallback 1: activeAccount idToken if available and not expired
  const accountIdToken = (activeAccount as any)?.idToken;
  if (accountIdToken && !isJwtTokenExpired(accountIdToken, 30)) {
    setCachedApiToken(accountIdToken, 3600);
    return accountIdToken;
  }

  // Fallback 2: localStorage MSAL cache if not expired
  const lsToken = findMsalLocalStorageToken();
  if (lsToken && !isJwtTokenExpired(lsToken, 30)) {
    setCachedApiToken(lsToken, 3600);
    return lsToken;
  }

  // Fallback 3: localStorage persistent token if not expired
  const persistentToken =
    localStorage.getItem("hours_persistent_auth_token_v3") || localStorage.getItem("hours_bearer_token");
  if (persistentToken && !isJwtTokenExpired(persistentToken, 30)) {
    setCachedApiToken(persistentToken, 3600);
    return persistentToken;
  }

  // If all tokens are expired, clear them so the user is not stuck with a stale token
  clearCachedApiToken();
  throw new Error("פג תוקף החיבור ל-Microsoft 365. אנא התחבר מחדש.");
}

/**
 * Redirect to Microsoft 365 sign-in page
 */
export async function loginWithMicrosoft(
  pca?: PublicClientApplication,
  customScope?: string
): Promise<void> {
  try {
    sessionStorage.removeItem("hours_logged_out_explicitly");
    localStorage.removeItem("hours_logged_out_explicitly");
  } catch {}

  const instance = pca || getMsalInstance();
  const defaultScopes = ["openid", "profile", "email", "User.Read"];
  const scopes = customScope ? [customScope] : defaultScopes;
  const loginRequest = {
    scopes,
    redirectUri: getRedirectUri(),
    prompt: "select_account",
  };
  await instance.loginRedirect(loginRequest);
}

/**
 * Sign out completely and instantaneously at any stage:
 * 1. Marks explicit logout in both sessionStorage and localStorage so the app never auto-logs in
 * 2. Purges all tokens, MSAL storage, persistent tokens, cookies, and IndexedDB in browser
 * 3. Returns immediately so the UI transitions straight to the clean Employee Login screen
 *    (where clicking Login prompts "select_account" to choose any Microsoft 365 account).
 */
export async function logoutFromMicrosoft(pca?: PublicClientApplication): Promise<void> {
  const instance = pca || msalInstance;

  // 1. Purge all custom & MSAL tokens/cache from localStorage, sessionStorage, cookies, IndexedDB
  clearCachedApiToken();
  purgeAllMsalAndHoursAuthStorage(instance || undefined);

  // 2. Mark explicit logout AFTER purging so the marker is guaranteed to remain set
  try {
    sessionStorage.setItem("hours_logged_out_explicitly", "true");
    localStorage.setItem("hours_logged_out_explicitly", String(Date.now()));
  } catch {}

  // 3. Also clear URL hash/search params if any MSAL code/state fragments are present
  try {
    if (typeof window !== "undefined" && (window.location.hash || window.location.search)) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch {}
}
