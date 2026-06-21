import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const programs = await prisma.program.findMany({
      include: {
        _count: {
          select: { schools: true, events: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("Fetch programs error:", error);
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
    const { title, description, duration, participantsText, status, icon, iconBg } = body;

    if (!title) {
      return NextResponse.json({ error: "Program title is required" }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        title,
        description,
        duration,
        participantsText,
        status: status || "Planning",
        icon,
        iconBg
      }
    });

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    console.error("Create program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
