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

    const { questionId } = await context.params;
    const { categoryId, questionText, marks, order } = await req.json();

    const existing = await prisma.FLNQuestion.findUnique({ where: { id: questionId } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updated = await prisma.FLNQuestion.update({
      where: { id: questionId },
      data: {
        categoryId: categoryId ?? existing.categoryId,
        questionText: questionText ?? existing.questionText,
        marks: marks !== undefined ? parseFloat(marks) : existing.marks,
        order: order !== undefined ? order : existing.order
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update FLN question error:", error);
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

    const { questionId } = await context.params;

    const existing = await prisma.FLNQuestion.findUnique({ where: { id: questionId } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await prisma.FLNQuestion.delete({ where: { id: questionId } });

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("Delete FLN question error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
