import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { ensureBirthdayNotifications, getTeamToday } from "@/lib/teamToday";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    await ensureBirthdayNotifications();
    const data = await getTeamToday(user);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch team today error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
