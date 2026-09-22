import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

function canAccess(user, userId) {
  return user.role.name === "ADMIN" || user.role.name === "HR" || user.id === userId;
}

export async function GET(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { userId } = await params;
    if (!canAccess(user, userId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    let tasks = [];

    if (month) {
      const [year, m] = month.split("-");
      const startDate = new Date(Date.UTC(year, m - 1, 1));
      const endDate = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      tasks = await prisma.programManagerTask.findMany({
        where: { userId, plannedDate: { gte: startDate, lte: endDate } },
        include: { comments: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } } },
        orderBy: { plannedDate: "asc" },
      });
    } else if (dateStr) {
      const [year, m, day] = dateStr.split("-");
      const startOfDay = new Date(Date.UTC(year, m - 1, day));
      const endOfDay = new Date(Date.UTC(year, m - 1, day, 23, 59, 59, 999));
      tasks = await prisma.programManagerTask.findMany({
        where: {
          userId,
          OR: [
            { plannedDate: { gte: startOfDay, lte: endOfDay } },
            { plannedDate: { lt: startOfDay }, status: "Pending" },
          ],
        },
        include: { comments: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } } },
        orderBy: { plannedDate: "asc" },
      });
    } else {
      tasks = await prisma.programManagerTask.findMany({
        where: { userId },
        include: { comments: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } } },
        orderBy: { plannedDate: "desc" },
      });
    }

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching program manager tasks:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { userId } = await params;
    if (!canAccess(user, userId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, plannedDate, isPlanned } = body;

    if (!title || !plannedDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [year, m, day] = plannedDate.split("-");
    const utcDate = new Date(Date.UTC(year, m - 1, day));

    const newTask = await prisma.programManagerTask.create({
      data: {
        userId,
        title,
        description: description || null,
        plannedDate: utcDate,
        isPlanned: isPlanned !== undefined ? isPlanned : true,
      },
      include: { comments: true },
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating program manager task:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
