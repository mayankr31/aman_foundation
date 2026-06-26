import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ success: false, error: "No token" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    const { id: fellowId } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: "YYYY-MM"
    const dateStr = searchParams.get("date"); // Format: "YYYY-MM-DD"

    let tasks = [];

    if (month) {
      // Fetch for the entire month
      const [year, m] = month.split('-');
      const startDate = new Date(Date.UTC(year, m - 1, 1));
      const endDate = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      
      tasks = await prisma.fellowTask.findMany({
        where: {
          fellowId,
          plannedDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          comments: {
            include: { author: true },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { plannedDate: 'asc' }
      });
    } else if (dateStr) {
      // Fetch for a specific date AND carry-forward tasks
      const [year, m, day] = dateStr.split('-');
      const startOfDay = new Date(Date.UTC(year, m - 1, day));
      const endOfDay = new Date(Date.UTC(year, m - 1, day, 23, 59, 59, 999));

      tasks = await prisma.fellowTask.findMany({
        where: {
          fellowId,
          OR: [
            {
              // Tasks planned for today
              plannedDate: {
                gte: startOfDay,
                lte: endOfDay
              }
            },
            {
              // Carry forward tasks
              plannedDate: {
                lt: startOfDay
              },
              status: "Pending"
            }
          ]
        },
        include: {
          comments: {
            include: { author: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { plannedDate: 'asc' }
      });
    } else {
      // Fetch all
      tasks = await prisma.fellowTask.findMany({
        where: { fellowId },
        include: {
          comments: {
            include: { author: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { plannedDate: 'desc' }
      });
    }

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ success: false, error: "No token" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    const { id: fellowId } = await params;
    const body = await request.json();
    const { title, description, plannedDate, isPlanned } = body;

    if (!title || !plannedDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [year, m, day] = plannedDate.split('-');
    const utcDate = new Date(Date.UTC(year, m - 1, day));

    const newTask = await prisma.fellowTask.create({
      data: {
        fellowId,
        title,
        description: description || null,
        plannedDate: utcDate,
        isPlanned: isPlanned !== undefined ? isPlanned : true,
      },
      include: {
        comments: true
      }
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
