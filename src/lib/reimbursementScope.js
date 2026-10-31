import { prisma } from "@/lib/prisma";
import { getManagedLivelihoodProgramIds, getManagedTeamUserIds } from "@/lib/scope";
import { getSubordinateUserIds } from "@/lib/hierarchy";

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

export function isReimbursementAdmin(user) {
  return user?.role?.name === "ADMIN";
}

export function isReimbursementAccountant(user) {
  return user?.role?.name === "ACCOUNTANT";
}

/**
 * Users a manager can review claims for. Prefers the explicit Reports To tree
 * and falls back to the legacy managed-team scope while reporting lines are
 * still being configured.
 */
export async function getReimbursementReviewUserIds(userId) {
  if (!userId) return [];
  const reports = await getSubordinateUserIds(userId);
  if (reports.length) return reports;
  return getManagedFellowUserIds(userId);
}

/** Where-clause for the reimbursement management queue. */
export async function getReimbursementManagementWhere(user) {
  if (isReimbursementAdmin(user) || isReimbursementAccountant(user)) return {};

  const managedUserIds = await getReimbursementReviewUserIds(user?.id);
  return { userId: { in: managedUserIds } };
}

/**
 * Verification is allowed for admins, accountants and managers acting for
 * someone in their reporting line. Nobody can verify their own claim.
 */
export async function canManageReimbursementForUser(managerUser, claimantUserId) {
  if (!managerUser?.id || !claimantUserId) return false;
  if (managerUser.id === claimantUserId) return false;
  if (isReimbursementAdmin(managerUser) || isReimbursementAccountant(managerUser)) {
    return true;
  }

  const managedUserIds = await getReimbursementReviewUserIds(managerUser.id);
  return managedUserIds.includes(claimantUserId);
}

/** Only the Executive Director (ADMIN) may approve or reject a verified claim. */
export function canApproveVerifiedReimbursement(user) {
  return isReimbursementAdmin(user);
}

/** ADMIN or ACCOUNTANT may record payment for an approved claim. */
export function canReimburseApprovedReimbursement(user) {
  return isReimbursementAdmin(user) || isReimbursementAccountant(user);
}
