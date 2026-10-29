import {
  ADMIN_LINKS,
  HR_LINKS,
  KPI_DEFINITIONS,
  LINK_GROUPS,
  MANAGEMENT_LINKS,
  SELF_SERVICE_LINKS,
  TASK_LINKS,
} from "@/lib/dashboardRegistry";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const KNOWN_GROUP_IDS = new Set([
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
]);

function permit(links, can) {
  const canFn = typeof can === "function" ? can : () => true;
  return (links || []).filter((link) => !link.page || canFn(link.page));
}

function makeSection(group, links) {
  return {
    id: group.id || group.title,
    title: group.title,
    icon: group.icon,
    tone: group.tone,
    links,
  };
}

/**
 * The quick links a role sees when no dashboard config exists.
 * Kept in sync with the pre-config dashboard layout.
 */
export function getDefaultLinkKeys(role) {
  const isAdmin = role === "ADMIN";
  const isFellow = role === "FELLOW";
  const isProgramRole = PROGRAM_ROLES.includes(role);

  const keys = [];

  const educationLinks = isFellow
    ? LINK_GROUPS.education.links.filter(
        (link) => link.href !== "/education/fellows" && link.href !== "/education/pta"
      )
    : LINK_GROUPS.education.links;

  keys.push(...educationLinks.map((link) => link.key));
  keys.push(...LINK_GROUPS.observations.links.map((link) => link.key));
  keys.push(...LINK_GROUPS.livelihood.links.map((link) => link.key));
  keys.push(...LINK_GROUPS.disaster.links.map((link) => link.key));

  if (isAdmin) {
    keys.push(...HR_LINKS.map((link) => link.key));
    keys.push(...MANAGEMENT_LINKS.map((link) => link.key));
    keys.push(...TASK_LINKS.map((link) => link.key));
    keys.push(...ADMIN_LINKS.map((link) => link.key));
  } else {
    if (isFellow) keys.push(...LINK_GROUPS.workspace.links.map((link) => link.key));
    if (role === "HR" || isProgramRole) keys.push(...HR_LINKS.map((link) => link.key));
    if (isProgramRole) keys.push(...MANAGEMENT_LINKS.map((link) => link.key));
    keys.push(...SELF_SERVICE_LINKS.map((link) => link.key));
    keys.push(...TASK_LINKS.map((link) => link.key));
  }

  return [...new Set(keys)];
}

/**
 * Builds the dashboard quick-link sections for a role.
 * `allowedLinkKeys` is the admin-configured selection (or role defaults when
 * omitted). Permission checks are always applied afterwards, so dashboard
 * configuration can never expose a page the role cannot open.
 */
export function getDashboardSections(role, can, allowedLinkKeys) {
  const canFn = typeof can === "function" ? can : () => true;
  const allowed = new Set(
    Array.isArray(allowedLinkKeys) ? allowedLinkKeys : getDefaultLinkKeys(role)
  );

  const pick = (links) =>
    (links || []).filter(
      (link) => allowed.has(link.key) && (!link.page || canFn(link.page))
    );

  const sections = [];
  const isAdmin = role === "ADMIN";
  const isFellow = role === "FELLOW";

  if (isFellow) {
    const links = pick(LINK_GROUPS.workspace.links);
    if (links.length) sections.push(makeSection(LINK_GROUPS.workspace, links));
  }

  const educationLinks = pick(LINK_GROUPS.education.links);
  if (educationLinks.length) {
    sections.push(makeSection(LINK_GROUPS.education, educationLinks));
  }

  const observationLinks = pick(LINK_GROUPS.observations.links);
  if (observationLinks.length) {
    sections.push(makeSection(LINK_GROUPS.observations, observationLinks));
  }

  const livelihoodLinks = pick(LINK_GROUPS.livelihood.links);
  if (livelihoodLinks.length) {
    sections.push(makeSection(LINK_GROUPS.livelihood, livelihoodLinks));
  }

  const disasterLinks = pick(LINK_GROUPS.disaster.links);
  if (disasterLinks.length) {
    sections.push(makeSection(LINK_GROUPS.disaster, disasterLinks));
  }

  if (isAdmin) {
    // Tasks, HR, Management and Admin & Access share one Administration card.
    const adminLinks = pick([
      ...HR_LINKS,
      ...MANAGEMENT_LINKS,
      ...TASK_LINKS,
      ...ADMIN_LINKS,
    ]).map((link) =>
      link.key === "tasks.mine" ? { ...link, label: "All Tasks" } : link
    );

    if (adminLinks.length) {
      sections.push({
        id: "administration",
        title: "Administration",
        icon: "admin_panel_settings",
        tone: "slate",
        links: adminLinks,
      });
    }

    const selfLinks = pick(SELF_SERVICE_LINKS);
    if (selfLinks.length) sections.push(makeSection(LINK_GROUPS.selfService, selfLinks));
  } else {
    const hrLinks = pick(HR_LINKS);
    if (hrLinks.length) sections.push(makeSection(LINK_GROUPS.hr, hrLinks));

    const managementLinks = pick(MANAGEMENT_LINKS);
    if (managementLinks.length) {
      sections.push(makeSection(LINK_GROUPS.management, managementLinks));
    }

    const selfLinks = pick([...SELF_SERVICE_LINKS, ...TASK_LINKS]).map((link) =>
      link.key === "self.leaves" && role !== "FELLOW"
        ? { ...link, label: "Leave Application" }
        : link
    );
    if (selfLinks.length) sections.push(makeSection(LINK_GROUPS.selfService, selfLinks));

    const adminLinks = pick(ADMIN_LINKS);
    if (adminLinks.length) {
      sections.push({
        id: "administration",
        title: "Administration",
        icon: "admin_panel_settings",
        tone: "slate",
        links: adminLinks,
      });
    }
  }

  // Future registry groups render automatically once selected.
  for (const [groupId, group] of Object.entries(LINK_GROUPS)) {
    if (KNOWN_GROUP_IDS.has(groupId)) continue;
    const links = pick(group.links);
    if (links.length) sections.push(makeSection({ id: groupId, ...group }, links));
  }

  return sections.filter((section) => section.links.length > 0);
}

/**
 * Builds the KPI card config for a role.
 * `allowedKpiKeys` narrows the result to an admin-configured selection.
 */
export function getDashboardKpiConfig(role, allowedKpiKeys) {
  const config = buildKpiConfig(role);
  if (!Array.isArray(allowedKpiKeys)) return config;

  // Keep role-specific labels where they exist, but let admins add any KPI.
  const allowed = new Set(allowedKpiKeys);
  const byKey = new Map(config.map((kpi) => [kpi.key, kpi]));
  return KPI_DEFINITIONS.filter((kpi) => allowed.has(kpi.key)).map(
    (definition) => byKey.get(definition.key) || definition
  );
}

function buildKpiConfig(role) {
  if (role === "FELLOW") {
    return [
      { key: "schools", label: "Assigned Schools", icon: "school", tone: "emerald" },
      { key: "afterSchools", label: "Assigned After Schools", icon: "cottage", tone: "emerald" },
      { key: "students", label: "Students", icon: "groups", tone: "emerald" },
      { key: "afterSchoolStudents", label: "After School Students", icon: "escalator_warning", tone: "emerald" },
    ];
  }

  if (PROGRAM_ROLES.includes(role)) {
    return [
      { key: "schools", label: "Managed Schools", icon: "school", tone: "emerald" },
      { key: "afterSchools", label: "Managed After Schools", icon: "cottage", tone: "emerald" },
      { key: "students", label: "Students", icon: "groups", tone: "emerald" },
      { key: "afterSchoolStudents", label: "After School Students", icon: "escalator_warning", tone: "emerald" },
      { key: "fellows", label: "Fellows", icon: "badge", tone: "sky" },
      { key: "farmPrograms", label: "Farm Programs", icon: "agriculture", tone: "amber" },
      { key: "nonFarmPrograms", label: "Non-Farm Programs", icon: "pets", tone: "amber" },
      { key: "beneficiaries", label: "Beneficiaries", icon: "volunteer_activism", tone: "amber" },
    ];
  }

  return [
    { key: "students", label: "Students", icon: "groups", tone: "emerald" },
    { key: "schools", label: "Schools", icon: "school", tone: "emerald" },
    { key: "afterSchoolStudents", label: "After School Students", icon: "escalator_warning", tone: "emerald" },
    { key: "afterSchools", label: "After Schools", icon: "cottage", tone: "emerald" },
    { key: "fellows", label: "Fellows", icon: "badge", tone: "sky" },
    { key: "beneficiaries", label: "Beneficiaries", icon: "volunteer_activism", tone: "amber" },
    { key: "farmPrograms", label: "Farm Programs", icon: "agriculture", tone: "amber" },
    { key: "nonFarmPrograms", label: "Non-Farm Programs", icon: "pets", tone: "amber" },
  ];
}
