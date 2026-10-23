import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyTaskEvent, NOTIFICATION_TYPES } from "@/lib/tasks";

async function loadTaskForUser(user, taskId) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { task: null, allowed: false };
  const allowed =
    user.role.name === "ADMIN" ||
    task.assigneeId === user.id ||
    task.assignedById === user.id;
  return { task, allowed };
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const { id } = await params;
    const { allowed } = await loadTaskForUser(user, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      include: { author: { select: { id: true, name: true, avatar: true, role: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Fetch task comments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for tasks" }, { status: 403 });
    }

    const { id } = await params;
    const { task, allowed } = await loadTaskForUser(user, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Comment text is required" }, { status: 400 });

    const comment = await prisma.taskComment.create({
      data: { taskId: id, authorId: user.id, text },
      include: { author: { select: { id: true, name: true, avatar: true, role: { select: { name: true } } } } },
    });

    const recipients = [];
    if (task.assigneeId !== user.id) recipients.push(task.assigneeId);
    if (task.assignedById && task.assignedById !== user.id) recipients.push(task.assignedById);

    if (recipients.length) {
      await notifyTaskEvent(recipients, {
        type: NOTIFICATION_TYPES.TASK_COMMENT,
        title: "New task comment",
        message: `${user.name || "A user"} commented on: ${task.title}`,
        link: `/tasks?task=${task.id}`,
        actorId: user.id,
        metadata: { taskId: task.id },
      });
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error("Create task comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
