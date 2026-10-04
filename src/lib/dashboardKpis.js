import { prisma } from "@/lib/prisma";
import {
  getManagedSchoolIds,
  getManagedCentreIds,
  getManagedLivelihoodProgramIds,
  getManagedFellowIds,
} from "@/lib/scope";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const EMPTY_KPIS = {
  students: 0,
  schools: 0,
  afterSchoolStudents: 0,
  afterSchools: 0,
  fellows: 0,
  beneficiaries: 0,
  farmPrograms: 0,
  nonFarmPrograms: 0,
};

async function getAdminKpis() {
  const [
    students,
    schools,
    afterSchoolStudents,
    afterSchools,
    fellows,
    beneficiaries,
    farmPrograms,
    nonFarmPrograms,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.school.count(),
    prisma.afterSchoolStudent.count(),
    prisma.afterSchoolCentre.count(),
    prisma.fellow.count(),
    prisma.beneficiary.count(),
    prisma.livelihoodProgram.count({ where: { category: "FARM" } }),
    prisma.livelihoodProgram.count({ where: { category: "NON_FARM" } }),
  ]);

  return {
    students,
    schools,
    afterSchoolStudents,
    afterSchools,
    fellows,
    beneficiaries,
    farmPrograms,
    nonFarmPrograms,
  };
}

async function getProgramManagerKpis(user) {
  const [schoolIds, centreIds, programIds, fellowIds] = await Promise.all([
    getManagedSchoolIds(user.id),
    getManagedCentreIds(user.id),
    getManagedLivelihoodProgramIds(user.id),
    getManagedFellowIds(user.id),
  ]);

  const [
    students,
    afterSchoolStudents,
    beneficiaries,
    farmPrograms,
    nonFarmPrograms,
  ] = await Promise.all([
    schoolIds.length
      ? prisma.student.count({ where: { schoolId: { in: schoolIds } } })
      : 0,
    centreIds.length
      ? prisma.afterSchoolStudent.count({ where: { centreId: { in: centreIds } } })
      : 0,
    programIds.length
      ? prisma.beneficiary.count({
          where: { livelihoodDetails: { some: { programId: { in: programIds } } } },
        })
      : 0,
    programIds.length
      ? prisma.livelihoodProgram.count({ where: { id: { in: programIds }, category: "FARM" } })
      : 0,
    programIds.length
      ? prisma.livelihoodProgram.count({ where: { id: { in: programIds }, category: "NON_FARM" } })
      : 0,
  ]);

  return {
    students,
    schools: schoolIds.length,
    afterSchoolStudents,
    afterSchools: centreIds.length,
    fellows: fellowIds.length,
    beneficiaries,
    farmPrograms,
    nonFarmPrograms,
  };
}

async function getFellowKpis(user) {
  const fellow = await prisma.fellow.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!fellow) return { ...EMPTY_KPIS };

  const fellowId = fellow.id;

  const [
    schools,
    afterSchools,
    students,
    afterSchoolStudents,
    farmPrograms,
    nonFarmPrograms,
    beneficiaries,
  ] = await Promise.all([
    prisma.fellowSchool.count({ where: { fellowId } }),
    prisma.fellowAfterSchoolCentre.count({ where: { fellowId } }),
    prisma.student.count({ where: { fellowId } }),
    prisma.afterSchoolStudent.count({ where: { fellowId } }),
    prisma.fellowLivelihoodProgram.count({
      where: { fellowId, program: { category: "FARM" } },
    }),
    prisma.fellowLivelihoodProgram.count({
      where: { fellowId, program: { category: "NON_FARM" } },
    }),
    prisma.beneficiary.count({
      where: { livelihoodDetails: { some: { program: { fellows: { some: { fellowId } } } } } },
    }),
  ]);

  return {
    students,
    schools,
    afterSchoolStudents,
    afterSchools,
    fellows: 0,
    beneficiaries,
    farmPrograms,
    nonFarmPrograms,
  };
}

export async function getDashboardKpis(user) {
  const role = user?.role?.name;

  if (role === "ADMIN") {
    return { role, kpis: await getAdminKpis() };
  }
  if (PROGRAM_ROLES.includes(role)) {
    return { role, kpis: await getProgramManagerKpis(user) };
  }
  if (role === "FELLOW") {
    return { role, kpis: await getFellowKpis(user) };
  }
  return { role: role || "UNKNOWN", kpis: { ...EMPTY_KPIS } };
}
