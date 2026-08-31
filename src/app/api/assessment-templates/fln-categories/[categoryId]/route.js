import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

function canManageTemplates(user) {
  return user.role.name === "ADMIN" || user.role.name === "PROGRAM_MANAGER";
}

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageTemplates(user)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { categoryId } = await context.params;
    const { name, order } = await req.json();

    const existing = await prisma.FLNCategory.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.FLNCategory.update({
      where: { id: categoryId },
      data: {
        name: name ?? existing.name,
        order: order !== undefined ? order : existing.order
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update FLN category error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageTemplates(user)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { categoryId } = await context.params;

    const existing = await prisma.FLNCategory.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.FLNCategory.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete FLN category error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
