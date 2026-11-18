import { prisma } from "@/lib/prisma";
import {
  PROGRAM_ROLES,
  canAccessSchool as canAccessSchoolInScope,
  canAccessCentre as canAccessCentreInScope,
} from "@/lib/scope";

export { PROGRAM_ROLES };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveSchoolId(id) {
  if (UUID_RE.test(id)) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const school = await prisma.school.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return school ? school.id : null;
}

export async function resolveCentreId(id) {
  if (UUID_RE.test(id)) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const centre = await prisma.afterSchoolCentre.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return centre ? centre.id : null;
}

export async function canAccessSchool(user, schoolId) {
  if (!user?.id || !schoolId) return false;
  return canAccessSchoolInScope(user, schoolId);
}

export async function canAccessCentre(user, centreId) {
  if (!user?.id || !centreId) return false;
  return canAccessCentreInScope(user, centreId);
}
