import {
  dateKeyToUTCDate,
  formatWorkHours,
  getISTDateKey,
  istDayStart,
} from "@/lib/time";

/** Standard shift: Monday–Saturday, 9:00 AM – 5:00 PM IST. */
export const SHIFT_START_MINUTES = 9 * 60;
export const SHIFT_END_MINUTES = 17 * 60;

function formatShiftTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export const SHIFT_START_LABEL = formatShiftTime(SHIFT_START_MINUTES);
export const SHIFT_END_LABEL = formatShiftTime(SHIFT_END_MINUTES);
export const STANDARD_WORK_SECONDS = (SHIFT_END_MINUTES - SHIFT_START_MINUTES) * 60;
export const SHIFT_LABEL = `${SHIFT_START_LABEL} – ${SHIFT_END_LABEL} (Mon–Sat)`;

/** Parses a legacy 12-hour time string against an IST calendar date. */
export function parseLegacyTime(timeStr, dateKey) {
  if (!timeStr || !dateKey) return null;
  const parts = String(timeStr).trim().split(/\s+/);
  const timePart = parts[0];
  const modifier = (parts[1] || "").toUpperCase();
  const [h, m, s] = timePart.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  let hours = h;
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  const dayStart = istDayStart(dateKey);
  if (!dayStart) return null;
  return new Date(dayStart.getTime() + hours * 3600000 + m * 60000 + (s || 0) * 1000);
}

/** Sunday is the weekly off; Monday–Saturday are working days. */
export function isWorkingDay(dateKey) {
  const date = dateKeyToUTCDate(dateKey);
  if (!date) return true;
  const day = date.getUTCDay();
  return day >= 1 && day <= 6;
}

export function getShiftBounds(dateKey) {
  const dayStart = istDayStart(dateKey);
  if (!dayStart) return { shiftStart: null, shiftEnd: null };
  return {
    shiftStart: new Date(dayStart.getTime() + SHIFT_START_MINUTES * 60000),
    shiftEnd: new Date(dayStart.getTime() + SHIFT_END_MINUTES * 60000),
  };
}

function isAutoClosed(log) {
  return /auto checked out/i.test(String(log?.workstatus || ""));
}

function secondsBetween(later, earlier) {
  if (!later || !earlier) return 0;
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 1000));
}

/**
 * Computes work/extra time for one attendance log.
 * Extra time is actual overtime beyond 7h 30m on Mon–Sat. Early check-in and
 * late check-out are returned separately for display. Sunday work counts fully
 * as extra. Auto-closed midnight shifts are flagged and never counted as extra.
 */
export function computeAttendanceMetrics(log, now = new Date()) {
  if (!log) return null;

  const todayKey = getISTDateKey(now);
  const dateKey =
    log.logdate ||
    getISTDateKey(log.checkInAt || log.createdAt || now);

  const checkInAt = log.checkInAt
    ? new Date(log.checkInAt)
    : parseLegacyTime(log.intimelog, dateKey);

  let checkOutAt = log.checkOutAt
    ? new Date(log.checkOutAt)
    : log.outtimelog
      ? parseLegacyTime(log.outtimelog, dateKey)
      : null;

  if (!checkInAt || Number.isNaN(checkInAt.getTime())) return null;

  const isToday = dateKey === todayKey;
  const running = !checkOutAt && isToday;
  const incomplete = !checkOutAt && !isToday;

  if (running) checkOutAt = now;

  let workSeconds = Number(log.workSeconds);
  if (!Number.isFinite(workSeconds) || workSeconds <= 0) {
    workSeconds = checkOutAt ? secondsBetween(checkOutAt, checkInAt) : 0;
  }
  if (incomplete) workSeconds = 0;

  const workingDay = isWorkingDay(dateKey);
  const { shiftStart, shiftEnd } = getShiftBounds(dateKey);
  const autoClosed = isAutoClosed(log);

  const earlySeconds =
    workingDay && shiftStart && checkInAt < shiftStart
      ? secondsBetween(shiftStart, checkInAt)
      : 0;

  const lateSeconds =
    !autoClosed && workingDay && shiftEnd && checkOutAt && checkOutAt > shiftEnd
      ? secondsBetween(checkOutAt, shiftEnd)
      : 0;

  let extraSeconds = 0;
  if (!autoClosed && !incomplete) {
    extraSeconds = workingDay
      ? Math.max(0, workSeconds - STANDARD_WORK_SECONDS)
      : workSeconds;
  }

  return {
    dateKey,
    checkInAt,
    checkOutAt,
    workSeconds,
    earlySeconds,
    lateSeconds,
    extraSeconds,
    standardSeconds: STANDARD_WORK_SECONDS,
    shortfallSeconds: workingDay ? Math.max(0, STANDARD_WORK_SECONDS - workSeconds) : 0,
    workingDay,
    shiftStart,
    shiftEnd,
    autoClosed,
    incomplete,
    running,
    workHours: formatWorkHours(workSeconds),
    earlyHours: formatWorkHours(earlySeconds),
    lateHours: formatWorkHours(lateSeconds),
    extraHours: formatWorkHours(extraSeconds),
  };
}

export function sumExtraSeconds(logs, now = new Date()) {
  return (logs || []).reduce((total, log) => {
    const metrics = computeAttendanceMetrics(log, now);
    return total + (metrics?.extraSeconds || 0);
  }, 0);
}
