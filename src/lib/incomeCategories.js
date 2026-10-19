export const PRIMARY_INCOME_CATEGORIES = [
  "Agriculture",
  "Livestock",
  "Daily Wage",
  "Small Business",
  "Remittance",
  "Other",
];

export const DEFAULT_PRIMARY_INCOME = "Agriculture";

export function isKnownIncomeCategory(value) {
  return PRIMARY_INCOME_CATEGORIES.includes(value);
}
