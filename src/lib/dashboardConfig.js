import { prisma } from "@/lib/prisma";
import { KPI_KEYS, LINK_KEYS } from "@/lib/dashboardRegistry";

const KPI_KEY_SET = new Set(KPI_KEYS);
const LINK_KEY_SET = new Set(LINK_KEYS);

export function sanitizeDashboardKeys({ kpiKeys, linkKeys } = {}) {
  const cleanKpis = Array.isArray(kpiKeys)
    ? [...new Set(kpiKeys.filter((key) => typeof key === "string" && KPI_KEY_SET.has(key)))]
    : [];
  const cleanLinks = Array.isArray(linkKeys)
    ? [...new Set(linkKeys.filter((key) => typeof key === "string" && LINK_KEY_SET.has(key)))]
    : [];
  return { kpiKeys: cleanKpis, linkKeys: cleanLinks };
}

/**
 * Effective dashboard selection for a user.
 * User-specific config wins over the role config; no row means "role defaults".
 */
export async function getEffectiveDashboardConfig(user) {
  if (!user?.id) return { source: "default", kpiKeys: null, linkKeys: null };

  const [userConfig, roleConfig] = await Promise.all([
    prisma.dashboardConfig.findUnique({ where: { userId: user.id } }),
    user.roleId
      ? prisma.dashboardConfig.findUnique({ where: { roleId: user.roleId } })
      : Promise.resolve(null),
  ]);

  if (userConfig) {
    return {
      source: "user",
      kpiKeys: userConfig.kpiKeys,
      linkKeys: userConfig.linkKeys,
    };
  }
  if (roleConfig) {
    return {
      source: "role",
      kpiKeys: roleConfig.kpiKeys,
      linkKeys: roleConfig.linkKeys,
    };
  }
  return { source: "default", kpiKeys: null, linkKeys: null };
}
