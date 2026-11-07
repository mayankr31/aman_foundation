import { FELLOW_WORKSPACE_LINKS } from "@/lib/fellowTabs";

/**
 * Master registry of dashboard KPIs and quick links.
 * Stable `key` values are stored in DashboardConfig so admins can select which
 * KPIs and quick links a role or an individual user sees.
 */

export const KPI_DEFINITIONS = [
  { key: "students", label: "Students", icon: "groups", tone: "emerald", group: "education" },
  { key: "schools", label: "Schools", icon: "school", tone: "emerald", group: "education" },
  {
    key: "afterSchoolStudents",
    label: "After School Students",
    icon: "escalator_warning",
    tone: "emerald",
    group: "education",
  },
  {
    key: "afterSchools",
    label: "After Schools",
    icon: "cottage",
    tone: "emerald",
    group: "education",
  },
  { key: "fellows", label: "Fellows", icon: "badge", tone: "sky", group: "education" },
  {
    key: "beneficiaries",
    label: "Beneficiaries",
    icon: "volunteer_activism",
    tone: "amber",
    group: "livelihood",
  },
  {
    key: "farmPrograms",
    label: "Farm Programs",
    icon: "agriculture",
    tone: "amber",
    group: "livelihood",
  },
  {
    key: "nonFarmPrograms",
    label: "Non-Farm Programs",
    icon: "pets",
    tone: "amber",
    group: "livelihood",
  },
];

/** KPI groups, in display order. */
export const KPI_GROUPS = [
  { id: "education", title: "Education Hub KPIs" },
  { id: "livelihood", title: "Livelihood Hub KPIs" },
];

export const KPI_KEYS = KPI_DEFINITIONS.map((kpi) => kpi.key);

const FELLOW_WORKSPACE = FELLOW_WORKSPACE_LINKS.map((link) => ({
  key: `workspace.${link.href.replace("/profile?tab=", "")}`,
  ...link,
}));

const TASK_LINKS = [
  { key: "tasks.mine", label: "My Tasks", href: "/tasks", icon: "checklist", page: "tasks" },
];

const EDUCATION_LINKS = [
  {
    key: "education.students",
    label: "Students",
    href: "/education/students",
    kpiKey: "students",
    icon: "groups",
    page: "education",
  },
  {
    key: "education.schools",
    label: "Schools",
    href: "/education/schools",
    kpiKey: "schools",
    icon: "school",
    page: "education",
  },
  {
    key: "education.after-school-students",
    label: "After School Students",
    href: "/education/after-school-students",
    kpiKey: "afterSchoolStudents",
    icon: "escalator_warning",
    page: "education",
  },
  {
    key: "education.after-school-centres",
    label: "After Schools",
    href: "/education/after-school-centres",
    kpiKey: "afterSchools",
    icon: "cottage",
    page: "education",
  },
  {
    key: "education.pta",
    label: "PTA & Programs",
    href: "/education/pta",
    icon: "event",
    page: "education",
  },
  {
    key: "education.fellows",
    label: "Fellows",
    href: "/education/fellows",
    kpiKey: "fellows",
    icon: "badge",
    page: "education",
  },
  // Observation tools stay in the Education card, but keep their stable keys
  // and permission so existing saved dashboard configs keep working.
  {
    key: "observations.pm-reflection",
    label: "PM Reflection",
    href: "/fellow-observations/pm-reflection",
    icon: "rate_review",
    page: "fellow-observations",
  },
  {
    key: "observations.fellow-performance",
    label: "Fellow Performance",
    href: "/fellow-observations/fellow-performance",
    icon: "monitoring",
    page: "fellow-observations",
  },
];

const LIVELIHOOD_LINKS = [
  {
    key: "livelihood.farm",
    label: "Farm Programs",
    href: "/livelihood/farm",
    kpiKey: "farmPrograms",
    icon: "agriculture",
    page: "livelihood",
  },
  {
    key: "livelihood.non-farm",
    label: "Non-Farm Programs",
    href: "/livelihood/non-farm",
    kpiKey: "nonFarmPrograms",
    icon: "pets",
    page: "livelihood",
  },
  {
    key: "livelihood.beneficiaries",
    label: "Beneficiaries",
    href: "/beneficiaries",
    kpiKey: "beneficiaries",
    icon: "volunteer_activism",
    page: "livelihood",
  },
];

const DISASTER_LINKS = [
  {
    key: "disaster.help-providers",
    label: "Help Providers",
    href: "/disaster-relief?tab=help-providers",
    icon: "volunteer_activism",
    page: "disaster-relief",
  },
  {
    key: "disaster.resource-inventory",
    label: "Resource Inventory",
    href: "/disaster-relief?tab=resource-inventory",
    icon: "inventory_2",
    page: "disaster-relief",
  },
  {
    key: "disaster.relief-distributions",
    label: "Relief Distributions",
    href: "/disaster-relief?tab=relief-distributions",
    icon: "redeem",
    page: "disaster-relief",
  },
];

const HR_LINKS = [
  { key: "hr.employees", label: "Employees", href: "/hr", icon: "group", page: "employees" },
  {
    key: "hr.attendance",
    label: "Attendance Logs",
    href: "/hr/attendance",
    icon: "co_present",
    page: "attendance",
  },
  {
    key: "hr.leaves",
    label: "Leave Management",
    href: "/hr/leaves",
    icon: "event_note",
    page: "leaves",
  },
];

const MANAGEMENT_LINKS = [
  {
    key: "management.travel",
    label: "Travel Management",
    href: "/travel/manage",
    icon: "flight_takeoff",
    page: "travel-management",
  },
  {
    key: "management.reimbursements",
    label: "Reimbursement Management",
    href: "/reimbursements/manage",
    icon: "approval",
    page: "reimbursement-management",
  },
];

const ADMIN_LINKS = [
  { key: "admin.assets", label: "Asset Management", href: "/assets", icon: "inventory_2", page: "assets" },
  { key: "admin.access", label: "Admin & Access", href: "/admin", icon: "admin_panel_settings", page: "admin" },
];

const SELF_SERVICE_LINKS = [
  {
    key: "self.leaves",
    label: "My Leaves",
    href: "/hr/leaves/apply",
    icon: "event_available",
    page: "leaves",
  },
  {
    key: "self.employees",
    label: "Employees",
    href: "/hr",
    icon: "group",
    page: "employees",
    default: false,
  },
  {
    key: "self.attendance",
    label: "Attendance Logs",
    href: "/hr/attendance",
    icon: "co_present",
    page: "attendance",
    default: false,
  },
  {
    key: "self.leave-requests",
    label: "Leave Management",
    href: "/hr/leaves",
    icon: "event_note",
    page: "leaves",
    default: false,
  },
  { key: "self.travel", label: "Travel", href: "/travel", icon: "flight", page: "travel" },
  {
    key: "self.reimbursements",
    label: "Reimbursements",
    href: "/reimbursements",
    icon: "receipt_long",
    page: "reimbursements",
  },
  {
    key: "self.assets",
    label: "Assets",
    href: "/assets",
    icon: "inventory_2",
    page: "assets",
  },
];

export const LINK_GROUPS = {
  workspace: { id: "workspace", title: "My Profile", icon: "person", tone: "sky", links: FELLOW_WORKSPACE },
  tasks: { id: "tasks", title: "Tasks", icon: "checklist", tone: "violet", links: TASK_LINKS },
  education: { id: "education", title: "Education", icon: "school", tone: "emerald", links: EDUCATION_LINKS },
  livelihood: { id: "livelihood", title: "Livelihood", icon: "agriculture", tone: "amber", links: LIVELIHOOD_LINKS },
  disaster: {
    id: "disaster",
    title: "Disaster Management",
    icon: "emergency",
    tone: "rose",
    links: DISASTER_LINKS,
  },
  hr: { id: "hr", title: "HR", icon: "diversity_3", tone: "violet", links: HR_LINKS },
  management: { id: "management", title: "Management", icon: "approval", tone: "slate", links: MANAGEMENT_LINKS },
  admin: { id: "admin", title: "Administration", icon: "admin_panel_settings", tone: "slate", links: ADMIN_LINKS },
  selfService: { id: "selfService", title: "Self Service", icon: "badge", tone: "sky", links: SELF_SERVICE_LINKS },
};

export { TASK_LINKS, HR_LINKS, MANAGEMENT_LINKS, ADMIN_LINKS, SELF_SERVICE_LINKS };

/** Options shown in the Admin > Dashboard configurator. */
export function getDashboardLinkOptions() {
  const seen = new Set();
  const groups = [];
  const order = [
    ["workspace", LINK_GROUPS.workspace],
    ["tasks", LINK_GROUPS.tasks],
    ["education", LINK_GROUPS.education],
    ["livelihood", LINK_GROUPS.livelihood],
    ["disaster", LINK_GROUPS.disaster],
    ["hr", LINK_GROUPS.hr],
    ["management", LINK_GROUPS.management],
    ["admin", LINK_GROUPS.admin],
    ["selfService", LINK_GROUPS.selfService],
  ];

  for (const [id, group] of order) {
    const links = group.links.filter((link) => {
      if (seen.has(link.key)) return false;
      seen.add(link.key);
      return true;
    });
    if (links.length) {
      groups.push({ id, title: group.title, links });
    }
  }

  return groups;
}

/** Flat list of every known quick-link key. */
export const LINK_KEYS = [
  ...new Set(
    Object.values(LINK_GROUPS)
      .flatMap((group) => group.links)
      .map((link) => link.key)
  ),
];
