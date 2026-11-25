import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { canAccessUser } from "@/lib/hierarchy";
import { getCalendarYearStart, getUserLeaveSummary } from "@/lib/leaves";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "leaves", "READ"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId") || user.id;
    const yearParam = searchParams.get("year") || searchParams.get("fy");
    const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : getCalendarYearStart();

    if (requestedUserId !== user.id) {
      const allowed = await canAccessUser(user, requestedUserId, { allowSelf: true });
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const summary = await getUserLeaveSummary(requestedUserId, year);
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Leave summary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
