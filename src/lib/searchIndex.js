import { FELLOW_TABS } from "@/lib/fellowTabs";
import { BENEFICIARY_TABS } from "@/lib/beneficiaryTabs";

// Central registry of every navigable page, tab and section in the app.
//
// Entry shape:
//   id       - stable unique id
//   label    - primary display text
//   path     - breadcrumb segments, e.g. ["Education", "Fellows", "Goals"]
//   keywords - extra search terms / synonyms
//   href     - string, or ({ user, roleName }) => string
//   page     - permission page key (PAGE_KEYS) or null for open routes
//   group    - used to group results in the UI
//   icon     - material symbols icon name

const FELLOW_PROFILE_PATH = (label) => ["Education", "Fellows", "Fellow Profile", label];

const FELLOW_TAB_KEYWORDS = {
  "personal-details": ["personal", "profile", "basic details", "contact", "address"],
  "monthly-planner": ["planner", "monthly plan", "schedule", "calendar"],
  goals: ["goal", "goal sheet", "goals sheet", "target", "targets", "objectives"],
  "coaching-observation": ["coaching", "observation", "classroom", "classroom observation"],
  "engagement-survey": ["survey", "engagement", "student survey"],
  "look-beyond-survey": ["survey", "look beyond", "survey"],
  "individual-feedback": ["feedback", "individual feedback", "tracking"],
};

const FELLOW_TAB_ENTRIES = FELLOW_TABS.map((tab) => ({
  id: `fellow-tab-${tab.slug}`,
  label: tab.label,
  path: FELLOW_PROFILE_PATH(tab.label),
  keywords: [tab.label, ...(FELLOW_TAB_KEYWORDS[tab.slug] || [])],
  href: ({ roleName }) =>
    roleName === "FELLOW" ? `/profile?tab=${tab.slug}` : "/education/fellows",
  page: "education",
  group: "Fellow Profile",
  icon: tab.icon,
}));

const BENEFICIARY_TAB_KEYWORDS = {
  "program-history": ["program", "programs", "program history", "events"],
  "family-directory": ["family", "household", "members", "directory"],
  "id-proofs-bank-details": ["id proof", "id proofs", "bank", "bank details", "aadhaar", "documents"],
  "impact-summary": ["impact", "summary"],
  "income-tracking": ["income", "earnings", "livelihood income"],
  "kyr-form": ["kyr", "know your resilience", "resilience", "resilience measurement tool", "survey"],
  "adaptive-capacity": ["adaptive", "adaptive capacity", "capacity"],
  "absorptive-capacity": ["absorptive", "absorptive capacity", "capacity"],
  "transformative-capacity": ["transformative", "transformative capacity", "capacity"],
  vulnerability: ["vulnerability", "shocks", "household assessment"],
  "solution-board-planning": ["solution", "solution board", "planning", "plan"],
  "migration-history": ["migration", "migrated", "history"],
};

const BENEFICIARY_TAB_ENTRIES = BENEFICIARY_TABS.map((tab) => ({
  id: `beneficiary-tab-${tab.slug}`,
  label: tab.label,
  path: ["Livelihood", "Beneficiaries", "Beneficiary Profile", tab.label],
  keywords: [tab.label, ...(BENEFICIARY_TAB_KEYWORDS[tab.slug] || [])],
  href: "/beneficiaries",
  page: "livelihood",
  group: "Beneficiary Profile",
  icon: "menu_book",
}));

const STUDENT_SECTIONS = [
  { label: "Academic Assessments", anchor: "academic-assessments", keywords: ["assessment", "assessments", "academic", "baseline", "midline", "endline", "fln", "sel"], icon: "analytics" },
  { label: "Attendance Ledger", anchor: "attendance-ledger", keywords: ["attendance", "attendance ledger", "present", "absent"], icon: "event_available" },
  { label: "Learning Assessment History", anchor: "learning-assessment-history", keywords: ["learning assessment", "reading", "fluency"], icon: "menu_book" },
  { label: "Homework History", anchor: "homework-history", keywords: ["homework", "assignment"], icon: "assignment" },
  { label: "School Transition History", anchor: "transition-history", keywords: ["transition", "school change", "transfer"], icon: "swap_horiz" },
  { label: "Dropout Risk", anchor: "dropout-risk", keywords: ["dropout", "risk", "attrition"], icon: "warning" },
  { label: "Program Linkages", anchor: "program-linkages", keywords: ["program", "linkage", "linkages", "partner"], icon: "hub" },
  { label: "Demographics & Enrolment Records", anchor: "demographics", keywords: ["demographics", "enrolment", "enrollment", "details"], icon: "badge" },
];

const STUDENT_SECTION_ENTRIES = STUDENT_SECTIONS.map((s) => ({
  id: `student-section-${s.anchor}`,
  label: s.label,
  path: ["Education", "Students", "Student Profile", s.label],
  keywords: [s.label, ...s.keywords],
  href: "/education/students",
  page: "education",
  group: "Student Profile",
  icon: s.icon,
}));

const AFTER_SCHOOL_STUDENT_SECTION_ENTRIES = STUDENT_SECTIONS.filter((s) =>
  ["academic-assessments", "attendance-ledger", "learning-assessment-history", "homework-history", "transition-history", "dropout-risk", "program-linkages", "demographics"].includes(s.anchor)
).map((s) => ({
  id: `after-school-student-section-${s.anchor}`,
  label: s.label,
  path: ["Education", "After School Students", "Student Profile", s.label],
  keywords: [s.label, ...s.keywords, "after school"],
  href: "/education/after-school-students",
  page: "education",
  group: "After School Student Profile",
  icon: s.icon,
}));

const FACILITY_SECTIONS = [
  { label: "Daily Attendance", anchor: "daily-attendance", keywords: ["attendance", "daily attendance", "calendar", "present", "absent"], icon: "event_available" },
  { label: "Active Program Participation", anchor: "active-programs", keywords: ["program", "participation", "programs"], icon: "hub" },
  { label: "Enrolled Students", anchor: "enrolled-students", keywords: ["students", "enrolled", "enrolment"], icon: "groups" },
  { label: "Student Data", anchor: "student-data", keywords: ["student data", "learner", "assessment", "fln", "levels", "growth", "export"], icon: "monitoring" },
  { label: "School Metrics", anchor: "metrics", keywords: ["metrics", "stats", "statistics"], icon: "insights" },
  { label: "Gender Ratio", anchor: "gender-ratio", keywords: ["gender", "ratio", "boys", "girls"], icon: "pie_chart" },
  { label: "Assigned Fellows", anchor: "assigned-fellows", keywords: ["fellows", "assigned", "staff"], icon: "person" },
  { label: "Assigned Staff", anchor: "assigned-staff", keywords: ["staff", "assigned", "employees"], icon: "badge" },
];

const SCHOOL_SECTION_ENTRIES = FACILITY_SECTIONS.map((s) => ({
  id: `school-section-${s.anchor}`,
  label: s.label,
  path: ["Education", "Schools", "School Profile", s.label],
  keywords: [s.label, ...s.keywords],
  href: "/education/schools",
  page: "education",
  group: "School Profile",
  icon: s.icon,
}));

const CENTRE_SECTION_ENTRIES = FACILITY_SECTIONS.map((s) => ({
  id: `centre-section-${s.anchor}`,
  label: s.label,
  path: ["Education", "After School Centres", "Centre Profile", s.label],
  keywords: [s.label, ...s.keywords, "centre", "center"],
  href: "/education/after-school-centres",
  page: "education",
  group: "After School Centre Profile",
  icon: s.icon,
}));

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Build a batch of entries that live inside a page/modal and link to the parent.
const modalTabs = ({ idPrefix, labels, path, href, page, group, icon, keywords = [] }) =>
  labels.map((label) => ({
    id: `${idPrefix}-${slugify(label)}`,
    label,
    path: [...path, label],
    keywords: [label, ...keywords],
    href,
    page,
    group,
    icon,
  }));

// ── In-page / modal tab entries (all link to their parent page) ─────────────
const MODAL_ENTRIES = [
  // Student academic assessment form
  ...modalTabs({
    idPrefix: "student-assessment-form",
    labels: ["Basic Info", "Enrollment", "Subjects", "RF", "SEL"],
    path: ["Education", "Students", "Student Profile", "Academic Assessments"],
    href: "/education/students",
    page: "education",
    group: "Student Profile",
    icon: "assignment",
    keywords: ["assessment form", "new assessment", "student assessment"],
  }),
  // Student assessment templates
  ...modalTabs({
    idPrefix: "student-assessment-template",
    labels: ["RF", "SEL", "Subjects"],
    path: ["Education", "Students", "Student Profile", "Academic Assessments", "Assessment Templates"],
    href: "/education/students",
    page: "education",
    group: "Student Profile",
    icon: "tune",
    keywords: ["template", "assessment template", "manage templates"],
  }),
  // After-school academic assessment form
  ...modalTabs({
    idPrefix: "after-school-assessment-form",
    labels: ["Basic Info", "Enrollment", "Subjects", "RF"],
    path: ["Education", "After School Students", "Student Profile", "Academic Assessments"],
    href: "/education/after-school-students",
    page: "education",
    group: "After School Student Profile",
    icon: "assignment",
    keywords: ["assessment form", "new assessment", "after school"],
  }),
  // Beneficiary edit modal tabs
  ...modalTabs({
    idPrefix: "beneficiary-edit",
    labels: ["Personal & Income", "IDs & Bank Details", "Family Registry", "Livestock Inventory", "Programs"],
    path: ["Livelihood", "Beneficiaries", "Beneficiary Profile", "Edit Beneficiary"],
    href: "/beneficiaries",
    page: "livelihood",
    group: "Beneficiary Profile",
    icon: "edit",
    keywords: ["edit beneficiary", "edit profile"],
  }),
  // School manage modals
  ...modalTabs({
    idPrefix: "school-manage",
    labels: ["Manage Programs", "Manage Students", "Manage Fellows", "Manage Staff"],
    path: ["Education", "Schools", "School Profile"],
    href: "/education/schools",
    page: "education",
    group: "School Profile",
    icon: "settings",
    keywords: ["school", "manage"],
  }),
  // After-school centre manage modals
  ...modalTabs({
    idPrefix: "centre-manage",
    labels: ["Manage Programs", "Manage Students", "Manage Fellows", "Manage Staff"],
    path: ["Education", "After School Centres", "Centre Profile"],
    href: "/education/after-school-centres",
    page: "education",
    group: "After School Centre Profile",
    icon: "settings",
    keywords: ["centre", "center", "manage"],
  }),
  // Admin modals
  ...modalTabs({
    idPrefix: "admin-modal",
    labels: ["Create User", "User Permissions", "Role Permissions", "Reset Password", "Add Role"],
    path: ["Admin & Access"],
    href: "/admin",
    page: "admin",
    group: "Admin",
    icon: "settings",
    keywords: ["admin"],
  }),
];

export const SEARCH_ENTRIES = [
  // ── Top-level / hubs ──────────────────────────────────────────────
  { id: "dashboard", label: "Dashboard", path: ["Dashboard"], keywords: ["home", "overview", "kpi"], href: "/", page: null, group: "General", icon: "dashboard" },
  { id: "my-profile", label: "My Profile", path: ["My Profile"], keywords: ["profile", "account", "settings", "me"], href: "/profile", page: null, group: "General", icon: "person" },
  { id: "education-hub", label: "Education", path: ["Education"], keywords: ["school", "students", "education hub"], href: "/education", page: "education", group: "Education", icon: "school" },
  { id: "livelihood-hub", label: "Livelihood", path: ["Livelihood"], keywords: ["farm", "non-farm", "programs"], href: "/livelihood", page: "livelihood", group: "Livelihood", icon: "agriculture" },
  { id: "disaster-relief", label: "Disaster Relief", path: ["Disaster Relief"], keywords: ["relief", "calamity", "disaster"], href: "/disaster-relief", page: "disaster-relief", group: "General", icon: "emergency" },
  { id: "employees", label: "Employees", path: ["HR", "Employees"], keywords: ["hr", "staff", "employees", "directory"], href: "/hr", page: "employees", group: "HR", icon: "group" },
  { id: "attendance-logs", label: "Attendance Logs", path: ["HR", "Attendance Logs"], keywords: ["attendance", "staff attendance", "login", "logs"], href: "/hr/attendance", page: "attendance", group: "HR", icon: "event_available" },
  { id: "employee-profile-hub", label: "Employee Profile", path: ["HR", "Employees", "Employee Profile"], keywords: ["employee profile", "staff profile", "employee detail"], href: "/hr", page: "employees", group: "HR", icon: "badge" },
  { id: "employee-attendance-details", label: "Employee Attendance Details", path: ["HR", "Attendance Logs", "Employee Attendance Details"], keywords: ["employee attendance", "attendance details", "monthly attendance"], href: "/hr/attendance", page: "attendance", group: "HR", icon: "calendar_month" },
  { id: "leave-requests", label: "Leave Requests", path: ["HR", "Leave Requests"], keywords: ["leaves", "leave", "requests", "approve"], href: "/hr/leaves", page: "leaves", group: "HR", icon: "event_note" },
  { id: "leave-apply", label: "Leave Application", path: ["HR", "Leave Application"], keywords: ["leaves", "leave", "apply", "self service"], href: "/hr/leaves/apply", page: "leaves", group: "HR", icon: "event_note" },
  { id: "travel", label: "Travel", path: ["Travel"], keywords: ["travel", "requests", "trip"], href: "/travel", page: "travel", group: "General", icon: "flight" },
  { id: "travel-manage", label: "Travel Management", path: ["Travel Management"], keywords: ["travel", "manage", "approve", "trip"], href: "/travel/manage", page: "travel-management", group: "General", icon: "flight_takeoff" },
  { id: "admin", label: "Admin & Access", path: ["Admin & Access"], keywords: ["admin", "access", "users", "roles"], href: "/admin", page: "admin", group: "Admin", icon: "admin_panel_settings" },

  // ── Education ─────────────────────────────────────────────────────
  { id: "fellows", label: "Fellows", path: ["Education", "Fellows"], keywords: ["fellows", "fellow", "progress tracking"], href: "/education/fellows", page: "education", group: "Education", icon: "person" },
  { id: "students", label: "Students", path: ["Education", "Students"], keywords: ["students", "student directory", "learners"], href: "/education/students", page: "education", group: "Education", icon: "groups" },
  { id: "schools", label: "Schools", path: ["Education", "Schools"], keywords: ["schools", "school directory"], href: "/education/schools", page: "education", group: "Education", icon: "school" },
  { id: "after-school-students", label: "After School Students", path: ["Education", "After School Students"], keywords: ["after school", "students", "centres"], href: "/education/after-school-students", page: "education", group: "Education", icon: "escalator_warning" },
  { id: "after-school-centres", label: "After School Centres", path: ["Education", "After School Centres"], keywords: ["after school", "centres", "center"], href: "/education/after-school-centres", page: "education", group: "Education", icon: "home_work" },
  { id: "pta", label: "PTA & Programs", path: ["Education", "PTA & Programs"], keywords: ["pta", "programs", "program", "events", "meetings"], href: "/education/pta", page: "education", group: "Education", icon: "handshake" },
  { id: "pta-programs", label: "PTA Programs", path: ["Education", "PTA & Programs", "Programs"], keywords: ["pta programs", "programs", "program"], href: "/education/pta", page: "education", group: "Education", icon: "handshake" },
  { id: "fellow-profile-hub", label: "Fellow Profile", path: ["Education", "Fellows", "Fellow Profile"], keywords: ["fellow profile", "fellow detail", "profile"], href: ({ roleName }) => (roleName === "FELLOW" ? "/profile" : "/education/fellows"), page: "education", group: "Fellow Profile", icon: "person" },
  { id: "student-profile-hub", label: "Student Profile", path: ["Education", "Students", "Student Profile"], keywords: ["student profile", "student detail", "profile"], href: "/education/students", page: "education", group: "Student Profile", icon: "badge" },
  { id: "after-school-student-profile-hub", label: "After School Student Profile", path: ["Education", "After School Students", "Student Profile"], keywords: ["after school student profile", "student detail"], href: "/education/after-school-students", page: "education", group: "After School Student Profile", icon: "badge" },
  { id: "school-profile-hub", label: "School Profile", path: ["Education", "Schools", "School Profile"], keywords: ["school profile", "school detail", "profile"], href: "/education/schools", page: "education", group: "School Profile", icon: "badge" },
  { id: "centre-profile-hub", label: "After School Centre Profile", path: ["Education", "After School Centres", "Centre Profile"], keywords: ["centre profile", "center profile", "centre detail"], href: "/education/after-school-centres", page: "education", group: "After School Centre Profile", icon: "badge" },
  { id: "pm-reflection", label: "PM Reflection", path: ["Fellow Observations", "PM Reflection"], keywords: ["pm", "reflection", "leadership", "competency"], href: "/fellow-observations/pm-reflection", page: "fellow-observations", group: "Fellow Observations", icon: "rate_review" },
  { id: "pm-reflection-history", label: "History", path: ["Fellow Observations", "PM Reflection", "History"], keywords: ["history", "reflections", "past reflections"], href: "/fellow-observations/pm-reflection", page: "fellow-observations", group: "Fellow Observations", icon: "history" },
  { id: "fellow-performance", label: "Fellow Performance", path: ["Fellow Observations", "Fellow Performance"], keywords: ["performance", "observation", "classroom", "scores"], href: "/fellow-observations/fellow-performance", page: "fellow-observations", group: "Fellow Observations", icon: "insights" },
  { id: "fellow-performance-ratings", label: "Manage Ratings", path: ["Fellow Observations", "Fellow Performance", "Manage Ratings"], keywords: ["manage ratings", "ratings", "categories"], href: "/fellow-observations/fellow-performance", page: "fellow-observations", group: "Fellow Observations", icon: "tune" },

  // ── Livelihood ────────────────────────────────────────────────────
  { id: "farm-programs", label: "Farm Programs", path: ["Livelihood", "Farm Programs"], keywords: ["farm", "cultivation", "sugarcane", "maize", "rice", "programs"], href: "/livelihood/farm", page: "livelihood", group: "Livelihood", icon: "agriculture" },
  { id: "non-farm-programs", label: "Non-Farm Programs", path: ["Livelihood", "Non-Farm Programs"], keywords: ["non farm", "non-farm", "livestock", "goat", "fish", "poultry", "programs"], href: "/livelihood/non-farm", page: "livelihood", group: "Livelihood", icon: "pets" },
  { id: "beneficiaries", label: "Beneficiaries", path: ["Livelihood", "Beneficiaries"], keywords: ["beneficiaries", "beneficiary", "families", "master registry"], href: "/beneficiaries", page: "livelihood", group: "Livelihood", icon: "diversity_3" },
  { id: "beneficiary-profile-hub", label: "Beneficiary Profile", path: ["Livelihood", "Beneficiaries", "Beneficiary Profile"], keywords: ["beneficiary profile", "beneficiary detail", "family profile"], href: "/beneficiaries", page: "livelihood", group: "Beneficiary Profile", icon: "badge" },
  { id: "beneficiary-solution-plan", label: "Solution Plan", path: ["Livelihood", "Beneficiaries", "Beneficiary Profile", "Solution Board & Planning", "Solution Plan"], keywords: ["solution plan", "plan", "create plan", "edit plan"], href: "/beneficiaries", page: "livelihood", group: "Beneficiary Profile", icon: "checklist" },
  { id: "beneficiary-solution-board-ref", label: "Resilience Solution Board", path: ["Livelihood", "Beneficiaries", "Beneficiary Profile", "Solution Board & Planning", "Resilience Solution Board"], keywords: ["solution board", "reference", "resilience board"], href: "/beneficiaries", page: "livelihood", group: "Beneficiary Profile", icon: "dashboard_customize" },
  { id: "beneficiary-survey-responses", label: "Survey Responses", path: ["Livelihood", "Beneficiaries", "Beneficiary Profile", "Survey Responses"], keywords: ["survey response", "responses", "kyr response", "capacity response"], href: "/beneficiaries", page: "livelihood", group: "Beneficiary Profile", icon: "fact_check" },
  { id: "farm-program-events", label: "Log Farm Program Event", path: ["Livelihood", "Farm Programs", "Program", "Log Event"], keywords: ["event", "events", "log event", "farm event", "activity"], href: "/livelihood/farm", page: "livelihood", group: "Livelihood", icon: "event" },
  { id: "non-farm-program-events", label: "Log Non-Farm Program Event", path: ["Livelihood", "Non-Farm Programs", "Program", "Log Event"], keywords: ["event", "events", "log event", "non farm event", "activity"], href: "/livelihood/non-farm", page: "livelihood", group: "Livelihood", icon: "event" },
  { id: "pta-program-events", label: "PTA Events & Meetings", path: ["Education", "PTA & Programs", "Events"], keywords: ["event", "events", "meeting", "pta event", "log event"], href: "/education/pta", page: "education", group: "Education", icon: "event" },
  { id: "sugarcane", label: "Sugarcane Cultivation", path: ["Livelihood", "Sugarcane Cultivation"], keywords: ["sugarcane", "cane", "farm"], href: "/livelihood/sugarcane", page: "livelihood", group: "Livelihood", icon: "agriculture" },
  { id: "goat-rearing", label: "Goat Rearing", path: ["Livelihood", "Goat Rearing"], keywords: ["goat", "rearing", "livestock"], href: "/livelihood/goat-rearing", page: "livelihood", group: "Livelihood", icon: "pets" },

  // ── Admin tabs ────────────────────────────────────────────────────
  { id: "admin-users", label: "Active Users", path: ["Admin & Access", "Active Users"], keywords: ["admin", "users", "active"], href: "/admin?tab=users", page: "admin", group: "Admin", icon: "group" },
  { id: "admin-deactivated", label: "Deactivated Users", path: ["Admin & Access", "Deactivated Users"], keywords: ["admin", "deactivated", "inactive", "users"], href: "/admin?tab=deactivated", page: "admin", group: "Admin", icon: "person_off" },
  { id: "admin-approvals", label: "Approvals Queue", path: ["Admin & Access", "Approvals Queue"], keywords: ["admin", "approvals", "queue", "pending"], href: "/admin?tab=approvals", page: "admin", group: "Admin", icon: "how_to_reg" },
  { id: "admin-roles", label: "Role Switches", path: ["Admin & Access", "Role Switches"], keywords: ["admin", "roles", "permissions"], href: "/admin?tab=roles", page: "admin", group: "Admin", icon: "shield" },

  // ── Disaster Relief tabs ──────────────────────────────────────────
  { id: "dr-help-providers", label: "Help Providers", path: ["Disaster Relief", "Help Providers"], keywords: ["disaster", "relief", "providers", "responders", "roster"], href: "/disaster-relief?tab=help-providers", page: "disaster-relief", group: "Disaster Relief", icon: "volunteer_activism" },
  { id: "dr-resource-inventory", label: "Resource Inventory", path: ["Disaster Relief", "Resource Inventory"], keywords: ["disaster", "relief", "resources", "inventory", "needs"], href: "/disaster-relief?tab=resource-inventory", page: "disaster-relief", group: "Disaster Relief", icon: "inventory_2" },
  { id: "dr-distributions", label: "Relief Distributions", path: ["Disaster Relief", "Relief Distributions"], keywords: ["disaster", "relief", "distributions", "transactions"], href: "/disaster-relief?tab=relief-distributions", page: "disaster-relief", group: "Disaster Relief", icon: "redeem" },

  // ── Generated sets ────────────────────────────────────────────────
  ...FELLOW_TAB_ENTRIES,
  ...BENEFICIARY_TAB_ENTRIES,
  ...STUDENT_SECTION_ENTRIES,
  ...AFTER_SCHOOL_STUDENT_SECTION_ENTRIES,
  ...SCHOOL_SECTION_ENTRIES,
  ...CENTRE_SECTION_ENTRIES,
  ...MODAL_ENTRIES,
];

// Preferred group order in the results dropdown.
export const SEARCH_GROUPS = [
  "General",
  "Education",
  "Fellow Profile",
  "Student Profile",
  "After School Student Profile",
  "School Profile",
  "After School Centre Profile",
  "Fellow Observations",
  "Livelihood",
  "Beneficiary Profile",
  "HR",
  "Disaster Relief",
  "Admin",
];

export function getEntryHref(entry, user) {
  const ctx = { user, roleName: user?.roleName };
  return typeof entry.href === "function" ? entry.href(ctx) : entry.href;
}
