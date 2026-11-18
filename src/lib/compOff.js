import { prisma } from "@/lib/prisma";
import { isWorkingDay } from "@/lib/attendanceMetrics";
import { addDays, parseDateOnly } from "@/lib/leavePolicy";

const DEFAULT_VALIDITY_DAYS = 90;

/**
 * Grants one day of compensatory leave when an employee checks in on a weekly
 * off (Sunday) or a public holiday. The credit is created in the "Available"
 * state so it can be claimed from a later COMP_OFF leave request.
 *
 * The unique (userId, workedDate) constraint keeps this idempotent; existing
 * credits are never overwritten because the status may already be Reserved,
 * Used or Expired.
 */
export async function accrueCompOffForWorkedDate({ userId, dateKey }) {
  if (!userId || !dateKey) return null;

  const workedDate = parseDateOnly(dateKey);
  if (!workedDate) return null;

  const holiday = await prisma.holiday.findFirst({
    where: { dateKey, active: true, type: "PUBLIC" },
    select: { name: true },
  });

  const isWeeklyOff = !isWorkingDay(dateKey);
  if (!holiday && !isWeeklyOff) return null;

  const config = await prisma.leaveTypeConfig.findUnique({
    where: { key: "COMP_OFF" },
    select: { validityDays: true },
  });
  const validityDays = Number(config?.validityDays || DEFAULT_VALIDITY_DAYS);
  const expiresAt = addDays(workedDate, validityDays);

  // Do not create credits that would already be expired (for example when
  // backfilling older attendance logs).
  if (expiresAt < new Date()) return null;

  const note = holiday ? `Worked on ${holiday.name}` : "Worked on weekly off";

  return prisma.compOffCredit.upsert({
    where: { userId_workedDate: { userId, workedDate } },
    update: {},
    create: {
      userId,
      workedDate,
      days: 1,
      expiresAt,
      status: "Available",
      note,
    },
  });
}
