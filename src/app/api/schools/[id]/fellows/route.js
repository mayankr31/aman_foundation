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

// GET /api/schools/[id]/fellows
// Returns all fellows assigned to this school
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const fellowSchools = await prisma.fellowSchool.findMany({
      where: { schoolId },
      include: {
        fellow: {
          select: {
            id: true,
            name: true,
            cohort: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    const fellows = fellowSchools.map((fs) => ({ assignmentId: fs.id, ...fs.fellow }));

    return NextResponse.json({ success: true, data: fellows });
  } catch (error) {
    console.error("Fetch school fellows error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/schools/[id]/fellows
// Body: { fellowId }
// Assigns a fellow to this school via FellowSchool join table
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
    const { fellowId } = body;

    if (!fellowId) {
      return NextResponse.json({ error: "fellowId is required" }, { status: 400 });
    }

    // Verify the fellow exists
    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId } });
    if (!fellow) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const assignment = await prisma.fellowSchool.create({
      data: { fellowId, schoolId },
      include: {
        fellow: {
          select: { id: true, name: true, cohort: true, email: true, phone: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    // Unique constraint violation — already assigned
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Fellow is already assigned to this school" },
        { status: 409 }
      );
    }
    console.error("Assign fellow to school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/schools/[id]/fellows
// Body: { fellowId }
// Removes a fellow assignment from this school
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
    const { fellowId } = body;

    if (!fellowId) {
      return NextResponse.json({ error: "fellowId is required" }, { status: 400 });
    }

    const existing = await prisma.fellowSchool.findFirst({
      where: { fellowId, schoolId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Fellow assignment not found" }, { status: 404 });
    }

    await prisma.fellowSchool.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true, message: "Fellow removed from school successfully" });
  } catch (error) {
    console.error("Remove fellow from school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
