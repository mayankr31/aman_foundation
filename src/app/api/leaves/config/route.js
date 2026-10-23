import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { ensureLeaveConfigs } from "@/lib/leaves";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "leaves", "READ"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const configs = await ensureLeaveConfigs();
    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error("Fetch leave config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can edit leave policy" }, { status: 403 });
    }

    const body = await req.json();
    const configs = Array.isArray(body.configs) ? body.configs : [];
    if (!configs.length) {
      return NextResponse.json({ error: "configs array is required" }, { status: 400 });
    }

    await ensureLeaveConfigs();

    for (const item of configs) {
      if (!item.key) continue;
      const hasAnnual = item.annualQuota !== undefined && item.annualQuota !== null && item.annualQuota !== "";
      const hasQuarterly = item.quarterlyQuota !== undefined && item.quarterlyQuota !== null && item.quarterlyQuota !== "";
      const inputAnnual = hasAnnual ? Number(item.annualQuota) : null;
      const inputQuarterly = hasQuarterly ? Number(item.quarterlyQuota) : null;

      if (hasAnnual && (!Number.isFinite(inputAnnual) || inputAnnual < 0)) {
        return NextResponse.json({ error: `Invalid annual quota for ${item.key}` }, { status: 400 });
      }
      if (hasQuarterly && (!Number.isFinite(inputQuarterly) || inputQuarterly < 0)) {
        return NextResponse.json({ error: `Invalid quarterly quota for ${item.key}` }, { status: 400 });
      }

      if (item.key !== "COMP_OFF") {
        if (
          (hasAnnual && (!Number.isInteger(inputAnnual) || inputAnnual % 4 !== 0)) ||
          (hasQuarterly && !Number.isInteger(inputQuarterly))
        ) {
          return NextResponse.json(
            { error: `Annual quota for ${item.key} must be a whole number divisible by 4.` },
            { status: 400 }
          );
        }
      }

      // Either value may be supplied; calculate the other so the policy stays
      // consistent even when the request comes from the API directly.
      const annualQuota = hasAnnual
        ? inputAnnual
        : hasQuarterly
          ? inputQuarterly * 4
          : 0;
      const quarterlyQuota = hasQuarterly
        ? inputQuarterly
        : hasAnnual
          ? inputAnnual / 4
          : null;

      await prisma.leaveTypeConfig.update({
        where: { key: item.key },
        data: {
          annualQuota,
          quarterlyQuota,
          ...(item.active !== undefined && { active: !!item.active }),
        },
      });
    }

    const updated = await prisma.leaveTypeConfig.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update leave config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
