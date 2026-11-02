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
  "קיסר דיגום": ["caesar digum", "keisar digum", "caesar", "keisar", "caesar sampling", "keisar sampling"],
  "קייסר דיגום": ["caesar digum", "keisar digum", "caesar", "keisar"],
  קיסר: ["caesar", "keisar", "ceasar", "kaysar", "cesar", "kesar"],
  קייסר: ["caesar", "keisar", "ceasar", "kaysar", "cesar"],
  דיגום: ["digum", "sampling", "degem", "sample"],
  דגימה: ["sampling", "sample", "digum"],
  שגב: ["segev", "misgav"],
  משגב: ["misgav", "segev"],
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
  אוביה: ["ubeya", "obeya", "ubia", "ubeya ltd", "ubeya technologies", "ubeya tech"],
  אובייה: ["ubeya", "obeya", "ubia", "ubeya ltd"],
  יוביה: ["ubeya", "obeya"],
  יובייה: ["ubeya", "obeya"],
  וביה: ["ubeya", "obeya"],
  ובייה: ["ubeya", "obeya"],
  "וט מגן": ["vet magen", "vet-magen", "vetmagen", "vet magen ltd", "vetmagen ltd", "vm"],
  "וט-מגן": ["vet magen", "vet-magen", "vetmagen"],
  וטמגן: ["vet magen", "vet-magen", "vetmagen"],
  "ווט מגן": ["vet magen", "vet-magen", "vetmagen"],
  וט: ["vet", "vat", "wet"],
  ווט: ["vet", "vat", "wet"],
  וטרינרי: ["veterinary", "vet"],
  וטרינרית: ["veterinary", "vet"],
  מגן: ["magen", "mgn", "shield"],
  "הייספ לאב": ["hisep lab", "highsep lab", "hsl", "hisep", "highsep"],
  הייספ: ["hisep", "highsep", "hsl"],
  לאב: ["lab", "labs", "laboratory"],
  אסיו: ["asio", "asio software"],
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
 * Converts any Hebrew or English customer name into a canonical phonetic consonant skeleton.
 * This allows "וט מגן" (vt mgn) and "Vet Magen" / "Vetmagen" (vt mgn) to match directly
 * even when short vowels (a, e, i) are omitted in Hebrew.
 */
export function toConsonantSkeletonBilingual(str: string): string {
  if (!str) return "";
  let s = str
    .toLowerCase()
    .replace(/(?:^|\s)(?:בעמ|בע"מ|בע״מ|בע\s*מ|ltd|limited|llc|inc|corp|co|company|group|holdings)(?:$|\s)/gi, " ")
    .replace(/["'״׳`.,\-_/\\()\[\]{}|:;!?@#$%^&*+=]/g, " ")
    .trim();

  const words = s.split(/\s+/).filter(Boolean);
  const skelWords = words.map((w) => {
    if (/[\u0590-\u05FF]/.test(w)) {
      // Normalize Hebrew final letters
      const normHeb = w
        .replace(/ם/g, "מ")
        .replace(/ן/g, "נ")
        .replace(/ץ/g, "צ")
        .replace(/ף/g, "פ")
        .replace(/ך/g, "כ");
      const hebConsMap: Record<string, string> = {
        א: "",
        ב: "v",
        ג: "g",
        ד: "d",
        ה: "",
        ו: "v",
        ז: "z",
        ח: "h",
        ט: "t",
        י: "",
        כ: "k",
        ל: "l",
        מ: "m",
        נ: "n",
        ס: "s",
        ע: "",
        פ: "f",
        צ: "tz",
        ק: "k",
        ר: "r",
        ש: "s",
        ת: "t",
      };
      let out = "";
      for (let i = 0; i < normHeb.length; i++) {
        const ch = normHeb[i];
        // Keep initial או / יו as u, otherwise skip internal vowel ו unless at word start (like וט)
        if (ch === "ו" && i > 0 && normHeb[i - 1] !== "ו") {
          continue;
        }
        out += hebConsMap[ch] !== undefined ? hebConsMap[ch] : ch;
      }
      return out.replace(/(.)\1+/g, "$1");
    } else {
      // Latin word -> phonetic consonant skeleton
      let lat = w
        .replace(/ph/g, "f")
        .replace(/tch|ch/g, "h")
        .replace(/sch|sh/g, "s")
        .replace(/tz|ts/g, "tz")
        .replace(/ck|qu|q/g, "k")
        .replace(/c(?=[eiy])/g, "s")
        .replace(/c/g, "k")
        .replace(/b/g, "v")
        .replace(/p/g, "f")
        .replace(/w/g, "v")
        .replace(/x/g, "ks");
      // Strip all vowels
      lat = lat.replace(/[aeiouy]/g, "");
      return lat.replace(/(.)\1+/g, "$1");
    }
  });

  return skelWords.filter(Boolean).join(" ");
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

  // For 2-letter and 3-letter pure consonant Latin outputs (e.g. "vt" -> "vet", "vat"; "mgn" -> "magen", "megan")
  if (/^[bcdfghjklmnpqrstvwxz]{2}$/.test(primary)) {
    variants.add(`${primary[0]}e${primary[1]}`);
    variants.add(`${primary[0]}a${primary[1]}`);
    variants.add(`${primary[0]}o${primary[1]}`);
  } else if (/^[bcdfghjklmnpqrstvwxz]{3}$/.test(primary)) {
    variants.add(`${primary[0]}a${primary[1]}e${primary[2]}`);
    variants.add(`${primary[0]}e${primary[1]}e${primary[2]}`);
    variants.add(`${primary[0]}a${primary[1]}a${primary[2]}`);
    variants.add(`${primary[0]}o${primary[1]}a${primary[2]}`);
  }

  // If word has "k" at start, also produce "c" variant
  if (primary.startsWith("k")) {
    variants.add("c" + primary.slice(1));
  }
  // If word has "s", also produce "c" variant (e.g. caesar)
  if (primary.includes("s")) {
    variants.add(primary.replace(/s/g, "c"));
  }

  // If Hebrew word starts with "או" or "יו" (e.g. אוביה, יוביה, אאוטבריין), produce "u..." and "o..." variants
  if (clean.startsWith("או") || clean.startsWith("יו")) {
    const rest = clean.slice(2);
    let restLatin = "";
    for (const char of rest) {
      restLatin += charMap[char] ? charMap[char][0] : char;
    }
    variants.add("u" + restLatin);
    variants.add("o" + restLatin);
    if (clean.includes("יה") || clean.includes("ייה")) {
      const stem = rest.replace(/י?יה$/, "");
      let stemLatin = "";
      for (const char of stem) {
        stemLatin += charMap[char] ? charMap[char][0] : char;
      }
      variants.add("u" + stemLatin + "eya");
      variants.add("u" + stemLatin + "ya");
      variants.add("o" + stemLatin + "eya");
      variants.add("ubeya");
    }
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

  // Also include joined (space-free) version
  const noSpaceRaw = (stripped || raw).toLowerCase().replace(/\s+/g, "");
  if (noSpaceRaw.length >= 2) {
    variants.add(noSpaceRaw);
  }

  const isHebrew = /[\u0590-\u05FF]/.test(raw);

  if (isHebrew) {
    // 1. Check direct dictionary matches for whole query or stripped
    const directEng = BILINGUAL_TERM_MAP[raw] || BILINGUAL_TERM_MAP[stripped] || [];
    for (const eng of directEng) {
      variants.add(eng);
      variants.add(eng.replace(/\s+/g, ""));
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
    const maxCombinations = 24;
    let combCount = 0;
    const generateCombos = (idx: number, cur: string[]) => {
      if (combCount >= maxCombinations) return;
      if (idx >= expandedTokens.length) {
        if (cur.length > 0) {
          variants.add(cur.join(" "));
          variants.add(cur.join(""));
          combCount++;
        }
        return;
      }
      for (const option of expandedTokens[idx]) {
        generateCombos(idx + 1, [...cur, option]);
      }
    };
    generateCombos(0, []);

    // Also add individual significant tokens (including 2-letter prefixes like "וט")
    for (const tok of tokens) {
      if (tok.length >= 2) {
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
      variants.add(heb.replace(/\s+/g, ""));
    }

    const tokens = (stripped || raw).toLowerCase().split(/\s+/).filter(Boolean);
    const expandedTokens: string[][] = tokens.map((tok) => {
      const candidates = new Set<string>();
      candidates.add(tok);
      const hList = REVERSE_BILINGUAL_MAP[tok] || [];
      for (const h of hList) candidates.add(h);
      return Array.from(candidates);
    });

    const maxCombinations = 24;
    let combCount = 0;
    const generateCombos = (idx: number, cur: string[]) => {
      if (combCount >= maxCombinations) return;
      if (idx >= expandedTokens.length) {
        if (cur.length > 0) {
          variants.add(cur.join(" "));
          variants.add(cur.join(""));
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
      if (tok.length >= 2) {
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
 * across all generated bilingual variants and phonetic consonant skeletons.
 */
export function scoreBilingualCustomerMatch(
  customerName: string,
  query: string,
  expandedVariants?: string[]
): { score: number; matchReason: string; matchedVariant: string } {
  const normCustomer = normalizeCustomerStringBilingual(customerName);
  const normCustomerNoSpace = normCustomer.replace(/\s+/g, "");
  const skelCustomer = toConsonantSkeletonBilingual(customerName);
  const skelCustomerNoSpace = skelCustomer.replace(/\s+/g, "");
  const skelQuery = toConsonantSkeletonBilingual(query);
  const skelQueryNoSpace = skelQuery.replace(/\s+/g, "");

  // Direct consonant skeleton check between query and customerName (e.g. "וט מגן" == "Vet Magen" / "Vetmagen" -> "vtmgn")
  if (
    skelCustomerNoSpace.length >= 3 &&
    skelQueryNoSpace.length >= 3 &&
    (skelCustomer === skelQuery || skelCustomerNoSpace === skelQueryNoSpace)
  ) {
    return {
      score: 0.96,
      matchReason: `התאמה פונטית דו-לשונית מלאה (${skelCustomer})`,
      matchedVariant: skelQuery,
    };
  }

  const variants = expandedVariants || expandBilingualCustomerQueries(query);

  let bestScore = 0;
  let bestReason = "התאמה חלקית";
  let bestVariant = query;

  // Check if consonant skeleton of customer contains or starts with query skeleton
  if (skelCustomerNoSpace.length >= 4 && skelQueryNoSpace.length >= 4) {
    if (skelCustomerNoSpace.startsWith(skelQueryNoSpace) || skelQueryNoSpace.startsWith(skelCustomerNoSpace)) {
      bestScore = 0.91;
      bestReason = `התאמה פונטית של תחילית שם הלקוח (${skelQuery})`;
      bestVariant = skelQuery;
    } else if (skelCustomerNoSpace.includes(skelQueryNoSpace) || skelQueryNoSpace.includes(skelCustomerNoSpace)) {
      bestScore = 0.88;
      bestReason = `התאמה פונטית של רכיבי שם הלקוח (${skelQuery})`;
      bestVariant = skelQuery;
    }
  }

  for (const variant of variants) {
    const normVar = normalizeCustomerStringBilingual(variant);
    if (!normVar) continue;
    const normVarNoSpace = normVar.replace(/\s+/g, "");

    // 1. Exact raw match
    if (customerName.toLowerCase() === variant.toLowerCase()) {
      return { score: 1.0, matchReason: "התאמה מלאה מדויקת", matchedVariant: variant };
    }

    // 2. Normalized exact match (spaced or unspaced)
    if (normCustomer === normVar || (normCustomerNoSpace.length >= 3 && normCustomerNoSpace === normVarNoSpace)) {
      return { score: 0.98, matchReason: "התאמה מלאה לאחר נירמול ותרגום", matchedVariant: variant };
    }

    // 3. Name starts with variant
    if (normCustomer.startsWith(normVar) || (normVarNoSpace.length >= 3 && normCustomerNoSpace.startsWith(normVarNoSpace))) {
      if (0.94 > bestScore) {
        bestScore = 0.94;
        bestReason = `שם הלקוח ב-SharePoint מתחיל ב-'${variant}'`;
        bestVariant = variant;
      }
    }

    // 4. Variant starts with name
    if (normVar.startsWith(normCustomer) || (normCustomerNoSpace.length >= 3 && normVarNoSpace.startsWith(normCustomerNoSpace))) {
      if (0.92 > bestScore) {
        bestScore = 0.92;
        bestReason = `השאילתה מתחילה בשם הלקוח '${customerName}'`;
        bestVariant = variant;
      }
    }

    // 5. Substring containment
    if ((normCustomer.includes(normVar) || normCustomerNoSpace.includes(normVarNoSpace)) && normVarNoSpace.length >= 3) {
      if (0.90 > bestScore) {
        bestScore = 0.90;
        bestReason = `שם הלקוח ב-SharePoint מכיל '${variant}'`;
        bestVariant = variant;
      }
    } else if ((normVar.includes(normCustomer) || normVarNoSpace.includes(normCustomerNoSpace)) && normCustomerNoSpace.length >= 3) {
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
        if ((maxL >= 3 && dist <= 1) || (maxL >= 5 && dist <= 2)) {
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

    // 7. Levenshtein on whole string (spaced and unspaced)
    const dist = Math.min(
      levenshteinDistance(normVar, normCustomer),
      levenshteinDistance(normVarNoSpace, normCustomerNoSpace)
    );
    const maxLen = Math.max(normVarNoSpace.length, normCustomerNoSpace.length);
    if (maxLen >= 3) {
      const sim = 1 - dist / maxLen;
      if (sim > 0.62 && sim * 0.90 > bestScore) {
        bestScore = sim * 0.90;
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

// In-memory cache for Gemini semantic customer matching
const geminiCustomerMatchCache = new Map<string, { match: CustomerMatch | null; timestamp: number }>();

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

  const cacheKey = `${query.trim().toLowerCase()}__${customers.length}`;
  const cached = geminiCustomerMatchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
    return cached.match;
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
1. Hebrew to English transliteration (e.g., "וט מגן" = "Vet Magen" or "Vetmagen", "אוביה" = "Ubeya", "קיסר דיגום" = "Caesar Digum").
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
        (c) => c.name.toLowerCase().trim() === String(parsed.matchedName).toLowerCase().trim()
      );
      if (matchedCustomer) {
        const result: CustomerMatch = {
          customer: matchedCustomer,
          score: Number(parsed.confidence) || 0.95,
          matchReason: parsed.reason || "התאמה בילינגוואלית חכמה (Gemini AI)",
        };
        geminiCustomerMatchCache.set(cacheKey, { match: result, timestamp: Date.now() });
        return result;
      }
    }
    geminiCustomerMatchCache.set(cacheKey, { match: null, timestamp: Date.now() });
  } catch (err: any) {
    console.warn("[matchCustomerWithGemini] Semantic matching error:", err?.message || err);
  }

  return null;
}
