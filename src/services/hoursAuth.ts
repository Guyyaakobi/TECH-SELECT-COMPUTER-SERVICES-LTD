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

export function isMsalInitialized(): boolean {
  return msalInstance !== null;
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
 * First attempts acquireTokenSilent, falling back to acquireTokenRedirect as required.
 */
export async function getApiToken(
  pca?: PublicClientApplication,
  customScope?: string
): Promise<string> {
  const instance = pca || getMsalInstance();
  const accounts = instance.getAllAccounts();
  const activeAccount = instance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

  if (!activeAccount) {
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
    const response = await instance.acquireTokenSilent(tokenRequest);
    return response.accessToken;
  } catch (err: any) {
    console.warn("[getApiToken] Silent token acquisition failed, attempting acquireTokenRedirect fallback:", err);
    if (
      err instanceof InteractionRequiredAuthError ||
      err?.name === "InteractionRequiredAuthError" ||
      err?.errorCode === "interaction_required"
    ) {
      await instance.acquireTokenRedirect(tokenRequest);
      throw err;
    }
    await instance.acquireTokenRedirect(tokenRequest);
    throw err;
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
