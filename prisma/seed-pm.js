import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("Seeding Program Manager permissions and assignments...");

  const pmRole = await prisma.role.findUnique({ where: { name: "PROGRAM_MANAGER" } });
  if (!pmRole) {
    console.error("PROGRAM_MANAGER role not found. Run the base seed first.");
    return;
  }

  const pmPages = ["dashboard", "education", "livelihood", "disaster-relief", "hr"];
  const actions = ["READ", "WRITE"];

  for (const page of pmPages) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { app_page_action: { app: "dashboard", page, action } },
        update: {},
        create: { app: "dashboard", page, action },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: pmRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: pmRole.id, permissionId: perm.id },
      });
    }
  }

  const pmUser = await prisma.user.findUnique({ where: { email: "pm@amanfoundation.org" } });
  if (!pmUser) {
    console.warn("PM demo user not found; skipping assignments.");
    return;
  }

  const schools = await prisma.school.findMany({ orderBy: { createdAt: "asc" } });
  const centres = await prisma.afterSchoolCentre.findMany({ orderBy: { createdAt: "asc" } });

  // Prefer programs that actually have beneficiary enrollments so the demo PM has visible data.
  const enrolled = await prisma.beneficiaryLivelihood.findMany({
    select: { programId: true },
    distinct: ["programId"],
  });
  const enrolledProgramIds = enrolled.map((e) => e.programId);
  const programs = await prisma.livelihoodProgram.findMany({
    where: enrolledProgramIds.length ? { id: { in: enrolledProgramIds } } : undefined,
    orderBy: { createdAt: "asc" },
  });

  for (const school of schools.slice(0, 3)) {
    await prisma.programManagerSchool.upsert({
      where: { userId_schoolId: { userId: pmUser.id, schoolId: school.id } },
      update: {},
      create: { userId: pmUser.id, schoolId: school.id },
    });
  }

  for (const centre of centres.slice(0, 2)) {
    await prisma.programManagerAfterSchoolCentre.upsert({
      where: { userId_centreId: { userId: pmUser.id, centreId: centre.id } },
      update: {},
      create: { userId: pmUser.id, centreId: centre.id },
    });
  }

  for (const program of programs.slice(0, 4)) {
    await prisma.programManagerLivelihoodProgram.upsert({
      where: { userId_programId: { userId: pmUser.id, programId: program.id } },
      update: {},
      create: { userId: pmUser.id, programId: program.id },
    });
  }

  console.log(
    `Assigned PM to ${Math.min(schools.length, 3)} schools, ${Math.min(centres.length, 2)} centres, ${Math.min(programs.length, 4)} programs.`
  );
  console.log("PM seeding completed.");
}

main()
  .catch((e) => {
    console.error("PM seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
