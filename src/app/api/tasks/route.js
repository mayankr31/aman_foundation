import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getISTDateKey, istDayEnd, istDayStart } from "@/lib/time";
import { TASK_PRIORITIES, TASK_STATUSES, canAssignTo, dailyTaskWhere, notifyTaskEvent, NOTIFICATION_TYPES } from "@/lib/tasks";

export const dynamic = "force-dynamic";

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function taskInclude() {
  return {
    assignee: { select: { id: true, name: true, avatar: true, role: { select: { name: true } } } },
    assignedBy: { select: { id: true, name: true, avatar: true } },
    comments: {
      include: { author: { select: { id: true, name: true, avatar: true, role: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    },
    documents: { orderBy: { createdAt: "asc" } },
  };
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "tasks", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "mine";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const daily = searchParams.get("daily") === "1";
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    const where = {};

    if (view === "all") {
      if (user.role.name !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
      }
    } else if (view === "assigned-by-me") {
      where.assignedById = user.id;
    } else {
      where.assigneeId = user.id;
    }

    if (assigneeId) {
      if (view === "all" && user.role.name === "ADMIN") {
        where.assigneeId = assigneeId;
      } else if (assigneeId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (daily) {
      const dailyWhere = dailyTaskWhere(user.id, date || getISTDateKey());
      Object.assign(where, dailyWhere);
    } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      where.OR = [
        { plannedDate: { gte: istDayStart(date), lte: istDayEnd(date) } },
        { deadline: { gte: istDayStart(date), lte: istDayEnd(date) } },
      ];
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split("-").map(Number);
      const firstKey = `${year}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
      const lastKey = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      where.OR = [
        { plannedDate: { gte: istDayStart(firstKey), lte: istDayEnd(lastKey) } },
        { deadline: { gte: istDayStart(firstKey), lte: istDayEnd(lastKey) } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude(),
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { plannedDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "tasks", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const assigneeId = body.assigneeId || user.id;
    if (!(await canAssignTo(user, assigneeId))) {
      return NextResponse.json({ error: "You can only assign tasks to people under you in the same school/program" }, { status: 403 });
    }

    const priority = TASK_PRIORITIES.includes(body.priority) ? body.priority : "Medium";
    const status = TASK_STATUSES.includes(body.status) ? body.status : "Pending";
    const plannedDate = parseDateOnly(body.plannedDate) || parseDateOnly(body.deadline) || new Date();
    const deadline = parseDateOnly(body.deadline) || null;
    const isAssigned = assigneeId !== user.id;

    const task = await prisma.task.create({
      data: {
        title,
        description: body.description ? String(body.description).trim() : null,
        assigneeId,
        assignedById: isAssigned ? user.id : null,
        plannedDate,
        deadline,
        priority,
        status,
        isPlanned: body.isPlanned !== undefined ? !!body.isPlanned : true,
        completionDate: status === "Completed" ? new Date() : null,
      },
      include: taskInclude(),
    });

    if (isAssigned) {
      await notifyTaskEvent([assigneeId], {
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        title: "New task assigned",
        message: `${user.name || "A manager"} assigned you: ${title}`,
        link: `/tasks?task=${task.id}`,
        actorId: user.id,
        metadata: { taskId: task.id },
      });
    }

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
