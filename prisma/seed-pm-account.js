import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

// ── Configure the Program Manager account here (or override via env vars) ──
const CONFIG = {
  name: process.env.PM_NAME || "Program Manager",
  username: process.env.PM_USERNAME || "pm_manager",
  email: process.env.PM_EMAIL || "pm@amanfoundation.org",
  password: process.env.PM_PASSWORD || "PM@123",
  mobile: process.env.PM_MOBILE || "+919727384922",
  department: process.env.PM_DEPARTMENT || "Education",
};

async function main() {
  const role = await prisma.role.upsert({
    where: { name: "PROGRAM_MANAGER" },
    update: {},
    create: {
      name: "PROGRAM_MANAGER",
      description: "Program Manager supervising Education, Livelihood, or Disaster Relief hubs",
      displayInRegister: true,
    },
  });

  const hashedPassword = await bcrypt.hash(CONFIG.password, 10);

  const existing = await prisma.user.findUnique({ where: { email: CONFIG.email } });
  let username = existing?.username || CONFIG.username;
  if (!existing) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) username = `${username}_${Date.now().toString().slice(-4)}`;
  }

  const user = await prisma.user.upsert({
    where: { email: CONFIG.email },
    update: {
      name: CONFIG.name,
      password: hashedPassword,
      status: "ACTIVE",
      roleId: role.id,
      mobile: CONFIG.mobile,
      department: CONFIG.department,
    },
    create: {
      name: CONFIG.name,
      username,
      email: CONFIG.email,
      password: hashedPassword,
      status: "ACTIVE",
      roleId: role.id,
      mobile: CONFIG.mobile,
      department: CONFIG.department,
    },
  });

  console.log("Program Manager account ready:");
  console.log("  Name:    ", user.name);
  console.log("  Username:", user.username);
  console.log("  Email:   ", user.email);
  console.log("  Role:    ", role.name);
  console.log("  Status:  ", user.status);
}

main()
  .catch((e) => {
    console.error("Failed to seed Program Manager account:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
