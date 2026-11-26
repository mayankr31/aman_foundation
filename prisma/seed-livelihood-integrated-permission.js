// Adds the "Integrated Programs" page permission and carries existing
// livelihood access over to it. Idempotent — safe to run repeatedly.
//
// Run with:  node prisma/seed-livelihood-integrated-permission.js

import { prisma } from "../src/lib/prisma.js";

const PAGE = "livelihood-integrated";
// Pages whose existing access should carry over to the new page.
const SOURCE_PAGES = [
  "livelihood-hub",
  "livelihood-farm",
  "livelihood-non-farm",
  "participants",
];
const ACTIONS = ["READ", "WRITE"];

function addAccess(map, id, action) {
  const entry = map.get(id) || { read: false, write: false };
  if (action === "WRITE") {
    entry.write = true;
    entry.read = true;
  } else {
    entry.read = true;
  }
  map.set(id, entry);
}

async function main() {
  console.log("Ensuring Integrated Programs permission rows...");

  const permissionByAction = {};
  for (const action of ACTIONS) {
    permissionByAction[action] = await prisma.permission.upsert({
      where: { app_page_action: { app: "dashboard", page: PAGE, action } },
      update: {},
      create: { app: "dashboard", page: PAGE, action },
    });
  }

  const sourcePermissions = await prisma.permission.findMany({
    where: { app: "dashboard", page: { in: SOURCE_PAGES } },
    select: { id: true },
  });
  const sourceIds = sourcePermissions.map((permission) => permission.id);

  // Mirror role grants.
  const roleGrants = await prisma.rolePermission.findMany({
    where: { permissionId: { in: sourceIds } },
    include: { permission: true },
  });

  const roleAccess = new Map();
  for (const grant of roleGrants) {
    addAccess(roleAccess, grant.roleId, grant.permission.action);
  }

  let rolePermissionCount = 0;
  for (const [roleId, access] of roleAccess) {
    const actions = [];
    if (access.read) actions.push("READ");
    if (access.write) actions.push("WRITE");
    for (const action of actions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permissionByAction[action].id,
          },
        },
        update: {},
        create: { roleId, permissionId: permissionByAction[action].id },
      });
      rolePermissionCount += 1;
    }
  }
  console.log(`Mirrored ${rolePermissionCount} role permission(s).`);

  // Mirror per-user GRANT overrides. DENY overrides are left alone so admins
  // can decide explicitly for the new page.
  const userGrants = await prisma.userPermission.findMany({
    where: { permissionId: { in: sourceIds }, type: "GRANT" },
    include: { permission: true },
  });

  const userAccess = new Map();
  for (const grant of userGrants) {
    addAccess(userAccess, grant.userId, grant.permission.action);
  }

  let userPermissionCount = 0;
  for (const [userId, access] of userAccess) {
    const actions = [];
    if (access.read) actions.push("READ");
    if (access.write) actions.push("WRITE");
    for (const action of actions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permissionByAction[action].id,
          },
        },
        update: { type: "GRANT" },
        create: {
          userId,
          permissionId: permissionByAction[action].id,
          type: "GRANT",
        },
      });
      userPermissionCount += 1;
    }
  }
  console.log(`Mirrored ${userPermissionCount} user override(s).`);
  console.log("Integrated Programs permissions are ready.");
}

main()
  .catch((error) => {
    console.error("Seed integrated programs permission error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
