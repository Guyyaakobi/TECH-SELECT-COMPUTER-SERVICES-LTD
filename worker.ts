// @ts-nocheck
/**
 * Cloudflare Worker Entry Point
 * Routing:
 * - /api/ai-discovery/diagnostic -> diagnostic test endpoint
 * - /api/ai-discovery/chat -> Gemini AI interactive consultation chat
 * - /api/ai-discovery/generate-tailored-report -> Full AI executive report generator
 * - /api/ai-discovery/request-access-code -> OTP generator & notification
 * - /api/ai-discovery/verify-access-code -> OTP / master-code validation
 * - /api/ai-discovery/send-report, /api/ai-discovery/send-email-report -> Report email dispatcher
 * - /api/simulator/log-activity -> Simulation activity logger
 * - /api/health -> Worker health check
 * - All other requests -> env.ASSETS.fetch(request) for static assets / SPA
 */

import * as diagnosticHandler from "./functions/api/ai-discovery/diagnostic.js";
import * as chatHandler from "./functions/api/ai-discovery/chat";
import * as reportHandler from "./functions/api/ai-discovery/generate-tailored-report";
import * as requestAccessHandler from "./functions/api/ai-discovery/request-access-code";
import * as verifyAccessHandler from "./functions/api/ai-discovery/verify-access-code";
import * as emailReportHandler from "./functions/api/ai-discovery/send-email-report";
import * as siteAiAskHandler from "./functions/api/site-ai/ask";
import * as createTicketHandler from "./functions/api/tickets/create";
import * as ticketLookupHandler from "./functions/api/tickets/lookup";
import * as mailHandler from "./functions/api/mail/send";
import * as sendOtpHandler from "./functions/api/auth/send-otp";
import * as verifyOtpHandler from "./functions/api/auth/verify-otp";
import * as contactHandler from "./functions/api/contact";

interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, ""); // Normalize trailing slash

    // Normalize and propagate GEMINI_API_KEY from all possible Cloudflare secret / env sources
    const resolvedApiKey =
      env.GEMINI_API_KEY ||
      env.GOOGLE_GENAI_API_KEY ||
      env.GEMINI_KEY ||
      env.GOOGLE_API_KEY ||
      (typeof process !== "undefined" && (process?.env?.GEMINI_API_KEY || process?.env?.GOOGLE_GENAI_API_KEY)) ||
      (typeof (globalThis as any).GEMINI_API_KEY === "string" ? (globalThis as any).GEMINI_API_KEY : "");

    if (resolvedApiKey) {
      env.GEMINI_API_KEY = resolvedApiKey;
      if (typeof process !== "undefined" && process.env) {
        process.env.GEMINI_API_KEY = resolvedApiKey;
      }
    }

    // Handle universal CORS preflight for all /api/ endpoints
    if (request.method === "OPTIONS" && (pathname.startsWith("/api/") || pathname === "/diagnostic")) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // Shared execution context for Pages Functions compatibility
    const context = {
      request,
      env,
      params: {},
      data: {},
      next: () => Promise.resolve(new Response(null, { status: 404 })),
      waitUntil: (promise: Promise<any>) => ctx?.waitUntil?.(promise)
    };

    // 1. Diagnostic endpoint
    if (pathname === "/api/ai-discovery/diagnostic" || pathname === "/diagnostic") {
      return diagnosticHandler.handleDiagnostic(request, env, ctx);
    }

    // 2. Interactive AI Consultation Chat
    if (pathname === "/api/ai-discovery/chat") {
      return chatHandler.handleChat(request, env, ctx);
    }

    // 3. Tailored AI Executive Report Generator
    if (pathname === "/api/ai-discovery/generate-tailored-report") {
      return reportHandler.handleGenerateReport(request, env, ctx);
    }

    // 4. Request Access Code
    if (pathname === "/api/ai-discovery/request-access-code") {
      return requestAccessHandler.handleRequestAccessCode(request, env, ctx);
    }

    // 5. Verify Access Code
    if (pathname === "/api/ai-discovery/verify-access-code") {
      return verifyAccessHandler.handleVerifyAccessCode(request, env, ctx);
    }

    // 6. Send Report Email
    if (pathname === "/api/ai-discovery/send-report" || pathname === "/api/ai-discovery/send-email-report") {
      return emailReportHandler.handleSendEmailReport(request, env, ctx);
    }

    // 6.1 Authentication OTP Gate (Send 4-digit code via Microsoft Graph API)
    if (pathname === "/api/auth/send-otp" || pathname === "/api/otp/send") {
      return sendOtpHandler.handleSendOtp(request, env, ctx);
    }

    // 6.2 Authentication OTP Gate (Verify 4-digit code & generate session token)
    if (pathname === "/api/auth/verify-otp" || pathname === "/api/otp/verify") {
      return verifyOtpHandler.handleVerifyOtp(request, env, ctx);
    }

    // 6.3 Contact Form Inquiry Submission
    if (pathname === "/api/contact") {
      return contactHandler.handleContactSubmission(request, env);
    }

    // 7. Site AI Knowledge Assistant ("What do we do?")
    if (pathname === "/api/site-ai/ask") {
      return siteAiAskHandler.handleAsk(request, env, ctx);
    }

    // 8. Service Ticket Creation via Atera API (Proxy)
    if (pathname === "/api/tickets/create" || pathname === "/api/tickets" || pathname === "/api/atera/ticket") {
      return createTicketHandler.handleCreateTicket(request, env, ctx);
    }

    // 8.1 Service Ticket Status & Lookup (Protected by 4-digit Email OTP)
    if (pathname === "/api/tickets/lookup" || pathname === "/api/atera/lookup") {
      return ticketLookupHandler.handleTicketLookup(request, env, ctx);
    }

    // 9. Send Email via Microsoft Graph API (support@tech-select.co.il)
    if (pathname === "/api/mail/send" || pathname === "/api/send-mail") {
      return mailHandler.handleSendMail(request, env, ctx);
    }

    // 8. Simulator Activity Logger
    if (pathname === "/api/simulator/log-activity") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 8. Health Check
    if (pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          runtime: "Cloudflare Worker fetch(request, env, ctx)",
          hasApiKey: Boolean(resolvedApiKey && resolvedApiKey.length > 5),
          timestamp: new Date().toISOString()
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    // Pass all non-API traffic directly to static assets (SPA fallback handled by Cloudflare)
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    // Fallback if ASSETS binding is somehow missing
    return new Response("Not Found", { status: 404 });
  }
};
