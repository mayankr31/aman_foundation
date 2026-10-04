import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { PAGE_KEYS, ROUTE_PERMISSION_MAP, getPageForPath } from "@/lib/routePermissions";

export { PAGE_KEYS, ROUTE_PERMISSION_MAP, getPageForPath };

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
        permission: { app, page },
      },
      include: { permission: true },
    });

    // 2. If user has explicit user permissions, use them exclusively
    if (userPermissions.length > 0) {
      const hasDeny = userPermissions.some((up) => up.type === "DENY");
      if (hasDeny) return false;

      const hasExact = userPermissions.some((up) => up.permission.action === action);
      if (hasExact) return true;

      if (action === "READ") {
        const hasWrite = userPermissions.some((up) => up.permission.action === "WRITE");
        if (hasWrite) return true;
      }

      return false;
    }

    // 3. No user permissions override → fall back to role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: user.roleId,
        permission: { app, page },
      },
      include: { permission: true },
    });

    const rolePerms = rolePermissions.map((rp) => rp.permission);

    const hasExact = rolePerms.some((p) => p.action === action);
    if (hasExact) return true;

    if (action === "READ") {
      const hasWrite = rolePerms.some((p) => p.action === "WRITE");
      if (hasWrite) return true;
    }

    return false;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

/**
 * Computes the full effective permission map for a user across all pages.
 * Returns { [page]: { read: boolean, write: boolean } }.
 */
export async function getEffectivePermissions(user) {
  const result = {};
  if (!user || !user.id || !user.roleId) return result;

  try {
    const [rolePerms, userPerms] = await Promise.all([
      prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      }),
      prisma.userPermission.findMany({
        where: { userId: user.id },
        include: { permission: true },
      }),
    ]);

    const apply = (page, action) => {
      if (!result[page]) result[page] = { read: false, write: false };
      if (action === "WRITE") {
        result[page].write = true;
        result[page].read = true;
      } else if (action === "READ") {
        result[page].read = true;
      }
    };

    for (const rp of rolePerms) {
      apply(rp.permission.page, rp.permission.action);
    }

    // User overrides: any page with a user permission row is governed solely
    // by those rows (DENY wins).
    const pagesWithOverrides = new Set(userPerms.map((up) => up.permission.page));
    for (const page of pagesWithOverrides) {
      result[page] = { read: false, write: false };
    }
    for (const up of userPerms) {
      if (up.type === "DENY") continue;
      apply(up.permission.page, up.permission.action);
    }

    return result;
  } catch (error) {
    console.error("Get effective permissions error:", error);
    return result;
  }
}

/**
 * Route helper: authenticates the request and enforces a page/action
 * permission. Returns { user, error } mirroring authenticateUser.
 */
export async function requirePermission(req, page, action = "READ") {
  const { user, error } = await authenticateUser(req);
  if (error) return { user: null, error };

  const allowed = await checkPermission(user, "dashboard", page, action);
  if (!allowed) {
    return {
      user: null,
      error: NextResponse.json(
        { error: `Forbidden: Missing ${action} permission for ${page}` },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
