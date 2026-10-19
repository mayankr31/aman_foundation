import { prisma } from "@/lib/prisma";
import { getManagedLivelihoodProgramIds, getManagedTeamUserIds } from "@/lib/scope";

/**
 * User ids of fellows managed by a program manager through schools, centres or
 * livelihood programs.
 */
export async function getManagedFellowUserIds(userId) {
  const [teamIds, programIds] = await Promise.all([
    getManagedTeamUserIds(userId),
    getManagedLivelihoodProgramIds(userId),
  ]);

  const ids = new Set(teamIds);
  if (programIds.length) {
    const rows = await prisma.fellowLivelihoodProgram.findMany({
      where: {
        programId: { in: programIds },
        fellow: { userId: { not: null } },
      },
      select: { fellow: { select: { userId: true } } },
    });
    for (const row of rows) {
      if (row.fellow?.userId) ids.add(row.fellow.userId);
    }
  }

  return [...ids];
}

/** Where-clause for the reimbursement management queue. */
export async function getReimbursementManagementWhere(user) {
  if (user?.role?.name === "ADMIN") return {};
  if (user?.role?.name === "PROGRAM_MANAGER") {
    const managedUserIds = await getManagedFellowUserIds(user.id);
    return { userId: { in: managedUserIds } };
  }
  // Any other role with management permission can see the full queue.
  return {};
}

/**
 * Approval/payment is allowed for admins, for program managers on behalf of
 * the fellows they manage, and for other explicitly granted roles. Nobody can
 * approve their own claim.
 */
export async function canManageReimbursementForUser(managerUser, claimantUserId) {
  if (!managerUser?.id || !claimantUserId) return false;
  if (managerUser.id === claimantUserId) return false;
  if (managerUser.role?.name === "ADMIN") return true;

  if (managerUser.role?.name === "PROGRAM_MANAGER") {
    const managedUserIds = await getManagedFellowUserIds(managerUser.id);
    return managedUserIds.includes(claimantUserId);
  }

  return true;
}
