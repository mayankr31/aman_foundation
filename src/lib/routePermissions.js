// Pure (client-safe) permission route metadata.
// Keep this file free of server-only imports so it can be used in client
// components (Sidebar, LayoutWrapper) as well as server helpers.

import {
  PAGE_KEYS,
  ROUTE_PERMISSION_MAP,
  expandPageKeys,
} from "@/lib/permissionCatalog";

export { PAGE_KEYS, ROUTE_PERMISSION_MAP, expandPageKeys };

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
