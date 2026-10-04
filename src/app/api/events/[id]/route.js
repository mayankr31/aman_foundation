import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isEducationProgramManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

async function canPmManageEvent(userId, programId) {
  if (!programId) return false;
  return isEducationProgramManaged(userId, programId);
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;

    if (PROGRAM_ROLES.includes(user.role.name)) {
      const ev = await prisma.programEvent.findUnique({ where: { id }, select: { programId: true } });
      if (!ev || !(await canPmManageEvent(user.id, ev.programId))) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this event's program" }, { status: 403 });
      }
    }

    const event = await prisma.programEvent.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            schools: { include: { school: true } }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Fetch event detail error:", error);
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

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.programEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (PROGRAM_ROLES.includes(user.role.name) && !(await canPmManageEvent(user.id, existing.programId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this event's program" }, { status: 403 });
    }

    const updated = await prisma.programEvent.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        location: body.location,
        status: body.status
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update event error:", error);
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

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.programEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (PROGRAM_ROLES.includes(user.role.name) && !(await canPmManageEvent(user.id, existing.programId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this event's program" }, { status: 403 });
    }

    await prisma.programEvent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
