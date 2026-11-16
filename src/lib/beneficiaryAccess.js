import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { PROGRAM_ROLES } from "@/lib/scope";

/** True when the user can read the Livelihood pages (full participant profile). */
export async function hasLivelihoodRead(user) {
  if (!user?.id) return false;
  if (user.role?.name === "ADMIN") return true;
  return checkPermission(user, "dashboard", "livelihood", "READ");
}

/**
 * A fellow (or other education user) may open the profile of a participant who
 * is linked to a student in their assigned schools.
 */
export async function isLinkedBeneficiaryViewer(user, beneficiaryId) {
  if (!user?.id || !beneficiaryId) return false;
  if (!(await checkPermission(user, "dashboard", "education", "READ"))) return false;

  const student = await prisma.student.findFirst({
    where: {
      beneficiaryId,
      OR: [
        { fellow: { userId: user.id } },
        { school: { fellows: { some: { fellow: { userId: user.id } } } } },
      ],
    },
    select: { id: true },
  });

  return !!student;
}

/** Read access: livelihood READ, or a linked student's fellow. */
export async function canViewBeneficiary(user, beneficiaryId) {
  if (!user?.id || !beneficiaryId) return false;
  if (await hasLivelihoodRead(user)) return true;
  return isLinkedBeneficiaryViewer(user, beneficiaryId);
}

/**
 * True when a program staff member is assigned to a program in which the
 * participant is enrolled. Participants with no program enrollment yet (for
 * example, just created from the directory) remain editable so the creation
 * and KYR flow keeps working.
 */
export async function canManageBeneficiaryInPrograms(userId, beneficiaryId) {
  if (!userId || !beneficiaryId) return false;
  const [enrollmentCount, managed] = await Promise.all([
    prisma.beneficiaryLivelihood.count({ where: { beneficiaryId } }),
    prisma.beneficiaryLivelihood.findFirst({
      where: { beneficiaryId, program: { programManagers: { some: { userId } } } },
      select: { id: true },
    }),
  ]);
  if (enrollmentCount === 0) return true;
  return !!managed;
}

/**
 * Write access requires Livelihood WRITE. Admins may edit any participant;
 * other program staff may edit only participants enrolled in a program they
 * manage. Fellows (and other linked education users) stay read-only.
 */
export async function canEditBeneficiary(user, beneficiaryId) {
  if (!user?.id) return false;
  if (user.role?.name === "ADMIN") return true;
  if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) return false;
  if (!PROGRAM_ROLES.includes(user.role?.name)) return false;
  if (!beneficiaryId) return false;
  return canManageBeneficiaryInPrograms(user.id, beneficiaryId);
}
