import { prisma } from "@/lib/prisma";
import { getISTDateKey } from "@/lib/time";

export const HOLIDAY_TYPES = ["PUBLIC", "RESTRICTED", "OPTIONAL"];

export const HOLIDAY_TYPE_LABELS = {
  PUBLIC: "Public Holiday",
  RESTRICTED: "Restricted Holiday",
  OPTIONAL: "Optional Holiday",
};

export function isValidDateKey(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00+05:30`);
  return !Number.isNaN(date.getTime()) && getISTDateKey(date) === value;
}

export function normalizeHolidayType(value) {
  const type = String(value || "PUBLIC").toUpperCase();
  return HOLIDAY_TYPES.includes(type) ? type : "PUBLIC";
}

export async function getTodayHoliday(now = new Date()) {
  const today = getISTDateKey(now);
  const holiday = await prisma.holiday.findFirst({
    where: { dateKey: today, active: true },
  });
  return holiday || null;
}

export async function getHolidaysForYear(year) {
  const safeYear = Number.isInteger(Number(year)) ? Number(year) : new Date().getFullYear();
  const start = `${safeYear}-01-01`;
  const end = `${safeYear}-12-31`;
  return prisma.holiday.findMany({
    where: { active: true, dateKey: { gte: start, lte: end } },
    orderBy: { dateKey: "asc" },
  });
}
