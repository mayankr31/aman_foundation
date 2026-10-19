import { FELLOW_WORKSPACE_LINKS } from "@/lib/fellowTabs";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const EDUCATION_LINKS = [
  { label: "Students", href: "/education/students", kpiKey: "students", icon: "groups" },
  { label: "Schools", href: "/education/schools", kpiKey: "schools", icon: "school" },
  {
    label: "After School Students",
    href: "/education/after-school-students",
    kpiKey: "afterSchoolStudents",
    icon: "escalator_warning",
  },
  {
    label: "After Schools",
    href: "/education/after-school-centres",
    kpiKey: "afterSchools",
    icon: "cottage",
  },
];

const PTA_LINK = { label: "PTA & Programs", href: "/education/pta", icon: "event" };

const FELLOWS_LINK = { label: "Fellows", href: "/education/fellows", kpiKey: "fellows", icon: "badge" };

const PM_REFLECTION_LINK = {
  label: "PM Reflection",
  href: "/fellow-observations/pm-reflection",
  icon: "rate_review",
};

const FELLOW_PERFORMANCE_LINK = {
  label: "Fellow Performance",
  href: "/fellow-observations/fellow-performance",
  icon: "monitoring",
};

const DISASTER_LINKS = [
  {
    label: "Help Providers",
    href: "/disaster-relief?tab=help-providers",
    icon: "volunteer_activism",
  },
  {
    label: "Resource Inventory",
    href: "/disaster-relief?tab=resource-inventory",
    icon: "inventory_2",
  },
  {
    label: "Relief Distributions",
    href: "/disaster-relief?tab=relief-distributions",
    icon: "redeem",
  },
];

const LIVELIHOOD_LINKS = [
  { label: "Farm Programs", href: "/livelihood/farm", kpiKey: "farmPrograms", icon: "agriculture" },
  {
    label: "Non-Farm Programs",
    href: "/livelihood/non-farm",
    kpiKey: "nonFarmPrograms",
    icon: "pets",
  },
  { label: "Beneficiaries", href: "/beneficiaries", kpiKey: "beneficiaries", icon: "volunteer_activism" },
];

const TEAM_LINKS = [
  { label: "Employees", href: "/hr", icon: "group" },
  { label: "Attendance", href: "/hr/attendance", icon: "co_present" },
  { label: "Leave Requests", href: "/hr/leaves", icon: "event_note" },
];

export function getDashboardSections(role, can) {
  if (role === "FELLOW") {
    return [
      {
        id: "workspace",
        title: "My Profile",
        icon: "person",
        tone: "sky",
        links: FELLOW_WORKSPACE_LINKS,
      },
      { id: "education", title: "Education", icon: "school", tone: "emerald", links: EDUCATION_LINKS },
      {
        id: "livelihood",
        title: "Livelihood",
        icon: "agriculture",
        tone: "amber",
        links: LIVELIHOOD_LINKS,
      },
    ];
  }

  const canManage = role === "ADMIN" || PROGRAM_ROLES.includes(role);
  const canViewDisaster = role === "ADMIN" || (typeof can === "function" && can("disaster-relief"));

  const educationLinks = [...EDUCATION_LINKS, PTA_LINK];
  if (canManage) {
    educationLinks.push(FELLOWS_LINK);
    if (role === "ADMIN") {
      educationLinks.push(PM_REFLECTION_LINK, FELLOW_PERFORMANCE_LINK);
    }
  }

  return [
    {
      id: "education",
      title: "Education",
      icon: "school",
      tone: "emerald",
      links: educationLinks,
    },
    {
      id: "livelihood",
      title: "Livelihood",
      icon: "agriculture",
      tone: "amber",
      links: LIVELIHOOD_LINKS,
    },
    ...(canViewDisaster
      ? [
          {
            id: "disaster",
            title: "Disaster Management",
            icon: "emergency",
            tone: "rose",
            links: DISASTER_LINKS,
          },
        ]
      : []),
    ...(canManage
      ? [
          {
            id: "team",
            title: "HR",
            icon: "diversity_3",
            tone: "violet",
            links: TEAM_LINKS,
          },
        ]
      : []),
  ];
}

export function getDashboardKpiConfig(role) {
  if (role === "FELLOW") {
    return [
      { key: "schools", label: "Assigned Schools", icon: "school", tone: "emerald" },
      { key: "afterSchools", label: "Assigned After Schools", icon: "cottage", tone: "emerald" },
      { key: "students", label: "Students", icon: "groups", tone: "emerald" },
      { key: "afterSchoolStudents", label: "After School Students", icon: "escalator_warning", tone: "emerald" },
      { key: "farmPrograms", label: "Farm Programs", icon: "agriculture", tone: "amber" },
      { key: "nonFarmPrograms", label: "Non-Farm Programs", icon: "pets", tone: "amber" },
      { key: "beneficiaries", label: "Beneficiaries", icon: "volunteer_activism", tone: "amber" },
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
