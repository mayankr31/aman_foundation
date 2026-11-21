// One-time migration to page-level permissions.
//
// Run with:  node prisma/seed-permissions.js
//
// What it does (idempotent):
//   1. Creates READ/WRITE permission rows for every individual page.
//   2. Expands existing `education`, `livelihood` and `fellow-observations`
//      role grants onto their child pages, so nobody loses access.
//   3. Expands existing per-user overrides on those collections onto the child
//      pages, preserving GRANT/DENY.
//   4. Removes the old collection permission rows (and stale `hr` rows).
//
// No Prisma schema change is required, so no migration/db push is needed.

import { prisma } from "../src/lib/prisma.js";
import {
  EDITABLE_PAGE_KEYS,
  COLLECTION_PAGES,
} from "../src/lib/permissionCatalog.js";

const EXTRA_PAGES = ["dashboard", "self-attendance", "task-analytics"];
const ACTIONS = ["READ", "WRITE"];
const COLLECTION_KEYS = Object.keys(COLLECTION_PAGES);
const STALE_PAGES = ["hr"];

async function upsertPermission(permissionByKey, page, action) {
  const perm = await prisma.permission.upsert({
    where: { app_page_action: { app: "dashboard", page, action } },
    update: {},
    create: { app: "dashboard", page, action },
  });
  permissionByKey[`${page}:${action}`] = perm;
  return perm;
}

async function main() {
  console.log("Migrating permissions to individual pages...");

  // 1. Ensure every individual page has READ/WRITE permission rows.
  const permissionByKey = {};
  for (const page of [...EXTRA_PAGES, ...EDITABLE_PAGE_KEYS]) {
    for (const action of ACTIONS) {
      await upsertPermission(permissionByKey, page, action);
    }
  }
  console.log(`Ensured ${Object.keys(permissionByKey).length} page/action rows.`);

  // 2. Expand collection role grants onto child pages.
  const collectionPermissions = await prisma.permission.findMany({
    where: { page: { in: COLLECTION_KEYS } },
    select: { id: true, page: true, action: true },
  });

  if (collectionPermissions.length > 0) {
    const collectionIds = collectionPermissions.map((p) => p.id);
    const roleGrants = await prisma.rolePermission.findMany({
      where: { permissionId: { in: collectionIds } },
      include: { permission: true },
    });

    let expandedRoleGrants = 0;
    for (const grant of roleGrants) {
      const { page, action } = grant.permission;
      const children = COLLECTION_PAGES[page] || [];
      const actionsToGrant = action === "WRITE" ? ["READ", "WRITE"] : ["READ"];

      for (const child of children) {
        for (const childAction of actionsToGrant) {
          const childPerm = permissionByKey[`${child}:${childAction}`];
          if (!childPerm) continue;
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: grant.roleId,
                permissionId: childPerm.id,
              },
            },
            update: {},
            create: { roleId: grant.roleId, permissionId: childPerm.id },
          });
          expandedRoleGrants += 1;
        }
      }
    }
    console.log(`Expanded ${expandedRoleGrants} role page grants.`);

    // 3. Expand per-user overrides onto child pages.
    const userOverrides = await prisma.userPermission.findMany({
      where: { permissionId: { in: collectionIds } },
      include: { permission: true },
    });

    let expandedUserOverrides = 0;
    for (const override of userOverrides) {
      const { page, action } = override.permission;
      const children = COLLECTION_PAGES[page] || [];
      const actionsToCopy =
        override.type === "GRANT" && action === "WRITE"
          ? ["READ", "WRITE"]
          : [action];

      for (const child of children) {
        for (const childAction of actionsToCopy) {
          const childPerm = permissionByKey[`${child}:${childAction}`];
          if (!childPerm) continue;
          await prisma.userPermission.upsert({
            where: {
              userId_permissionId: {
                userId: override.userId,
                permissionId: childPerm.id,
              },
            },
            update: { type: override.type },
            create: {
              userId: override.userId,
              permissionId: childPerm.id,
              type: override.type,
            },
          });
          expandedUserOverrides += 1;
        }
      }
    }
    console.log(`Expanded ${expandedUserOverrides} user overrides.`);

    // 4. Remove the old collection grants and permission rows.
    await prisma.rolePermission.deleteMany({
      where: { permissionId: { in: collectionIds } },
    });
    await prisma.userPermission.deleteMany({
      where: { permissionId: { in: collectionIds } },
    });
    await prisma.permission.deleteMany({
      where: { id: { in: collectionIds } },
    });
    console.log(
      `Removed legacy collection permissions: ${COLLECTION_KEYS.join(", ")}.`
    );
  } else {
    console.log("No legacy collection permissions found.");
  }

  // 5. Clean up stale permission rows that are not real pages.
  const stalePermissions = await prisma.permission.findMany({
    where: { page: { in: STALE_PAGES } },
    select: { id: true },
  });
  if (stalePermissions.length > 0) {
    const staleIds = stalePermissions.map((p) => p.id);
    await prisma.rolePermission.deleteMany({
      where: { permissionId: { in: staleIds } },
    });
    await prisma.userPermission.deleteMany({
      where: { permissionId: { in: staleIds } },
    });
    await prisma.permission.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`Removed stale permission pages: ${STALE_PAGES.join(", ")}.`);
  }

  console.log("Page-level permission migration completed.");
}

main()
  .catch((error) => {
    console.error("Permission migration error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
