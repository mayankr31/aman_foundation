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
  "attendance",
  "admin",
];

// Ordered [pathPrefix, pageKey]. More specific prefixes first.
export const ROUTE_PERMISSION_MAP = [
  ["/admin", "admin"],
  ["/education", "education"],
  ["/fellow-observations", "fellow-observations"],
  ["/livelihood", "livelihood"],
  ["/beneficiaries", "livelihood"],
  ["/disaster-relief", "disaster-relief"],
  ["/travel/manage", "travel-management"],
  ["/travel", "travel"],
  ["/hr/attendance", "attendance"],
  ["/attendance", "attendance"],
  ["/hr/leaves", "leaves"],
  ["/hr", "employees"],
];

// Routes that are always accessible to any authenticated user.
const OPEN_PATHS = ["/", "/profile"];

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
