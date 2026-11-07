import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getISTDateKey, istDayStart, istDayEnd } from "@/lib/time";
import { buildTaskAnalyticsWhere } from "@/lib/taskScope";

export const dynamic = "force-dynamic";

function keyForDate(value) {
  if (!value) return null;
  return getISTDateKey(new Date(value));
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const allowed =
      user.role.name === "ADMIN" ||
      (await checkPermission(user, "dashboard", "task-analytics", "READ"));
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: Task analytics access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const assigneeId = searchParams.get("assigneeId");
    const deadline = searchParams.get("deadline");

    const scoped = await buildTaskAnalyticsWhere(user, { from, to, assigneeId });
    if (scoped.forbidden) {
      return NextResponse.json({ error: "Forbidden: Outside your team" }, { status: 403 });
    }
    const where = scoped.where;

    // Deadline-calendar drill-down: return just the tasks due on one IST day.
    if (deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      const dayStart = istDayStart(deadline);
      const dayEnd = istDayEnd(deadline);
      const dayTasks = await prisma.task.findMany({
        where: { ...where, deadline: { gte: dayStart, lte: dayEnd } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          plannedDate: true,
          deadline: true,
          assignee: { select: { id: true, name: true, role: { select: { name: true, displayName: true, rank: true } } } },
        },
        orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      });
      return NextResponse.json({
        success: true,
        data: { date: deadline, tasks: dayTasks },
      });
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        plannedDate: true,
        deadline: true,
        completionDate: true,
        assignee: { select: { id: true, name: true, role: { select: { name: true, displayName: true, rank: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    const today = getISTDateKey();
    const now = new Date();

    const counts = {
      total: tasks.length,
      completed: 0,
      pending: 0,
      overdue: 0,
      dueToday: 0,
    };
    const byStatus = {};
    const byPriority = {};
    const byAssignee = {};
    const assignedByDay = {};
    const completedByDay = {};
    const dueByDay = {};

    const todayByStatus = {};
    const todayByPriority = {};
    const todayByAssignee = {};
    let todayTotal = 0;
    let todayCompleted = 0;
    let todayPending = 0;
    let todayOverdue = 0;

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

      const isTodayTask =
        (task.plannedDate && keyForDate(task.plannedDate) === today) ||
        (task.deadline && keyForDate(task.deadline) === today);

      if (isTodayTask) {
        todayTotal += 1;
        todayByStatus[task.status] = (todayByStatus[task.status] || 0) + 1;
        todayByPriority[task.priority] = (todayByPriority[task.priority] || 0) + 1;
        if (task.status === "Completed") todayCompleted += 1;
        else if (task.status !== "Cancelled") todayPending += 1;
        if (
          task.status !== "Completed" &&
          task.status !== "Cancelled" &&
          task.deadline &&
          new Date(task.deadline) < now
        ) {
          todayOverdue += 1;
        }

        const key = task.assignee?.id || "unassigned";
        if (!todayByAssignee[key]) {
          todayByAssignee[key] = {
            id: task.assignee?.id || null,
            name: task.assignee?.name || "Unassigned",
            role: task.assignee?.role?.name || null,
            total: 0,
            completed: 0,
          };
        }
        todayByAssignee[key].total += 1;
        if (task.status === "Completed") todayByAssignee[key].completed += 1;
      }

      if (task.status === "Completed") counts.completed += 1;
      else if (task.status !== "Cancelled") counts.pending += 1;

      const isOpen = task.status !== "Completed" && task.status !== "Cancelled";
      if (isOpen && task.deadline && new Date(task.deadline) < now) counts.overdue += 1;
      if (isOpen && task.deadline && keyForDate(task.deadline) === today) counts.dueToday += 1;

      const assigneeKey = task.assignee?.id || "unassigned";
      if (!byAssignee[assigneeKey]) {
        byAssignee[assigneeKey] = {
          id: task.assignee?.id || null,
          name: task.assignee?.name || "Unassigned",
          role: task.assignee?.role?.name || null,
          total: 0,
          completed: 0,
          overdue: 0,
        };
      }
      const row = byAssignee[assigneeKey];
      row.total += 1;
      if (task.status === "Completed") row.completed += 1;
      if (isOpen && task.deadline && new Date(task.deadline) < now) row.overdue += 1;

      const createdKey = keyForDate(task.createdAt);
      if (createdKey) assignedByDay[createdKey] = (assignedByDay[createdKey] || 0) + 1;
      const completedKey = keyForDate(task.completionDate);
      if (completedKey) completedByDay[completedKey] = (completedByDay[completedKey] || 0) + 1;
      const dueKey = keyForDate(task.deadline);
      if (dueKey) dueByDay[dueKey] = (dueByDay[dueKey] || 0) + 1;
    }

    // 30-day trend series (oldest first).
    const trend = [];
    const base = new Date();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
      const key = getISTDateKey(d);
      trend.push({
        date: key,
        assigned: assignedByDay[key] || 0,
        completed: completedByDay[key] || 0,
        due: dueByDay[key] || 0,
      });
    }

    const assignees = Object.values(byAssignee)
      .map((row) => ({
        ...row,
        completionRate: row.total ? Math.round((row.completed / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const todayAssignees = Object.values(todayByAssignee)
      .map((row) => ({
        ...row,
        completionRate: row.total ? Math.round((row.completed / row.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        counts,
        byStatus,
        byPriority,
        trend,
        calendar: dueByDay,
        assignees,
        today: {
          date: today,
          counts: {
            total: todayTotal,
            completed: todayCompleted,
            pending: todayPending,
            overdue: todayOverdue,
          },
          byStatus: todayByStatus,
          byPriority: todayByPriority,
          assignees: todayAssignees,
        },
        scope: {
          isAdmin: user.role.name === "ADMIN",
          teamSize: Array.isArray(scoped.teamIds) ? scoped.teamIds.length : null,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Task analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
