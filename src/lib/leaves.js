import { prisma } from "@/lib/prisma";
import { DEFAULT_LEAVE_CONFIGS } from "@/lib/leavePolicyDefaults";
import {
  CALENDAR_QUARTERS,
  QUOTA_PERIODS,
  daysInclusive,
  formatDays,
  formatPeriodKey,
  formatQuarterKey,
  getCalendarYearStart,
  getEntitlementLabel,
  getMaxEndDateForMonths,
  getServiceDays,
  getStoredLeaveTypeKey,
  parseDateOnly,
  parseLegacyLeaveRange,
  splitDaysByPeriod,
  splitDaysByQuarter,
} from "@/lib/leavePolicy";

export {
  CALENDAR_QUARTERS,
  QUOTA_PERIODS,
  addDays,
  addMonths,
  daysInclusive,
  formatDays,
  formatPeriodKey,
  formatQuarterKey,
  getCalendarYearRange,
  getCalendarYearStart,
  getEntitlementLabel,
  getPolicyWarnings,
  getServiceDays,
  getStoredLeaveTypeKey,
  parseDateOnly,
  parseLegacyLeaveRange,
  periodKeyForDate,
  splitDaysByPeriod,
  splitDaysByQuarter,
} from "@/lib/leavePolicy";

export async function ensureLeaveConfigs() {
  const existing = await prisma.leaveTypeConfig.findMany({ select: { key: true } });
  const existingKeys = new Set(existing.map((config) => config.key));
  const missing = DEFAULT_LEAVE_CONFIGS.filter((config) => !existingKeys.has(config.key));
  for (const config of missing) {
    await prisma.leaveTypeConfig.upsert({
      where: { key: config.key },
      update: {},
      create: { ...config, active: true },
    });
  }

  // Leave balances now reset on 1 January. Existing policies created under the
  // old April–March financial year are normalised once to calendar-year quotas.
  await prisma.leaveTypeConfig.updateMany({
    where: { quotaPeriod: QUOTA_PERIODS.FINANCIAL_YEAR },
    data: { quotaPeriod: QUOTA_PERIODS.CALENDAR_YEAR },
  });

  const configs = await prisma.leaveTypeConfig.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Keep older policy notes in sync with the calendar-year switch without
  // overwriting any other wording an admin may have customised.
  return configs.map((config) =>
    config.policyNote
      ? { ...config, policyNote: config.policyNote.replace(/financial year/gi, "calendar year") }
      : config
  );
}

export function typeKeyFromName(name, configs) {
  return getStoredLeaveTypeKey({ type: name }, configs);
}

function expiryStatus(credit, now) {
  if (credit.status === "Used") return "Used";
  if (new Date(credit.expiresAt) < now && credit.status !== "Reserved") return "Expired";
  return credit.status;
}

function isAnnualQuotaPeriod(quotaPeriod) {
  return (
    quotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR ||
    quotaPeriod === QUOTA_PERIODS.FINANCIAL_YEAR ||
    quotaPeriod == null
  );
}

function emptyQuarters() {
  return CALENDAR_QUARTERS.map(({ quarter, label, months }) => ({
    quarter,
    label,
    months,
    used: 0,
    pending: 0,
    quota: null,
    remaining: null,
    available: null,
  }));
}

/**
 * Computes the current leave policy balances from already-loaded records.
 * Annual quotas count approved and pending requests for the selected calendar
 * year and are split into quarters. Event-based and unlimited types show usage
 * for the same calendar year but do not carry an annual balance.
 */
function computeLeaveSummary({ configs, leaves, credits, dateOfJoining, year }) {
  const types = {};

  for (const config of configs) {
    if (!config.active || config.key === "COMP_OFF" || config.systemType === "COMP_OFF") continue;
    const quotaPeriod = config.quotaPeriod || QUOTA_PERIODS.CALENDAR_YEAR;
    const quarterlyQuota = Number(config.quarterlyQuota) > 0 ? Number(config.quarterlyQuota) : null;
    const quarters = emptyQuarters();
    if (isAnnualQuotaPeriod(quotaPeriod) && quarterlyQuota != null) {
      for (const quarter of quarters) quarter.quota = quarterlyQuota;
    }
    types[config.key] = {
      key: config.key,
      name: config.name,
      code: config.code || null,
      policyNote: config.policyNote || null,
      paid: config.paid !== false,
      quotaPeriod,
      entitlement: config.annualQuota,
      quarterlyQuota,
      entitlementLabel: getEntitlementLabel(config),
      maxConsecutiveDays: config.maxConsecutiveDays,
      maxConsecutiveMonths: config.maxConsecutiveMonths,
      softMaxConsecutive: !!config.softMaxConsecutive,
      minServiceDays: config.minServiceDays,
      medicalCertificateAfterDays: config.medicalCertificateAfterDays,
      holidayNameRequired: !!config.holidayNameRequired,
      used: 0,
      pending: 0,
      remaining: null,
      available: null,
      quarters,
    };

    if (config.minServiceDays != null) {
      const serviceDays = getServiceDays(dateOfJoining, new Date());
      types[config.key].serviceDays = serviceDays;
      types[config.key].eligible = serviceDays != null && serviceDays >= config.minServiceDays;
    }
  }

  for (const leave of leaves) {
    const parsed =
      leave.startDate && leave.endDate
        ? { startDate: parseDateOnly(leave.startDate), endDate: parseDateOnly(leave.endDate) }
        : parseLegacyLeaveRange(leave.dates);
    if (!parsed.startDate || !parsed.endDate) continue;

    const key = getStoredLeaveTypeKey(leave, configs);
    const type = key ? types[key] : null;
    if (!type) continue;

    const quarterSplit = splitDaysByQuarter(parsed.startDate, parsed.endDate);
    let countedDays = 0;
    for (const [quarterKey, quarterDays] of Object.entries(quarterSplit)) {
      const [rawYear, rawQuarter] = quarterKey.split("-");
      if (Number(rawYear) !== Number(year)) continue;
      const quarterIndex = Number(String(rawQuarter).replace("Q", "")) - 1;
      if (quarterIndex < 0 || quarterIndex > 3) continue;
      countedDays += quarterDays;
      if (leave.status === "APPROVED") type.quarters[quarterIndex].used += quarterDays;
      else type.quarters[quarterIndex].pending += quarterDays;
    }

    if (!countedDays) continue;
    if (leave.status === "APPROVED") type.used += countedDays;
    else type.pending += countedDays;
  }

  for (const type of Object.values(types)) {
    if (isAnnualQuotaPeriod(type.quotaPeriod)) {
      type.remaining = Math.max(0, Number(type.entitlement) - type.used);
      type.available = Math.max(0, Number(type.entitlement) - type.used - type.pending);
      for (const quarter of type.quarters) {
        if (quarter.quota == null) continue;
        quarter.remaining = Math.max(0, Number(quarter.quota) - quarter.used);
        quarter.available = Math.max(0, Number(quarter.quota) - quarter.used - quarter.pending);
      }
    }
  }

  const annualPaidTypes = Object.values(types).filter(
    (type) => type.paid && isAnnualQuotaPeriod(type.quotaPeriod)
  );
  const totals = {
    paidEntitlement: annualPaidTypes.reduce((sum, type) => sum + Number(type.entitlement || 0), 0),
    paidUsed: annualPaidTypes.reduce((sum, type) => sum + type.used, 0),
    paidPending: annualPaidTypes.reduce((sum, type) => sum + type.pending, 0),
    paidAvailable: annualPaidTypes.reduce((sum, type) => sum + Number(type.available || 0), 0),
    byQuarter: CALENDAR_QUARTERS.map(({ quarter, label, months }, index) => {
      let used = 0;
      let pending = 0;
      let cappedTypes = 0;
      for (const type of annualPaidTypes) {
        const quarterData = type.quarters[index];
        used += quarterData.used;
        pending += quarterData.pending;
        if (quarterData.quota != null) cappedTypes += 1;
      }
      return { quarter, label, months, used, pending, cappedTypes };
    }),
  };

  const now = new Date();
  const compOff = credits.map((credit) => ({
    ...credit,
    status: expiryStatus(credit, now),
  }));

  return {
    year: Number(year),
    yearLabel: String(year),
    types,
    totals,
    compOff: {
      available: compOff.filter((c) => c.status === "Available").reduce((sum, c) => sum + (c.days || 1), 0),
      reserved: compOff.filter((c) => c.status === "Reserved").reduce((sum, c) => sum + (c.days || 1), 0),
      used: compOff.filter((c) => c.status === "Used").reduce((sum, c) => sum + (c.days || 1), 0),
      expired: compOff.filter((c) => c.status === "Expired").reduce((sum, c) => sum + (c.days || 1), 0),
      credits: compOff,
    },
  };
}

/** Computes the leave balances for a single user for the given calendar year. */
export async function getUserLeaveSummary(userId, year = getCalendarYearStart()) {
  const [configs, leaves, credits, user] = await Promise.all([
    ensureLeaveConfigs(),
    prisma.leave.findMany({
      where: { userId, status: { in: ["APPROVED", "PENDING"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.compOffCredit.findMany({
      where: { userId },
      orderBy: { workedDate: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfJoining: true },
    }),
  ]);

  return computeLeaveSummary({
    configs,
    leaves,
    credits,
    dateOfJoining: user?.dateOfJoining,
    year,
  });
}

/**
 * Batch version of getUserLeaveSummary. Loads the policy, leaves, credits and
 * joining dates once so a team-wide balance table does not run N+1 queries.
 * Returns the annual leave-type columns plus a map keyed by user id.
 */
export async function getLeaveSummariesForUsers(userIds, year = getCalendarYearStart()) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  const yearLabel = String(year);

  if (!ids.length) {
    return { year, yearLabel, columns: [], summaries: {} };
  }

  const [configs, leaves, credits, users] = await Promise.all([
    ensureLeaveConfigs(),
    prisma.leave.findMany({
      where: { userId: { in: ids }, status: { in: ["APPROVED", "PENDING"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.compOffCredit.findMany({
      where: { userId: { in: ids } },
      orderBy: { workedDate: "desc" },
    }),
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, dateOfJoining: true },
    }),
  ]);

  const leavesByUser = new Map();
  for (const leave of leaves) {
    if (!leavesByUser.has(leave.userId)) leavesByUser.set(leave.userId, []);
    leavesByUser.get(leave.userId).push(leave);
  }

  const creditsByUser = new Map();
  for (const credit of credits) {
    if (!creditsByUser.has(credit.userId)) creditsByUser.set(credit.userId, []);
    creditsByUser.get(credit.userId).push(credit);
  }

  const joiningByUser = new Map(users.map((entry) => [entry.id, entry.dateOfJoining]));
  const summaries = {};

  for (const id of ids) {
    summaries[id] = computeLeaveSummary({
      configs,
      leaves: leavesByUser.get(id) || [],
      credits: creditsByUser.get(id) || [],
      dateOfJoining: joiningByUser.get(id),
      year,
    });
  }

  const columns = configs
    .filter((config) => config.active && config.key !== "COMP_OFF" && config.systemType !== "COMP_OFF")
    .filter((config) => isAnnualQuotaPeriod(config.quotaPeriod))
    .map((config) => ({
      key: config.key,
      name: config.name,
      code: config.code || null,
      paid: config.paid !== false,
      quarterlyQuota: Number(config.quarterlyQuota) > 0 ? Number(config.quarterlyQuota) : null,
    }));

  return { year, yearLabel, columns, summaries };
}

/**
 * Validates a leave request against the configured policy. Returns hard errors
 * as { ok:false, error } and soft policy exceptions as warning flags.
 */
export async function validateLeaveQuota({
  userId,
  leaveTypeKey,
  startDate,
  endDate,
  excludeLeaveId = null,
  allowInactive = false,
}) {
  const configs = await ensureLeaveConfigs();
  const config = configs.find((item) => item.key === leaveTypeKey);
  if (!config) return { ok: false, error: "Invalid leave type." };
  if (!config.active && !allowInactive) {
    return { ok: false, error: "This leave type is no longer available." };
  }

  const days = daysInclusive(startDate, endDate);
  if (!days) return { ok: false, error: "Please select valid leave dates." };

  if (config.key === "COMP_OFF" || config.systemType === "COMP_OFF") {
    return { ok: true, config, days, warnings: [] };
  }

  if (config.maxConsecutiveDays != null && days > Number(config.maxConsecutiveDays)) {
    if (!config.softMaxConsecutive) {
      return {
        ok: false,
        error: `${config.name} is limited to ${formatDays(config.maxConsecutiveDays)} consecutive day${
          Number(config.maxConsecutiveDays) === 1 ? "" : "s"
        }.`,
      };
    }
  }

  if (config.maxConsecutiveMonths != null) {
    const maxEndDate = getMaxEndDateForMonths(startDate, config.maxConsecutiveMonths);
    if (endDate > maxEndDate) {
      return {
        ok: false,
        error: `${config.name} is limited to ${formatDays(config.maxConsecutiveMonths)} month${
          Number(config.maxConsecutiveMonths) === 1 ? "" : "s"
        } per request.`,
      };
    }
  }

  if (config.minServiceDays != null) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfJoining: true },
    });
    const serviceDays = getServiceDays(targetUser?.dateOfJoining, startDate);
    if (serviceDays == null) {
      return {
        ok: false,
        error: `Date of joining is not set. Please contact HR before applying for ${config.name}.`,
      };
    }
    if (serviceDays < Number(config.minServiceDays)) {
      return {
        ok: false,
        error: `${config.name} is available after ${formatDays(config.minServiceDays)} days of service. You have completed ${serviceDays} days.`,
      };
    }
  }

  const warnings = [];
  if (config.maxConsecutiveDays != null && days > Number(config.maxConsecutiveDays) && config.softMaxConsecutive) {
    warnings.push("CONSECUTIVE_LIMIT_EXCEEDED");
  }
  if (config.medicalCertificateAfterDays != null && days > Number(config.medicalCertificateAfterDays)) {
    warnings.push("MEDICAL_CERTIFICATE_REQUIRED");
  }

  if (config.quotaPeriod === QUOTA_PERIODS.UNLIMITED) {
    const summary = await getUserLeaveSummary(userId, getCalendarYearStart(startDate));
    if (config.paid === false && summary.totals.paidAvailable > 0) {
      warnings.push("PAID_LEAVE_AVAILABLE");
    }
    return { ok: true, config, days, warnings };
  }

  if (config.quotaPeriod === QUOTA_PERIODS.PER_EVENT) {
    if (Number(config.annualQuota) > 0 && days > Number(config.annualQuota)) {
      return {
        ok: false,
        error: `${config.name} is limited to ${formatDays(config.annualQuota)} day${
          Number(config.annualQuota) === 1 ? "" : "s"
        } per event.`,
      };
    }
    return { ok: true, config, days, warnings };
  }

  const requestedSplit = splitDaysByPeriod(startDate, endDate);
  const requestedQuarterSplit = splitDaysByQuarter(startDate, endDate);
  const leaves = await prisma.leave.findMany({
    where: {
      userId,
      status: { in: ["APPROVED", "PENDING"] },
      ...(excludeLeaveId ? { id: { not: excludeLeaveId } } : {}),
    },
    select: {
      id: true,
      leaveTypeKey: true,
      type: true,
      dates: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  });

  const usedByPeriod = {};
  const usedByQuarter = {};
  for (const leave of leaves) {
    const key = getStoredLeaveTypeKey(leave, configs);
    if (key !== leaveTypeKey) continue;
    const parsed =
      leave.startDate && leave.endDate
        ? { startDate: parseDateOnly(leave.startDate), endDate: parseDateOnly(leave.endDate) }
        : parseLegacyLeaveRange(leave.dates);
    if (!parsed.startDate || !parsed.endDate) continue;

    const split = splitDaysByPeriod(parsed.startDate, parsed.endDate);
    for (const [periodKey, periodDays] of Object.entries(split)) {
      usedByPeriod[periodKey] = (usedByPeriod[periodKey] || 0) + periodDays;
    }

    const quarterSplit = splitDaysByQuarter(parsed.startDate, parsed.endDate);
    for (const [quarterKey, quarterDays] of Object.entries(quarterSplit)) {
      usedByQuarter[quarterKey] = (usedByQuarter[quarterKey] || 0) + quarterDays;
    }
  }

  for (const [periodKey, requestedDays] of Object.entries(requestedSplit)) {
    if (!requestedDays) continue;
    const usedDays = usedByPeriod[periodKey] || 0;
    const remaining = Number(config.annualQuota) - usedDays;
    if (requestedDays > remaining) {
      return {
        ok: false,
        error: `Not enough ${config.name} balance in ${formatPeriodKey(periodKey)} (${formatDays(
          Math.max(0, remaining)
        )} remaining).`,
      };
    }
  }

  const quarterlyQuota = Number(config.quarterlyQuota);
  if (config.quarterlyQuota != null && Number.isFinite(quarterlyQuota) && quarterlyQuota > 0) {
    for (const [quarterKey, requestedDays] of Object.entries(requestedQuarterSplit)) {
      if (!requestedDays) continue;
      const usedDays = usedByQuarter[quarterKey] || 0;
      const remaining = quarterlyQuota - usedDays;
      if (requestedDays > remaining) {
        return {
          ok: false,
          error: `Not enough ${config.name} balance in ${formatQuarterKey(quarterKey)} (${formatDays(
            Math.max(0, remaining)
          )} day${Math.max(0, remaining) === 1 ? "" : "s"} remaining this quarter).`,
        };
      }
    }
  }

  return {
    ok: true,
    config,
    days,
    warnings,
    split: requestedSplit,
    year: getCalendarYearStart(startDate),
  };
}
