import { getISTDateKey, istDayEnd, istDayStart } from "@/lib/time";

export const LIVELIHOOD_ACTIVITY_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Blocked",
  "Cancelled",
];

export const LIVELIHOOD_ACTIVITY_STATUS_TONES = {
  Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Blocked: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function isValidActivityStatus(value) {
  return LIVELIHOOD_ACTIVITY_STATUSES.includes(value);
}

export function isOpenActivityStatus(value) {
  return value !== "Completed" && value !== "Cancelled";
}

export function isValidMonthKey(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""));
}

export function getCurrentMonthKey() {
  return getISTDateKey().slice(0, 7);
}

/** First and last instant of a calendar month in IST. */
export function getMonthBounds(monthKey) {
  if (!isValidMonthKey(monthKey)) return null;

  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayKey = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

  return {
    start: istDayStart(`${monthKey}-01`),
    end: istDayEnd(lastDayKey),
  };
}

/** Parses a YYYY-MM-DD value as a date-only UTC date. */
export function parseActivityDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const str = String(value).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Deep link that opens the correct month and activity on the program page. */
export function activityNotificationLink(programId, activityId, startDate) {
  const month = startDate ? getISTDateKey(startDate).slice(0, 7) : getCurrentMonthKey();
  return `/livelihood/programs/${programId}?planMonth=${month}&activity=${activityId}`;
}
