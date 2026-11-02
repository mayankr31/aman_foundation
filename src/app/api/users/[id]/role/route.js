import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isManagerRoleAllowed } from "@/lib/roleHierarchy";

/**
 * ADMIN-only: change the role assigned to a user.
 * The Executive Director can promote/demote anyone else, including to ADMIN.
 * Self role changes are blocked to prevent accidental lock-out.
 */
export async function PATCH(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    if (currentUser.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;

    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const [target, role] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          managerId: true,
          manager: { select: { role: { select: { name: true } } } },
        },
      }),
      prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true },
      }),
    ]);

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!role) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
    }

    const data = { roleId: role.id };

    // ADMIN sits at the top of the hierarchy, and any existing reporting line
    // must stay valid after the role change.
    if (role.name === "ADMIN") {
      data.managerId = null;
    } else if (
      target.managerId &&
      !isManagerRoleAllowed(role.name, target.manager?.role?.name)
    ) {
      data.managerId = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        roleId: true,
        managerId: true,
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
