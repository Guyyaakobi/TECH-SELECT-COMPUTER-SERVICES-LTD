/**
 * Configuration for Internal Hours Tracking Tool ("תיעוד שעות")
 * 
 * Fill in your Microsoft 365 / Azure Entra ID credentials below or via environment variables.
 * Note: Never store client secrets here. Secrets belong on the server only.
 */

// 1. Hidden Route Slug - A long random unguessable string
// Accessible only via: /t/{RANDOM_SLUG}
export const RANDOM_SLUG =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_HOURS_SLUG) ||
  "k8x9m2p4q8w1v5n3b6c0d8f2j4l6h7p9a2";

export const HIDDEN_ROUTE_PATH = `/t/${RANDOM_SLUG}`;

// 2. Azure Entra ID / Microsoft 365 Single-Tenant Configuration
// Fill in your Azure Tenant ID and App Registration Client ID below,
// or specify VITE_AZURE_TENANT_ID and VITE_AZURE_CLIENT_ID in your .env file.
export const AZURE_TENANT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AZURE_TENANT_ID) ||
  "";

export const AZURE_CLIENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AZURE_CLIENT_ID) ||
  "";

// 3. API Scope for token acquisition (e.g. api://{CLIENT_ID}/access_as_user)
export const API_SCOPE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AZURE_API_SCOPE) ||
  (AZURE_CLIENT_ID ? `api://${AZURE_CLIENT_ID}/access_as_user` : "User.Read");

// 4. Single-Tenant Authority URL
export const getAuthority = (tenantId = AZURE_TENANT_ID): string => {
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
