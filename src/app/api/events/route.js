import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedEducationProgramIds, isEducationProgramManaged } from "@/lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    let where;
    if (user.role.name === "PROGRAM_MANAGER") {
      const managedProgramIds = await getManagedEducationProgramIds(user.id);
      where = { programId: { in: managedProgramIds } };
    }

    const events = await prisma.programEvent.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        program: true
      }
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("Fetch events error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const isAdmin = user.role.name === "ADMIN";
    const isPm = user.role.name === "PROGRAM_MANAGER";
    if (!isAdmin && !isPm) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, location, programId, status } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "Title and Date are required" }, { status: 400 });
    }

    if (isPm) {
      if (!programId || programId === "None" || !(await isEducationProgramManaged(user.id, programId))) {
        return NextResponse.json(
          { error: "Forbidden: You can only create events for programs linked to your schools or centres" },
          { status: 403 }
        );
      }
    }

    const event = await prisma.programEvent.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        status: status || "Scheduled",
        ...(programId && programId !== "None" ? { programId } : {})
      }
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
