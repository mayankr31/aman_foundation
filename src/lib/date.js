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
 * Normalises a date value to an ISO date-only string (YYYY-MM-DD).
 * Date-only strings are kept as-is to avoid timezone shifts.
 */
export function toISODateOnly(value) {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const raw = String(value).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const localMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (localMatch) {
    return `${localMatch[3]}-${pad(localMatch[2])}-${pad(localMatch[1])}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Formats a date value for a text input as DD-MM-YYYY. */
export function formatDateInput(value) {
  const iso = toISODateOnly(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
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
