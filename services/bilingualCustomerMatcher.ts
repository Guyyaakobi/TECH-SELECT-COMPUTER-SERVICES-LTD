/**
 * NEXUS OS - Bilingual Customer Matcher
 * 
 * Provides intelligent bidirectional matching (Hebrew <-> English) between
 * technician voice/text inputs and SharePoint customer folder/library names.
 * 
 * In SharePoint, customer folders are often named in English (e.g. "Caesar Digum",
 * "Keisar", "Tech Select") while technicians frequently speak or type in Hebrew
 * (e.g. "קיסר דיגום", "טק סלקט"), and vice-versa.
 * 
 * This module guarantees that customer search searches in BOTH Hebrew and English,
 * and always resolves to the exact customer folder name in SharePoint.
 */

import { GoogleGenAI } from "@google/genai";
import type { CustomerFolder, CustomerMatch } from "./graphHours";

// Common bilingual dictionary for Israeli IT / Enterprise customer names and terms
export const BILINGUAL_TERM_MAP: Record<string, string[]> = {
  // Common specific customer transliterations & names
  קיסר: ["caesar", "keisar", "ceasar", "kaysar", "cesar", "kesar"],
  קייסר: ["caesar", "keisar", "ceasar", "kaysar", "cesar"],
  דיגום: ["digum", "sampling", "degem", "sample"],
  דגימה: ["sampling", "sample", "digum"],
  סלקט: ["select"],
  טק: ["tech"],
  טכנולוגיות: ["technologies", "technology", "tech"],
  מעבדות: ["labs", "laboratories", "lab"],
  מעבדה: ["lab", "laboratory", "labs"],
  הנדסה: ["engineering", "engineers"],
  מערכות: ["systems", "system"],
  פתרונות: ["solutions", "solution"],
  תקשורת: ["telecom", "communications", "networks", "telecoms"],
  ביטחון: ["security", "defense", "secure"],
  אבטחה: ["security", "secure", "defense"],
  סייבר: ["cyber"],
  ענן: ["cloud"],
  קלאוד: ["cloud"],
  פיננסים: ["finance", "financial"],
  נדלן: ["real estate", "properties", "property"],
  סחר: ["trade", "trading"],
  שירותים: ["services", "service"],
  שירותי: ["services", "service"],
  רפואי: ["medical", "pharma"],
  מדיקל: ["medical"],
  פארמה: ["pharma", "pharmaceuticals"],
  ביו: ["bio", "biotech"],
  החזקות: ["holdings", "holding"],
  קבוצת: ["group"],
  קבוצה: ["group"],
  בינלאומי: ["international", "global"],
  גלובל: ["global"],
  משרד: ["office"],
  עורכי: ["law", "advocates"],
  דין: ["law"],
  עוד: ["law", "lawyers", "counsel"],
  רואי: ["cpa", "accounting"],
  חשבון: ["cpa", "accounting"],
  רוח: ["cpa", "accounting"],
  תעשיות: ["industries", "industrial", "industry"],
  תעשיה: ["industries", "industrial", "industry"],
  ניהול: ["management"],
  השקעות: ["investments", "capital", "ventures"],
  אינטרנשיונל: ["international"],
  אלקטרוניקה: ["electronics"],
  תוכנה: ["software"],
  מחשוב: ["computing", "computers", "it"],
  דיגיטל: ["digital"],
  לוגיסטיקה: ["logistics"],
  שיווק: ["marketing"],
  ישראל: ["israel"],
  טבע: ["teva"],
  אלביט: ["elbit"],
  רפאל: ["rafael"],
  אלקטרה: ["electra"],
  שטראוס: ["strauss"],
  תנובה: ["tnuva"],
  בזק: ["bezeq"],
  סלקום: ["cellcom"],
  פרטנר: ["partner"],
  הוט: ["hot"],
  מגדל: ["migdal"],
  הראל: ["harel"],
  כלל: ["clal"],
  מנורה: ["menora"],
  הפניקס: ["fnx", "phoenix"],
  פנגו: ["pango"],
  מטריקס: ["matrix"],
  מלם: ["malam", "malamteam"],
  טים: ["team"],
  חילן: ["hilan"],
  דל: ["dell"],
  לנובו: ["lenovo"],
  מיקרוסופט: ["microsoft", "m365", "msft"],
  סיסקו: ["cisco"],
  פורטינט: ["fortinet"],
  צק: ["check"],
  פוינט: ["point"],
};

// Reverse dictionary: English -> Hebrew
export const REVERSE_BILINGUAL_MAP: Record<string, string[]> = {};
for (const [heb, engList] of Object.entries(BILINGUAL_TERM_MAP)) {
  for (const eng of engList) {
    const cleanEng = eng.toLowerCase().trim();
    if (!REVERSE_BILINGUAL_MAP[cleanEng]) {
      REVERSE_BILINGUAL_MAP[cleanEng] = [];
    }
    if (!REVERSE_BILINGUAL_MAP[cleanEng].includes(heb)) {
      REVERSE_BILINGUAL_MAP[cleanEng].push(heb);
    }
  }
}

/**
 * Phonetic transliteration from Hebrew to Latin characters
 */
export function phoneticHebrewToLatin(hebStr: string): string[] {
  if (!hebStr) return [];
  const clean = hebStr.trim().toLowerCase();

  // Primary letter mapping
  const charMap: Record<string, string[]> = {
    א: ["", "a", "e"],
    ב: ["b", "v"],
    ג: ["g"],
    ד: ["d"],
    ה: ["h", ""],
    ו: ["v", "o", "u", "w"],
    ז: ["z"],
    ח: ["ch", "h", "kh"],
    ט: ["t"],
    י: ["y", "i", "e", "ei"],
    כ: ["k", "c", "ch"],
    ך: ["k", "ch"],
    ל: ["l"],
    מ: ["m"],
    ם: ["m"],
    נ: ["n"],
    ן: ["n"],
    ס: ["s", "c"],
    ע: ["", "a", "e"],
    פ: ["p", "f"],
    ף: ["f", "ph"],
    צ: ["tz", "ts", "z"],
    ץ: ["tz", "ts", "z"],
    ק: ["k", "c", "q"],
    ר: ["r"],
    ש: ["sh", "s"],
    ת: ["t"],
  };

  // Generate standard phonetic transliteration
  let primary = "";
  for (const char of clean) {
    if (charMap[char]) {
      primary += charMap[char][0];
    } else {
      primary += char;
    }
  }

  // Specialized known rules for Hebrew IT names
  const variants = new Set<string>();
  if (primary) variants.add(primary);

  // If word has "k" at start, also produce "c" variant
  if (primary.startsWith("k")) {
    variants.add("c" + primary.slice(1));
  }
  // If word has "s", also produce "c" variant (e.g. caesar)
  if (primary.includes("s")) {
    variants.add(primary.replace(/s/g, "c"));
  }

  return Array.from(variants);
}

/**
 * Phonetic transliteration from Latin characters to Hebrew
 */
export function phoneticLatinToHebrew(latStr: string): string[] {
  if (!latStr) return [];
  const clean = latStr.trim().toLowerCase();

  const variants = new Set<string>();

  // Direct dictionary lookup for whole string
  if (REVERSE_BILINGUAL_MAP[clean]) {
    for (const h of REVERSE_BILINGUAL_MAP[clean]) {
      variants.add(h);
    }
  }

  // Token level lookup
  const tokens = clean.split(/\s+/).filter(Boolean);
  const tokenHebrewOptions: string[][] = tokens.map((token) => {
    const list = REVERSE_BILINGUAL_MAP[token] || [];
    if (list.length > 0) return list;
    return [token];
  });

  // Cross product of token translations
  const combineTokens = (idx: number, current: string[]) => {
    if (idx >= tokenHebrewOptions.length) {
      if (current.length > 0) variants.add(current.join(" "));
      return;
    }
    for (const opt of tokenHebrewOptions[idx]) {
      combineTokens(idx + 1, [...current, opt]);
    }
  };
  combineTokens(0, []);

  return Array.from(variants);
}

/**
 * Expands any user query into a comprehensive set of bilingual search variants.
 * If input is in Hebrew, generates English transliterations, dictionary translations, and phonetic spellings.
 * If input is in English, generates Hebrew transliterations and translations.
 */
export function expandBilingualCustomerQueries(query: string): string[] {
  if (!query || !query.trim()) return [];
  const raw = query.trim();
  const variants = new Set<string>();

  // Always include raw and lowercase
  variants.add(raw);
  variants.add(raw.toLowerCase());

  // Clean corporate suffixes
  const stripped = raw
    .replace(/(?:^|\s)(?:בעמ|בע"מ|בע״מ|בע מ|בע\s*מ|ltd|limited|llc|inc|corp|company|group|קבוצת)(?:$|\s)/gi, " ")
    .replace(/[.,\-_/\\()\[\]{}|:;!?@#$%^&*+=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped && stripped !== raw) {
    variants.add(stripped);
    variants.add(stripped.toLowerCase());
  }

  const isHebrew = /[\u0590-\u05FF]/.test(raw);

  if (isHebrew) {
    // 1. Check direct dictionary matches for whole query or stripped
    const directEng = BILINGUAL_TERM_MAP[raw] || BILINGUAL_TERM_MAP[stripped] || [];
    for (const eng of directEng) {
      variants.add(eng);
    }

    // 2. Token-by-token expansion
    const tokens = (stripped || raw).split(/\s+/).filter(Boolean);
    const expandedTokens: string[][] = tokens.map((tok) => {
      const candidates = new Set<string>();
      candidates.add(tok);
      const dictList = BILINGUAL_TERM_MAP[tok] || [];
      for (const d of dictList) candidates.add(d);
      const phonetics = phoneticHebrewToLatin(tok);
      for (const p of phonetics) candidates.add(p);
      return Array.from(candidates);
    });

    // Generate combinations of tokens
    const maxCombinations = 16;
    let combCount = 0;
    const generateCombos = (idx: number, cur: string[]) => {
      if (combCount >= maxCombinations) return;
      if (idx >= expandedTokens.length) {
        if (cur.length > 0) {
          variants.add(cur.join(" "));
          combCount++;
        }
        return;
      }
      for (const option of expandedTokens[idx]) {
        generateCombos(idx + 1, [...cur, option]);
      }
    };
    generateCombos(0, []);

    // Also add individual significant tokens (e.g. "קיסר", "caesar", "keisar")
    for (const tok of tokens) {
      if (tok.length >= 3) {
        variants.add(tok);
        const dList = BILINGUAL_TERM_MAP[tok] || [];
        for (const d of dList) variants.add(d);
        const pList = phoneticHebrewToLatin(tok);
        for (const p of pList) variants.add(p);
      }
    }
  } else {
    // English query -> Expand to Hebrew
    const directHeb = REVERSE_BILINGUAL_MAP[raw.toLowerCase()] || REVERSE_BILINGUAL_MAP[stripped.toLowerCase()] || [];
    for (const heb of directHeb) {
      variants.add(heb);
    }

    const tokens = (stripped || raw).toLowerCase().split(/\s+/).filter(Boolean);
    const expandedTokens: string[][] = tokens.map((tok) => {
      const candidates = new Set<string>();
      candidates.add(tok);
      const hList = REVERSE_BILINGUAL_MAP[tok] || [];
      for (const h of hList) candidates.add(h);
      return Array.from(candidates);
    });

    const maxCombinations = 16;
    let combCount = 0;
    const generateCombos = (idx: number, cur: string[]) => {
      if (combCount >= maxCombinations) return;
      if (idx >= expandedTokens.length) {
        if (cur.length > 0) {
          variants.add(cur.join(" "));
          combCount++;
        }
        return;
      }
      for (const option of expandedTokens[idx]) {
        generateCombos(idx + 1, [...cur, option]);
      }
    };
    generateCombos(0, []);

    for (const tok of tokens) {
      if (tok.length >= 3) {
        variants.add(tok);
        const hList = REVERSE_BILINGUAL_MAP[tok] || [];
        for (const h of hList) variants.add(h);
      }
    }
  }

  return Array.from(variants).filter((v) => Boolean(v && v.trim().length > 1));
}

/**
 * Normalizes customer string removing corporate noise and unifying characters
 */
export function normalizeCustomerStringBilingual(str: string): string {
  if (!str) return "";
  let s = str.toLowerCase().trim();

  // Remove quotes, double quotes, gershayim, geresh
  s = s.replace(/["'״׳`]/g, "");

  // Remove common corporate suffixes: בע"מ, בעמ, בע״מ, בע׳׳מ, בע מ, בע  מ, ltd, inc, llc
  s = s.replace(/(?:^|\s)(?:בעמ|בע\s*מ|בע״מ|בע׳׳מ)(?:$|\s)/gi, " ");
  s = s.replace(/\b(ltd|limited|llc|inc|corp|co|company|group|holdings)\b/gi, " ");

  // Remove special symbols & punctuation
  s = s.replace(/[.,\-_/\\()\[\]{}|:;!?@#$%^&*+=]/g, " ");

  // Normalize Hebrew final forms (סופיות) to standard forms
  s = s
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ץ/g, "צ")
    .replace(/ף/g, "פ")
    .replace(/ך/g, "כ");

  // Collapse consecutive whitespaces
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Calculates Levenshtein Distance
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Scores the match between a candidate customer name and the user's query
 * across all generated bilingual variants.
 */
export function scoreBilingualCustomerMatch(
  customerName: string,
  query: string,
  expandedVariants?: string[]
): { score: number; matchReason: string; matchedVariant: string } {
  const normCustomer = normalizeCustomerStringBilingual(customerName);
  const variants = expandedVariants || expandBilingualCustomerQueries(query);

  let bestScore = 0;
  let bestReason = "התאמה חלקית";
  let bestVariant = query;

  for (const variant of variants) {
    const normVar = normalizeCustomerStringBilingual(variant);
    if (!normVar) continue;

    // 1. Exact raw match
    if (customerName.toLowerCase() === variant.toLowerCase()) {
      return { score: 1.0, matchReason: "התאמה מלאה מדויקת", matchedVariant: variant };
    }

    // 2. Normalized exact match
    if (normCustomer === normVar) {
      return { score: 0.98, matchReason: "התאמה מלאה לאחר נירמול ותרגום", matchedVariant: variant };
    }

    // 3. Name starts with variant
    if (normCustomer.startsWith(normVar)) {
      if (0.94 > bestScore) {
        bestScore = 0.94;
        bestReason = `שם הלקוח ב-SharePoint מתחיל ב-'${variant}'`;
        bestVariant = variant;
      }
    }

    // 4. Variant starts with name
    if (normVar.startsWith(normCustomer)) {
      if (0.92 > bestScore) {
        bestScore = 0.92;
        bestReason = `השאילתה מתחילה בשם הלקוח '${customerName}'`;
        bestVariant = variant;
      }
    }

    // 5. Substring containment
    if (normCustomer.includes(normVar) && normVar.length >= 3) {
      if (0.90 > bestScore) {
        bestScore = 0.90;
        bestReason = `שם הלקוח ב-SharePoint מכיל '${variant}'`;
        bestVariant = variant;
      }
    } else if (normVar.includes(normCustomer) && normCustomer.length >= 3) {
      if (0.88 > bestScore) {
        bestScore = 0.88;
        bestReason = `השאילתה מכילה את שם הלקוח '${customerName}'`;
        bestVariant = variant;
      }
    }

    // 6. Token matching
    const custTokens = normCustomer.split(" ").filter(Boolean);
    const varTokens = normVar.split(" ").filter(Boolean);

    let matchedTokens = 0;
    for (const vTok of varTokens) {
      for (const cTok of custTokens) {
        if (vTok === cTok) {
          matchedTokens++;
          break;
        }
        if (cTok.startsWith(vTok) || vTok.startsWith(cTok)) {
          matchedTokens += 0.85;
          break;
        }
        const dist = levenshteinDistance(vTok, cTok);
        const maxL = Math.max(vTok.length, cTok.length);
        if (maxL > 3 && dist <= 1) {
          matchedTokens += 0.8;
          break;
        }
      }
    }

    if (varTokens.length > 0) {
      const tokenScore = Math.min(1.0, (matchedTokens / varTokens.length) * 0.9);
      if (tokenScore > bestScore) {
        bestScore = tokenScore;
        bestReason = `התאמת מילות מפתח בילינגוואלית (${variant})`;
        bestVariant = variant;
      }
    }

    // 7. Levenshtein on whole string
    const dist = levenshteinDistance(normVar, normCustomer);
    const maxLen = Math.max(normVar.length, normCustomer.length);
    if (maxLen > 3) {
      const sim = 1 - dist / maxLen;
      if (sim > 0.65 && sim * 0.88 > bestScore) {
        bestScore = sim * 0.88;
        bestReason = `התאמה פונטית / איות קרוב (${variant})`;
        bestVariant = variant;
      }
    }
  }

  return {
    score: Math.round(bestScore * 100) / 100,
    matchReason: bestReason,
    matchedVariant: bestVariant,
  };
}

/**
 * Gemini LLM Semantic Customer Matcher
 * Uses Gemini Flash to select the authoritative SharePoint customer folder
 * when matching ambiguous names or complex mixed transliterations.
 */
export async function matchCustomerWithGemini(
  query: string,
  customers: CustomerFolder[],
  apiKey?: string
): Promise<CustomerMatch | null> {
  const effectiveKey = apiKey || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
  if (!effectiveKey || !query || !customers || customers.length === 0) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const candidateNames = customers.map((c) => c.name);
    const prompt = `You are the SharePoint Customer Matching Engine for an IT enterprise.
A technician mentioned a customer in conversation/voice: "${query}".
The customer folders in SharePoint are named as follows (sometimes in English, sometimes in Hebrew):
${JSON.stringify(candidateNames)}

Task: Identify the EXACT SharePoint folder name that matches the technician's mentioned customer "${query}".
Take into account:
1. Hebrew to English transliteration (e.g., "קיסר דיגום" = "Caesar Digum" or "Keisar" or "Caesar Sampling").
2. English to Hebrew transliteration (e.g., "Tech Select" = "טק סלקט").
3. Common Israeli business terms and abbreviations.

Respond with ONLY a raw JSON object (no markdown, no backticks):
{"matchedName": "EXACT_FOLDER_NAME_FROM_LIST_OR_EMPTY", "confidence": 0.95, "reason": "Explanation in Hebrew"}`;

    const res = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 250,
      },
    });

    const text = (res.text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(text);

    if (parsed && parsed.matchedName) {
      const matchedCustomer = customers.find(
        (c) => c.name.toLowerCase() === String(parsed.matchedName).toLowerCase().trim()
      );
      if (matchedCustomer) {
        return {
          customer: matchedCustomer,
          score: Number(parsed.confidence) || 0.95,
          matchReason: parsed.reason || "התאמה בילינגוואלית חכמה (Gemini AI)",
        };
      }
    }
  } catch (err: any) {
    console.warn("[matchCustomerWithGemini] Semantic matching error:", err?.message || err);
  }

  return null;
}
