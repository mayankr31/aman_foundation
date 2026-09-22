import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function canModify(user, taskId) {
  if (user.role.name === "ADMIN") return true;
  const task = await prisma.programManagerTask.findUnique({ where: { id: taskId }, select: { userId: true } });
  return !!task && task.userId === user.id;
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
    const { status, title, description, plannedDate } = body;

    const dataToUpdate = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      dataToUpdate.completionDate = status === "Completed" ? new Date() : null;
    }
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (plannedDate !== undefined) dataToUpdate.plannedDate = new Date(plannedDate);

    const updatedTask = await prisma.programManagerTask.update({
      where: { id: taskId },
      data: dataToUpdate,
      include: { comments: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } } },
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

    await prisma.programManagerTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting program manager task:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
