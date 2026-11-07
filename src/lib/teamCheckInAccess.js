import { prisma } from "@/lib/prisma";
import { getAdminUserIds } from "@/lib/notifications";
import { canRoleHaveTeamCheckIn } from "@/lib/teamCheckIn";

/**
 * Loads the minimum owner data needed to resolve check-in access.
 */
export async function getTeamCheckInOwner(ownerUserId) {
  if (!ownerUserId) return null;
  return prisma.user.findUnique({
    where: { id: ownerUserId },
    select: {
      id: true,
      name: true,
      managerId: true,
      avatar: true,
      role: { select: { name: true, displayName: true, rank: true } },
    },
  });
}

/**
 * Access rules:
 *  - the owner may read/create/edit their own check-ins
 *  - the Executive Director (ADMIN) may read/edit anyone's
 *  - the owner's direct reporting manager may read/edit their check-ins
 * No other ancestor or HR staff member gets access.
 */
export function resolveTeamCheckInAccess(actor, owner) {
  const isOwner = Boolean(actor?.id && owner?.id && actor.id === owner.id);
  const isAdmin = actor?.role?.name === "ADMIN";
  const isManager = Boolean(owner?.managerId && actor?.id === owner.managerId);
  const canView = isOwner || isAdmin || isManager;

  return {
    isOwner,
    isAdmin,
    isManager,
    canView,
    canEditMemberFields: canView,
    canEditManagerFields: isAdmin || isManager,
    canCreate: isOwner && canRoleHaveTeamCheckIn(owner?.role?.name),
  };
}

/** Executive Director(s) + the owner's direct reporting manager. */
export async function getTeamCheckInReviewerIds(ownerUserId) {
  const [admins, owner] = await Promise.all([
    getAdminUserIds(),
    ownerUserId
      ? prisma.user.findUnique({
          where: { id: ownerUserId },
          select: { managerId: true },
        })
      : null,
  ]);

  return [...new Set([...admins, owner?.managerId].filter(Boolean))];
}
