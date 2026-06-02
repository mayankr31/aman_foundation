import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding started...");

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Super Administrator with complete platform control",
      displayInRegister: false,
    },
  });

  const pmRole = await prisma.role.upsert({
    where: { name: "PROGRAM_MANAGER" },
    update: {},
    create: {
      name: "PROGRAM_MANAGER",
      description: "Program Manager supervising Education, Livelihood, or Disaster Relief hubs",
      displayInRegister: true,
    },
  });

  console.log("Roles seeded.");

  // 2. Define Master Permission Sets
  const pages = ["dashboard", "education", "livelihood", "disaster-relief", "hr", "admin"];
  const actions = ["READ", "WRITE"];

  const createdPermissions = [];

  for (const page of pages) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: {
          app_page_action: {
            app: "dashboard",
            page,
            action,
          },
        },
        update: {},
        create: {
          app: "dashboard",
          page,
          action,
        },
      });
      createdPermissions.push(perm);
    }
  }

  console.log(`Seeded ${createdPermissions.length} master permissions.`);

  // 3. Map All Permissions to ADMIN Role
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log("ADMIN role mapped with all master permissions.");

  // 4. Create Default Administrator Profile
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const defaultAdmin = await prisma.user.upsert({
    where: { email: "admin@amanfoundation.org" },
    update: {},
    create: {
      name: "Super Administrator",
      username: "admin",
      email: "admin@amanfoundation.org",
      password: hashedPassword,
      status: "ACTIVE",
      roleId: adminRole.id,
      mobile: "+1234567890",
    },
  });

  console.log("Default admin account created:", defaultAdmin.email);
  console.log("Seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
