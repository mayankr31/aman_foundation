import { prisma } from "../src/lib/prisma.js";

// Adds the reimbursement permissions to an existing installation without
// touching any other role/permission assignments.
const NEW_PAGES = ["reimbursements", "reimbursement-management"];
const ACTIONS = ["READ", "WRITE"];

const ROLE_PAGES = {
  ADMIN: ["reimbursements", "reimbursement-management"],
  FELLOW: ["reimbursements"],
  HR: ["reimbursements"],
  PROGRAM_MANAGER: ["reimbursements", "reimbursement-management"],
  ACCOUNTANT: ["reimbursements"],
  PROGRAM_COORDINATOR: ["reimbursements"],
  FIELD_EXECUTIVE: ["reimbursements"],
  PROGRAM_DIRECTOR: ["reimbursements"],
  PROGRAM_LEAD: ["reimbursements"],
  CLASS_ASSISTANT: ["reimbursements"],
};

async function main() {
  console.log("Seeding reimbursement permissions...");

  const permissionByKey = {};
  for (const page of NEW_PAGES) {
    for (const action of ACTIONS) {
      const permission = await prisma.permission.upsert({
        where: { app_page_action: { app: "dashboard", page, action } },
        update: {},
        create: { app: "dashboard", page, action },
      });
      permissionByKey[`${page}:${action}`] = permission;
    }
  }

  for (const [roleName, pages] of Object.entries(ROLE_PAGES)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role ${roleName} not found; skipping reimbursement permissions.`);
      continue;
    }

    for (const page of pages) {
      for (const action of ACTIONS) {
        const permission = permissionByKey[`${page}:${action}`];
        if (!permission) continue;
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
    }
    console.log(`Granted reimbursement access (${pages.join(", ")}) to ${roleName}.`);
  }

  console.log("Reimbursement permission seeding completed.");
}

main()
  .catch((error) => {
    console.error("Reimbursement permission seeding error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
