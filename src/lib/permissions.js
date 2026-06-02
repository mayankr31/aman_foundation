import { prisma } from "@/lib/prisma";

/**
 * Checks if a user has permission to perform an action on a specific app and page.
 * Permissions are fetched directly from the database to ensure they are up to date.
 * WRITE permission automatically grants READ permission.
 *
 * User override permissions take priority over role permissions:
 * - If user has ANY UserPermission for the page, user permissions are the source of truth
 * - If user has DENY UserPermission, access is denied regardless of role
 * - If user has GRANT UserPermission, access is allowed based on the action
 * - If no UserPermission exists, fall back to RolePermission
 *
 * @param {Object} user - The user object containing id and roleId
 * @param {string} app - The application name
 * @param {string} page - The page name
 * @param {"READ" | "WRITE"} action - The requested action
 * @returns {Promise<boolean>}
 */
export async function checkPermission(user, app, page, action) {
  if (!user || !user.id || !user.roleId) {
    return false;
  }

  try {
    // 1. Fetch User Override Permissions first (they take priority)
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId: user.id,
        permission: {
          app,
          page,
        },
      },
      include: {
        permission: true,
      },
    });

    // 2. If user has explicit user permissions, use them exclusively
    if (userPermissions.length > 0) {
      const hasDeny = userPermissions.some(up => up.type === 'DENY');
      if (hasDeny) return false;

      const hasExact = userPermissions.some(up => up.permission.action === action);
      if (hasExact) return true;

      if (action === 'READ') {
        const hasWrite = userPermissions.some(up => up.permission.action === 'WRITE');
        if (hasWrite) return true;
      }

      return false;
    }

    // 3. No user permissions override → fall back to role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: user.roleId,
        permission: {
          app,
          page,
        },
      },
      include: {
        permission: true,
      },
    });

    const rolePerms = rolePermissions.map(rp => rp.permission);

    const hasExact = rolePerms.some(p => p.action === action);
    if (hasExact) return true;

    if (action === 'READ') {
      const hasWrite = rolePerms.some(p => p.action === 'WRITE');
      if (hasWrite) return true;
    }

    return false;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}
