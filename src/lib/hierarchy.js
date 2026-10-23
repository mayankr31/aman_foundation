import { prisma } from "@/lib/prisma";
import { PROGRAM_ROLES, getManagedTeamUserIds } from "@/lib/scope";

/** Roles that participate in reporting-line based HR visibility. */
export const HIERARCHY_ROLES = [
  "FELLOW",
  "PROGRAM_COORDINATOR",
  "PROGRAM_MANAGER",
  "PROGRAM_LEAD",
  "PROGRAM_DIRECTOR",
];

/**
 * Returns every user below `managerId` in the Reports To chain, breadth-first.
 * Includes inactive users only when `activeOnly` is false.
 */
export async function getSubordinateUserIds(managerId, { includeSelf = false, activeOnly = true } = {}) {
  if (!managerId) return includeSelf ? [] : [];

  const result = new Set(includeSelf ? [managerId] : []);
  let frontier = [managerId];

  while (frontier.length) {
    const rows = await prisma.user.findMany({
      where: {
        managerId: { in: frontier },
        ...(activeOnly ? { status: "ACTIVE" } : {}),
      },
      select: { id: true },
    });
    const next = [];
    for (const row of rows) {
      if (!result.has(row.id)) {
        result.add(row.id);
        next.push(row.id);
      }
    }
    frontier = next;
  }

  return [...result];
}

/** Returns the Reports To chain above a user (nearest manager first). */
export async function getAncestorUserIds(userId) {
  if (!userId) return [];
  const result = [];
  let currentId = userId;

  for (let depth = 0; depth < 20; depth += 1) {
    const user = await prisma.user.findUnique({
      where: { id: currentId },
      select: { managerId: true },
    });
    if (!user?.managerId || result.includes(user.managerId)) break;
    result.push(user.managerId);
    currentId = user.managerId;
  }

  return result;
}

/** True if `targetUserId` is somewhere below `managerId`. */
export async function isSubordinate(managerId, targetUserId) {
  if (!managerId || !targetUserId || managerId === targetUserId) return false;
  const ids = await getSubordinateUserIds(managerId);
  return ids.includes(targetUserId);
}

/**
 * Resolves the set of user IDs a program-staff member may view in HR pages.
 * Prefers the explicit Reports To tree. If the tree is empty (nobody has been
 * configured below this user yet) it falls back to the existing school/centre
 * assignment scope so current data remains visible.
 */
export async function getHierarchyScopedUserIds(user, { includeSelf = true, allowFallback = true } = {}) {
  if (!user?.id) return [];
  if (user.role?.name === "ADMIN" || user.role?.name === "HR") return null; // null = unrestricted

  if (!PROGRAM_ROLES.includes(user.role?.name)) {
    return includeSelf ? [user.id] : [];
  }

  const ids = await getSubordinateUserIds(user.id, { includeSelf });
  if (ids.length > (includeSelf ? 1 : 0)) return ids;

  if (allowFallback) {
    const team = await getManagedTeamUserIds(user.id);
    const merged = new Set(includeSelf ? [user.id, ...team] : team);
    // A manager should never see an assignment-scope peer as their own report;
    // this fallback only applies while no explicit reports are configured.
    return [...merged];
  }

  return ids;
}

/** Ensures a manager cannot view/approve someone outside their tree. */
export async function canAccessUser(actor, targetUserId, { allowSelf = true } = {}) {
  if (!actor?.id || !targetUserId) return false;
  if (actor.id === targetUserId) return allowSelf;
  if (actor.role?.name === "ADMIN" || actor.role?.name === "HR") return true;
  if (!PROGRAM_ROLES.includes(actor.role?.name)) return false;

  if (await isSubordinate(actor.id, targetUserId)) return true;

  // Legacy fallback while reporting lines are being configured.
  const directReports = await prisma.user.count({ where: { managerId: actor.id } });
  if (directReports === 0) {
    const team = await getManagedTeamUserIds(actor.id);
    return team.includes(targetUserId);
  }
  return false;
}
