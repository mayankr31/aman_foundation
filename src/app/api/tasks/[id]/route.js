import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { TASK_PRIORITIES, TASK_STATUSES, notifyTaskEvent, NOTIFICATION_TYPES } from "@/lib/tasks";

function parseDateValue(value) {
  if (value === null || value === "") return null;
  const str = String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function includeTask() {
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

async function loadTask(id) {
  return prisma.task.findUnique({ where: { id }, include: includeTask() });
}

function canView(user, task) {
  return (
    user.role.name === "ADMIN" ||
    task.assigneeId === user.id ||
    task.assignedById === user.id
  );
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const { id } = await params;
    const task = await loadTask(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!canView(user, task)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Fetch task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!canView(user, existing)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const data = {};

    if (body.title !== undefined) {
      const title = String(body.title || "").trim();
      if (!title) return NextResponse.json({ error: "Task title cannot be empty" }, { status: 400 });
      data.title = title;
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.status !== undefined) {
      if (!TASK_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
      }
      data.status = body.status;
      data.completionDate = body.status === "Completed" ? new Date() : null;
    }
    if (body.priority !== undefined) {
      if (!TASK_PRIORITIES.includes(body.priority)) {
        return NextResponse.json({ error: "Invalid task priority" }, { status: 400 });
      }
      data.priority = body.priority;
    }
    if (body.plannedDate !== undefined) data.plannedDate = parseDateValue(body.plannedDate);
    if (body.deadline !== undefined) data.deadline = parseDateValue(body.deadline);

    const task = await prisma.task.update({ where: { id }, data, include: includeTask() });

    const recipients = [];
    if (user.id !== task.assigneeId) recipients.push(task.assigneeId);
    if (task.assignedById && user.id !== task.assignedById) recipients.push(task.assignedById);

    if (recipients.length) {
      await notifyTaskEvent(recipients, {
        type: NOTIFICATION_TYPES.TASK_UPDATED,
        title: "Task updated",
        message: `${user.name || "A user"} updated task: ${task.title}`,
        link: `/tasks?task=${task.id}`,
        actorId: user.id,
        metadata: { taskId: task.id },
      });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const canDelete =
      user.role.name === "ADMIN" ||
      existing.assignedById === user.id ||
      (existing.assigneeId === user.id && !existing.assignedById);
    if (!canDelete) {
      return NextResponse.json({ error: "Only the assigner or an admin can delete this task" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
