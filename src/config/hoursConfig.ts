/**
 * Configuration for Internal Hours Tracking Tool ("תיעוד שעות")
 * 
 * Microsoft 365 / Azure Entra ID credentials can be configured via:
 * 1. Environment variables (.env or Cloudflare Pages env vars):
 *    - VITE_AZURE_TENANT_ID
 *    - VITE_AZURE_CLIENT_ID
 *    - VITE_AZURE_API_SCOPE (optional)
 *    - VITE_HOURS_SLUG (optional)
 * 2. Or directly configured via the internal identification portal screen
 */

// 1. Hidden Route Slug - A long random unguessable string
// Accessible only via: /t/{RANDOM_SLUG}
export const RANDOM_SLUG =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_HOURS_SLUG) ||
  "k8x9m2p4q8w1v5n3b6c0d8f2j4l6h7p9a2";

export const HIDDEN_ROUTE_PATH = `/t/${RANDOM_SLUG}`;

// Helper to get active Tenant ID (env var priority, fallback to local storage)
export const getActiveTenantId = (): string => {
  const envVal = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AZURE_TENANT_ID) || "";
  if (envVal && envVal.trim()) return envVal.trim();
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("TECHSELECT_AZURE_TENANT_ID");
    if (saved && saved.trim()) return saved.trim();
  }
  return "";
};

// Helper to get active Client ID (env var priority, fallback to local storage)
export const getActiveClientId = (): string => {
  const envVal = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AZURE_CLIENT_ID) || "";
  if (envVal && envVal.trim()) return envVal.trim();
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("TECHSELECT_AZURE_CLIENT_ID");
    if (saved && saved.trim()) return saved.trim();
  }
  return "";
};

export const saveAzureCredentials = (tenantId: string, clientId: string): void => {
  if (typeof window !== "undefined") {
    if (tenantId && tenantId.trim()) {
      localStorage.setItem("TECHSELECT_AZURE_TENANT_ID", tenantId.trim());
    }
    if (clientId && clientId.trim()) {
      localStorage.setItem("TECHSELECT_AZURE_CLIENT_ID", clientId.trim());
    }
  }
};

// Backward-compatible exports
export const AZURE_TENANT_ID = getActiveTenantId();
export const AZURE_CLIENT_ID = getActiveClientId();

// 3. API Scope for token acquisition
export const getActiveApiScope = (): string => {
  const customScope = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AZURE_API_SCOPE) || "";
  if (customScope) return customScope;
  const clientId = getActiveClientId();
  return clientId ? `api://${clientId}/access_as_user` : "User.Read";
};

export const API_SCOPE = getActiveApiScope();

// 4. Single-Tenant Authority URL
export const getAuthority = (tenantId = getActiveTenantId()): string => {
  const cleanTenant = (tenantId || "").trim();
  return cleanTenant ? `https://login.microsoftonline.com/${cleanTenant}` : "https://login.microsoftonline.com/common";
};

// 5. Dynamic Redirect URI - Full URL of the hidden route
export function getRedirectUri(): string {
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.origin}${HIDDEN_ROUTE_PATH}`;
  }
  return `https://www.tech-select.co.il${HIDDEN_ROUTE_PATH}`;
}
