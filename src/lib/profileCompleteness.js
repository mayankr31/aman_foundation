/**
 * Shared (client + server safe) profile-completion helpers.
 *
 * These fields mirror the mandatory fields in PersonalDetailsForm. Fellows keep
 * some of their personal data on the linked Fellow record, so we fall back to
 * that record when present.
 */

function valueOf(person, key) {
  if (!person) return "";
  const value = person[key];
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value.trim() : value;
}

function firstValue(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return "";
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export const PROFILE_REQUIRED_FIELDS = [
  { key: "name", label: "Full name", get: (u) => valueOf(u, "name") },
  { key: "email", label: "Email", get: (u) => valueOf(u, "email") },
  { key: "mobile", label: "Mobile number", get: (u) => firstValue(u?.mobile, u?.fellow?.phone) },
  { key: "dob", label: "Date of birth", get: (u) => firstValue(u?.dob, u?.fellow?.dob) },
  { key: "gender", label: "Gender", get: (u) => firstValue(u?.gender, u?.fellow?.gender) },
  { key: "maritalStatus", label: "Marital status", get: (u) => valueOf(u, "maritalStatus") },
  { key: "bloodGroup", label: "Blood group", get: (u) => valueOf(u, "bloodGroup") },
  { key: "state", label: "State", get: (u) => valueOf(u, "state") },
  { key: "district", label: "District", get: (u) => valueOf(u, "district") },
  { key: "block", label: "Block", get: (u) => valueOf(u, "block") },
  { key: "village", label: "City / Village", get: (u) => valueOf(u, "village") },
  { key: "emergencyContactName", label: "Emergency contact name", get: (u) => valueOf(u, "emergencyContactName") },
  { key: "emergencyContactPhone", label: "Emergency contact phone", get: (u) => valueOf(u, "emergencyContactPhone") },
  { key: "aadharNumber", label: "Aadhaar number", get: (u) => valueOf(u, "aadharNumber") },
  { key: "panCard", label: "PAN card", get: (u) => valueOf(u, "panCard") },
  { key: "voterId", label: "Voter ID", get: (u) => valueOf(u, "voterId") },
  { key: "highestQualification", label: "Highest qualification", get: (u) => valueOf(u, "highestQualification") },
  { key: "bankName", label: "Bank name", get: (u) => valueOf(u, "bankName") },
  { key: "bankAccountNo", label: "Bank account number", get: (u) => valueOf(u, "bankAccountNo") },
  { key: "bankIfsc", label: "IFSC code", get: (u) => valueOf(u, "bankIfsc") },
];

export function getMissingProfileFields(person) {
  if (!person) return PROFILE_REQUIRED_FIELDS.map((field) => field.key);
  const missing = [];

  for (const field of PROFILE_REQUIRED_FIELDS) {
    if (isBlank(field.get(person))) missing.push(field.key);
  }

  if (
    !isBlank(person.highestQualification) &&
    String(person.highestQualification).trim() === "Other" &&
    isBlank(person.highestQualificationDetail)
  ) {
    missing.push("highestQualificationDetail");
  }

  return missing;
}

export function isProfileComplete(person) {
  return getMissingProfileFields(person).length === 0;
}

/** Compose the structured address fields into the legacy display string. */
export function composeProfileAddress(person) {
  if (!person) return "";
  return [person.village, person.block, person.district, person.state]
    .map((value) => (value || "").trim())
    .filter(Boolean)
    .join(", ");
}
