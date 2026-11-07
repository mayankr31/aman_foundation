import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { formatRoleLabel } from "@/lib/roles";

function parseRank(value) {
  if (value === undefined) return {};
  if (value === null || value === "") return { rank: null };
  const rank = Number(value);
  if (!Number.isInteger(rank) || rank < 0) {
    return { error: "Seniority must be a whole number of 0 or higher" };
  }
  return { rank };
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { roleId } = await context.params;
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = {};

    if (body.displayName !== undefined || body.name !== undefined) {
      const displayName = String(body.displayName ?? body.name ?? "").trim();
      if (!displayName) {
        return NextResponse.json({ error: "Role name is required" }, { status: 400 });
      }
      if (displayName.length > 80) {
        return NextResponse.json(
          { error: "Role name must be 80 characters or fewer" },
          { status: 400 }
        );
      }

      const roles = await prisma.role.findMany({
        select: { id: true, name: true, displayName: true },
      });
      const target = displayName.toLowerCase();
      const duplicate = roles.find(
        (item) =>
          item.id !== roleId && formatRoleLabel(item).toLowerCase() === target
      );
      if (duplicate) {
        return NextResponse.json({ error: "Role already exists" }, { status: 409 });
      }

      data.displayName = displayName;
    }

    if (body.description !== undefined) {
      data.description =
        body.description === null ? null : String(body.description).trim() || null;
    }

    if (body.displayInRegister !== undefined) {
      data.displayInRegister = Boolean(body.displayInRegister);
    }

    const { rank, error: rankError } = parseRank(body.rank);
    if (rankError) {
      return NextResponse.json({ error: rankError }, { status: 400 });
    }
    if (rank !== undefined) {
      data.rank = rank;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: true, data: role });
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data,
      select: {
        id: true,
        name: true,
        displayName: true,
        rank: true,
        description: true,
        displayInRegister: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedRole });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Role already exists" }, { status: 409 });
    }
    console.error("Update role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
