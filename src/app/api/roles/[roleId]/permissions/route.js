import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { roleId } = await context.params;

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      }
    });

    const permissions = rolePermissions.map(rp => rp.permission);

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error("Fetch role permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { roleId } = await context.params;
    const body = await req.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds must be an array" }, { status: 400 });
    }

    // Dynamic sync in atomic transaction
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        const dataToInsert = permissionIds.map(id => ({
          roleId,
          permissionId: id,
        }));
        await tx.rolePermission.createMany({
          data: dataToInsert,
        });
      }
    });

    return NextResponse.json({ success: true, message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Assign role permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
