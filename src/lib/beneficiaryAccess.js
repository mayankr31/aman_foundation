import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

/** True when the user can read the Livelihood pages (full beneficiary profile). */
export async function hasLivelihoodRead(user) {
  if (!user?.id) return false;
  if (user.role?.name === "ADMIN") return true;
  return checkPermission(user, "dashboard", "livelihood", "READ");
}

/**
 * A fellow (or other education user) may open the profile of a beneficiary who
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

/** Write access always requires Livelihood WRITE. */
export async function canEditBeneficiary(user) {
  if (!user?.id) return false;
  if (user.role?.name === "ADMIN") return true;
  return checkPermission(user, "dashboard", "livelihood", "WRITE");
}
