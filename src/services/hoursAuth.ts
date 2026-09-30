import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  InteractionRequiredAuthError,
  AccountInfo,
} from "@azure/msal-browser";
import {
  getActiveTenantId,
  getActiveClientId,
  getActiveApiScope,
  getAuthority,
  getRedirectUri,
} from "../config/hoursConfig";

export function createMsalConfig(): Configuration {
  const tenantId = getActiveTenantId();
  const clientId = getActiveClientId() || "00000000-0000-0000-0000-000000000000";

  return {
    auth: {
      clientId,
      authority: getAuthority(tenantId),
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
}

let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<PublicClientApplication> | null = null;

export function resetMsalInstance(): void {
  msalInstance = null;
  msalInitPromise = null;
}

/**
 * Returns the initialized MSAL singleton instance
 */
export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (msalInstance) {
    return msalInstance;
  }

  if (msalInitPromise) {
    return msalInitPromise;
  }

  msalInitPromise = (async () => {
    const config = createMsalConfig();
    const instance = new PublicClientApplication(config);
    await instance.initialize();
    msalInstance = instance;
    return instance;
  })();

  return msalInitPromise;
}

/**
 * Helper to acquire API Token:
 * First attempts acquireTokenSilent, falling back to acquireTokenRedirect as required.
 */
export async function getApiToken(pca?: PublicClientApplication): Promise<string> {
  const instance = pca || (await getMsalInstance());
  const accounts = instance.getAllAccounts();
  const activeAccount = instance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

  if (!activeAccount) {
    throw new Error("לא נמצא חשבון פעיל מחובר. יש לבצע התחברות למערכת.");
  }

  // Set active account if not set
  if (!instance.getActiveAccount()) {
    instance.setActiveAccount(activeAccount);
  }

  const scope = getActiveApiScope();
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
    if (err instanceof InteractionRequiredAuthError || err?.name === "InteractionRequiredAuthError" || err?.errorCode === "interaction_required") {
      await instance.acquireTokenRedirect(tokenRequest);
      throw err;
    }
    // Attempt redirect anyway if silent fails
    await instance.acquireTokenRedirect(tokenRequest);
    throw err;
  }
}

/**
 * Redirect to Microsoft 365 sign-in page
 */
export async function loginWithMicrosoft(pca?: PublicClientApplication): Promise<void> {
  const instance = pca || (await getMsalInstance());
  const scope = getActiveApiScope();
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
  const instance = pca || (await getMsalInstance());
  const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
  await instance.logoutRedirect({
    account,
    postLogoutRedirectUri: getRedirectUri(),
  });
}
