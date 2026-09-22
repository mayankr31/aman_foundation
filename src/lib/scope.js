import { prisma } from "@/lib/prisma";

export function isAdmin(user) {
  return user?.role?.name === "ADMIN";
}

export function isProgramManager(user) {
  return user?.role?.name === "PROGRAM_MANAGER";
}

export function isAdminOrPm(user) {
  return isAdmin(user) || isProgramManager(user);
}

export async function getManagedSchoolIds(userId) {
  const rows = await prisma.programManagerSchool.findMany({
    where: { userId },
    select: { schoolId: true },
  });
  return rows.map((r) => r.schoolId);
}

export async function getManagedCentreIds(userId) {
  const rows = await prisma.programManagerAfterSchoolCentre.findMany({
    where: { userId },
    select: { centreId: true },
  });
  return rows.map((r) => r.centreId);
}

export async function getManagedLivelihoodProgramIds(userId) {
  const rows = await prisma.programManagerLivelihoodProgram.findMany({
    where: { userId },
    select: { programId: true },
  });
  return rows.map((r) => r.programId);
}

export async function getManagedFellowIds(userId) {
  const [schoolIds, centreIds] = await Promise.all([
    getManagedSchoolIds(userId),
    getManagedCentreIds(userId),
  ]);

  const or = [];
  if (schoolIds.length) or.push({ schools: { some: { schoolId: { in: schoolIds } } } });
  if (centreIds.length) or.push({ afterSchoolCentres: { some: { centreId: { in: centreIds } } } });
  if (!or.length) return [];

  const fellows = await prisma.fellow.findMany({
    where: { OR: or },
    select: { id: true },
  });
  return fellows.map((f) => f.id);
}

export async function isFellowManaged(userId, fellowId) {
  if (!fellowId) return false;
  const [schoolIds, centreIds] = await Promise.all([
    getManagedSchoolIds(userId),
    getManagedCentreIds(userId),
  ]);
  const or = [];
  if (schoolIds.length) or.push({ id: fellowId, schools: { some: { schoolId: { in: schoolIds } } } });
  if (centreIds.length) or.push({ id: fellowId, afterSchoolCentres: { some: { centreId: { in: centreIds } } } });
  if (!or.length) return false;
  const row = await prisma.fellow.findFirst({ where: { OR: or }, select: { id: true } });
  return !!row;
}

export async function getManagedTeamUserIds(userId) {
  const fellowIds = await getManagedFellowIds(userId);
  if (!fellowIds.length) return [];

  const fellows = await prisma.fellow.findMany({
    where: { id: { in: fellowIds }, userId: { not: null } },
    select: { userId: true },
  });
  return fellows.map((f) => f.userId);
}

export async function isSchoolManaged(userId, schoolId) {
  if (!schoolId) return false;
  const row = await prisma.programManagerSchool.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  });
  return !!row;
}

export async function isCentreManaged(userId, centreId) {
  if (!centreId) return false;
  const row = await prisma.programManagerAfterSchoolCentre.findFirst({
    where: { userId, centreId },
    select: { id: true },
  });
  return !!row;
}

export async function isLivelihoodProgramManaged(userId, programId) {
  if (!programId) return false;
  const row = await prisma.programManagerLivelihoodProgram.findFirst({
    where: { userId, programId },
    select: { id: true },
  });
  return !!row;
}

export async function getManagedEducationProgramIds(userId) {
  const [schoolIds, centreIds] = await Promise.all([
    getManagedSchoolIds(userId),
    getManagedCentreIds(userId),
  ]);

  const or = [];
  if (schoolIds.length) or.push({ schools: { some: { schoolId: { in: schoolIds } } } });
  if (centreIds.length) or.push({ afterSchoolCentres: { some: { centreId: { in: centreIds } } } });
  if (!or.length) return [];

  const programs = await prisma.program.findMany({
    where: { OR: or },
    select: { id: true },
  });
  return programs.map((p) => p.id);
}

export async function isEducationProgramManaged(userId, programId) {
  if (!programId) return false;
  const ids = await getManagedEducationProgramIds(userId);
  return ids.includes(programId);
}
