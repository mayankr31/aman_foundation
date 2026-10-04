import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

async function resolveCentreId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const centre = await prisma.afterSchoolCentre.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return centre ? centre.id : null;
}

// GET /api/after-school-centres/[id]/program-managers
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);
    if (!centreId) return NextResponse.json({ error: "After school centre not found" }, { status: 404 });

    const rows = await prisma.programManagerAfterSchoolCentre.findMany({
      where: { centreId },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, mobile: true, status: true, role: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const data = rows.map((r) => ({ assignmentId: r.id, ...r.user }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch centre program managers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/after-school-centres/[id]/program-managers  Body: { userId }
export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);
    if (!centreId) return NextResponse.json({ error: "After school centre not found" }, { status: 404 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!target || !PROGRAM_ROLES.includes(target.role.name)) {
      return NextResponse.json({ error: "Program Manager user not found" }, { status: 404 });
    }

    const assignment = await prisma.programManagerAfterSchoolCentre.create({
      data: { userId, centreId },
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Program Manager is already assigned to this centre" }, { status: 409 });
    }
    console.error("Assign program manager to centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/after-school-centres/[id]/program-managers  Body: { userId }
export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);
    if (!centreId) return NextResponse.json({ error: "After school centre not found" }, { status: 404 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const existing = await prisma.programManagerAfterSchoolCentre.findFirst({ where: { userId, centreId } });
    if (!existing) {
      return NextResponse.json({ error: "Program Manager assignment not found" }, { status: 404 });
    }

    await prisma.programManagerAfterSchoolCentre.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, message: "Program Manager removed from centre" });
  } catch (error) {
    console.error("Remove program manager from centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
