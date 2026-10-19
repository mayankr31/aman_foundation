require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma");

// Fellows need WRITE access to education to add schools, centres and students.
// This is idempotent and only adds the permission if it is missing.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const role = await prisma.role.findUnique({ where: { name: "FELLOW" } });
    if (!role) {
      console.log("FELLOW role not found; nothing to do.");
      return;
    }

    const permission = await prisma.permission.upsert({
      where: {
        app_page_action: {
          app: "dashboard",
          page: "education",
          action: "WRITE",
        },
      },
      update: {},
      create: {
        app: "dashboard",
        page: "education",
        action: "WRITE",
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    console.log("FELLOW role now has education WRITE permission.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to grant FELLOW education WRITE:", error);
  process.exit(1);
});
