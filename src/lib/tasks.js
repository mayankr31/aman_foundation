import { prisma } from "@/lib/prisma";
import { canAssignPerson } from "@/lib/hierarchy";
import { getISTDateKey, istDayEnd, istDayStart } from "@/lib/time";
import { formatDate } from "@/lib/date";
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
 * Managers may assign people in their reporting tree, and any Fellow.
 */
export async function canAssignTo(actor, assigneeId) {
  return canAssignPerson(actor, assigneeId, { allowSelf: true });
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

/**
 * Creates one deduplicated reminder per overdue task for the given assignee.
 * Runs on notification fetch (same lazy pattern as birthday notifications).
 */
export async function ensureOverdueTaskNotifications(userId) {
  if (!userId) return;

  try {
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { notIn: ["Completed", "Cancelled"] },
        deadline: { lt: now },
      },
      select: { id: true, title: true, deadline: true },
      orderBy: { deadline: "asc" },
      take: 50,
    });
    if (!tasks.length) return;

    await prisma.notification.createMany({
      data: tasks.map((task) => ({
        userId,
        type: NOTIFICATION_TYPES.TASK_OVERDUE,
        title: "Task overdue",
        message: `"${task.title}" was due on ${formatDate(task.deadline)} and is still open.`,
        link: `/tasks?task=${task.id}`,
        metadata: { taskId: task.id },
        dedupeKey: `task-overdue:${task.id}:${userId}`,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Overdue task notification sweep error:", error);
  }
}

export { NOTIFICATION_TYPES };
