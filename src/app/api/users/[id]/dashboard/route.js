import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { sanitizeDashboardKeys } from "@/lib/dashboardConfig";

export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const { user, error } = await authenticateUser(req);
  if (error) return { error };
  if (user.role.name !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 }) };
  }
  return { user };
}

export async function GET(req, context) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const config = await prisma.dashboardConfig.findUnique({ where: { userId: id } });
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Fetch user dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();
    if (!Array.isArray(body.kpiKeys) || !Array.isArray(body.linkKeys)) {
      return NextResponse.json({ error: "kpiKeys and linkKeys must be arrays" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const keys = sanitizeDashboardKeys(body);
    const config = await prisma.dashboardConfig.upsert({
      where: { userId: id },
      update: { ...keys, updatedById: auth.user.id },
      create: { userId: id, ...keys, updatedById: auth.user.id },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Update user dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    await prisma.dashboardConfig.deleteMany({ where: { userId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset user dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
