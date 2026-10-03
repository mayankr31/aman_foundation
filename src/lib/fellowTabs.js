export const FELLOW_TABS = [
  { label: "Monthly Planner", slug: "monthly-planner", icon: "calendar_month" },
  { label: "Goals", slug: "goals", icon: "flag" },
  { label: "Student Data", slug: "student-data", icon: "groups" },
  {
    label: "After School Student Data",
    slug: "after-school-student-data",
    icon: "escalator_warning",
  },
  {
    label: "Coaching & Classroom Observation",
    slug: "coaching-observation",
    icon: "rate_review",
  },
  { label: "Engagement Survey", slug: "engagement-survey", icon: "fact_check" },
  { label: "Look Beyond Survey", slug: "look-beyond-survey", icon: "travel_explore" },
  {
    label: "Individual Feedback Tracking",
    slug: "individual-feedback",
    icon: "forum",
  },
];

export const DEFAULT_TAB_SLUG = "monthly-planner";

export function labelFromSlug(slug) {
  if (!slug) return null;
  const tab = FELLOW_TABS.find((t) => t.slug === slug);
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
