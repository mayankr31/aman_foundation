// Reporting-line role hierarchy.
// Higher rank = more senior. A user may only report to a role with a higher
// rank than their own. Fellows are at the bottom, so nobody reports to them.

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

export function getRoleRank(roleName) {
  const index = REPORTING_CHAIN.indexOf(roleName);
  return index === -1 ? null : index;
}

/**
 * True when `managerRoleName` is a valid reporting role for `targetRoleName`.
 * Roles outside the chain (HR, Accountant, custom roles) report to the
 * Executive Director (ADMIN). ADMIN itself has nobody above it.
 */
export function isManagerRoleAllowed(targetRoleName, managerRoleName) {
  if (!targetRoleName || !managerRoleName) return false;
  if (targetRoleName === "ADMIN") return false;

  const targetRank = getRoleRank(targetRoleName);
  if (targetRank === null) return managerRoleName === "ADMIN";

  const managerRank = getRoleRank(managerRoleName);
  return managerRank !== null && managerRank > targetRank;
}

/** Filters a user list down to valid manager options for the target role. */
export function getManagerCandidates(
  users,
  targetRoleName,
  { excludeUserId, activeOnly = true } = {}
) {
  return (users || []).filter((user) => {
    if (!user) return false;
    if (excludeUserId && user.id === excludeUserId) return false;
    if (activeOnly && user.status && user.status !== "ACTIVE") return false;
    const roleName = user.role?.name || user.roleName;
    return isManagerRoleAllowed(targetRoleName, roleName);
  });
}
