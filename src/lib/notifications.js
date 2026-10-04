import { prisma } from "@/lib/prisma";
import { PROGRAM_ROLES } from "@/lib/scope";

export const NOTIFICATION_TYPES = {
  GOAL_SHEET_SUBMITTED: "GOAL_SHEET_SUBMITTED",
  GOAL_SHEET_REVIEWED: "GOAL_SHEET_REVIEWED",
  COACHING_ADDED: "COACHING_ADDED",
  FEEDBACK_ADDED: "FEEDBACK_ADDED",
  ENGAGEMENT_SURVEY_SUBMITTED: "ENGAGEMENT_SURVEY_SUBMITTED",
  LOOK_BEYOND_SUBMITTED: "LOOK_BEYOND_SUBMITTED",
  TRAVEL_REQUESTED: "TRAVEL_REQUESTED",
  TRAVEL_APPROVED: "TRAVEL_APPROVED",
  TRAVEL_REJECTED: "TRAVEL_REJECTED",
  TRAVEL_COMPLETED: "TRAVEL_COMPLETED",
  TRAVEL_EXPENSE_SUBMITTED: "TRAVEL_EXPENSE_SUBMITTED",
  LEAVE_REQUESTED: "LEAVE_REQUESTED",
  LEAVE_APPROVED: "LEAVE_APPROVED",
  LEAVE_REJECTED: "LEAVE_REJECTED",
};

/** All ACTIVE users whose role is ADMIN. Admins are global (not school scoped). */
export async function getAdminUserIds() {
  const admins = await prisma.user.findMany({
    where: { status: "ACTIVE", role: { name: "ADMIN" } },
    select: { id: true },
  });
  return admins.map((u) => u.id);
}

/**
 * Program staff (PROGRAM_MANAGER + the other program roles) who are assigned
 * to any school, after-school centre or livelihood program the fellow belongs to.
 */
export async function getProgramStaffForFellow(fellowId) {
  if (!fellowId) return [];

  const fellow = await prisma.fellow.findUnique({
    where: { id: fellowId },
    select: {
      schools: { select: { schoolId: true } },
      afterSchoolCentres: { select: { centreId: true } },
      livelihoodPrograms: { select: { programId: true } },
    },
  });
  if (!fellow) return [];

  const schoolIds = fellow.schools.map((s) => s.schoolId);
  const centreIds = fellow.afterSchoolCentres.map((c) => c.centreId);
  const programIds = fellow.livelihoodPrograms.map((p) => p.programId);

  if (!schoolIds.length && !centreIds.length && !programIds.length) return [];

  const [schoolRows, centreRows, programRows] = await Promise.all([
    schoolIds.length
      ? prisma.programManagerSchool.findMany({
          where: { schoolId: { in: schoolIds } },
          select: { userId: true },
        })
      : [],
    centreIds.length
      ? prisma.programManagerAfterSchoolCentre.findMany({
          where: { centreId: { in: centreIds } },
          select: { userId: true },
        })
      : [],
    programIds.length
      ? prisma.programManagerLivelihoodProgram.findMany({
          where: { programId: { in: programIds } },
          select: { userId: true },
        })
      : [],
  ]);

  const candidateUserIds = [...new Set([...schoolRows, ...centreRows, ...programRows].map((r) => r.userId))];
  if (!candidateUserIds.length) return [];

  const staff = await prisma.user.findMany({
    where: {
      id: { in: candidateUserIds },
      status: "ACTIVE",
      role: { name: { in: PROGRAM_ROLES } },
    },
    select: { id: true },
  });
  return staff.map((u) => u.id);
}

/** Admins + program staff assigned to the fellow's school/centre/program. */
export async function getReviewerUserIdsForFellow(fellowId) {
  const [admins, programStaff] = await Promise.all([
    getAdminUserIds(),
    getProgramStaffForFellow(fellowId),
  ]);
  return [...new Set([...admins, ...programStaff])];
}

export async function getFellowUserId(fellowId) {
  if (!fellowId) return null;
  const fellow = await prisma.fellow.findUnique({
    where: { id: fellowId },
    select: { userId: true },
  });
  return fellow?.userId || null;
}

/**
 * Creates one notification row per recipient. Deduplicates recipients and never
 * notifies the actor who triggered the event.
 */
export async function notifyUsers(
  userIds,
  { type, title, message, link = null, actorId = null, metadata = null }
) {
  const recipients = [...new Set((userIds || []).filter(Boolean))].filter((id) => id !== actorId);
  if (!recipients.length) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type,
      title,
      message,
      link,
      actorId,
      metadata: metadata ?? undefined,
    })),
  });
}
