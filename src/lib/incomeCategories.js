export const PRIMARY_INCOME_CATEGORIES = [
  "Agriculture",
  "Livestock",
  "Daily Wage",
  "Small Business",
  "Remittance",
  "Other",
];

export const DEFAULT_PRIMARY_INCOME = "Agriculture";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_OPTIONS = MONTH_NAMES.map((label, index) => ({
  value: index + 1,
  label,
}));

export function isKnownIncomeCategory(value) {
  return PRIMARY_INCOME_CATEGORIES.includes(value);
}

/**
 * Returns the month/year an income record belongs to. Newer records store the
 * period explicitly; older records fall back to their incomeDate.
 */
export function getIncomePeriod(record) {
  const month = Number(record?.incomeMonth);
  const year = Number(record?.incomeYear);
  if (Number.isInteger(month) && Number.isInteger(year) && month >= 1 && month <= 12 && year > 0) {
    return { month, year };
  }

  const date = new Date(record?.incomeDate);
  if (Number.isNaN(date.getTime())) return { month: null, year: null };
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

export function formatIncomePeriod(month, year, fallback = "—") {
  const numericMonth = Number(month);
  const numericYear = Number(year);
  if (numericMonth < 1 || numericMonth > 12 || !numericYear) return fallback;
  return `${MONTH_NAMES[numericMonth - 1]} ${numericYear}`;
}

