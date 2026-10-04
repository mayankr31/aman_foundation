import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

// GET /api/livelihood/programs/[id]/fellows
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

    const rows = await prisma.fellowLivelihoodProgram.findMany({
      where: { programId },
      include: {
        fellow: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const data = rows.map((r) => ({ assignmentId: r.id, ...r.fellow }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch program fellows error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/livelihood/programs/[id]/fellows  Body: { fellowId }
export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id: programId } = await params;
    const program = await prisma.livelihoodProgram.findUnique({ where: { id: programId } });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    const { fellowId } = await req.json();
    if (!fellowId) return NextResponse.json({ error: "fellowId is required" }, { status: 400 });

    const target = await prisma.fellow.findUnique({ where: { id: fellowId } });
    if (!target) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const assignment = await prisma.fellowLivelihoodProgram.create({
      data: { fellowId, programId },
      include: { fellow: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Fellow is already assigned to this program" }, { status: 409 });
    }
    console.error("Assign fellow to program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/livelihood/programs/[id]/fellows  Body: { fellowId }
export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id: programId } = await params;
    const { fellowId } = await req.json();
    if (!fellowId) return NextResponse.json({ error: "fellowId is required" }, { status: 400 });

    const existing = await prisma.fellowLivelihoodProgram.findFirst({
      where: { fellowId, programId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Fellow assignment not found" }, { status: 404 });
    }

    await prisma.fellowLivelihoodProgram.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, message: "Fellow removed from program" });
  } catch (error) {
    console.error("Remove fellow from program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
