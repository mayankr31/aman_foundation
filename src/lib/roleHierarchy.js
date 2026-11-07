// Reporting-line role hierarchy.
// Higher rank = more senior. A user may only report to a role with a higher
// rank than their own. Fellows are at the bottom, so nobody reports to them.

/** Default seniority for the built-in roles. */
export const ROLE_RANKS = {
  FELLOW: 10,
  CLASS_ASSISTANT: 20,
  FIELD_EXECUTIVE: 30,
  PROGRAM_COORDINATOR: 40,
  PROGRAM_MANAGER: 50,
  PROGRAM_LEAD: 60,
  PROGRAM_DIRECTOR: 70,
  ADMIN: 1000,
};

/** Custom roles (and non-chain roles like HR) fall back to this rank. */
export const DEFAULT_CUSTOM_ROLE_RANK = 10;

/** Ordered list of the built-in reporting chain (lowest to highest). */
export const REPORTING_CHAIN = [
  "FELLOW",
  "CLASS_ASSISTANT",
  "FIELD_EXECUTIVE",
  "PROGRAM_COORDINATOR",
  "PROGRAM_MANAGER",
  "PROGRAM_LEAD",
  "PROGRAM_DIRECTOR",
  "ADMIN",
];

function roleNameOf(role) {
  if (!role) return "";
  if (typeof role === "object") return String(role.name || "").trim();
  return String(role).trim();
}

/**
 * Resolves the seniority rank for a role object or role name.
 * A role's stored `rank` always wins; built-in roles fall back to ROLE_RANKS.
 */
export function getRoleRank(role) {
  if (role && typeof role === "object" && Number.isFinite(role.rank)) {
    return role.rank;
  }
  const name = roleNameOf(role);
  if (!name) return null;
  if (ROLE_RANKS[name] !== undefined) return ROLE_RANKS[name];
  return DEFAULT_CUSTOM_ROLE_RANK;
}

/**
 * True when `managerRole` is a valid reporting role for `targetRole`.
 * Both arguments may be role objects ({ name, rank }) or role name strings.
 *  - ADMIN sits at the top and never reports to anyone.
 *  - ADMIN can manage every other role.
 *  - FELLOW can never be a manager.
 *  - Everyone else may report to a strictly more senior role.
 */
export function isManagerRoleAllowed(targetRole, managerRole) {
  const targetName = roleNameOf(targetRole);
  const managerName = roleNameOf(managerRole);
  if (!targetName || !managerName) return false;
  if (targetName === "ADMIN") return false;
  if (managerName === "ADMIN") return true;
  if (managerName === "FELLOW") return false;

  const targetRank = getRoleRank(targetRole);
  const managerRank = getRoleRank(managerRole);
  if (targetRank === null || managerRank === null) return false;

  return managerRank > targetRank;
}

/** Filters a user list down to valid manager options for the target role. */
export function getManagerCandidates(
  users,
  targetRole,
  { excludeUserId, activeOnly = true } = {}
) {
  return (users || []).filter((user) => {
    if (!user) return false;
    if (excludeUserId && user.id === excludeUserId) return false;
    if (activeOnly && user.status && user.status !== "ACTIVE") return false;
    return isManagerRoleAllowed(targetRole, user.role || user.roleName);
  });
}
