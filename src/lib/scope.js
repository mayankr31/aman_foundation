import { prisma } from "@/lib/prisma";
import { isFieldScopedRoleName, isProgramStaffRole } from "@/lib/roles";

export function isAdmin(user) {
  return user?.role?.name === "ADMIN";
}

/** True when the user is field staff scoped to their program assignments. */
export function isProgramStaff(user) {
  return isProgramStaffRole(user?.role?.name);
}

/** Backwards-compatible alias for the old PROGRAM_MANAGER-only check. */
export function isProgramManager(user) {
  return isProgramStaff(user);
}

export function isAdminOrPm(user) {
  return isAdmin(user) || isProgramStaff(user);
}

/**
 * Roles whose data access is limited to the schools/centres/programs they are
 * assigned to. Only ADMIN and HR see everything; every other role, including
 * admin-created roles, is assignment-scoped.
 */
export function isFieldScopedRole(user) {
  return isFieldScopedRoleName(user?.role?.name);
}

/** True when the user may act on the school (ADMIN, unrestricted role, or assigned). */
export async function canAccessSchool(user, schoolId) {
  if (!user?.id || !schoolId) return false;
  if (isAdmin(user)) return true;
  if (!isFieldScopedRole(user)) return true;

  const [manager, fellow] = await Promise.all([
    prisma.programManagerSchool.findFirst({
      where: { userId: user.id, schoolId },
      select: { id: true },
    }),
    prisma.fellowSchool.findFirst({
      where: { schoolId, fellow: { userId: user.id } },
      select: { id: true },
    }),
  ]);

  return Boolean(manager || fellow);
}

/** True when the user may act on the after-school centre. */
export async function canAccessCentre(user, centreId) {
  if (!user?.id || !centreId) return false;
  if (isAdmin(user)) return true;
  if (!isFieldScopedRole(user)) return true;

  const [manager, fellow] = await Promise.all([
    prisma.programManagerAfterSchoolCentre.findFirst({
      where: { userId: user.id, centreId },
      select: { id: true },
    }),
    prisma.fellowAfterSchoolCentre.findFirst({
      where: { centreId, fellow: { userId: user.id } },
      select: { id: true },
    }),
  ]);

  return Boolean(manager || fellow);
}

/** True when the user may act on the student (based on their school). */
export async function canAccessStudent(user, studentId) {
  if (!user?.id || !studentId) return false;
  if (isAdmin(user)) return true;
  if (!isFieldScopedRole(user)) return true;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true },
  });
  if (!student?.schoolId) return false;

  return canAccessSchool(user, student.schoolId);
}

/** True when the user may act on the after-school student (based on their centre). */
export async function canAccessAfterSchoolStudent(user, studentId) {
  if (!user?.id || !studentId) return false;
  if (isAdmin(user)) return true;
  if (!isFieldScopedRole(user)) return true;

  const student = await prisma.afterSchoolStudent.findUnique({
    where: { id: studentId },
    select: { centreId: true },
  });
  if (!student?.centreId) return false;

  return canAccessCentre(user, student.centreId);
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

export async function getFellowIdByUserId(userId) {
  if (!userId) return null;
  const fellow = await prisma.fellow.findUnique({
    where: { userId },
    select: { id: true },
  });
  return fellow?.id || null;
}

export async function getFellowAssignedLivelihoodProgramIds(fellowId) {
  if (!fellowId) return [];
  const rows = await prisma.fellowLivelihoodProgram.findMany({
    where: { fellowId },
    select: { programId: true },
  });
  return rows.map((r) => r.programId);
}

export async function isLivelihoodProgramAssignedToFellow(fellowId, programId) {
  if (!fellowId || !programId) return false;
  const row = await prisma.fellowLivelihoodProgram.findFirst({
    where: { fellowId, programId },
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
