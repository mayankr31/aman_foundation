function pad(value) {
  return String(value).padStart(2, "0");
}

/**
 * Format any date value as DD-MM-YYYY.
 * Date-only strings (YYYY-MM-DD) are parsed directly to avoid timezone shifts.
 */
export function formatDate(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;

  if (typeof value === "string") {
    // Only short-circuit pure date strings. Datetime values are converted
    // through the local timezone, matching how they were displayed before.
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/**
 * Format a date value as DD-MM-YYYY HH:mm.
 */
export function formatDateTime(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return `${formatDate(value, fallback)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
