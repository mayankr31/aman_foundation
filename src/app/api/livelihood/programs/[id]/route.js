import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin, isLivelihoodProgramManaged, getFellowIdByUserId, isLivelihoodProgramAssignedToFellow } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id } = await params;

    let allowed = isAdmin(user);
    if (!allowed && PROGRAM_ROLES.includes(user.role.name)) {
      allowed = await isLivelihoodProgramManaged(user.id, id);
    }
    if (!allowed && user.role.name === "FELLOW") {
      const fellowId = await getFellowIdByUserId(user.id);
      allowed = await isLivelihoodProgramAssignedToFellow(fellowId, id);
    }
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this program" },
        { status: 403 }
      );
    }

    const program = await prisma.livelihoodProgram.findUnique({
      where: { id },
      include: {
        programManagers: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, mobile: true, role: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        fellows: {
          include: {
            fellow: {
              select: { id: true, name: true, email: true, phone: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
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

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      !PROGRAM_ROLES.includes(user.role.name) &&
      user.role.name !== "FELLOW"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isLivelihoodProgramManaged(user.id, id))) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this program" },
        { status: 403 }
      );
    }

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

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      !PROGRAM_ROLES.includes(user.role.name)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isLivelihoodProgramManaged(user.id, id))) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this program" },
        { status: 403 }
      );
    }

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
