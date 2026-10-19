import { prisma } from "@/lib/prisma";

export const PROGRAM_ROLES = [
  "PROGRAM_MANAGER",
  "ACCOUNTANT",
  "PROGRAM_COORDINATOR",
  "FIELD_EXECUTIVE",
  "PROGRAM_DIRECTOR",
  "PROGRAM_LEAD",
  "CLASS_ASSISTANT",
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveSchoolId(id) {
  if (UUID_RE.test(id)) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const school = await prisma.School.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return school ? school.id : null;
}

export async function resolveCentreId(id) {
  if (UUID_RE.test(id)) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const centre = await prisma.AfterSchoolCentre.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return centre ? centre.id : null;
}

export async function canAccessSchool(user, schoolId) {
  if (user.role.name === "FELLOW") {
    const assigned = await prisma.FellowSchool.findFirst({
      where: { schoolId, fellow: { userId: user.id } },
    });
    return !!assigned;
  }

  if (PROGRAM_ROLES.includes(user.role.name)) {
    const managed = await prisma.ProgramManagerSchool.findFirst({
      where: { schoolId, userId: user.id },
    });
    return !!managed;
  }

  return true;
}

export async function canAccessCentre(user, centreId) {
  if (user.role.name === "FELLOW") {
    const assigned = await prisma.FellowAfterSchoolCentre.findFirst({
      where: { centreId, fellow: { userId: user.id } },
    });
    return !!assigned;
  }

  if (PROGRAM_ROLES.includes(user.role.name)) {
    const managed = await prisma.ProgramManagerAfterSchoolCentre.findFirst({
      where: { centreId, userId: user.id },
    });
    return !!managed;
  }

  return true;
}
