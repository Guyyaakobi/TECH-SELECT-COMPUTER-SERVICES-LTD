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

export function setCachedApiToken(token: string, expiresInSec = 3600): void {
  if (!token) return;
  cachedUserToken = {
    token,
    expiresAt: Date.now() + Math.max(300, expiresInSec - 120) * 1000,
  };
  try {
    sessionStorage.setItem("hours_bearer_token", token);
    sessionStorage.setItem("hours_bearer_token_exp", String(cachedUserToken.expiresAt));
  } catch {}
}

export function getCachedApiToken(): string | null {
  if (cachedUserToken && cachedUserToken.expiresAt > Date.now()) {
    return cachedUserToken.token;
  }
  try {
    const stored = sessionStorage.getItem("hours_bearer_token");
    const exp = Number(sessionStorage.getItem("hours_bearer_token_exp")) || 0;
    if (stored && exp > Date.now()) {
      cachedUserToken = { token: stored, expiresAt: exp };
      return stored;
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
 * Checks memory & sessionStorage cache first.
 * Then attempts acquireTokenSilent with safe timeout.
 */
export async function getApiToken(
  pca?: PublicClientApplication,
  customScope?: string
): Promise<string> {
  // 1. Return cached valid token if available
  const cached = getCachedApiToken();
  if (cached) {
    return cached;
  }

  const instance = pca || (msalInstance ? getMsalInstance() : null);
  if (!instance) {
    const stored = sessionStorage.getItem("hours_bearer_token");
    if (stored) return stored;
    throw new Error("מערכת האימות טרם אותחלה. יש לבצע התחברות.");
  }

  const accounts = instance.getAllAccounts();
  const activeAccount = instance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

  if (!activeAccount) {
    const stored = sessionStorage.getItem("hours_bearer_token");
    if (stored) return stored;
    throw new Error("לא נמצא חשבון פעיל מחובר. יש לבצע התחברות למערכת.");
  }

  if (!instance.getActiveAccount()) {
    instance.setActiveAccount(activeAccount);
  }

  const scope = customScope || currentConfig?.apiScope || "User.Read";
  const tokenRequest = {
    scopes: [scope],
    account: activeAccount,
    redirectUri: getRedirectUri(),
  };

  try {
    const response = await Promise.race([
      instance.acquireTokenSilent(tokenRequest),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout during silent token refresh")), 7000)
      ),
    ]);
    if (response?.accessToken) {
      setCachedApiToken(response.accessToken, 3600);
      return response.accessToken;
    }
    throw new Error("לא התקבל טוקן גישה מ-Microsoft Entra ID");
  } catch (err: any) {
    console.warn("[getApiToken] Silent token acquisition failed:", err);
    const stored = sessionStorage.getItem("hours_bearer_token");
    if (stored) {
      return stored;
    }
    throw new Error("פג תוקף החיבור ל-Microsoft 365. אנא רענן את העמוד והתחבר שוב.");
  }
}

/**
 * Redirect to Microsoft 365 sign-in page
 */
export async function loginWithMicrosoft(
  pca?: PublicClientApplication,
  customScope?: string
): Promise<void> {
  const instance = pca || getMsalInstance();
  const scope = customScope || currentConfig?.apiScope || "User.Read";
  const loginRequest = {
    scopes: [scope],
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
