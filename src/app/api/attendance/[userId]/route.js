import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedTeamUserIds } from "@/lib/scope";

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { userId } = await context.params;

    // ADMIN and HR can view any user's logs. PROGRAM_MANAGER can view their team (and self).
    if (user.role.name === "PROGRAM_MANAGER" && userId !== user.id) {
      const team = await getManagedTeamUserIds(user.id);
      if (!team.includes(userId)) {
        return NextResponse.json({ error: "Forbidden: This user is not in your team" }, { status: 403 });
      }
    } else if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "HR" &&
      userId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, department: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const logs = await prisma.attendanceLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const fellow = await prisma.fellow.findUnique({
      where: { userId }
    });

    let tasks = [];
    if (fellow) {
      tasks = await prisma.fellowTask.findMany({
        where: { fellowId: fellow.id }
      });
    } else {
      tasks = await prisma.programManagerTask.findMany({
        where: { userId }
      });
    }

    const tasksByDate = {};
    tasks.forEach(task => {
      const d = new Date(task.plannedDate);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;
      if (!tasksByDate[dateString]) {
        tasksByDate[dateString] = [];
      }
      tasksByDate[dateString].push(task);
    });

    const logsWithTasks = logs.map(log => {
      const dateKey = log.logdate;
      const dayTasks = dateKey ? (tasksByDate[dateKey] || []) : [];
      
      let taskDetails = [];
      if (dayTasks.length > 0) {
        taskDetails = dayTasks.map(t => ({
          id: t.id,
          text: t.title,
          description: t.description,
          completed: t.status === "Completed",
          completionDate: t.completionDate
        }));
      } else if (log.ef1) {
        try {
          const parsed = JSON.parse(log.ef1);
          if (Array.isArray(parsed)) {
            taskDetails = parsed;
          } else if (parsed.checklistItems && Array.isArray(parsed.checklistItems)) {
            taskDetails = parsed.checklistItems.map(t => ({
              id: t.id,
              text: t.text || t.title,
              completed: t.completed || (parsed.checkoutData?.completedItems || []).includes(t.id)
            }));
          }
        } catch (e) {}
      }

      return {
        ...log,
        taskDetails
      };
    });

    return NextResponse.json({ success: true, user: targetUser, data: logsWithTasks });
  } catch (error) {
    console.error("Fetch user attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
