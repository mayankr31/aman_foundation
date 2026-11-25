import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getSubordinateUserIds } from "@/lib/hierarchy";
import { getCalendarYearStart, getLeaveSummariesForUsers } from "@/lib/leaves";

export const dynamic = "force-dynamic";

// Admin/HR-level roles see the whole company. Everyone else sees only the
// people who report to them in the Reports To chain.
const UNRESTRICTED_ROLES = ["ADMIN", "HR", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"];

function pickTypeSummary(type) {
  return {
    key: type.key,
    name: type.name,
    code: type.code,
    paid: type.paid,
    quotaPeriod: type.quotaPeriod,
    entitlement: type.entitlement,
    quarterlyQuota: type.quarterlyQuota ?? null,
    used: type.used,
    pending: type.pending,
    remaining: type.remaining,
    available: type.available,
    quarters: type.quarters || [],
    eligible: type.eligible ?? null,
  };
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "leaves", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for leaves" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year") || searchParams.get("fy");
    const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : getCalendarYearStart();

    const where = { status: "ACTIVE" };
    if (!UNRESTRICTED_ROLES.includes(user.role?.name)) {
      const reports = await getSubordinateUserIds(user.id, {
        includeSelf: false,
        activeOnly: true,
      });
      where.id = { in: reports };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        department: true,
        role: { select: { name: true, displayName: true, rank: true } },
      },
      orderBy: { name: "asc" },
    });

    const batch = await getLeaveSummariesForUsers(
      users.map((entry) => entry.id),
      year
    );

    const rows = users.map((entry) => {
      const summary = batch.summaries[entry.id];
      const types = {};
      for (const [key, type] of Object.entries(summary?.types || {})) {
        types[key] = pickTypeSummary(type);
      }
      return {
        user: entry,
        totals: summary?.totals || {
          paidEntitlement: 0,
          paidUsed: 0,
          paidPending: 0,
          paidAvailable: 0,
        },
        types,
        compOff: {
          available: summary?.compOff?.available || 0,
          reserved: summary?.compOff?.reserved || 0,
          used: summary?.compOff?.used || 0,
          expired: summary?.compOff?.expired || 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        year: batch.year,
        yearLabel: batch.yearLabel,
        columns: batch.columns,
        rows,
      },
    });
  } catch (error) {
    console.error("Leave balances error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
