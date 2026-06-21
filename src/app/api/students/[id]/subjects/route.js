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

// GET /api/students/[id]/subjects
// Returns all subject marks for the student
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const subjectMarks = await prisma.studentSubjectMark.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ success: true, data: subjectMarks });
  } catch (error) {
    console.error("Fetch subject marks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/students/[id]/subjects
// Body: { subject, score, grade, remarks }
// Creates a new subject mark for the student
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
    const { subject, score, grade, remarks } = body;

    if (!subject || score === undefined || !grade) {
      return NextResponse.json(
        { error: "subject, score, and grade are required" },
        { status: 400 }
      );
    }

    const subjectMark = await prisma.studentSubjectMark.create({
      data: {
        studentId,
        subject,
        score: parseFloat(score),
        grade,
        remarks: remarks ?? null
      }
    });

    return NextResponse.json({ success: true, data: subjectMark }, { status: 201 });
  } catch (error) {
    console.error("Create subject mark error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/students/[id]/subjects
// Body: { subjectMarkId, subject, score, grade, remarks }
// Updates an existing subject mark
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
    const { subjectMarkId, subject, score, grade, remarks } = body;

    if (!subjectMarkId) {
      return NextResponse.json({ error: "subjectMarkId is required" }, { status: 400 });
    }

    // Verify the record belongs to this student
    const existing = await prisma.studentSubjectMark.findFirst({
      where: { id: subjectMarkId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Subject mark not found" }, { status: 404 });
    }

    const updated = await prisma.studentSubjectMark.update({
      where: { id: subjectMarkId },
      data: {
        subject: subject ?? existing.subject,
        score: score !== undefined ? parseFloat(score) : existing.score,
        grade: grade ?? existing.grade,
        remarks: remarks !== undefined ? remarks : existing.remarks
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update subject mark error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/students/[id]/subjects
// Body: { subjectMarkId }
// Deletes a subject mark
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
    const { subjectMarkId } = body;

    if (!subjectMarkId) {
      return NextResponse.json({ error: "subjectMarkId is required" }, { status: 400 });
    }

    // Verify the record belongs to this student
    const existing = await prisma.studentSubjectMark.findFirst({
      where: { id: subjectMarkId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Subject mark not found" }, { status: 404 });
    }

    await prisma.studentSubjectMark.delete({ where: { id: subjectMarkId } });

    return NextResponse.json({ success: true, message: "Subject mark deleted successfully" });
  } catch (error) {
    console.error("Delete subject mark error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
