import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { getTodayLeaves } from "@/lib/teamToday";
import { getISTDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const scope = await getTodayLeaves(user);
    return NextResponse.json({
      success: true,
      data: scope.items,
      meta: { date: getISTDateKey(), hasTeam: scope.hasTeam },
    });
  } catch (error) {
    console.error("Fetch today's leaves error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
