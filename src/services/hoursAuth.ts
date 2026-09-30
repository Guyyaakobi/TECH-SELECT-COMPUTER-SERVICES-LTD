import {
  PublicClientApplication,
  Configuration,
  LogLevel,
  InteractionRequiredAuthError,
  AccountInfo,
} from "@azure/msal-browser";
import {
  AZURE_TENANT_ID,
  AZURE_CLIENT_ID,
  API_SCOPE,
  getAuthority,
  getRedirectUri,
} from "../config/hoursConfig";

// Configuration for MSAL Single-Tenant Microsoft 365
const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID || "00000000-0000-0000-0000-000000000000",
    authority: getAuthority(AZURE_TENANT_ID),
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

let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<PublicClientApplication> | null = null;

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
    const instance = new PublicClientApplication(msalConfig);
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

  const tokenRequest = {
    scopes: [API_SCOPE],
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
 * Redirect immediately to Microsoft 365 sign-in page
 */
export async function loginWithMicrosoft(pca?: PublicClientApplication): Promise<void> {
  const instance = pca || (await getMsalInstance());
  const loginRequest = {
    scopes: [API_SCOPE],
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
