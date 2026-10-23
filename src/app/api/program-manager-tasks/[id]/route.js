import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function canModify(user, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true, assignedById: true },
  });
  if (!task) return false;
  if (user.role.name === "ADMIN") return true;
  return task.assigneeId === user.id || task.assignedById === user.id;
}

export async function PATCH(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: taskId } = await params;
    if (!(await canModify(user, taskId))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const dataToUpdate = {};
    if (body.status !== undefined) {
      dataToUpdate.status = body.status;
      dataToUpdate.completionDate = body.status === "Completed" ? new Date() : null;
    }
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.plannedDate !== undefined) dataToUpdate.plannedDate = new Date(body.plannedDate);
    if (body.deadline !== undefined) dataToUpdate.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.priority !== undefined) dataToUpdate.priority = body.priority;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
      include: {
        assignee: { select: { id: true, name: true, role: { select: { name: true } } } },
        comments: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
        documents: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Error updating program manager task:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: taskId } = await params;
    if (!(await canModify(user, taskId))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting program manager task:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
