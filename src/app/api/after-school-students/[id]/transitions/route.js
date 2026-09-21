import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.afterSchoolStudent.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

// GET /api/after-school-students/[id]/transitions
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const transitions = await prisma.afterSchoolStudentTransition.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: transitions });
  } catch (error) {
    console.error("Fetch transitions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/after-school-students/[id]/transitions
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
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { academicYear, month, status, description, location } = body;

    if (!academicYear || !month) {
      return NextResponse.json(
        { error: "academicYear and month are required" },
        { status: 400 }
      );
    }

    const transition = await prisma.afterSchoolStudentTransition.create({
      data: {
        studentId,
        academicYear,
        month,
        status: status || "CONTINUING_EDUCATION",
        description: description ?? null,
        location: location ?? null
      }
    });

    return NextResponse.json({ success: true, data: transition }, { status: 201 });
  } catch (error) {
    console.error("Create transition error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/after-school-students/[id]/transitions
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
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { transitionId, academicYear, month, status, description, location } = body;

    if (!transitionId) {
      return NextResponse.json({ error: "transitionId is required" }, { status: 400 });
    }

    const existing = await prisma.afterSchoolStudentTransition.findFirst({
      where: { id: transitionId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Transition not found" }, { status: 404 });
    }

    const updated = await prisma.afterSchoolStudentTransition.update({
      where: { id: transitionId },
      data: {
        academicYear: academicYear ?? existing.academicYear,
        month: month ?? existing.month,
        status: status ?? existing.status,
        description: description !== undefined ? description : existing.description,
        location: location !== undefined ? location : existing.location
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update transition error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/after-school-students/[id]/transitions
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
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { transitionId } = body;

    if (!transitionId) {
      return NextResponse.json({ error: "transitionId is required" }, { status: 400 });
    }

    const existing = await prisma.afterSchoolStudentTransition.findFirst({
      where: { id: transitionId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Transition not found" }, { status: 404 });
    }

    await prisma.afterSchoolStudentTransition.delete({ where: { id: transitionId } });

    return NextResponse.json({ success: true, message: "Transition deleted successfully" });
  } catch (error) {
    console.error("Delete transition error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
