// Client-safe Team Check-In constants and helpers.
// Keep this file free of Prisma/server-only imports so the form, list, and
// view modals can use it directly.

export const TEAM_CHECK_IN_TYPES = [
  { value: "7_DAYS", label: "7 Days" },
  { value: "15_DAYS", label: "15 Days" },
];

export const TEAM_CHECK_IN_TYPE_VALUES = TEAM_CHECK_IN_TYPES.map((item) => item.value);

export const DEFAULT_CHECK_IN_TYPE = "7_DAYS";

/** Roles that never see the Team CheckIn tab. */
export const TEAM_CHECK_IN_EXCLUDED_ROLES = ["FELLOW"];

export function canRoleHaveTeamCheckIn(roleName) {
  return Boolean(roleName) && !TEAM_CHECK_IN_EXCLUDED_ROLES.includes(roleName);
}

export function normalizeCheckInType(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return TEAM_CHECK_IN_TYPE_VALUES.includes(normalized) ? normalized : DEFAULT_CHECK_IN_TYPE;
}

export function checkInTypeLabel(value) {
  const match = TEAM_CHECK_IN_TYPES.find((item) => item.value === value);
  return match ? match.label : "7 Days";
}

// Kept in sync with task statuses (src/lib/tasks.js) which are server-only.
export const PROMISE_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Blocked",
  "Cancelled",
];

export function normalizePromiseStatus(value) {
  const normalized = String(value || "").trim();
  const match = PROMISE_STATUSES.find(
    (status) => status.toLowerCase() === normalized.toLowerCase()
  );
  return match || "Pending";
}
