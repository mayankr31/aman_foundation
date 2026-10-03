import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { getDashboardKpis } from "@/lib/dashboardKpis";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const data = await getDashboardKpis(user);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch dashboard KPIs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
