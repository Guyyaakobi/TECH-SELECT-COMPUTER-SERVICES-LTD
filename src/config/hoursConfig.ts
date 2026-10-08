/**
 * Configuration for Internal Hours Tracking Tool ("תיעוד שעות")
 * 
 * In accordance with OS security principles:
 * - Config is loaded at RUNTIME from the server (/api/hours/config).
 * - No secrets or client credentials exist in client builds.
 * - No user input, localStorage, or sessionStorage configuration.
 * - VITE_HOURS_SLUG is preserved exclusively for the hidden route path.
 */

// 1. Hidden Route Slug - Unguessable string
// Accessible only via: /t/{RANDOM_SLUG}
export const RANDOM_SLUG =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_HOURS_SLUG) ||
  "k8x9m2p4q8w1v5n3b6c0d8f2j4l6h7p9a2";

export const HIDDEN_ROUTE_PATH = `/t/${RANDOM_SLUG}`;

export interface AzureHoursConfig {
  tenantId: string;
  clientId: string;
  apiScope: string;
}

// Authority URL helper
export const getAuthority = (tenantId: string): string => {
  const cleanTenant = (tenantId || "").trim();
  return cleanTenant ? `https://login.microsoftonline.com/${cleanTenant}` : "https://login.microsoftonline.com/common";
};

// Dynamic Redirect URI - Full URL of the hidden route
export function getRedirectUri(): string {
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.origin}${HIDDEN_ROUTE_PATH}`;
  }
  return `https://www.tech-select.co.il${HIDDEN_ROUTE_PATH}`;
}

// Fetch runtime configuration from the server
export async function fetchHoursConfig(): Promise<AzureHoursConfig> {
  const response = await fetch("/api/hours/config", {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`טעינת הגדרות המערכת מהשרת נכשלה (קוד: ${response.status})`);
  }

  const data = await response.json();
  return {
    tenantId: (data?.tenantId || "").trim(),
    clientId: (data?.clientId || "").trim(),
    apiScope: (data?.apiScope || "").trim() || (data?.clientId ? `api://${data.clientId}/access_as_user` : "User.Read"),
  };
}
