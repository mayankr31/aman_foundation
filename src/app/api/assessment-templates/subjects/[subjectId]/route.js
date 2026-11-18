import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { subjectId } = await context.params;
    const { name, options, order } = await req.json();

    const existing = await prisma.SubjectAssessmentTemplate.findUnique({ where: { id: subjectId } });
    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const updated = await prisma.SubjectAssessmentTemplate.update({
      where: { id: subjectId },
      data: {
        name: name ?? existing.name,
        options: options ?? existing.options,
        order: order !== undefined ? order : existing.order
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update subject template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { subjectId } = await context.params;

    const existing = await prisma.SubjectAssessmentTemplate.findUnique({ where: { id: subjectId } });
    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    await prisma.SubjectAssessmentTemplate.delete({ where: { id: subjectId } });

    return NextResponse.json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Delete subject template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
