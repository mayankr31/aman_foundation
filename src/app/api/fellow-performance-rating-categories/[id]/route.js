import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function canManage(user) {
  return user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);
}

// Soft-delete a category so historical scores remain stored but the column is
// hidden from the form and table.
export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    if (!canManage(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only managers can delete rating categories" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const existing = await prisma.performanceRatingCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rating category not found" }, { status: 404 });
    }

    await prisma.performanceRatingCategory.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, message: "Rating category removed" });
  } catch (err) {
    console.error("Delete rating category error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
