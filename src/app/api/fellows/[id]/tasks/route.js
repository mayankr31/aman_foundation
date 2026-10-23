import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { canAssignTo } from "@/lib/tasks";
import { checkPermission } from "@/lib/permissions";
import { canAccessUser } from "@/lib/hierarchy";
import { isFellowManaged } from "@/lib/scope";
import { istDayEnd, istDayStart } from "@/lib/time";

function parseDateOnly(value) {
  if (!value) return null;
  const str = String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function includeTask() {
  return {
    assignee: { select: { id: true, name: true, role: { select: { name: true } } } },
    assignedBy: { select: { id: true, name: true } },
    comments: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
    documents: { orderBy: { createdAt: "asc" } },
  };
}

// Compatibility endpoint backed by the unified Task model.
export async function GET(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: fellowId } = await params;
    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId }, select: { userId: true } });
    if (!fellow?.userId) {
      return NextResponse.json({ success: false, error: "Fellow not found" }, { status: 404 });
    }

    if (!(await checkPermission(user, "dashboard", "tasks", "READ"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (
      user.id !== fellow.userId &&
      !(await canAccessUser(user, fellow.userId, { allowSelf: false })) &&
      !(await isFellowManaged(user.id, fellowId))
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const dateStr = searchParams.get("date");

    const where = { assigneeId: fellow.userId };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split("-").map(Number);
      const firstKey = `${year}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
      const lastKey = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      where.OR = [
        { plannedDate: { gte: istDayStart(firstKey), lte: istDayEnd(lastKey) } },
        { deadline: { gte: istDayStart(firstKey), lte: istDayEnd(lastKey) } },
      ];
    } else if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      where.OR = [
        { plannedDate: { gte: istDayStart(dateStr), lte: istDayEnd(dateStr) } },
        { deadline: { gte: istDayStart(dateStr), lte: istDayEnd(dateStr) } },
        { plannedDate: { lt: istDayStart(dateStr) }, status: { notIn: ["Completed", "Cancelled"] } },
        { deadline: { lt: istDayStart(dateStr) }, status: { notIn: ["Completed", "Cancelled"] } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: includeTask(),
      orderBy: [{ plannedDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: fellowId } = await params;
    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId }, select: { userId: true, name: true } });
    if (!fellow?.userId) {
      return NextResponse.json({ success: false, error: "Fellow not found" }, { status: 404 });
    }

    if (!(await canAssignTo(user, fellow.userId))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const plannedDate = parseDateOnly(body.plannedDate) || new Date();
    const isSelf = user.id === fellow.userId;

    const task = await prisma.task.create({
      data: {
        title,
        description: body.description ? String(body.description).trim() : null,
        assigneeId: fellow.userId,
        assignedById: isSelf ? null : user.id,
        plannedDate,
        deadline: body.deadline ? parseDateOnly(body.deadline) : null,
        priority: body.priority || "Medium",
        isPlanned: body.isPlanned !== undefined ? !!body.isPlanned : true,
      },
      include: includeTask(),
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
