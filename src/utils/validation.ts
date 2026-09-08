/**
 * Validation Utilities for Tech-Select Client Applications
 * Enforces mandatory first name, last name, valid phone number (Israeli & International), and email.
 */

/**
 * Validates whether a phone number is a valid Israeli or International format:
 * - Israeli mobile: 050, 051, 052, 053, 054, 055, 058 (10 digits)
 * - Israeli landline: 02, 03, 04, 08, 09 (9 digits), 072-079 (10 digits)
 * - Israeli international: +972 / 972 prefixes (9-12 digits)
 * - Standard international: E.164 format (+?[1-9]\d{8,14})
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Strip whitespace, hyphens, parentheses, plus
  const clean = phone.replace(/[\s\-\(\)\.]/g, '');

  // Must not contain letters or special characters other than optional leading '+'
  if (!/^\+?\d+$/.test(clean)) return false;

  const digitsOnly = clean.replace(/\+/g, '');

  // Israeli national format: 
  // Mobile: 05X-XXXXXXX (10 digits)
  // Landlines: 0X-XXXXXXX (9 digits)
  // VoIP/Special: 07X-XXXXXXX (10 digits)
  const isrNational = /^0(?:5[0-9]|7[2-9]|[23489])\d{7}$/;

  // Israeli international format: +972 or 972 followed by 5X/7X/2/3/4/8/9 and 7 digits
  const isrIntl = /^(?:(?:\+?972)|972)(?:5[0-9]|7[2-9]|[23489])\d{7}$/;

  // General international format: 9 to 15 digits
  const generalIntl = /^\+?[1-9]\d{8,14}$/;

  // Prevent repeated identical digits like 0000000000 or 1111111111
  const isAllSameDigit = /^(\d)\1+$/.test(digitsOnly);
  if (isAllSameDigit) return false;

  return isrNational.test(clean) || isrIntl.test(clean) || generalIntl.test(clean);
}

/**
 * Validates email address format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
}

/**
 * Validates a person's name (first or last name):
 * Requires at least 2 characters of letters (Hebrew, English, etc.)
 */
export function isValidName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (clean.length < 2) return false;
  // Must contain letters (Hebrew \u0590-\u05FF or Latin a-zA-Z) and not just numbers or punctuation
  const hasLetters = /[\u0590-\u05FFa-zA-Z]/.test(clean);
  return hasLetters;
}

/**
 * Validates both first and last name together
 */
export function validateFirstAndLastName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  isHe: boolean = true
): { valid: boolean; error: string | null } {
  if (!isValidName(firstName)) {
    return {
      valid: false,
      error: isHe ? 'יש להזין שם פרטי תקין (לפחות 2 אותיות)' : 'Please enter a valid first name (at least 2 letters)',
    };
  }

  if (!isValidName(lastName)) {
    return {
      valid: false,
      error: isHe ? 'יש להזין שם משפחה תקין (לפחות 2 אותיות)' : 'Please enter a valid last name (at least 2 letters)',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates phone with user-friendly error messages
 */
export function validatePhoneInput(
  phone: string | null | undefined,
  isHe: boolean = true
): { valid: boolean; error: string | null } {
  if (!phone || !phone.trim()) {
    return {
      valid: false,
      error: isHe ? 'יש להזין מספר טלפון נייד' : 'Please enter a phone number',
    };
  }

  if (!isValidPhoneNumber(phone)) {
    return {
      valid: false,
      error: isHe
        ? 'יש להזין מספר טלפון תקין (לדוגמה: 050-1234567)'
        : 'Please enter a valid phone number (e.g. 050-1234567)',
    };
  }

  return { valid: true, error: null };
}
