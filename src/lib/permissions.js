import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import {
  PAGE_KEYS,
  ROUTE_PERMISSION_MAP,
  getPageForPath,
  expandPageKeys,
} from "@/lib/routePermissions";
import { COLLECTION_PAGES } from "@/lib/permissionCatalog";

export { PAGE_KEYS, ROUTE_PERMISSION_MAP, getPageForPath };

/** Groups resolve to "allowed if any child page is allowed". */
function pagesForPermission(page) {
  return expandPageKeys(page);
}

function roleGrants(rolePerms, action) {
  if (rolePerms.some((p) => p.action === action)) return true;
  if (action === "READ" && rolePerms.some((p) => p.action === "WRITE")) return true;
  return false;
}

/**
 * Resolves one action using per-action overrides:
 *  - exact user override wins (GRANT allows, DENY blocks)
 *  - a WRITE grant implies READ
 *  - a READ deny also blocks WRITE
 *  - otherwise the role permission is inherited
 */
function resolveAction(action, userOverrides, rolePerms) {
  const readOverride = userOverrides.READ;
  const writeOverride = userOverrides.WRITE;

  // A denied READ makes the whole page action unreadable, including writing.
  if (readOverride === "DENY") return false;

  if (action === "READ") {
    if (readOverride === "GRANT" || writeOverride === "GRANT") return true;
    // A WRITE deny does not block READ; fall back to the role for READ.
    return roleGrants(rolePerms, "READ");
  }

  if (writeOverride === "DENY") return false;
  if (writeOverride === "GRANT") return true;
  // If the user can read but has no write override, inherit write from the role.
  return roleGrants(rolePerms, "WRITE");
}

/**
 * Checks if a user has permission to perform an action on a specific page.
 * User overrides are resolved per action rather than per page, so denying one
 * action no longer hides the whole page.
 */
export async function checkPermission(user, app, page, action) {
  if (!user || !user.id || !user.roleId) return false;

  // ADMIN is a true superadmin and bypasses all page/user overrides.
  if (user.role?.name === "ADMIN") return true;

  const pages = pagesForPermission(page);
  if (pages.length === 0) return false;

  try {
    const [userPermissions, rolePermissions] = await Promise.all([
      prisma.userPermission.findMany({
        where: { userId: user.id, permission: { app, page: { in: pages } } },
        include: { permission: true },
      }),
      prisma.rolePermission.findMany({
        where: { roleId: user.roleId, permission: { app, page: { in: pages } } },
        include: { permission: true },
      }),
    ]);

    const overridesByPage = {};
    for (const up of userPermissions) {
      const key = up.permission.page;
      if (!overridesByPage[key]) overridesByPage[key] = {};
      overridesByPage[key][up.permission.action] = up.type;
    }

    const rolePermsByPage = {};
    for (const rp of rolePermissions) {
      const key = rp.permission.page;
      if (!rolePermsByPage[key]) rolePermsByPage[key] = [];
      rolePermsByPage[key].push(rp.permission);
    }

    return pages.some((key) =>
      resolveAction(action, overridesByPage[key] || {}, rolePermsByPage[key] || [])
    );
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

/**
 * Adds the computed collection aggregates (education, livelihood,
 * fellow-observations) to an effective permission map. Aggregates are no
 * longer stored in the database; they are derived from their child pages.
 */
function addCollectionAggregates(result) {
  for (const [collection, children] of Object.entries(COLLECTION_PAGES)) {
    result[collection] = {
      read: children.some((child) => result[child]?.read),
      write: children.some((child) => result[child]?.write),
    };
  }
  return result;
}

/**
 * Computes the full effective permission map for a user across all pages.
 * Returns { [page]: { read: boolean, write: boolean } }.
 */
export async function getEffectivePermissions(user) {
  const result = {};
  if (!user || !user.id || !user.roleId) return result;

  try {
    // Admin bypasses overrides and always has every known page permission.
    if (user.role?.name === "ADMIN") {
      const allPermissions = await prisma.permission.findMany({
        select: { page: true },
      });
      const pages = new Set([...PAGE_KEYS, ...allPermissions.map((p) => p.page)]);
      for (const page of pages) {
        result[page] = { read: true, write: true };
      }
      return addCollectionAggregates(result);
    }

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

    const pages = new Set([
      ...rolePerms.map((rp) => rp.permission.page),
      ...userPerms.map((up) => up.permission.page),
    ]);

    const overridesByPage = {};
    for (const up of userPerms) {
      const page = up.permission.page;
      if (!overridesByPage[page]) overridesByPage[page] = {};
      overridesByPage[page][up.permission.action] = up.type;
    }

    for (const page of pages) {
      const pageRolePerms = rolePerms
        .filter((rp) => rp.permission.page === page)
        .map((rp) => rp.permission);
      const overrides = overridesByPage[page] || {};

      result[page] = {
        read: resolveAction("READ", overrides, pageRolePerms),
        write: resolveAction("WRITE", overrides, pageRolePerms),
      };
    }

    return addCollectionAggregates(result);
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
