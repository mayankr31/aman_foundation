const IST_OFFSET_MINUTES = 330;

function pad(value) {
  return String(value).padStart(2, "0");
}

/** Returns the YYYY-MM-DD calendar date in IST for a given instant. */
export function getISTDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Parses a YYYY-MM-DD key as a UTC date (used for comparisons). */
export function dateKeyToUTCDate(dateKey) {
  if (!dateKey) return null;
  const match = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/** Start of an IST day as a UTC Date. */
export function istDayStart(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000+05:30`);
}

/** End of an IST day as a UTC Date. */
export function istDayEnd(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T23:59:59.999+05:30`);
}

/** Formats an instant as a 12-hour IST time, e.g. 9:42:05 AM. */
export function formatISTTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

/** Formats a duration in seconds as H:MM:SS. */
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return `${hours}:${pad(minutes)}:${pad(remaining)}`;
}

/** Formats a duration in seconds as "Xh Ym". */
export function formatWorkHours(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/** Milliseconds until the next IST midnight. */
export function msUntilNextISTMidnight(now = new Date()) {
  const todayKey = getISTDateKey(now);
  const start = istDayStart(todayKey);
  if (!start) return 0;
  const next = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return Math.max(1000, next.getTime() - now.getTime());
}

/** True when the given instant belongs to an earlier IST day than today. */
export function isBeforeTodayIST(value, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return getISTDateKey(date) < getISTDateKey(now);
}
