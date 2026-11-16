import { prisma } from "@/lib/prisma";

/**
 * Admins may edit any school. Any other user may edit a school they are
 * assigned to, either as a program manager or as a fellow.
 */
export async function canEditSchool(user, schoolId) {
  if (!user?.id || !schoolId) return false;
  if (user.role?.name === "ADMIN") return true;

  const [manager, fellow] = await Promise.all([
    prisma.programManagerSchool.findFirst({
      where: { schoolId, userId: user.id },
      select: { id: true },
    }),
    prisma.fellowSchool.findFirst({
      where: { schoolId, fellow: { userId: user.id } },
      select: { id: true },
    }),
  ]);

  return Boolean(manager || fellow);
}
