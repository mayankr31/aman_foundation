import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getRoleDashboardOptions } from "@/lib/dashboardOptions";

export const dynamic = "force-dynamic";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { roleId } = await context.params;
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true },
    });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    const data = await getRoleDashboardOptions(role);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch role dashboard options error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
