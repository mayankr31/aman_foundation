import { FELLOW_WORKSPACE_LINKS } from "@/lib/fellowTabs";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const EDUCATION_LINKS = [
  { label: "Students", href: "/education/students", kpiKey: "students", icon: "groups", page: "education" },
  { label: "Schools", href: "/education/schools", kpiKey: "schools", icon: "school", page: "education" },
  {
    label: "After School Students",
    href: "/education/after-school-students",
    kpiKey: "afterSchoolStudents",
    icon: "escalator_warning",
    page: "education",
  },
  {
    label: "After Schools",
    href: "/education/after-school-centres",
    kpiKey: "afterSchools",
    icon: "cottage",
    page: "education",
  },
  { label: "PTA & Programs", href: "/education/pta", icon: "event", page: "education" },
  { label: "Fellows", href: "/education/fellows", kpiKey: "fellows", icon: "badge", page: "education" },
];

const OBSERVATION_LINKS = [
  {
    label: "PM Reflection",
    href: "/fellow-observations/pm-reflection",
    icon: "rate_review",
    page: "fellow-observations",
  },
  {
    label: "Fellow Performance",
    href: "/fellow-observations/fellow-performance",
    icon: "monitoring",
    page: "fellow-observations",
  },
];

const LIVELIHOOD_LINKS = [
  { label: "Farm Programs", href: "/livelihood/farm", kpiKey: "farmPrograms", icon: "agriculture", page: "livelihood" },
  {
    label: "Non-Farm Programs",
    href: "/livelihood/non-farm",
    kpiKey: "nonFarmPrograms",
    icon: "pets",
    page: "livelihood",
  },
  { label: "Beneficiaries", href: "/beneficiaries", kpiKey: "beneficiaries", icon: "volunteer_activism", page: "livelihood" },
];

const DISASTER_LINKS = [
  {
    label: "Help Providers",
    href: "/disaster-relief?tab=help-providers",
    icon: "volunteer_activism",
    page: "disaster-relief",
  },
  {
    label: "Resource Inventory",
    href: "/disaster-relief?tab=resource-inventory",
    icon: "inventory_2",
    page: "disaster-relief",
  },
  {
    label: "Relief Distributions",
    href: "/disaster-relief?tab=relief-distributions",
    icon: "redeem",
    page: "disaster-relief",
  },
];

const TASK_LINKS = [
  { label: "My Tasks", href: "/tasks", icon: "checklist", page: "tasks" },
  { label: "Task Analytics", href: "/tasks/analytics", icon: "insights", page: "task-analytics" },
];

const HR_LINKS = [
  { label: "Employees", href: "/hr", icon: "group", page: "employees" },
  { label: "Attendance Logs", href: "/hr/attendance", icon: "co_present", page: "attendance" },
  { label: "Leave Requests", href: "/hr/leaves", icon: "event_note", page: "leaves" },
];

const MANAGEMENT_LINKS = [
  { label: "Travel Management", href: "/travel/manage", icon: "flight_takeoff", page: "travel-management" },
  {
    label: "Reimbursement Management",
    href: "/reimbursements/manage",
    icon: "approval",
    page: "reimbursement-management",
  },
];

// Admin management links are always rendered. ADMIN bypasses permission checks.
const ADMIN_MANAGEMENT_LINKS = [
  ...HR_LINKS,
  ...MANAGEMENT_LINKS,
  { label: "Admin & Access", href: "/admin", icon: "admin_panel_settings", page: "admin" },
];

const SELF_SERVICE_LINKS = [
  { label: "My Leaves", href: "/hr/leaves/apply", icon: "event_available", page: "leaves" },
  { label: "Travel", href: "/travel", icon: "flight", page: "travel" },
  { label: "Reimbursements", href: "/reimbursements", icon: "receipt_long", page: "reimbursements" },
];

function permit(links, can) {
  const canFn = typeof can === "function" ? can : () => true;
  return (links || []).filter((link) => !link.page || canFn(link.page));
}

export function getDashboardSections(role, can) {
  const isAdmin = role === "ADMIN";
  const isFellow = role === "FELLOW";
  const isProgramRole = PROGRAM_ROLES.includes(role);

  // Fellows should not get directory-level education links.
  const educationLinks = isFellow
    ? EDUCATION_LINKS.filter(
        (link) => link.href !== "/education/fellows" && link.href !== "/education/pta"
      )
    : EDUCATION_LINKS;

  const sections = [
    ...(isFellow
      ? [
          {
            id: "workspace",
            title: "My Profile",
            icon: "person",
            tone: "sky",
            links: FELLOW_WORKSPACE_LINKS,
          },
        ]
      : []),
    {
      id: "tasks",
      title: "Tasks",
      icon: "checklist",
      tone: "violet",
      links: permit(
        TASK_LINKS.map((link) =>
          link.href === "/tasks" && isAdmin ? { ...link, label: "All Tasks" } : link
        ),
        can
      ),
    },
    {
      id: "education",
      title: "Education",
      icon: "school",
      tone: "emerald",
      links: permit(educationLinks, can),
    },
    {
      id: "observations",
      title: "Fellow Observations",
      icon: "rate_review",
      tone: "emerald",
      links: permit(OBSERVATION_LINKS, can),
    },
    {
      id: "livelihood",
      title: "Livelihood",
      icon: "agriculture",
      tone: "amber",
      links: permit(LIVELIHOOD_LINKS, can),
    },
    {
      id: "disaster",
      title: "Disaster Management",
      icon: "emergency",
      tone: "rose",
      links: permit(DISASTER_LINKS, can),
    },
  ];

  if (isAdmin) {
    sections.push({
      id: "management",
      title: "Administration",
      icon: "admin_panel_settings",
      tone: "slate",
      links: ADMIN_MANAGEMENT_LINKS,
    });
  } else {
    if (role === "HR" || isProgramRole) {
      sections.push({
        id: "hr",
        title: "HR",
        icon: "diversity_3",
        tone: "violet",
        links: permit(HR_LINKS, can),
      });
    }

    if (isProgramRole) {
      sections.push({
        id: "management",
        title: "Management",
        icon: "approval",
        tone: "slate",
        links: permit(MANAGEMENT_LINKS, can),
      });
    }

    const selfService = permit(SELF_SERVICE_LINKS, can).map((link) =>
      link.page === "leaves" && role !== "FELLOW"
        ? { ...link, label: "Leave Application" }
        : link
    );
    if (selfService.length) {
      sections.push({
        id: "self-service",
        title: "Self Service",
        icon: "badge",
        tone: "sky",
        links: selfService,
      });
    }
  }

  return sections.filter((section) => section.links.length > 0);
}

export function getDashboardKpiConfig(role) {
  if (role === "FELLOW") {
    return [
      { key: "schools", label: "Assigned Schools", icon: "school", tone: "emerald" },
      { key: "afterSchools", label: "Assigned After Schools", icon: "cottage", tone: "emerald" },
      { key: "students", label: "Students", icon: "groups", tone: "emerald" },
      { key: "afterSchoolStudents", label: "After School Students", icon: "escalator_warning", tone: "emerald" },
    ];
  }

  if (role === "PROGRAM_MANAGER" || role === "ACCOUNTANT" || role === "PROGRAM_COORDINATOR" || role === "FIELD_EXECUTIVE" || role === "PROGRAM_DIRECTOR" || role === "PROGRAM_LEAD" || role === "CLASS_ASSISTANT") {
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
