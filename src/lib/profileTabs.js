import { FELLOW_TABS } from "@/lib/fellowTabs";

// Profile tabs for roles that do not have a fellow workspace.
export const STAFF_PROFILE_TABS = [
  { label: "Personal Details", slug: "personal-details", icon: "badge" },
  { label: "Monthly Planner", slug: "monthly-planner", icon: "calendar_month" },
  { label: "Assignments", slug: "assignments", icon: "assignment_ind" },
];

export const DEFAULT_STAFF_PROFILE_TAB = "Personal Details";

// Tabs used on the employee detail page (/hr/[id]).
// Employment and all personal details live together on the first tab.
export const EMPLOYEE_DETAIL_TABS = [
  { label: "Personal Details", slug: "personal-details", icon: "badge" },
  { label: "Monthly Planner", slug: "monthly-planner", icon: "calendar_month" },
  { label: "Assignments", slug: "assignments", icon: "assignment_ind" },
];

export const DEFAULT_EMPLOYEE_DETAIL_TAB = "Personal Details";

export function getProfileTabs(isFellow) {
  return isFellow ? FELLOW_TABS : STAFF_PROFILE_TABS;
}

export function profileLabelFromSlug(slug, isFellow) {
  if (!slug) return null;
  const tabs = getProfileTabs(isFellow);
  const tab = tabs.find((item) => item.slug === slug);
  return tab ? tab.label : null;
}
