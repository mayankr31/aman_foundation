// Shared role display helpers.
// Internal role codes stay stable (permissions and API checks depend on them),
// but labels are stored separately and shown exactly as the admin entered them.

const ROLE_LABELS = {
  ADMIN: "Executive Director",
  FELLOW: "Fellow",
  HR: "HR",
  ACCOUNTANT: "Accountant",
  CLASS_ASSISTANT: "Class Assistant",
  FIELD_EXECUTIVE: "Field Executive",
  PROGRAM_COORDINATOR: "Program Coordinator",
  PROGRAM_MANAGER: "Program Manager",
  PROGRAM_LEAD: "Program Lead",
  PROGRAM_DIRECTOR: "Program Director",
  COMMUNITY_RESOURCE_PERSONS_CRP: "Community Resource Persons CRP",
};

/**
 * Roles allowed to assign or remove staff and fellows on schools and
 * after-school centres. Class Assistants are deliberately excluded.
 */
export const ASSIGNMENT_ROLES = [
  "PROGRAM_MANAGER",
  "ACCOUNTANT",
  "PROGRAM_COORDINATOR",
  "FIELD_EXECUTIVE",
  "PROGRAM_DIRECTOR",
  "PROGRAM_LEAD",
];

/**
 * True only for the Executive Director (the ADMIN role).
 * Used to gate destructive record deletion across the app.
 */
export function canDeleteRecords(user) {
  return user?.role?.name === "ADMIN" || user?.roleName === "ADMIN";
}

/** Normalises a role code for map lookups only. Never used for storage. */
export function normalizeRoleCode(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Roles that see every record once their page permissions allow it.
 * Every other role is limited to the records assigned to it.
 */
export const GLOBAL_ROLE_CODES = ["ADMIN", "HR"];

/** True for the oversight roles that are never assignment-scoped. */
export function isGlobalRoleName(role) {
  return GLOBAL_ROLE_CODES.includes(normalizeRoleCode(role));
}

/**
 * True for roles whose data access is limited to their assigned schools,
 * centres and programs. Accepts either a role code or a role object.
 */
export function isFieldScopedRoleName(role) {
  const code = normalizeRoleCode(
    role && typeof role === "object" ? role.name : role
  );
  return Boolean(code) && !GLOBAL_ROLE_CODES.includes(code);
}

/**
 * True for field staff who are assigned through the program-manager lists.
 * Fellows are scoped through their fellowship assignments instead, so they are
 * deliberately excluded here.
 */
export function isProgramStaffRole(role) {
  const code = normalizeRoleCode(
    role && typeof role === "object" ? role.name : role
  );
  return Boolean(code) && code !== "FELLOW" && !GLOBAL_ROLE_CODES.includes(code);
}

/** Turns a role object or stored role code into its display label. */
export function formatRoleLabel(role) {
  if (!role) return "—";

  if (typeof role === "object") {
    const displayName =
      typeof role.displayName === "string" ? role.displayName.trim() : "";
    if (displayName) return displayName;
    role = role.name;
  }

  const raw = String(role).trim();
  if (!raw) return "—";

  const normalized = normalizeRoleCode(raw);
  if (ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];

  // Custom/legacy role: preserve the casing exactly, only make separators
  // readable. This keeps labels like "CEO" and "VP Sales" intact.
  return raw.replaceAll("_", " ").replace(/\s+/g, " ").trim();
}

/**
 * Builds a unique internal code from a display name, e.g. "Senior Manager"
 * becomes "SENIOR_MANAGER" and collides safely as "SENIOR_MANAGER_2".
 */
export function buildRoleCode(displayName, existingCodes = []) {
  const base =
    String(displayName || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "ROLE";

  const taken = new Set(existingCodes.map((code) => String(code).toUpperCase()));
  let code = base;
  let suffix = 2;
  while (taken.has(code)) {
    code = `${base}_${suffix}`;
    suffix += 1;
  }
  return code;
}
