export const BENEFICIARY_TABS = [
  { label: "Program History", slug: "program-history" },
  { label: "Family Directory", slug: "family-directory" },
  { label: "ID Proofs & Bank Details", slug: "id-proofs-bank-details" },
  { label: "Impact Summary", slug: "impact-summary" },
  { label: "Income Tracking", slug: "income-tracking" },
  { label: "KYOR Form", slug: "kyor-form" },
  { label: "Adaptive Capacity", slug: "adaptive-capacity" },
  { label: "Absorptive Capacity", slug: "absorptive-capacity" },
  { label: "Transformative Capacity", slug: "transformative-capacity" },
  { label: "Vulnerability", slug: "vulnerability" },
  { label: "Solution Board & Planning", slug: "solution-board-planning" },
  { label: "Migration History", slug: "migration-history" },
];

export const DEFAULT_BENEFICIARY_TAB = "Program History";

export function labelFromSlug(slug) {
  if (!slug) return null;
  const tab = BENEFICIARY_TABS.find((t) => t.slug === slug);
  return tab ? tab.label : null;
}

export function slugFromLabel(label) {
  if (!label) return null;
  const tab = BENEFICIARY_TABS.find((t) => t.label === label);
  return tab ? tab.slug : null;
}
