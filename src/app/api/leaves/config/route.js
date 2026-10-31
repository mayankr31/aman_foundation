import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { ensureLeaveConfigs } from "@/lib/leaves";
import { QUOTA_PERIODS, slugifyLeaveName } from "@/lib/leavePolicy";

export const dynamic = "force-dynamic";

const POLICY_ADMIN_ROLES = ["ADMIN", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"];
const SYSTEM_KEYS = [
  "CASUAL",
  "SICK",
  "MATERNITY",
  "PATERNITY",
  "COMP_OFF",
  "BEREAVEMENT",
  "SPECIAL",
  "LWP",
  "RESTRICTED_HOLIDAY",
  "EMERGENCY",
];
const PERIOD_LOCKED_KEYS = ["COMP_OFF", "MATERNITY", "PATERNITY", "BEREAVEMENT", "LWP"];

function isSystemConfig(config) {
  return !!config?.isSystem || SYSTEM_KEYS.includes(config?.key);
}

function canManageLeavePolicy(user) {
  return POLICY_ADMIN_ROLES.includes(user?.role?.name);
}

function optionalInt(value, label, { min = 0, max = null } = {}) {
  if (value === undefined) return { skip: true };
  if (value === null || value === "") return { value: null };
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || (max != null && number > max)) {
    return { error: `${label} must be a whole number between ${min} and ${max ?? "unlimited"}.` };
  }
  return { value: number };
}

function quotaValue(value, label) {
  if (value === undefined) return { skip: true };
  if (value === null || value === "") return { value: 0 };
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return { error: `${label} must be a valid number of days.` };
  }
  return { value: number };
}

function textValue(value, label, { maxLength = 240 } = {}) {
  if (value === undefined) return { skip: true };
  const text = String(value ?? "").trim();
  if (text.length > maxLength) return { error: `${label} is too long.` };
  return { value: text || null };
}

function boolValue(value) {
  if (value === undefined) return { skip: true };
  return { value: !!value };
}

function buildConfigData(item, { creating = false } = {}) {
  const data = {};

  if (creating || item.name !== undefined) {
    const name = String(item.name ?? "").trim();
    if (!name) return { error: "Leave type name is required." };
    if (name.length > 80) return { error: "Leave type name is too long." };
    data.name = name;
  }

  for (const [field, label] of [
    ["code", "Short code"],
    ["policyNote", "Policy note"],
  ]) {
    if (item[field] === undefined) continue;
    const result = textValue(item[field], label, { maxLength: field === "policyNote" ? 600 : 12 });
    if (result.error) return result;
    data[field] = result.value ? (field === "code" ? result.value.toUpperCase() : result.value) : null;
  }

  const quotas = [
    ["annualQuota", "Annual quota"],
  ];
  for (const [field, label] of quotas) {
    if (item[field] === undefined) continue;
    const result = quotaValue(item[field], label);
    if (result.error) return result;
    data[field] = result.value;
  }

  if (item.quotaPeriod !== undefined) {
    if (
      ![
        QUOTA_PERIODS.FINANCIAL_YEAR,
        QUOTA_PERIODS.CALENDAR_YEAR,
        QUOTA_PERIODS.PER_EVENT,
        QUOTA_PERIODS.UNLIMITED,
        QUOTA_PERIODS.CREDIT,
      ].includes(item.quotaPeriod)
    ) {
      return { error: "Select a valid quota period." };
    }
    data.quotaPeriod = item.quotaPeriod;
  } else if (creating) {
    data.quotaPeriod = QUOTA_PERIODS.FINANCIAL_YEAR;
  }

  const intFields = [
    ["maxConsecutiveDays", "Maximum consecutive days", { min: 1, max: 366 }],
    ["maxConsecutiveMonths", "Maximum consecutive months", { min: 1, max: 12 }],
    ["minServiceDays", "Minimum service days", { min: 0, max: 3650 }],
    ["medicalCertificateAfterDays", "Medical certificate threshold", { min: 0, max: 366 }],
    ["validityDays", "Validity days", { min: 1, max: 3650 }],
    ["sortOrder", "Sort order", { min: 0, max: 10000 }],
  ];
  for (const [field, label, limits] of intFields) {
    if (item[field] === undefined) continue;
    const result = optionalInt(item[field], label, limits);
    if (result.error) return result;
    data[field] = result.value;
  }

  for (const field of ["softMaxConsecutive", "paid", "holidayNameRequired", "active"]) {
    if (item[field] === undefined) continue;
    const result = boolValue(item[field]);
    if (result.error) return result;
    data[field] = result.value;
  }

  if (creating) {
    data.active = item.active === undefined ? true : !!item.active;
    data.paid = item.paid === undefined ? true : !!item.paid;
    data.isSystem = false;
    data.systemType = null;
    data.sortOrder = item.sortOrder === undefined ? undefined : Number(item.sortOrder);
  }

  return { data };
}

async function validateNameUnique(name, excludedKey = null) {
  if (!name) return true;
  const configs = await prisma.leaveTypeConfig.findMany({ select: { key: true, name: true } });
  const normalized = name.trim().toLowerCase();
  return !configs.some(
    (config) => config.key !== excludedKey && String(config.name || "").trim().toLowerCase() === normalized
  );
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageLeavePolicy(user) && !(await checkPermission(user, "dashboard", "leaves", "READ"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const configs = await ensureLeaveConfigs();
    return NextResponse.json({
      success: true,
      data: configs.map((config) => ({ ...config, isSystem: isSystemConfig(config) })),
    });
  } catch (error) {
    console.error("Fetch leave config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageLeavePolicy(user)) {
      return NextResponse.json({ error: "Only the Executive Director can add leave types." }, { status: 403 });
    }

    const body = await req.json();
    const built = buildConfigData(body, { creating: true });
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 });
    if (built.data.quotaPeriod === QUOTA_PERIODS.CREDIT) {
      return NextResponse.json({ error: "Compensatory credit is reserved for Compensatory Leave." }, { status: 400 });
    }

    if (!(await validateNameUnique(built.data.name))) {
      return NextResponse.json({ error: "A leave type with this name already exists." }, { status: 400 });
    }

    const baseKey = slugifyLeaveName(built.data.name);
    let key = baseKey;
    let suffix = 2;
    while (await prisma.leaveTypeConfig.findUnique({ where: { key } })) {
      key = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    const maxSort = await prisma.leaveTypeConfig.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.leaveTypeConfig.create({
      data: {
        ...built.data,
        key,
        sortOrder: built.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Create leave type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageLeavePolicy(user)) {
      return NextResponse.json({ error: "Only the Executive Director can edit leave policy." }, { status: 403 });
    }

    const body = await req.json();
    const configs = Array.isArray(body.configs) ? body.configs : [];
    if (!configs.length) {
      return NextResponse.json({ error: "configs array is required" }, { status: 400 });
    }

    await ensureLeaveConfigs();
    const existingConfigs = await prisma.leaveTypeConfig.findMany();
    const byKey = new Map(existingConfigs.map((config) => [config.key, config]));

    for (const item of configs) {
      if (!item.key) continue;
      const existing = byKey.get(item.key);
      if (!existing) {
        return NextResponse.json({ error: `Unknown leave type: ${item.key}` }, { status: 400 });
      }

      const built = buildConfigData(item);
      if (built.error) return NextResponse.json({ error: built.error }, { status: 400 });
      const data = { ...built.data };
      if (data.quotaPeriod === QUOTA_PERIODS.CREDIT && existing.key !== "COMP_OFF") {
        return NextResponse.json(
          { error: "Compensatory credit is reserved for Compensatory Leave." },
          { status: 400 }
        );
      }

      // Built-in types keep their key and core behaviour. Their quotas, limits
      // and policy notes remain editable; special-behaviour periods stay fixed.
      if (isSystemConfig(existing)) {
        if (PERIOD_LOCKED_KEYS.includes(existing.key)) delete data.quotaPeriod;
        delete data.isSystem;
        delete data.systemType;
      }

      if (data.name && !(await validateNameUnique(data.name, item.key))) {
        return NextResponse.json(
          { error: `A leave type named "${data.name}" already exists.` },
          { status: 400 }
        );
      }

      await prisma.leaveTypeConfig.update({
        where: { key: item.key },
        data,
      });
    }

    const updated = await prisma.leaveTypeConfig.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({
      success: true,
      data: updated.map((config) => ({ ...config, isSystem: isSystemConfig(config) })),
    });
  } catch (error) {
    console.error("Update leave config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageLeavePolicy(user)) {
      return NextResponse.json({ error: "Only the Executive Director can remove leave types." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

    const config = await prisma.leaveTypeConfig.findUnique({ where: { key } });
    if (!config) return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    if (isSystemConfig(config)) {
      return NextResponse.json(
        { error: "Built-in leave types cannot be deleted. Deactivate it instead." },
        { status: 400 }
      );
    }

    const used = await prisma.leave.count({
      where: { OR: [{ leaveTypeKey: key }, { type: config.name }] },
    });
    if (used > 0) {
      return NextResponse.json(
        { error: "This leave type has requests and can only be deactivated." },
        { status: 400 }
      );
    }

    await prisma.leaveTypeConfig.delete({ where: { key } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete leave type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
