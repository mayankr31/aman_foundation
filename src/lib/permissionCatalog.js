// Pure (client-safe) permission catalog.
//
// Every entry below is an individually hideable page in the Admin & Access
// permission modals. Keep this file free of server-only imports so it can be
// used by both client components and server helpers.

export const PERMISSION_GROUPS = [
  { id: "general", label: "General", order: 10 },
  { id: "hr", label: "HR", order: 20 },
  { id: "education", label: "Education", order: 30 },
  { id: "fellow-observations", label: "Fellow Observations", order: 40 },
  { id: "livelihood", label: "Livelihood", order: 50 },
];

// `routes` are the URL prefixes that this page owns. The route map is built by
// sorting every prefix by length (longest first) so nested pages win.
export const PERMISSION_PAGES = [
  // ── General ───────────────────────────────────────────────────────
  { key: "tasks", label: "Tasks", group: "general", order: 10, routes: ["/tasks"] },
  { key: "assets", label: "Assets", group: "general", order: 20, routes: ["/assets"] },
  {
    key: "disaster-relief",
    label: "Disaster Relief",
    group: "general",
    order: 30,
    routes: ["/disaster-relief"],
  },
  { key: "travel", label: "Travel", group: "general", order: 40, routes: ["/travel"] },
  {
    key: "travel-management",
    label: "Travel Management",
    group: "general",
    order: 50,
    routes: ["/travel/manage"],
  },
  {
    key: "reimbursements",
    label: "Reimbursements",
    group: "general",
    order: 60,
    routes: ["/reimbursements"],
  },
  {
    key: "reimbursement-management",
    label: "Reimbursement Management",
    group: "general",
    order: 70,
    routes: ["/reimbursements/manage"],
  },
  {
    key: "admin",
    label: "Admin & Access",
    group: "general",
    order: 80,
    routes: ["/admin"],
  },

  // ── HR ────────────────────────────────────────────────────────────
  { key: "employees", label: "Employees", group: "hr", order: 10, routes: ["/hr"] },
  {
    key: "attendance",
    label: "Attendance Logs",
    group: "hr",
    order: 20,
    routes: ["/hr/attendance", "/attendance"],
  },
  {
    key: "leaves",
    label: "Leave Management",
    group: "hr",
    order: 30,
    routes: ["/hr/leaves"],
  },

  // ── Education ─────────────────────────────────────────────────────
  {
    key: "education-hub",
    label: "Hub Overview",
    group: "education",
    order: 10,
    routes: ["/education"],
  },
  {
    key: "education-fellows",
    label: "Fellows",
    group: "education",
    order: 20,
    routes: ["/education/fellows"],
  },
  {
    key: "education-students",
    label: "Students",
    group: "education",
    order: 30,
    routes: ["/education/students"],
  },
  {
    key: "education-schools",
    label: "Schools",
    group: "education",
    order: 40,
    routes: ["/education/schools"],
  },
  {
    key: "education-after-school-students",
    label: "After School Students",
    group: "education",
    order: 50,
    routes: ["/education/after-school-students"],
  },
  {
    key: "education-after-school-centres",
    label: "After School Centres",
    group: "education",
    order: 60,
    routes: ["/education/after-school-centres"],
  },
  {
    key: "education-pta",
    label: "PTA & Programs",
    group: "education",
    order: 70,
    routes: ["/education/pta"],
  },

  // ── Fellow Observations ───────────────────────────────────────────
  {
    key: "fellow-observations-pm-reflection",
    label: "PM Reflection",
    group: "fellow-observations",
    order: 10,
    routes: ["/fellow-observations/pm-reflection"],
  },
  {
    key: "fellow-observations-fellow-performance",
    label: "Fellow Performance",
    group: "fellow-observations",
    order: 20,
    routes: ["/fellow-observations/fellow-performance"],
  },

  // ── Livelihood ────────────────────────────────────────────────────
  {
    key: "livelihood-hub",
    label: "Hub Overview",
    group: "livelihood",
    order: 10,
    routes: ["/livelihood"],
  },
  {
    key: "livelihood-farm",
    label: "Farm Programs",
    group: "livelihood",
    order: 20,
    routes: ["/livelihood/farm", "/livelihood/sugarcane"],
  },
  {
    key: "livelihood-non-farm",
    label: "Non-Farm Programs",
    group: "livelihood",
    order: 30,
    routes: ["/livelihood/non-farm", "/livelihood/goat-rearing"],
  },
  {
    key: "participants",
    label: "Participants",
    group: "livelihood",
    order: 40,
    routes: ["/participants", "/beneficiaries"],
  },
];

/**
 * Collection aggregates. These are NOT stored as permission rows anymore —
 * they are computed at runtime from their child pages. They remain useful for
 * existing API checks (`checkPermission(..., "education")`) and for shared
 * routes that any child page should be able to open.
 */
export const COLLECTION_PAGES = {
  education: [
    "education-hub",
    "education-fellows",
    "education-students",
    "education-schools",
    "education-after-school-students",
    "education-after-school-centres",
    "education-pta",
  ],
  "fellow-observations": [
    "fellow-observations-pm-reflection",
    "fellow-observations-fellow-performance",
  ],
  livelihood: [
    "livelihood-hub",
    "livelihood-farm",
    "livelihood-non-farm",
    "participants",
  ],
};

/** Routes shared by a whole collection (any child page grants access). */
const SHARED_ROUTE_PAGES = [
  ["/livelihood/programs", "livelihood"],
];

/** Page keys that are not editable in the modals but still resolve permissions. */
export const EXTRA_PAGE_KEYS = ["dashboard", "self-attendance", "task-analytics"];

export const EDITABLE_PAGE_KEYS = PERMISSION_PAGES.map((page) => page.key);

export const PAGE_KEYS = [...EXTRA_PAGE_KEYS, ...EDITABLE_PAGE_KEYS];

export const PAGE_KEY_SET = new Set(PAGE_KEYS);

const PAGE_BY_KEY = new Map(PERMISSION_PAGES.map((page) => [page.key, page]));

const GROUP_BY_ID = new Map(PERMISSION_GROUPS.map((group) => [group.id, group]));

/** Returns the child page keys for a collection key, or `[page]` otherwise. */
export function expandPageKeys(page) {
  if (!page) return [];
  return COLLECTION_PAGES[page] || [page];
}

/** True when `page` is a computed collection aggregate. */
export function isCollectionPage(page) {
  return Boolean(COLLECTION_PAGES[page]);
}

export function getPermissionPage(key) {
  return PAGE_BY_KEY.get(key) || null;
}

export function getPermissionGroup(groupId) {
  return GROUP_BY_ID.get(groupId) || null;
}

/** Editable pages grouped for the permission modals, in display order. */
export const PERMISSION_GROUPS_WITH_PAGES = PERMISSION_GROUPS.map((group) => ({
  ...group,
  pages: PERMISSION_PAGES.filter((page) => page.group === group.id).sort(
    (a, b) => a.order - b.order
  ),
})).filter((group) => group.pages.length > 0);

/** Ordered [pathPrefix, pageKey] pairs. Longest prefixes are matched first. */
export const ROUTE_PERMISSION_MAP = [
  ...PERMISSION_PAGES.flatMap((page) =>
    (page.routes || []).map((prefix) => [prefix, page.key])
  ),
  ...SHARED_ROUTE_PAGES,
].sort((a, b) => b[0].length - a[0].length);
