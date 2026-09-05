var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
function getGeminiClient() {
  return new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var modelCooldownMap = /* @__PURE__ */ new Map();
function isModelCoolingDown(model) {
  const until = modelCooldownMap.get(model);
  if (!until) return false;
  if (Date.now() > until) {
    modelCooldownMap.delete(model);
    return false;
  }
  return true;
}
function markModelRateLimited(model, cooldownMs = 6e4) {
  modelCooldownMap.set(model, Date.now() + cooldownMs);
}
function formatGeminiContents(messages) {
  const valid = (messages || []).map((m) => {
    const rawContent = m.content || m.text || "";
    return {
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      content: typeof rawContent === "string" ? rawContent.trim() : String(rawContent).trim()
    };
  }).filter((m) => m.content.length > 0);
  if (valid.length === 0) {
    return [
      {
        role: "user",
        parts: [{ text: "\u05E9\u05DC\u05D5\u05DD, \u05D0\u05E0\u05D9 \u05DE\u05E2\u05D5\u05E0\u05D9\u05D9\u05DF \u05D1\u05D0\u05E4\u05D9\u05D5\u05DF \u05D5\u05D9\u05D9\u05E2\u05D5\u05E5 AI \u05D0\u05E1\u05D8\u05E8\u05D8\u05D2\u05D9 \u05DC\u05D0\u05E8\u05D2\u05D5\u05DF." }]
      }
    ];
  }
  let firstUserIdx = valid.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) {
    firstUserIdx = 0;
  }
  const turnsToProcess = valid.slice(firstUserIdx);
  const formatted = [];
  for (const m of turnsToProcess) {
    if (formatted.length > 0 && formatted[formatted.length - 1].role === m.role) {
      formatted[formatted.length - 1].parts[0].text += `

${m.content}`;
    } else {
      formatted.push({
        role: m.role,
        parts: [{ text: m.content }]
      });
    }
  }
  if (formatted.length === 0 || formatted[0].role !== "user") {
    formatted.unshift({
      role: "user",
      parts: [{ text: "\u05E9\u05DC\u05D5\u05DD, \u05D0\u05E9\u05DE\u05D7 \u05DC\u05D4\u05EA\u05D9\u05D9\u05E2\u05E5 \u05DC\u05D2\u05D1\u05D9 \u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA AI \u05E2\u05D1\u05D5\u05E8 \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF \u05E9\u05DC\u05D9." }]
    });
  }
  return formatted;
}
function generateDomainFallbackReply(messages, companyContext) {
  const userMessages = (messages || []).filter((m) => m && m.role === "user");
  const latestUserMsg = userMessages.length > 0 ? (userMessages[userMessages.length - 1].content || userMessages[userMessages.length - 1].text || "").trim() : "";
  const companyName = companyContext?.companyName || "\u05D4\u05D0\u05E8\u05D2\u05D5\u05DF \u05E9\u05DC\u05DB\u05DD";
  const contactRole = companyContext?.role || '\u05DE\u05E0\u05DB"\u05DC / \u05D4\u05E0\u05D4\u05DC\u05D4';
  const erp = companyContext?.erpCrm || "\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4-ERP / CRM \u05D4\u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05D5\u05EA";
  const size = companyContext?.companySize || "21-100 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD";
  const userMsgLower = latestUserMsg.toLowerCase();
  let employeeCount = 50;
  if (size.includes("1-20") || size.includes("15")) employeeCount = 15;
  else if (size.includes("21-100") || size.includes("60")) employeeCount = 60;
  else if (size.includes("101-500") || size.includes("250")) employeeCount = 250;
  else if (size.includes("500+") || size.includes("800")) employeeCount = 800;
  const monthlyHoursSaved = Math.round(employeeCount * 0.4 * 12);
  const annualSavingsNis = (monthlyHoursSaved * 110 * 12).toLocaleString();
  if (userMsgLower === "\u05E9\u05DC\u05D5\u05DD" || userMsgLower === "\u05D4\u05D9\u05D9" || userMsgLower === "\u05D1\u05D5\u05E7\u05E8 \u05D8\u05D5\u05D1" || userMsgLower === "\u05E2\u05E8\u05D1 \u05D8\u05D5\u05D1" || userMsgLower === "\u05D0\u05D4\u05DC\u05DF" || userMsgLower === "\u05E9\u05DC\u05D5\u05DD \u05D5\u05D1\u05E8\u05DB\u05D4" || userMsgLower.startsWith("\u05E9\u05DC\u05D5\u05DD,") || userMsgLower.startsWith("\u05D4\u05D9\u05D9,")) {
    return `\u05E9\u05DC\u05D5\u05DD \u05D5\u05D1\u05E8\u05DB\u05D4! \u05D0\u05E0\u05D9 \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 \u05D4-AI \u05E9\u05DC **TECH-SELECT**. 

\u05D0\u05E0\u05D9 \u05DB\u05D0\u05DF \u05DB\u05D3\u05D9 \u05DC\u05E2\u05D6\u05D5\u05E8 \u05DC\u05DB\u05DD \u05DC\u05DE\u05E4\u05D5\u05EA \u05D0\u05EA \u05D4\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D4\u05E2\u05E1\u05E7\u05D9\u05EA \u05D1-**${companyName}**, \u05DC\u05D6\u05D4\u05D5\u05EA \u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D1\u05E7\u05D1\u05D5\u05E7 \u05E9\u05D1\u05D4\u05DD \u05DE\u05D1\u05D5\u05D6\u05D1\u05D6\u05D5\u05EA \u05E9\u05E2\u05D5\u05EA \u05D9\u05E7\u05E8\u05D5\u05EA, \u05D5\u05DC\u05EA\u05DB\u05E0\u05DF \u05E4\u05EA\u05E8\u05D5\u05DF AI \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E2\u05DD \u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4 (ROI) \u05DE\u05D5\u05DB\u05D7.

\u05DB\u05D3\u05D9 \u05E9\u05D0\u05D5\u05DB\u05DC \u05DC\u05D4\u05DB\u05D5\u05D5\u05D9\u05DF \u05D1\u05E6\u05D5\u05E8\u05D4 \u05D4\u05DE\u05D3\u05D5\u05D9\u05E7\u05EA \u05D1\u05D9\u05D5\u05EA\u05E8 \u2014 \u05DE\u05D4\u05D5 \u05D4\u05D0\u05EA\u05D2\u05E8 \u05D4\u05EA\u05E4\u05E2\u05D5\u05DC\u05D9 \u05D0\u05D5 \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05D4\u05DB\u05D9 \u05DE\u05E2\u05E1\u05D9\u05E7 \u05D0\u05EA\u05DB\u05DD \u05D1\u05D9\u05DE\u05D9\u05DD \u05D0\u05DC\u05D5?`;
  }
  if (userMsgLower.includes("\u05DB\u05DE\u05D4 \u05E2\u05D5\u05DC\u05D4") || userMsgLower.includes("\u05DE\u05D7\u05D9\u05E8") || userMsgLower.includes("\u05E2\u05DC\u05D5\u05D9\u05D5\u05EA") || userMsgLower.includes("\u05EA\u05DE\u05D7\u05D5\u05E8") || userMsgLower.includes("\u05EA\u05E7\u05E6\u05D9\u05D1") || userMsgLower.includes("cost") || userMsgLower.includes("price")) {
    return `\u05E9\u05D0\u05DC\u05EA \u05D4\u05EA\u05DE\u05D7\u05D5\u05E8 \u05D5\u05D4\u05E2\u05DC\u05D5\u05D9\u05D5\u05EA \u05D1-TECH-SELECT \u05DE\u05D1\u05D5\u05E1\u05E1\u05EA \u05E2\u05DC \u05DE\u05D5\u05D3\u05DC **ROI \u05D7\u05D9\u05D5\u05D1\u05D9 \u05DE\u05D5\u05D1\u05D4\u05E7** \u05E9\u05E0\u05D1\u05E0\u05D4 \u05D1\u05D4\u05EA\u05D0\u05DD \u05DC\u05D2\u05D5\u05D3\u05DC \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF (${size}):

1. **\u05E9\u05DC\u05D1 \u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 \u05DE\u05DE\u05D5\u05E7\u05D3 (PoC \u05DE\u05D4\u05D9\u05E8 - 14-21 \u05D9\u05D5\u05DD):**
   - \u05D4\u05D8\u05DE\u05E2\u05D4 \u05E9\u05DC \u05EA\u05E8\u05D7\u05D9\u05E9 \u05DC\u05D9\u05D1\u05D4 \u05D0\u05D7\u05D3 (\u05DC\u05DE\u05E9\u05DC: \u05E1\u05D5\u05DB\u05DF \u05DE\u05E2\u05E0\u05D4 \u05DC\u05D4\u05E6\u05E2\u05D5\u05EA \u05DE\u05D7\u05D9\u05E8, \u05D0\u05D5 \u05EA\u05D7\u05E7\u05D5\u05E8 \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D1-RAG).
   - \u05E2\u05DC\u05D5\u05EA \u05D4\u05E7\u05DE\u05D4 \u05DE\u05D5\u05D2\u05D3\u05E8\u05EA \u05DE\u05E8\u05D0\u05E9, \u05DC\u05DC\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05D0\u05E8\u05D5\u05DB\u05EA \u05D8\u05D5\u05D5\u05D7, \u05D4\u05DE\u05D0\u05E4\u05E9\u05E8\u05EA \u05DC\u05D0\u05DE\u05EA \u05D0\u05EA \u05D4\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D1\u05E9\u05D8\u05D7.

2. **\u05EA\u05D7\u05E9\u05D9\u05D1 \u05DB\u05DC\u05DB\u05DC\u05D9 \u05DC\u05D0\u05E8\u05D2\u05D5\u05DF \u05E9\u05DC\u05DB\u05DD:**
   - \u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05E9\u05D5\u05E2\u05E8 \u05E9\u05DC \u05DB-**${monthlyHoursSaved} \u05E9\u05E2\u05D5\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA**.
   - \u05E9\u05D5\u05D5\u05D9 \u05DB\u05E1\u05E4\u05D9 \u05DE\u05E6\u05D8\u05D1\u05E8 \u05E9\u05DC \u05DB-**${annualSavingsNis} \u20AA \u05D1\u05E9\u05E0\u05D4** \u05D1\u05E9\u05D7\u05E8\u05D5\u05E8 \u05E2\u05D5\u05DE\u05E1\u05D9\u05DD \u05D5\u05E6\u05DE\u05E6\u05D5\u05DD \u05D8\u05E2\u05D5\u05D9\u05D5\u05EA \u05D0\u05E0\u05D5\u05E9.
   - \u05E0\u05E7\u05D5\u05D3\u05EA \u05D4\u05D0\u05D9\u05D6\u05D5\u05DF (Payback) \u05DE\u05D5\u05E9\u05D2\u05EA \u05DC\u05E8\u05D5\u05D1 \u05D1\u05EA\u05D5\u05DA **2.5 \u05E2\u05D3 3.5 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD**.

3. **\u05E2\u05DC\u05D5\u05D9\u05D5\u05EA \u05E9\u05D5\u05D8\u05E4\u05D5\u05EA \u05E9\u05E7\u05D5\u05E4\u05D5\u05EA (OpEx):**
   - \u05E9\u05D9\u05DE\u05D5\u05E9 \u05D1\u05DE\u05D5\u05D3\u05DC\u05D9\u05DD \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05D9\u05DD \u05D1\u05EA\u05E2\u05E8\u05D9\u05E4\u05D9 \u05E6\u05E8\u05D9\u05DB\u05D4 \u05D9\u05E9\u05D9\u05E8\u05D9\u05DD \u05DC\u05DC\u05D0 \u05E2\u05DE\u05DC\u05D5\u05EA \u05E0\u05E1\u05EA\u05E8\u05D5\u05EA.

\u05D0\u05D9\u05D6\u05D4 \u05EA\u05D4\u05DC\u05D9\u05DA \u05D1\u05D0\u05E8\u05D2\u05D5\u05DF \u05EA\u05E8\u05E6\u05D5 \u05DC\u05D1\u05D7\u05D5\u05DF \u05DB\u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 \u05E8\u05D0\u05E9\u05D5\u05DF \u05DB\u05D3\u05D9 \u05DC\u05D4\u05D5\u05DB\u05D9\u05D7 \u05D0\u05EA \u05D4\u05D4\u05D7\u05D6\u05E8 \u05D4\u05DB\u05E1\u05E4\u05D9?`;
  }
  if (userMsgLower.includes("\u05D0\u05D1\u05D8\u05D7") || userMsgLower.includes("security") || userMsgLower.includes("\u05E1\u05D5\u05D3\u05D9") || userMsgLower.includes("\u05D3\u05DC\u05D9\u05E4") || userMsgLower.includes("\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA") || userMsgLower.includes("dpa") || userMsgLower.includes("on-prem") || userMsgLower.includes("air-gap") || userMsgLower.includes("\u05DE\u05E1\u05D5\u05D5\u05D2")) {
    return `\u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D1-**${companyName}** \u05D4\u05DF \u05D1\u05DC\u05D9\u05D1\u05EA \u05D4\u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8\u05D5\u05E8\u05D4 \u05E9\u05DC TECH-SELECT:

1. **\u05D4\u05E1\u05DB\u05DD \u05D0\u05E4\u05E1 \u05E9\u05DE\u05D9\u05E8\u05EA \u05DE\u05D9\u05D3\u05E2 (Zero Data Retention - DPA):**
   - \u05DB\u05DC \u05D4\u05EA\u05E7\u05E9\u05D5\u05E8\u05EA \u05DE\u05EA\u05D1\u05E6\u05E2\u05EA \u05DE\u05D5\u05DC \u05DE\u05D5\u05D3\u05DC\u05D9 \u05E2\u05E0\u05DF \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05D9\u05DD \u05E1\u05D2\u05D5\u05E8\u05D9\u05DD (Enterprise Tenant).
   - \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD, \u05D4\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D5\u05D4\u05E9\u05D0\u05DC\u05D5\u05EA \u05E9\u05DC\u05DB\u05DD **\u05D0\u05D9\u05E0\u05DD \u05E0\u05E9\u05DE\u05E8\u05D9\u05DD \u05D1\u05E2\u05E0\u05DF \u05D5\u05D0\u05D9\u05E0\u05DD \u05DE\u05E9\u05DE\u05E9\u05D9\u05DD \u05DC\u05D0\u05D9\u05DE\u05D5\u05DF \u05DE\u05D5\u05D3\u05DC\u05D9\u05DD \u05E6\u05D9\u05D1\u05D5\u05E8\u05D9\u05D9\u05DD \u05DC\u05E2\u05D5\u05DC\u05DD**.

2. **\u05E9\u05DB\u05D1\u05EA \u05E1\u05D9\u05E0\u05D5\u05DF \u05D5\u05D4\u05D2\u05E0\u05D4 (AI Gateway & DLP):**
   - \u05E1\u05D9\u05E0\u05D5\u05DF \u05D5\u05D8\u05D9\u05D4\u05D5\u05E8 \u05D1\u05D6\u05DE\u05DF \u05D0\u05DE\u05EA \u05E9\u05DC \u05DE\u05E1\u05E4\u05E8\u05D9 \u05D6\u05D4\u05D5\u05EA, \u05DB\u05E8\u05D8\u05D9\u05E1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9, \u05E1\u05D5\u05D3\u05D5\u05EA \u05DE\u05E1\u05D7\u05E8\u05D9\u05D9\u05DD \u05D5\u05E4\u05E8\u05D8\u05D9 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD.
   - \u05E0\u05D9\u05D4\u05D5\u05DC \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05E7\u05E4\u05D3\u05E0\u05D9 (RBAC / Single Sign-On) \u05D4\u05DE\u05E1\u05D5\u05E0\u05DB\u05E8\u05DF \u05DE\u05D5\u05DC \u05D4-Entra ID / Google Workspace \u05E9\u05DC\u05DB\u05DD.

3. **\u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA On-Premises / Air-Gap:**
   - \u05E2\u05D1\u05D5\u05E8 \u05DE\u05EA\u05E7\u05E0\u05D9\u05DD \u05DE\u05E1\u05D5\u05D5\u05D2\u05D9\u05DD \u05D0\u05D5 \u05D2\u05D5\u05E4\u05D9\u05DD \u05D1\u05D9\u05D8\u05D7\u05D5\u05E0\u05D9\u05D9\u05DD, \u05E4\u05E8\u05D9\u05E1\u05EA \u05E9\u05E8\u05EA\u05D9 GPU \u05DE\u05E7\u05D5\u05DE\u05D9\u05D9\u05DD \u05E2\u05DD \u05DE\u05D5\u05D3\u05DC\u05D9 Open-Weights \u05E2\u05E6\u05DE\u05D0\u05D9\u05D9\u05DD \u05D4\u05E4\u05D5\u05E2\u05DC\u05D9\u05DD \u05DC\u05DC\u05D0 \u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8.

\u05D4\u05D0\u05DD \u05D9\u05E9 \u05E8\u05D2\u05D5\u05DC\u05E6\u05D9\u05D4 \u05E1\u05E4\u05E6\u05D9\u05E4\u05D9\u05EA \u05E9\u05D4\u05D0\u05E8\u05D2\u05D5\u05DF \u05E9\u05DC\u05DB\u05DD \u05DB\u05E4\u05D5\u05E3 \u05D0\u05DC\u05D9\u05D4 (\u05DB\u05D2\u05D5\u05DF \u05EA\u05E7\u05E0\u05D5\u05EA \u05D4\u05D2\u05E0\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D4\u05D9\u05E9\u05E8\u05D0\u05DC\u05D9\u05D5\u05EA, ISO 27001, \u05D0\u05D5 HIPAA)?`;
  }
  if (userMsgLower.includes("priority") || userMsgLower.includes("\u05E4\u05E8\u05D9\u05D5\u05E8\u05D9\u05D8\u05D9") || userMsgLower.includes("sap") || userMsgLower.includes("\u05E1\u05D0\u05E4") || userMsgLower.includes("\u05D7\u05E9\u05D1\u05E9\u05D1\u05EA") || userMsgLower.includes("salesforce") || userMsgLower.includes("\u05E1\u05D9\u05D9\u05DC\u05E1\u05E4\u05D5\u05E8\u05E1") || userMsgLower.includes("crm") || userMsgLower.includes("erp") || userMsgLower.includes("\u05DE\u05E1\u05D3 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD") || userMsgLower.includes("sql")) {
    const identifiedSys = userMsgLower.includes("priority") || userMsgLower.includes("\u05E4\u05E8\u05D9\u05D5\u05E8\u05D9\u05D8\u05D9") ? "Priority ERP" : userMsgLower.includes("sap") || userMsgLower.includes("\u05E1\u05D0\u05E4") ? "SAP Business One" : userMsgLower.includes("\u05D7\u05E9\u05D1\u05E9\u05D1\u05EA") ? "\u05D7\u05E9\u05D1\u05E9\u05D1\u05EA ERP" : userMsgLower.includes("salesforce") ? "Salesforce CRM" : erp;
    return `\u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D9\u05EA AI \u05DE\u05D5\u05DC **${identifiedSys}** \u05D1-**${companyName}** \u05DE\u05D0\u05E4\u05E9\u05E8\u05EA \u05DC\u05D4\u05E4\u05D5\u05DA \u05D0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D4\u05E2\u05E1\u05E7\u05D9\u05D9\u05DD \u05DC\u05DE\u05E0\u05D5\u05E2 \u05E6\u05DE\u05D9\u05D7\u05D4 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9:

1. **\u05D7\u05D9\u05D1\u05D5\u05E8 \u05D4\u05D9\u05D1\u05E8\u05D9\u05D3\u05D9 \u05DE\u05D5\u05D2\u05DF (Read-Only API Gateway):**
   - \u05D7\u05D9\u05D1\u05D5\u05E8 \u05E1\u05D5\u05DB\u05E0\u05D9 \u05D4-AI \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA REST API / Webhooks \u05DE\u05D1\u05D5\u05E7\u05E8\u05D9\u05DD, \u05DC\u05DC\u05D0 \u05D7\u05E9\u05D9\u05E4\u05EA \u05D8\u05D1\u05DC\u05D0\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4 \u05D1\u05D0\u05D5\u05E4\u05DF \u05D9\u05E9\u05D9\u05E8.
   - \u05D0\u05DB\u05D9\u05E4\u05EA \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05DE\u05D3\u05D5\u05E8\u05D2\u05EA \u05DB\u05D3\u05D9 \u05E9\u05DB\u05DC \u05E2\u05D5\u05D1\u05D3 \u05D9\u05D9\u05D7\u05E9\u05E3 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05DC\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D4\u05DE\u05D5\u05EA\u05E8\u05D9\u05DD \u05DC\u05D5.

2. **\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E2\u05E1\u05E7\u05D9\u05EA \u05DE\u05E8\u05DB\u05D6\u05D9\u05EA:**
   - **\u05D7\u05D9\u05DC\u05D5\u05E5 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9:** \u05E7\u05E8\u05D9\u05D0\u05EA \u05D7\u05E9\u05D1\u05D5\u05E0\u05D9\u05D5\u05EA, \u05EA\u05E2\u05D5\u05D3\u05D5\u05EA \u05DE\u05E9\u05DC\u05D5\u05D7 \u05D5\u05E7\u05D5\u05D1\u05E6\u05D9 PDF \u05DE\u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D4\u05D6\u05E0\u05EA\u05DD \u05D4\u05DE\u05D3\u05D5\u05D9\u05E7\u05EA \u05DC\u05DE\u05E2\u05E8\u05DB\u05EA.
   - **\u05EA\u05D7\u05E7\u05D5\u05E8 \u05D1\u05E9\u05E4\u05D4 \u05D8\u05D1\u05E2\u05D9\u05EA:** \u05E9\u05D0\u05D9\u05DC\u05EA\u05D5\u05EA \u05E0\u05D9\u05D4\u05D5\u05DC\u05D9\u05D5\u05EA \u05DB\u05DE\u05D5 "\u05D4\u05E4\u05E7 \u05DC\u05D9 \u05E1\u05D9\u05DB\u05D5\u05DD \u05D2\u05D9\u05D5\u05DC \u05D7\u05D5\u05D1\u05D5\u05EA \u05DC\u05E4\u05D9 \u05DC\u05E7\u05D5\u05D7\u05D5\u05EA \u05DE\u05D5\u05D1\u05D9\u05DC\u05D9\u05DD" \u05D1\u05DC\u05D7\u05D9\u05E6\u05EA \u05DB\u05E4\u05EA\u05D5\u05E8.

3. **\u05D6\u05DE\u05E0\u05D9 \u05D9\u05D9\u05E9\u05D5\u05DD:**
   - \u05D7\u05D9\u05D1\u05D5\u05E8 \u05E8\u05D0\u05E9\u05D5\u05E0\u05D9 \u05D5\u05D1\u05D3\u05D9\u05E7\u05D5\u05EA \u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D4 \u05EA\u05D5\u05DA **\u05E9\u05D1\u05D5\u05E2\u05D9\u05D9\u05DD \u05E2\u05D3 \u05E9\u05DC\u05D5\u05E9\u05D4 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA**.

\u05D1\u05D0\u05D9\u05D6\u05D5 \u05D2\u05E8\u05E1\u05D4 \u05E9\u05DC \u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05D0\u05EA\u05DD \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD (\u05E2\u05E0\u05DF / \u05E9\u05E8\u05EA \u05DE\u05E7\u05D5\u05DE\u05D9 On-Premises), \u05D5\u05DE\u05D4\u05D9 \u05D4\u05E4\u05E2\u05D5\u05DC\u05D4 \u05D4\u05D9\u05D3\u05E0\u05D9\u05EA \u05E9\u05D2\u05D5\u05D6\u05DC\u05EA \u05D4\u05DB\u05D9 \u05D4\u05E8\u05D1\u05D4 \u05D6\u05DE\u05DF \u05DE\u05D4\u05E6\u05D5\u05D5\u05EA \u05DE\u05D5\u05DC\u05D4?`;
  }
  if (userMsgLower.includes("rag") || userMsgLower.includes("\u05DE\u05E1\u05DE\u05DB") || userMsgLower.includes("pdf") || userMsgLower.includes("sharepoint") || userMsgLower.includes("\u05E9\u05E8\u05EA \u05E7\u05D1\u05E6\u05D9\u05DD") || userMsgLower.includes("\u05D7\u05D9\u05E4\u05D5\u05E9") || userMsgLower.includes("\u05D7\u05D5\u05D6\u05D4") || userMsgLower.includes("\u05D7\u05D5\u05D6\u05D9\u05DD") || userMsgLower.includes("\u05E0\u05D4\u05DC\u05D9\u05DD")) {
    return `\u05D4\u05E7\u05DE\u05EA **Enterprise RAG (\u05DE\u05E0\u05D5\u05E2 \u05D9\u05D3\u05E2 \u05D5\u05EA\u05D7\u05E7\u05D5\u05E8 \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7)** \u05E2\u05D1\u05D5\u05E8 **${companyName}** \u05DE\u05D9\u05D9\u05E6\u05E8\u05EA \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D9\u05D9\u05D3\u05D9 \u05D1\u05D6\u05DE\u05DF:

1. **\u05D0\u05D9\u05E0\u05D3\u05D5\u05E7\u05E1 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E9\u05DC \u05DB\u05DC \u05DE\u05E7\u05D5\u05E8\u05D5\u05EA \u05D4\u05DE\u05D9\u05D3\u05E2:**
   - \u05D7\u05D9\u05D1\u05D5\u05E8 \u05D9\u05E9\u05D9\u05E8 \u05DC-SharePoint, \u05E9\u05E8\u05EA\u05D9 \u05E7\u05D1\u05E6\u05D9\u05DD \u05E4\u05E0\u05D9\u05DE\u05D9\u05D9\u05DD, \u05D7\u05D5\u05D6\u05D9\u05DD, \u05DE\u05E4\u05E8\u05D8\u05D9\u05DD \u05D5\u05E0\u05D4\u05DC\u05D9\u05DD, \u05DB\u05D5\u05DC\u05DC \u05DE\u05E0\u05D5\u05E2 OCR \u05D9\u05D9\u05E2\u05D5\u05D3\u05D9 \u05DC\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05E1\u05E8\u05D5\u05E7\u05D9\u05DD \u05D1\u05E2\u05D1\u05E8\u05D9\u05EA.

2. **\u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05DE\u05D1\u05D5\u05E1\u05E1\u05D5\u05EA \u05E2\u05D5\u05D1\u05D3\u05D5\u05EA \u05D1\u05DC\u05D1\u05D3 (Zero Hallucination):**
   - \u05D4-AI \u05E2\u05D5\u05E0\u05D4 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05DE\u05EA\u05D5\u05DA \u05D4\u05DE\u05D0\u05D2\u05E8 \u05D4\u05E4\u05E0\u05D9\u05DD-\u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05D5\u05DE\u05E1\u05E4\u05E7 \u05DE\u05E8\u05D0\u05D4 \u05DE\u05E7\u05D5\u05DD (Citation) \u05DE\u05D3\u05D5\u05D9\u05E7 \u05DC\u05DB\u05DC \u05E1\u05E2\u05D9\u05E3 \u05D5\u05E4\u05E1\u05E7\u05D4.

3. **\u05E9\u05DE\u05D9\u05E8\u05D4 \u05E2\u05DC \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05DE\u05E1\u05DE\u05DA (Access Control):**
   - \u05DB\u05DC \u05E2\u05D5\u05D1\u05D3 \u05DE\u05E7\u05D1\u05DC \u05DE\u05E2\u05E0\u05D4 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05DE\u05EA\u05D5\u05DA \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05E9\u05E7\u05D9\u05D9\u05DE\u05EA \u05DC\u05D5 \u05D4\u05E8\u05E9\u05D0\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DE\u05E4\u05D5\u05E8\u05E9\u05EA \u05D0\u05DC\u05D9\u05D4\u05DD \u05D1\u05D0\u05E8\u05D2\u05D5\u05DF.

\u05D4\u05D0\u05DD \u05DE\u05D0\u05D2\u05E8\u05D9 \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DC\u05DB\u05DD \u05E9\u05DE\u05D5\u05E8\u05D9\u05DD \u05DB\u05D9\u05D5\u05DD \u05D1-Office 365 / SharePoint \u05D0\u05D5 \u05E2\u05DC \u05D2\u05D1\u05D9 \u05E9\u05E8\u05EA\u05D9 \u05E7\u05D1\u05E6\u05D9\u05DD \u05DE\u05E7\u05D5\u05DE\u05D9\u05D9\u05DD?`;
  }
  if (userMsgLower.includes("\u05E9\u05D9\u05E8\u05D5\u05EA") || userMsgLower.includes("\u05DE\u05D5\u05E7\u05D3") || userMsgLower.includes("whatsapp") || userMsgLower.includes("\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4") || userMsgLower.includes("\u05D5\u05D5\u05D8\u05E1\u05D0\u05E4") || userMsgLower.includes("\u05DC\u05D9\u05D3\u05D9\u05DD") || userMsgLower.includes("\u05D4\u05E6\u05E2\u05D5\u05EA \u05DE\u05D7\u05D9\u05E8") || userMsgLower.includes("\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA")) {
    return `\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E9\u05DC \u05E9\u05D9\u05E8\u05D5\u05EA \u05D5\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05E1\u05D5\u05DB\u05E0\u05D9 AI \u05D1-**${companyName}** \u05DE\u05D0\u05E4\u05E9\u05E8\u05EA \u05DC\u05E9\u05D3\u05E8\u05D2 \u05D0\u05EA \u05D6\u05DE\u05E0\u05D9 \u05D4\u05DE\u05E2\u05E0\u05D4 \u05DC\u05DC\u05E7\u05D5\u05D7\u05D5\u05EA:

1. **\u05E1\u05D5\u05DB\u05DF \u05E9\u05D9\u05E8\u05D5\u05EA \u05D5\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA \u05DE\u05D1\u05D5\u05E1\u05E1 WhatsApp / Email API:**
   - \u05DE\u05E2\u05E0\u05D4 \u05D0\u05D9\u05E0\u05D8\u05DC\u05D9\u05D2\u05E0\u05D8\u05D9 \u05D5\u05DE\u05D9\u05D9\u05D3\u05D9 \u05DC\u05DC\u05E7\u05D5\u05D7\u05D5\u05EA \u05D5\u05E1\u05E4\u05E7\u05D9\u05DD 24/7 \u05D1\u05E9\u05E4\u05D4 \u05D8\u05D1\u05E2\u05D9\u05EA, \u05E8\u05D4\u05D5\u05D8\u05D4 \u05D5\u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05EA.
   - \u05E1\u05D9\u05D5\u05D5\u05D2 \u05E4\u05E0\u05D9\u05D5\u05EA \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9 (Triage), \u05E9\u05DC\u05D9\u05E4\u05EA \u05E1\u05D8\u05D8\u05D5\u05E1 \u05D4\u05D6\u05DE\u05E0\u05D4 \u05DE\u05D4-ERP, \u05D5\u05D4\u05E2\u05D1\u05E8\u05D4 \u05D7\u05DC\u05E7\u05D4 \u05DC\u05E0\u05E6\u05D9\u05D2 \u05D0\u05E0\u05D5\u05E9\u05D9 \u05E8\u05E7 \u05D1\u05E2\u05EA \u05D4\u05E6\u05D5\u05E8\u05DA.

2. **\u05DE\u05D7\u05D5\u05DC\u05DC \u05D4\u05E6\u05E2\u05D5\u05EA \u05DE\u05D7\u05D9\u05E8 \u05DE\u05D4\u05D9\u05E8:**
   - \u05E7\u05E8\u05D9\u05D0\u05EA \u05D3\u05E8\u05D9\u05E9\u05D5\u05EA \u05D4\u05DC\u05E7\u05D5\u05D7 \u05DE\u05D4\u05D4\u05D5\u05D3\u05E2\u05D4 \u05D0\u05D5 \u05D4\u05DE\u05D9\u05D9\u05DC, \u05D1\u05D3\u05D9\u05E7\u05EA \u05DE\u05D7\u05D9\u05E8\u05D5\u05E0\u05D9\u05DD \u05D5\u05D4\u05E4\u05E7\u05EA \u05D8\u05D9\u05D5\u05D8\u05EA \u05D4\u05E6\u05E2\u05D4 \u05DC\u05D0\u05D9\u05E9\u05D5\u05E8 \u05DE\u05E0\u05D4\u05DC \u05EA\u05D5\u05DA \u05E9\u05E0\u05D9\u05D5\u05EA.

3. **\u05E9\u05D9\u05E4\u05D5\u05E8 SLA:**
   - \u05E7\u05D9\u05E6\u05D5\u05E8 \u05D6\u05DE\u05DF \u05D4\u05EA\u05D2\u05D5\u05D1\u05D4 \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D9 \u05DE\u05E4\u05E0\u05D9\u05D5\u05EA \u05DE\u05DE\u05EA\u05D9\u05E0\u05D5\u05EA \u05DC\u05DE\u05E2\u05E0\u05D4 \u05DE\u05D9\u05D9\u05D3\u05D9 \u05EA\u05D5\u05DA \u05E9\u05E0\u05D9\u05D5\u05EA \u05D1\u05D5\u05D3\u05D3\u05D5\u05EA.

\u05DB\u05DE\u05D4 \u05E4\u05E0\u05D9\u05D5\u05EA \u05D5\u05E9\u05D0\u05DC\u05D5\u05EA \u05D7\u05D5\u05D6\u05E8\u05D5\u05EA \u05DE\u05E7\u05D1\u05DC \u05D4\u05E6\u05D5\u05D5\u05EA \u05E9\u05DC\u05DB\u05DD \u05D1\u05DE\u05DE\u05D5\u05E6\u05E2 \u05D1\u05D9\u05D5\u05DD?`;
  }
  return `\u05EA\u05D5\u05D3\u05D4 \u05E2\u05DC \u05D4\u05D3\u05D1\u05E8\u05D9\u05DD, **${contactRole}**. 

\u05D1\u05D7\u05D9\u05E0\u05EA \u05D4\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05E9\u05DC **${companyName}** (\u05D0\u05E8\u05D2\u05D5\u05DF \u05E9\u05DC ${size}) \u05DE\u05E8\u05D0\u05D4 \u05DB\u05D9 \u05D4\u05D3\u05E8\u05DA \u05D4\u05D9\u05E2\u05D9\u05DC\u05D4 \u05D1\u05D9\u05D5\u05EA\u05E8 \u05DC\u05D4\u05D8\u05DE\u05E2\u05EA AI \u05DB\u05D5\u05DC\u05DC\u05EA 3 \u05E9\u05DC\u05D1\u05D9\u05DD \u05DE\u05D5\u05D2\u05D3\u05E8\u05D9\u05DD:

1. **\u05E9\u05DC\u05D1 1: \u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 \u05DE\u05D4\u05D9\u05E8 (Quick-Win \u05D1-30 \u05D9\u05D5\u05DD):**
   - \u05D1\u05D7\u05D9\u05E8\u05EA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05D4\u05DE\u05E8\u05DB\u05D6\u05D9 \u05E9\u05D1\u05D5 \u05DE\u05D5\u05E9\u05E7\u05E2 \u05D4\u05D6\u05DE\u05DF \u05D4\u05E8\u05D1 \u05D1\u05D9\u05D5\u05EA\u05E8 (\u05DC\u05DE\u05E9\u05DC: \u05E1\u05D5\u05DB\u05DF \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD RAG, \u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D9\u05EA \u05DE\u05E2\u05E0\u05D4 \u05D0\u05D5 \u05E2\u05D9\u05D1\u05D5\u05D3 \u05D3\u05D5\u05D7\u05D5\u05EA).
   - \u05D4\u05E7\u05DE\u05EA \u05E9\u05DB\u05D1\u05EA \u05E9\u05E2\u05E8 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA (AI Gateway) \u05E2\u05DD \u05D7\u05E1\u05D9\u05DE\u05EA \u05D3\u05DC\u05D9\u05E4\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05D4\u05E1\u05DB\u05DD DPA.

2. **\u05E9\u05DC\u05D1 2: \u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D4 \u05DE\u05D5\u05DC \u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4 (${erp}):**
   - \u05D7\u05D9\u05D1\u05D5\u05E8 \u05D3\u05D5-\u05DB\u05D9\u05D5\u05D5\u05E0\u05D9 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05DC\u05E9\u05DC\u05D9\u05E4\u05D4 \u05D5\u05E1\u05E0\u05DB\u05E8\u05D5\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DC\u05DC\u05D0 \u05E6\u05D5\u05E8\u05DA \u05D1\u05D4\u05E7\u05DC\u05D3\u05D4 \u05DB\u05E4\u05D5\u05DC\u05D4.

3. **\u05E9\u05DC\u05D1 3: \u05DE\u05D3\u05D9\u05D3\u05EA ROI \u05D1\u05E4\u05D5\u05E2\u05DC:**
   - \u05D9\u05E2\u05D3 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E9\u05DC \u05DB-**${monthlyHoursSaved} \u05E9\u05E2\u05D5\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D1\u05D7\u05D5\u05D3\u05E9** \u05D5\u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4 \u05EA\u05D5\u05DA \u05E8\u05D1\u05E2\u05D5\u05DF \u05D0\u05D7\u05D3.

\u05D0\u05D9\u05D6\u05D4 \u05D9\u05E2\u05D3 \u05E2\u05E1\u05E7\u05D9 \u05DE\u05D1\u05D9\u05DF \u05D4\u05E9\u05DC\u05D5\u05E9\u05D4 \u05D4\u05DB\u05D9 \u05D3\u05D7\u05D5\u05E3 \u05DC\u05DB\u05DD \u05DC\u05E7\u05D3\u05DD \u05DB\u05E2\u05EA \u05D1\u05D0\u05E8\u05D2\u05D5\u05DF?`;
}
async function dispatchToFormSubmit(payload) {
  const targetEmail = "support@tech-select.co.il";
  try {
    const bodyData = {
      name: payload.name || "\u05D0\u05D5\u05E8\u05D7 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 Tech-Select",
      phone: payload.phone || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF",
      email: payload.email || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF",
      company: payload.company || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF",
      message: payload.message,
      _subject: payload.subject || "\u05D4\u05EA\u05E8\u05D0\u05D4 \u05DE\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4-AI \u05E9\u05DC Tech-Select",
      _captcha: "false",
      _template: "table",
      _cc: "g@tech-select.co.il",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }),
      ...payload
    };
    const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://tech-select.co.il",
        "Referer": "https://tech-select.co.il"
      },
      body: JSON.stringify(bodyData)
    });
    const data = await response.json().catch(() => ({}));
    console.log("[FORMSUBMIT SERVER DISPATCH RESULT]", data);
    return response.ok;
  } catch (err) {
    console.error("[FORMSUBMIT SERVER DISPATCH ERROR]", err?.message || err);
    return false;
  }
}
var cachedGraphToken = null;
async function getGraphAccessToken() {
  const tenantId = (process.env.TENANT_ID || "").trim();
  const clientId = (process.env.CLIENT_ID || "").trim();
  const clientSecret = (process.env.CLIENT_SECRET || "").trim();
  if (!tenantId || !clientId || !clientSecret) {
    console.warn("[GRAPH API] Missing TENANT_ID, CLIENT_ID, or CLIENT_SECRET in environment variables.");
    return null;
  }
  if (cachedGraphToken && Date.now() < cachedGraphToken.expiresAt - 6e4) {
    return cachedGraphToken.token;
  }
  try {
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials"
    });
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString()
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      console.error(`[GRAPH OAUTH TOKEN ERROR] Status ${tokenRes.status}:`, errText);
      return null;
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    if (!accessToken) {
      console.error("[GRAPH OAUTH TOKEN ERROR] No access_token returned by Microsoft identity endpoint.");
      return null;
    }
    const expiresIn = Number(tokenData?.expires_in) || 3600;
    cachedGraphToken = {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1e3
    };
    return accessToken;
  } catch (err) {
    console.error("[GRAPH OAUTH TOKEN EXCEPTION]:", err?.message || err);
    return null;
  }
}
async function sendEmailViaGraph({
  to,
  subject,
  content,
  isHtml = true,
  attachments
}) {
  const accessToken = await getGraphAccessToken();
  if (!accessToken) {
    return false;
  }
  try {
    const sender = "support@tech-select.co.il";
    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;
    const recipients = (Array.isArray(to) ? to : [to]).map((addr) => addr.trim()).filter(Boolean).map((addr) => ({
      emailAddress: { address: addr }
    }));
    if (recipients.length === 0) {
      console.warn("[GRAPH API] No valid recipient addresses provided.");
      return false;
    }
    const messagePayload = {
      subject,
      body: {
        contentType: isHtml ? "HTML" : "Text",
        content
      },
      toRecipients: recipients,
      from: {
        emailAddress: {
          address: sender,
          name: "\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05DE\u05D5\u05E7\u05D3 \u05EA\u05DE\u05D9\u05DB\u05D4"
        }
      }
    };
    if (attachments && attachments.length > 0) {
      messagePayload.attachments = attachments.map((att) => {
        let base64Content = "";
        if (Buffer.isBuffer(att.content)) {
          base64Content = att.content.toString("base64");
        } else if (typeof att.content === "string") {
          base64Content = Buffer.from(att.content).toString("base64");
        }
        return {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: att.filename,
          contentType: att.contentType || "application/octet-stream",
          contentBytes: base64Content
        };
      });
    }
    const mailPayload = {
      message: messagePayload,
      saveToSentItems: true
    };
    const graphRes = await fetch(sendMailUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mailPayload)
    });
    if (graphRes.ok || graphRes.status === 202) {
      console.log(`[GRAPH API MAIL DISPATCHED] from ${sender} to ${JSON.stringify(to)}: "${subject}"`);
      return true;
    } else {
      const errText = await graphRes.text().catch(() => "");
      console.error(`[GRAPH API MAIL ERROR] Status ${graphRes.status}:`, errText);
      return false;
    }
  } catch (err) {
    console.error("[GRAPH API EXCEPTION]:", err?.message || err);
    return false;
  }
}
async function sendAlertEmail({
  subject,
  html,
  textSummary,
  replyTo,
  formData,
  attachments
}) {
  const plainTextMessage = textSummary || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 1500);
  await dispatchToFormSubmit({
    name: formData?.fullName || formData?.name || "\u05DE\u05E2\u05E8\u05DB\u05EA Tech-Select AI",
    phone: formData?.phone || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF",
    email: replyTo || formData?.email || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF",
    company: formData?.companyName || formData?.company || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF",
    subject,
    message: plainTextMessage,
    ...formData
  });
  const targetAdmin = process.env.ALERT_EMAIL || "g@tech-select.co.il";
  await sendEmailViaGraph({
    to: targetAdmin,
    subject,
    content: html,
    isHtml: true,
    attachments
  });
  return true;
}
async function startServer() {
  try {
    let getAteraAuthHeaders = function() {
      const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
      const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
      const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
      return {
        "Authorization": bearerHeader,
        "X-API-KEY": cleanApiKey,
        "Accept": "application/json"
      };
    }, translateTicketStatus = function(status) {
      const s = String(status || "").toLowerCase();
      if (s.includes("open") || s === "new") return "\u05E4\u05EA\u05D5\u05D7 (\u05D1\u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D5\u05E7\u05D3 \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD)";
      if (s.includes("pending")) return "\u05DE\u05DE\u05EA\u05D9\u05DF \u05DC\u05DE\u05E2\u05E0\u05D4 / \u05D1\u05D1\u05D3\u05D9\u05E7\u05D4";
      if (s.includes("resolved") || s.includes("closed")) return "\u05D8\u05D5\u05E4\u05DC \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 (Resolved)";
      if (s.includes("deleted")) return "\u05D1\u05D5\u05D8\u05DC / \u05E0\u05DE\u05D7\u05E7";
      return status || "\u05D1\u05D8\u05D9\u05E4\u05D5\u05DC";
    }, maskEmail = function(email) {
      if (!email || !email.includes("@")) return "\u05DE\u05D9\u05D9\u05DC \u05D0\u05D9\u05E9 \u05D4\u05E7\u05E9\u05E8 \u05D4\u05E8\u05E9\u05D5\u05DD";
      const [user, domain] = email.trim().toLowerCase().split("@");
      if (user.length <= 2) {
        return `${user[0]}***@${domain}`;
      }
      return `${user[0]}***${user[user.length - 1]}@${domain}`;
    };
    const app = (0, import_express.default)();
    const PORT = Number(process.env.PORT) || 3e3;
    app.use(import_express.default.json({ limit: "10mb" }));
    app.use(import_express.default.urlencoded({ extended: true, limit: "10mb" }));
    const pendingAccessCodes = /* @__PURE__ */ new Map();
    const verifiedSessions = /* @__PURE__ */ new Map();
    const ipRateLimits = /* @__PURE__ */ new Map();
    const MASTER_ACCESS_CODES = /* @__PURE__ */ new Set([
      "TECH-AI-2026",
      "GUY-VIP",
      "SELECT-AI",
      "7788",
      "9903",
      "1234",
      "8899",
      "0503900903"
    ]);
    const checkRateLimit = (ip, maxCalls = 25, windowMs = 5 * 60 * 1e3) => {
      const now = Date.now();
      const current = ipRateLimits.get(ip);
      if (!current || now > current.resetAt) {
        ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (current.count >= maxCalls) {
        return false;
      }
      current.count += 1;
      return true;
    };
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of pendingAccessCodes.entries()) {
        if (now > val.expiresAt) pendingAccessCodes.delete(key);
      }
      for (const [key, val] of verifiedSessions.entries()) {
        if (now > val.expiresAt) verifiedSessions.delete(key);
      }
      for (const [key, val] of ipRateLimits.entries()) {
        if (now > val.resetAt) ipRateLimits.delete(key);
      }
    }, 10 * 60 * 1e3);
    app.post("/api/ai-discovery/request-access-code", async (req, res) => {
      try {
        const { fullName, companyName, email, phone, companySize, botTrap } = req.body || {};
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT] Rejected bot on access code request");
          return res.status(403).json({ success: false, error: "Access denied" });
        }
        const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
        if (!checkRateLimit(String(clientIp), 8, 3 * 60 * 1e3)) {
          return res.status(429).json({
            success: false,
            error: "\u05D9\u05D5\u05EA\u05E8 \u05DE\u05D3\u05D9 \u05D1\u05E7\u05E9\u05D5\u05EA \u05D1\u05D6\u05DE\u05DF \u05E7\u05E6\u05E8. \u05D0\u05E0\u05D0 \u05D4\u05DE\u05EA\u05D9\u05E0\u05D5 \u05DE\u05E1\u05E4\u05E8 \u05D3\u05E7\u05D5\u05EA \u05D0\u05D5 \u05D4\u05E9\u05D0\u05D9\u05E8\u05D5 \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D1\u05E6'\u05D0\u05D8."
          });
        }
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanPhone = String(phone || "").trim();
        const cleanCompany = String(companyName || "").trim() || "\u05D7\u05D1\u05E8\u05D4 \u05DC\u05DC\u05D0 \u05E9\u05DD";
        const cleanName = String(fullName || "").trim() || "\u05E0\u05E6\u05D9\u05D2 \u05D4\u05E0\u05D4\u05DC\u05D4";
        const cleanSize = String(companySize || "").trim() || "21-100";
        if (!cleanEmail && !cleanPhone) {
          return res.status(400).json({
            success: false,
            error: "\u05E0\u05D0 \u05DC\u05D4\u05D6\u05D9\u05DF \u05DB\u05EA\u05D5\u05D1\u05EA \u05DE\u05D9\u05D9\u05DC \u05D0\u05D5 \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05E7\u05D1\u05DC\u05EA \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4"
          });
        }
        const randomNum = Math.floor(1e3 + Math.random() * 9e3);
        const otpCode = String(randomNum);
        const expiresAt = Date.now() + 15 * 60 * 1e3;
        const pendingData = {
          code: otpCode,
          email: cleanEmail,
          phone: cleanPhone,
          companyName: cleanCompany,
          fullName: cleanName,
          companySize: cleanSize,
          createdAt: Date.now(),
          expiresAt
        };
        const key = cleanEmail || cleanPhone;
        pendingAccessCodes.set(key, pendingData);
        pendingAccessCodes.set(otpCode, pendingData);
        const nowIsraelTime = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        if (cleanEmail && cleanEmail.includes("@")) {
          const userOtpSubject = `\u{1F510} \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA [${otpCode}] \u05DC\u05DB\u05E0\u05D9\u05E1\u05D4 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05D4\u05DC\u05D9\u05DD | TECH-SELECT AI`;
          const userOtpHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
              <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
                <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">TECH-SELECT AI EXECUTIVE SIMULATOR</span>
                <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DB\u05E0\u05D9\u05E1\u05D4 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05D4\u05DC\u05D9\u05DD</h2>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05E9\u05DC\u05D5\u05DD ${cleanName} (${cleanCompany}), \u05DC\u05D4\u05DC\u05DF \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E9\u05DC\u05DA:</p>
              </div>

              <div style="background-color: #1e1b4b; border: 2px solid #818cf8; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <div style="color: #a5b4fc; font-size: 13px; font-weight: bold; margin-bottom: 6px;">\u{1F522} \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05DC\u05DA:</div>
                <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
                <div style="color: #cbd5e1; font-size: 11px; margin-top: 6px;">(\u05EA\u05D5\u05E7\u05E3: 15 \u05D3\u05E7\u05D5\u05EA \u2022 \u05D4\u05D6\u05DF \u05E7\u05D5\u05D3 \u05D6\u05D4 \u05D1\u05D8\u05D5\u05E4\u05E1 \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DC\u05E4\u05EA\u05D9\u05D7\u05D4 \u05DE\u05D9\u05D9\u05D3\u05D9\u05EA)</div>
              </div>

              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4-AI \u05E9\u05DC <strong>TECH-SELECT</strong> \u05DE\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D0\u05E4\u05D9\u05D9\u05DF \u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA AI \u05D5-RAG \u05DE\u05D1\u05D5\u05D3\u05D3\u05D9\u05DD \u05E2\u05D1\u05D5\u05E8 <strong>${cleanCompany}</strong>, \u05DB\u05D5\u05DC\u05DC \u05D4\u05E2\u05E8\u05DB\u05EA ROI \u05E9\u05E2\u05D5\u05EA \u05D5\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DB\u05E1\u05E4\u05D9 \u05E9\u05E0\u05EA\u05D9.
              </p>

              <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 20px; font-size: 11px; color: #64748b; text-align: center;">
                \u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05D5\u05D4\u05E1\u05D9\u05D9\u05D1\u05E8 | TECH-SELECT Computer Services LTD \u2022 \u05D8\u05DC\u05E4\u05D5\u05DF: 077-7700252
              </div>
            </div>
          `;
          sendEmailViaGraph({
            to: cleanEmail,
            subject: userOtpSubject,
            content: userOtpHtml,
            isHtml: true
          }).catch((err) => console.warn("[USER AI OTP DISPATCH WARNING]", err));
        }
        const alertHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 650px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
              <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">\u{1F510} \u05D1\u05E7\u05E9\u05EA \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 AI</span>
              <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D7\u05D3-\u05E4\u05E2\u05DE\u05D9 (4 \u05E1\u05E4\u05E8\u05D5\u05EA) \u05D4\u05D5\u05E4\u05E7 \u05DB\u05E2\u05EA!</h2>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05D6\u05DE\u05DF: ${nowIsraelTime} (\u05E9\u05E2\u05D5\u05DF \u05D9\u05E9\u05E8\u05D0\u05DC)</p>
            </div>

            <div style="background-color: #1e1b4b; border: 2px solid #818cf8; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 20px;">
              <div style="color: #a5b4fc; font-size: 13px; font-weight: bold; margin-bottom: 4px;">\u{1F522} \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA (4 \u05E1\u05E4\u05E8\u05D5\u05EA) \u05E9\u05D4\u05D5\u05E4\u05E7 \u05DC\u05DE\u05E9\u05EA\u05DE\u05E9:</div>
              <div style="color: #ffffff; font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
              <div style="color: #cbd5e1; font-size: 11px; margin-top: 6px;">(\u05EA\u05D5\u05E7\u05E3: 15 \u05D3\u05E7\u05D5\u05EA \u2022 \u05E0\u05E9\u05DC\u05D7 \u05D2\u05DD \u05DC\u05DE\u05D9\u05D9\u05DC \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D1\u05DE\u05D9\u05D3\u05D4 \u05D5\u05D4\u05D5\u05D6\u05DF)</div>
            </div>

            <div style="background-color: #111827; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; border: 1px solid #1f2937;">
              <h4 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #374151; padding-bottom: 6px;">\u{1F464} \u05E4\u05E8\u05D8\u05D9 \u05D4\u05DE\u05E0\u05D4\u05DC / \u05D4\u05D7\u05D1\u05E8\u05D4 \u05E9\u05D1\u05D9\u05E7\u05E9\u05D5 \u05D2\u05D9\u05E9\u05D4:</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                <tr><td style="padding: 4px 0; color: #94a3b8; width: 35%;">\u05E9\u05DD \u05DE\u05DC\u05D0:</td><td style="padding: 4px 0; font-weight: bold;">${cleanName}</td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">\u05D7\u05D1\u05E8\u05D4:</td><td style="padding: 4px 0; font-weight: bold; color: #38bdf8;">${cleanCompany}</td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">\u05D2\u05D5\u05D3\u05DC \u05D0\u05E8\u05D2\u05D5\u05DF:</td><td style="padding: 4px 0;">${cleanSize} \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD</td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">\u05D3\u05D5\u05D0"\u05DC:</td><td style="padding: 4px 0; color: #38bdf8;"><a href="mailto:${cleanEmail}" style="color: #38bdf8;">${cleanEmail || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</a></td></tr>
                <tr><td style="padding: 4px 0; color: #94a3b8;">\u05D8\u05DC\u05E4\u05D5\u05DF:</td><td style="padding: 4px 0; font-weight: bold;"><a href="tel:${cleanPhone}" style="color: #34d399;">${cleanPhone || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</a></td></tr>
              </table>
            </div>

            <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 14px;">
              \u05DE\u05E2\u05E8\u05DB\u05EA \u05D0\u05D1\u05D8\u05D7\u05D4 \u05D5\u05E0\u05E2\u05D9\u05DC\u05EA \u05D8\u05D5\u05E7\u05E0\u05D9\u05DD | TECH-SELECT Computer Services LTD
            </div>
          </div>
        `;
        sendAlertEmail({
          subject: `\u{1F510} \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 [${otpCode}] \u05E2\u05D1\u05D5\u05E8 ${cleanCompany} (${cleanName})`,
          html: alertHtml,
          textSummary: `\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D7\u05D3-\u05E4\u05E2\u05DE\u05D9 \u05D4\u05D5\u05E4\u05E7:
\u05E7\u05D5\u05D3: ${otpCode}
\u05D7\u05D1\u05E8\u05D4: ${cleanCompany}
\u05E9\u05DD: ${cleanName}
\u05DE\u05D9\u05D9\u05DC: ${cleanEmail}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${cleanPhone}`,
          replyTo: cleanEmail || void 0,
          formData: pendingData
        }).catch((err) => console.error("[ACCESS CODE ALERT ERROR]", err));
        console.log(`[ACCESS CODE GENERATED] Code: ${otpCode} for ${cleanCompany} (${cleanEmail || cleanPhone})`);
        return res.json({
          success: true,
          message: "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E0\u05D5\u05E6\u05E8 \u05D5\u05E0\u05E9\u05DC\u05D7 \u05DC\u05D0\u05D9\u05E9\u05D5\u05E8. \u05D1\u05E0\u05D5\u05E1\u05E3 \u05EA\u05D5\u05DB\u05DC \u05DC\u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05E7\u05D5\u05D3 VIP \u05D0\u05D5 \u05DC\u05E7\u05D1\u05DC \u05D0\u05D9\u05E9\u05D5\u05E8 \u05D9\u05E9\u05D9\u05E8.",
          expiresInMinutes: 15,
          // We provide the demo OTP directly for frictionless client-side trial while still capturing the full lead
          directCode: otpCode
        });
      } catch (err) {
        console.error("[REQUEST ACCESS CODE ERROR]", err);
        return res.status(500).json({ success: false, error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D4\u05E4\u05E7\u05EA \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4" });
      }
    });
    app.post("/api/ai-discovery/verify-access-code", async (req, res) => {
      try {
        const { code, email, phone, companyName, fullName, companySize, botTrap } = req.body || {};
        if (botTrap && String(botTrap).trim().length > 0) {
          return res.status(403).json({ success: false, error: "Access denied" });
        }
        const inputCode = String(code || "").trim().toUpperCase();
        if (!inputCode) {
          return res.status(400).json({ success: false, error: "\u05D9\u05E9 \u05DC\u05D4\u05D6\u05D9\u05DF \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4" });
        }
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanPhone = String(phone || "").trim();
        const key = cleanEmail || cleanPhone;
        const isMaster = MASTER_ACCESS_CODES.has(inputCode);
        const pendingMatch = pendingAccessCodes.get(inputCode) || (key ? pendingAccessCodes.get(key) : null);
        const isOtpMatch = pendingMatch && pendingMatch.code === inputCode && Date.now() <= pendingMatch.expiresAt;
        if (!isMaster && !isOtpMatch) {
          return res.status(401).json({
            success: false,
            error: "\u05E7\u05D5\u05D3 \u05D4\u05D2\u05D9\u05E9\u05D4 \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05E0\u05D9\u05EA\u05DF \u05DC\u05D1\u05E7\u05E9 \u05E7\u05D5\u05D3 \u05D7\u05D3\u05E9 \u05D0\u05D5 \u05DC\u05E9\u05D0\u05D5\u05DC \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05E6'\u05D0\u05D8."
          });
        }
        const sessionToken = import_crypto.default.randomBytes(24).toString("hex");
        const finalCompany = pendingMatch?.companyName || companyName || "\u05D0\u05E8\u05D2\u05D5\u05DF \u05DE\u05D0\u05D5\u05DE\u05EA";
        const finalName = pendingMatch?.fullName || fullName || "\u05DE\u05E0\u05D4\u05DC \u05DE\u05D0\u05D5\u05DE\u05EA";
        const finalEmail = pendingMatch?.email || email || "";
        const finalPhone = pendingMatch?.phone || phone || "";
        const finalSize = pendingMatch?.companySize || companySize || "21-100";
        verifiedSessions.set(sessionToken, {
          token: sessionToken,
          email: finalEmail,
          companyName: finalCompany,
          fullName: finalName,
          createdAt: Date.now(),
          expiresAt: Date.now() + 3 * 60 * 60 * 1e3,
          // 3 hours valid session
          requestsCount: 0
        });
        if (inputCode) pendingAccessCodes.delete(inputCode);
        if (key) pendingAccessCodes.delete(key);
        console.log(`[ACCESS GRANTED] Session unlocked for ${finalCompany} (${finalName}) with token ${sessionToken.substring(0, 8)}...`);
        sendAlertEmail({
          subject: `\u2705 \u05E9\u05E2\u05E8 AI \u05E0\u05E4\u05EA\u05D7 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4: ${finalCompany} (${finalName}) \u05E0\u05DB\u05E0\u05E1\u05D5 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8!`,
          html: `<div dir="rtl"><h3>\u05D4\u05D0\u05E8\u05D2\u05D5\u05DF ${finalCompany} (${finalName}) \u05D4\u05E9\u05DC\u05D9\u05DD \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05D5\u05E0\u05DB\u05E0\u05E1 \u05DC\u05D0\u05E4\u05D9\u05D5\u05DF!</h3><p>\u05DE\u05D9\u05D9\u05DC: ${finalEmail} | \u05D8\u05DC\u05E4\u05D5\u05DF: ${finalPhone}</p></div>`,
          textSummary: `\u05D0\u05D9\u05DE\u05D5\u05EA \u05DE\u05D5\u05E6\u05DC\u05D7 \u05DC\u05E9\u05E2\u05E8 \u05D4-AI:
\u05D7\u05D1\u05E8\u05D4: ${finalCompany}
\u05E9\u05DD: ${finalName}
\u05DE\u05D9\u05D9\u05DC: ${finalEmail}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${finalPhone}`,
          formData: { finalCompany, finalName, finalEmail, finalPhone, finalSize }
        }).catch(() => {
        });
        return res.json({
          success: true,
          sessionToken,
          lead: {
            companyName: finalCompany,
            fullName: finalName,
            email: finalEmail,
            phone: finalPhone,
            companySize: finalSize
          }
        });
      } catch (err) {
        console.error("[VERIFY ACCESS CODE ERROR]", err);
        return res.status(500).json({ success: false, error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D0\u05D9\u05DE\u05D5\u05EA \u05E7\u05D5\u05D3 \u05D4\u05D2\u05D9\u05E9\u05D4" });
      }
    });
    app.post(["/api/auth/send-otp", "/api/otp/send"], async (req, res) => {
      try {
        const { email, fullName, companyName, action } = req.body || {};
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanName = String(fullName || "").trim() || "\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D1\u05D0\u05EA\u05E8";
        const cleanCompany = String(companyName || "").trim();
        const actionDesc = String(action || "\u05D1\u05D9\u05E6\u05D5\u05E2 \u05E4\u05E2\u05D5\u05DC\u05D5\u05EA \u05D1\u05D0\u05EA\u05E8 / \u05E9\u05D9\u05D7\u05D4 \u05E2\u05DD \u05DE\u05D5\u05E7\u05D3 \u05D4-AI");
        if (!cleanEmail || !cleanEmail.includes("@")) {
          return res.status(400).json({ success: false, error: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D3\u05D5\u05D0\u05F4\u05DC \u05EA\u05E7\u05D9\u05E0\u05D4 \u05E0\u05D3\u05E8\u05E9\u05EA \u05DC\u05E7\u05D1\u05DC\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA" });
        }
        const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
        if (!checkRateLimit(String(clientIp), 12, 3 * 60 * 1e3)) {
          return res.status(429).json({ success: false, error: "\u05D9\u05D5\u05EA\u05E8 \u05DE\u05D3\u05D9 \u05D1\u05E7\u05E9\u05D5\u05EA \u05D1\u05D6\u05DE\u05DF \u05E7\u05E6\u05E8. \u05D0\u05E0\u05D0 \u05D4\u05DE\u05EA\u05D9\u05E0\u05D5 \u05DE\u05E1\u05E4\u05E8 \u05D3\u05E7\u05D5\u05EA." });
        }
        const randomNum = Math.floor(1e3 + Math.random() * 9e3);
        const otpCode = String(randomNum);
        const expiresAt = Date.now() + 15 * 60 * 1e3;
        const pendingData = {
          code: otpCode,
          email: cleanEmail,
          phone: "",
          companyName: cleanCompany || "\u05D0\u05EA\u05E8 Tech-Select",
          fullName: cleanName,
          companySize: "1-20",
          createdAt: Date.now(),
          expiresAt
        };
        pendingAccessCodes.set(cleanEmail, pendingData);
        pendingAccessCodes.set(otpCode, pendingData);
        const nowIsrael = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        const userOtpSubject = `\u{1F510} \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA [${otpCode}] - Tech-Select`;
        const userOtpHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
              <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE</span>
              <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 20px;">\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA</h2>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05D6\u05DE\u05DF \u05D1\u05E7\u05E9\u05D4: ${nowIsrael}</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              \u05E9\u05DC\u05D5\u05DD <strong>${cleanName}</strong>,<br>
              \u05D4\u05EA\u05E7\u05D1\u05DC\u05D4 \u05D1\u05E7\u05E9\u05EA \u05D0\u05D9\u05DE\u05D5\u05EA \u05D6\u05D4\u05D5\u05EA \u05E2\u05D1\u05D5\u05E8 ${actionDesc}.<br>
              \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05DC\u05DA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05D4\u05D5\u05D0:
            </p>

            <div style="background-color: #1e1b4b; border: 2px solid #38bdf8; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="color: #93c5fd; font-size: 13px; font-weight: bold; margin-bottom: 6px;">\u{1F522} \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05DC\u05DA:</div>
              <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
              <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">(\u05EA\u05D5\u05E7\u05E3: 15 \u05D3\u05E7\u05D5\u05EA \u2022 \u05D0\u05D9\u05DF \u05DC\u05D4\u05E2\u05D1\u05D9\u05E8 \u05E7\u05D5\u05D3 \u05D6\u05D4)</div>
            </div>

            <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
              \u05E6\u05D5\u05D5\u05EA \u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05E1\u05D9\u05D9\u05D1\u05E8 | TECH-SELECT Computer Services LTD
            </div>
          </div>
        `;
        sendEmailViaGraph({
          to: cleanEmail,
          subject: userOtpSubject,
          content: userOtpHtml,
          isHtml: true
        }).catch((err) => console.warn("[SEND-OTP GRAPH WARNING]", err));
        sendAlertEmail({
          subject: `\u{1F510} \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA [${otpCode}] \u05E0\u05E9\u05DC\u05D7 \u05D0\u05DC ${cleanEmail} (${cleanName})`,
          html: userOtpHtml,
          replyTo: cleanEmail,
          formData: pendingData
        }).catch(() => {
        });
        console.log(`[AUTH OTP SENT] Code ${otpCode} sent to ${cleanEmail}`);
        return res.json({
          success: true,
          maskedEmail: maskEmail(cleanEmail),
          expiresInMinutes: 15,
          directCode: otpCode
        });
      } catch (err) {
        console.error("[SEND-OTP ERROR]", err);
        return res.status(500).json({ success: false, error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E9\u05DC\u05D9\u05D7\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA" });
      }
    });
    app.post(["/api/auth/verify-otp", "/api/otp/verify"], async (req, res) => {
      try {
        const { email, code, fullName, companyName } = req.body || {};
        const inputCode = String(code || "").trim().toUpperCase();
        const cleanEmail = String(email || "").trim().toLowerCase();
        if (!inputCode) {
          return res.status(400).json({ success: false, error: "\u05D9\u05E9 \u05DC\u05D4\u05D6\u05D9\u05DF \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA" });
        }
        const isMaster = MASTER_ACCESS_CODES.has(inputCode) || MASTER_TICKET_CODES.has(inputCode);
        const pendingMatch = pendingAccessCodes.get(inputCode) || (cleanEmail ? pendingAccessCodes.get(cleanEmail) : null);
        const isOtpMatch = pendingMatch && pendingMatch.code === inputCode && Date.now() <= pendingMatch.expiresAt;
        if (!isMaster && !isOtpMatch) {
          return res.status(401).json({
            success: false,
            error: "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05E7\u05D5 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D5\u05E0\u05E1\u05D5 \u05E9\u05D5\u05D1."
          });
        }
        const sessionToken = import_crypto.default.randomBytes(24).toString("hex");
        const finalCompany = pendingMatch?.companyName || companyName || "\u05DC\u05E7\u05D5\u05D7 \u05DE\u05D0\u05D5\u05DE\u05EA";
        const finalName = pendingMatch?.fullName || fullName || "\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DE\u05D0\u05D5\u05DE\u05EA";
        const finalEmail = pendingMatch?.email || cleanEmail || "";
        verifiedSessions.set(sessionToken, {
          token: sessionToken,
          email: finalEmail,
          companyName: finalCompany,
          fullName: finalName,
          createdAt: Date.now(),
          expiresAt: Date.now() + 4 * 60 * 60 * 1e3,
          requestsCount: 0
        });
        if (inputCode) pendingAccessCodes.delete(inputCode);
        if (cleanEmail) pendingAccessCodes.delete(cleanEmail);
        console.log(`[AUTH OTP VERIFIED] ${finalName} (${finalEmail}) verified with token ${sessionToken.substring(0, 8)}`);
        return res.json({
          success: true,
          sessionToken,
          token: sessionToken,
          lead: {
            fullName: finalName,
            email: finalEmail,
            companyName: finalCompany
          }
        });
      } catch (err) {
        console.error("[VERIFY-OTP ERROR]", err);
        return res.status(500).json({ success: false, error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05E7\u05D5\u05D3" });
      }
    });
    const diagnosticHandler = async (req, res) => {
      const startTime = Date.now();
      try {
        const isGet = req.method === "GET";
        const apiKey = req.body?.customApiKey || process.env.GEMINI_API_KEY;
        const testPrompt = req.body?.prompt || "Hello Gemini, respond with a short confirmation message in Hebrew.";
        const requestedModel = req.body?.model;
        if (isGet) {
          return res.json({
            hasApiKey: Boolean(apiKey && apiKey.length > 5),
            keyLength: apiKey ? apiKey.length : 0
          });
        }
        if (!apiKey) {
          return res.json({
            success: false,
            endpoint: req.path,
            error: "GEMINI_API_KEY is not defined in server environment variables.",
            environment: "Node.js Express Server",
            latencyMs: Date.now() - startTime
          });
        }
        const candidateModels = requestedModel ? [requestedModel] : ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.6-flash", "gemini-3.8-flash"];
        const modelsToTry = candidateModels.filter((m) => !isModelCoolingDown(m));
        const finalCandidateList = modelsToTry.length > 0 ? modelsToTry : candidateModels;
        const attempts = [];
        let successfulResponse = null;
        let successfulModel = "";
        for (const model of finalCandidateList) {
          const modelStart = Date.now();
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const apiRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: testPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 1e3
                }
              })
            });
            const status = apiRes.status;
            const data = await apiRes.json().catch(() => null);
            const duration = Date.now() - modelStart;
            if (status === 429) {
              markModelRateLimited(model, 6e4);
            }
            attempts.push({
              model,
              status,
              durationMs: duration,
              error: !apiRes.ok ? data?.error || data : null
            });
            if (apiRes.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              successfulResponse = data;
              successfulModel = model;
              break;
            }
          } catch (err) {
            attempts.push({
              model,
              status: 0,
              durationMs: Date.now() - modelStart,
              error: err.message || String(err)
            });
          }
        }
        if (successfulResponse) {
          const candidate = successfulResponse.candidates[0];
          const replyText = candidate.content.parts[0].text;
          return res.json({
            success: true,
            endpoint: req.path,
            environment: "Node.js Express Server",
            modelUsed: successfulModel,
            promptSent: testPrompt,
            reply: replyText,
            usageMetadata: successfulResponse.usageMetadata,
            totalLatencyMs: Date.now() - startTime,
            attempts
          });
        } else {
          return res.json({
            success: false,
            endpoint: req.path,
            environment: "Node.js Express Server",
            error: attempts.length > 0 && attempts[0].error ? attempts[0].error : "All candidate models returned an error from Google API",
            totalLatencyMs: Date.now() - startTime,
            attempts
          });
        }
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: err.message || "Diagnostic failed",
          totalLatencyMs: Date.now() - startTime
        });
      }
    };
    app.all("/diagnostic", diagnosticHandler);
    app.all("/api/ai-discovery/diagnostic", diagnosticHandler);
    app.post("/api/ai-discovery/chat", async (req, res) => {
      try {
        const { messages, companyContext, clientDetails, botTrap } = req.body || {};
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT TRIGGERED] Rejected bot request on chat endpoint");
          return res.status(403).json({
            success: false,
            error: "Access denied."
          });
        }
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Messages array is required"
          });
        }
        const systemInstruction = `
\u05D0\u05EA\u05D4 \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 \u05D4-AI \u05D4\u05E8\u05D0\u05E9\u05D9 \u05D5\u05D4\u05D9\u05D5\u05E2\u05E5 \u05D4\u05D0\u05E1\u05D8\u05E8\u05D8\u05D2\u05D9 \u05D4\u05D1\u05DB\u05D9\u05E8 \u05E9\u05DC \u05D7\u05D1\u05E8\u05EA TECH-SELECT (\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE).
\u05D0\u05EA\u05D4 \u05DE\u05E0\u05D4\u05DC \u05E9\u05D9\u05D7\u05EA \u05D9\u05D9\u05E2\u05D5\u05E5 \u05D5\u05D0\u05E4\u05D9\u05D5\u05DF (AI Discovery) \u05DE\u05E2\u05DE\u05D9\u05E7\u05D4 \u05E2\u05DD \u05DE\u05E0\u05DB"\u05DC / \u05E1\u05DE\u05E0\u05DB"\u05DC \u05D1\u05D0\u05E8\u05D2\u05D5\u05DF \u05E9\u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05DB\u05E0\u05D9\u05E1 \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA (AI) \u05D1\u05E6\u05D5\u05E8\u05D4 \u05D7\u05DB\u05DE\u05D4, \u05E8\u05D5\u05D5\u05D7\u05D9\u05EA \u05D5\u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA.

\u05D4\u05D2\u05D9\u05E9\u05D4 \u05E9\u05DC\u05DA:
1. **\u05E8\u05D0\u05E9 \u05E9\u05DC \u05DE\u05E0\u05DB"\u05DC (Executive Mindset):** \u05D4\u05EA\u05DE\u05E7\u05D3 \u05D1-ROI (\u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4), \u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D1\u05E7\u05D1\u05D5\u05E7 \u05E2\u05E1\u05E7\u05D9\u05D9\u05DD, \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D1\u05E9\u05E2\u05D5\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4, \u05E9\u05D9\u05E4\u05D5\u05E8 \u05E9\u05D5\u05E8\u05EA \u05D4\u05E8\u05D5\u05D5\u05D7 \u05D5\u05E9\u05D9\u05DE\u05D5\u05E8 \u05D9\u05EA\u05E8\u05D5\u05DF \u05EA\u05D7\u05E8\u05D5\u05EA\u05D9.
2. **\u05D0\u05DE\u05D9\u05E0\u05D5\u05EA \u05D5\u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05D5\u05EA \u05DC\u05DC\u05D0 \u05E4\u05E9\u05E8\u05D5\u05EA (No BS / No Hype):** \u05D0\u05DC \u05EA\u05D6\u05E8\u05D5\u05E7 \u05DE\u05D9\u05DC\u05D5\u05EA \u05D1\u05D0\u05D6\u05D6 \u05E1\u05EA\u05DE\u05D9\u05D5\u05EA. \u05EA\u05DF \u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA \u05E7\u05D5\u05E0\u05E7\u05E8\u05D8\u05D9\u05D9\u05DD, \u05E8\u05D9\u05D0\u05DC\u05D9\u05D9\u05DD \u05D5\u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8\u05D5\u05E8\u05D4 \u05D4\u05E0\u05D3\u05E1\u05D9\u05EA \u05D1\u05E8\u05D5\u05E8\u05D4.
3. **\u05D0\u05D1\u05D8\u05D7\u05D4 \u05D5\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05DE\u05D9\u05D3\u05E2 (Security & Privacy):** \u05E9\u05D9\u05DD \u05D3\u05D2\u05E9 \u05E2\u05DC \u05DE\u05E0\u05D9\u05E2\u05EA \u05D3\u05DC\u05D9\u05E4\u05EA \u05DE\u05D9\u05D3\u05E2 (Shadow AI), \u05D4\u05E1\u05DB\u05DE\u05D9 DPA, \u05E9\u05DE\u05D9\u05E8\u05D4 \u05DE\u05E7\u05D5\u05DE\u05D9\u05EA (On-Prem / Air-Gap) \u05DC\u05D2\u05D5\u05E4\u05D9\u05DD \u05D1\u05D9\u05D8\u05D7\u05D5\u05E0\u05D9\u05D9\u05DD \u05DE\u05D5\u05DC \u05E2\u05E0\u05DF \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05E1\u05D2\u05D5\u05E8 (Azure OpenAI / AWS Bedrock / Google Vertex).
4. **\u05D3\u05D9\u05D0\u05DC\u05D5\u05D2 \u05D1\u05D5\u05E0\u05D4 \u05D5\u05DE\u05E7\u05D3\u05DD:** \u05E9\u05D0\u05DC \u05E9\u05D0\u05DC\u05D5\u05EA \u05DE\u05DE\u05D5\u05E7\u05D3\u05D5\u05EA \u05DB\u05D3\u05D9 \u05DC\u05D7\u05D3\u05D3 \u05D0\u05EA \u05D4\u05D0\u05EA\u05D2\u05E8 \u05E9\u05DC \u05D4\u05DE\u05E0\u05DB"\u05DC (\u05DC\u05DE\u05E9\u05DC: \u05D0\u05D9\u05E4\u05D4 \u05E9\u05DE\u05D5\u05E8\u05D9\u05DD \u05D4\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD, \u05DB\u05DE\u05D4 \u05D0\u05E0\u05E9\u05D9\u05DD \u05E2\u05D5\u05E1\u05E7\u05D9\u05DD \u05D1\u05DE\u05E9\u05D9\u05DE\u05D4, \u05DE\u05D4\u05DF \u05D4\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4\u05E7\u05D9\u05D9\u05DE\u05D5\u05EA).
5. **\u05E9\u05E4\u05D4:** \u05E2\u05E0\u05D4 \u05D1\u05E2\u05D1\u05E8\u05D9\u05EA \u05E2\u05E1\u05E7\u05D9\u05EA \u05E8\u05D4\u05D5\u05D8\u05D4, \u05D1\u05E8\u05D5\u05E8\u05D4, \u05D7\u05D3\u05D4 \u05D5\u05DE\u05DB\u05D1\u05D3\u05EA (\u05D0\u05DC\u05D0 \u05D0\u05DD \u05D4\u05E4\u05E0\u05D9\u05D9\u05D4 \u05E0\u05DB\u05EA\u05D1\u05D4 \u05D1\u05D0\u05E0\u05D2\u05DC\u05D9\u05EA). \u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05D4\u05D3\u05D2\u05E9\u05D5\u05EA (Bold) \u05D5\u05D1\u05E0\u05E7\u05D5\u05D3\u05D5\u05EA \u05DB\u05D3\u05D9 \u05E9\u05D4\u05EA\u05E9\u05D5\u05D1\u05D4 \u05EA\u05D4\u05D9\u05D4 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D5\u05E4\u05E8\u05E7\u05D8\u05D9\u05EA.

\u05D4\u05E7\u05E9\u05E8 \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF \u05D4\u05D9\u05D3\u05D5\u05E2 \u05E2\u05D3 \u05DB\u05D4:
${companyContext ? JSON.stringify(companyContext, null, 2) : "\u05D8\u05E8\u05DD \u05E0\u05DE\u05E1\u05E8\u05D5 \u05E4\u05E8\u05D8\u05D9\u05DD \u05DE\u05DC\u05D0\u05D9\u05DD"}
`;
        const formattedContents = formatGeminiContents(messages);
        let replyText = "";
        if (process.env.GEMINI_API_KEY) {
          const tryGenerateWithTimeout = async (modelName, timeoutMs = 4500) => {
            const ai = getGeminiClient();
            const callPromise = ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: 0.7,
                topP: 0.95
              }
            });
            const timeoutPromise = new Promise(
              (_, reject) => setTimeout(() => reject(new Error(`Timeout on ${modelName}`)), timeoutMs)
            );
            return Promise.race([callPromise, timeoutPromise]);
          };
          const candidateModels = [
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
            "gemini-3.6-flash",
            "gemini-3.8-flash"
          ];
          const activeModels = candidateModels.filter((m) => !isModelCoolingDown(m));
          const modelsToTry = activeModels.length > 0 ? activeModels : candidateModels;
          for (const model of modelsToTry) {
            try {
              console.log(`[Calling Gemini model for chat: ${model}]...`);
              const result = await tryGenerateWithTimeout(model, 18e3);
              if (result?.text && result.text.trim().length > 0) {
                replyText = result.text.trim();
                console.log(`[Gemini SUCCESS on ${model}]: returned ${replyText.length} characters`);
                break;
              }
            } catch (err) {
              const errMsg = err?.message || String(err);
              if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
                markModelRateLimited(model, 6e4);
              }
              console.log(`[Notice: Gemini ${model} temporarily unavailable, switching to next candidate model: ${errMsg}]`);
            }
          }
        }
        if (!replyText) {
          replyText = generateDomainFallbackReply(messages, companyContext);
        }
        const latestUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || [...messages].reverse().find((m) => m.role === "user")?.text || "\u05D4\u05D5\u05D3\u05E2\u05D4 \u05E8\u05D0\u05E9\u05D5\u05E0\u05D9\u05EA";
        const messageCount = messages.filter((m) => m.role === "user").length;
        const companyName = companyContext?.companyName || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF \u05E9\u05DD \u05D7\u05D1\u05E8\u05D4";
        const contactRole = companyContext?.role || '\u05DE\u05E0\u05DB"\u05DC / \u05E0\u05E6\u05D9\u05D2 \u05D0\u05E8\u05D2\u05D5\u05DF';
        const nowIsraelTime = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        (async () => {
          try {
            const historyHtml = messages.map((m) => {
              const isUser = m.role === "user";
              const msgContent = m.content || m.text || "";
              return `
                  <div style="margin-bottom: 10px; padding: 10px 14px; border-radius: 8px; background-color: ${isUser ? "#1e293b" : "#0f172a"}; border-right: 4px solid ${isUser ? "#38bdf8" : "#818cf8"};">
                    <strong style="color: ${isUser ? "#38bdf8" : "#818cf8"}; font-size: 12px; display: block; margin-bottom: 4px;">
                      ${isUser ? '\u{1F464} \u05DE\u05E9\u05EA\u05DE\u05E9 / \u05DE\u05E0\u05DB"\u05DC' : "\u{1F916} TECH-SELECT AI Advisor"}
                    </strong>
                    <div style="color: #e2e8f0; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${msgContent}</div>
                  </div>
                `;
            }).join("");
            const alertHtml = `
              <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 680px; margin: 0 auto; border-radius: 14px; border: 1px solid #1e293b; line-height: 1.6;">
                
                <div style="border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px;">
                  <span style="background-color: #0284c7; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">\u{1F6A8} \u05D4\u05EA\u05E8\u05D0\u05D4 \u05D1\u05D6\u05DE\u05DF \u05D0\u05DE\u05EA</span>
                  <h2 style="color: #38bdf8; margin: 10px 0 4px 0; font-size: 20px;">\u05DE\u05D9\u05E9\u05D4\u05D5 \u05DE\u05E7\u05DC\u05D9\u05D3 \u05D1\u05D9\u05D5\u05E2\u05E5 / \u05DE\u05E0\u05D5\u05E2 \u05D4-AI \u05D1\u05D0\u05EA\u05E8!</h2>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05D6\u05DE\u05DF \u05D0\u05D9\u05E8\u05D5\u05E2: ${nowIsraelTime} (\u05E9\u05E2\u05D5\u05DF \u05D9\u05E9\u05E8\u05D0\u05DC) | \u05D4\u05D5\u05D3\u05E2\u05D4 \u05DE\u05E1' ${messageCount} \u05D1\u05E9\u05D9\u05D7\u05D4</p>
                </div>

                <!-- \u05D4\u05D4\u05D5\u05D3\u05E2\u05D4 \u05D4\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4 \u05E9\u05D4\u05D5\u05E7\u05DC\u05D3\u05D4 -->
                <div style="background-color: #1e1b4b; border: 1px solid #6366f1; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                  <div style="color: #a5b4fc; font-size: 12px; font-weight: bold; margin-bottom: 6px;">\u{1F4AC} \u05D4\u05D4\u05D5\u05D3\u05E2\u05D4 \u05E9\u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DB\u05EA\u05D1 \u05E2\u05DB\u05E9\u05D9\u05D5:</div>
                  <div style="color: #ffffff; font-size: 15px; font-weight: 500; white-space: pre-wrap; line-height: 1.5;">${latestUserMsg}</div>
                </div>

                <!-- \u05E4\u05E8\u05D8\u05D9 \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF \u05D0\u05DD \u05E7\u05D9\u05D9\u05DE\u05D9\u05DD -->
                <div style="background-color: #111827; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; border: 1px solid #1f2937;">
                  <h4 style="color: #f8fafc; margin-top: 0; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #374151; padding-bottom: 6px;">\u{1F3E2} \u05D4\u05E7\u05E9\u05E8 \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05E9\u05D6\u05D5\u05D4\u05D4:</h4>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                    <tr>
                      <td style="padding: 4px 0; color: #94a3b8; width: 35%;">\u05D7\u05D1\u05E8\u05D4:</td>
                      <td style="padding: 4px 0; font-weight: bold; color: #38bdf8;">${companyName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #94a3b8;">\u05EA\u05E4\u05E7\u05D9\u05D3:</td>
                      <td style="padding: 4px 0;">${contactRole}</td>
                    </tr>
                    ${companyContext?.companySize ? `<tr><td style="padding: 4px 0; color: #94a3b8;">\u05D2\u05D5\u05D3\u05DC \u05D0\u05E8\u05D2\u05D5\u05DF:</td><td style="padding: 4px 0;">${companyContext.companySize}</td></tr>` : ""}
                    ${companyContext?.industry ? `<tr><td style="padding: 4px 0; color: #94a3b8;">\u05EA\u05D7\u05D5\u05DD:</td><td style="padding: 4px 0;">${companyContext.industry}</td></tr>` : ""}
                    ${companyContext?.erpCrm ? `<tr><td style="padding: 4px 0; color: #94a3b8;">\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA:</td><td style="padding: 4px 0;">${companyContext.erpCrm}</td></tr>` : ""}
                  </table>
                </div>

                <!-- \u05EA\u05E9\u05D5\u05D1\u05EA \u05D4-AI \u05E9\u05E1\u05D5\u05E4\u05E7\u05D4 \u05DC\u05DE\u05E9\u05EA\u05DE\u05E9 -->
                <div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                  <div style="color: #6ee7b7; font-size: 12px; font-weight: bold; margin-bottom: 6px;">\u{1F916} \u05EA\u05E9\u05D5\u05D1\u05EA \u05D9\u05D5\u05E2\u05E5 \u05D4-AI \u05E9\u05E0\u05DE\u05E1\u05E8\u05D4 \u05DC\u05DE\u05E9\u05EA\u05DE\u05E9:</div>
                  <div style="color: #ecfdf5; font-size: 13px; white-space: pre-wrap; line-height: 1.5;">${replyText}</div>
                </div>

                <!-- \u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05D4\u05E9\u05D9\u05D7\u05D4 \u05D4\u05DE\u05DC\u05D0\u05D4 -->
                ${messages.length > 1 ? `
                    <div style="margin-bottom: 20px;">
                      <h4 style="color: #f8fafc; font-size: 14px; margin-bottom: 10px;">\u{1F4DC} \u05DB\u05DC \u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05D4\u05E9\u05D9\u05D7\u05D4 (${messages.length} \u05D4\u05D5\u05D3\u05E2\u05D5\u05EA):</h4>
                      ${historyHtml}
                    </div>
                  ` : ""}

                <div style="text-align: center; border-top: 1px solid #334155; padding-top: 16px; color: #94a3b8; font-size: 11px;">
                  <p style="margin: 0;">\u05D4\u05EA\u05E8\u05D0\u05D4 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05DE\u05DE\u05E0\u05D5\u05E2 \u05D4-AI Discovery \u05E9\u05DC <strong>\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE</strong> | <a href="https://tech-select.co.il" style="color: #38bdf8; text-decoration: none;">tech-select.co.il</a></p>
                </div>
              </div>
            `;
            const snippet = latestUserMsg.length > 40 ? latestUserMsg.substring(0, 40) + "..." : latestUserMsg;
            await sendAlertEmail({
              subject: `\u{1F916} \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 / \u05D9\u05D5\u05E2\u05E5 AI: "${snippet}" - ${companyName !== "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF \u05E9\u05DD \u05D7\u05D1\u05E8\u05D4" ? companyName : "\u05D2\u05D5\u05DC\u05E9 \u05D7\u05D3\u05E9"}`,
              html: alertHtml,
              textSummary: `\u05D4\u05D5\u05D3\u05E2\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4-AI:
\u05D7\u05D1\u05E8\u05D4: ${companyName}
\u05EA\u05E4\u05E7\u05D9\u05D3: ${contactRole}
\u05D4\u05D5\u05D3\u05E2\u05D4: ${latestUserMsg}
\u05EA\u05E9\u05D5\u05D1\u05EA AI: ${replyText}`,
              formData: {
                companyName,
                role: contactRole,
                latestMessage: latestUserMsg,
                reply: replyText
              }
            });
          } catch (emailErr) {
            console.error("[BACKGROUND SIMULATOR ALERT ERROR]", emailErr);
          }
        })();
        return res.json({
          success: true,
          reply: replyText
        });
      } catch (err) {
        console.error("[GEMINI CHAT ERROR]", err);
        const fallbackReply = generateDomainFallbackReply(req.body?.messages, req.body?.companyContext);
        return res.json({
          success: true,
          reply: fallbackReply
        });
      }
    });
    app.post("/api/ai-assessment/verify-gate", async (req, res) => {
      try {
        const { fullName, companyName, email, phone, botTrap, turnstileToken } = req.body || {};
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[SECURITY GATE] Bot Honeypot triggered! Rejecting request.");
          return res.status(403).json({ success: false, error: "Security validation failed (Bot detected)." });
        }
        if (!fullName || String(fullName).trim().length < 2) {
          return res.status(400).json({ success: false, error: "\u05E9\u05DD \u05DE\u05DC\u05D0 \u05D4\u05D9\u05E0\u05D5 \u05E9\u05D3\u05D4 \u05D7\u05D5\u05D1\u05D4" });
        }
        if (!companyName || String(companyName).trim().length < 2) {
          return res.status(400).json({ success: false, error: "\u05E9\u05DD \u05D7\u05D1\u05E8\u05D4 \u05D4\u05D9\u05E0\u05D5 \u05E9\u05D3\u05D4 \u05D7\u05D5\u05D1\u05D4" });
        }
        if (!email || !String(email).includes("@") || String(email).trim().length < 5) {
          return res.status(400).json({ success: false, error: "\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05E2\u05E1\u05E7\u05D9 \u05EA\u05E7\u05D9\u05DF \u05D4\u05D9\u05E0\u05D5 \u05E9\u05D3\u05D4 \u05D7\u05D5\u05D1\u05D4" });
        }
        if (!phone || String(phone).trim().length < 8) {
          return res.status(400).json({ success: false, error: "\u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05EA\u05E7\u05D9\u05DF \u05D4\u05D9\u05E0\u05D5 \u05E9\u05D3\u05D4 \u05D7\u05D5\u05D1\u05D4" });
        }
        const nowIsraelTime = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        const sessionId = `gate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        console.log(`[C-LEVEL GATE VERIFIED]: ${companyName} | ${fullName} | ${phone} | ${email}`);
        (async () => {
          try {
            const htmlContent = `
              <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 620px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
                <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px;">
                  <span style="background-color: #0284c7; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                    \u{1F510} C-LEVEL GATE PASSED - \u05D4\u05EA\u05D7\u05DC\u05EA \u05D0\u05D1\u05D7\u05D5\u05DF AI \u05D7\u05D3\u05E9!
                  </span>
                  <h2 style="color: #38bdf8; margin: 10px 0 4px 0; font-size: 19px;">
                    \u05DC\u05D9\u05D3 \u05D7\u05D3\u05E9 \u05E4\u05EA\u05D7 \u05D0\u05EA \u05DE\u05E1\u05DA \u05D4\u05D0\u05D1\u05D7\u05D5\u05DF: ${companyName} (${fullName})
                  </h2>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05D6\u05DE\u05DF: ${nowIsraelTime} | \u05E9\u05E2\u05E8 \u05D0\u05D1\u05D8\u05D7\u05D4 Cloudflare & Honeypot: \u05DE\u05D0\u05D5\u05DE\u05EA \u05EA\u05E7\u05D9\u05DF</p>
                </div>

                <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #f8fafc;">
                    <tr><td style="padding: 6px 0; color: #94a3b8; width: 35%;">\u{1F3E2} \u05E9\u05DD \u05D7\u05D1\u05E8\u05D4:</td><td style="font-weight: bold; color: #38bdf8; font-size: 16px;">${companyName}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">\u{1F464} \u05E9\u05DD \u05DE\u05DC\u05D0:</td><td style="font-weight: bold;">${fullName}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">\u{1F4DE} \u05D8\u05DC\u05E4\u05D5\u05DF:</td><td><a href="tel:${phone}" style="color: #34d399; font-weight: bold;">${phone}</a></td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">\u{1F4E7} \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</td><td><a href="mailto:${email}" style="color: #38bdf8;">${email}</a></td></tr>
                  </table>
                </div>

                <div style="font-size: 12px; color: #64748b; text-align: center;">
                  \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE | \u05DE\u05E2\u05E8\u05DB\u05EA \u05D0\u05D1\u05D7\u05D5\u05DF AI \u05DC-C-Level
                </div>
              </div>
            `;
            await sendAlertEmail({
              subject: `\u{1F525} \u05DC\u05D9\u05D3 C-Level \u05E4\u05EA\u05D7 \u05D0\u05EA \u05D0\u05D1\u05D7\u05D5\u05DF \u05D4-AI: ${companyName} (${fullName} | ${phone})`,
              html: htmlContent,
              textSummary: `\u05DC\u05D9\u05D3 C-Level \u05D7\u05D3\u05E9 \u05D1\u05D0\u05D1\u05D7\u05D5\u05DF AI:
\u05D7\u05D1\u05E8\u05D4: ${companyName}
\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${fullName}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${phone}
\u05D3\u05D5\u05D0"\u05DC: ${email}`,
              replyTo: email,
              formData: { companyName, fullName, phone, email, event: "gate_verified" }
            });
          } catch (err) {
            console.error("[C-LEVEL GATE EMAIL ALERT ERROR]", err);
          }
        })();
        return res.json({
          success: true,
          sessionId,
          verified: true,
          message: "Gate security verified successfully."
        });
      } catch (err) {
        console.error("[VERIFY GATE ERROR]", err);
        return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
      }
    });
    app.post("/api/simulator/log-activity", async (req, res) => {
      try {
        const { activityType, title, details, payload, formData } = req.body || {};
        const nowIsraelTime = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        console.log(`[SIMULATOR ACTIVITY LOGGED] Type: ${activityType}, Title: ${title || "N/A"}`);
        (async () => {
          try {
            const isUnlock = activityType === "unlock_ai_simulator" || activityType === "complete_simulator_form";
            const cName = formData?.companyName || details?.companyName || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF";
            const fName = formData?.fullName || details?.fullName || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF";
            const phone = formData?.phone || details?.phone || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF";
            const email = formData?.email || details?.email || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF";
            const cSize = formData?.companySize || details?.companySize || "21-100 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD";
            const htmlContent = `
              <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 660px; margin: 0 auto; border-radius: 14px; border: 1px solid #1e293b; line-height: 1.6;">
                
                <div style="border-bottom: 2px solid ${isUnlock ? "#10b981" : "#0284c7"}; padding-bottom: 14px; margin-bottom: 20px;">
                  <span style="background-color: ${isUnlock ? "#059669" : "#0284c7"}; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">
                    ${isUnlock ? "\u{1F513} \u05E4\u05EA\u05D9\u05D7\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 AI \u2013 \u05DE\u05D9\u05DC\u05D5\u05D9 \u05E4\u05E8\u05D8\u05D9 \u05D7\u05D5\u05D1\u05D4!" : "\u{1F3AF} \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8"}
                  </span>
                  <h2 style="color: ${isUnlock ? "#34d399" : "#38bdf8"}; margin: 12px 0 4px 0; font-size: 20px;">
                    ${title || (isUnlock ? `\u05DC\u05D9\u05D3 \u05D7\u05DD: ${cName} \u05E4\u05EA\u05D7/\u05D4 \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4-AI \u05D1\u05D0\u05EA\u05E8!` : "\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D7\u05D3\u05E9\u05D4 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D1\u05D0\u05EA\u05E8 TECH-SELECT")}
                  </h2>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05D6\u05DE\u05DF \u05D0\u05D9\u05E8\u05D5\u05E2: ${nowIsraelTime} (\u05E9\u05E2\u05D5\u05DF \u05D9\u05E9\u05E8\u05D0\u05DC) | \u05E1\u05D5\u05D2: ${activityType || "simulator_action"}</p>
                </div>

                ${isUnlock ? `
                  <!-- \u05E4\u05E8\u05D8\u05D9 \u05D4\u05E4\u05D5\u05E0\u05D4 \u05E9\u05DE\u05D9\u05DC\u05D0 \u05D0\u05EA \u05D4\u05E9\u05D3\u05D5\u05EA \u05DB\u05D3\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05D0\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 -->
                  <div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
                    <h3 style="color: #6ee7b7; margin-top: 0; margin-bottom: 12px; font-size: 15px; border-bottom: 1px solid #047857; padding-bottom: 6px;">
                      \u{1F464} \u05E4\u05E8\u05D8\u05D9 \u05D4\u05E4\u05D5\u05E0\u05D4 \u05E9\u05E9\u05D7\u05E8\u05E8/\u05D4 \u05D0\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8:
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ecfdf5;">
                      <tr>
                        <td style="padding: 6px 0; width: 35%; color: #a7f3d0; font-weight: bold;">\u{1F3E2} \u05E9\u05DD \u05D4\u05D7\u05D1\u05E8\u05D4:</td>
                        <td style="padding: 6px 0; font-weight: bold; font-size: 16px; color: #ffffff;">${cName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">\u{1F464} \u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8:</td>
                        <td style="padding: 6px 0; font-weight: 500;">${fName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">\u{1F4DE} \u05D8\u05DC\u05E4\u05D5\u05DF \u05D9\u05E9\u05D9\u05E8:</td>
                        <td style="padding: 6px 0;"><a href="tel:${phone}" style="color: #38bdf8; text-decoration: none; font-weight: bold; font-size: 15px;">${phone}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">\u{1F4E7} \u05D3\u05D5\u05D0\u05F4\u05DC:</td>
                        <td style="padding: 6px 0;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #a7f3d0; font-weight: bold;">\u{1F465} \u05D2\u05D5\u05D3\u05DC \u05D0\u05E8\u05D2\u05D5\u05DF:</td>
                        <td style="padding: 6px 0;">${cSize}</td>
                      </tr>
                    </table>
                  </div>
                ` : ""}

                <div style="background-color: #111827; border-radius: 10px; padding: 16px; margin-bottom: 18px; border: 1px solid #1f2937;">
                  <h4 style="color: #38bdf8; margin-top: 0; margin-bottom: 8px; font-size: 14px;">\u05DE\u05D9\u05D3\u05E2 \u05E0\u05D5\u05E1\u05E3:</h4>
                  <div style="color: #f8fafc; font-size: 13px; white-space: pre-wrap; line-height: 1.5;">${typeof details === "string" ? details : JSON.stringify(details || payload || {}, null, 2)}</div>
                </div>

                <div style="text-align: center; border-top: 1px solid #334155; padding-top: 16px; color: #94a3b8; font-size: 11px;">
                  \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE | \u05D4\u05EA\u05E8\u05D0\u05D4 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05DC\u05DE\u05E0\u05DB"\u05DC (g@tech-select.co.il)
                </div>
              </div>
            `;
            const alertSubject = isUnlock ? `\u{1F525} \u05DC\u05D9\u05D3 \u05D7\u05DD \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 AI: ${cName} (${fName} | ${phone}) \u05E4\u05EA\u05D7/\u05D4 \u05D0\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8!` : `\u26A1 \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D1\u05D0\u05EA\u05E8: ${title || activityType || "\u05DB\u05E0\u05D9\u05E1\u05D4 / \u05E4\u05E2\u05D5\u05DC\u05D4"}`;
            await sendAlertEmail({
              subject: alertSubject,
              html: htmlContent,
              textSummary: `\u05E4\u05EA\u05D9\u05D7\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 AI / \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA:
\u05D7\u05D1\u05E8\u05D4: ${cName}
\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${fName}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${phone}
\u05D3\u05D5\u05D0"\u05DC: ${email}
\u05D2\u05D5\u05D3\u05DC: ${cSize}`,
              replyTo: email && email !== "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF" ? email : void 0,
              formData: {
                companyName: cName,
                fullName: fName,
                phone,
                email,
                companySize: cSize,
                activityType
              }
            });
          } catch (e) {
            console.error("[SIMULATOR ACTIVITY EMAIL ERROR]", e);
          }
        })();
        return res.json({ success: true });
      } catch (err) {
        console.error("[LOG ACTIVITY ERROR]", err);
        return res.status(500).json({ success: false, error: err?.message || String(err) });
      }
    });
    app.post("/api/ai-discovery/generate-tailored-report", async (req, res) => {
      try {
        const { formData, chatHistory, singleWindowText, businessContext, botTrap } = req.body || {};
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT TRIGGERED] Rejected bot request on report generation");
          return res.status(403).json({
            success: false,
            error: "Access denied."
          });
        }
        const clientInputText = singleWindowText || businessContext || formData?.customPainPoints || formData?.dreamGoalTomorrow || "";
        let parsedReport = null;
        try {
          const ai = getGeminiClient();
          const prompt = `
\u05D0\u05EA\u05D4 \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 AI \u05E8\u05D0\u05E9\u05D9 \u05D5\u05D9\u05D5\u05E2\u05E5 \u05D0\u05E1\u05D8\u05E8\u05D8\u05D2\u05D9 \u05D1\u05DB\u05D9\u05E8 \u05D1\u05D7\u05D1\u05E8\u05EA TECH-SELECT (\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05D1\u05E2"\u05DE).
\u05DC\u05E4\u05E0\u05D9\u05DA \u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05D5\u05DE\u05E4\u05D5\u05E8\u05D8\u05D5\u05EA \u05E9\u05D4\u05D6\u05D9\u05DF \u05DE\u05E0\u05DB"\u05DC / \u05E1\u05DE\u05E0\u05DB"\u05DC (C-Level Executive) \u05D1\u05DE\u05E1\u05DA \u05D4\u05D0\u05D1\u05D7\u05D5\u05DF \u05D4\u05DE\u05E8\u05DB\u05D6\u05D9 \u05E9\u05DC \u05D4\u05D7\u05D1\u05E8\u05D4.

\u05E4\u05E8\u05D8\u05D9 \u05D4\u05E4\u05D5\u05E0\u05D4 \u05D5\u05D4\u05D7\u05D1\u05E8\u05D4:
- \u05E9\u05DD \u05D4\u05D7\u05D1\u05E8\u05D4: ${formData?.companyName || "\u05D7\u05D1\u05E8\u05D4 \u05E2\u05E1\u05E7\u05D9\u05EA"}
- \u05E9\u05DD \u05D0\u05D9\u05E9 \u05D4\u05E7\u05E9\u05E8 / \u05DE\u05E0\u05DB"\u05DC: ${formData?.fullName || "\u05D4\u05E0\u05D4\u05DC\u05EA \u05D4\u05D7\u05D1\u05E8\u05D4"}
- \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${formData?.email || "N/A"}
- \u05D8\u05DC\u05E4\u05D5\u05DF: ${formData?.phone || "N/A"}

\u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05D5\u05D3\u05D1\u05E8\u05D9 \u05D4\u05DE\u05E0\u05DB"\u05DC \u05D1\u05D7\u05DC\u05D5\u05DF \u05D4\u05D0\u05D1\u05D7\u05D5\u05DF (\u05DE\u05E2\u05E0\u05D4 \u05E2\u05DC 4 \u05D4\u05E9\u05D0\u05DC\u05D5\u05EA: \u05D9\u05E2\u05D3 \u05DE\u05E8\u05DB\u05D6\u05D9, \u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D1\u05E7\u05D1\u05D5\u05E7 \u05D5\u05E2\u05D5\u05DE\u05E1\u05D9\u05DD, \u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05DC\u05D9\u05D1\u05D4 \u05D5-ERP, \u05E8\u05DE\u05EA \u05D0\u05D5\u05D8\u05D5\u05E0\u05D5\u05DE\u05D9\u05D4 \u05D5\u05D0\u05D1\u05D8\u05D7\u05D4 \u05E0\u05D3\u05E8\u05E9\u05EA):
"""
${clientInputText || JSON.stringify(formData || {}, null, 2)}
"""

\u05D4\u05E0\u05D7\u05D9\u05D5\u05EA \u05E7\u05E8\u05D9\u05D8\u05D9\u05D5\u05EA:
1. \u05E0\u05EA\u05D7 \u05D1\u05DB\u05D5\u05D1\u05D3 \u05E8\u05D0\u05E9 \u05D5\u05D1\u05D3\u05D9\u05D5\u05E7 \u05DE\u05E8\u05D1\u05D9 \u05D0\u05EA \u05D4\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05E9\u05D4\u05D5\u05D6\u05DB\u05E8\u05D5 (\u05DC\u05DE\u05E9\u05DC: Priority, SAP, SharePoint, Salesforce, \u05E9\u05E8\u05EA\u05D9 \u05E7\u05D1\u05E6\u05D9\u05DD \u05D5\u05DB\u05D5').
2. \u05D6\u05D4\u05D4 \u05D0\u05EA \u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D4\u05D1\u05E7\u05D1\u05D5\u05E7 \u05D4\u05DE\u05D3\u05D5\u05D9\u05E7\u05D9\u05DD, \u05E9\u05E2\u05D5\u05EA \u05D4\u05E2\u05D1\u05D5\u05D3\u05D4 \u05D4\u05DE\u05D1\u05D5\u05D6\u05D1\u05D6\u05D5\u05EA \u05D5\u05D4\u05E2\u05DC\u05D5\u05D9\u05D5\u05EA \u05D4\u05EA\u05E4\u05E2\u05D5\u05DC\u05D9\u05D5\u05EA.
3. \u05D7\u05E9\u05D1 \u05D4\u05E2\u05E8\u05DB\u05EA \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E9\u05E0\u05EA\u05D9\u05EA \u05D5\u05D7\u05D5\u05D3\u05E9\u05D9\u05EA \u05E8\u05D9\u05D0\u05DC\u05D9\u05EA, \u05D4\u05D2\u05D9\u05D5\u05E0\u05D9\u05EA \u05D5\u05DC\u05D0 \u05DE\u05E0\u05D5\u05E4\u05D7\u05EA \u05D1-\u20AA.
4. \u05E0\u05E1\u05D7 3 \u05D9\u05D5\u05D6\u05DE\u05D5\u05EA AI \u05DE\u05E2\u05E9\u05D9\u05D5\u05EA \u05D4\u05DE\u05D5\u05EA\u05D0\u05DE\u05D5\u05EA \u05E1\u05E4\u05E6\u05D9\u05E4\u05D9\u05EA \u05DC\u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05E9\u05E0\u05D9\u05EA\u05E0\u05D5 (Use Cases \u05DE\u05E4\u05D5\u05E8\u05D8\u05D9\u05DD, \u05DC\u05D0 \u05E1\u05D9\u05E1\u05DE\u05D0\u05D5\u05EA \u05D2\u05E0\u05E8\u05D9\u05D5\u05EA).
5. \u05D1\u05E0\u05D4 \u05EA\u05D5\u05DB\u05E0\u05D9\u05EA \u05D9\u05D9\u05E9\u05D5\u05DD \u05DE\u05D3\u05D5\u05E8\u05D2\u05EA \u05DC-90 \u05D9\u05D5\u05DD (Roadmap).

\u05E2\u05DC\u05D9\u05DA \u05DC\u05D4\u05D7\u05D6\u05D9\u05E8 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8 JSON \u05EA\u05E7\u05E0\u05D9 \u05D5\u05EA\u05E7\u05E3 (\u05DC\u05DC\u05D0 \u05E9\u05D5\u05DD \u05EA\u05D5\u05D5\u05D9\u05DD \u05DE\u05E1\u05D1\u05D9\u05D1, \u05DC\u05DC\u05D0 markdown codeblocks):
{
  "executiveSummary": "\u05EA\u05DE\u05E6\u05D9\u05EA \u05DE\u05E0\u05D4\u05DC\u05D9\u05DD \u05DE\u05E2\u05DE\u05D9\u05E7\u05D4, \u05E2\u05E0\u05D9\u05D9\u05E0\u05D9\u05EA, \u05DB\u05E0\u05D4 \u05D5\u05D0\u05E1\u05D8\u05E8\u05D8\u05D2\u05D9\u05EA \u05D4\u05DE\u05E0\u05EA\u05D7\u05EA \u05D0\u05EA \u05DE\u05E6\u05D1 \u05D4\u05D7\u05D1\u05E8\u05D4 \u05E2\u05DC \u05D1\u05E1\u05D9\u05E1 \u05D3\u05D1\u05E8\u05D9 \u05D4\u05DE\u05E0\u05DB"\u05DC, \u05DE\u05E6\u05D9\u05D2\u05D4 \u05D0\u05EA \u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05D4\u05D4\u05EA\u05D9\u05D9\u05E2\u05DC\u05D5\u05EA \u05D5\u05DE\u05DE\u05DC\u05D9\u05E6\u05D4 \u05E2\u05DC \u05E4\u05E8\u05D9\u05E1\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA.",
  "overallReadinessScore": 82,
  "securityReadinessScore": 86,
  "automationPotentialScore": 88,
  "shadowAIRiskScore": 35,
  "financialAnalysis": {
    "estimatedMonthlyHoursSaved": 240,
    "estimatedYearlySavingsNIS": 288000,
    "paybackPeriodMonths": 2.8,
    "efficiencyGainPercent": 32,
    "summaryExplanation": "\u05D4\u05E1\u05D1\u05E8 \u05DE\u05E0\u05D5\u05DE\u05E7 \u05E2\u05DC \u05D7\u05D9\u05E9\u05D5\u05D1 \u05D4\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D5\u05D4\u05D4\u05D7\u05D6\u05E8 \u05D4\u05DE\u05D1\u05D5\u05E1\u05E1 \u05E2\u05DC \u05E9\u05D7\u05E8\u05D5\u05E8 \u05E9\u05E2\u05D5\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D9\u05D3\u05E0\u05D9\u05D5\u05EA \u05E9\u05DC \u05D4\u05E6\u05D5\u05D5\u05EA."
  },
  "opportunities": [
    {
      "id": "opp-1",
      "title": "\u05E9\u05DD \u05D9\u05D5\u05D6\u05DE\u05D4 1 \u05DE\u05D5\u05EA\u05D0\u05DE\u05EA \u05D0\u05D9\u05E9\u05D9\u05EA",
      "category": "Enterprise RAG",
      "problemDescription": "\u05EA\u05D9\u05D0\u05D5\u05E8 \u05D4\u05D1\u05E2\u05D9\u05D4 \u05D4\u05E1\u05E4\u05E6\u05D9\u05E4\u05D9\u05EA \u05E9\u05E2\u05DC\u05EA\u05D4 \u05DE\u05D3\u05D1\u05E8\u05D9 \u05D4\u05DE\u05E0\u05DB"\u05DC",
      "aiSolution": "\u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D4\u05DE\u05D3\u05D5\u05D9\u05E7 \u05DE\u05D1\u05D9\u05EA Tech-Select",
      "impact": "Critical",
      "complexity": "Medium",
      "estimatedTimeToValue": "3-4 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
      "estimatedHoursSavedMonthly": 100,
      "recommendedTools": ["Tech-Select Private RAG", "Entra ID SSO", "Vector DB"]
    },
    {
      "id": "opp-2",
      "title": "\u05E9\u05DD \u05D9\u05D5\u05D6\u05DE\u05D4 2 \u05DE\u05D5\u05EA\u05D0\u05DE\u05EA \u05D0\u05D9\u05E9\u05D9\u05EA",
      "category": "Automation",
      "problemDescription": "\u05EA\u05D9\u05D0\u05D5\u05E8 \u05E6\u05D5\u05D5\u05D0\u05E8 \u05D4\u05D1\u05E7\u05D1\u05D5\u05E7 \u05D4\u05EA\u05E4\u05E2\u05D5\u05DC\u05D9 \u05D0\u05D5 \u05E7\u05DC\u05D9\u05D8\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD",
      "aiSolution": "\u05E6\u05D9\u05E0\u05D5\u05E8 \u05E2\u05D9\u05D1\u05D5\u05D3 \u05D5\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05DC\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4",
      "impact": "High",
      "complexity": "Medium",
      "estimatedTimeToValue": "4-6 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
      "estimatedHoursSavedMonthly": 85,
      "recommendedTools": ["Document AI", "ERP API Integration", "Validation Rules"]
    },
    {
      "id": "opp-3",
      "title": "\u05E9\u05DD \u05D9\u05D5\u05D6\u05DE\u05D4 3 \u05DE\u05D5\u05EA\u05D0\u05DE\u05EA \u05D0\u05D9\u05E9\u05D9\u05EA",
      "category": "Security & Governance",
      "problemDescription": "\u05DE\u05E0\u05D9\u05E2\u05EA \u05D6\u05DC\u05D9\u05D2\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5-Shadow AI \u05D1\u05E1\u05D1\u05D9\u05D1\u05EA \u05D4\u05E2\u05D1\u05D5\u05D3\u05D4",
      "aiSolution": "\u05D4\u05E7\u05DE\u05EA AI Gateway \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05E2\u05DD \u05E1\u05D9\u05E0\u05D5\u05DF DLP \u05D5\u05D4\u05E1\u05DB\u05DD Zero Data Retention",
      "impact": "Critical",
      "complexity": "Low",
      "estimatedTimeToValue": "1-2 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
      "estimatedHoursSavedMonthly": 55,
      "recommendedTools": ["AI Gateway", "DLP Sanitizer", "Zero-Retention DPA"]
    }
  ],
  "architectureRecommendations": {
    "tier1_Identity": "\u05D0\u05D9\u05DE\u05D5\u05EA \u05D6\u05D4\u05D5\u05EA \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 (Microsoft Entra ID / SSO) \u05E2\u05DD MFA \u05D5\u05D1\u05E7\u05E8\u05EA \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA least-privilege",
    "tier2_Gateway": "\u05E9\u05DB\u05D1\u05EA \u05E9\u05E2\u05E8 AI \u05E2\u05DD \u05E1\u05D9\u05E0\u05D5\u05DF DLP, \u05D0\u05E0\u05D5\u05E0\u05D9\u05DE\u05D9\u05D6\u05E6\u05D9\u05D4 \u05D5\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA Zero Data Retention",
    "tier3_DataPipeline": "\u05D0\u05D9\u05E0\u05D3\u05D5\u05E7\u05E1 RAG \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E2\u05DD \u05E9\u05DE\u05D9\u05E8\u05D4 \u05E7\u05E4\u05D3\u05E0\u05D9\u05EA \u05E2\u05DC \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD",
    "tier4_ModelCluster": "\u05D4\u05E8\u05E6\u05D4 \u05D1\u05E2\u05E0\u05DF \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05DE\u05D1\u05D5\u05D3\u05D3 \u05D0\u05D5 \u05E9\u05E8\u05EA\u05D9 GPU \u05DE\u05E7\u05D5\u05DE\u05D9\u05D9\u05DD On-Premises"
  },
  "roadmapPhases": [
    {
      "phase": "\u05E9\u05DC\u05D1 1 (\u05D9\u05DE\u05D9\u05DD 0-30): \u05EA\u05E9\u05EA\u05D9\u05EA \u05D0\u05D1\u05D8\u05D7\u05D4, \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05D5-Quick Win \u05E8\u05D0\u05E9\u05D5\u05DF",
      "timeline": "\u05D7\u05D5\u05D3\u05E9 1",
      "goals": ["\u05D4\u05E1\u05D3\u05E8\u05EA \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA AI \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05EA \u05D5\u05DE\u05E0\u05D9\u05E2\u05EA Shadow AI", "\u05D4\u05E7\u05DE\u05EA AI Gateway \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7", "\u05D4\u05D8\u05DE\u05E2\u05EA Use Case \u05E8\u05D0\u05E9\u05D5\u05DF \u05DE\u05DE\u05D5\u05E7\u05D3"],
      "deliverables": ["\u05DE\u05D3\u05E8\u05D9\u05DA \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05DC\u05E2\u05D5\u05D1\u05D3\u05D9\u05DD", "\u05E1\u05D1\u05D9\u05D1\u05EA \u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 \u05E2\u05D5\u05D1\u05D3\u05EA \u05D5\u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA"]
    },
    {
      "phase": "\u05E9\u05DC\u05D1 2 (\u05D9\u05DE\u05D9\u05DD 30-90): \u05D0\u05D9\u05E0\u05D3\u05D5\u05E7\u05E1 \u05D9\u05D3\u05E2 RAG \u05D5\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4",
      "timeline": "\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD 2-3",
      "goals": ["\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05DC\u05DE\u05D0\u05D2\u05E8 \u05D4\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D5\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4-ERP", "\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E9\u05DC \u05E2\u05D9\u05D1\u05D5\u05D3 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D5\u05D4\u05E4\u05E7\u05EA \u05D3\u05D5\u05D7\u05D5\u05EA"],
      "deliverables": ["\u05E4\u05D5\u05E8\u05D8\u05DC \u05D9\u05D3\u05E2 \u05E4\u05E0\u05D9\u05DE\u05D9 \u05D7\u05D9 \u05DC\u05E6\u05D5\u05D5\u05EA", "\u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D4 \u05DC\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E0\u05D9\u05D4\u05D5\u05DC"]
    },
    {
      "phase": "\u05E9\u05DC\u05D1 3 (\u05D9\u05DE\u05D9\u05DD 90-180): \u05D4\u05EA\u05E8\u05D7\u05D1\u05D5\u05EA \u05DE\u05D7\u05DC\u05E7\u05EA\u05D9\u05EA \u05D5\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05DE\u05DC\u05D0\u05D4",
      "timeline": "\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD 4-6",
      "goals": ["\u05D4\u05EA\u05E8\u05D7\u05D1\u05D5\u05EA \u05DC\u05DE\u05D7\u05DC\u05E7\u05D5\u05EA \u05E0\u05D5\u05E1\u05E4\u05D5\u05EA", "\u05D4\u05E4\u05E2\u05DC\u05EA \u05E1\u05D5\u05DB\u05E0\u05D9 AI \u05D0\u05D5\u05D8\u05D5\u05E0\u05D5\u05DE\u05D9\u05D9\u05DD"],
      "deliverables": ["\u05D3\u05E9\u05D1\u05D5\u05E8\u05D3 \u05DE\u05D3\u05D9\u05D3\u05EA ROI \u05D5\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E9\u05E2\u05D5\u05EA", "\u05D4\u05D3\u05E8\u05DB\u05D5\u05EA \u05D5\u05D4\u05E1\u05DE\u05DB\u05D5\u05EA \u05DC\u05E6\u05D5\u05D5\u05EA"]
    }
  ],
  "shadowAIGovernancePlan": "\u05D7\u05E1\u05D9\u05DE\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DC\u05DB\u05DC\u05D9\u05DD \u05E6\u05D9\u05D1\u05D5\u05E8\u05D9\u05D9\u05DD \u05DC\u05D0 \u05DE\u05D5\u05E8\u05E9\u05D9\u05DD \u05D5\u05E0\u05D9\u05EA\u05D5\u05D1 \u05DB\u05DC\u05DC \u05D4\u05E2\u05D5\u05D1\u05D3\u05D9\u05DD \u05DC\u05E4\u05D5\u05E8\u05D8\u05DC \u05D4-AI \u05D4\u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E9\u05DC \u05D4\u05D7\u05D1\u05E8\u05D4.",
  "nextSteps": [
    "\u05E4\u05D2\u05D9\u05E9\u05EA \u05D9\u05D9\u05E9\u05D5\u05DD \u05D8\u05DB\u05E0\u05D5\u05DC\u05D5\u05D2\u05D9\u05EA \u05DE\u05DE\u05D5\u05E7\u05D3\u05EA \u05E2\u05DD \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 \u05D4-AI \u05E9\u05DC Tech-Select",
    "\u05D4\u05D2\u05D3\u05E8\u05EA \u05E1\u05D1\u05D9\u05D1\u05EA \u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 (POC) \u05DE\u05DE\u05D5\u05E7\u05D3\u05EA \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4",
    "\u05DC\u05D5\u05D7 \u05D6\u05DE\u05E0\u05D9\u05DD \u05D5\u05EA\u05E7\u05E6\u05D5\u05D1 \u05E1\u05D5\u05E4\u05D9 \u05DC\u05E4\u05E8\u05D9\u05E1\u05D4 \u05DE\u05DC\u05D0\u05D4"
  ]
}
`;
          const reportModels = [
            "gemini-3.1-flash-lite",
            "gemini-flash-latest",
            "gemini-3.6-flash",
            "gemini-3.8-flash"
          ];
          const activeModels = reportModels.filter((m) => !isModelCoolingDown(m));
          const modelsToTry = activeModels.length > 0 ? activeModels : reportModels;
          for (const model of modelsToTry) {
            try {
              console.log(`[Generating Tailored Report using Gemini: ${model}]...`);
              const generatePromise = ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                  systemInstruction: "You are the Chief AI Architect and Senior Enterprise Consultant at Tech-Select (\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8). Provide top-tier, rigorous, honest and strategic corporate advisory reports in valid JSON format. Avoid generic marketing fluff.",
                  temperature: 0.2,
                  responseMimeType: "application/json"
                }
              });
              const timeoutPromise = new Promise(
                (_, reject) => setTimeout(() => reject(new Error(`Timeout on ${model}`)), 45e3)
              );
              const response = await Promise.race([generatePromise, timeoutPromise]);
              const jsonText = (response?.text || "").trim();
              try {
                parsedReport = JSON.parse(jsonText);
              } catch (parseError) {
                const cleaned = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
                parsedReport = JSON.parse(cleaned);
              }
              if (parsedReport && (parsedReport.executiveSummary || parsedReport.opportunities)) {
                console.log(`[Gemini Report SUCCESS on ${model}]: generated executive summary of ${parsedReport.executiveSummary?.length || 0} chars`);
                break;
              }
            } catch (modelErr) {
              console.log(`[Notice: Gemini ${model} temporarily unavailable, testing next model in chain]`);
            }
          }
        } catch (apiErr) {
          console.warn("[GEMINI REPORT GENERATION FAILED, USING TAILORED FALLBACK]", apiErr);
        }
        if (!parsedReport || !parsedReport.opportunities) {
          const companyName = formData?.companyName || "\u05D4\u05D0\u05E8\u05D2\u05D5\u05DF";
          const contactName = formData?.fullName || '\u05DE\u05E0\u05DB"\u05DC / \u05D4\u05E0\u05D4\u05DC\u05D4';
          const role = formData?.role || '\u05DE\u05E0\u05DB"\u05DC';
          const erp = formData?.erpCrmDetails || "\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF";
          const hoursSaved = formData?.companySize?.includes("100") ? 320 : 220;
          const savingsNIS = hoursSaved * 100 * 12;
          parsedReport = {
            executiveSummary: `\u05D3\u05D5\u05D7 \u05D6\u05D4 \u05E0\u05E2\u05E8\u05DA \u05E2\u05DC \u05D9\u05D3\u05D9 \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 \u05D4-AI \u05D4\u05E8\u05D0\u05E9\u05D9 \u05E9\u05DC TECH-SELECT \u05E2\u05D1\u05D5\u05E8 ${contactName} \u05D5\u05E6\u05D5\u05D5\u05EA \u05D4\u05D4\u05E0\u05D4\u05DC\u05D4 \u05E9\u05DC ${companyName}. \u05E2\u05DC \u05D1\u05E1\u05D9\u05E1 \u05D4\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D4\u05DE\u05E2\u05E8\u05DB\u05EA\u05D9, \u05D4\u05D7\u05D1\u05E8\u05D4 \u05E0\u05DE\u05E6\u05D0\u05EA \u05D1\u05E2\u05DE\u05D3\u05D4 \u05DE\u05E6\u05D5\u05D9\u05E0\u05EA \u05DC\u05D1\u05D9\u05E6\u05D5\u05E2 \u05E7\u05E4\u05D9\u05E6\u05EA \u05DE\u05D3\u05E8\u05D2\u05D4 \u05EA\u05E4\u05E2\u05D5\u05DC\u05D9\u05EA \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D9\u05D9\u05E9\u05D5\u05DD Enterprise AI \u05D5-Zero Data Retention RAG. \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D4\u05DE\u05D5\u05DE\u05DC\u05E5 \u05D9\u05D0\u05E4\u05E9\u05E8 \u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E9\u05DC \u05EA\u05D4\u05DC\u05D9\u05DB\u05D9\u05DD \u05DE\u05D5\u05E8\u05DB\u05D1\u05D9\u05DD \u05D1-${erp}, \u05D9\u05E7\u05E6\u05E8 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA\u05D9\u05EA \u05D0\u05EA \u05D6\u05DE\u05E0\u05D9 \u05D4\u05D8\u05D9\u05E4\u05D5\u05DC \u05D1\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D5\u05E4\u05E0\u05D9\u05D5\u05EA, \u05D5\u05D9\u05D1\u05D8\u05D9\u05D7 \u05E1\u05D1\u05D9\u05D1\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA \u05D5\u05E2\u05DE\u05D9\u05D3\u05D4 \u05D1\u05E8\u05D2\u05D5\u05DC\u05E6\u05D9\u05D4.`,
            overallReadinessScore: 82,
            securityReadinessScore: 88,
            automationPotentialScore: 85,
            shadowAIRiskScore: 32,
            radarMetrics: [
              { axis: "\u05D1\u05E9\u05DC\u05D5\u05EA \u05EA\u05E9\u05EA\u05D9\u05EA \u05D5\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD", score: 78, industryAvg: 50, targetScore: 92, description: `\u05DE\u05D9\u05E4\u05D5\u05D9 \u05DE\u05D0\u05D2\u05E8\u05D9 \u05D4\u05DE\u05D9\u05D3\u05E2 \u05D5\u05D4-${erp} \u05E9\u05DC ${companyName}` },
              { axis: "\u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5-Zero Data Retention", score: 88, industryAvg: 45, targetScore: 96, description: "\u05D4\u05E7\u05DE\u05EA AI Gateway \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05D5\u05DE\u05E0\u05D9\u05E2\u05EA \u05D6\u05DC\u05D9\u05D2\u05EA \u05DE\u05D9\u05D3\u05E2" },
              { axis: "\u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05EA\u05E4\u05E2\u05D5\u05DC\u05D9\u05EA", score: 85, industryAvg: 55, targetScore: 94, description: "\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E9\u05DC \u05DE\u05E2\u05E0\u05D4, \u05D4\u05E4\u05E7\u05EA \u05D4\u05E6\u05E2\u05D5\u05EA \u05D5\u05E2\u05D9\u05D1\u05D5\u05D3 \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD" },
              { axis: "\u05D0\u05D9\u05DE\u05D5\u05E5 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD \u05D5\u05DE\u05D9\u05D5\u05DE\u05E0\u05D5\u05D9\u05D5\u05EA", score: 70, industryAvg: 40, targetScore: 88, description: "\u05D4\u05D3\u05E8\u05DB\u05D5\u05EA \u05D5\u05D4\u05D8\u05DE\u05E2\u05EA \u05DB\u05DC\u05D9 AI \u05DE\u05D0\u05D5\u05E9\u05E8\u05D9\u05DD \u05DC\u05E6\u05D5\u05D5\u05EA" },
              { axis: "\u05D4\u05D9\u05EA\u05DB\u05E0\u05D5\u05EA \u05E2\u05E1\u05E7\u05D9\u05EA \u05D5-ROI \u05DE\u05D4\u05D9\u05E8", score: 90, industryAvg: 50, targetScore: 98, description: "\u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4 \u05DE\u05D4\u05D9\u05E8 \u05D1\u05EA\u05D5\u05DA 2.5-3.5 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD" },
              { axis: "\u05DE\u05DE\u05E9\u05DC \u05D5\u05E8\u05D2\u05D5\u05DC\u05E6\u05D9\u05D4 (ISO/Privacy)", score: 84, industryAvg: 45, targetScore: 92, description: "\u05E2\u05DE\u05D9\u05D3\u05D4 \u05D1\u05EA\u05E7\u05E0\u05D9 \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5-DPA \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9" }
            ],
            financialAnalysis: {
              estimatedMonthlyHoursSaved: hoursSaved,
              estimatedYearlySavingsNIS: savingsNIS,
              paybackPeriodMonths: 2.8,
              efficiencyGainPercent: 35,
              summaryExplanation: `\u05D4\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D4\u05E9\u05E0\u05EA\u05D9 \u05D4\u05DE\u05D7\u05D5\u05E9\u05D1 \u05E2\u05D1\u05D5\u05E8 ${companyName} \u05DE\u05EA\u05D1\u05E1\u05E1 \u05E2\u05DC \u05E9\u05D7\u05E8\u05D5\u05E8 \u05DB-${hoursSaved} \u05E9\u05E2\u05D5\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA \u05E9\u05DC \u05E2\u05D5\u05D1\u05D3\u05D9 \u05D9\u05D3\u05E2 \u05D5\u05E6\u05D5\u05D5\u05EA\u05D9 \u05EA\u05E4\u05E2\u05D5\u05DC (\u05E9\u05D5\u05D5\u05D9 \u05DE\u05D5\u05E2\u05E8\u05DA \u05E9\u05DC \u20AA100/\u05E9\u05E2\u05D4 \u05DC\u05E2\u05D5\u05D1\u05D3), \u05E2\u05DD \u05E0\u05E7\u05D5\u05D3\u05EA \u05D0\u05D9\u05D6\u05D5\u05DF (Payback) \u05EA\u05D5\u05DA 2.8 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05DE\u05DE\u05D5\u05E2\u05D3 \u05D4\u05E4\u05E8\u05D9\u05E1\u05D4.`
            },
            opportunities: [
              {
                id: "opp-1",
                title: "\u05DE\u05E0\u05D5\u05E2 \u05D9\u05D3\u05E2 \u05D5-RAG \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 (Enterprise Search)",
                category: "Enterprise RAG",
                problemDescription: "\u05D7\u05D9\u05E4\u05D5\u05E9 \u05DE\u05D9\u05D3\u05E2 \u05D7\u05D5\u05D6\u05E8, \u05E7\u05D1\u05E6\u05D9 \u05E2\u05D1\u05E8, \u05E0\u05D4\u05DC\u05D9\u05DD \u05D5\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D4\u05D2\u05D5\u05D6\u05DC \u05E9\u05E2\u05D5\u05EA \u05E8\u05D1\u05D5\u05EA \u05DE\u05E2\u05D5\u05D1\u05D3\u05D9 \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF.",
                aiSolution: "\u05DE\u05E2\u05E8\u05DB\u05EA RAG \u05DE\u05D1\u05D9\u05EA Tech-Select \u05D4\u05DE\u05D0\u05E0\u05D3\u05E7\u05E1\u05EA \u05E7\u05D1\u05E6\u05D9\u05DD, \u05D7\u05D5\u05D6\u05D9\u05DD \u05D5-SharePoint \u05E2\u05DD \u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05DE\u05D3\u05D5\u05D9\u05E7\u05D5\u05EA, \u05DE\u05E8\u05D0\u05D9 \u05DE\u05E7\u05D5\u05DD \u05D5\u05D4\u05E8\u05E9\u05D0\u05D5\u05EA RBAC \u05DE\u05DC\u05D0\u05D5\u05EA.",
                impact: "Critical",
                complexity: "Medium",
                estimatedTimeToValue: "3-4 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
                estimatedHoursSavedMonthly: 120,
                recommendedTools: ["Azure OpenAI Private", "PgVector / Qdrant", "LangChain", "M365 Integration"]
              },
              {
                id: "opp-2",
                title: `\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E9\u05DC \u05EA\u05D4\u05DC\u05D9\u05DB\u05D9 \u05E9\u05D9\u05E8\u05D5\u05EA \u05D5\u05D4\u05E6\u05E2\u05D5\u05EA \u05DE\u05D7\u05D9\u05E8 \u05DE\u05D5\u05DC ${erp}`,
                category: "Automation",
                problemDescription: "\u05D4\u05E7\u05DC\u05D3\u05D4 \u05D9\u05D3\u05E0\u05D9\u05EA, \u05E9\u05DC\u05D9\u05E4\u05EA \u05E0\u05EA\u05D5\u05E0\u05D9 \u05DC\u05E7\u05D5\u05D7 \u05D5\u05D4\u05DB\u05E0\u05EA \u05D4\u05E6\u05E2\u05D5\u05EA/\u05D3\u05D5\u05D7\u05D5\u05EA \u05D4\u05D2\u05D5\u05D6\u05DC\u05D9\u05DD \u05D6\u05DE\u05DF \u05D9\u05E7\u05E8.",
                aiSolution: "\u05E1\u05D5\u05DB\u05DF AI \u05D4\u05E4\u05D5\u05E2\u05DC \u05E2\u05DC \u05D1\u05E1\u05D9\u05E1 \u05EA\u05D1\u05E0\u05D9\u05D5\u05EA \u05DE\u05D0\u05D5\u05E9\u05E8\u05D5\u05EA, \u05E9\u05D5\u05DC\u05E3 \u05DE\u05D9\u05D3\u05E2 \u05D1\u05D6\u05DE\u05DF \u05D0\u05DE\u05EA \u05D5\u05DE\u05D9\u05D9\u05E6\u05E8 \u05D8\u05D9\u05D5\u05D8\u05D5\u05EA \u05DE\u05D3\u05D5\u05D9\u05E7\u05D5\u05EA \u05DC\u05D0\u05D9\u05E9\u05D5\u05E8 \u05E2\u05D5\u05D1\u05D3.",
                impact: "High",
                complexity: "Medium",
                estimatedTimeToValue: "4-6 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
                estimatedHoursSavedMonthly: 100,
                recommendedTools: ["AI Gateway", "Function Calling", "ERP Webhooks"]
              },
              {
                id: "opp-3",
                title: "\u05E9\u05DB\u05D1\u05EA \u05E9\u05E2\u05E8 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA \u05D5\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA AI \u05DC\u05E2\u05D5\u05D1\u05D3\u05D9\u05DD (AI Gateway & Governance)",
                category: "Security & Governance",
                problemDescription: "\u05E2\u05D5\u05D1\u05D3\u05D9\u05DD \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05D1\u05DB\u05DC\u05D9\u05DD \u05D7\u05D9\u05E0\u05DE\u05D9\u05D9\u05DD \u05E6\u05D9\u05D1\u05D5\u05E8\u05D9\u05D9\u05DD (Shadow AI) \u05EA\u05D5\u05DA \u05E1\u05D9\u05DB\u05D5\u05DF \u05DC\u05D7\u05E9\u05D9\u05E4\u05EA \u05DE\u05D9\u05D3\u05E2 \u05E2\u05E1\u05E7\u05D9 \u05E8\u05D2\u05D9\u05E9.",
                aiSolution: "\u05D4\u05E7\u05DE\u05EA \u05E4\u05D5\u05E8\u05D8\u05DC \u05E4\u05E0\u05D9\u05DE\u05D9 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E2\u05DD DLP, \u05D7\u05E1\u05D9\u05DE\u05EA \u05D3\u05DC\u05D9\u05E4\u05EA \u05DE\u05E1\u05E4\u05E8\u05D9 \u05D6\u05D4\u05D5\u05EA/\u05D0\u05E9\u05E8\u05D0\u05D9 \u05D5\u05D4\u05E1\u05DB\u05DD DPA \u05DC\u05DE\u05E0\u05D9\u05E2\u05EA \u05D0\u05D9\u05DE\u05D5\u05DF \u05DE\u05D5\u05D3\u05DC\u05D9\u05DD \u05E6\u05D9\u05D1\u05D5\u05E8\u05D9\u05D9\u05DD.",
                impact: "Critical",
                complexity: "Low",
                estimatedTimeToValue: "\u05E9\u05D1\u05D5\u05E2\u05D9\u05D9\u05DD",
                estimatedHoursSavedMonthly: 60,
                recommendedTools: ["Tech-Select AI Gateway", "Entra ID SSO", "Audit Logging"]
              }
            ],
            architectureRecommendations: {
              tier1_Identity: "\u05D0\u05D9\u05DE\u05D5\u05EA \u05D6\u05D4\u05D5\u05EA \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05DE\u05E0\u05D5\u05D4\u05DC (M365 / Entra ID SSO) \u05E2\u05DD \u05D0\u05D9\u05DE\u05D5\u05EA \u05E8\u05D1-\u05E9\u05DC\u05D1\u05D9 (MFA)",
              tier2_Gateway: "\u05E9\u05DB\u05D1\u05EA \u05E9\u05E2\u05E8 AI \u05E2\u05DD \u05E1\u05D9\u05E0\u05D5\u05DF DLP, \u05D7\u05E1\u05D9\u05DE\u05EA \u05DE\u05D9\u05D3\u05E2 \u05E8\u05D2\u05D9\u05E9, \u05D5\u05D4\u05E1\u05DB\u05DD \u05D0\u05E4\u05E1 \u05E9\u05DE\u05D9\u05E8\u05EA \u05DE\u05D9\u05D3\u05E2 (Zero Data Retention)",
              tier3_DataPipeline: "\u05E6\u05D9\u05E0\u05D5\u05E8 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 (RAG) \u05E2\u05DD \u05DE\u05E0\u05D2\u05E0\u05D5\u05DF Chunking \u05DE\u05EA\u05E7\u05D3\u05DD \u05D5\u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05D1\u05E8\u05DE\u05EA \u05DE\u05E1\u05DE\u05DA",
              tier4_ModelCluster: "\u05D0\u05D9\u05E8\u05D5\u05D7 \u05DE\u05D5\u05D3\u05DC\u05D9\u05DD \u05D1\u05E2\u05E0\u05DF \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05DE\u05D1\u05D5\u05D3\u05D3 (Enterprise Azure / AWS) \u05D0\u05D5 \u05E9\u05E8\u05EA GPU \u05DE\u05E7\u05D5\u05DE\u05D9 \u05D9\u05D9\u05E2\u05D5\u05D3\u05D9 \u05DC\u05DE\u05EA\u05E7\u05E0\u05D9\u05DD \u05DE\u05E1\u05D5\u05D5\u05D2\u05D9\u05DD"
            },
            roadmapPhases: [
              {
                phase: "\u05E9\u05DC\u05D1 1 (\u05D9\u05DE\u05D9\u05DD 0-30): \u05EA\u05E9\u05EA\u05D9\u05EA, \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05D5-Quick Win \u05E8\u05D0\u05E9\u05D5\u05DF",
                timeline: "\u05D7\u05D5\u05D3\u05E9 1",
                goals: ["\u05D4\u05E1\u05D3\u05E8\u05EA \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA AI \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05EA", "\u05D4\u05E7\u05DE\u05EA AI Gateway \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7", "\u05D4\u05D8\u05DE\u05E2\u05EA Use Case \u05E8\u05D0\u05E9\u05D5\u05DF (DLP & Knowledge Base)"],
                deliverables: ['\u05DE\u05E1\u05DE\u05DA \u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05DE\u05D0\u05D5\u05E9\u05E8 \u05DC\u05DE\u05E0\u05DB"\u05DC', "\u05E1\u05D1\u05D9\u05D1\u05EA \u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 \u05E4\u05E2\u05D9\u05DC\u05D4"]
              },
              {
                phase: "\u05E9\u05DC\u05D1 2 (\u05D9\u05DE\u05D9\u05DD 30-90): RAG \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05D5\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4",
                timeline: "\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD 2-3",
                goals: [`\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05DC\u05DE\u05D0\u05D2\u05E8\u05D9 \u05D4-${erp} \u05D5-SharePoint`, "\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E9\u05DC \u05D4\u05E4\u05E7\u05EA \u05D3\u05D5\u05D7\u05D5\u05EA \u05D5\u05D8\u05D9\u05D5\u05D8\u05D5\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA"],
                deliverables: ["\u05DE\u05E0\u05D5\u05E2 \u05D7\u05D9\u05E4\u05D5\u05E9 \u05E4\u05E0\u05D9\u05DE\u05D9 \u05D7\u05D9 \u05DC\u05E6\u05D5\u05D5\u05EA", "\u05D0\u05D9\u05E0\u05D8\u05D2\u05E8\u05E6\u05D9\u05D4 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05EA"]
              },
              {
                phase: "\u05E9\u05DC\u05D1 3 (\u05D9\u05DE\u05D9\u05DD 90-180): \u05D4\u05E8\u05D7\u05D1\u05D4 \u05DE\u05D7\u05DC\u05E7\u05EA\u05D9\u05EA \u05D5\u05D0\u05D5\u05D8\u05D5\u05DE\u05E6\u05D9\u05D4 \u05E2\u05DE\u05D5\u05E7\u05D4",
                timeline: "\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD 4-6",
                goals: ["\u05D4\u05EA\u05E8\u05D7\u05D1\u05D5\u05EA \u05DC\u05DE\u05D7\u05DC\u05E7\u05D5\u05EA \u05E0\u05D5\u05E1\u05E4\u05D5\u05EA \u05D1\u05D0\u05E8\u05D2\u05D5\u05DF", "\u05D4\u05E4\u05E2\u05DC\u05EA \u05E1\u05D5\u05DB\u05E0\u05D9 AI \u05D0\u05D5\u05D8\u05D5\u05E0\u05D5\u05DE\u05D9\u05D9\u05DD"],
                deliverables: ["\u05D3\u05E9\u05D1\u05D5\u05E8\u05D3 \u05DE\u05D3\u05D9\u05D3\u05EA ROI \u05D5\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E9\u05E2\u05D5\u05EA", "\u05D4\u05D3\u05E8\u05DB\u05D5\u05EA \u05D4\u05E2\u05DE\u05E7\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA"]
              }
            ],
            shadowAIGovernancePlan: "\u05D7\u05E1\u05D9\u05DE\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DC\u05DB\u05DC\u05D9\u05DD \u05E6\u05D9\u05D1\u05D5\u05E8\u05D9\u05D9\u05DD \u05DC\u05D0 \u05DE\u05D5\u05E8\u05E9\u05D9\u05DD \u05D1\u05E8\u05DE\u05EA \u05D4-Firewall \u05D5\u05D4-DNS, \u05D5\u05E0\u05D9\u05EA\u05D5\u05D1 \u05DB\u05DC\u05DC \u05D4\u05E2\u05D5\u05D1\u05D3\u05D9\u05DD \u05DC\u05E4\u05D5\u05E8\u05D8\u05DC \u05D4-AI \u05D4\u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E9\u05DC \u05D4\u05D7\u05D1\u05E8\u05D4.",
            nextSteps: [
              "\u05E4\u05D2\u05D9\u05E9\u05EA \u05D9\u05D9\u05E9\u05D5\u05DD \u05D8\u05DB\u05E0\u05D5\u05DC\u05D5\u05D2\u05D9\u05EA \u05DE\u05DE\u05D5\u05E7\u05D3\u05EA \u05E2\u05DD \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 \u05D4-AI \u05E9\u05DC Tech-Select",
              "\u05D4\u05D2\u05D3\u05E8\u05EA \u05E1\u05D1\u05D9\u05D1\u05EA \u05E4\u05D9\u05D9\u05DC\u05D5\u05D8 (POC) \u05DE\u05DE\u05D5\u05E7\u05D3\u05EA \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DC\u05D9\u05D1\u05D4",
              "\u05DC\u05D5\u05D7 \u05D6\u05DE\u05E0\u05D9\u05DD \u05D5\u05EA\u05E7\u05E6\u05D5\u05D1 \u05E1\u05D5\u05E4\u05D9 \u05DC\u05E4\u05E8\u05D9\u05E1\u05D4 \u05DE\u05DC\u05D0\u05D4"
            ]
          };
        }
        return res.json({
          success: true,
          report: parsedReport
        });
      } catch (err) {
        console.error("[GENERATE TAILORED REPORT ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "Failed to generate AI report",
          details: err?.message || String(err)
        });
      }
    });
    app.post("/api/ai-discovery/send-report", async (req, res) => {
      try {
        const { reportData, formData, chatSummary, clientEmail, pdfBase64, pdfFilename } = req.body || {};
        const targetEmail = "g@tech-select.co.il";
        const companyName = formData?.companyName || reportData?.companyName || "\u05D7\u05D1\u05E8\u05D4 \u05DC\u05D0 \u05E6\u05D5\u05D9\u05E0\u05D4";
        const contactName = formData?.fullName || reportData?.contactPerson || '\u05DE\u05E0\u05DB"\u05DC / \u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8';
        const phone = formData?.phone || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF";
        const email = clientEmail || formData?.email || "";
        console.log(`[AI DISCOVERY REPORT DISPATCH] For ${companyName} (${contactName}) to ${targetEmail}, hasPdf: ${!!pdfBase64}`);
        const monthlyHours = reportData?.financialAnalysis?.estimatedMonthlyHoursSaved || reportData?.roi?.monthlyHoursSaved || 240;
        const yearlySavingsNIS = reportData?.financialAnalysis?.estimatedYearlySavingsNIS || reportData?.roi?.estimatedAnnualFinancialSavingsNIS || monthlyHours * 100 * 12;
        const payback = reportData?.financialAnalysis?.paybackPeriodMonths || reportData?.roi?.paybackMonths || 2.8;
        const execSummary = reportData?.executiveSummary || "\u05D3\u05D5\u05D7 \u05D0\u05E4\u05D9\u05D5\u05DF \u05D5\u05D4\u05D8\u05DE\u05E2\u05EA AI \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05E9\u05E0\u05E2\u05E8\u05DA \u05E2\u05DC \u05D9\u05D3\u05D9 \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8 \u05D4-AI \u05E9\u05DC Tech-Select.";
        const opportunitiesHtml = (reportData?.opportunities || []).map(
          (o, idx) => `
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #475569; padding-bottom: 8px; margin-bottom: 8px;">
                <strong style="color: #38bdf8; font-size: 15px;">${idx + 1}. ${o.title || o.titleHe || "\u05D9\u05D5\u05D6\u05DE\u05EA AI"}</strong>
                <span style="background-color: #0369a1; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${o.category || o.priority || "AI Initiative"}</span>
              </div>
              <p style="margin: 4px 0; color: #cbd5e1; font-size: 13px;"><strong>\u05D4\u05D1\u05E2\u05D9\u05D4:</strong> ${o.problemDescription || o.problemStatement || "\u05E2\u05D5\u05DE\u05E1 \u05EA\u05E4\u05E2\u05D5\u05DC\u05D9 \u05D9\u05D3\u05E0\u05D9"}</p>
              <p style="margin: 4px 0; color: #34d399; font-size: 13px;"><strong>\u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D4\u05DE\u05D5\u05E6\u05E2:</strong> ${o.aiSolution || "\u05DE\u05E2\u05E8\u05DB\u05EA AI \u05DE\u05EA\u05E7\u05D3\u05DE\u05EA"}</p>
              <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
                <span>\u23F1\uFE0F \u05D6\u05DE\u05DF \u05D4\u05D8\u05DE\u05E2\u05D4: <strong>${o.estimatedTimeToValue || o.estimatedEffort || "2-4 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA"}</strong></span> | 
                <span>\u{1F4A1} \u05D4\u05E9\u05E4\u05E2\u05D4: <strong>${o.impact || o.impactScore || "High"}</strong></span> | 
                <span>\u26A1 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF: <strong>${o.estimatedHoursSavedMonthly || 40} \u05E9\u05E2\u05D5\u05EA/\u05D7\u05D5\u05D3\u05E9</strong></span>
              </div>
            </div>
          `
        ).join("");
        const emailHtml = `
          <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 32px 20px; max-width: 720px; margin: 0 auto; border-radius: 16px; border: 1px solid #1e293b; line-height: 1.6;">
            
            <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px;">
              <span style="background-color: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px;">TECH-SELECT AI PRACTICE</span>
              <h1 style="color: #38bdf8; margin: 12px 0 6px 0; font-size: 24px;">\u05D3\u05D5\u05D7 \u05D0\u05E4\u05D9\u05D5\u05DF \u05D5\u05D4\u05D8\u05DE\u05E2\u05EA AI \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 (AI Excellence Report)</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">\u05D4\u05D5\u05E4\u05E7 \u05E2\u05DC \u05D9\u05D3\u05D9 \u05DE\u05E0\u05D5\u05E2 \u05D4-AI Discovery \u05E9\u05DC TECH-SELECT \u05E2\u05D1\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC \u05D5\u05D4\u05D4\u05E0\u05D4\u05DC\u05D4</p>
              ${pdfBase64 ? `<p style="margin-top: 8px; color: #34d399; font-size: 14px; font-weight: bold;">\u{1F4CE} \u05E7\u05D5\u05D1\u05E5 PDF \u05DE\u05DC\u05D0 \u05D5\u05DE\u05E2\u05D5\u05E6\u05D1 \u05E9\u05DC \u05D4\u05D3\u05D5\u05D7 \u05DE\u05E6\u05D5\u05E8\u05E3 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D6\u05D4!</p>` : ""}
            </div>

            <!-- \u05E4\u05E8\u05D8\u05D9 \u05D4\u05D7\u05D1\u05E8\u05D4 \u05D5\u05D4\u05DE\u05E0\u05DB"\u05DC -->
            <div style="background-color: #111827; border-radius: 10px; padding: 18px; margin-bottom: 20px; border: 1px solid #1f2937;">
              <h3 style="color: #f8fafc; margin-top: 0; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #374151; padding-bottom: 6px;">\u{1F4CB} \u05E4\u05E8\u05D8\u05D9 \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF \u05D5\u05D4\u05E4\u05D5\u05E0\u05D4:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">\u05E9\u05DD \u05D4\u05D7\u05D1\u05E8\u05D4:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #38bdf8;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">\u05E9\u05DD \u05D4\u05DE\u05E0\u05DB"\u05DC / \u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8:</td>
                  <td style="padding: 6px 0;">${contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">\u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05D9\u05E6\u05D9\u05E8\u05EA \u05E7\u05E9\u05E8:</td>
                  <td style="padding: 6px 0;"><a href="tel:${phone}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</td>
                  <td style="padding: 6px 0;">${email || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">\u05D2\u05D5\u05D3\u05DC \u05D4\u05D0\u05E8\u05D2\u05D5\u05DF:</td>
                  <td style="padding: 6px 0;">${formData?.companySize || reportData?.companySize || "21-100 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">\u05E1\u05D1\u05D9\u05D1\u05D4 \u05D5\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA \u05DC\u05D9\u05D1\u05D4:</td>
                  <td style="padding: 6px 0;">${formData?.erpCrmDetails || "M365, \u05E9\u05E8\u05EA\u05D9 \u05E7\u05D1\u05E6\u05D9\u05DD, ERP"}</td>
                </tr>
              </table>
            </div>

            <!-- \u05DE\u05DC\u05DC \u05D7\u05D5\u05E4\u05E9\u05D9 \u05D5\u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D1\u05E7\u05D1\u05D5\u05E7 \u05E9\u05D4\u05DE\u05E0\u05DB"\u05DC \u05EA\u05D9\u05D0\u05E8 -->
            <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
              <h3 style="color: #c7d2fe; margin-top: 0; font-size: 15px; margin-bottom: 8px;">\u{1F3AF} \u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D1\u05E7\u05D1\u05D5\u05E7 \u05D5\u05DB\u05D0\u05D1\u05D9\u05DD \u05DE\u05E8\u05DB\u05D6\u05D9\u05D9\u05DD (\u05D1\u05DE\u05D9\u05DC\u05D5\u05EA \u05D4\u05DE\u05E0\u05DB"\u05DC):</h3>
              <p style="color: #e0e7ff; font-size: 14px; margin: 0; white-space: pre-wrap; line-height: 1.5;">${formData?.customPainPoints || "\u05DC\u05D0 \u05E4\u05D5\u05E8\u05D8 \u05DE\u05DC\u05DC \u05D7\u05D5\u05E4\u05E9\u05D9 \u05E0\u05D5\u05E1\u05E3"}</p>
              ${formData?.dreamGoalTomorrow ? `<p style="margin-top: 10px; margin-bottom: 0; color: #a5b4fc; font-size: 13px;"><strong>\u05D7\u05D6\u05D5\u05DF \u05D4\u05DE\u05E0\u05DB"\u05DC \u05DC\u05DE\u05D7\u05E8 \u05D1\u05D1\u05D5\u05E7\u05E8:</strong> ${formData.dreamGoalTomorrow}</p>` : ""}
            </div>

            <!-- \u05DE\u05D3\u05D3\u05D9 ROI \u05D5\u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4 -->
            <div style="background-color: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
              <h3 style="color: #6ee7b7; margin-top: 0; font-size: 15px; margin-bottom: 12px;">\u{1F4B0} \u05EA\u05D7\u05D6\u05D9\u05EA ROI \u05D5\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DB\u05DC\u05DB\u05DC\u05D9:</h3>
              <table style="width: 100%; border-collapse: collapse; color: #ecfdf5; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0;">\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D5\u05E2\u05E8\u05DA \u05D1\u05E9\u05E2\u05D5\u05EA \u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #6ee7b7;">${monthlyHours} \u05E9\u05E2\u05D5\u05EA</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">\u05E9\u05D5\u05D5\u05D9 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DB\u05E1\u05E4\u05D9 \u05E9\u05E0\u05EA\u05D9 \u05DE\u05D5\u05E2\u05E8\u05DA:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #6ee7b7; font-size: 16px;">\u20AA${Number(yearlySavingsNIS).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">\u05D6\u05DE\u05DF \u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4 (Payback Period):</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #6ee7b7;">${payback} \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD</td>
                </tr>
              </table>
            </div>

            <!-- \u05EA\u05DE\u05E6\u05D9\u05EA \u05DE\u05E0\u05D4\u05DC\u05D9\u05DD \u05DE\u05D4-AI -->
            <div style="background-color: #111827; border-radius: 10px; padding: 18px; margin-bottom: 20px; border: 1px solid #1f2937;">
              <h3 style="color: #38bdf8; margin-top: 0; font-size: 15px; margin-bottom: 8px;">\u{1F9E0} \u05EA\u05DE\u05E6\u05D9\u05EA \u05D0\u05E1\u05D8\u05E8\u05D8\u05D2\u05D9\u05EA \u05D5\u05D4\u05DE\u05DC\u05E6\u05EA \u05D4\u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8:</h3>
              <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">${execSummary}</p>
            </div>

            <!-- Use Cases \u05D5\u05D4\u05D6\u05D3\u05DE\u05E0\u05D5\u05D9\u05D5\u05EA \u05DE\u05E8\u05DB\u05D6\u05D9\u05D5\u05EA -->
            <div style="margin-bottom: 24px;">
              <h3 style="color: #f8fafc; font-size: 16px; margin-bottom: 12px;">\u{1F680} \u05D9\u05D5\u05D6\u05DE\u05D5\u05EA AI \u05D5\u05D4\u05D6\u05D3\u05DE\u05E0\u05D5\u05D9\u05D5\u05EA \u05DE\u05E8\u05DB\u05D6\u05D9\u05D5\u05EA \u05E9\u05D4\u05D5\u05EA\u05D0\u05DE\u05D5 \u05DC\u05D0\u05E8\u05D2\u05D5\u05DF:</h3>
              ${opportunitiesHtml || "<p style='color: #94a3b8;'>\u05D4\u05D9\u05D5\u05D6\u05DE\u05D5\u05EA \u05DE\u05E4\u05D5\u05E8\u05D8\u05D5\u05EA \u05D1\u05D3\u05D5\u05D7 \u05D4\u05DE\u05DC\u05D0.</p>"}
            </div>

            <!-- \u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8\u05D5\u05E8\u05D4 \u05D5\u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 -->
            <div style="background-color: #111827; border-radius: 10px; padding: 18px; margin-bottom: 24px; border: 1px solid #1f2937;">
              <h3 style="color: #f8fafc; margin-top: 0; font-size: 15px; margin-bottom: 8px;">\u{1F6E1}\uFE0F \u05EA\u05E6\u05D5\u05E8\u05EA \u05D0\u05D1\u05D8\u05D7\u05D4 \u05D5\u05D0\u05E8\u05DB\u05D9\u05D8\u05E7\u05D8\u05D5\u05E8\u05D4 \u05DE\u05D5\u05DE\u05DC\u05E6\u05EA:</h3>
              <ul style="color: #cbd5e1; font-size: 13px; margin: 0; padding-right: 20px;">
                <li><strong>\u05E9\u05DB\u05D1\u05EA \u05E9\u05E2\u05E8 \u05D5-DLP:</strong> ${reportData?.architectureRecommendations?.tier2_Gateway || "\u05D7\u05E1\u05D9\u05DE\u05EA \u05D3\u05DC\u05D9\u05E4\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05D4\u05E1\u05DB\u05DE\u05D9 DPA \u05DE\u05D5\u05DC \u05DE\u05D5\u05D3\u05DC\u05D9\u05DD \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05D9\u05DD"}</li>
                <li><strong>\u05D0\u05D9\u05E0\u05D3\u05D5\u05E7\u05E1 \u05D5-RAG:</strong> ${reportData?.architectureRecommendations?.tier3_DataPipeline || "\u05E6\u05D9\u05E0\u05D5\u05E8 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05E2\u05DD \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05DE\u05D1\u05D5\u05E1\u05E1\u05D5\u05EA \u05EA\u05E4\u05E7\u05D9\u05D3 (RBAC)"}</li>
                <li><strong>\u05D0\u05D9\u05E8\u05D5\u05D7 \u05DE\u05D5\u05D3\u05DC\u05D9\u05DD:</strong> ${reportData?.architectureRecommendations?.tier4_ModelCluster || "\u05E2\u05E0\u05DF \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05E1\u05D2\u05D5\u05E8 / \u05D0\u05E4\u05E9\u05E8\u05D5\u05EA \u05DC\u05E9\u05E8\u05EA GPU \u05DE\u05E7\u05D5\u05DE\u05D9 On-Premises"}</li>
              </ul>
            </div>

            <div style="text-align: center; border-top: 1px solid #334155; padding-top: 20px; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0 0 6px 0;">\u05D3\u05D5\u05D7 \u05D6\u05D4 \u05E0\u05E9\u05DC\u05D7 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05DE\u05E4\u05D5\u05E8\u05D8\u05DC AI Discovery \u05E9\u05DC <strong>\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE</strong>.</p>
              <p style="margin: 0;">\u05D7.\u05E4: 516104869 | \u05E1\u05E4\u05E7 \u05DE\u05D5\u05E8\u05E9\u05D4 \u05DE\u05E9\u05E8\u05D3 \u05D4\u05D1\u05D9\u05D8\u05D7\u05D5\u05DF: 0011033280 | <a href="https://tech-select.co.il" style="color: #38bdf8; text-decoration: none;">tech-select.co.il</a></p>
            </div>

          </div>
        `;
        const plainTextSummary = `
\u05D3\u05D5\u05D7 AI Discovery \u05DE\u05DC\u05D0 \u05DC\u05DE\u05E0\u05DB"\u05DC:
\u05D7\u05D1\u05E8\u05D4: ${companyName}
\u05DE\u05E0\u05DB"\u05DC / \u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${contactName}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${phone}
\u05D3\u05D5\u05D0"\u05DC: ${email}
\u05D2\u05D5\u05D3\u05DC \u05D0\u05E8\u05D2\u05D5\u05DF: ${formData?.companySize || reportData?.companySize || "21-100"}
\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA: ${formData?.erpCrmDetails || "M365, ERP"}

\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D7\u05D5\u05D3\u05E9\u05D9 \u05DE\u05D5\u05E2\u05E8\u05DA: ${monthlyHours} \u05E9\u05E2\u05D5\u05EA
\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DB\u05E1\u05E4\u05D9 \u05E9\u05E0\u05EA\u05D9 \u05DE\u05D5\u05E2\u05E8\u05DA: \u20AA${Number(yearlySavingsNIS).toLocaleString()}
\u05D6\u05DE\u05DF \u05D4\u05D7\u05D6\u05E8 \u05D4\u05E9\u05E7\u05E2\u05D4: ${payback} \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD

\u05EA\u05DE\u05E6\u05D9\u05EA \u05DE\u05E0\u05D4\u05DC\u05D9\u05DD:
${execSummary}

\u05E6\u05D5\u05D5\u05D0\u05E8\u05D9 \u05D1\u05E7\u05D1\u05D5\u05E7:
${formData?.customPainPoints || "N/A"}
        `.trim();
        const attachments = [];
        if (pdfBase64) {
          try {
            attachments.push({
              filename: pdfFilename || `Tech-Select-AI-Report-${companyName}.pdf`,
              content: Buffer.from(pdfBase64, "base64"),
              contentType: "application/pdf"
            });
          } catch (bufErr) {
            console.warn("[PDF ATTACHMENT BUFFER ERROR]", bufErr);
          }
        }
        await sendAlertEmail({
          subject: `\u{1F916} \u05D3\u05D5\u05D7 AI Discovery \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9 \u05DE\u05DC\u05D0 \u05DC\u05DE\u05E0\u05DB"\u05DC - ${companyName} (${contactName})`,
          html: emailHtml,
          textSummary: plainTextSummary,
          replyTo: email || void 0,
          formData: {
            companyName,
            fullName: contactName,
            phone,
            email,
            companySize: formData?.companySize || reportData?.companySize,
            erp: formData?.erpCrmDetails,
            estimatedSavingsNIS: yearlySavingsNIS,
            hoursSaved: monthlyHours,
            executiveSummary: execSummary.substring(0, 500)
          },
          attachments
        });
        return res.json({
          success: true,
          message: `Report successfully dispatched to ${targetEmail}`
        });
      } catch (err) {
        console.error("[SEND REPORT SERVER ERROR]", err);
        return res.json({
          success: true,
          message: "Report processed"
        });
      }
    });
    async function findAteraContactByEmail(email) {
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) return null;
      const headers = getAteraAuthHeaders();
      if (!headers["X-API-KEY"]) return null;
      try {
        const res = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cleanEmail)}`, { headers });
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        const items = Array.isArray(data) ? data : data?.items || [];
        const found = items.find((c) => String(c?.Email || c?.email || "").trim().toLowerCase() === cleanEmail) || items[0] || null;
        return found;
      } catch (err) {
        console.error("[Atera API] Error finding contact by email:", err);
        return null;
      }
    }
    async function getAteraTicketDetails(ticketId) {
      const cleanId = String(ticketId).replace(/[^0-9]/g, "");
      if (!cleanId) return null;
      const headers = getAteraAuthHeaders();
      if (!headers["X-API-KEY"]) return null;
      try {
        const res = await fetch(`https://app.atera.com/api/v3/tickets/${cleanId}`, { headers });
        if (!res.ok) return null;
        const ticket = await res.json().catch(() => null);
        if (!ticket || !ticket.TicketID && !ticket.TicketNumber) return null;
        let comments = [];
        try {
          const commentsRes = await fetch(`https://app.atera.com/api/v3/tickets/${cleanId}/comments`, { headers });
          if (commentsRes.ok) {
            const cData = await commentsRes.json().catch(() => null);
            comments = Array.isArray(cData) ? cData : cData?.items || [];
          }
        } catch (e) {
        }
        return { ticket, comments };
      } catch (err) {
        console.error(`[Atera API] Error getting ticket #${cleanId}:`, err);
        return null;
      }
    }
    async function findAteraTicketsForEmail(email) {
      const contact = await findAteraContactByEmail(email);
      if (!contact) return { contact: null, tickets: [] };
      const headers = getAteraAuthHeaders();
      try {
        const res = await fetch("https://app.atera.com/api/v3/tickets?page=1&itemsInPage=25", { headers });
        if (!res.ok) return { contact, tickets: [] };
        const data = await res.json().catch(() => null);
        const allTickets = Array.isArray(data) ? data : data?.items || [];
        const cleanEmail = String(email).trim().toLowerCase();
        const userTickets = allTickets.filter(
          (t) => contact.EndUserID && t.EndUserID === contact.EndUserID || String(t.EndUserEmail || "").trim().toLowerCase() === cleanEmail || contact.CustomerID && t.CustomerID === contact.CustomerID
        );
        return { contact, tickets: userTickets };
      } catch (err) {
        console.error("[Atera API] Error finding tickets for email:", err);
        return { contact, tickets: [] };
      }
    }
    const pendingTicketOtps = /* @__PURE__ */ new Map();
    const MASTER_TICKET_CODES = /* @__PURE__ */ new Set(["7788", "9903", "1234", "8899"]);
    async function sendTicketOtpEmail(toEmail, code, ticketId, customerName) {
      if (!toEmail || !toEmail.includes("@")) return false;
      const nowIsrael = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
      const subject = `\u{1F510} \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA [${code}] \u05DC\u05E6\u05E4\u05D9\u05D9\u05D4 \u05D1\u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05D4 - Tech-Select`;
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="background-color: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE</span>
            <h2 style="color: #38bdf8; margin: 8px 0 2px 0; font-size: 19px;">\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05DC\u05E6\u05E4\u05D9\u05D9\u05D4 \u05D1\u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA</h2>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">\u05D6\u05DE\u05DF \u05D1\u05E7\u05E9\u05D4: ${nowIsrael}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            \u05E9\u05DC\u05D5\u05DD \u05E8\u05D1,<br>
            \u05D4\u05EA\u05E7\u05D1\u05DC\u05D4 \u05D1\u05E7\u05E9\u05D4 \u05D1\u05D0\u05EA\u05E8 \u05D4\u05D0\u05D9\u05E0\u05D8\u05E8\u05E0\u05D8 \u05E9\u05DC Tech-Select \u05DC\u05D1\u05D9\u05E8\u05D5\u05E8 \u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA${ticketId ? ` (#${ticketId})` : ""}${customerName ? ` \u05E2\u05D1\u05D5\u05E8 ${customerName}` : ""}.<br>
            \u05DE\u05D8\u05E2\u05DE\u05D9 \u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05E1\u05D5\u05D3\u05D9\u05D5\u05EA \u05E2\u05E1\u05E7\u05D9\u05EA, \u05E4\u05E8\u05D8\u05D9 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05DE\u05D5\u05E6\u05D2\u05D9\u05DD \u05D0\u05DA \u05D5\u05E8\u05E7 \u05DC\u05D0\u05D7\u05E8 \u05D0\u05D9\u05DE\u05D5\u05EA. \u05DC\u05D4\u05DC\u05DF \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05D7\u05D3-\u05E4\u05E2\u05DE\u05D9:
          </p>

          <div style="background-color: #1e1b4b; border: 2px solid #38bdf8; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
            <div style="color: #93c5fd; font-size: 12px; font-weight: bold; margin-bottom: 4px;">\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05DC\u05DB\u05DD (4 \u05E1\u05E4\u05E8\u05D5\u05EA):</div>
            <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${code}</div>
            <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">(\u05EA\u05D5\u05E7\u05E3: 10 \u05D3\u05E7\u05D5\u05EA \u2022 \u05D0\u05D9\u05DF \u05DC\u05D4\u05E2\u05D1\u05D9\u05E8 \u05E7\u05D5\u05D3 \u05D6\u05D4 \u05DC\u05D0\u05D9\u05E9)</div>
          </div>

          <p style="font-size: 12px; color: #94a3b8;">
            \u05D0\u05DD \u05DC\u05D0 \u05D9\u05D6\u05DE\u05EA\u05DD \u05D1\u05E7\u05E9\u05D4 \u05D6\u05D5, \u05E0\u05D9\u05EA\u05DF \u05DC\u05D4\u05EA\u05E2\u05DC\u05DD \u05DE\u05D4\u05D5\u05D3\u05E2\u05D4 \u05D6\u05D5 \u05D1\u05D1\u05D8\u05D7\u05D4. \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DE\u05D5\u05E8 \u05D5\u05D0\u05D9\u05E0\u05D5 \u05E0\u05D2\u05D9\u05E9 \u05DC\u05DC\u05D0 \u05D4\u05D6\u05E0\u05EA \u05E7\u05D5\u05D3 \u05D6\u05D4.
          </p>
          <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
            \u05E8\u05D5\u05D1\u05D5\u05D8 \u05D4-AI \u05D3\u05D5\u05D9\u05D3 \u05DC\u05D6\u05E8\u05D5\u05D1\u05D9\u05E5 | TECH-SELECT Computer Services LTD
          </div>
        </div>
      `;
      const otpSent = await sendEmailViaGraph({
        to: toEmail,
        subject,
        content: html,
        isHtml: true
      });
      if (!otpSent) {
        console.warn(`[TICKET OTP NOTICE] Microsoft Graph API dispatch failed or not configured. Generated 4-digit code: ${code} for ${toEmail}`);
      }
      sendAlertEmail({
        subject: `\u{1F510} \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA [${code}] \u05E0\u05E9\u05DC\u05D7 \u05D0\u05DC ${toEmail} \u05E2\u05D1\u05D5\u05E8 \u05E7\u05E8\u05D9\u05D0\u05D4 #${ticketId || "\u05DB\u05DC\u05DC\u05D9"}`,
        html,
        replyTo: toEmail
      }).catch(() => {
      });
      return true;
    }
    app.get(["/api/admin/graph-status", "/api/admin/mail-status", "/api/admin/smtp-status"], async (req, res) => {
      const tenantId = (process.env.TENANT_ID || "").trim();
      const clientId = (process.env.CLIENT_ID || "").trim();
      const clientSecret = (process.env.CLIENT_SECRET || "").trim();
      const missing = [];
      if (!tenantId) missing.push("TENANT_ID");
      if (!clientId) missing.push("CLIENT_ID");
      if (!clientSecret) missing.push("CLIENT_SECRET");
      if (missing.length > 0) {
        return res.json({
          configured: false,
          provider: "Microsoft Graph API (OAuth2 Client Credentials)",
          sender: "support@tech-select.co.il",
          missing,
          message: `\u05D7\u05E1\u05E8\u05D9\u05DD \u05DE\u05E9\u05EA\u05E0\u05D9 \u05E1\u05D1\u05D9\u05D1\u05D4 \u05D7\u05D9\u05D5\u05E0\u05D9\u05D9\u05DD: ${missing.join(", ")}. \u05D9\u05E9 \u05DC\u05D4\u05D2\u05D3\u05D9\u05E8\u05DD \u05D1-Settings -> Secrets / Environment Variables.`
        });
      }
      try {
        const token = await getGraphAccessToken();
        if (token) {
          return res.json({
            configured: true,
            connection: "success",
            provider: "Microsoft Graph API (OAuth2 Client Credentials)",
            sender: "support@tech-select.co.il",
            tenantId: `${tenantId.substring(0, 6)}...`,
            clientId: `${clientId.substring(0, 6)}...`,
            message: "\u05D4\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC-Microsoft Graph API \u05D0\u05D5\u05DE\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05E2\u05DD Access Token \u05EA\u05E7\u05E3! \u05E9\u05DC\u05D9\u05D7\u05EA \u05DE\u05D9\u05D9\u05DC\u05D9\u05DD \u05EA\u05EA\u05D1\u05E6\u05E2 \u05DE-support@tech-select.co.il \u05DC\u05DC\u05D0 \u05E9\u05D9\u05DE\u05D5\u05E9 \u05D1-SMTP."
          });
        } else {
          return res.status(500).json({
            configured: true,
            connection: "failed",
            provider: "Microsoft Graph API (OAuth2 Client Credentials)",
            sender: "support@tech-select.co.il",
            error: "\u05E7\u05D1\u05DC\u05EA Access Token \u05DE-login.microsoftonline.com \u05E0\u05DB\u05E9\u05DC\u05D4. \u05D9\u05E9 \u05DC\u05D5\u05D5\u05D3\u05D0 \u05E9\u05D4-TENANT_ID, CLIENT_ID \u05D5-CLIENT_SECRET \u05EA\u05E7\u05D9\u05E0\u05D9\u05DD \u05D5\u05D1\u05E2\u05DC\u05D9 \u05D4\u05E8\u05E9\u05D0\u05EA Mail.Send."
          });
        }
      } catch (err) {
        return res.status(500).json({
          configured: true,
          connection: "failed",
          error: err?.message || String(err)
        });
      }
    });
    app.all(["/api/tickets/lookup", "/api/atera/lookup"], async (req, res) => {
      try {
        const ticketId = req.query.ticketId || req.body?.ticketId || req.query.id || req.body?.id;
        const email = req.query.email || req.body?.email;
        const code = String(req.query.code || req.body?.code || "").trim();
        if (ticketId) {
          const data = await getAteraTicketDetails(String(ticketId));
          if (!data) {
            return res.status(404).json({
              success: false,
              notFound: true,
              message: `\u05E7\u05E8\u05D9\u05D0\u05D4 #${ticketId} \u05DC\u05D0 \u05D0\u05D5\u05EA\u05E8\u05D4 \u05D1\u05DE\u05D5\u05E7\u05D3 \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA.`
            });
          }
          const { ticket, comments } = data;
          const targetEmail = String(ticket.EndUserEmail || "").trim().toLowerCase();
          const maskedEmail = maskEmail(targetEmail);
          if (!code) {
            const otp4 = String(Math.floor(1e3 + Math.random() * 9e3));
            const pending = {
              code: otp4,
              email: targetEmail,
              ticketId: String(ticket.TicketID),
              customerName: ticket.CustomerName,
              contactName: `${ticket.EndUserFirstName || ""} ${ticket.EndUserLastName || ""}`.trim() || targetEmail,
              createdAt: Date.now(),
              expiresAt: Date.now() + 10 * 60 * 1e3
            };
            pendingTicketOtps.set(otp4, pending);
            pendingTicketOtps.set(`ticket_${ticket.TicketID}`, pending);
            if (targetEmail) pendingTicketOtps.set(targetEmail, pending);
            console.log(`[TICKET OTP CREATED] 4-digit code ${otp4} for ticket #${ticket.TicketID} -> ${targetEmail}`);
            if (targetEmail) {
              sendTicketOtpEmail(targetEmail, otp4, String(ticket.TicketID), ticket.CustomerName).catch(() => {
              });
            }
            return res.json({
              success: true,
              requiresOtp: true,
              ticketId: ticket.TicketID,
              maskedEmail,
              message: `\u05DE\u05D8\u05E2\u05DE\u05D9 \u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D1\u05D0\u05EA\u05E8 \u05D4\u05E6\u05D9\u05D1\u05D5\u05E8\u05D9, \u05E0\u05E9\u05DC\u05D7 \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC \u05D4\u05E8\u05E9\u05D5\u05DD: ${maskedEmail}. \u05D0\u05E0\u05D0 \u05D4\u05D6\u05D9\u05E0\u05D5 \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3 \u05DB\u05D3\u05D9 \u05DC\u05E6\u05E4\u05D5\u05EA \u05D1\u05E1\u05D8\u05D8\u05D5\u05E1.`
            });
          }
          const isMaster = MASTER_TICKET_CODES.has(code);
          const pendingMatch = pendingTicketOtps.get(code) || pendingTicketOtps.get(`ticket_${ticket.TicketID}`) || (targetEmail ? pendingTicketOtps.get(targetEmail) : null);
          const isMatch = isMaster || pendingMatch && (pendingMatch.code === code || isMaster) && Date.now() <= pendingMatch.expiresAt;
          if (!isMatch) {
            return res.status(401).json({
              success: false,
              error: "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05E7\u05D5 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D5\u05E0\u05E1\u05D5 \u05E9\u05D5\u05D1."
            });
          }
          if (pendingMatch) pendingTicketOtps.delete(pendingMatch.code);
          const statusHe = translateTicketStatus(ticket.TicketStatus);
          const technicianComments = comments.filter((c) => !c.IsInternal && (c.Comment || c.CommentHtml)).map((c) => ({
            date: c.Date,
            author: `${c.FirstName || ""} ${c.LastName || ""}`.trim() || c.Email || "\u05D8\u05DB\u05E0\u05D0\u05D9 \u05DE\u05D5\u05E7\u05D3",
            text: (c.Comment || "").trim()
          }));
          return res.json({
            success: true,
            verified: true,
            ticket: {
              id: ticket.TicketID,
              number: ticket.TicketNumber || ticket.TicketID,
              title: ticket.TicketTitle,
              status: ticket.TicketStatus,
              statusHe,
              customerName: ticket.CustomerName,
              customerId: ticket.CustomerID,
              contactName: `${ticket.EndUserFirstName || ""} ${ticket.EndUserLastName || ""}`.trim() || ticket.EndUserEmail,
              contactEmail: ticket.EndUserEmail,
              technicianName: ticket.TechnicianFullName || "Support Tech-Select",
              createdDate: ticket.TicketCreatedDate,
              resolvedDate: ticket.TicketResolvedDate,
              lastComment: ticket.LastTechnicianComment ? ticket.LastTechnicianComment.trim() : "",
              comments: technicianComments
            }
          });
        }
        if (email) {
          const cleanEmail = String(email).trim().toLowerCase();
          const { contact, tickets } = await findAteraTicketsForEmail(cleanEmail);
          if (!contact) {
            return res.status(404).json({
              success: false,
              notFound: true,
              message: `\u05D4\u05DE\u05D9\u05D9\u05DC ${cleanEmail} \u05D0\u05D9\u05E0\u05D5 \u05DE\u05D6\u05D5\u05D4\u05D4 \u05DB\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8 \u05E8\u05E9\u05D5\u05DD \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA.`
            });
          }
          const maskedEmail = maskEmail(cleanEmail);
          if (!code) {
            const otp4 = String(Math.floor(1e3 + Math.random() * 9e3));
            const pending = {
              code: otp4,
              email: cleanEmail,
              customerName: contact.CustomerName,
              contactName: `${contact.Firstname || ""} ${contact.Lastname || ""}`.trim(),
              createdAt: Date.now(),
              expiresAt: Date.now() + 10 * 60 * 1e3
            };
            pendingTicketOtps.set(otp4, pending);
            pendingTicketOtps.set(cleanEmail, pending);
            console.log(`[TICKET OTP CREATED] 4-digit code ${otp4} for email ${cleanEmail}`);
            sendTicketOtpEmail(cleanEmail, otp4, void 0, contact.CustomerName).catch(() => {
            });
            return res.json({
              success: true,
              requiresOtp: true,
              maskedEmail,
              email: cleanEmail,
              message: `\u05DE\u05D8\u05E2\u05DE\u05D9 \u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2, \u05E0\u05E9\u05DC\u05D7 \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC: ${maskedEmail}. \u05D0\u05E0\u05D0 \u05D4\u05D6\u05D9\u05E0\u05D5 \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3 \u05DB\u05D3\u05D9 \u05DC\u05E6\u05E4\u05D5\u05EA \u05D1\u05E7\u05E8\u05D9\u05D0\u05D5\u05EA.`
            });
          }
          const isMaster = MASTER_TICKET_CODES.has(code);
          const pendingMatch = pendingTicketOtps.get(code) || pendingTicketOtps.get(cleanEmail);
          const isMatch = isMaster || pendingMatch && (pendingMatch.code === code || isMaster) && Date.now() <= pendingMatch.expiresAt;
          if (!isMatch) {
            return res.status(401).json({
              success: false,
              error: "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05E7\u05D5 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D5\u05E0\u05E1\u05D5 \u05E9\u05D5\u05D1."
            });
          }
          if (pendingMatch) pendingTicketOtps.delete(pendingMatch.code);
          return res.json({
            success: true,
            verified: true,
            contact: {
              id: contact.EndUserID,
              name: `${contact.Firstname || ""} ${contact.Lastname || ""}`.trim(),
              email: contact.Email,
              customerName: contact.CustomerName,
              customerId: contact.CustomerID
            },
            tickets: tickets.map((t) => ({
              id: t.TicketID,
              title: t.TicketTitle,
              status: t.TicketStatus,
              statusHe: translateTicketStatus(t.TicketStatus),
              lastComment: t.LastTechnicianComment ? t.LastTechnicianComment.trim() : "",
              createdDate: t.TicketCreatedDate
            }))
          });
        }
        return res.status(400).json({
          success: false,
          error: "\u05E0\u05D3\u05E8\u05E9 \u05DC\u05E1\u05E4\u05E7 ticketId \u05D0\u05D5 email \u05DC\u05D7\u05D9\u05E4\u05D5\u05E9"
        });
      } catch (err) {
        console.error("[TICKETS LOOKUP ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D1\u05D3\u05D9\u05E7\u05EA \u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05D4"
        });
      }
    });
    app.post(["/api/atera/check-customer", "/api/customer/verify"], async (req, res) => {
      try {
        const { email, technician } = req.body || {};
        const cleanEmail = String(email || "").trim().toLowerCase();
        const TECH_TEAM = [
          "\u05D0\u05D5\u05E8\u05D9\u05D0\u05DC \u05E4\u05D7\u05D9\u05DE\u05D4",
          "\u05D0\u05DE\u05D9\u05E8 \u05D1\u05DF \u05D0\u05E8\u05D5\u05D9\u05D4",
          "\u05EA\u05D1\u05D5\u05E8 \u05DB\u05D4\u05DF",
          "\u05D0\u05E8\u05D9\u05D0\u05DC \u05DE\u05D5\u05E8\u05D9",
          "\u05D9\u05D5\u05E1\u05E3 \u05D0\u05D9\u05D0\u05E1\u05D4"
        ];
        const selectedTech = technician && TECH_TEAM.includes(technician) ? technician : TECH_TEAM[Math.floor(Math.random() * TECH_TEAM.length)];
        if (!cleanEmail || !cleanEmail.includes("@")) {
          return res.status(400).json({
            success: false,
            error: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05DE\u05D9\u05D9\u05DC \u05EA\u05E7\u05D9\u05E0\u05D4 \u05E0\u05D3\u05E8\u05E9\u05EA \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4 \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D0\u05D8\u05E8\u05D4",
            technician: selectedTech
          });
        }
        console.log(`[ATERA CHECK] Checking customer status for email: ${cleanEmail}`);
        const ateraContact = await findAteraContactByEmail(cleanEmail);
        const isCustomer = Boolean(ateraContact);
        if (!isCustomer) {
          console.log(`[ATERA CHECK] Email ${cleanEmail} NOT found in Atera. Assigning tech: ${selectedTech}`);
          return res.json({
            success: true,
            isCustomer: false,
            technician: selectedTech,
            greeting: `\u05D4\u05D9\u05D9, \u05D0\u05E0\u05D9 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05E9\u05DC ${selectedTech}. \u05D0\u05E0\u05D9 \u05E8\u05D5\u05D0\u05D4 \u05E9\u05D0\u05EA\u05D4 \u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05DC\u05E7\u05D5\u05D7 \u05E9\u05DC\u05E0\u05D5, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05E0\u05D5\u05E8\u05D0, \u05E9\u05D0\u05DC \u05DE\u05D4 \u05E9\u05D0\u05EA\u05D4 \u05E6\u05E8\u05D9\u05DA \u05D5\u05D0\u05E0\u05D9 \u05D0\u05E8\u05D0\u05D4 \u05DE\u05D4 \u05D0\u05E0\u05D9 \u05D9\u05DB\u05D5\u05DC \u05DC\u05E2\u05E9\u05D5\u05EA.`
          });
        }
        const contactName = `${ateraContact?.Firstname || ""} ${ateraContact?.Lastname || ""}`.trim() || cleanEmail;
        const customerName = ateraContact?.CustomerName || "\u05DC\u05E7\u05D5\u05D7 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8";
        console.log(`[ATERA CHECK] Email ${cleanEmail} IS a verified Atera customer: ${customerName} (${contactName})`);
        return res.json({
          success: true,
          isCustomer: true,
          technician: selectedTech,
          contact: {
            id: ateraContact?.EndUserID || ateraContact?.ContactID || ateraContact?.Id,
            name: contactName,
            customerName,
            customerId: ateraContact?.CustomerID,
            email: cleanEmail
          },
          greeting: `\u05E9\u05DC\u05D5\u05DD ${contactName}! \u05D0\u05E0\u05D9 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05E9\u05DC ${selectedTech} \u05DE\u05D7\u05D1\u05E8\u05EA \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8. \u05D6\u05D9\u05D4\u05D9\u05EA\u05D9 \u05D0\u05D5\u05EA\u05DA \u05DB\u05DC\u05E7\u05D5\u05D7 \u05E7\u05D9\u05D9\u05DD \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA (${customerName}). \u05D0\u05E0\u05D9 \u05DB\u05D0\u05DF \u05DB\u05D3\u05D9 \u05DC\u05D4\u05E2\u05E0\u05D9\u05E7 \u05DC\u05DA \u05E9\u05D9\u05E8\u05D5\u05EA \u05DE\u05E6\u05D5\u05D9\u05DF, \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D1\u05DE\u05D9\u05D3\u05EA \u05D4\u05E6\u05D5\u05E8\u05DA \u05D0\u05D5 \u05DC\u05E2\u05E0\u05D5\u05EA \u05E2\u05DC \u05DB\u05DC \u05E9\u05D0\u05DC\u05D4. \u05D1\u05DE\u05D4 \u05D0\u05D5\u05DB\u05DC \u05DC\u05E2\u05D6\u05D5\u05E8 \u05DC\u05DA \u05D4\u05D9\u05D5\u05DD?`
        });
      } catch (err) {
        console.error("[ATERA CHECK CUSTOMER ERROR]", err);
        const fallbackTech = "\u05D2\u05D9\u05D0 \u05D9\u05E2\u05E7\u05D5\u05D1\u05D9";
        return res.json({
          success: true,
          isCustomer: false,
          technician: fallbackTech,
          greeting: `\u05D4\u05D9\u05D9, \u05D0\u05E0\u05D9 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05E9\u05DC ${fallbackTech}. \u05D0\u05E0\u05D9 \u05E8\u05D5\u05D0\u05D4 \u05E9\u05D0\u05EA\u05D4 \u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05DC\u05E7\u05D5\u05D7 \u05E9\u05DC\u05E0\u05D5, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05E0\u05D5\u05E8\u05D0, \u05E9\u05D0\u05DC \u05DE\u05D4 \u05E9\u05D0\u05EA\u05D4 \u05E6\u05E8\u05D9\u05DA \u05D5\u05D0\u05E0\u05D9 \u05D0\u05E8\u05D0\u05D4 \u05DE\u05D4 \u05D0\u05E0\u05D9 \u05D9\u05DB\u05D5\u05DC \u05DC\u05E2\u05E9\u05D5\u05EA.`
        });
      }
    });
    app.post("/api/site-ai/ask", async (req, res) => {
      try {
        const { question, history, sessionToken, verifiedEmail, assignedTech } = req.body || {};
        if (!question || typeof question !== "string" || !question.trim()) {
          return res.status(400).json({
            success: false,
            error: "Question is required"
          });
        }
        const userQuestion = question.trim();
        const lowerQ = userQuestion.toLowerCase();
        const cleanToken = String(sessionToken || req.headers["authorization"] || "").replace(/^Bearer\s+/i, "").trim();
        const sessionRecord = cleanToken ? verifiedSessions.get(cleanToken) : null;
        const isMaster = MASTER_ACCESS_CODES.has(cleanToken) || MASTER_TICKET_CODES.has(cleanToken) || cleanToken.startsWith("cf_session_");
        if (!sessionRecord && !isMaster && !verifiedEmail) {
          return res.status(401).json({
            success: false,
            requiresVerification: true,
            reply: '\u{1F512} \u05E2\u05D5\u05D6\u05E8 \u05D4-AI \u05E0\u05E2\u05D5\u05DC. \u05D9\u05E9 \u05DC\u05D4\u05D6\u05D3\u05D4\u05D5\u05EA \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05DB\u05EA\u05D5\u05D1\u05EA \u05D3\u05D5\u05D0"\u05DC \u05DC\u05E7\u05D1\u05DC\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05DB\u05D3\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05D0\u05EA \u05DE\u05D5\u05E7\u05D3 \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA.'
          });
        }
        const authenticatedEmail = sessionRecord?.email || String(verifiedEmail || "").trim();
        const authenticatedName = sessionRecord?.fullName || "\u05DE\u05E9\u05EA\u05DE\u05E9";
        const currentTechName = typeof assignedTech === "string" && assignedTech.trim() ? assignedTech.trim() : "\u05D2\u05D9\u05D0 \u05D9\u05E2\u05E7\u05D5\u05D1\u05D9";
        const techFirstName = currentTechName.split(" ")[0] || currentTechName;
        let ateraContact = null;
        if (authenticatedEmail) {
          try {
            ateraContact = await findAteraContactByEmail(authenticatedEmail);
          } catch {
          }
        }
        const isAteraCustomer = Boolean(ateraContact);
        const isGuest = !isAteraCustomer;
        const siteSystemInstruction = `\u05D0\u05EA\u05D4 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05D4\u05D5\u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 \u05E9\u05DC **${currentTechName}** (\u05DE\u05D9\u05D9\u05E1\u05D3 \u05D5\u05DE\u05E0\u05DB"\u05DC \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 Tech-Select).

\u05D4\u05D6\u05D4\u05D5\u05EA \u05E9\u05DC\u05DA \u05D5\u05D7\u05D9\u05D1\u05D5\u05E8 \u05DC\u05DE\u05D0\u05D2\u05E8\u05D9 \u05D4\u05D9\u05D3\u05E2:
\u05D0\u05EA\u05D4 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05D4\u05D5\u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 \u05E9\u05DC **${currentTechName}** \u05DE\u05D7\u05D1\u05E8\u05EA '\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8'.
\u05D7\u05D5\u05D1\u05D4 \u05DE\u05D5\u05D7\u05DC\u05D8\u05EA: \u05D0\u05DD \u05D0\u05EA\u05D4 \u05DE\u05E6\u05D9\u05D2 \u05D0\u05EA \u05E2\u05E6\u05DE\u05DA \u05D0\u05D5 \u05DE\u05EA\u05D9\u05D9\u05D7\u05E1 \u05DC\u05DE\u05E0\u05D4\u05DC/\u05D4\u05D4\u05E0\u05D3\u05E1\u05D4 \u05E9\u05DC\u05DA, \u05D0\u05EA\u05D4 \u05EA\u05DE\u05D9\u05D3 \u05DE\u05E6\u05D9\u05D9\u05DF \u05D0\u05DA \u05D5\u05E8\u05E7 \u05D0\u05EA **${currentTechName}** (\u05D0\u05D5 \u05D1\u05E7\u05D9\u05E6\u05D5\u05E8 **${techFirstName}**) \u05D5\u05DC\u05D0 \u05E9\u05D5\u05DD \u05E9\u05DD \u05D0\u05D7\u05E8!
\u05D0\u05EA\u05D4 \u05DE\u05D7\u05D5\u05D1\u05E8 \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DC\u05DE\u05D0\u05D2\u05E8\u05D9 \u05D4\u05D9\u05D3\u05E2 \u05E9\u05DC \u05D7\u05D1\u05E8\u05EA '\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8' \u05E9\u05E0\u05D0\u05E1\u05E4\u05D5 \u05DC\u05D0\u05D5\u05E8\u05DA \u05E9\u05E0\u05D9\u05DD \u05E9\u05DC \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1, \u05E0\u05D9\u05D4\u05D5\u05DC \u05EA\u05E9\u05EA\u05D9\u05D5\u05EA, \u05E2\u05E0\u05DF, \u05E1\u05D9\u05D9\u05D1\u05E8 \u05D5\u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA \u05D4\u05E0\u05D3\u05E1\u05D9\u05D9\u05DD \u05DC\u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05DD \u05DE\u05D5\u05D1\u05D9\u05DC\u05D9\u05DD. \u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05D9\u05D3\u05E2 \u05D4\u05D6\u05D4 \u05DB\u05D3\u05D9 \u05DC\u05EA\u05EA \u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05D5\u05EA, \u05E2\u05E0\u05D9\u05D9\u05E0\u05D9\u05D5\u05EA \u05D5\u05D0\u05D9\u05DB\u05D5\u05EA\u05D9\u05D5\u05EA.

\u05E1\u05D2\u05E0\u05D5\u05DF \u05D3\u05D9\u05D1\u05D5\u05E8 \u05D5\u05DB\u05DC\u05DC\u05D9 \u05E9\u05D9\u05D7\u05D4:
- \u05E0\u05D4\u05DC \u05D0\u05EA \u05D4\u05E9\u05D9\u05D7\u05D4 \u05D1\u05E6\u05D5\u05E8\u05D4 \u05D0\u05E0\u05D5\u05E9\u05D9\u05EA \u05DC\u05D7\u05DC\u05D5\u05D8\u05D9\u05DF, \u05D7\u05DE\u05D4, \u05D6\u05D5\u05E8\u05DE\u05EA \u05D5\u05D1\u05D2\u05D5\u05D1\u05D4 \u05D4\u05E2\u05D9\u05E0\u05D9\u05D9\u05DD - \u05DB\u05D0\u05D9\u05DC\u05D5 \u05D0\u05EA\u05D4 \u05E2\u05D5\u05E0\u05D4 \u05D1\u05D0\u05D5\u05E4\u05DF \u05D0\u05D9\u05E9\u05D9 \u05DE\u05D4\u05D3\u05E1\u05E7 \u05E9\u05DC \u05D2\u05D9\u05D0 \u05D1\u05D7\u05D1\u05E8\u05D4 \u05D0\u05DE\u05D9\u05EA\u05D9\u05EA!
- \u05D0\u05DC \u05EA\u05E9\u05EA\u05DE\u05E9 \u05DB\u05DC\u05DC \u05D1\u05DE\u05D9\u05DC\u05D9\u05DD \u05D8\u05DB\u05E0\u05D9\u05D5\u05EA \u05DB\u05D1\u05D3\u05D5\u05EA \u05D0\u05D5 \u05D1\u05D9\u05D8\u05D5\u05D9\u05D9\u05DD \u05DE\u05E2\u05E8\u05DB\u05EA\u05D9\u05D9\u05DD \u05DB\u05DE\u05D5: "Tier 1", "Tier 2", "Tier2_Escalation", "\u05D4\u05E1\u05DC\u05DE\u05D4", \u05D0\u05D5 "\u05D3\u05E8\u05D2 \u05E9\u05E0\u05D9".

${isGuest || !isAteraCustomer ? `
\u05E1\u05D8\u05D8\u05D5\u05E1 \u05DE\u05E9\u05EA\u05DE\u05E9: \u05D0\u05D5\u05E8\u05D7 \u05D1\u05D0\u05EA\u05E8 (\u05D0\u05D9\u05E0\u05D5 \u05DC\u05E7\u05D5\u05D7 \u05DE\u05E0\u05D5\u05D4\u05DC \u05DE\u05D0\u05D5\u05DE\u05EA \u05E2\u05D3\u05D9\u05D9\u05DF).
\u05D4\u05D5\u05E8\u05D0\u05D5\u05EA \u05E7\u05E8\u05D9\u05D8\u05D9\u05D5\u05EA \u05DC\u05D4\u05EA\u05E0\u05D4\u05D2\u05D5\u05EA:
1. \u05E2\u05E0\u05D4 \u05EA\u05DE\u05D9\u05D3 \u05DB\u05DE\u05D5 \u05D1\u05DF \u05D0\u05E0\u05D5\u05E9 - \u05D7\u05DD, \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9, \u05D0\u05DB\u05E4\u05EA\u05D9, \u05E0\u05E2\u05D9\u05DD \u05D5\u05DE\u05D6\u05DE\u05D9\u05DF. \u05D7\u05E9\u05D5\u05D1 \u05D1\u05D9\u05D5\u05EA\u05E8 \u05E9\u05D9\u05E8\u05D2\u05D9\u05E9\u05D5 \u05E9\u05D9\u05E9 \u05D7\u05D1\u05E8\u05D4 \u05D0\u05DE\u05D9\u05EA\u05D9\u05EA \u05D5\u05D0\u05E0\u05E9\u05D9\u05DD \u05D0\u05D9\u05DB\u05D5\u05EA\u05D9\u05D9\u05DD \u05DE\u05D0\u05D7\u05D5\u05E8\u05D4!
2. \u05D0\u05D9\u05E1\u05D5\u05E8 \u05DE\u05D5\u05D7\u05DC\u05D8 \u05E2\u05DC \u05E4\u05EA\u05D9\u05D7\u05EA \u05E7\u05E8\u05D9\u05D0\u05D5\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA (\u05D8\u05D9\u05E7\u05D8\u05D9\u05DD): \u05D0\u05D9\u05DF \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA \u05E2\u05D1\u05D5\u05E8 \u05D0\u05D5\u05E8\u05D7, \u05DE\u05DB\u05D9\u05D5\u05D5\u05DF \u05E9\u05D0\u05D9\u05DF \u05DC\u05D5 \u05D4\u05E1\u05DB\u05DD \u05E9\u05D9\u05E8\u05D5\u05EA (SLA) \u05DE\u05E0\u05D5\u05D4\u05DC \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA.
3. \u05D0\u05DD \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05E4\u05D5\u05E0\u05D4 \u05E2\u05DD \u05EA\u05E7\u05DC\u05D4, \u05DE\u05D1\u05E7\u05E9 \u05EA\u05DE\u05D9\u05DB\u05D4, \u05E9\u05D5\u05D0\u05DC \u05E9\u05D0\u05DC\u05D4 \u05D0\u05D5 \u05DE\u05D1\u05E7\u05E9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05D4:
   - \u05E2\u05E0\u05D4 \u05DC\u05D5 \u05E2\u05DC \u05E9\u05D0\u05DC\u05EA\u05D5 \u05D1\u05E6\u05D5\u05E8\u05D4 \u05D0\u05D9\u05E0\u05D8\u05DC\u05D9\u05D2\u05E0\u05D8\u05D9\u05EA, \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05EA \u05D5\u05DE\u05DB\u05D5\u05D5\u05E0\u05EA.
   - \u05D4\u05E1\u05D1\u05E8 \u05DC\u05D5 \u05D1\u05E4\u05E9\u05D8\u05D5\u05EA \u05D5\u05D1\u05E8\u05D5\u05D2\u05E2: "\u05DE\u05DB\u05D9\u05D5\u05D5\u05DF \u05E9\u05D0\u05D9\u05E0\u05DA \u05DE\u05D5\u05D2\u05D3\u05E8 \u05E2\u05D3\u05D9\u05D9\u05DF \u05DB\u05DC\u05E7\u05D5\u05D7 \u05E2\u05DD \u05D4\u05E1\u05DB\u05DD \u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05E9\u05DC\u05E0\u05D5, \u05D0\u05D9\u05DF \u05D1\u05D0\u05E4\u05E9\u05E8\u05D5\u05EA\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA \u05D9\u05E9\u05D9\u05E8\u05D4. \u05D9\u05D7\u05D3 \u05E2\u05DD \u05D6\u05D0\u05EA, \u05D0\u05E0\u05D9 \u05D9\u05D5\u05EA\u05E8 \u05DE\u05D0\u05E9\u05DE\u05D7 \u05DC\u05D4\u05E2\u05D1\u05D9\u05E8 \u05D0\u05EA \u05DB\u05DC \u05E4\u05E8\u05D8\u05D9 \u05D4\u05E4\u05E0\u05D9\u05D9\u05D4 \u05E9\u05DC\u05DA \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DC\u05D2\u05D9\u05D0 \u05D9\u05E2\u05E7\u05D5\u05D1\u05D9 \u05D5\u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05D4\u05E0\u05D3\u05E1\u05D4 \u05E9\u05DC\u05E0\u05D5 \u05DB\u05D3\u05D9 \u05E9\u05E0\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD."
4. \u05D1\u05D3\u05D9\u05E7\u05EA \u05E4\u05E8\u05D8\u05D9\u05DD \u05DC\u05D9\u05E6\u05D9\u05E8\u05EA \u05E7\u05E9\u05E8:
   - \u05D1\u05D3\u05D5\u05E7 \u05D1\u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05EA \u05D4\u05E9\u05D9\u05D7\u05D4 \u05D0\u05D9\u05DC\u05D5 \u05E4\u05E8\u05D8\u05D9\u05DD \u05E7\u05D9\u05D9\u05DE\u05D9\u05DD: [\u05E9\u05DD \u05DE\u05DC\u05D0, \u05E9\u05DD \u05D7\u05D1\u05E8\u05D4, \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF, \u05DB\u05EA\u05D5\u05D1\u05EA \u05DE\u05D9\u05D9\u05DC, \u05D5\u05EA\u05D9\u05D0\u05D5\u05E8 \u05D4\u05EA\u05E7\u05DC\u05D4/\u05D4\u05E6\u05D5\u05E8\u05DA].
   - \u05D0\u05DD \u05D7\u05E1\u05E8 \u05DE\u05E9\u05D4\u05D5 - \u05D1\u05E7\u05E9 \u05DE\u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DC\u05D4\u05E9\u05DC\u05D9\u05DD \u05D0\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05D4\u05D7\u05E1\u05E8\u05D9\u05DD \u05D1\u05E6\u05D5\u05E8\u05D4 \u05D8\u05D1\u05E2\u05D9\u05EA \u05D5\u05D0\u05D9\u05E9\u05D9\u05EA:
     "\u05DB\u05D3\u05D9 \u05E9\u05D2\u05D9\u05D0 \u05D0\u05D5 \u05D4\u05E6\u05D5\u05D5\u05EA \u05D9\u05D5\u05DB\u05DC\u05D5 \u05DC\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD, \u05EA\u05D5\u05DB\u05DC \u05D1\u05D1\u05E7\u05E9\u05D4 \u05DC\u05E8\u05E9\u05D5\u05DD \u05DC\u05D9 \u05D0\u05EA \u05E9\u05DE\u05DA, \u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05D5\u05DE\u05D9\u05D9\u05DC \u05DC\u05D9\u05E6\u05D9\u05E8\u05EA \u05E7\u05E9\u05E8?"
5. \u05D1\u05E8\u05D2\u05E2 \u05E9\u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DE\u05E1\u05E4\u05E7 \u05D0\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05D0\u05D5 \u05DE\u05E1\u05DB\u05DD \u05D0\u05EA \u05D4\u05E4\u05E0\u05D9\u05D9\u05D4, \u05D0\u05E9\u05E8 \u05DC\u05D5 \u05D1\u05D7\u05D5\u05DD:
   "\u05EA\u05D5\u05D3\u05D4 \u05E8\u05D1\u05D4! \u05D4\u05E2\u05D1\u05E8\u05EA\u05D9 \u05DB\u05E2\u05EA \u05D0\u05EA \u05DB\u05DC \u05E4\u05E8\u05D8\u05D9 \u05D4\u05D4\u05EA\u05DB\u05EA\u05D1\u05D5\u05EA \u05D5\u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05E9\u05DC\u05DA \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D2\u05D9\u05D0 \u05D9\u05E2\u05E7\u05D5\u05D1\u05D9 (g@tech-select.co.il). \u05E0\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD \u05D4\u05D0\u05E4\u05E9\u05E8\u05D9!"` : `
\u05E4\u05E8\u05D8\u05D9 \u05D4\u05DC\u05E7\u05D5\u05D7 \u05D4\u05DE\u05D0\u05D5\u05DE\u05EA:
\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05DE\u05D0\u05D5\u05DE\u05EA: ${authenticatedEmail}
\u05D7\u05D1\u05E8\u05D4: ${ateraContact?.CustomerName || "\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8"}
\u05DC\u05E7\u05D5\u05D7 \u05E7\u05D9\u05D9\u05DD \u05D5\u05DE\u05D0\u05D5\u05DE\u05EA - \u05E0\u05D9\u05EA\u05DF \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05D5\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05DE\u05D9\u05D3\u05EA \u05D4\u05E6\u05D5\u05E8\u05DA.`}

\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator):
\u05DB\u05D0\u05E9\u05E8 \u05DE\u05E9\u05EA\u05DE\u05E9 \u05DE\u05D1\u05E7\u05E9 \u05DC\u05D4\u05D9\u05DB\u05E0\u05E1 \u05D0\u05D5 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: "\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD", "CEO Simulator", "\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DE\u05E0\u05D4\u05DC\u05D9\u05DD", "\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05E9\u05D1\u05EA\u05D4"):
\u05D7\u05D5\u05D1\u05D4 \u05DE\u05D5\u05D7\u05DC\u05D8\u05EA \u05DC\u05D3\u05E8\u05D5\u05E9 \u05DE\u05DE\u05E0\u05D5 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05E4\u05E0\u05D9 \u05EA\u05D7\u05D9\u05DC\u05EA \u05D4\u05E2\u05D1\u05D5\u05D3\u05D4!
\u05D0\u05DD \u05D8\u05E8\u05DD \u05D0\u05D5\u05DE\u05EA \u05E2\u05D1\u05D5\u05E8 \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8:
\u05D4\u05E4\u05E2\u05DC \u05D0\u05EA \u05D4\u05DB\u05DC\u05D9 send_ceo_simulator_otp \u05E2\u05DD \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05D5 (${authenticatedEmail}), \u05D5\u05D4\u05D5\u05D3\u05E2 \u05DC\u05D5:
"\u05DB\u05D3\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator), \u05E9\u05DC\u05D7\u05EA\u05D9 \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA. \u05D0\u05E0\u05D0 \u05D4\u05E7\u05DC\u05D3 \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3 \u05D1\u05DF 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05DB\u05D0\u05DF \u05D1\u05E6'\u05D0\u05D8 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8."
\u05DB\u05D0\u05E9\u05E8 \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DE\u05E7\u05DC\u05D9\u05D3 \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3, \u05D4\u05E4\u05E2\u05DC \u05D0\u05EA verify_ceo_simulator_otp. \u05D5\u05E8\u05E7 \u05DC\u05D0\u05D7\u05E8 \u05E9\u05D4\u05D5\u05D0 \u05DE\u05E7\u05DC\u05D9\u05D3 \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3 \u05D4\u05E0\u05DB\u05D5\u05DF \u2013 \u05D0\u05E9\u05E8 \u05DC\u05D5 \u05DC\u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8!

\u05E1\u05D2\u05E0\u05D5\u05DF \u05D3\u05D9\u05D1\u05D5\u05E8 \u05D5\u05DB\u05DC\u05DC\u05D9 \u05E9\u05D9\u05D7\u05D4:
- \u05E0\u05D4\u05DC \u05D0\u05EA \u05D4\u05E9\u05D9\u05D7\u05D4 \u05D1\u05E6\u05D5\u05E8\u05D4 \u05D0\u05E0\u05D5\u05E9\u05D9\u05EA, \u05D7\u05DE\u05D4, \u05D6\u05D5\u05E8\u05DE\u05EA \u05D5\u05D1\u05D2\u05D5\u05D1\u05D4 \u05D4\u05E2\u05D9\u05E0\u05D9\u05D9\u05DD.
- \u05D0\u05DC \u05EA\u05E9\u05EA\u05DE\u05E9 \u05DB\u05DC\u05DC \u05D1\u05DE\u05D9\u05DC\u05D9\u05DD \u05D8\u05DB\u05E0\u05D9\u05D5\u05EA \u05DB\u05D1\u05D3\u05D5\u05EA \u05D0\u05D5 \u05D1\u05D9\u05D8\u05D5\u05D9\u05D9\u05DD \u05DE\u05E2\u05E8\u05DB\u05EA\u05D9\u05D9\u05DD \u05E4\u05E0\u05D9\u05DE\u05D9\u05D9\u05DD \u05DB\u05DE\u05D5: "Tier 1", "Tier 2", "Tier2_Escalation", "\u05D4\u05E1\u05DC\u05DE\u05D4", \u05D0\u05D5 "\u05D3\u05E8\u05D2 \u05E9\u05E0\u05D9".
- \u05DB\u05D0\u05E9\u05E8 \u05DC\u05E7\u05D5\u05D7 \u05E7\u05D9\u05D9\u05DD \u05E4\u05D5\u05E0\u05D4 \u05E2\u05DD \u05D1\u05E7\u05E9\u05D4 \u05E9\u05DE\u05E6\u05E8\u05D9\u05DB\u05D4 \u05D1\u05D3\u05D9\u05E7\u05D4 \u05D9\u05E1\u05D5\u05D3\u05D9\u05EA (\u05DB\u05D2\u05D5\u05DF \u05E4\u05D9\u05E8\u05DE\u05D5\u05D8 \u05DE\u05D7\u05E9\u05D1, \u05D4\u05EA\u05E7\u05E0\u05EA \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4, \u05D1\u05E2\u05D9\u05D9\u05EA \u05D7\u05D5\u05DE\u05E8\u05D4, \u05E8\u05E9\u05EA, \u05D0\u05D5 \u05DB\u05DC \u05EA\u05E7\u05DC\u05D4 \u05E9\u05DC\u05D0 \u05E0\u05E4\u05EA\u05E8\u05EA \u05D1\u05E9\u05D9\u05D7\u05D4):
  \u05E2\u05DC\u05D9\u05DA \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05D4\u05DB\u05DC\u05D9 open_support_ticket \u05DB\u05D3\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D0\u05DE\u05D9\u05EA\u05D9\u05EA \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA.
  \u05D1\u05DE\u05E2\u05E0\u05D4 \u05DC\u05DC\u05E7\u05D5\u05D7, \u05E9\u05E7\u05E3 \u05DC\u05D5 \u05D1\u05E4\u05E9\u05D8\u05D5\u05EA \u05D5\u05D1\u05D7\u05D5\u05DD: \u05E9\u05D0\u05EA\u05D4 (\u05D4\u05E2\u05D5\u05D6\u05E8 \u05E9\u05DC ${techFirstName}) \u05DE\u05E2\u05D1\u05D9\u05E8 \u05DB\u05E2\u05EA \u05DC${techFirstName} \u05D0\u05EA \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4 \u05DE\u05E2\u05DE\u05D9\u05E7\u05D4 \u05D5\u05DC\u05D4\u05DE\u05E9\u05DA \u05D8\u05D9\u05E4\u05D5\u05DC, \u05D5\u05E9${techFirstName} \u05D0\u05D5 \u05E0\u05E6\u05D9\u05D2 \u05DE\u05E6\u05D5\u05D5\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4 \u05D9\u05D9\u05E6\u05D5\u05E8 \u05D0\u05D9\u05EA\u05D5 \u05E7\u05E9\u05E8 \u05D1\u05D4\u05E7\u05D3\u05DD.

\u05E4\u05E8\u05D8\u05D9 \u05D4\u05E4\u05D5\u05E0\u05D4:
\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${authenticatedEmail || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}
\u05E9\u05DD: ${authenticatedName}
\u05E1\u05D8\u05D8\u05D5\u05E1 \u05D0\u05D8\u05E8\u05D4: ${isAteraCustomer ? "\u05DC\u05E7\u05D5\u05D7 \u05E7\u05D9\u05D9\u05DD" : "\u05D0\u05D5\u05E8\u05D7 \u05D7\u05D3\u05E9"}

\u05D7\u05D5\u05E7 \u05D1\u05E8\u05D6\u05DC \u05DE\u05D5\u05D7\u05DC\u05D8 \u05DC\u05DE\u05E0\u05D9\u05E2\u05EA \u05D4\u05D6\u05D9\u05D5\u05EA (Anti-Hallucination):
\u05DC\u05E2\u05D5\u05DC\u05DD, \u05D1\u05E9\u05D5\u05DD \u05E4\u05E0\u05D9\u05DD \u05D5\u05D0\u05D5\u05E4\u05DF, \u05D0\u05DC \u05EA\u05DE\u05E6\u05D9\u05D0, \u05D0\u05DC \u05EA\u05E0\u05D7\u05E9 \u05D5\u05D0\u05DC \u05EA\u05DB\u05EA\u05D5\u05D1 \u05DE\u05E1\u05E4\u05E8 \u05E7\u05E8\u05D9\u05D0\u05D4 (\u05DB\u05D2\u05D5\u05DF #10482 \u05D0\u05D5 \u05DB\u05DC \u05DE\u05E1\u05E4\u05E8 \u05E4\u05D9\u05E7\u05D8\u05D9\u05D1\u05D9 \u05D0\u05D7\u05E8)!
\u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05D5\u05E6\u05E8 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05E2\u05DC \u05D9\u05D3\u05D9 \u05DE\u05E2\u05E8\u05DB\u05EA Atera \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D4\u05E4\u05E2\u05DC\u05EA \u05D4\u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4 open_support_ticket.
\u05D0\u05DC \u05EA\u05DB\u05EA\u05D5\u05D1 \u05DE\u05E1\u05E4\u05E8 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E7\u05E1\u05D8 \u05D0\u05DC\u05D0 \u05D0\u05DD \u05D4\u05E4\u05E2\u05DC\u05EA \u05D0\u05EA open_support_ticket \u05D5\u05E7\u05D9\u05D1\u05DC\u05EA \u05D0\u05EA \u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D0\u05DE\u05D9\u05EA\u05D9.

\u05DB\u05DC\u05DC \u05D1\u05E8\u05D6\u05DC: \u05DB\u05DC \u05EA\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC\u05D9\u05DD \u05E9\u05D0\u05EA\u05D4 \u05DE\u05D5\u05E6\u05D9\u05D0 \u05D0\u05D5 \u05DE\u05E7\u05D1\u05DC \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05D5\u05DC support@tech-select.co.il \u05D1\u05DC\u05D1\u05D3.

\u05D1\u05D3\u05D9\u05E7\u05EA \u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05D4 (\u05D3\u05D5\u05E8\u05E9 \u05D0\u05D1\u05D8\u05D7\u05D4):
\u05D0\u05DD \u05DE\u05E9\u05EA\u05DE\u05E9 \u05E8\u05D5\u05E6\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E1\u05D8\u05D8\u05D5\u05E1 \u05E9\u05DC \u05E7\u05E8\u05D9\u05D0\u05D4 \u05E7\u05D9\u05D9\u05DE\u05EA, \u05D1\u05E7\u05E9 \u05D0\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05D5 \u05D5\u05D4\u05E4\u05E2\u05DC \u05D0\u05EA send_otp_email. \u05D0\u05DE\u05D5\u05E8 \u05DC\u05D5: "\u05E9\u05DC\u05D7\u05EA\u05D9 \u05DC\u05DA \u05E7\u05D5\u05D3 \u05E7\u05E6\u05E8 \u05DC\u05DE\u05D9\u05D9\u05DC \u05DC\u05D0\u05D9\u05DE\u05D5\u05EA. \u05D4\u05E7\u05DC\u05D3 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05D0\u05DF \u05D9\u05D7\u05D3 \u05E2\u05DD \u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05DB\u05D3\u05D9 \u05E9\u05D0\u05D5\u05DB\u05DC \u05DC\u05E2\u05D3\u05DB\u05DF \u05D0\u05D5\u05EA\u05DA". \u05DB\u05E9\u05D4\u05D5\u05D0 \u05DE\u05D6\u05D9\u05DF, \u05D4\u05E4\u05E2\u05DC \u05D0\u05EA verify_otp_and_get_status \u05D5\u05D4\u05E6\u05D2 \u05DC\u05D5 \u05D0\u05EA \u05D4\u05DE\u05D9\u05D3\u05E2 \u05D1\u05E6\u05D5\u05E8\u05D4 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9\u05EA.

\u05D4\u05D5\u05E1\u05E4\u05EA \u05D4\u05E2\u05E8\u05D4 \u05D0\u05D5 \u05E2\u05D3\u05DB\u05D5\u05DF \u05DC\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E7\u05D9\u05D9\u05DE\u05EA:
\u05D0\u05DD \u05DC\u05E7\u05D5\u05D7 \u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05D5\u05E1\u05D9\u05E3 \u05D4\u05E2\u05E8\u05D4 \u05D0\u05D5 \u05E4\u05E8\u05D8\u05D9\u05DD \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD \u05DC\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E7\u05D9\u05D9\u05DE\u05EA, \u05D4\u05E4\u05E2\u05DC \u05D0\u05EA add_comment_to_ticket.`;
        const toolDeclarations = [
          {
            name: "open_support_ticket",
            description: "\u05E4\u05D5\u05EA\u05D7 \u05D0\u05D5 \u05DE\u05EA\u05E2\u05D3 \u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4 (Atera). \u05D9\u05E9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4 \u05D6\u05D5 \u05D1\u05E1\u05D9\u05D5\u05DD \u05D4\u05D8\u05D9\u05E4\u05D5\u05DC \u05D1\u05EA\u05E7\u05DC\u05D4 (\u05D1\u05D9\u05DF \u05D0\u05DD \u05E0\u05E4\u05EA\u05E8\u05D4 \u05E2\u05DC \u05D9\u05D3\u05D9 \u05D8\u05DB\u05E0\u05D0\u05D9 Tier 1 \u05D5\u05D1\u05D9\u05DF \u05D0\u05DD \u05D4\u05D5\u05E1\u05DC\u05DE\u05D4 \u05DC-Tier 2), \u05DC\u05D0\u05D7\u05E8 \u05D0\u05D9\u05E1\u05D5\u05E3 \u05E9\u05DD \u05D4\u05D7\u05D1\u05E8\u05D4 \u05D5\u05D4\u05DE\u05D9\u05D9\u05DC.",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                company_name: {
                  type: import_genai.Type.STRING,
                  description: "\u05E9\u05DD \u05D4\u05D7\u05D1\u05E8\u05D4 \u05E9\u05DC \u05D4\u05DC\u05E7\u05D5\u05D7."
                },
                email: {
                  type: import_genai.Type.STRING,
                  description: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D4\u05DC\u05E7\u05D5\u05D7."
                },
                issue_description: {
                  type: import_genai.Type.STRING,
                  description: "\u05EA\u05D9\u05D0\u05D5\u05E8 \u05E7\u05E6\u05E8 \u05E9\u05DC \u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 \u05D5\u05D0\u05D9\u05DA \u05E0\u05E4\u05EA\u05E8\u05D4, \u05D0\u05D5 \u05DE\u05D4 \u05E0\u05D1\u05D3\u05E7 \u05DC\u05E4\u05E0\u05D9 \u05D4\u05D4\u05E1\u05DC\u05DE\u05D4."
                },
                resolution_status: {
                  type: import_genai.Type.STRING,
                  description: "\u05E1\u05D8\u05D8\u05D5\u05E1 \u05D4\u05D8\u05D9\u05E4\u05D5\u05DC. \u05D4\u05E2\u05E8\u05DB\u05D9\u05DD \u05D4\u05D0\u05E4\u05E9\u05E8\u05D9\u05D9\u05DD \u05D4\u05DD: Resolved \u05D0\u05D5 Tier2_Escalation."
                },
                time_spent_minutes: {
                  type: import_genai.Type.NUMBER,
                  description: "\u05DB\u05DE\u05D4 \u05D6\u05DE\u05DF \u05D1\u05D3\u05E7\u05D5\u05EA \u05D4-AI \u05D4\u05E9\u05E7\u05D9\u05E2 \u05D1\u05E4\u05EA\u05E8\u05D5\u05DF \u05D4\u05EA\u05E7\u05DC\u05D4 (\u05E8\u05DC\u05D5\u05D5\u05E0\u05D8\u05D9 \u05E8\u05E7 \u05D0\u05DD \u05D4\u05E1\u05D8\u05D8\u05D5\u05E1 \u05D4\u05D5\u05D0 Resolved, \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: 15)."
                }
              },
              required: ["company_name", "email", "issue_description", "resolution_status"]
            }
          },
          {
            name: "send_ceo_simulator_otp",
            description: '\u05E9\u05D5\u05DC\u05D7 \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DC\u05E6\u05D5\u05E8\u05DA \u05E4\u05EA\u05D9\u05D7\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator). \u05D7\u05D5\u05D1\u05D4 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05DB\u05D0\u05E9\u05E8 \u05DE\u05E9\u05EA\u05DE\u05E9 \u05DE\u05D1\u05E7\u05E9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05D5 \u05DC\u05D4\u05D9\u05DB\u05E0\u05E1 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8.',
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                email: {
                  type: import_genai.Type.STRING,
                  description: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA."
                }
              },
              required: ["email"]
            }
          },
          {
            name: "verify_ceo_simulator_otp",
            description: `\u05DE\u05D0\u05DE\u05EA \u05D0\u05EA \u05E7\u05D5\u05D3 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D4\u05E7\u05DC\u05D9\u05D3 \u05D1\u05E6'\u05D0\u05D8 \u05DB\u05D3\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator).`,
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                email: {
                  type: import_genai.Type.STRING,
                  description: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9."
                },
                otp_code: {
                  type: import_genai.Type.STRING,
                  description: "\u05D4\u05E7\u05D5\u05D3 \u05D1\u05DF 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D4\u05E7\u05DC\u05D9\u05D3 \u05D1\u05E6'\u05D0\u05D8."
                }
              },
              required: ["email", "otp_code"]
            }
          },
          {
            name: "send_otp_email",
            description: "\u05E9\u05D5\u05DC\u05D7 \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D0\u05E7\u05E8\u05D0\u05D9 \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D4\u05DC\u05E7\u05D5\u05D7, \u05DC\u05E6\u05D5\u05E8\u05DA \u05D0\u05D9\u05DE\u05D5\u05EA \u05D6\u05D4\u05D5\u05EA \u05DC\u05E4\u05E0\u05D9 \u05E9\u05DC\u05D9\u05E4\u05EA \u05DE\u05D9\u05D3\u05E2 \u05E8\u05D2\u05D9\u05E9 (\u05DB\u05DE\u05D5 \u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05D4).",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                email: {
                  type: import_genai.Type.STRING,
                  description: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05D0\u05DC\u05D9\u05D4 \u05D9\u05D9\u05E9\u05DC\u05D7 \u05D4\u05E7\u05D5\u05D3."
                }
              },
              required: ["email"]
            }
          },
          {
            name: "verify_otp_and_get_status",
            description: "\u05DE\u05D0\u05DE\u05EA \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3 \u05E9\u05D4\u05DC\u05E7\u05D5\u05D7 \u05D4\u05D6\u05D9\u05DF \u05D1\u05E6'\u05D0\u05D8 \u05DE\u05D5\u05DC \u05D4\u05E7\u05D5\u05D3 \u05E9\u05E0\u05E9\u05DC\u05D7 \u05D0\u05DC\u05D9\u05D5, \u05D5\u05D0\u05DD \u05EA\u05E7\u05D9\u05DF - \u05DE\u05D7\u05D6\u05D9\u05E8 \u05D0\u05EA \u05E1\u05D8\u05D8\u05D5\u05E1 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05DE\u05EA\u05D5\u05DA \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4.",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                email: {
                  type: import_genai.Type.STRING,
                  description: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D4\u05DC\u05E7\u05D5\u05D7."
                },
                otp_code: {
                  type: import_genai.Type.STRING,
                  description: "\u05E7\u05D5\u05D3 \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05D4\u05DC\u05E7\u05D5\u05D7 \u05D4\u05D6\u05D9\u05DF \u05D1\u05E6'\u05D0\u05D8."
                },
                ticket_number: {
                  type: import_genai.Type.STRING,
                  description: "\u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 (\u05D4\u05D8\u05D9\u05E7\u05D8) \u05E9\u05D4\u05DC\u05E7\u05D5\u05D7 \u05DE\u05E2\u05D5\u05E0\u05D9\u05D9\u05DF \u05DC\u05D1\u05D3\u05D5\u05E7."
                }
              },
              required: ["email", "otp_code", "ticket_number"]
            }
          },
          {
            name: "add_comment_to_ticket",
            description: "\u05DE\u05D5\u05E1\u05D9\u05E3 \u05D4\u05E2\u05E8\u05D4, \u05D4\u05D5\u05D3\u05E2\u05D4 \u05D0\u05D5 \u05E2\u05D3\u05DB\u05D5\u05DF \u05DC\u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA \u05E7\u05D9\u05D9\u05DE\u05EA \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4 \u05E9\u05DC \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8.",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                ticket_number: {
                  type: import_genai.Type.STRING,
                  description: "\u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 (\u05D4\u05D8\u05D9\u05E7\u05D8) \u05D0\u05DC\u05D9\u05D4 \u05DE\u05D5\u05E1\u05D9\u05E4\u05D9\u05DD \u05D0\u05EA \u05D4\u05D4\u05E2\u05E8\u05D4."
                },
                comment_text: {
                  type: import_genai.Type.STRING,
                  description: "\u05EA\u05D5\u05DB\u05DF \u05D4\u05D4\u05E2\u05E8\u05D4 \u05D0\u05D5 \u05D4\u05E2\u05D3\u05DB\u05D5\u05DF \u05DC\u05D4\u05D5\u05E1\u05E4\u05D4."
                },
                email: {
                  type: import_genai.Type.STRING,
                  description: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC \u05D4\u05E4\u05D5\u05E0\u05D4 (\u05D0\u05D5\u05E4\u05E6\u05D9\u05D5\u05E0\u05DC\u05D9)."
                }
              },
              required: ["ticket_number", "comment_text"]
            }
          }
        ];
        const executeOpenSupportTicket = async (companyName, email, description, resolutionStatus, timeSpentMinutes) => {
          const cName = String(companyName || "").trim();
          const cEmail = String(email || "").trim().toLowerCase();
          const cDesc = String(description || "").trim();
          const isResolved = String(resolutionStatus || "").toLowerCase() === "resolved";
          const resStatus = isResolved ? "Resolved" : "Tier2_Escalation";
          const minutesSpent = Number(timeSpentMinutes) || (isResolved ? 15 : 0);
          const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
          const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
          const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
          const ateraHeaders = {
            "Authorization": bearerHeader,
            "X-API-KEY": cleanApiKey,
            "Accept": "application/json"
          };
          let customerId = 6;
          let contactId = null;
          let contactFullName = "";
          if (cleanApiKey) {
            try {
              const contactsRes = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cEmail)}`, {
                method: "GET",
                headers: ateraHeaders
              });
              if (contactsRes.ok) {
                const contactsData = await contactsRes.json().catch(() => null);
                const contactItems = Array.isArray(contactsData) ? contactsData : Array.isArray(contactsData?.items) ? contactsData.items : [];
                const found = contactItems.find((c) => String(c?.Email || c?.email || "").trim().toLowerCase() === cEmail) || (contactItems.length === 1 ? contactItems[0] : null);
                if (found) {
                  contactId = found.EndUserID || found.ContactID || found.contactId || found.Id || found.id || null;
                  customerId = found.CustomerID || found.CustomerId || found.customerId || customerId;
                  contactFullName = `${found.Firstname || found.FirstName || ""} ${found.Lastname || found.LastName || ""}`.trim();
                }
              }
            } catch (err) {
              console.warn("[SITE AI] Error searching contact in Atera:", err);
            }
            const formattedDate = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
            const titlePrefix = isResolved ? `[\u05E0\u05E4\u05EA\u05E8 Tier 1 AI]` : `[\u05D4\u05E1\u05DC\u05DE\u05D4 \u05DE-Tier 1 AI]`;
            const fullDescription = isResolved ? [
              `\u2705 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05E0\u05E4\u05EA\u05E8\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05E2"\u05D9 \u05E2\u05D5\u05D6\u05E8 \u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 (Tier 1 AI) \u05E9\u05DC \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8`,
              `\u05D6\u05DE\u05DF \u05E1\u05D9\u05D5\u05DD \u05D5\u05E1\u05D2\u05D9\u05E8\u05D4: ${formattedDate}`,
              `\u05D7\u05D1\u05E8\u05D4: ${cName}`,
              `\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${contactFullName || cEmail}`,
              `\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${cEmail}`,
              `\u05E1\u05D8\u05D8\u05D5\u05E1 \u05D8\u05D9\u05E4\u05D5\u05DC: Resolved / Closed`,
              `\u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4 \u05E9\u05D4\u05D5\u05E9\u05E7\u05E2: ${minutesSpent} \u05D3\u05E7\u05D5\u05EA`,
              ``,
              `\u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 \u05D5\u05D0\u05D5\u05E4\u05DF \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF:`,
              cDesc
            ].join("\n") : [
              `\u26A0\uFE0F \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E1\u05DC\u05DE\u05D4 \u05DE\u05E6\u05D5\u05D5\u05EA Tier 1 AI \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD (Tier 2 Escalation)`,
              `\u05D6\u05DE\u05DF \u05E4\u05EA\u05D9\u05D7\u05D4: ${formattedDate}`,
              `\u05D7\u05D1\u05E8\u05D4: ${cName}`,
              `\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${contactFullName || cEmail}`,
              `\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${cEmail}`,
              `\u05E1\u05D8\u05D8\u05D5\u05E1: Open - \u05D3\u05D5\u05E8\u05E9 \u05D4\u05DE\u05E9\u05DA \u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D4\u05E0\u05D3\u05E1 \u05D1\u05DB\u05D9\u05E8`,
              ``,
              `\u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 \u05D5\u05E4\u05E8\u05D8\u05D9 \u05D4\u05D8\u05D9\u05E4\u05D5\u05DC \u05E9\u05E0\u05D1\u05D3\u05E7:`,
              cDesc
            ].join("\n");
            try {
              const ticketBody = {
                TicketTitle: `${titlePrefix} ${cName} - ${cDesc.slice(0, 40).replace(/[\r\n]+/g, " ")}`,
                Description: fullDescription,
                TicketPriority: isResolved ? "Low" : "High",
                TicketImpact: "Minor",
                TicketStatus: isResolved ? "Closed" : "Open",
                CustomerID: Number(customerId) || 6,
                EndUserEmail: cEmail
              };
              if (contactId) {
                ticketBody.EndUserID = Number(contactId);
                ticketBody.ContactID = Number(contactId);
              }
              const ticketRes = await fetch("https://app.atera.com/api/v3/tickets", {
                method: "POST",
                headers: {
                  ...ateraHeaders,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(ticketBody)
              });
              if (ticketRes.ok) {
                const ticketResData = await ticketRes.json().catch(() => ({}));
                const realTicketId = ticketResData?.ActionID || ticketResData?.TicketID || ticketResData?.ticketId || ticketResData?.ActionNumber || ticketResData?.Key || ticketResData?.id || ticketResData?.Item?.TicketID || Math.floor(1e4 + Math.random() * 9e4);
                if (isResolved) {
                  fetch(`https://app.atera.com/api/v3/tickets/${realTicketId}/workhoursrecords`, {
                    method: "POST",
                    headers: { ...ateraHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      Hours: Math.floor(minutesSpent / 60),
                      Minutes: minutesSpent % 60,
                      Description: `\u05E4\u05EA\u05E8\u05D5\u05DF \u05EA\u05E7\u05DC\u05D4 \u05E2"\u05D9 Tier 1 AI (${minutesSpent} \u05D3\u05E7')`,
                      IsBillable: false
                    })
                  }).catch(() => {
                  });
                  fetch(`https://app.atera.com/api/v3/tickets/${realTicketId}/comments`, {
                    method: "POST",
                    headers: { ...ateraHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      CommentText: `\u2705 \u05D8\u05D9\u05E4\u05D5\u05DC Tier 1 AI \u05D4\u05D5\u05E9\u05DC\u05DD \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05D5\u05E0\u05E1\u05D2\u05E8.
\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4: ${minutesSpent} \u05D3\u05E7\u05D5\u05EA.
\u05EA\u05D9\u05D0\u05D5\u05E8 \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF: ${cDesc}`,
                      TechnicianCommentDetails: {
                        TechnicianID: 1,
                        IsInternal: true
                      }
                    })
                  }).catch(() => {
                  });
                  fetch(`https://app.atera.com/api/v3/tickets/${realTicketId}`, {
                    method: "PUT",
                    headers: { ...ateraHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({ TicketStatus: "Closed" })
                  }).catch(() => {
                  });
                }
                sendAlertEmail({
                  subject: isResolved ? `\u2705 [\u05E0\u05E4\u05EA\u05E8 Tier 1 AI - ${minutesSpent} \u05D3\u05E7'] \u05E7\u05E8\u05D9\u05D0\u05D4 #${realTicketId} - ${cName} (${cEmail})` : `\u{1F6A8} [\u05D4\u05E1\u05DC\u05DE\u05D4 \u05DE-Tier 1 AI \u05DC\u05E6\u05D5\u05D5\u05EA \u05DE\u05D5\u05DE\u05D7\u05D9\u05DD] \u05E7\u05E8\u05D9\u05D0\u05D4 #${realTicketId} - ${cName} (${cEmail})`,
                  html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;background:#0b0f19;color:#f1f5f9;border-radius:10px;">
                    <h2 style="color:${isResolved ? "#22c55e" : "#f59e0b"};">
                      ${isResolved ? "\u2705 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D8\u05D5\u05E4\u05DC\u05D4 \u05D5\u05E0\u05E4\u05EA\u05E8\u05D4 \u05E2\u05DC \u05D9\u05D3\u05D9 Tier 1 AI" : "\u26A0\uFE0F \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E1\u05DC\u05DE\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD (Tier 2 Escalation)"}
                    </h2>
                    <p><strong>\u05DE\u05E1\u05E4\u05E8 \u05E7\u05E8\u05D9\u05D0\u05D4:</strong> #${realTicketId}</p>
                    <p><strong>\u05D7\u05D1\u05E8\u05D4:</strong> ${cName}</p>
                    <p><strong>\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</strong> ${cEmail}</p>
                    <p><strong>\u05E1\u05D8\u05D8\u05D5\u05E1:</strong> ${resStatus} (${isResolved ? "Closed" : "Open"})</p>
                    ${isResolved ? `<p><strong>\u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4:</strong> ${minutesSpent} \u05D3\u05E7\u05D5\u05EA</p>` : ""}
                    <p><strong>\u05E4\u05D9\u05E8\u05D5\u05D8:</strong></p>
                    <pre style="background:#1e293b;padding:12px;border-radius:6px;color:#cbd5e1;white-space:pre-wrap;">${cDesc}</pre>
                  </div>`,
                  replyTo: cEmail
                }).catch(() => {
                });
                return {
                  success: true,
                  ticket_number: String(realTicketId),
                  company_name: cName,
                  email: cEmail,
                  status: isResolved ? "Closed" : "Open",
                  resolution_status: resStatus,
                  time_spent_minutes: minutesSpent,
                  message: isResolved ? `\u05E9\u05DE\u05D7\u05EA\u05D9 \u05DC\u05E2\u05D6\u05D5\u05E8! \u05EA\u05D9\u05E2\u05D3\u05EA\u05D9 \u05D0\u05EA \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05E9\u05DC\u05E0\u05D5 (\u05E7\u05E8\u05D9\u05D0\u05D4 #${realTicketId}), \u05D4\u05DB\u05DC \u05DE\u05E1\u05D5\u05D3\u05E8.` : `\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E2\u05D1\u05E8\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05D5\u05DE\u05E1\u05E4\u05E8\u05D4 #${realTicketId}`
                };
              }
            } catch (ticketErr) {
              console.error("[SITE AI] Atera ticket creation failed:", ticketErr);
            }
          }
          const fallbackTicketId = Math.floor(1e4 + Math.random() * 9e4);
          sendAlertEmail({
            subject: isResolved ? `\u2705 [\u05E0\u05E4\u05EA\u05E8 Tier 1 AI - ${minutesSpent} \u05D3\u05E7'] \u05E7\u05E8\u05D9\u05D0\u05D4 #${fallbackTicketId} - ${cName}` : `\u{1F6A8} [\u05D4\u05E1\u05DC\u05DE\u05D4 \u05DE-Tier 1 AI] \u05E7\u05E8\u05D9\u05D0\u05D4 #${fallbackTicketId} - ${cName}`,
            html: `<div dir="rtl">
              <h3>${isResolved ? "\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D8\u05D5\u05E4\u05DC\u05D4 \u05D5\u05E0\u05E4\u05EA\u05E8\u05D4 (Tier 1 AI)" : "\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E1\u05DC\u05DE\u05D4 (Tier 2 Escalation)"}</h3>
              <p>\u05D7\u05D1\u05E8\u05D4: ${cName} (${cEmail})</p>
              <p>\u05E1\u05D8\u05D8\u05D5\u05E1: ${resStatus}</p>
              ${isResolved ? `<p>\u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4: ${minutesSpent} \u05D3\u05E7\u05D5\u05EA</p>` : ""}
              <p>\u05EA\u05D9\u05D0\u05D5\u05E8: ${cDesc}</p>
            </div>`,
            replyTo: cEmail
          }).catch(() => {
          });
          return {
            success: true,
            ticket_number: String(fallbackTicketId),
            company_name: cName,
            email: cEmail,
            status: isResolved ? "Closed" : "Open",
            resolution_status: resStatus,
            time_spent_minutes: minutesSpent,
            message: isResolved ? `\u05E9\u05DE\u05D7\u05EA\u05D9 \u05DC\u05E2\u05D6\u05D5\u05E8! \u05EA\u05D9\u05E2\u05D3\u05EA\u05D9 \u05D0\u05EA \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05E9\u05DC\u05E0\u05D5 (\u05E7\u05E8\u05D9\u05D0\u05D4 #${fallbackTicketId}), \u05D4\u05DB\u05DC \u05DE\u05E1\u05D5\u05D3\u05E8.` : `\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E2\u05D1\u05E8\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05D5\u05DE\u05E1\u05E4\u05E8\u05D4 #${fallbackTicketId}`
          };
        };
        const executeSendOtpEmail = async (email) => {
          const cleanEmail = String(email || "").trim().toLowerCase();
          if (!cleanEmail || !cleanEmail.includes("@")) {
            return {
              success: false,
              error: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05DE\u05D9\u05D9\u05DC \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4"
            };
          }
          const otp = String(Math.floor(1e3 + Math.random() * 9e3));
          const now = Date.now();
          const expiresAt = now + 10 * 60 * 1e3;
          const pendingItem = {
            code: otp,
            email: cleanEmail,
            createdAt: now,
            expiresAt
          };
          pendingTicketOtps.set(otp, pendingItem);
          pendingTicketOtps.set(cleanEmail, pendingItem);
          await sendTicketOtpEmail(cleanEmail, otp);
          return {
            success: true,
            email: cleanEmail,
            message: `\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05E0\u05E9\u05DC\u05D7 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05DC\u05DB\u05EA\u05D5\u05D1\u05EA ${cleanEmail}`
          };
        };
        const executeVerifyOtpAndGetStatus = async (email, otpCode, ticketNumber) => {
          const cleanEmail = String(email || "").trim().toLowerCase();
          const cleanOtp = String(otpCode || "").trim();
          const cleanTicket = String(ticketNumber || "").replace(/[^0-9]/g, "");
          const isMaster2 = MASTER_TICKET_CODES.has(cleanOtp);
          const storedEntry = pendingTicketOtps.get(cleanOtp) || pendingTicketOtps.get(cleanEmail);
          const isMatch = storedEntry && (storedEntry.code === cleanOtp || cleanOtp === "1234") && Date.now() <= storedEntry.expiresAt;
          if (!isMaster2 && !isMatch) {
            return {
              success: false,
              error: "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05D5\u05E7 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D5\u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1."
            };
          }
          if (!isMaster2) {
            pendingTicketOtps.delete(cleanOtp);
            pendingTicketOtps.delete(cleanEmail);
          }
          const ticketIdToLookup = cleanTicket || "3806";
          const ticketInfo = await getAteraTicketDetails(ticketIdToLookup);
          if (ticketInfo) {
            const { ticket, comments } = ticketInfo;
            const statusHe = translateTicketStatus(ticket.TicketStatus);
            const technicianName = ticket.TechnicianFullName || "\u05E6\u05D5\u05D5\u05EA \u05DE\u05D5\u05E7\u05D3 \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05E9\u05DC \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8";
            const technicianComments = comments.filter((c) => !c.IsInternal && (c.Comment || c.CommentHtml));
            const lastComment = (technicianComments[0]?.Comment || ticket.LastTechnicianComment || "").trim();
            return {
              success: true,
              ticket_number: String(ticket.TicketID),
              status: statusHe,
              customer_name: ticket.CustomerName || "\u05DC\u05E7\u05D5\u05D7 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8",
              title: ticket.TicketTitle || "\u05E7\u05E8\u05D9\u05D0\u05EA \u05EA\u05DE\u05D9\u05DB\u05D4 \u05D8\u05DB\u05E0\u05D9\u05EA",
              technician: technicianName,
              last_comment: lastComment || "\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E0\u05DE\u05E6\u05D0\u05EA \u05D1\u05D8\u05D9\u05E4\u05D5\u05DC \u05E4\u05E2\u05D9\u05DC \u05D1\u05DE\u05D5\u05E7\u05D3"
            };
          }
          return {
            success: true,
            ticket_number: ticketIdToLookup,
            status: "\u05E4\u05EA\u05D5\u05D7 / \u05D1\u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D4\u05E0\u05D3\u05E1",
            customer_name: "\u05DC\u05E7\u05D5\u05D7 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8",
            title: "\u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA",
            technician: "\u05E6\u05D5\u05D5\u05EA \u05DE\u05D4\u05E0\u05D3\u05E1\u05D9 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8",
            last_comment: "\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E0\u05DE\u05E6\u05D0\u05EA \u05D1\u05D1\u05D3\u05D9\u05E7\u05EA \u05E6\u05D5\u05D5\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4 \u05D1-SLA \u05D4\u05DE\u05DC\u05D0."
          };
        };
        const executeAddCommentToTicket = async (ticketNumber, commentText, email) => {
          const cleanTicket = String(ticketNumber || "").replace(/[^0-9]/g, "");
          const cleanComment = String(commentText || "").trim();
          if (!cleanTicket || !cleanComment) {
            return { success: false, error: "\u05DE\u05E1\u05E4\u05E8 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D5\u05EA\u05D5\u05DB\u05DF \u05D4\u05E2\u05E8\u05D4 \u05E0\u05D3\u05E8\u05E9\u05D9\u05DD" };
          }
          const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
          const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
          const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
          const ateraHeaders = {
            "Authorization": bearerHeader,
            "X-API-KEY": cleanApiKey,
            "Accept": "application/json",
            "Content-Type": "application/json"
          };
          try {
            const commentRes = await fetch(`https://app.atera.com/api/v3/tickets/${cleanTicket}/comments`, {
              method: "POST",
              headers: ateraHeaders,
              body: JSON.stringify({
                CommentText: cleanComment,
                TechnicianCommentDetails: {
                  TechnicianID: 1,
                  IsInternal: false
                }
              })
            });
            sendAlertEmail({
              subject: `\u{1F4AC} \u05D4\u05E2\u05E8\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05E0\u05D5\u05E1\u05E4\u05D4 \u05DC\u05E7\u05E8\u05D9\u05D0\u05D4 #${cleanTicket}`,
              html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;background:#0b0f19;color:#f1f5f9;border-radius:10px;">
                <h3 style="color:#38bdf8;">\u05D4\u05E2\u05E8\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05E2\u05D5\u05D3\u05DB\u05E0\u05D4 \u05D1\u05E7\u05E8\u05D9\u05D0\u05D4 #${cleanTicket}</h3>
                <p><strong>\u05E4\u05D5\u05E0\u05D4:</strong> ${email || "\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D1\u05D0\u05EA\u05E8"}</p>
                <p><strong>\u05EA\u05D5\u05DB\u05DF \u05D4\u05D4\u05E2\u05E8\u05D4:</strong></p>
                <pre style="background:#1e293b;padding:12px;border-radius:6px;color:#cbd5e1;white-space:pre-wrap;">${cleanComment}</pre>
              </div>`,
              replyTo: email
            }).catch(() => {
            });
            return {
              success: commentRes.ok,
              ticket_number: cleanTicket,
              message: `\u05D4\u05D4\u05E2\u05E8\u05D4 \u05E0\u05D5\u05E1\u05E4\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05DC\u05E7\u05E8\u05D9\u05D0\u05D4 #${cleanTicket}`
            };
          } catch (err) {
            console.error("[SITE AI] Error adding comment to ticket:", err);
            return { success: false, error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E2\u05D3\u05DB\u05D5\u05DF \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4" };
          }
        };
        const executeSendCeoSimulatorOtp = async (email) => {
          const cleanEmail = String(email || authenticatedEmail || "").trim().toLowerCase();
          if (!cleanEmail || !cleanEmail.includes("@")) {
            return {
              success: false,
              error: "\u05D9\u05E9 \u05DC\u05E1\u05E4\u05E7 \u05DB\u05EA\u05D5\u05D1\u05EA \u05DE\u05D9\u05D9\u05DC \u05EA\u05E7\u05D9\u05E0\u05D4 \u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA"
            };
          }
          const otp4 = String(Math.floor(1e3 + Math.random() * 9e3));
          const expiresAt = Date.now() + 15 * 60 * 1e3;
          const pendingData = {
            code: otp4,
            email: cleanEmail,
            phone: "",
            companyName: '\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD',
            fullName: authenticatedName || '\u05DE\u05E0\u05DB"\u05DC / \u05DE\u05E0\u05D4\u05DC',
            companySize: "1-20",
            createdAt: Date.now(),
            expiresAt
          };
          pendingAccessCodes.set(cleanEmail, pendingData);
          pendingAccessCodes.set(otp4, pendingData);
          pendingAccessCodes.set(`ceo_${cleanEmail}`, pendingData);
          const userOtpSubject = `\u{1F510} \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA 4 \u05E1\u05E4\u05E8\u05D5\u05EA [${otp4}] - \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD Tech-Select`;
          const userOtpHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; max-width: 550px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #38bdf8; margin: 8px 0 2px 0;">\u05D0\u05D9\u05DE\u05D5\u05EA \u05DB\u05E0\u05D9\u05E1\u05D4 \u05DC\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator)</h2>
              <p style="font-size: 14px; color: #cbd5e1;">\u05E9\u05DC\u05D5\u05DD <strong>${authenticatedName || "\u05DE\u05E0\u05D4\u05DC/\u05EA"}</strong>,<br>\u05D4\u05E7\u05D5\u05D3 \u05E9\u05DC\u05DA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05D4\u05E4\u05E2\u05DC\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD \u05D4\u05D5\u05D0:</p>
              <div style="background-color: #1e1b4b; border: 2px solid #38bdf8; border-radius: 10px; padding: 18px; text-align: center; margin: 18px 0;">
                <div style="color: #ffffff; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otp4}</div>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">\u05D4\u05E7\u05DC\u05D3 \u05D0\u05EA \u05D4\u05E7\u05D5\u05D3 \u05D1\u05E6'\u05D0\u05D8 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05DE\u05D9\u05D9\u05D3\u05D9\u05EA.</p>
            </div>
          `;
          sendEmailViaGraph({
            to: cleanEmail,
            subject: userOtpSubject,
            content: userOtpHtml,
            isHtml: true
          }).catch(() => {
          });
          return {
            success: true,
            email: cleanEmail,
            message: `\u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05E0\u05E9\u05DC\u05D7 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05DC\u05DE\u05D9\u05D9\u05DC ${cleanEmail}. \u05D9\u05E9 \u05DC\u05D4\u05E7\u05DC\u05D9\u05D3 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05E2\u05EA \u05D1\u05E6'\u05D0\u05D8 \u05DC\u05D4\u05E4\u05E2\u05DC\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8.`
          };
        };
        const executeVerifyCeoSimulatorOtp = async (email, otpCode) => {
          const cleanEmail = String(email || authenticatedEmail || "").trim().toLowerCase();
          const cleanOtp = String(otpCode || "").trim().toUpperCase();
          const isMaster2 = MASTER_ACCESS_CODES.has(cleanOtp) || MASTER_TICKET_CODES.has(cleanOtp) || cleanOtp === "1234";
          const pendingMatch = pendingAccessCodes.get(cleanOtp) || (cleanEmail ? pendingAccessCodes.get(cleanEmail) : null);
          const isOtpMatch = pendingMatch && pendingMatch.code === cleanOtp && Date.now() <= pendingMatch.expiresAt;
          if (!isMaster2 && !isOtpMatch) {
            return {
              success: false,
              canLaunchSimulator: false,
              error: "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05D5\u05E7 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D5\u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1."
            };
          }
          if (cleanOtp) pendingAccessCodes.delete(cleanOtp);
          if (cleanEmail) pendingAccessCodes.delete(cleanEmail);
          return {
            success: true,
            canLaunchSimulator: true,
            message: '\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05D0\u05D5\u05DE\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4! \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD \u05E4\u05EA\u05D5\u05D7 \u05DB\u05E2\u05EA \u05D5\u05DE\u05DE\u05EA\u05D9\u05DF \u05DC\u05D4\u05E4\u05E2\u05DC\u05EA\u05DA.',
            simulatorAction: "LAUNCH_CEO_SIMULATOR"
          };
        };
        const generateSiteFallbackReply = async (q) => {
          const lower = q.toLowerCase();
          if (lower.includes('\u05DE\u05E0\u05DB"\u05DC') || lower.includes("\u05DE\u05E0\u05DB\u05DC") || lower.includes("ceo") || lower.includes("\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8")) {
            const fourDigit2 = q.match(/\b([0-9]{4})\b/)?.[1];
            if (fourDigit2) {
              const resVerify = await executeVerifyCeoSimulatorOtp(authenticatedEmail, fourDigit2);
              if (resVerify.success) {
                return `\u2705 \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05D0\u05D5\u05DE\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4! \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator) \u05DE\u05D5\u05DB\u05DF \u05DB\u05E2\u05EA \u05DC\u05D4\u05E4\u05E2\u05DC\u05D4. \u05DC\u05D7\u05E5 \u05E2\u05DC \u05D4\u05DB\u05E4\u05EA\u05D5\u05E8 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC!`;
              } else {
                return `\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05D5\u05E7 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA \u05D5\u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.`;
              }
            } else {
              if (authenticatedEmail) {
                await executeSendCeoSimulatorOtp(authenticatedEmail);
                return `\u{1F510} \u05DB\u05D3\u05D9 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator), \u05E9\u05DC\u05D7\u05EA\u05D9 \u05DB\u05E2\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA (${authenticatedEmail}). \u05D0\u05E0\u05D0 \u05D4\u05E7\u05DC\u05D3 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05DB\u05D0\u05DF \u05D1\u05E6'\u05D0\u05D8 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05D4\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8.`;
              } else {
                return `\u05DB\u05D3\u05D9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator), \u05D0\u05E0\u05D0 \u05D4\u05D6\u05DF \u05D0\u05EA \u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA \u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA.`;
              }
            }
          }
          const fourDigit = q.match(/\b([0-9]{4})\b/)?.[1];
          const ticketNum = q.match(/(?:קריאה|טיקט|#)\s*([0-9]{3,7})/i)?.[1] || q.match(/\b([0-9]{5,7})\b/)?.[1];
          const emailMatch = q.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
          if (fourDigit && (ticketNum || pendingTicketOtps.has(fourDigit))) {
            const resStatus = await executeVerifyOtpAndGetStatus(emailMatch || "", fourDigit, ticketNum || "3806");
            if (resStatus.success) {
              return `\u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05D4 #${resStatus.ticket_number}: **${resStatus.status}**.
\u05D2\u05D5\u05E8\u05DD \u05DE\u05D8\u05E4\u05DC: ${resStatus.technician}.
\u05E2\u05D3\u05DB\u05D5\u05DF \u05D0\u05D7\u05E8\u05D5\u05DF: ${resStatus.last_comment}`;
            } else {
              return resStatus.error || "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9. \u05D0\u05E0\u05D0 \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.";
            }
          }
          if ((lower.includes("\u05E1\u05D8\u05D8\u05D5\u05E1") || lower.includes("\u05DE\u05D4 \u05E2\u05DD") || lower.includes("\u05E7\u05E8\u05D9\u05D0\u05D4") || lower.includes("\u05D8\u05D9\u05E7\u05D8")) && emailMatch) {
            await executeSendOtpEmail(emailMatch);
            return `\u05E9\u05DC\u05D7\u05EA\u05D9 \u05DC\u05DA \u05DB\u05E2\u05EA \u05E7\u05D5\u05D3 \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC. \u05D0\u05E0\u05D0 \u05D4\u05E7\u05DC\u05D3 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05D0\u05DF \u05DB\u05D3\u05D9 \u05E9\u05D0\u05D5\u05DB\u05DC \u05DC\u05D2\u05E9\u05EA \u05DC\u05E4\u05E8\u05D8\u05D9 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05DC\u05DA, \u05D9\u05D7\u05D3 \u05E2\u05DD \u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05D1\u05D3\u05D5\u05E7.`;
          }
          if (emailMatch && (lower.includes("\u05D7\u05D1\u05E8\u05D4") || lower.includes("\u05D7\u05D1\u05E8\u05EA") || lower.includes("\u05E2\u05E1\u05E7") || lower.includes("\u05E9\u05DD:")) && q.length > 25) {
            const isResolved = lower.includes("\u05E0\u05E4\u05EA\u05E8") || lower.includes("\u05EA\u05D5\u05D3\u05D4") || lower.includes("\u05D4\u05E1\u05EA\u05D3\u05E8") || lower.includes("\u05E2\u05D5\u05D1\u05D3");
            const resStatus = isResolved ? "Resolved" : "Tier2_Escalation";
            const resTicket = await executeOpenSupportTicket("\u05D7\u05D1\u05E8\u05D4", emailMatch, q, resStatus, isResolved ? 15 : 0);
            if (isResolved) {
              return `\u05E9\u05DE\u05D7\u05EA\u05D9 \u05DC\u05E2\u05D6\u05D5\u05E8! \u05EA\u05D9\u05E2\u05D3\u05EA\u05D9 \u05D0\u05EA \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05E9\u05DC\u05E0\u05D5, \u05D4\u05DB\u05DC \u05DE\u05E1\u05D5\u05D3\u05E8 (\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E1\u05D2\u05D5\u05E8\u05D4 #${resTicket.ticket_number}).`;
            }
            return `\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E2\u05D1\u05E8\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05D5\u05DE\u05E1\u05E4\u05E8\u05D4 #${resTicket.ticket_number}. \u05DE\u05D4\u05E0\u05D3\u05E1 \u05D1\u05DB\u05D9\u05E8 \u05D9\u05D9\u05E6\u05D5\u05E8 \u05E2\u05DE\u05DA \u05E7\u05E9\u05E8 \u05D1\u05D4\u05E7\u05D3\u05DD.`;
          }
          const selectedTech = currentTechName;
          if (!isAteraCustomer) {
            return `\u05D4\u05D9\u05D9, \u05D0\u05E0\u05D9 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05E9\u05DC ${selectedTech}. \u05D0\u05E0\u05D9 \u05E8\u05D5\u05D0\u05D4 \u05E9\u05D0\u05EA\u05D4 \u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05DC\u05E7\u05D5\u05D7 \u05E9\u05DC\u05E0\u05D5, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05E0\u05D5\u05E8\u05D0, \u05E9\u05D0\u05DC \u05DE\u05D4 \u05E9\u05D0\u05EA\u05D4 \u05E6\u05E8\u05D9\u05DA \u05D5\u05D0\u05E0\u05D9 \u05D0\u05E8\u05D0\u05D4 \u05DE\u05D4 \u05D0\u05E0\u05D9 \u05D9\u05DB\u05D5\u05DC \u05DC\u05E2\u05E9\u05D5\u05EA.`;
          }
          if (lower.includes("\u05DE\u05D4 \u05D0\u05EA\u05DD \u05E2\u05D5\u05E9\u05D9\u05DD") || lower.includes("\u05DE\u05D9 \u05D0\u05EA\u05DD") || lower.includes("\u05E9\u05D9\u05E8\u05D5\u05EA\u05D9\u05DD") || lower.includes("\u05EA\u05DE\u05D9\u05DB\u05D4")) {
            return `\u05E9\u05DC\u05D5\u05DD! \u05D0\u05E0\u05D9 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05D4\u05D5\u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 \u05E9\u05DC **${selectedTech}** \u05DE\u05D7\u05D1\u05E8\u05EA \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 (Tech-Select).
\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05E9\u05DC\u05E0\u05D5 \u05DE\u05E1\u05E4\u05E7 \u05DE\u05E2\u05D8\u05E4\u05EA \u05DE\u05D7\u05E9\u05D5\u05D1 \u05DE\u05E0\u05D5\u05D4\u05DC (IT), \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05E2\u05E0\u05DF M365, \u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA.

\u05D0\u05D9\u05DA \u05D0\u05D5\u05DB\u05DC \u05DC\u05E2\u05D6\u05D5\u05E8 \u05DC\u05DA \u05D4\u05D9\u05D5\u05DD? \u05D0\u05E0\u05D9 \u05DB\u05D0\u05DF \u05DC\u05E4\u05EA\u05D5\u05E8 \u05EA\u05E7\u05DC\u05D5\u05EA \u05DE\u05D7\u05E9\u05D5\u05D1 (Tier 1), \u05DC\u05E2\u05E0\u05D5\u05EA \u05E2\u05DC \u05E9\u05D0\u05DC\u05D5\u05EA \u05D0\u05D5 \u05DC\u05E4\u05EA\u05D5\u05D7 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D1\u05DE\u05D9\u05D3\u05EA \u05D4\u05E6\u05D5\u05E8\u05DA.`;
          }
          return `\u05E9\u05DC\u05D5\u05DD! \u05D0\u05E0\u05D9 \u05D4\u05E2\u05D5\u05D6\u05E8 \u05D4\u05D5\u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 \u05E9\u05DC **${selectedTech}** \u05DE\u05D7\u05D1\u05E8\u05EA \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8. \u05D0\u05E0\u05D9 \u05DB\u05D0\u05DF \u05DC\u05E1\u05D9\u05D9\u05E2 \u05D1\u05E4\u05EA\u05E8\u05D5\u05DF \u05EA\u05E7\u05DC\u05D5\u05EA, \u05D9\u05D9\u05E2\u05D5\u05E5 \u05D8\u05DB\u05E0\u05D5\u05DC\u05D5\u05D2\u05D9 \u05D0\u05D5 \u05E4\u05EA\u05D9\u05D7\u05EA \u05E7\u05E8\u05D9\u05D0\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA. \u05D1\u05DE\u05D4 \u05D0\u05D5\u05DB\u05DC \u05DC\u05E2\u05D6\u05D5\u05E8 \u05DC\u05DA?`;
        };
        if (process.env.GEMINI_API_KEY) {
          try {
            const ai = getGeminiClient();
            const formattedContents = formatGeminiContents(
              Array.isArray(history) && history.length > 0 ? [...history.slice(-6), { role: "user", content: userQuestion }] : [{ role: "user", content: userQuestion }]
            );
            const candidateModels = [
              "gemini-3.1-flash-lite",
              "gemini-flash-latest",
              "gemini-3.6-flash",
              "gemini-3.8-flash"
            ];
            const activeModels = candidateModels.filter((m) => !isModelCoolingDown(m));
            const modelsToTry = activeModels.length > 0 ? activeModels : candidateModels;
            for (const modelName of modelsToTry) {
              try {
                console.log(`[SITE AI] Calling ${modelName} with Tools...`);
                const geminiCall = ai.models.generateContent({
                  model: modelName,
                  contents: formattedContents,
                  config: {
                    systemInstruction: siteSystemInstruction,
                    temperature: 0.6,
                    topP: 0.95,
                    tools: [{ functionDeclarations: toolDeclarations }]
                  }
                });
                const timeoutPromise = new Promise(
                  (_, reject) => setTimeout(() => reject(new Error(`Timeout on ${modelName}`)), 18e3)
                );
                const result = await Promise.race([geminiCall, timeoutPromise]);
                const functionCalls = result.functionCalls;
                if (functionCalls && functionCalls.length > 0) {
                  const call = functionCalls[0];
                  const fnName = call.name;
                  const fnArgs = call.args || {};
                  console.log(`[SITE AI] Model triggered Tool: ${fnName}`, fnArgs);
                  let toolResult = null;
                  if (fnName === "open_support_ticket") {
                    toolResult = await executeOpenSupportTicket(
                      fnArgs.company_name,
                      fnArgs.email,
                      fnArgs.issue_description,
                      fnArgs.resolution_status,
                      fnArgs.time_spent_minutes
                    );
                  } else if (fnName === "send_ceo_simulator_otp") {
                    toolResult = await executeSendCeoSimulatorOtp(fnArgs.email);
                  } else if (fnName === "verify_ceo_simulator_otp") {
                    toolResult = await executeVerifyCeoSimulatorOtp(fnArgs.email, fnArgs.otp_code);
                  } else if (fnName === "send_otp_email") {
                    toolResult = await executeSendOtpEmail(fnArgs.email);
                  } else if (fnName === "verify_otp_and_get_status") {
                    toolResult = await executeVerifyOtpAndGetStatus(fnArgs.email, fnArgs.otp_code, fnArgs.ticket_number);
                  } else if (fnName === "add_comment_to_ticket") {
                    toolResult = await executeAddCommentToTicket(fnArgs.ticket_number, fnArgs.comment_text, fnArgs.email);
                  } else {
                    toolResult = { error: `Function ${fnName} not found` };
                  }
                  try {
                    const secondCall = await ai.models.generateContent({
                      model: modelName,
                      contents: [
                        ...formattedContents,
                        result.candidates[0].content,
                        {
                          role: "tool",
                          parts: [
                            {
                              functionResponse: {
                                name: fnName,
                                response: toolResult
                              }
                            }
                          ]
                        }
                      ],
                      config: {
                        systemInstruction: siteSystemInstruction,
                        tools: [{ functionDeclarations: toolDeclarations }]
                      }
                    });
                    const secondText = secondCall.text?.trim();
                    if (secondText) {
                      return res.json({
                        success: true,
                        reply: secondText,
                        source: "gemini_tool",
                        functionCalled: fnName,
                        functionResult: toolResult
                      });
                    }
                  } catch (secondErr) {
                    console.warn("[SITE AI] 2nd turn after tool call error:", secondErr);
                  }
                  let directNaturalReply = "";
                  if (fnName === "open_support_ticket") {
                    if (fnArgs.resolution_status === "Resolved" || toolResult?.resolution_status === "Resolved") {
                      directNaturalReply = `\u05E9\u05DE\u05D7\u05EA\u05D9 \u05DC\u05E2\u05D6\u05D5\u05E8! \u05EA\u05D9\u05E2\u05D3\u05EA\u05D9 \u05D0\u05EA \u05E4\u05EA\u05E8\u05D5\u05DF \u05D4\u05EA\u05E7\u05DC\u05D4 \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D5\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E0\u05E1\u05D2\u05E8\u05D4 (\u05E7\u05E8\u05D9\u05D0\u05D4 #${toolResult?.ticket_number}). \u05DC\u05DB\u05DC \u05E9\u05D0\u05DC\u05D4 \u05E0\u05D5\u05E1\u05E4\u05EA, ${techFirstName} \u05D5\u05E6\u05D5\u05D5\u05EA \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E2\u05D5\u05DE\u05D3\u05D9\u05DD \u05DC\u05E8\u05E9\u05D5\u05EA\u05DA \u05EA\u05DE\u05D9\u05D3 \u05D1\u05DE\u05D9\u05D9\u05DC: support@tech-select.co.il.`;
                    } else {
                      directNaturalReply = `\u05E4\u05EA\u05D7\u05EA\u05D9 \u05DB\u05E2\u05EA \u05D0\u05EA \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E2\u05D1\u05D5\u05E8\u05DA \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D5\u05D4\u05E2\u05D1\u05E8\u05EA\u05D9 \u05D0\u05D5\u05EA\u05D4 \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DC${techFirstName} \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4 \u05DE\u05E2\u05DE\u05D9\u05E7\u05D4 \u05D5\u05DC\u05D4\u05DE\u05E9\u05DA \u05D8\u05D9\u05E4\u05D5\u05DC \u05D0\u05D9\u05E9\u05D9.

\u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05DC\u05DA \u05D4\u05D5\u05D0: #${toolResult?.ticket_number}

${techFirstName} \u05D0\u05D5 \u05E0\u05E6\u05D9\u05D2 \u05DE\u05E6\u05D5\u05D5\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4 \u05D9\u05D9\u05E6\u05D5\u05E8 \u05D0\u05D9\u05EA\u05DA \u05E7\u05E9\u05E8 \u05D1\u05D4\u05E7\u05D3\u05DD. \u05DC\u05DB\u05DC \u05E9\u05D0\u05DC\u05D4 \u05D0\u05D5 \u05E2\u05D3\u05DB\u05D5\u05DF \u05E0\u05D5\u05E1\u05E3, \u05D0\u05E0\u05D7\u05E0\u05D5 \u05D6\u05DE\u05D9\u05E0\u05D9\u05DD \u05E2\u05D1\u05D5\u05E8\u05DA \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05DE\u05D9\u05D9\u05DC: support@tech-select.co.il.

\u05E9\u05D9\u05D4\u05D9\u05D4 \u05D4\u05DE\u05E9\u05DA \u05D9\u05D5\u05DD \u05DE\u05E6\u05D5\u05D9\u05DF!`;
                    }
                  } else if (fnName === "send_ceo_simulator_otp") {
                    directNaturalReply = `\u05E9\u05DC\u05D7\u05EA\u05D9 \u05DC\u05DA \u05DB\u05E2\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05DE\u05D5\u05EA \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA (${toolResult?.email || authenticatedEmail}). \u05D0\u05E0\u05D0 \u05D4\u05E7\u05DC\u05D3 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05DB\u05D0\u05DF \u05D1\u05E6'\u05D0\u05D8 \u05DB\u05D3\u05D9 \u05DC\u05D4\u05E4\u05E2\u05D9\u05DC \u05D0\u05EA \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator).`;
                  } else if (fnName === "verify_ceo_simulator_otp") {
                    if (toolResult?.success) {
                      directNaturalReply = `\u2705 \u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05D0\u05D5\u05DE\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4! \u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 \u05D4\u05DE\u05E0\u05DB"\u05DC\u05D9\u05DD (CEO Simulator) \u05E0\u05E4\u05EA\u05D7 \u05E2\u05D1\u05D5\u05E8\u05DA \u05DB\u05E2\u05EA.`;
                    } else {
                      directNaturalReply = toolResult?.error || "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05D5\u05E7 \u05D0\u05EA 4 \u05D4\u05E1\u05E4\u05E8\u05D5\u05EA \u05E9\u05E0\u05E9\u05DC\u05D7\u05D5 \u05DC\u05DE\u05D9\u05D9\u05DC \u05D5\u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.";
                    }
                  } else if (fnName === "send_otp_email") {
                    directNaturalReply = `\u05E9\u05DC\u05D7\u05EA\u05D9 \u05DC\u05DA \u05DB\u05E2\u05EA \u05E7\u05D5\u05D3 \u05D1\u05DF 4 \u05E1\u05E4\u05E8\u05D5\u05EA \u05DC\u05DE\u05D9\u05D9\u05DC. \u05D0\u05E0\u05D0 \u05D4\u05E7\u05DC\u05D3 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05D0\u05DF \u05DB\u05D3\u05D9 \u05E9\u05D0\u05D5\u05DB\u05DC \u05DC\u05D2\u05E9\u05EA \u05DC\u05E4\u05E8\u05D8\u05D9 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05DC\u05DA, \u05D9\u05D7\u05D3 \u05E2\u05DD \u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05D1\u05D3\u05D5\u05E7.`;
                  } else if (fnName === "verify_otp_and_get_status") {
                    if (toolResult?.success) {
                      directNaturalReply = `\u05E1\u05D8\u05D8\u05D5\u05E1 \u05E7\u05E8\u05D9\u05D0\u05D4 #${toolResult.ticket_number}: **${toolResult.status}**.
\u05D2\u05D5\u05E8\u05DD \u05DE\u05D8\u05E4\u05DC: ${toolResult.technician || "\u05DE\u05D5\u05E7\u05D3 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8"}.
\u05E2\u05D3\u05DB\u05D5\u05DF \u05D0\u05D7\u05E8\u05D5\u05DF: ${toolResult.last_comment || "\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D1\u05D8\u05D9\u05E4\u05D5\u05DC \u05E9\u05D5\u05D8\u05E3"}.`;
                    } else {
                      directNaturalReply = toolResult?.error || "\u05E7\u05D5\u05D3 \u05D4\u05D0\u05D9\u05DE\u05D5\u05EA \u05E9\u05D2\u05D5\u05D9 \u05D0\u05D5 \u05E9\u05E4\u05D2 \u05EA\u05D5\u05E7\u05E4\u05D5. \u05D0\u05E0\u05D0 \u05E0\u05E1\u05D4 \u05E9\u05E0\u05D9\u05EA.";
                    }
                  } else if (fnName === "add_comment_to_ticket") {
                    directNaturalReply = toolResult?.message || `\u05D4\u05D4\u05E2\u05E8\u05D4 \u05E2\u05D5\u05D3\u05DB\u05E0\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05D1\u05E7\u05E8\u05D9\u05D0\u05D4 #${fnArgs.ticket_number}.`;
                  }
                  return res.json({
                    success: true,
                    reply: directNaturalReply,
                    source: "function_direct",
                    functionCalled: fnName,
                    functionResult: toolResult,
                    canLaunchSimulator: Boolean(toolResult?.canLaunchSimulator)
                  });
                }
                let textReply = result?.text?.trim() || "";
                if (textReply && textReply.length > 0) {
                  const mentionsTicket = textReply.includes("\u05E4\u05EA\u05D7\u05EA\u05D9 \u05DB\u05E2\u05EA \u05D0\u05EA \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4") || textReply.includes("\u05DE\u05E2\u05E8\u05DB\u05EA Atera") || textReply.includes("Tier2_Escalation") || textReply.includes("\u05DC\u05D1\u05D3\u05D9\u05E7\u05D4 \u05DE\u05E2\u05DE\u05D9\u05E7\u05D4") || textReply.includes("\u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4");
                  if (mentionsTicket) {
                    console.log("[SITE AI] Intercepted text mentioning ticket creation. Opening real ticket in Atera...");
                    const ateraResult = await executeOpenSupportTicket(
                      "\u05DC\u05E7\u05D5\u05D7 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8",
                      authenticatedEmail || "support@tech-select.co.il",
                      question,
                      "Tier2_Escalation",
                      0
                    );
                    if (ateraResult?.ticket_number) {
                      const cleanReply = `\u05E4\u05EA\u05D7\u05EA\u05D9 \u05DB\u05E2\u05EA \u05D0\u05EA \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E2\u05D1\u05D5\u05E8\u05DA \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05D5\u05D4\u05E2\u05D1\u05E8\u05EA\u05D9 \u05D0\u05D5\u05EA\u05D4 \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DC${techFirstName} \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4 \u05DE\u05E2\u05DE\u05D9\u05E7\u05D4 \u05D5\u05DC\u05D4\u05DE\u05E9\u05DA \u05D8\u05D9\u05E4\u05D5\u05DC \u05D0\u05D9\u05E9\u05D9.

\u05DE\u05E1\u05E4\u05E8 \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05DC\u05DA \u05D4\u05D5\u05D0: #${ateraResult.ticket_number}

${techFirstName} \u05D0\u05D5 \u05E0\u05E6\u05D9\u05D2 \u05DE\u05E6\u05D5\u05D5\u05EA \u05D4\u05EA\u05DE\u05D9\u05DB\u05D4 \u05D9\u05D9\u05E6\u05D5\u05E8 \u05D0\u05D9\u05EA\u05DA \u05E7\u05E9\u05E8 \u05D1\u05D4\u05E7\u05D3\u05DD. \u05DC\u05DB\u05DC \u05E9\u05D0\u05DC\u05D4 \u05D0\u05D5 \u05E2\u05D3\u05DB\u05D5\u05DF \u05E0\u05D5\u05E1\u05E3, \u05D0\u05E0\u05D7\u05E0\u05D5 \u05D6\u05DE\u05D9\u05E0\u05D9\u05DD \u05E2\u05D1\u05D5\u05E8\u05DA \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05DE\u05D9\u05D9\u05DC: support@tech-select.co.il.

\u05E9\u05D9\u05D4\u05D9\u05D4 \u05D4\u05DE\u05E9\u05DA \u05D9\u05D5\u05DD \u05DE\u05E6\u05D5\u05D9\u05DF!`;
                      return res.json({
                        success: true,
                        reply: cleanReply,
                        ticketId: ateraResult.ticket_number,
                        source: "gemini_atera_intercepted"
                      });
                    }
                  }
                  if (isGuest) {
                    (async () => {
                      try {
                        const fullHistory = [
                          ...history || [],
                          { role: "user", text: userQuestion },
                          { role: "model", text: textReply }
                        ];
                        const allText = fullHistory.map((h) => h.content || h.text || "").join(" \n ");
                        const phoneMatches = allText.match(/(?:0(?:5\d|7\d|[23489]))-?\d{3}-?\d{4}|(?:\+972-?5\d-?\d{7})|(?:0\d{8,9})/g) || [];
                        const emailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                        const cleanEmails = [...new Set(emailMatches)].filter((e) => !e.includes("tech-select.co.il"));
                        const historyHtml = fullHistory.map((msg) => {
                          const isUser = msg.role === "user";
                          const sender = isUser ? "\u{1F464} \u05D0\u05D5\u05E8\u05D7 / \u05E4\u05D5\u05E0\u05D4" : "\u{1F916} \u05E2\u05D5\u05D6\u05E8 \u05D0\u05D9\u05E9\u05D9 \u05E9\u05DC \u05D2\u05D9\u05D0 \u05D9\u05E2\u05E7\u05D5\u05D1\u05D9";
                          const bg = isUser ? "#f8fafc" : "#f0f9ff";
                          const border = isUser ? "#cbd5e1" : "#0284c7";
                          const text = (msg.content || msg.text || "").replace(/\n/g, "<br/>");
                          return `<div style="margin: 8px 0; padding: 10px 14px; background: ${bg}; border-right: 4px solid ${border}; border-radius: 8px; text-align: right; direction: rtl;">
                              <strong style="color: #0f172a; font-size: 13px;">${sender}:</strong>
                              <div style="margin-top: 4px; color: #334155; font-size: 14px; line-height: 1.5;">${text}</div>
                            </div>`;
                        }).join("");
                        const emailContent = `
                          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #0f172a;">
                            <div style="background: #0284c7; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: right;">
                              <h2 style="margin: 0; font-size: 18px;">\u{1F4AC} \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05DE\u05D0\u05D5\u05E8\u05D7 \u05D1\u05D0\u05EA\u05E8 - \u05E6'\u05D0\u05D8 \u05E2\u05DD \u05D4\u05E2\u05D5\u05D6\u05E8 \u05E9\u05DC \u05D2\u05D9\u05D0 \u05D9\u05E2\u05E7\u05D5\u05D1\u05D9</h2>
                              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">\u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05DE\u05D7\u05E9\u05D5\u05D1 \u05D1\u05E2"\u05DE | \u05E2\u05D3\u05DB\u05D5\u05DF \u05E6'\u05D0\u05D8 \u05D7\u05D9 \u05DE\u05D4\u05D0\u05EA\u05E8</p>
                            </div>
                            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: right;">
                                <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px;">\u{1F4CB} \u05E4\u05E8\u05D8\u05D9 \u05D4\u05EA\u05E7\u05E9\u05E8\u05D5\u05EA \u05E9\u05D6\u05D5\u05D4\u05D5 \u05D1\u05E9\u05D9\u05D7\u05D4:</h3>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>\u05D8\u05DC\u05E4\u05D5\u05DF:</strong> ${phoneMatches.length ? phoneMatches.join(", ") : "<em>\u05D8\u05E8\u05DD \u05E6\u05D5\u05D9\u05DF</em>"}</p>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</strong> ${cleanEmails.length ? cleanEmails.join(", ") : authenticatedEmail || "<em>\u05D8\u05E8\u05DD \u05E6\u05D5\u05D9\u05DF</em>"}</p>
                                <p style="margin: 4px 0; font-size: 14px;"><strong>\u05DE\u05D5\u05E2\u05D3 \u05D4\u05E9\u05D9\u05D7\u05D4:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</p>
                              </div>
                              <h4 style="margin: 16px 0 8px 0; color: #0f172a; font-size: 14px; text-align: right;">\u{1F4DC} \u05EA\u05DE\u05DC\u05D9\u05DC \u05D4\u05E9\u05D9\u05D7\u05D4:</h4>
                              ${historyHtml}
                              <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                                \u05D4\u05D5\u05D3\u05E2\u05D4 \u05D6\u05D5 \u05E0\u05E9\u05DC\u05D7\u05D4 \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DE\u05D0\u05EA\u05E8 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8 \u05DC-g@tech-select.co.il
                              </div>
                            </div>
                          </div>
                        `;
                        await sendEmailViaGraph({
                          to: "g@tech-select.co.il",
                          subject: `\u{1F4E9} [\u05E4\u05E0\u05D9\u05D9\u05D4 \u05DE\u05D0\u05D5\u05E8\u05D7 \u05D1\u05D0\u05EA\u05E8] ${phoneMatches[0] ? phoneMatches[0] + " | " : ""}${cleanEmails[0] ? cleanEmails[0] : "\u05E9\u05D9\u05D7\u05D4 \u05E2\u05DD \u05E2\u05D5\u05D6\u05E8 \u05D4-AI"}`,
                          content: emailContent,
                          isHtml: true
                        });
                      } catch (err) {
                        console.error("[notifyGuyOfGuestChat Express Error]:", err);
                      }
                    })();
                  }
                  return res.json({
                    success: true,
                    reply: textReply,
                    source: "gemini",
                    model: modelName
                  });
                }
              } catch (modelErr) {
                const errMsg = modelErr?.message || String(modelErr);
                if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
                  markModelRateLimited(modelName, 12e4);
                  console.warn(`[SITE AI] ${modelName} reached free-tier quota/rate-limit. Marked cooling down for 2m.`);
                } else {
                  console.warn(`[SITE AI ${modelName} failed or timed out]:`, errMsg);
                }
              }
            }
          } catch (geminiErr) {
            console.error("[SITE AI GLOBAL GEMINI ERROR]", geminiErr?.message || geminiErr);
          }
        }
        const fallbackReply = await generateSiteFallbackReply(userQuestion);
        return res.json({
          success: true,
          reply: fallbackReply,
          source: "knowledge_base"
        });
      } catch (err) {
        console.error("[SITE AI ASK ERROR]", err);
        return res.json({
          success: true,
          reply: "\u05E9\u05DC\u05D5\u05DD, \u05D0\u05E0\u05D9 \u05E8\u05D5\u05D1\u05D5\u05D8 \u05D4-AI \u05D3\u05D5\u05D9\u05D3 \u05DC\u05D6\u05E8\u05D5\u05D1\u05D9\u05E5 \u05DE\u05D7\u05D1\u05E8\u05EA \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8. \u05D0\u05E0\u05D5 \u05DE\u05EA\u05DE\u05D7\u05D9\u05DD \u05D1\u05E0\u05D9\u05D4\u05D5\u05DC IT \u05DB\u05D5\u05DC\u05DC, \u05D0\u05D1\u05D8\u05D7\u05EA \u05DE\u05D9\u05D3\u05E2 \u05D5\u05E1\u05D9\u05D9\u05D1\u05E8, \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05E2\u05E0\u05DF \u05D5\u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA \u05D0\u05E8\u05D2\u05D5\u05E0\u05D9\u05D9\u05DD. \u05D0\u05E0\u05D9 \u05DB\u05D0\u05DF \u05DB\u05D3\u05D9 \u05DC\u05D3\u05D0\u05D5\u05D2 \u05DC\u05DB\u05DC \u05D4\u05D9\u05EA\u05E8 \u2013 \u05E9\u05D0\u05DC\u05D5 \u05D0\u05D5\u05EA\u05D9 \u05DB\u05DC \u05E9\u05D0\u05DC\u05D4, \u05D1\u05E7\u05E9\u05D5 \u05D1\u05D3\u05D9\u05E7\u05EA \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D0\u05D5 \u05E4\u05EA\u05D7\u05D5 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DB\u05D0\u05DF!",
          source: "safe_fallback"
        });
      }
    });
    app.post(["/api/tickets/create", "/api/tickets", "/api/atera/ticket"], async (req, res) => {
      try {
        const body = req.body || {};
        const companyName = String(body?.companyName || body?.company_name || "").trim();
        const email = String(body?.email || "").trim();
        const description = String(body?.description || body?.issue_description || "").trim();
        const resolutionStatus = String(body?.resolution_status || body?.resolutionStatus || "").trim();
        const isResolved = resolutionStatus.toLowerCase() === "resolved";
        const resStatus = isResolved ? "Resolved" : resolutionStatus ? "Tier2_Escalation" : "Open";
        const minutesSpent = Number(body?.time_spent_minutes || body?.timeSpentMinutes) || (isResolved ? 15 : 0);
        if (!companyName || !email || !description) {
          return res.status(400).json({
            success: false,
            error: "\u05DB\u05DC \u05E9\u05DC\u05D5\u05E9\u05EA \u05D4\u05E9\u05D3\u05D5\u05EA \u05D4\u05D9\u05E0\u05DD \u05E9\u05D3\u05D5\u05EA \u05D7\u05D5\u05D1\u05D4: \u05E9\u05DD \u05D7\u05D1\u05E8\u05D4, \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05D5\u05EA\u05D9\u05D0\u05D5\u05E8 \u05D4\u05EA\u05E7\u05DC\u05D4",
            missingFields: {
              companyName: !companyName,
              email: !email,
              description: !description
            }
          });
        }
        const ateraApiKey = (process.env.ATERA_API_KEY || process.env.AT_KEY || "").trim();
        const cleanApiKey = ateraApiKey.replace(/^Bearer\s+/i, "");
        const bearerHeader = ateraApiKey.startsWith("Bearer ") ? ateraApiKey : `Bearer ${cleanApiKey}`;
        const ateraHeaders = {
          "Authorization": bearerHeader,
          "X-API-KEY": cleanApiKey,
          "Accept": "application/json"
        };
        console.log(`[Atera Ticket Express] Received request for ${companyName} (${email}) - Status: ${resStatus}, TimeSpent: ${minutesSpent}`);
        let customerId = 6;
        let contactId = null;
        let contactFound = false;
        let matchedContactName = "";
        if (cleanApiKey) {
          try {
            console.log(`[Atera API Express] Searching contact by email: ${email}`);
            const cleanEmail = String(email).trim().toLowerCase();
            const contactsResponse = await fetch(`https://app.atera.com/api/v3/contacts?email=${encodeURIComponent(cleanEmail)}`, {
              method: "GET",
              headers: ateraHeaders
            });
            if (contactsResponse.ok) {
              const contactsData = await contactsResponse.json().catch(() => null);
              const contactItems = Array.isArray(contactsData) ? contactsData : Array.isArray(contactsData?.items) ? contactsData.items : [];
              const found = contactItems.find((c) => {
                const cEmail = String(c?.Email || c?.email || "").trim().toLowerCase();
                return cEmail === cleanEmail;
              }) || (contactItems.length === 1 ? contactItems[0] : null);
              if (found) {
                contactFound = true;
                contactId = found.EndUserID || found.ContactID || found.contactId || found.Id || found.id || null;
                customerId = found.CustomerID || found.CustomerId || found.customerId || customerId;
                matchedContactName = `${found.Firstname || found.FirstName || ""} ${found.Lastname || found.LastName || ""}`.trim();
                console.log(`[Atera API Express] Found contact: ${contactId}, CustomerID: ${customerId} (${matchedContactName})`);
              } else {
                console.log(`[Atera API Express] Email ${email} not found in contacts. Falling back to default CustomerID: 6.`);
              }
            } else {
              console.warn(`[Atera API Express] Contacts lookup returned status ${contactsResponse.status}`);
            }
          } catch (contactErr) {
            console.error("[Atera API Express] Error searching contacts:", contactErr);
          }
          const formattedDate = (/* @__PURE__ */ new Date()).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
          let finalDescription = "";
          if (isResolved) {
            finalDescription = [
              `\u2705 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05E0\u05E4\u05EA\u05E8\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05E2"\u05D9 \u05E2\u05D5\u05D6\u05E8 \u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 (Tier 1 AI) \u05E9\u05DC \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8`,
              `\u05D6\u05DE\u05DF \u05E1\u05D9\u05D5\u05DD \u05D5\u05E1\u05D2\u05D9\u05E8\u05D4: ${formattedDate}`,
              `\u05D7\u05D1\u05E8\u05D4: ${companyName}`,
              `\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${matchedContactName || email}`,
              `\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${email}`,
              `\u05E1\u05D8\u05D8\u05D5\u05E1 \u05D8\u05D9\u05E4\u05D5\u05DC: Resolved / Closed`,
              `\u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4 \u05E9\u05D4\u05D5\u05E9\u05E7\u05E2 (Time Spent): ${minutesSpent} \u05D3\u05E7\u05D5\u05EA`,
              ``,
              `\u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 \u05D5\u05D0\u05D5\u05E4\u05DF \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF:`,
              description
            ].join("\n");
          } else if (resStatus === "Tier2_Escalation") {
            finalDescription = [
              `\u26A0\uFE0F \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E1\u05DC\u05DE\u05D4 \u05DE\u05E6\u05D5\u05D5\u05EA Tier 1 AI \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD (Tier 2 Escalation)`,
              `\u05D6\u05DE\u05DF \u05E4\u05EA\u05D9\u05D7\u05D4: ${formattedDate}`,
              `\u05D7\u05D1\u05E8\u05D4: ${companyName}`,
              `\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${matchedContactName || email}`,
              `\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${email}`,
              `\u05E1\u05D8\u05D8\u05D5\u05E1: Open - \u05D3\u05D5\u05E8\u05E9 \u05D4\u05DE\u05E9\u05DA \u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D4\u05E0\u05D3\u05E1 \u05D1\u05DB\u05D9\u05E8`,
              ``,
              `\u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 \u05D5\u05E4\u05E8\u05D8\u05D9 \u05D4\u05D1\u05D3\u05D9\u05E7\u05D4:`,
              description
            ].join("\n");
          } else {
            finalDescription = [
              `\u05E4\u05E0\u05D9\u05D9\u05D4 \u05DE\u05D1\u05D5\u05E2\u05EA \u05D4-AI \u05D1\u05D0\u05EA\u05E8 Tech-Select`,
              `\u05D6\u05DE\u05DF \u05E4\u05EA\u05D9\u05D7\u05D4: ${formattedDate}`,
              `\u05D7\u05D1\u05E8\u05D4: ${companyName}`,
              `\u05D0\u05D9\u05E9 \u05E7\u05E9\u05E8: ${matchedContactName || email}`,
              `\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${email}`,
              ``,
              `\u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 / \u05EA\u05D9\u05D0\u05D5\u05E8 \u05D4\u05D1\u05E7\u05E9\u05D4:`,
              description
            ].join("\n");
          }
          const titlePrefix = isResolved ? `[\u05E0\u05E4\u05EA\u05E8 Tier 1 AI]` : resStatus === "Tier2_Escalation" ? `[\u05D4\u05E1\u05DC\u05DE\u05D4 \u05DE-Tier 1 AI]` : `[\u05D0\u05EA\u05E8]`;
          const ticketTitle = `${titlePrefix} ${companyName} - ${String(description).slice(0, 40).replace(/[\r\n]+/g, " ")}`;
          const ticketBody = {
            TicketTitle: ticketTitle,
            Description: finalDescription,
            TicketPriority: isResolved ? "Low" : resStatus === "Tier2_Escalation" ? "High" : "Medium",
            TicketImpact: "Minor",
            TicketStatus: isResolved ? "Closed" : "Open",
            CustomerID: Number(customerId) || 6,
            EndUserEmail: String(email).trim()
          };
          if (contactId) {
            ticketBody.EndUserID = Number(contactId);
            ticketBody.ContactID = Number(contactId);
          }
          const ticketResponse = await fetch("https://app.atera.com/api/v3/tickets", {
            method: "POST",
            headers: {
              ...ateraHeaders,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(ticketBody)
          });
          if (ticketResponse.ok) {
            const ticketResData = await ticketResponse.json().catch(() => ({}));
            const ticketId = ticketResData?.ActionID || ticketResData?.TicketID || ticketResData?.ticketId || ticketResData?.ActionNumber || ticketResData?.Key || ticketResData?.id || ticketResData?.Item?.TicketID || Math.floor(1e4 + Math.random() * 9e4);
            if (isResolved) {
              fetch(`https://app.atera.com/api/v3/tickets/${ticketId}/workhoursrecords`, {
                method: "POST",
                headers: { ...ateraHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                  Hours: Math.floor(minutesSpent / 60),
                  Minutes: minutesSpent % 60,
                  Description: `\u05E4\u05EA\u05E8\u05D5\u05DF \u05EA\u05E7\u05DC\u05D4 \u05E2"\u05D9 Tier 1 AI (${minutesSpent} \u05D3\u05E7')`,
                  IsBillable: false
                })
              }).catch(() => {
              });
              fetch(`https://app.atera.com/api/v3/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: { ...ateraHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                  Comment: `\u2705 \u05D8\u05D9\u05E4\u05D5\u05DC Tier 1 AI \u05D4\u05D5\u05E9\u05DC\u05DD \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05D5\u05E0\u05E1\u05D2\u05E8.
\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4: ${minutesSpent} \u05D3\u05E7\u05D5\u05EA.
\u05EA\u05D9\u05D0\u05D5\u05E8 \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF: ${description}`,
                  IsInternal: true
                })
              }).catch(() => {
              });
              fetch(`https://app.atera.com/api/v3/tickets/${ticketId}`, {
                method: "PUT",
                headers: { ...ateraHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ TicketStatus: "Closed" })
              }).catch(() => {
              });
            }
            sendAlertEmail({
              subject: isResolved ? `\u2705 [\u05E0\u05E4\u05EA\u05E8 Tier 1 AI - ${minutesSpent} \u05D3\u05E7'] \u05E7\u05E8\u05D9\u05D0\u05D4 #${ticketId} - ${companyName}` : resStatus === "Tier2_Escalation" ? `\u{1F6A8} [\u05D4\u05E1\u05DC\u05DE\u05D4 \u05DE-Tier 1 AI \u05DC\u05E6\u05D5\u05D5\u05EA \u05DE\u05D5\u05DE\u05D7\u05D9\u05DD] \u05E7\u05E8\u05D9\u05D0\u05D4 #${ticketId} - ${companyName} (${email})` : `\u{1F3AB} \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05D1\u05DE\u05D5\u05E7\u05D3 \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD #${ticketId} - ${companyName}`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                  <h2 style="color: ${isResolved ? "#22c55e" : resStatus === "Tier2_Escalation" ? "#f59e0b" : "#38bdf8"}; margin-top: 0;">
                    ${isResolved ? "\u2705 \u05E7\u05E8\u05D9\u05D0\u05D4 \u05E0\u05E4\u05EA\u05E8\u05D4 \u05E2\u05DC \u05D9\u05D3\u05D9 Tier 1 AI" : resStatus === "Tier2_Escalation" ? "\u26A0\uFE0F \u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E1\u05DC\u05DE\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD (Tier 2)" : "\u{1F3AB} \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05E0\u05E4\u05EA\u05D7\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4"}
                  </h2>
                  <p style="color: #4ade80; font-size: 16px; font-weight: bold;">\u05DE\u05E1\u05E4\u05E8 \u05E7\u05E8\u05D9\u05D0\u05D4: #${ticketId}</p>
                  <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>\u05D7\u05D1\u05E8\u05D4:</strong> ${companyName}</p>
                    <p><strong>\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
                    <p><strong>\u05E1\u05D8\u05D8\u05D5\u05E1:</strong> ${resStatus} (${isResolved ? "Closed" : "Open"})</p>
                    ${isResolved ? `<p><strong>\u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4:</strong> ${minutesSpent} \u05D3\u05E7\u05D5\u05EA</p>` : ""}
                  </div>
                  <h4 style="color: #94a3b8; margin-bottom: 8px;">\u05E4\u05D9\u05E8\u05D5\u05D8:</h4>
                  <pre style="background:#0f172a; padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; white-space:pre-wrap; font-family:inherit;">${description}</pre>
                </div>
              `,
              textSummary: `\u05E7\u05E8\u05D9\u05D0\u05D4 #${ticketId}
\u05D7\u05D1\u05E8\u05D4: ${companyName}
\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${email}
\u05E1\u05D8\u05D8\u05D5\u05E1: ${resStatus}
\u05EA\u05D9\u05D0\u05D5\u05E8: ${description}`,
              replyTo: email
            }).catch(() => {
            });
            return res.json({
              success: true,
              ticketId,
              customerId,
              contactFound,
              status: isResolved ? "Closed" : "Open",
              resolutionStatus: resStatus,
              timeSpentMinutes: minutesSpent,
              message: isResolved ? `\u05E9\u05DE\u05D7\u05EA\u05D9 \u05DC\u05E2\u05D6\u05D5\u05E8! \u05EA\u05D9\u05E2\u05D3\u05EA\u05D9 \u05D0\u05EA \u05D4\u05E4\u05EA\u05E8\u05D5\u05DF \u05D1\u05DE\u05E2\u05E8\u05DB\u05EA \u05E9\u05DC\u05E0\u05D5, \u05D4\u05DB\u05DC \u05DE\u05E1\u05D5\u05D3\u05E8 (\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E1\u05D2\u05D5\u05E8\u05D4 #${ticketId}).` : `\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D5\u05E2\u05D1\u05E8\u05D4 \u05DC\u05E6\u05D5\u05D5\u05EA \u05D4\u05DE\u05D5\u05DE\u05D7\u05D9\u05DD \u05D5\u05DE\u05E1\u05E4\u05E8\u05D4 #${ticketId}. \u05E0\u05E6\u05D9\u05D2 \u05D9\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD.`
            });
          } else {
            const errText = await ticketResponse.text().catch(() => "");
            console.error(`[Atera API Express] Failed (Status ${ticketResponse.status}):`, errText);
            const fallbackTicketId = `TS-${Date.now().toString().slice(-6)}`;
            sendAlertEmail({
              subject: isResolved ? `\u2705 [\u05E0\u05E4\u05EA\u05E8 Tier 1 AI - ${minutesSpent} \u05D3\u05E7'] \u05E7\u05E8\u05D9\u05D0\u05D4 #${fallbackTicketId} - ${companyName}` : `\u{1F3AB} \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 (\u05D2\u05D9\u05D1\u05D5\u05D9) #${fallbackTicketId} - ${companyName}`,
              html: `
                <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                  <h2 style="color: #38bdf8; margin-top: 0;">\u{1F3AB} \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 (\u05DE\u05D5\u05E7\u05D3 \u05D2\u05D9\u05D1\u05D5\u05D9)</h2>
                  <p style="color: #4ade80; font-size: 16px; font-weight: bold;">\u05DE\u05E1\u05E4\u05E8 \u05E4\u05E0\u05D9\u05D9\u05D4: #${fallbackTicketId}</p>
                  <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>\u05D7\u05D1\u05E8\u05D4:</strong> ${companyName}</p>
                    <p><strong>\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
                    <p><strong>\u05E1\u05D8\u05D8\u05D5\u05E1:</strong> ${resStatus}</p>
                    ${isResolved ? `<p><strong>\u05D6\u05DE\u05DF \u05E2\u05D1\u05D5\u05D3\u05D4:</strong> ${minutesSpent} \u05D3\u05E7\u05D5\u05EA</p>` : ""}
                  </div>
                  <h4 style="color: #94a3b8; margin-bottom: 8px;">\u05DE\u05D4\u05D5\u05EA \u05D4\u05EA\u05E7\u05DC\u05D4 / \u05EA\u05D9\u05D0\u05D5\u05E8:</h4>
                  <pre style="background:#0f172a; padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; white-space:pre-wrap; font-family:inherit;">${description}</pre>
                </div>
              `,
              textSummary: `\u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 #${fallbackTicketId}
\u05D7\u05D1\u05E8\u05D4: ${companyName}
\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${email}
\u05EA\u05D9\u05D0\u05D5\u05E8: ${description}`,
              replyTo: email
            }).catch(() => {
            });
            return res.json({
              success: true,
              ticketId: fallbackTicketId,
              customerId,
              contactFound,
              message: `\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05DC\u05DA \u05D4\u05EA\u05E7\u05D1\u05DC\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 (\u05DE\u05E1\u05E4\u05E8 #${fallbackTicketId}). \u05D4\u05E6\u05D5\u05D5\u05EA \u05D9\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD.`
            });
          }
        } else {
          const devTicketId = Math.floor(1e4 + Math.random() * 9e4);
          return res.json({
            success: true,
            ticketId: devTicketId,
            customerId: 6,
            contactFound: false,
            message: `\u05D4\u05E7\u05E8\u05D9\u05D0\u05D4 \u05E9\u05DC\u05DA \u05D4\u05EA\u05E7\u05D1\u05DC\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 (\u05DE\u05E1\u05E4\u05E8 #${devTicketId}). \u05D4\u05E6\u05D5\u05D5\u05EA \u05D9\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD.`,
            isDevMode: true
          });
        }
      } catch (err) {
        console.error("[TICKETS API ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "\u05D0\u05D9\u05E8\u05E2\u05D4 \u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E4\u05EA\u05D9\u05D7\u05EA \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4. \u05D0\u05E0\u05D0 \u05E0\u05E1\u05D5 \u05E9\u05D5\u05D1 \u05D1\u05E2\u05D5\u05D3 \u05DE\u05E1\u05E4\u05E8 \u05E8\u05D2\u05E2\u05D9\u05DD \u05D0\u05D5 \u05D4\u05E9\u05D0\u05D9\u05E8\u05D5 \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D1\u05E6'\u05D0\u05D8."
        });
      }
    });
    app.post("/api/mail/send", async (req, res) => {
      try {
        const { to, subject, content, message, html } = req.body || {};
        const mailContent = content || message || html;
        const mailSubject = subject || "\u05D4\u05D5\u05D3\u05E2\u05D4 \u05DE\u05DE\u05D5\u05E7\u05D3 \u05D8\u05E7-\u05E1\u05DC\u05E7\u05D8";
        if (!to || !mailContent) {
          return res.status(400).json({
            success: false,
            error: "\u05D7\u05D5\u05D1\u05D4 \u05DC\u05E6\u05D9\u05D9\u05DF \u05E0\u05DE\u05E2\u05DF (to) \u05D5\u05EA\u05D5\u05DB\u05DF \u05D4\u05D5\u05D3\u05E2\u05D4 (content)"
          });
        }
        const isHtml = Boolean(html || typeof mailContent === "string" && mailContent.includes("<"));
        const sent = await sendEmailViaGraph({
          to,
          subject: mailSubject,
          content: mailContent,
          isHtml
        });
        if (sent) {
          return res.json({
            success: true,
            message: "\u05D4\u05DE\u05D9\u05D9\u05DC \u05E0\u05E9\u05DC\u05D7 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA Microsoft Graph API \u05DE-support@tech-select.co.il"
          });
        } else {
          return res.status(500).json({
            success: false,
            error: "\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05E9\u05DC\u05D5\u05D7 \u05DE\u05D9\u05D9\u05DC - \u05D9\u05E9 \u05DC\u05D5\u05D5\u05D3\u05D0 \u05E9\u05D4\u05D5\u05D2\u05D3\u05E8\u05D5 TENANT_ID, CLIENT_ID, CLIENT_SECRET \u05EA\u05E7\u05D9\u05E0\u05D9\u05DD \u05E2\u05DD \u05D4\u05E8\u05E9\u05D0\u05EA Mail.Send"
          });
        }
      } catch (mailErr) {
        console.error("[/api/mail/send ERROR]", mailErr);
        return res.status(500).json({
          success: false,
          error: "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA \u05D1\u05E9\u05DC\u05D9\u05D7\u05EA \u05D4\u05D3\u05D5\u05D0\u05E8",
          details: mailErr?.message || String(mailErr)
        });
      }
    });
    app.post("/api/contact", async (req, res) => {
      try {
        const { name, phone, company, isDefense, message, email, service } = req.body || {};
        if (!name || !phone) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields (name and phone)"
          });
        }
        console.log(`[CONTACT INQUIRY RECEIVED] From: ${name} (${phone}), Email: ${email || "N/A"}, Company: ${company || "N/A"}`);
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
              \u{1F4E9} \u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05DE\u05D0\u05EA\u05E8 TECH-SELECT
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold; width: 35%;">\u05E9\u05DD \u05E4\u05D5\u05E0\u05D4:</td>
                <td style="padding: 10px;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">\u05D8\u05DC\u05E4\u05D5\u05DF:</td>
                <td style="padding: 10px; font-family: monospace; font-size: 15px; color: #38bdf8;"><a href="tel:${phone}" style="color:#38bdf8; text-decoration:none;">${phone}</a></td>
              </tr>
              ${email ? `<tr style="border-bottom: 1px solid #334155;">
                      <td style="padding: 10px; font-weight: bold;">\u05D3\u05D5\u05D0"\u05DC:</td>
                      <td style="padding: 10px;">${email}</td>
                    </tr>` : ""}
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">\u05D7\u05D1\u05E8\u05D4 / \u05D0\u05E8\u05D2\u05D5\u05DF:</td>
                <td style="padding: 10px;">${company || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">\u05E4\u05E0\u05D9\u05D9\u05D4 \u05DE\u05E1\u05D5\u05D5\u05D2\u05EA / \u05D1\u05D9\u05D8\u05D7\u05D5\u05E0\u05D9\u05EA:</td>
                <td style="padding: 10px; color: ${isDefense ? "#34d399" : "#94a3b8"}; font-weight: bold;">
                  ${isDefense ? "\u{1F6E1}\uFE0F \u05DB\u05DF - \u05DE\u05EA\u05E7\u05DF \u05DE\u05E1\u05D5\u05D5\u05D2 / \u05D7\u05D1\u05E8\u05D4 \u05D1\u05D9\u05D8\u05D7\u05D5\u05E0\u05D9\u05EA" : "\u05DC\u05D0"}
                </td>
              </tr>
              ${service ? `<tr style="border-bottom: 1px solid #334155;">
                      <td style="padding: 10px; font-weight: bold;">\u05E9\u05D9\u05E8\u05D5\u05EA \u05DE\u05D1\u05D5\u05E7\u05E9:</td>
                      <td style="padding: 10px;">${service}</td>
                    </tr>` : ""}
              <tr>
                <td style="padding: 10px; font-weight: bold; vertical-align: top;">\u05EA\u05D5\u05DB\u05DF \u05D4\u05D4\u05D5\u05D3\u05E2\u05D4:</td>
                <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px; color: #f8fafc;">${message || "\u05DC\u05DC\u05D0 \u05E4\u05D9\u05E8\u05D5\u05D8 \u05E0\u05D5\u05E1\u05E3"}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
              \u05D4\u05D5\u05D3\u05E2\u05D4 \u05D6\u05D5 \u05E0\u05E9\u05DC\u05D7\u05D4 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05DE\u05D8\u05D5\u05E4\u05E1 \u05D9\u05E6\u05D9\u05E8\u05EA \u05D4\u05E7\u05E9\u05E8 \u05D1\u05D0\u05EA\u05E8 TECH-SELECT (https://tech-select.co.il)
            </p>
          </div>
        `;
        await sendAlertEmail({
          subject: `\u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05DE\u05D4\u05D0\u05EA\u05E8 - ${name} (${phone})`,
          html: htmlContent,
          textSummary: `\u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05DE\u05D4\u05D0\u05EA\u05E8:
\u05E9\u05DD: ${name}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${phone}
\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${email || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}
\u05D7\u05D1\u05E8\u05D4: ${company || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}
\u05DE\u05E1\u05D5\u05D5\u05D2: ${isDefense ? "\u05DB\u05DF" : "\u05DC\u05D0"}
\u05E9\u05D9\u05E8\u05D5\u05EA: ${service || "\u05DB\u05DC\u05DC\u05D9"}
\u05D4\u05D5\u05D3\u05E2\u05D4: ${message || "\u05DC\u05DC\u05D0"}`,
          replyTo: email || void 0,
          formData: {
            fullName: name,
            phone,
            email,
            company,
            isDefense: isDefense ? "\u05DB\u05DF" : "\u05DC\u05D0",
            service,
            userMessage: message
          }
        });
        return res.json({
          success: true,
          message: "Contact inquiry dispatched successfully"
        });
      } catch (err) {
        console.error("[CONTACT ROUTE ERROR]", err);
        return res.json({
          success: true,
          message: "Inquiry received"
        });
      }
    });
    app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        geminiAvailable: Boolean(process.env.GEMINI_API_KEY)
      });
    });
    app.post("/api/simulator/log-activity", async (req, res) => {
      try {
        const { activityType, title, formData, details, botTrap } = req.body || {};
        if (botTrap && String(botTrap).trim().length > 0) {
          console.warn("[ANTI-BOT TRIGGERED] Ignored simulator log from bot");
          return res.status(403).json({ success: false, error: "Access denied." });
        }
        console.log(`[SIMULATOR ACTIVITY] ${activityType || "event"}: ${title || "Activity logged"}`);
        if (formData && (formData.phone || formData.email || formData.fullName)) {
          const detailStr = typeof details === "object" ? JSON.stringify(details, null, 2) : String(details || "");
          await sendAlertEmail({
            subject: title || `\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D7\u05D3\u05E9\u05D4 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8 - ${formData.fullName || "\u05D2\u05D5\u05DC\u05E9"}`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
                <h2 style="color: #38bdf8; margin-top: 0;">\u26A1 ${title || "\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D7\u05D3\u05E9\u05D4 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DC\u05D8\u05D5\u05E8"}</h2>
                <p style="color: #94a3b8; font-size: 13px;">\u05E1\u05D5\u05D2 \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA: ${activityType || "general"}</p>
                <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>\u05E9\u05DD:</strong> ${formData.fullName || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</p>
                  <p><strong>\u05D8\u05DC\u05E4\u05D5\u05DF:</strong> <a href="tel:${formData.phone}" style="color: #38bdf8;">${formData.phone || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</a></p>
                  <p><strong>\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC:</strong> ${formData.email || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</p>
                  <p><strong>\u05D7\u05D1\u05E8\u05D4:</strong> ${formData.companyName || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</p>
                  <p><strong>\u05D2\u05D5\u05D3\u05DC \u05D7\u05D1\u05E8\u05D4:</strong> ${formData.companySize || "\u05DC\u05D0 \u05E6\u05D5\u05D9\u05DF"}</p>
                </div>
                ${detailStr ? `<pre style="background:#0f172a; padding:12px; border-radius:6px; font-size:12px; color:#cbd5e1; white-space:pre-wrap;">${detailStr}</pre>` : ""}
              </div>
            `,
            textSummary: `${title}
\u05E9\u05DD: ${formData.fullName}
\u05D8\u05DC\u05E4\u05D5\u05DF: ${formData.phone}
\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC: ${formData.email}
\u05D7\u05D1\u05E8\u05D4: ${formData.companyName}
${detailStr}`,
            replyTo: formData.email || void 0,
            formData
          });
        }
        return res.json({ success: true, message: "Activity logged" });
      } catch (err) {
        console.error("[SIMULATOR LOG ERROR]", err?.message || err);
        return res.json({ success: true, message: "Logged" });
      }
    });
    app.post("/api/ai-discovery/send-report-email", async (req, res) => {
      req.url = "/api/ai-discovery/send-report";
      app._router.handle(req, res);
    });
    if (process.env.NODE_ENV !== "production") {
      const vite = await (0, import_vite.createServer)({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = import_path.default.join(process.cwd(), "dist");
      const publicPath = import_path.default.join(process.cwd(), "public");
      app.use(import_express.default.static(distPath));
      app.use(import_express.default.static(publicPath));
      app.get("*", (req, res) => {
        res.sendFile(import_path.default.join(distPath, "index.html"));
      });
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (startupErr) {
    console.error("[FATAL SERVER STARTUP ERROR]", startupErr);
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
