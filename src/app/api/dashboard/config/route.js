import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { getEffectiveDashboardConfig } from "@/lib/dashboardConfig";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const config = await getEffectiveDashboardConfig(user);
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Fetch dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
