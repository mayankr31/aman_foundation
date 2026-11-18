import { canAccessSchool } from "@/lib/scope";

/**
 * Admins may edit any school. Field-scoped roles (Fellows and program roles)
 * may edit only schools they are assigned to. Any other role is unrestricted
 * once the caller has verified the education:WRITE permission.
 */
export async function canEditSchool(user, schoolId) {
  if (!user?.id || !schoolId) return false;
  return canAccessSchool(user, schoolId);
}
