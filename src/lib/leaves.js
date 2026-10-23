import { prisma } from "@/lib/prisma";

export const DEFAULT_LEAVE_CONFIGS = [
  { key: "SICK", name: "Sick Leave", annualQuota: 16, quarterlyQuota: 4, sortOrder: 1 },
  { key: "CASUAL", name: "Casual Leave", annualQuota: 12, quarterlyQuota: 3, sortOrder: 2 },
  { key: "EMERGENCY", name: "Emergency Leave", annualQuota: 4, quarterlyQuota: 1, sortOrder: 3 },
  { key: "COMP_OFF", name: "Comp Off Leave", annualQuota: 0, quarterlyQuota: null, sortOrder: 4 },
];

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

export function getFinancialYearStart(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  return month >= 3 ? year : year - 1; // April (3) starts a new financial year
}

export function getFinancialYearRange(fyStart) {
  return {
    start: new Date(Date.UTC(fyStart, 3, 1)),
    end: new Date(Date.UTC(fyStart + 1, 2, 31)),
  };
}

/** Quarter number 1-4 for an FY starting in April. */
export function getQuarterNumber(date) {
  const month = date.getMonth();
  if (month >= 3 && month <= 5) return 1; // Apr-Jun
  if (month >= 6 && month <= 8) return 2; // Jul-Sep
  if (month >= 9 && month <= 11) return 3; // Oct-Dec
  return 4; // Jan-Mar
}

export function quarterKey(fyStart, quarter) {
  return `${fyStart}-Q${quarter}`;
}

export function quarterDateRange(fyStart, quarter) {
  const starts = [
    [fyStart, 3, 1],
    [fyStart, 6, 1],
    [fyStart, 9, 1],
    [fyStart + 1, 0, 1],
  ];
  const ends = [
    [fyStart, 5, 30],
    [fyStart, 8, 30],
    [fyStart, 11, 31],
    [fyStart + 1, 2, 31],
  ];
  const [sy, sm, sd] = starts[quarter - 1];
  const [ey, em, ed] = ends[quarter - 1];
  return {
    start: new Date(Date.UTC(sy, sm, sd)),
    end: new Date(Date.UTC(ey, em, ed)),
  };
}

export function daysInclusive(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(ms / 86400000) + 1);
}

/** Splits a leave range into day counts per FY quarter. */
export function splitDaysByQuarter(startDate, endDate, fyStart) {
  const result = {
    [quarterKey(fyStart, 1)]: 0,
    [quarterKey(fyStart, 2)]: 0,
    [quarterKey(fyStart, 3)]: 0,
    [quarterKey(fyStart, 4)]: 0,
  };

  for (let quarter = 1; quarter <= 4; quarter += 1) {
    const range = quarterDateRange(fyStart, quarter);
    const overlapStart = startDate > range.start ? startDate : range.start;
    const overlapEnd = endDate < range.end ? endDate : range.end;
    if (overlapStart <= overlapEnd) {
      result[quarterKey(fyStart, quarter)] = daysInclusive(overlapStart, overlapEnd);
    }
  }
  return result;
}

export function quarterOfDate(date, fyStart) {
  const q = getQuarterNumber(date);
  return quarterKey(fyStart, q);
}

export async function ensureLeaveConfigs() {
  const existing = await prisma.leaveTypeConfig.findMany();
  if (existing.length >= DEFAULT_LEAVE_CONFIGS.length) return existing;

  for (const config of DEFAULT_LEAVE_CONFIGS) {
    await prisma.leaveTypeConfig.upsert({
      where: { key: config.key },
      update: {},
      create: { ...config, active: true },
    });
  }
  return prisma.leaveTypeConfig.findMany({ orderBy: { sortOrder: "asc" } });
}

export function typeKeyFromName(name, configs) {
  const normalized = String(name || "").trim().toLowerCase();
  const byName = configs.find((c) => c.name.toLowerCase() === normalized || c.key.toLowerCase() === normalized);
  if (byName) return byName.key;
  if (normalized.includes("comp")) return "COMP_OFF";
  if (normalized.includes("sick")) return "SICK";
  if (normalized.includes("casual")) return "CASUAL";
  if (normalized.includes("emergency")) return "EMERGENCY";
  return null;
}

function expiryStatus(credit, now) {
  if (credit.status === "Used") return "Used";
  if (new Date(credit.expiresAt) < now && credit.status !== "Reserved") return "Expired";
  return credit.status;
}

/**
 * Computes the leave summary for a user using approved leaves + configured
 * quarterly quotas. Unused quota lapses at the end of each quarter.
 */
export async function getUserLeaveSummary(userId, fyStart = getFinancialYearStart()) {
  const [configs, leaves, credits] = await Promise.all([
    ensureLeaveConfigs(),
    prisma.leave.findMany({
      where: { userId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.compOffCredit.findMany({
      where: { userId },
      orderBy: { workedDate: "desc" },
    }),
  ]);

  const fyRange = getFinancialYearRange(fyStart);
  const types = {};
  for (const config of configs) {
    if (!config.active) continue;
    const quarterly = config.quarterlyQuota != null ? config.quarterlyQuota : config.annualQuota / 4;
    types[config.key] = {
      key: config.key,
      name: config.name,
      annualQuota: config.annualQuota,
      quarterlyQuota: quarterly,
      quarters: {},
      used: 0,
      remaining: 0,
    };
    for (let q = 1; q <= 4; q += 1) {
      types[config.key].quarters[quarterKey(fyStart, q)] = {
        quarter: q,
        entitlement: quarterly,
        used: 0,
        remaining: quarterly,
      };
    }
  }

  for (const leave of leaves) {
    const parsed = leave.startDate && leave.endDate
      ? { startDate: parseDateOnly(leave.startDate), endDate: parseDateOnly(leave.endDate) }
      : parseLegacyLeaveRange(leave.dates);
    if (!parsed.startDate || !parsed.endDate) continue;
    if (parsed.endDate < fyRange.start || parsed.startDate > fyRange.end) continue;

    const key = leave.leaveTypeKey || typeKeyFromName(leave.type, configs);
    if (!key || !types[key]) continue;

    const split = splitDaysByQuarter(parsed.startDate, parsed.endDate, fyStart);
    for (const [qKey, days] of Object.entries(split)) {
      if (types[key].quarters[qKey]) {
        types[key].quarters[qKey].used += days;
        types[key].used += days;
      }
    }
  }

  for (const type of Object.values(types)) {
    for (const q of Object.values(type.quarters)) {
      q.remaining = Math.max(0, q.entitlement - q.used);
      type.remaining += q.remaining;
    }
  }

  const now = new Date();
  const compOff = credits.map((credit) => ({
    ...credit,
    status: expiryStatus(credit, now),
  }));

  return {
    fyStart,
    fyLabel: `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`,
    types,
    compOff: {
      available: compOff.filter((c) => c.status === "Available").reduce((sum, c) => sum + (c.days || 1), 0),
      reserved: compOff.filter((c) => c.status === "Reserved").reduce((sum, c) => sum + (c.days || 1), 0),
      used: compOff.filter((c) => c.status === "Used").reduce((sum, c) => sum + (c.days || 1), 0),
      credits: compOff,
    },
  };
}

/** Validates a leave request against the quarterly quota. */
export async function validateLeaveQuota({ userId, leaveTypeKey, startDate, endDate, excludeLeaveId = null }) {
  const configs = await ensureLeaveConfigs();
  const config = configs.find((c) => c.key === leaveTypeKey);
  if (!config) return { ok: false, error: "Invalid leave type" };
  if (leaveTypeKey === "COMP_OFF") return { ok: true, config };

  const fyStart = getFinancialYearStart(startDate);
  const summary = await getUserLeaveSummary(userId, fyStart);
  const type = summary.types[leaveTypeKey];
  if (!type) return { ok: false, error: "Leave type is not configured" };

  const split = splitDaysByQuarter(startDate, endDate, fyStart);
  for (const [qKey, days] of Object.entries(split)) {
    if (!days) continue;
    const quarter = type.quarters[qKey];
    if (!quarter || days > quarter.remaining) {
      return {
        ok: false,
        error: `Not enough ${config.name} balance in Q${quarter?.quarter || "?"} (${quarter?.remaining ?? 0} remaining)`,
      };
    }
  }
  return { ok: true, config, split, fyStart };
}
