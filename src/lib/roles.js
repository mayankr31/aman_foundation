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
};

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
