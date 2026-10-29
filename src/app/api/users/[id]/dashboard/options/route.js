import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getUserDashboardOptions } from "@/lib/dashboardOptions";

export const dynamic = "force-dynamic";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const target = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const data = await getUserDashboardOptions(target);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch user dashboard options error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
