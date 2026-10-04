import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isEducationProgramManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isEducationProgramManaged(user.id, id))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        events: true,
        schools: {
          include: {
            school: true
          }
        },
        afterSchoolCentres: {
          include: {
            centre: true
          }
        }
      }
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

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existingProgram = await prisma.program.findUnique({
      where: { id }
    });

    if (!existingProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const updatedProgram = await prisma.program.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        duration: body.duration,
        participantsText: body.participantsText,
        status: body.status,
        icon: body.icon,
        iconBg: body.iconBg
      }
    });

    return NextResponse.json({ success: true, data: updatedProgram });
  } catch (error) {
    console.error("Update program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;

    const existingProgram = await prisma.program.findUnique({
      where: { id }
    });

    if (!existingProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete program events
      await tx.programEvent.deleteMany({
        where: { programId: id }
      });

      // 2. Delete school programs links
      await tx.schoolProgram.deleteMany({
        where: { programId: id }
      });

      // 2b. Delete after school centre program links
      await tx.afterSchoolCentreProgram.deleteMany({
        where: { programId: id }
      });

      // 3. Delete program record
      await tx.program.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Program deleted successfully" });
  } catch (error) {
    console.error("Delete program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
