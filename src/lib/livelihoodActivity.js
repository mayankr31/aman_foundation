import { prisma } from "@/lib/prisma";
import {
  getFellowIdByUserId,
  isAdmin,
  isLivelihoodProgramAssignedToFellow,
  isLivelihoodProgramManaged,
} from "@/lib/scope";
import { isProgramStaffRole } from "@/lib/roles";

export {
  activityNotificationLink,
  getCurrentMonthKey,
  getMonthBounds,
  isOpenActivityStatus,
  isValidActivityStatus,
  isValidMonthKey,
  LIVELIHOOD_ACTIVITY_STATUSES,
  LIVELIHOOD_ACTIVITY_STATUS_TONES,
  parseActivityDate,
} from "@/lib/livelihoodActivityShared";

/**
 * Resolves whether a user may see a livelihood program and whether they can
 * manage its monthly plan. Mirrors the access rules used by the program
 * detail route: admins, assigned program staff and assigned fellows.
 */
export async function getLivelihoodProgramAccess(user, programId) {
  const base = { allowed: false, isAdmin: false, isManager: false, isFellow: false };
  if (!user?.id || !programId) return base;

  if (isAdmin(user)) {
    return { allowed: true, isAdmin: true, isManager: false, isFellow: false };
  }

  if (isProgramStaffRole(user?.role?.name)) {
    const isManager = await isLivelihoodProgramManaged(user.id, programId);
    return { allowed: isManager, isAdmin: false, isManager, isFellow: false };
  }

  if (user?.role?.name === "FELLOW") {
    const fellowId = await getFellowIdByUserId(user.id);
    const isFellow = await isLivelihoodProgramAssignedToFellow(fellowId, programId);
    return { allowed: isFellow, isAdmin: false, isManager: false, isFellow };
  }

  return base;
}

/** Every user attached to a program: assigned staff + assigned fellows. */
export async function getLivelihoodProgramMemberUserIds(programId) {
  if (!programId) return [];

  const [managers, fellows] = await Promise.all([
    prisma.programManagerLivelihoodProgram.findMany({
      where: { programId },
      select: { userId: true },
    }),
    prisma.fellowLivelihoodProgram.findMany({
      where: { programId },
      select: { fellow: { select: { userId: true } } },
    }),
  ]);

  return [
    ...new Set([
      ...managers.map((row) => row.userId).filter(Boolean),
      ...fellows.map((row) => row.fellow?.userId).filter(Boolean),
    ]),
  ];
}
