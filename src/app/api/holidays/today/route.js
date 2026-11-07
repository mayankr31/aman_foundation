import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { getTodayHoliday } from "@/lib/holidays";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const holiday = await getTodayHoliday();
    return NextResponse.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Fetch today's holiday error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
