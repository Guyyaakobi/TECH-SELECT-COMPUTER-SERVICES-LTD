import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  InteractionRequiredAuthError,
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

export function clearCachedApiToken(): void {
  cachedUserToken = null;
  try {
    sessionStorage.removeItem("hours_bearer_token");
    sessionStorage.removeItem("hours_bearer_token_exp");
    localStorage.removeItem("hours_bearer_token");
    localStorage.removeItem("hours_bearer_token_exp");
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
    // 1. Session Storage
    sessionStorage.setItem("hours_bearer_token", token);
    sessionStorage.setItem("hours_bearer_token_exp", String(expiresAt));

    // 2. Persistent Local Storage (keeps user connected for days)
    localStorage.setItem("hours_bearer_token", token);
    localStorage.setItem("hours_bearer_token_exp", String(expiresAt));
    localStorage.setItem("hours_persistent_auth_token_v3", token);
    localStorage.setItem("hours_persistent_token_exp_v3", String(persistentExp));
    localStorage.setItem("hours_token_saved_time", String(Date.now()));
  } catch {}
}

export function getCachedApiToken(minRemainingSec = 120): string | null {
  const minMs = minRemainingSec * 1000;

  // 1. In-memory valid token
  if (cachedUserToken && cachedUserToken.expiresAt - Date.now() > minMs) {
    return cachedUserToken.token;
  }

  try {
    // 2. Check localStorage standard cache
    const stored = localStorage.getItem("hours_bearer_token") || sessionStorage.getItem("hours_bearer_token");
    const exp = Number(localStorage.getItem("hours_bearer_token_exp") || sessionStorage.getItem("hours_bearer_token_exp")) || 0;
    if (stored && exp - Date.now() > minMs) {
      cachedUserToken = { token: stored, expiresAt: exp };
      return stored;
    }

    // 3. Check 7-day persistent token cache
    const persistent = localStorage.getItem("hours_persistent_auth_token_v3");
    const persistentExp = Number(localStorage.getItem("hours_persistent_token_exp_v3")) || 0;
    if (persistent && persistentExp > Date.now()) {
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
      storeAuthStateInCookie: true,
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
 * and persistent 7-day token.
 */
function findMsalLocalStorageToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      // Match MSAL ID token or Access token entries
      if (key.includes("idtoken") || key.includes("accesstoken")) {
        const itemStr = localStorage.getItem(key);
        if (itemStr && itemStr.startsWith("{") && itemStr.includes("secret")) {
          const parsed = JSON.parse(itemStr);
          const secret = parsed.secret || parsed.idToken || parsed.accessToken;
          const exp = Number(parsed.expiresOn || parsed.extendedExpiresOn || 0) * 1000;
          if (secret && (!exp || exp + SEVEN_DAYS_MS > Date.now())) {
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
  // 1. Return cached valid token if available and not forcing refresh
  if (!forceRefresh) {
    const cached = getCachedApiToken(180);
    if (cached) {
      return cached;
    }
  }

  const instance = pca || (msalInstance ? getMsalInstance() : null);
  if (!instance) {
    const lsToken = findMsalLocalStorageToken() || localStorage.getItem("hours_persistent_auth_token_v3") || sessionStorage.getItem("hours_bearer_token");
    if (lsToken) {
      setCachedApiToken(lsToken, 3600);
      return lsToken;
    }
    throw new Error("מערכת האימות טרם אותחלה. יש לבצע התחברות.");
  }

  const accounts = instance.getAllAccounts();
  const activeAccount = instance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

  if (!activeAccount) {
    const lsToken = findMsalLocalStorageToken() || localStorage.getItem("hours_persistent_auth_token_v3") || sessionStorage.getItem("hours_bearer_token");
    if (lsToken) {
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
        setTimeout(() => reject(new Error("Timeout during silent token refresh")), 8000)
      ),
    ]);

    const token = response?.idToken || response?.accessToken;
    if (token) {
      setCachedApiToken(token, 3600);
      return token;
    }
  } catch (err: any) {
    console.warn("[getApiToken] Silent token acquisition warning:", err?.message || err);
    // If custom scope failed, fallback to User.Read
    if (targetScope !== "User.Read") {
      try {
        const fallbackRes = await instance.acquireTokenSilent({
          scopes: ["User.Read"],
          account: activeAccount,
          redirectUri: getRedirectUri(),
          forceRefresh: Boolean(forceRefresh),
        });
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

  // Fallback 1: activeAccount idToken if available
  const accountIdToken = (activeAccount as any)?.idToken;
  if (accountIdToken) {
    setCachedApiToken(accountIdToken, 3600);
    return accountIdToken;
  }

  // Fallback 2: localStorage persistent token
  const persistentToken = localStorage.getItem("hours_persistent_auth_token_v3") || localStorage.getItem("hours_bearer_token");
  if (persistentToken) {
    setCachedApiToken(persistentToken, 3600);
    return persistentToken;
  }

  // Fallback 3: localStorage MSAL cache
  const lsToken = findMsalLocalStorageToken();
  if (lsToken) {
    setCachedApiToken(lsToken, 3600);
    return lsToken;
  }

  // Fallback 4: sessionStorage
  const stored = sessionStorage.getItem("hours_bearer_token");
  if (stored) {
    return stored;
  }

  throw new Error("פג תוקף החיבור ל-Microsoft 365. אנא רענן את העמוד והתחבר שוב.");
}

/**
 * Redirect to Microsoft 365 sign-in page
 */
export async function loginWithMicrosoft(
  pca?: PublicClientApplication,
  customScope?: string
): Promise<void> {
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
 * Sign out and return to the hidden route
 */
export async function logoutFromMicrosoft(pca?: PublicClientApplication): Promise<void> {
  const instance = pca || getMsalInstance();
  const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
  await instance.logoutRedirect({
    account,
    postLogoutRedirectUri: getRedirectUri(),
  });
}
