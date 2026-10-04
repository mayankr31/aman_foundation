import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

// Demo/ready-to-use accounts for the new program-staff roles.
// Passwords are hashed with bcrypt before storage.
const ACCOUNTS = [
  {
    role: "ACCOUNTANT",
    name: "Accountant",
    username: "accountant",
    email: "accountant@amanfoundation.org",
    password: "Accountant@123",
    mobile: "+919000000101",
    department: "Finance",
  },
  {
    role: "PROGRAM_COORDINATOR",
    name: "Program Coordinator",
    username: "program_coordinator",
    email: "coordinator@amanfoundation.org",
    password: "Coordinator@123",
    mobile: "+919000000102",
    department: "Education",
  },
  {
    role: "FIELD_EXECUTIVE",
    name: "Field Executive",
    username: "field_executive",
    email: "field.executive@amanfoundation.org",
    password: "Field@123",
    mobile: "+919000000103",
    department: "Operations",
  },
  {
    role: "PROGRAM_DIRECTOR",
    name: "Program Director",
    username: "program_director",
    email: "director@amanfoundation.org",
    password: "Director@123",
    mobile: "+919000000104",
    department: "Programs",
  },
  {
    role: "PROGRAM_LEAD",
    name: "Program Lead",
    username: "program_lead",
    email: "lead@amanfoundation.org",
    password: "Lead@123",
    mobile: "+919000000105",
    department: "Programs",
  },
  {
    role: "CLASS_ASSISTANT",
    name: "Class Assistant",
    username: "class_assistant",
    email: "class.assistant@amanfoundation.org",
    password: "Assistant@123",
    mobile: "+919000000106",
    department: "Education",
  },
];

async function main() {
  console.log("Seeding program-staff accounts...\n");

  const results = [];

  for (const acc of ACCOUNTS) {
    const role = await prisma.role.findUnique({ where: { name: acc.role } });
    if (!role) {
      console.warn(`Role ${acc.role} not found; run prisma/seed-roles.js first. Skipping.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(acc.password, 10);

    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    let username = existing?.username || acc.username;
    if (!existing) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) username = `${username}_${Date.now().toString().slice(-4)}`;
    }

    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        password: hashedPassword,
        status: "ACTIVE",
        roleId: role.id,
        mobile: acc.mobile,
        department: acc.department,
      },
      create: {
        name: acc.name,
        username,
        email: acc.email,
        password: hashedPassword,
        status: "ACTIVE",
        roleId: role.id,
        mobile: acc.mobile,
        department: acc.department,
      },
    });

    results.push({ role: acc.role, user, password: acc.password });
  }

  console.log("Accounts ready:\n");
  for (const { role, user, password } of results) {
    console.log(`  ${role}`);
    console.log(`    id:       ${user.id}`);
    console.log(`    username: ${user.username}`);
    console.log(`    email:    ${user.email}`);
    console.log(`    password: ${password}`);
    console.log(`    status:   ${user.status}`);
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error("Failed to seed program-staff accounts:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
