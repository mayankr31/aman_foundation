import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.student.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const assessments = await prisma.studentAssessment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: assessments });
  } catch (error) {
    console.error("Fetch assessments error:", error);
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

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { assessmentName, topic, totalMarks, marksObtained, academicYear, academicGrade, month, remarks } = body;

    if (!assessmentName || !topic || totalMarks === undefined || marksObtained === undefined) {
      return NextResponse.json(
        { error: "assessmentName, topic, totalMarks, and marksObtained are required" },
        { status: 400 }
      );
    }

    const assessment = await prisma.studentAssessment.create({
      data: {
        studentId,
        assessmentName,
        topic,
        totalMarks: parseFloat(totalMarks),
        marksObtained: parseFloat(marksObtained),
        academicYear: academicYear ?? null,
        academicGrade: academicGrade ?? null,
        month: month ?? null,
        remarks: remarks ?? null
      }
    });

    return NextResponse.json({ success: true, data: assessment }, { status: 201 });
  } catch (error) {
    console.error("Create assessment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { assessmentId, assessmentName, topic, totalMarks, marksObtained, academicYear, academicGrade, month, remarks } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
    }

    const existing = await prisma.studentAssessment.findFirst({
      where: { id: assessmentId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const updated = await prisma.studentAssessment.update({
      where: { id: assessmentId },
      data: {
        assessmentName: assessmentName ?? existing.assessmentName,
        topic: topic ?? existing.topic,
        totalMarks: totalMarks !== undefined ? parseFloat(totalMarks) : existing.totalMarks,
        marksObtained: marksObtained !== undefined ? parseFloat(marksObtained) : existing.marksObtained,
        academicYear: academicYear !== undefined ? (academicYear || null) : existing.academicYear,
        academicGrade: academicGrade !== undefined ? (academicGrade || null) : existing.academicGrade,
        month: month !== undefined ? (month || null) : existing.month,
        remarks: remarks !== undefined ? remarks : existing.remarks
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update assessment error:", error);
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
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
    }

    const existing = await prisma.studentAssessment.findFirst({
      where: { id: assessmentId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    await prisma.studentAssessment.delete({ where: { id: assessmentId } });

    return NextResponse.json({ success: true, message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Delete assessment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
