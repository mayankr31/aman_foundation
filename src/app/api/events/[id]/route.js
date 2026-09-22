import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isEducationProgramManaged } from "@/lib/scope";

async function canPmManageEvent(userId, programId) {
  if (!programId) return false;
  return isEducationProgramManaged(userId, programId);
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    if (user.role.name === "PROGRAM_MANAGER") {
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

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.programEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await canPmManageEvent(user.id, existing.programId))) {
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

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.programEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await canPmManageEvent(user.id, existing.programId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this event's program" }, { status: 403 });
    }

    await prisma.programEvent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
