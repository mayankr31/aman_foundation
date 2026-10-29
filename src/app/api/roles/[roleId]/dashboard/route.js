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

    const { roleId } = await context.params;
    const config = await prisma.dashboardConfig.findUnique({ where: { roleId } });
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Fetch role dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { roleId } = await context.params;
    const body = await req.json();
    if (!Array.isArray(body.kpiKeys) || !Array.isArray(body.linkKeys)) {
      return NextResponse.json({ error: "kpiKeys and linkKeys must be arrays" }, { status: 400 });
    }

    const keys = sanitizeDashboardKeys(body);
    const config = await prisma.dashboardConfig.upsert({
      where: { roleId },
      update: { ...keys, updatedById: auth.user.id },
      create: { roleId, ...keys, updatedById: auth.user.id },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Update role dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { roleId } = await context.params;
    await prisma.dashboardConfig.deleteMany({ where: { roleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset role dashboard config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
