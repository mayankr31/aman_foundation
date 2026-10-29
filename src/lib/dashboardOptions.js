import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/permissions";
import {
  KPI_DEFINITIONS,
  LINK_GROUPS,
} from "@/lib/dashboardRegistry";
import {
  getDashboardKpiConfig,
  getDefaultLinkKeys,
} from "@/lib/dashboardSections";

/**
 * Every quick-link group in the registry, in a stable display order.
 * New groups added to LINK_GROUPS automatically appear here.
 */
function getOrderedGroups() {
  const preferred = [
    "workspace",
    "tasks",
    "education",
    "observations",
    "livelihood",
    "disaster",
    "hr",
    "management",
    "admin",
    "selfService",
  ];
  const entries = Object.entries(LINK_GROUPS);
  const ordered = [];

  for (const id of preferred) {
    if (LINK_GROUPS[id]) ordered.push([id, LINK_GROUPS[id]]);
  }
  for (const [id, group] of entries) {
    if (!preferred.includes(id)) ordered.push([id, group]);
  }

  return ordered;
}

function shapeSections(roleName, can) {
  const isFellow = roleName === "FELLOW";

  return getOrderedGroups().map(([id, group]) => ({
    id,
    title: group.title,
    icon: group.icon,
    tone: group.tone,
    links: group.links.map((link) => ({
      key: link.key,
      label: link.label,
      icon: link.icon,
      page: link.page || null,
      // Profile tabs only belong to Fellows; everything else is permission based.
      allowed: id === "workspace" ? isFellow : !link.page || can(link.page),
    })),
  }));
}

function shapeOptions(roleName, can, config) {
  return {
    kpis: KPI_DEFINITIONS.map((kpi) => ({
      key: kpi.key,
      label: kpi.label,
      icon: kpi.icon,
      tone: kpi.tone,
      allowed: true,
    })),
    sections: shapeSections(roleName, can),
    defaults: {
      kpiKeys: getDashboardKpiConfig(roleName).map((kpi) => kpi.key),
      linkKeys: getDefaultLinkKeys(roleName),
    },
    config,
  };
}

/**
 * The full dashboard catalog with the role's defaults and saved selection.
 */
export async function getRoleDashboardOptions(role) {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    include: { permission: true },
  });

  const can =
    role.name === "ADMIN"
      ? () => true
      : (page) =>
          rolePermissions.some(
            (rp) =>
              rp.permission.page === page &&
              (rp.permission.action === "READ" || rp.permission.action === "WRITE")
          );

  const config = await prisma.dashboardConfig.findUnique({
    where: { roleId: role.id },
  });

  return shapeOptions(
    role.name,
    can,
    config
      ? {
          source: "role",
          kpiKeys: config.kpiKeys,
          linkKeys: config.linkKeys,
        }
      : null
  );
}

/**
 * The full catalog for a user, using their effective permissions, plus the
 * effective saved selection (user config wins over the role config).
 */
export async function getUserDashboardOptions(user) {
  const permissions = await getEffectivePermissions(user);
  const can = (page) => !!permissions[page]?.read;

  const [roleConfig, userConfig] = await Promise.all([
    prisma.dashboardConfig.findUnique({ where: { roleId: user.roleId } }),
    prisma.dashboardConfig.findUnique({ where: { userId: user.id } }),
  ]);

  const effective = userConfig || roleConfig;
  const source = userConfig ? "user" : roleConfig ? "role" : "default";

  return shapeOptions(
    user.role.name,
    can,
    effective
      ? {
          source,
          kpiKeys: effective.kpiKeys,
          linkKeys: effective.linkKeys,
        }
      : null
  );
}
