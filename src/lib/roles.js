// Shared role display helpers.
// Internal role codes stay stable (permissions and API checks depend on them),
// but labels can be customised here for the UI.

const ROLE_LABELS = {
  ADMIN: "Executive Director",
};

/**
 * True only for the Executive Director (the ADMIN role).
 * Used to gate destructive record deletion across the app.
 */
export function canDeleteRecords(user) {
  return user?.role?.name === "ADMIN" || user?.roleName === "ADMIN";
}

/** Turns a stored role code (e.g. PROGRAM_MANAGER) into a readable label. */
export function formatRoleLabel(role) {
  if (!role) return "—";
  const normalized = String(role).trim().toUpperCase().replaceAll(" ", "_");
  if (ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];
  return normalized
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
