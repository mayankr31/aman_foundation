import { getSubordinateUserIds } from "@/lib/hierarchy";
import { PROGRAM_ROLES, getManagedTeamUserIds } from "@/lib/scope";
import { istDayEnd, istDayStart } from "@/lib/time";

/**
 * Users whose tasks a person may see in team views / analytics.
 * - ADMIN: null (no restriction)
 * - Users with explicit Reports To children: self + whole subtree
 * - Program roles with no configured reports: legacy managed-team fallback
 * - Everyone else: self only
 */
export async function getTaskTeamUserIds(user, { includeSelf = true } = {}) {
  if (!user?.id) return includeSelf ? [] : [];
  if (user.role?.name === "ADMIN") return null;

  const ids = await getSubordinateUserIds(user.id, { includeSelf });
  if (ids.length > (includeSelf ? 1 : 0)) return ids;

  if (PROGRAM_ROLES.includes(user.role?.name)) {
    const team = await getManagedTeamUserIds(user.id);
    return [...new Set([...(includeSelf ? [user.id] : []), ...team])];
  }

  return ids;
}

/** True when `assigneeId` is the user or someone below them. */
export async function isTaskTeamMember(user, assigneeId) {
  if (!user?.id || !assigneeId) return false;
  if (user.role?.name === "ADMIN") return true;
  const ids = await getTaskTeamUserIds(user, { includeSelf: true });
  return Array.isArray(ids) && ids.includes(assigneeId);
}

/** Task-level read access: admin, assignee, assigner, or a manager of the assignee. */
export async function canViewTask(user, task) {
  if (!user?.id || !task) return false;
  if (user.role?.name === "ADMIN") return true;
  if (task.assigneeId === user.id || task.assignedById === user.id) return true;
  return isTaskTeamMember(user, task.assigneeId);
}

/**
 * Builds the Prisma `where` for task analytics scoped by reporting lines.
 * Non-admins see tasks assigned to themselves/their team, plus tasks they
 * assigned to anyone.
 */
export async function buildTaskAnalyticsWhere(user, { from, to, assigneeId } = {}) {
  const where = {};

  const teamIds = await getTaskTeamUserIds(user, { includeSelf: true });
  if (Array.isArray(teamIds)) {
    if (assigneeId) {
      if (!teamIds.includes(assigneeId)) {
        return { forbidden: true, where };
      }
      where.assigneeId = assigneeId;
    } else {
      where.OR = [{ assigneeId: { in: teamIds } }, { assignedById: user.id }];
    }
  } else if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = istDayStart(from);
    if (to) where.createdAt.lte = istDayEnd(to);
  }

  return { forbidden: false, where, teamIds };
}
