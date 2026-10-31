import { prisma } from "@/lib/prisma";
import { DEFAULT_LEAVE_CONFIGS } from "@/lib/leavePolicyDefaults";
import {
  QUOTA_PERIODS,
  daysInclusive,
  formatDays,
  formatPeriodKey,
  getEntitlementLabel,
  getFinancialYearRange,
  getFinancialYearStart,
  getMaxEndDateForMonths,
  getServiceDays,
  getStoredLeaveTypeKey,
  parseDateOnly,
  parseLegacyLeaveRange,
  splitDaysByPeriod,
} from "@/lib/leavePolicy";

export {
  QUOTA_PERIODS,
  addDays,
  addMonths,
  daysInclusive,
  formatDays,
  formatPeriodKey,
  getEntitlementLabel,
  getFinancialYearRange,
  getFinancialYearStart,
  getPolicyWarnings,
  getServiceDays,
  getStoredLeaveTypeKey,
  parseDateOnly,
  parseLegacyLeaveRange,
  periodKeyForDate,
  splitDaysByPeriod,
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
  return prisma.leaveTypeConfig.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function typeKeyFromName(name, configs) {
  return getStoredLeaveTypeKey({ type: name }, configs);
}

function expiryStatus(credit, now) {
  if (credit.status === "Used") return "Used";
  if (new Date(credit.expiresAt) < now && credit.status !== "Reserved") return "Expired";
  return credit.status;
}

function annualQuotaPeriod(quotaPeriod) {
  return quotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR
    ? QUOTA_PERIODS.CALENDAR_YEAR
    : QUOTA_PERIODS.FINANCIAL_YEAR;
}

/**
 * Computes the current leave policy balances for a user. Annual/calendar quotas
 * count approved and pending requests. Event-based and unlimited types show
 * usage for the selected financial year but do not carry an annual balance.
 */
export async function getUserLeaveSummary(userId, fyStart = getFinancialYearStart()) {
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

  const fyRange = getFinancialYearRange(fyStart);
  const calendarYear = new Date().getUTCFullYear();
  const configByKey = new Map(configs.map((config) => [config.key, config]));
  const types = {};

  for (const config of configs) {
    if (!config.active || config.key === "COMP_OFF" || config.systemType === "COMP_OFF") continue;
    const quotaPeriod = config.quotaPeriod || QUOTA_PERIODS.FINANCIAL_YEAR;
    types[config.key] = {
      key: config.key,
      name: config.name,
      code: config.code || null,
      policyNote: config.policyNote || null,
      paid: config.paid !== false,
      quotaPeriod,
      entitlement: config.annualQuota,
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
    };

    if (config.minServiceDays != null) {
      const serviceDays = getServiceDays(user?.dateOfJoining, new Date());
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
    const config = key ? configByKey.get(key) : null;
    if (!type || !config) continue;

    const configQuotaPeriod = config.quotaPeriod || QUOTA_PERIODS.FINANCIAL_YEAR;
    const isAnnual = [QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(configQuotaPeriod);
    let countedDays = 0;

    if (isAnnual) {
      const split = splitDaysByPeriod(parsed.startDate, parsed.endDate, annualQuotaPeriod(configQuotaPeriod));
      const displayKey =
        configQuotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR ? `CY-${calendarYear}` : `FY-${fyStart}`;
      countedDays = split[displayKey] || 0;
    } else {
      const overlapStart = parsed.startDate > fyRange.start ? parsed.startDate : fyRange.start;
      const overlapEnd = parsed.endDate < fyRange.end ? parsed.endDate : fyRange.end;
      countedDays = overlapStart <= overlapEnd ? daysInclusive(overlapStart, overlapEnd) : 0;
    }

    if (!countedDays) continue;
    if (leave.status === "APPROVED") type.used += countedDays;
    else type.pending += countedDays;
  }

  for (const type of Object.values(types)) {
    if ([QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(type.quotaPeriod)) {
      type.remaining = Math.max(0, Number(type.entitlement) - type.used);
      type.available = Math.max(0, Number(type.entitlement) - type.used - type.pending);
    }
  }

  const annualPaidTypes = Object.values(types).filter(
    (type) => type.paid && [QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(type.quotaPeriod)
  );
  const totals = {
    paidEntitlement: annualPaidTypes.reduce((sum, type) => sum + Number(type.entitlement || 0), 0),
    paidUsed: annualPaidTypes.reduce((sum, type) => sum + type.used, 0),
    paidPending: annualPaidTypes.reduce((sum, type) => sum + type.pending, 0),
    paidAvailable: annualPaidTypes.reduce((sum, type) => sum + Number(type.available || 0), 0),
  };

  const now = new Date();
  const compOff = credits.map((credit) => ({
    ...credit,
    status: expiryStatus(credit, now),
  }));

  return {
    fyStart,
    fyLabel: `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`,
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
    const summary = await getUserLeaveSummary(userId, getFinancialYearStart(startDate));
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

  const quotaPeriod = annualQuotaPeriod(config.quotaPeriod);
  const requestedSplit = splitDaysByPeriod(startDate, endDate, quotaPeriod);
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
  for (const leave of leaves) {
    const key = getStoredLeaveTypeKey(leave, configs);
    if (key !== leaveTypeKey) continue;
    const parsed =
      leave.startDate && leave.endDate
        ? { startDate: parseDateOnly(leave.startDate), endDate: parseDateOnly(leave.endDate) }
        : parseLegacyLeaveRange(leave.dates);
    if (!parsed.startDate || !parsed.endDate) continue;
    const split = splitDaysByPeriod(parsed.startDate, parsed.endDate, quotaPeriod);
    for (const [periodKey, periodDays] of Object.entries(split)) {
      usedByPeriod[periodKey] = (usedByPeriod[periodKey] || 0) + periodDays;
    }
  }

  for (const [periodKey, requestedDays] of Object.entries(requestedSplit)) {
    if (!requestedDays) continue;
    const usedDays = usedByPeriod[periodKey] || 0;
    const remaining = Number(config.annualQuota) - usedDays;
    if (requestedDays > remaining) {
      return {
        ok: false,
        error: `Not enough ${config.name} balance in ${formatPeriodKey(periodKey, quotaPeriod)} (${formatDays(
          Math.max(0, remaining)
        )} remaining).`,
      };
    }
  }

  return {
    ok: true,
    config,
    days,
    warnings,
    split: requestedSplit,
    fyStart: getFinancialYearStart(startDate),
  };
}
