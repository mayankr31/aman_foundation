import { prisma } from "@/lib/prisma";
import { getAncestorUserIds } from "@/lib/hierarchy";
import { checkPermission } from "@/lib/permissions";
import { getAdminUserIds } from "@/lib/notifications";

/**
 * People who should be notified about a travel request: admins plus the
 * requester's reporting-line seniors who can access Travel Management.
 */
export async function getTravelReviewerUserIds(requesterId) {
  const [admins, ancestorIds] = await Promise.all([
    getAdminUserIds(),
    getAncestorUserIds(requesterId),
  ]);

  const candidates = (ancestorIds || []).filter((id) => !admins.includes(id));
  if (!candidates.length) return admins;

  const users = await prisma.user.findMany({
    where: { id: { in: candidates }, status: "ACTIVE" },
    include: { role: true },
  });

  const checks = await Promise.all(
    users.map((candidate) =>
      checkPermission(candidate, "dashboard", "travel-management", "READ")
    )
  );

  const reviewers = users.filter((_, index) => checks[index]).map((candidate) => candidate.id);
  return [...new Set([...admins, ...reviewers])];
}
