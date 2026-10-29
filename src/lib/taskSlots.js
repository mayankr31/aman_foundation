// Client-safe task time-slot helpers. Keep this file free of Prisma/server-only
// imports so AttendanceModal and the Tasks page can use it directly.
export const TASK_TIME_SLOTS = ["FIRST_HALF", "SECOND_HALF"];

export const TASK_TIME_SLOT_LABELS = {
  FIRST_HALF: "First Half",
  SECOND_HALF: "Second Half",
};

export const TASK_TIME_SLOT_CLASSES = {
  FIRST_HALF: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  SECOND_HALF: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
};

export function normalizeTaskTimeSlot(value, fallback = "FIRST_HALF") {
  const normalized = String(value || "").trim().toUpperCase();
  return TASK_TIME_SLOTS.includes(normalized) ? normalized : fallback;
}

/** Defaults a newly-added daily task by the current IST hour. */
export function defaultTaskTimeSlot(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  return hour < 13 ? "FIRST_HALF" : "SECOND_HALF";
}
