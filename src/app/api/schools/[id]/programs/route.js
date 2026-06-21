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

// GET /api/schools/[id]/programs
// Returns all programs associated with this school
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const schoolPrograms = await prisma.schoolProgram.findMany({
      where: { schoolId },
      include: {
        program: true
      }
    });

    const programs = schoolPrograms.map((sp) => ({ assignmentId: sp.id, ...sp.program }));

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("Fetch school programs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/schools/[id]/programs
// Body: { programId }
// Associates a program with this school via SchoolProgram join table
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
    const { programId } = body;

    if (!programId) {
      return NextResponse.json({ error: "programId is required" }, { status: 400 });
    }

    // Verify the program exists
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const assignment = await prisma.schoolProgram.create({
      data: { schoolId, programId },
      include: { program: true }
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    // Unique constraint violation — already linked
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Program is already assigned to this school" },
        { status: 409 }
      );
    }
    console.error("Assign program to school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/schools/[id]/programs
// Body: { programId }
// Removes a program association from this school
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
    const { programId } = body;

    if (!programId) {
      return NextResponse.json({ error: "programId is required" }, { status: 400 });
    }

    const existing = await prisma.schoolProgram.findFirst({
      where: { schoolId, programId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Program assignment not found" }, { status: 404 });
    }

    await prisma.schoolProgram.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: "Program removed from school successfully"
    });
  } catch (error) {
    console.error("Remove program from school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
