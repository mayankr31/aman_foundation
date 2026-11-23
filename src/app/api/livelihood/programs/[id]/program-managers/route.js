import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";

// GET /api/livelihood/programs/[id]/program-managers
export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId } = await params;
    const program = await prisma.livelihoodProgram.findUnique({ where: { id: programId } });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    const rows = await prisma.programManagerLivelihoodProgram.findMany({
      where: { programId },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, mobile: true, status: true, role: { select: { name: true, displayName: true, rank: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const data = rows.map((r) => ({ assignmentId: r.id, ...r.user }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch program managers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/livelihood/programs/[id]/program-managers  Body: { userId }
export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId } = await params;
    const program = await prisma.livelihoodProgram.findUnique({ where: { id: programId } });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can assign staff to programs" },
        { status: 403 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.status !== "ACTIVE") {
      return NextResponse.json({ error: "Selected user is not active" }, { status: 400 });
    }
    if (!(await checkPermission(target, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json(
        { error: "This user's role does not have Livelihood access" },
        { status: 400 }
      );
    }

    const assignment = await prisma.programManagerLivelihoodProgram.create({
      data: { userId, programId },
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
    });

    try {
      await notifyUsers([userId], {
        type: NOTIFICATION_TYPES.PROGRAM_ASSIGNED,
        title: "Livelihood Program Management Assigned",
        message: `You have been assigned as a Program Manager for ${program.name}.`,
        link: `/livelihood/programs/${programId}`,
        actorId: user.id,
      });
    } catch (notificationError) {
      console.error("Livelihood program assignment notification error:", notificationError);
    }

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Program Manager is already assigned to this program" }, { status: 409 });
    }
    console.error("Assign program manager error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/livelihood/programs/[id]/program-managers  Body: { userId }
export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId } = await params;
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can remove staff from programs" },
        { status: 403 }
      );
    }

    const existing = await prisma.programManagerLivelihoodProgram.findFirst({
      where: { userId, programId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Program Manager assignment not found" }, { status: 404 });
    }

    await prisma.programManagerLivelihoodProgram.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, message: "Program Manager removed from program" });
  } catch (error) {
    console.error("Remove program manager error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
