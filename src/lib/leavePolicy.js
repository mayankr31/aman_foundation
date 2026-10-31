// Pure leave-policy helpers shared by server routes and client forms.
// Keep this module free of Prisma/React imports so it can be bundled in the browser.

export const QUOTA_PERIODS = {
  FINANCIAL_YEAR: "FINANCIAL_YEAR",
  CALENDAR_YEAR: "CALENDAR_YEAR",
  PER_EVENT: "PER_EVENT",
  UNLIMITED: "UNLIMITED",
  CREDIT: "CREDIT",
};

export const QUOTA_PERIOD_OPTIONS = [
  { value: QUOTA_PERIODS.FINANCIAL_YEAR, label: "Per financial year" },
  { value: QUOTA_PERIODS.CALENDAR_YEAR, label: "Per calendar year" },
  { value: QUOTA_PERIODS.PER_EVENT, label: "Per event" },
  { value: QUOTA_PERIODS.UNLIMITED, label: "Unlimited with approval" },
];

export const POLICY_FLAGS = {
  CONSECUTIVE_LIMIT_EXCEEDED: "CONSECUTIVE_LIMIT_EXCEEDED",
  MEDICAL_CERTIFICATE_REQUIRED: "MEDICAL_CERTIFICATE_REQUIRED",
  PAID_LEAVE_AVAILABLE: "PAID_LEAVE_AVAILABLE",
};

export function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const str = String(value).trim();
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  const dmy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

export function parseLegacyLeaveRange(dates) {
  const str = String(dates || "").trim();
  if (!str) return { startDate: null, endDate: null };
  const parts = str.split(/\s+to\s+/i);
  const startDate = parseDateOnly(parts[0]);
  const endDate = parts[1] ? parseDateOnly(parts[1]) : startDate;
  return { startDate, endDate };
}

export function daysInclusive(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(ms / 86400000) + 1);
}

export function addDays(date, days) {
  if (!date) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + Number(days || 0)));
}

export function addMonths(date, months) {
  if (!date) return null;
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + Number(months || 0), 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), lastDay)));
}

export function getMaxEndDateForMonths(startDate, months) {
  if (!startDate) return null;
  const target = addMonths(startDate, months);
  const lastDayOfStartMonth = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return startDate.getUTCDate() === lastDayOfStartMonth ? target : addDays(target, -1);
}

export function getFinancialYearStart(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-based
  return month >= 3 ? year : year - 1; // April (3) starts a new financial year
}

export function getFinancialYearRange(fyStart) {
  return {
    start: new Date(Date.UTC(fyStart, 3, 1)),
    end: new Date(Date.UTC(fyStart + 1, 2, 31)),
  };
}

export function getCalendarYearRange(year) {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}

export function getServiceDays(dateOfJoining, asOf) {
  const joined = parseDateOnly(dateOfJoining);
  const upto = parseDateOnly(asOf);
  if (!joined || !upto) return null;
  return Math.floor((upto.getTime() - joined.getTime()) / 86400000);
}

export function periodKeyForDate(date, quotaPeriod) {
  if (quotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR) {
    return `CY-${date.getUTCFullYear()}`;
  }
  return `FY-${getFinancialYearStart(date)}`;
}

export function periodRangeForKey(periodKey, quotaPeriod) {
  const [prefix, rawYear] = String(periodKey).split("-");
  const year = Number(rawYear);
  if (quotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR || prefix === "CY") {
    return getCalendarYearRange(year);
  }
  return getFinancialYearRange(year);
}

export function formatPeriodKey(periodKey, quotaPeriod) {
  const [prefix, rawYear] = String(periodKey).split("-");
  const year = Number(rawYear);
  if (quotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR || prefix === "CY") {
    return String(year);
  }
  return `FY ${year}-${String(year + 1).slice(-2)}`;
}

/** Returns { [periodKey]: dayCount } for annual/calendar-year quota periods. */
export function splitDaysByPeriod(startDate, endDate, quotaPeriod) {
  const result = {};
  if (!startDate || !endDate || endDate < startDate) return result;
  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    const key = periodKeyForDate(cursor, quotaPeriod);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

export function formatDays(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(/\.0$/, "");
}

export function formatMonths(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return `${formatDays(number)} month${number === 1 ? "" : "s"}`;
}

export function formatQuotaPeriod(quotaPeriod) {
  switch (quotaPeriod) {
    case QUOTA_PERIODS.CALENDAR_YEAR:
      return "calendar year";
    case QUOTA_PERIODS.PER_EVENT:
      return "event";
    case QUOTA_PERIODS.UNLIMITED:
      return "no annual limit";
    case QUOTA_PERIODS.CREDIT:
      return "compensatory credit";
    default:
      return "financial year";
  }
}

export function getEntitlementLabel(config) {
  if (!config) return "";
  if (config.quotaPeriod === QUOTA_PERIODS.UNLIMITED) return "Unlimited, subject to approval";
  if (config.quotaPeriod === QUOTA_PERIODS.CREDIT) return "Credit-based";
  if (config.quotaPeriod === QUOTA_PERIODS.PER_EVENT) {
    if (config.maxConsecutiveMonths) return `${formatMonths(config.maxConsecutiveMonths)} per event`;
    return `${formatDays(config.annualQuota)} day${Number(config.annualQuota) === 1 ? "" : "s"} per event`;
  }
  const period = config.quotaPeriod === QUOTA_PERIODS.CALENDAR_YEAR ? "calendar year" : "financial year";
  return `${formatDays(config.annualQuota)} day${Number(config.annualQuota) === 1 ? "" : "s"} per ${period}`;
}

export function getPolicyWarnings(config, { days = 0, paidLeaveAvailable = 0 } = {}) {
  const warnings = [];
  if (!config) return warnings;

  if (
    config.softMaxConsecutive === true &&
    config.maxConsecutiveDays != null &&
    days > Number(config.maxConsecutiveDays)
  ) {
    warnings.push(POLICY_FLAGS.CONSECUTIVE_LIMIT_EXCEEDED);
  }

  if (
    config.medicalCertificateAfterDays != null &&
    days > Number(config.medicalCertificateAfterDays)
  ) {
    warnings.push(POLICY_FLAGS.MEDICAL_CERTIFICATE_REQUIRED);
  }

  if (
    (config.systemType === "LWP" || config.key === "LWP" || config.paid === false) &&
    Number(paidLeaveAvailable) > 0
  ) {
    warnings.push(POLICY_FLAGS.PAID_LEAVE_AVAILABLE);
  }

  return [...new Set(warnings)];
}

export function getPolicyFlagLabel(flag, config) {
  switch (flag) {
    case POLICY_FLAGS.CONSECUTIVE_LIMIT_EXCEEDED:
      return config?.maxConsecutiveDays != null
        ? `Exceeds the normal ${config.maxConsecutiveDays}-day consecutive limit; requires management approval.`
        : "Exceeds the normal consecutive-day limit; requires management approval.";
    case POLICY_FLAGS.MEDICAL_CERTIFICATE_REQUIRED:
      return "Medical certificate required at the office.";
    case POLICY_FLAGS.PAID_LEAVE_AVAILABLE:
      return "Paid leave balance is still available.";
    default:
      return String(flag || "")
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^./, (char) => char.toUpperCase());
  }
}

export function slugifyLeaveName(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "LEAVE_TYPE";
}

export function getStoredLeaveTypeKey(leave, configs) {
  if (leave?.leaveTypeKey) return leave.leaveTypeKey;
  const normalized = String(leave?.type || "").trim().toLowerCase();
  if (!normalized) return null;
  const direct = configs.find(
    (config) =>
      config.name.toLowerCase() === normalized ||
      config.key.toLowerCase() === normalized ||
      String(config.code || "").toLowerCase() === normalized
  );
  if (direct) return direct.key;
  if (normalized.includes("comp")) return "COMP_OFF";
  if (normalized.includes("sick")) return "SICK";
  if (normalized.includes("casual")) return "CASUAL";
  if (normalized.includes("emergency")) return "EMERGENCY";
  if (normalized.includes("maternity")) return "MATERNITY";
  if (normalized.includes("paternity")) return "PATERNITY";
  if (normalized.includes("bereavement")) return "BEREAVEMENT";
  if (normalized.includes("special")) return "SPECIAL";
  if (normalized.includes("unpaid") || normalized.includes("lwp")) return "LWP";
  if (normalized.includes("restricted")) return "RESTRICTED_HOLIDAY";
  return null;
}
