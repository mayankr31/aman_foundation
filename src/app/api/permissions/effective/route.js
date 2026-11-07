import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";
import { formatRoleLabel } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const [permissions, role] = await Promise.all([
      getEffectivePermissions(user),
      prisma.role.findUnique({ where: { id: user.roleId }, select: { name: true, displayName: true, updatedAt: true } }),
    ]);

    const version = `${user.updatedAt?.getTime?.() || 0}:${role?.updatedAt?.getTime?.() || 0}`;

    return NextResponse.json({
      success: true,
      data: {
        roleId: user.roleId,
        roleName: role?.name || user.role?.name || null,
        roleDisplayName: role ? formatRoleLabel(role) : null,
        permissions,
        version,
      },
    });
  } catch (error) {
    console.error("Effective permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
