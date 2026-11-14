import { getISTDateKey } from "@/lib/time";

/**
 * The date a task is considered scheduled for. This mirrors the attendance
 * modal display logic: planned date first, then the deadline as a fallback.
 */
export function taskScheduleDateKey(task) {
  const value = task?.plannedDate || task?.deadline;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getISTDateKey(date);
}

/** A task carried forward from an earlier day (overdue / still open). */
export function isTaskCarriedForward(task, todayKey = getISTDateKey()) {
  const key = taskScheduleDateKey(task);
  return Boolean(key && key < todayKey);
}

/**
 * A task genuinely added/planned for the given day. Carry-forward tasks are
 * excluded, so they cannot satisfy the "add at least one task" requirement.
 */
export function isTaskForDate(task, dateKey = getISTDateKey()) {
  if (task?.status === "Cancelled") return false;
  return taskScheduleDateKey(task) === dateKey;
}
