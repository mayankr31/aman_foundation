import { prisma } from "@/lib/prisma";
import { getReportingScopeUserIds } from "@/lib/hierarchy";

export const ASSET_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  employeeId: true,
  department: true,
  role: { select: { name: true, displayName: true, rank: true } },
};

export const ASSET_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
  assignments: {
    orderBy: { assignedAt: "desc" },
    include: {
      user: { select: ASSET_USER_SELECT },
      assignedBy: { select: { id: true, name: true } },
    },
  },
};

/** Read-only employees only need their current holder, not other people's history. */
export function getAssetInclude({ currentOnly = false } = {}) {
  if (!currentOnly) return ASSET_INCLUDE;
  return {
    createdBy: { select: { id: true, name: true } },
    assignments: {
      where: { returnedAt: null },
      orderBy: { assignedAt: "desc" },
      include: {
        user: { select: ASSET_USER_SELECT },
        assignedBy: { select: { id: true, name: true } },
      },
    },
  };
}

export function normalizeAssetCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function activeAssignment(asset) {
  return (asset?.assignments || []).find((assignment) => !assignment.returnedAt) || null;
}

/** Adds the derived Assigned / Returned status to an API asset response. */
export function decorateAsset(asset) {
  if (!asset) return asset;
  return {
    ...asset,
    status: activeAssignment(asset) ? "ASSIGNED" : "RETURNED",
  };
}

export function assetStatusCondition(status) {
  if (status === "ASSIGNED") {
    return { assignments: { some: { returnedAt: null } } };
  }
  if (status === "RETURNED") {
    return { assignments: { none: { returnedAt: null } } };
  }
  return null;
}

/** Admin and HR can see everything; managers use their reporting tree. */
export async function getAssetReadScope(actor) {
  return getReportingScopeUserIds(actor, { includeSelf: false, activeOnly: false });
}

/**
 * Admin/HR may assign to anyone except themselves. Managers may assign only
 * down their reporting tree. Target activation is validated by the API.
 */
export async function canAssignAssetTo(actor, targetUserId) {
  if (!actor?.id || !targetUserId) return false;
  if (targetUserId === actor.id) return false;
  if (actor.role?.name === "ADMIN" || actor.role?.name === "HR") return true;

  const scope = await getReportingScopeUserIds(actor, {
    includeSelf: false,
    activeOnly: true,
  });
  return Array.isArray(scope) && scope.includes(targetUserId);
}

/**
 * Write access for an existing asset. A manager can manage assets they
 * created, or assets currently held by someone in their reporting tree.
 */
export async function canManageAsset(actor, asset) {
  if (!actor?.id || !asset) return false;
  if (actor.role?.name === "ADMIN" || actor.role?.name === "HR") return true;
  if (asset.createdById === actor.id) return true;

  const current = activeAssignment(asset);
  if (!current?.userId) return false;
  const scope = await getReportingScopeUserIds(actor, {
    includeSelf: false,
    activeOnly: false,
  });
  return Array.isArray(scope) && scope.includes(current.userId);
}

export function canViewAsset(actor, asset, readScope) {
  if (!actor?.id || !asset) return false;
  if (readScope === null) return true;
  if (asset.createdById === actor.id) return true;

  const current = activeAssignment(asset);
  if (current?.userId === actor.id) return true;
  return Boolean(current?.userId && (readScope || []).includes(current.userId));
}

/** Users a manager/admin can pick in the assignee dropdown. */
export async function getAssignableAssetUsers(actor) {
  if (!actor?.id) return [];
  if (actor.role?.name === "ADMIN" || actor.role?.name === "HR") {
    return prisma.user.findMany({
      where: { status: "ACTIVE", id: { not: actor.id } },
      select: ASSET_USER_SELECT,
      orderBy: { name: "asc" },
    });
  }

  const ids = await getReportingScopeUserIds(actor, {
    includeSelf: false,
    activeOnly: true,
  });
  if (!Array.isArray(ids) || !ids.length) return [];

  return prisma.user.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: ASSET_USER_SELECT,
    orderBy: { name: "asc" },
  });
}

export function buildAssetWhere(actor, scope, readScope) {
  if (scope === "mine") {
    return { assignments: { some: { userId: actor.id, returnedAt: null } } };
  }

  if (scope === "all") {
    if (readScope === null) return {};
    if (Array.isArray(readScope)) {
      return { id: { in: [] } };
    }
  }

  if (readScope === null) return {};

  const ids = readScope || [];
  if (!ids.length) return { id: { in: [] } };

  return {
    OR: [
      { assignments: { some: { userId: { in: ids }, returnedAt: null } } },
      { createdById: actor.id },
    ],
  };
}
