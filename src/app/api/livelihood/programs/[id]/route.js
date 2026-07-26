import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await params;

    const program = await prisma.livelihoodProgram.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            beneficiary: {
              select: {
                id: true,
                name: true,
                enrolmentId: true,
                address: true,
                mobNumber: true,
                tier: true,
              },
            },
            events: {
              orderBy: { eventDate: "desc" },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("Fetch program detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER" &&
      user.role.name !== "FELLOW"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, category, type, status, totalTarget } = body;

    const existing = await prisma.livelihoodProgram.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (totalTarget !== undefined)
      updateData.totalTarget = totalTarget !== "" ? parseFloat(totalTarget) : null;

    const program = await prisma.livelihoodProgram.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("Update program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.livelihoodProgram.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    await prisma.livelihoodProgram.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Program deleted successfully" });
  } catch (error) {
    console.error("Delete program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
