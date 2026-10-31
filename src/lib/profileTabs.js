import { FELLOW_TABS } from "@/lib/fellowTabs";
import { canRoleHaveTeamCheckIn } from "@/lib/teamCheckIn";

// Profile tabs for roles that do not have a fellow workspace.
export const STAFF_PROFILE_TABS = [
  { label: "Personal Details", slug: "personal-details", icon: "badge" },
  { label: "Monthly Planner", slug: "monthly-planner", icon: "calendar_month" },
  { label: "Assignments", slug: "assignments", icon: "assignment_ind" },
];

export const DEFAULT_STAFF_PROFILE_TAB = "Personal Details";

export const TEAM_CHECK_IN_TAB = {
  label: "Team CheckIn",
  slug: "team-checkin",
  icon: "fact_check",
};

// Tabs used on the employee detail page (/hr/[id]).
// Employment and all personal details live together on the first tab.
export const EMPLOYEE_DETAIL_TABS = [
  { label: "Personal Details", slug: "personal-details", icon: "badge" },
  { label: "Monthly Planner", slug: "monthly-planner", icon: "calendar_month" },
  { label: "Assignments", slug: "assignments", icon: "assignment_ind" },
];

export const DEFAULT_EMPLOYEE_DETAIL_TAB = "Personal Details";

function withTeamCheckInTab(tabs, roleName) {
  if (!canRoleHaveTeamCheckIn(roleName)) return tabs;
  return [...tabs, TEAM_CHECK_IN_TAB];
}

/**
 * Staff profiles do not need the Assignments tab for the Executive Director
 * (the ADMIN role). The planner remains available for personal task planning.
 * Every other role also gets the Team CheckIn tab; fellows never use this list.
 */
export function getStaffProfileTabs(roleName) {
  const tabs =
    roleName === "ADMIN"
      ? STAFF_PROFILE_TABS.filter((tab) => tab.slug !== "assignments")
      : STAFF_PROFILE_TABS;
  return withTeamCheckInTab(tabs, roleName);
}

export function getEmployeeDetailTabs(roleName) {
  const tabs =
    roleName === "ADMIN"
      ? EMPLOYEE_DETAIL_TABS.filter((tab) => tab.slug !== "assignments")
      : EMPLOYEE_DETAIL_TABS;
  return withTeamCheckInTab(tabs, roleName);
}

export function getProfileTabs(isFellow) {
  return isFellow ? FELLOW_TABS : STAFF_PROFILE_TABS;
}

export function profileLabelFromSlug(slug, isFellow) {
  if (!slug) return null;
  const tabs = getProfileTabs(isFellow);
  const tab = tabs.find((item) => item.slug === slug);
  return tab ? tab.label : null;
}
