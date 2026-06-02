import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    // Must be ADMIN
    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { roleId } = await context.params;

    // Retrieve role to check name
    const roleToDelete = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!roleToDelete) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Protect the ADMIN role from deletion
    if (roleToDelete.name === "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Cannot delete the ADMIN role" }, { status: 403 });
    }

    // Atomic transaction to clear bindings and delete
    await prisma.$transaction(async (tx) => {
      // 1. Delete all role permissions linked to this role
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });

      // 2. Note: Any user bound to this role will trigger a Restrict violation.
      // So we must inform the admin or handle it. Let's restrict it natively by letting the delete throw or check.
      const boundUsers = await tx.user.count({
        where: { roleId }
      });

      if (boundUsers > 0) {
        throw new Error(`Cannot delete role: ${boundUsers} users are currently assigned to it.`);
      }

      await tx.role.delete({
        where: { id: roleId }
      });
    });

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
