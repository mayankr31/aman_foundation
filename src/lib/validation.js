// Shared input formats and validators.
// Imported by client forms (input sanitising + inline errors) and API routes
// (defence in depth), so keep this module free of React/DOM dependencies.

export const MOBILE_REGEX = /^[0-9]{10}$/;
export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const BANK_ACCOUNT_REGEX = /^[0-9]{9,18}$/;
export const VOTER_ID_REGEX = /^[A-Z]{3}[0-9]{7}$/;
export const RATION_CARD_REGEX = /^[A-Z0-9][A-Z0-9-]{5,19}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
export const PERSON_NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{0,59}$/;

export const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

// ---------------------------------------------------------------- sanitisers

export const digitsOnly = (value) => String(value ?? "").replace(/\D+/g, "");

// Accepts legacy values that still carry an Indian prefix, then returns the
// 10-digit body. Does not truncate arbitrary long numbers, so invalid values
// can still be detected by validateMobile().
export function toTenDigit(value) {
  const digits = digitsOnly(value);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const upperAlnum = (value) =>
  String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export const trimText = (value) => String(value ?? "").trim();

export const trimLower = (value) => String(value ?? "").trim().toLowerCase();

// Bound to input fields while typing.
export const toMobileInput = (value) => toTenDigit(value).slice(0, 10);
export const toAadhaarInput = (value) => digitsOnly(value).slice(0, 12);
export const toPanInput = (value) => upperAlnum(value).slice(0, 10);
export const toIfscInput = (value) => upperAlnum(value).slice(0, 11);
export const toBankAccountInput = (value) => digitsOnly(value).slice(0, 18);
export const toVoterIdInput = (value) => upperAlnum(value).slice(0, 10);
export const toRationCardInput = (value) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);

export const toPersonNameInput = (value) =>
  String(value ?? "")
    .replace(/[^A-Za-z .'-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 60);

export const toAmountInput = (value) => {
  const raw = String(value ?? "").replace(/[^0-9.]/g, "");
  const parts = raw.split(".");
  if (parts.length <= 1) return raw;
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
};

// --------------------------------------------------------------- validators
// All validators return an error string or null. Optional fields pass when blank.

export function validateMobile(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Mobile number is required." : null;
  if (!MOBILE_REGEX.test(toTenDigit(value))) {
    return "Enter a 10-digit mobile number (numbers only, no +91).";
  }
  return null;
}

export function validateAadhaar(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Aadhaar number is required." : null;
  const digits = digitsOnly(value);
  if (!AADHAAR_REGEX.test(digits)) {
    return "Aadhaar number must be exactly 12 digits.";
  }
  if (/^(\d)\1{11}$/.test(digits)) {
    return "Enter a valid Aadhaar number.";
  }
  return null;
}

export function validatePan(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "PAN is required." : null;
  if (!PAN_REGEX.test(trimText(value).toUpperCase())) {
    return "PAN must be in the format ABCDE1234F.";
  }
  return null;
}

export function validateIfsc(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "IFSC code is required." : null;
  if (!IFSC_REGEX.test(trimText(value).toUpperCase())) {
    return "IFSC must be in the format SBIN0007421.";
  }
  return null;
}

export function validateBankAccount(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Bank account number is required." : null;
  if (!BANK_ACCOUNT_REGEX.test(digitsOnly(value))) {
    return "Bank account number must be 9 to 18 digits.";
  }
  return null;
}

export function validateVoterId(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Voter ID is required." : null;
  if (!VOTER_ID_REGEX.test(trimText(value).toUpperCase())) {
    return "Voter ID must be 3 letters followed by 7 digits.";
  }
  return null;
}

export function validateRationCard(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Ration card number is required." : null;
  if (!RATION_CARD_REGEX.test(trimText(value).toUpperCase())) {
    return "Ration card must be 6 to 20 letters, digits or hyphens.";
  }
  return null;
}

export function validateEmail(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Email address is required." : null;
  if (!EMAIL_REGEX.test(trimText(value))) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePersonName(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Name is required." : null;
  if (!PERSON_NAME_REGEX.test(trimText(value))) {
    return "Use letters only (spaces, dots, apostrophes and hyphens allowed).";
  }
  return null;
}

export function validateAmount(value, { required = false, min = 0, max } = {}) {
  if (isBlank(value)) return required ? "Amount is required." : null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Enter a valid amount.";
  if (amount < min) return `Amount must be at least ${min}.`;
  if (max !== undefined && amount > max) return `Amount must be at most ${max}.`;
  return null;
}

export function validateInteger(value, { required = false, min = 0, max } = {}) {
  if (isBlank(value)) return required ? "A value is required." : null;
  const number = Number(value);
  if (!Number.isInteger(number)) return "Enter a whole number.";
  if (number < min) return `Enter a number of at least ${min}.`;
  if (max !== undefined && number > max) return `Enter a number of at most ${max}.`;
  return null;
}

export function validatePassword(value, { required = false } = {}) {
  if (isBlank(value)) return required ? "Password is required." : null;
  if (String(value).length < 8) return "Password must be at least 8 characters long.";
  return null;
}

const toDate = (value) => {
  if (isBlank(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

export function validateDateNotFuture(value, { required = false, label = "Date" } = {}) {
  if (isBlank(value)) return required ? `${label} is required.` : null;
  const date = toDate(value);
  if (!date) return `Enter a valid ${label.toLowerCase()}.`;
  if (date.getTime() > endOfToday().getTime()) return `${label} cannot be in the future.`;
  return null;
}

export function validateDateNotPast(value, { required = false, label = "Date" } = {}) {
  if (isBlank(value)) return required ? `${label} is required.` : null;
  const date = toDate(value);
  if (!date) return `Enter a valid ${label.toLowerCase()}.`;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (date.getTime() < startOfToday.getTime()) return `${label} cannot be in the past.`;
  return null;
}

export function validateDateOrder(start, end, { startLabel = "Start date", endLabel = "End date" } = {}) {
  if (isBlank(start) || isBlank(end)) return null;
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return null;
  if (endDate.getTime() < startDate.getTime()) {
    return `${endLabel} cannot be before ${startLabel.toLowerCase()}.`;
  }
  return null;
}

// Returns the first non-null error message from a list.
export const firstError = (messages) => messages.find((message) => Boolean(message)) || null;

// Server helper: normalise a few identity fields before persisting.
export const normalizeMobileForSave = (value) => (isBlank(value) ? null : toTenDigit(value));
export const normalizeAadhaarForSave = (value) => (isBlank(value) ? null : digitsOnly(value));
export const normalizePanForSave = (value) => (isBlank(value) ? null : trimText(value).toUpperCase());
export const normalizeIfscForSave = (value) => (isBlank(value) ? null : trimText(value).toUpperCase());
export const normalizeBankAccountForSave = (value) => (isBlank(value) ? null : digitsOnly(value));
export const normalizeVoterIdForSave = (value) => (isBlank(value) ? null : trimText(value).toUpperCase());
export const normalizeRationCardForSave = (value) => (isBlank(value) ? null : trimText(value).toUpperCase());
export const normalizeEmailForSave = (value) => (isBlank(value) ? null : trimLower(value));
