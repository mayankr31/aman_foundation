import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getHierarchyScopedUserIds } from "@/lib/hierarchy";
import { getISTDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

function dateKeyOf(value) {
  if (!value) return null;
  return getISTDateKey(new Date(value));
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "attendance", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for attendance" }, { status: 403 });
    }

    const { userId } = await context.params;

    if (user.role.name !== "ADMIN" && user.role.name !== "HR" && userId !== user.id) {
      const scoped = (await getHierarchyScopedUserIds(user, { includeSelf: true })) || [user.id];
      if (!scoped.includes(userId)) {
        return NextResponse.json({ error: "Forbidden: This user is not in your team" }, { status: 403 });
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, department: true, role: { select: { name: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [logs, tasks] = await Promise.all([
      prisma.attendanceLog.findMany({
        where: { userId, intimelog: { not: null } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: { assigneeId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          plannedDate: true,
          deadline: true,
          status: true,
          completionDate: true,
        },
      }),
    ]);

    const tasksByDate = {};
    for (const task of tasks) {
      const keys = new Set([dateKeyOf(task.plannedDate), dateKeyOf(task.deadline)].filter(Boolean));
      for (const key of keys) {
        if (!tasksByDate[key]) tasksByDate[key] = [];
        if (!tasksByDate[key].some((t) => t.id === task.id)) tasksByDate[key].push(task);
      }
    }

    const logsWithTasks = logs.map((log) => {
      const dayTasks = log.logdate ? tasksByDate[log.logdate] || [] : [];
      return {
        ...log,
        taskDetails: dayTasks.map((t) => ({
          id: t.id,
          text: t.title,
          description: t.description,
          completed: t.status === "Completed",
          completionDate: t.completionDate,
        })),
      };
    });

    return NextResponse.json({ success: true, user: targetUser, data: logsWithTasks });
  } catch (error) {
    console.error("Fetch user attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
