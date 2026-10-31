import { prisma } from "../src/lib/prisma.js";

// Roles that behave like PROGRAM_MANAGER for now. Kept as a plain list so
// access can be tailored per-role/per-API later.
const PROGRAM_STAFF_ROLES = [
  "PROGRAM_MANAGER",
  "ACCOUNTANT",
  "PROGRAM_COORDINATOR",
  "FIELD_EXECUTIVE",
  "PROGRAM_DIRECTOR",
  "PROGRAM_LEAD",
  "CLASS_ASSISTANT",
];

const NEW_ROLES = [
  {
    name: "ACCOUNTANT",
    description: "Handles financial records, ledgers and reimbursements across programs",
  },
  {
    name: "PROGRAM_COORDINATOR",
    description: "Coordinates program delivery across assigned schools, centres and livelihood programs",
  },
  {
    name: "FIELD_EXECUTIVE",
    description: "Field-level execution and data collection for assigned schools and programs",
  },
  {
    name: "PROGRAM_DIRECTOR",
    description: "Directs program strategy and oversees assigned program portfolio",
  },
  {
    name: "PROGRAM_LEAD",
    description: "Leads a program vertical and supervises assigned schools/centres/programs",
  },
  {
    name: "CLASS_ASSISTANT",
    description: "Assists classroom delivery and student tracking in assigned schools",
  },
];

// Granular page keys used by the permission system. `app` is always
// "dashboard" (legacy convention), the `page` string is what matters.
const ALL_PAGES = [
  "dashboard",
  "education",
  "fellow-observations",
  "livelihood",
  "disaster-relief",
  "employees",
  "leaves",
  "travel",
  "travel-management",
  "reimbursements",
  "reimbursement-management",
  "attendance",
  "self-attendance",
  "tasks",
  "task-analytics",
  "assets",
  "admin",
];

const ACTIONS = ["READ", "WRITE"];

// Per-role page grants.
const ROLE_PAGES = {
  ADMIN: ALL_PAGES,
  FELLOW: ["dashboard", "education", "leaves", "travel", "reimbursements", "attendance", "self-attendance", "tasks", "task-analytics", "assets"],
  HR: [
    "dashboard",
    "education",
    "livelihood",
    "disaster-relief",
    "employees",
    "leaves",
    "reimbursements",
    "attendance",
    "self-attendance",
    "tasks",
    "task-analytics",
    "assets",
  ],
};

// Pages that a role may open but must not write to. Fellows can view their own
// assets, but only managers, HR and ADMIN can add/assign/return them.
const READ_ONLY_PAGES = {
  FELLOW: ["assets"],
};

// Program staff (PROGRAM_MANAGER + the 6 new roles) get the same set.
const PROGRAM_STAFF_PAGES = [
  "dashboard",
  "education",
  "fellow-observations",
  "livelihood",
  "disaster-relief",
  "employees",
  "leaves",
  "travel",
  "travel-management",
  "reimbursements",
  "attendance",
  "self-attendance",
  "tasks",
  "task-analytics",
  "assets",
];

async function main() {
  console.log("Seeding new roles and granular permissions...");

  // 1. Upsert every permission page/action.
  const permissionByKey = {};
  for (const page of ALL_PAGES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { app_page_action: { app: "dashboard", page, action } },
        update: {},
        create: { app: "dashboard", page, action },
      });
      permissionByKey[`${page}:${action}`] = perm;
    }
  }

  // 2. Upsert new roles (register-visible).
  for (const role of NEW_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, displayInRegister: true },
      create: {
        name: role.name,
        description: role.description,
        displayInRegister: true,
      },
    });
  }

  // 3. Build the full grant map.
  const grants = {
    ...ROLE_PAGES,
    ADMIN: ALL_PAGES,
  };
  for (const name of PROGRAM_STAFF_ROLES) {
    grants[name] = PROGRAM_STAFF_PAGES;
  }

  // 4. Sync RolePermissions for each role.
  for (const [roleName, pages] of Object.entries(grants)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role ${roleName} not found; skipping permissions.`);
      continue;
    }

    const readOnlyPages = new Set(READ_ONLY_PAGES[roleName] || []);

    for (const page of pages) {
      for (const action of ACTIONS) {
        if (action === "WRITE" && readOnlyPages.has(page)) continue;
        const perm = permissionByKey[`${page}:${action}`];
        if (!perm) continue;
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: perm.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }

    // Keep the seed idempotent if a page later becomes read-only for a role.
    if (readOnlyPages.size) {
      const writePermissions = await prisma.permission.findMany({
        where: {
          app: "dashboard",
          action: "WRITE",
          page: { in: [...readOnlyPages] },
        },
        select: { id: true },
      });
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: role.id,
          permissionId: { in: writePermissions.map((p) => p.id) },
        },
      });
    }

    console.log(`Granted ${pages.length} pages to ${roleName}.`);
  }

  // Every role must be able to open its own attendance logs, including custom
  // roles that are not part of the explicit page map above.
  const attendanceRead = permissionByKey["attendance:READ"];
  if (attendanceRead) {
    const allRoles = await prisma.role.findMany({ select: { id: true } });
    for (const role of allRoles) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: attendanceRead.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: attendanceRead.id },
      });
    }
    console.log(`Ensured attendance access for ${allRoles.length} roles.`);
  }

  // Fellows no longer have a Livelihood section. Remove any existing grant so
  // the sidebar, quick links and APIs all stay in sync.
  const fellowRole = await prisma.role.findUnique({ where: { name: "FELLOW" } });
  if (fellowRole) {
    const livelihoodPermissions = await prisma.permission.findMany({
      where: { page: "livelihood" },
      select: { id: true },
    });
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: fellowRole.id,
        permissionId: { in: livelihoodPermissions.map((p) => p.id) },
      },
    });
    console.log("Removed Livelihood permissions from FELLOW.");
  }

  // Reimbursement management is restricted to Admin and Program Managers by
  // default. Other roles can be granted it from Admin > Role Permissions.
  const pmRole = await prisma.role.findUnique({ where: { name: "PROGRAM_MANAGER" } });
  if (pmRole) {
    for (const action of ACTIONS) {
      const perm = permissionByKey[`reimbursement-management:${action}`];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: pmRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: pmRole.id, permissionId: perm.id },
      });
    }
    console.log("Granted reimbursement management to PROGRAM_MANAGER.");
  }

  // Accountants verify claims and record payments across every program, so they
  // need full reimbursement-management access.
  const accountantRole = await prisma.role.findUnique({ where: { name: "ACCOUNTANT" } });
  if (accountantRole) {
    for (const action of ACTIONS) {
      const perm = permissionByKey[`reimbursement-management:${action}`];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: accountantRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: accountantRole.id, permissionId: perm.id },
      });
    }
    console.log("Granted reimbursement management to ACCOUNTANT.");
  }

  console.log("Role & permission seeding completed.");
}

main()
  .catch((e) => {
    console.error("Role seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
