import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function loadTaskForUser(user, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, assigneeId: true, assignedById: true },
  });
  if (!task) return { task: null, allowed: false };
  const allowed =
    user.role.name === "ADMIN" ||
    task.assigneeId === user.id ||
    task.assignedById === user.id;
  return { task, allowed };
}

export async function GET(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: taskId } = await params;
    const { allowed } = await loadTaskForUser(user, taskId);
    if (!allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: taskId } = await params;
    const { allowed } = await loadTaskForUser(user, taskId);
    if (!allowed) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });

    const newComment = await prisma.taskComment.create({
      data: { taskId, authorId: user.id, text },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ success: true, data: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
