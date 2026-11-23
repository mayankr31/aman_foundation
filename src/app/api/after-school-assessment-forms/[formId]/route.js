import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { canAccessAfterSchoolStudent } from "@/lib/scope";
import { isProgramStaffRole } from "@/lib/roles";


function canManageTemplates(user) {
  return user.role.name === "ADMIN" || isProgramStaffRole(user?.role?.name);
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { formId } = await context.params;

    const form = await prisma.afterSchoolAssessmentForm.findUnique({
      where: { id: formId },
      include: {
        student: { select: { id: true, name: true, gender: true, dob: true, grade: true } },
        fellow: { select: { id: true, name: true } },
        centre: { select: { id: true, name: true } },
        subjectResponses: {
          include: { subjectTemplate: true }
        },
        flnResponses: {
          include: { flnQuestion: { include: { category: true } } }
        }
      }
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!(await canAccessAfterSchoolStudent(user, form.studentId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: form });
  } catch (error) {
    console.error("Fetch assessment form error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { formId } = await context.params;
    const { assessmentType, date, isEnrolledInSchool, reasonNotEnrolled } = await req.json();

    const existing = await prisma.afterSchoolAssessmentForm.findUnique({ where: { id: formId } });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!(await canAccessAfterSchoolStudent(user, existing.studentId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
    }

    const updated = await prisma.afterSchoolAssessmentForm.update({
      where: { id: formId },
      data: {
        assessmentType: assessmentType ?? existing.assessmentType,
        date: date ? new Date(date) : existing.date,
        isEnrolledInSchool: isEnrolledInSchool !== undefined ? isEnrolledInSchool : existing.isEnrolledInSchool,
        reasonNotEnrolled: reasonNotEnrolled !== undefined ? reasonNotEnrolled : existing.reasonNotEnrolled
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update assessment form error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (user.role?.name !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can delete records" },
        { status: 403 }
      );
    }

    if (!canManageTemplates(user)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { formId } = await context.params;

    const existing = await prisma.afterSchoolAssessmentForm.findUnique({ where: { id: formId } });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    await prisma.afterSchoolAssessmentForm.delete({ where: { id: formId } });

    return NextResponse.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    console.error("Delete assessment form error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
