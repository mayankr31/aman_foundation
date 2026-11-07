// Shared HR page links. Visibility is always permission-driven so role-name
// checks cannot hide a page that an admin has explicitly granted.
export const HR_PAGE_LINKS = [
  {
    key: "employees",
    label: "Employees",
    href: "/hr",
    icon: "group",
    page: "employees",
  },
  {
    key: "attendance",
    label: "Attendance Logs",
    href: "/hr/attendance",
    icon: "co_present",
    page: "attendance",
  },
  {
    key: "leaves",
    label: "Leave Management",
    href: "/hr/leaves",
    icon: "event_note",
    page: "leaves",
  },
];

export function getHrPageLinks(can) {
  const canFn = typeof can === "function" ? can : () => false;
  return HR_PAGE_LINKS.filter((link) => canFn(link.page));
}
