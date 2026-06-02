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

    const { id } = await context.params;

    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: id },
      include: {
        permission: true,
      },
    });

    return NextResponse.json({ success: true, data: userPermissions });
  } catch (error) {
    console.error("Fetch user permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { permissionId, type } = body;

    if (!permissionId || !type) {
      return NextResponse.json({ error: "permissionId and type are required" }, { status: 400 });
    }

    if (!["GRANT", "DENY"].includes(type)) {
      return NextResponse.json({ error: "type must be GRANT or DENY" }, { status: 400 });
    }

    const updated = await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: id,
          permissionId: permissionId,
        },
      },
      update: {
        type,
      },
      create: {
        userId: id,
        permissionId: permissionId,
        type,
      },
      include: {
        permission: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update user permission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }

    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId: id,
          permissionId: permissionId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Permission removed" });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
    console.error("Delete user permission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
