import { prisma } from "@/lib/prisma";
import { canAccessUser } from "@/lib/hierarchy";
import { PROGRAM_ROLES } from "@/lib/scope";
import { getISTDateKey, istDayEnd, istDayStart } from "@/lib/time";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";

export const TASK_STATUSES = ["Pending", "In Progress", "Completed", "Blocked", "Cancelled"];
export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

/**
 * Institution ids a user is connected to. Fellows use their FellowSchool /
 * FellowAfterSchoolCentre / FellowLivelihoodProgram rows; program staff use the
 * ProgramManager* assignment rows.
 */
export async function getInstitutionScope(userId) {
  if (!userId) return { schoolIds: [], centreIds: [], programIds: [] };

  const [fellow, pmSchools, pmCentres, pmPrograms] = await Promise.all([
    prisma.fellow.findUnique({
      where: { userId },
      select: {
        schools: { select: { schoolId: true } },
        afterSchoolCentres: { select: { centreId: true } },
        livelihoodPrograms: { select: { programId: true } },
      },
    }),
    prisma.programManagerSchool.findMany({ where: { userId }, select: { schoolId: true } }),
    prisma.programManagerAfterSchoolCentre.findMany({ where: { userId }, select: { centreId: true } }),
    prisma.programManagerLivelihoodProgram.findMany({ where: { userId }, select: { programId: true } }),
  ]);

  return {
    schoolIds: [
      ...new Set([
        ...(fellow?.schools || []).map((s) => s.schoolId),
        ...pmSchools.map((s) => s.schoolId),
      ]),
    ],
    centreIds: [
      ...new Set([
        ...(fellow?.afterSchoolCentres || []).map((c) => c.centreId),
        ...pmCentres.map((c) => c.centreId),
      ]),
    ],
    programIds: [
      ...new Set([
        ...(fellow?.livelihoodPrograms || []).map((p) => p.programId),
        ...pmPrograms.map((p) => p.programId),
      ]),
    ],
  };
}

export function hasInstitutionOverlap(a, b) {
  if (!a || !b) return false;
  return (
    a.schoolIds.some((id) => b.schoolIds.includes(id)) ||
    a.centreIds.some((id) => b.centreIds.includes(id)) ||
    a.programIds.some((id) => b.programIds.includes(id))
  );
}

/**
 * A user may create their own task freely. Admin may assign to anyone.
 * Program staff may assign to a subordinate in the Reports To tree, with the
 * same school/centre/program scope. When reporting lines are not configured,
 * the existing managed-team fallback is used.
 */
export async function canAssignTo(actor, assigneeId) {
  if (!actor?.id || !assigneeId) return false;
  if (actor.id === assigneeId) return true;
  if (actor.role?.name === "ADMIN") return true;
  if (!PROGRAM_ROLES.includes(actor.role?.name)) return false;

  const allowed = await canAccessUser(actor, assigneeId, { allowSelf: true });
  if (!allowed) return false;

  const [actorScope, assigneeScope] = await Promise.all([
    getInstitutionScope(actor.id),
    getInstitutionScope(assigneeId),
  ]);
  return hasInstitutionOverlap(actorScope, assigneeScope);
}

/** Date range helpers for task lists. */
export function parseDateRange(searchParams) {
  const month = searchParams.get("month");
  const date = searchParams.get("date");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, m] = month.split("-").map(Number);
    const start = istDayStart(`${year}-${String(m).padStart(2, "0")}-01`);
    const end = istDayEnd(new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10));
    return { start, end, month };
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { start: istDayStart(date), end: istDayEnd(date), date };
  }
  return {};
}

/** Tasks shown in the attendance modal for a specific user and IST date. */
export function dailyTaskWhere(userId, dateKey = getISTDateKey()) {
  const start = istDayStart(dateKey);
  const end = istDayEnd(dateKey);
  return {
    assigneeId: userId,
    OR: [
      { plannedDate: { gte: start, lte: end } },
      { deadline: { gte: start, lte: end } },
      { plannedDate: { lt: start }, status: { notIn: ["Completed", "Cancelled"] } },
      { deadline: { lt: start }, status: { notIn: ["Completed", "Cancelled"] } },
    ],
  };
}

export async function notifyTaskEvent(userIds, payload) {
  await notifyUsers(userIds, payload);
}

export { NOTIFICATION_TYPES };
