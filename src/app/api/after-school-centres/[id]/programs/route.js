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

// GET /api/after-school-centres/[id]/programs
// Returns all programs associated with this centre
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    const centrePrograms = await prisma.afterSchoolCentreProgram.findMany({
      where: { centreId },
      include: {
        program: true
      }
    });

    const programs = centrePrograms.map((cp) => ({ assignmentId: cp.id, ...cp.program }));

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("Fetch centre programs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/after-school-centres/[id]/programs
// Body: { programId }
// Associates a program with this centre via AfterSchoolCentreProgram join table
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
    const { programId } = body;

    if (!programId) {
      return NextResponse.json({ error: "programId is required" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const assignment = await prisma.afterSchoolCentreProgram.create({
      data: { centreId, programId },
      include: { program: true }
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Program is already assigned to this centre" },
        { status: 409 }
      );
    }
    console.error("Assign program to centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/after-school-centres/[id]/programs
// Body: { programId }
// Removes a program association from this centre
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
    const { programId } = body;

    if (!programId) {
      return NextResponse.json({ error: "programId is required" }, { status: 400 });
    }

    const existing = await prisma.afterSchoolCentreProgram.findFirst({
      where: { centreId, programId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Program assignment not found" }, { status: 404 });
    }

    await prisma.afterSchoolCentreProgram.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: "Program removed from centre successfully"
    });
  } catch (error) {
    console.error("Remove program from centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
