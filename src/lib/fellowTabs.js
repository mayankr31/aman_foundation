export const FELLOW_TABS = [
  { label: "Personal Details", slug: "personal-details", icon: "badge" },
  { label: "Monthly Planner", slug: "monthly-planner", icon: "calendar_month" },
  { label: "Assignments", slug: "assignments", icon: "assignment_ind" },
  { label: "LDJC", slug: "ldjc", icon: "flag" },
  {
    label: "Observational Debrief Conversation",
    slug: "observational-debrief",
    icon: "rate_review",
  },
  { label: "Engagement Survey", slug: "engagement-survey", icon: "fact_check" },
  { label: "Post Fellowship Survey", slug: "post-fellowship-survey", icon: "travel_explore" },
  {
    label: "Individual Feedback Tracking",
    slug: "individual-feedback",
    icon: "forum",
  },
];

export const DEFAULT_TAB_SLUG = "personal-details";

export const LEAVE_DETAILS_TAB = {
  label: "Leave Details",
  slug: "leave-details",
  icon: "beach_access",
};

// Extra tab shown on the admin/HR fellow detail page only. The fellow's own
// /profile workspace keeps using FELLOW_TABS above.
export const FELLOW_DETAIL_TABS = [...FELLOW_TABS, LEAVE_DETAILS_TAB];

export function labelFromSlug(slug) {
  if (!slug) return null;
  const tab = FELLOW_TABS.find((t) => t.slug === slug);
  return tab ? tab.label : null;
}

export function labelFromDetailSlug(slug) {
  if (!slug) return null;
  const tab = FELLOW_DETAIL_TABS.find((t) => t.slug === slug);
  return tab ? tab.label : null;
}

export function slugFromLabel(label) {
  if (!label) return null;
  const tab = FELLOW_TABS.find((t) => t.label === label);
  return tab ? tab.slug : null;
}

export const FELLOW_WORKSPACE_LINKS = FELLOW_TABS.map((tab) => ({
  label: tab.label,
  href: `/profile?tab=${tab.slug}`,
  icon: tab.icon,
}));
