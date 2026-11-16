// Pure (client-safe) permission route metadata.
// Keep this file free of server-only imports so it can be used in client
// components (Sidebar, LayoutWrapper) as well as server helpers.

export const PAGE_KEYS = [
  "dashboard",
  "education",
  "fellow-observations",
  "livelihood",
  "disaster-relief",
  "employees",
  "leaves",
  "travel",
  "travel-management",
  "reimbursements",
  "reimbursement-management",
  "attendance",
  "self-attendance",
  "tasks",
  "task-analytics",
  "assets",
  "admin",
];

// Ordered [pathPrefix, pageKey]. More specific prefixes first.
export const ROUTE_PERMISSION_MAP = [
  ["/admin", "admin"],
  ["/assets", "assets"],
  ["/tasks", "tasks"],
  ["/education", "education"],
  ["/fellow-observations", "fellow-observations"],
  ["/livelihood", "livelihood"],
  ["/participants", "livelihood"],
  ["/beneficiaries", "livelihood"],
  ["/disaster-relief", "disaster-relief"],
  ["/travel/manage", "travel-management"],
  ["/travel", "travel"],
  ["/reimbursements/manage", "reimbursement-management"],
  ["/reimbursements", "reimbursements"],
  ["/hr/attendance", "attendance"],
  ["/attendance", "attendance"],
  ["/hr/leaves", "leaves"],
  ["/hr", "employees"],
];

// Routes that are always accessible to any authenticated user.
const OPEN_PATHS = ["/", "/profile"];

/** `/participants/<id>` (and its sub-pages) can also be opened by education users. */
export function isParticipantProfilePath(pathname) {
  if (!pathname) return false;
  const profileRoots = ["/participants", "/beneficiaries"];
  return profileRoots.some(
    (root) => pathname !== root && pathname !== `${root}/` && pathname.startsWith(`${root}/`)
  );
}

export function getPageForPath(pathname) {
  if (!pathname) return null;
  if (OPEN_PATHS.includes(pathname)) return null;
  for (const [prefix, page] of ROUTE_PERMISSION_MAP) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return page;
    }
  }
  return null;
}
