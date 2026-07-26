import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    // Fetch attendance logs, including user details
    const logs = await prisma.attendanceLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userIds = logs.map(log => log.userId);
    const fellows = await prisma.fellow.findMany({
      where: { userId: { in: userIds } },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            plannedDate: true,
            status: true,
            isPlanned: true,
            completionDate: true
          }
        }
      }
    });

    const tasksByFellowAndDate = {};
    fellows.forEach(fellow => {
      fellow.tasks.forEach(task => {
        const d = new Date(task.plannedDate);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;
        const key = `${fellow.id}_${dateString}`;
        if (!tasksByFellowAndDate[key]) {
          tasksByFellowAndDate[key] = [];
        }
        tasksByFellowAndDate[key].push(task);
      });
    });

    const userToFellowMap = {};
    fellows.forEach(f => {
      userToFellowMap[f.userId] = f;
    });

    const logsWithTasks = logs.map(log => {
      const fellow = userToFellowMap[log.userId];
      const dateKey = log.logdate;
      const tasks = fellow && dateKey ? (tasksByFellowAndDate[`${fellow.id}_${dateKey}`] || []) : [];
      
      let taskDetails = [];
      if (tasks.length > 0) {
        taskDetails = tasks.map(t => ({
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

    return NextResponse.json({ success: true, data: logsWithTasks });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const { logdate, intimelog, outtimelog, workhours, workstatus, ef1, ef2, logininfo, logoutinfo, checkInLat, checkInLng, lessonPlanText } = body;

    const log = await prisma.attendanceLog.create({
      data: {
        userId: user.id,
        email: user.email,
        logdate,
        intimelog,
        outtimelog,
        workhours,
        workstatus,
        ef1,
        ef2,
        logininfo,
        logoutinfo,
        checkInLat,
        checkInLng,
        lessonPlanText
      }
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Create attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const { id, logdate, intimelog, outtimelog, workhours, workstatus, ef1, ef2, logininfo, logoutinfo, checkOutLat, checkOutLng, lessonPlanText } = body;

    const log = await prisma.attendanceLog.update({
      where: { id },
      data: {
        logdate,
        intimelog,
        outtimelog,
        workhours,
        workstatus,
        ef1,
        ef2,
        logininfo,
        logoutinfo,
        checkOutLat,
        checkOutLng,
        lessonPlanText
      }
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Update attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
