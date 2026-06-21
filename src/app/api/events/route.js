import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const events = await prisma.programEvent.findMany({
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

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, location, programId, status } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "Title and Date are required" }, { status: 400 });
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
