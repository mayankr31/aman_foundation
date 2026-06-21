import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveSchoolId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const school = await prisma.school.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return school ? school.id : null;
}

// GET /api/schools/[id]/students
// Returns all students assigned to this school
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        fellow: { select: { id: true, name: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error("Fetch school students error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/schools/[id]/students
// Body: { studentId }
// Assigns an existing student to this school by updating student.schoolId
export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // Verify the student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { schoolId }
    });

    return NextResponse.json({ success: true, data: updated }, { status: 201 });
  } catch (error) {
    console.error("Assign student to school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/schools/[id]/students
// Body: { studentId }
// Removes a student from this school by setting student.schoolId to null
export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // Verify the student is actually enrolled at this school
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found at this school" },
        { status: 404 }
      );
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { schoolId: null }
    });

    return NextResponse.json({ success: true, message: "Student removed from school successfully" });
  } catch (error) {
    console.error("Remove student from school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
