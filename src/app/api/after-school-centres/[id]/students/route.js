import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin, isCentreManaged } from "@/lib/scope";

async function resolveCentreId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const centre = await prisma.afterSchoolCentre.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return centre ? centre.id : null;
}

// GET /api/after-school-centres/[id]/students
// Returns all after school students assigned to this centre
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    const students = await prisma.afterSchoolStudent.findMany({
      where: { centreId },
      include: {
        fellow: { select: { id: true, name: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error("Fetch centre students error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/after-school-centres/[id]/students
// Body: { studentId }
// Assigns an existing after school student to this centre by updating student.centreId
export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isAdmin(user) && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isCentreManaged(user.id, centreId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this centre" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.afterSchoolStudent.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const updated = await prisma.afterSchoolStudent.update({
      where: { id: studentId },
      data: { centreId }
    });

    return NextResponse.json({ success: true, data: updated }, { status: 201 });
  } catch (error) {
    console.error("Assign student to centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/after-school-centres/[id]/students
// Body: { studentId }
// Removes a student from this centre by setting student.centreId to null
export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isAdmin(user) && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isCentreManaged(user.id, centreId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this centre" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.afterSchoolStudent.findFirst({
      where: { id: studentId, centreId }
    });

    if (!student) {
      return NextResponse.json(
        { error: "After school student not found at this centre" },
        { status: 404 }
      );
    }

    await prisma.afterSchoolStudent.update({
      where: { id: studentId },
      data: { centreId: null }
    });

    return NextResponse.json({ success: true, message: "Student removed from centre successfully" });
  } catch (error) {
    console.error("Remove student from centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
