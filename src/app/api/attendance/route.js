import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getHierarchyScopedUserIds } from "@/lib/hierarchy";
import { dailyTaskWhere } from "@/lib/tasks";
import {
  formatISTTime,
  formatWorkHours,
  getISTDateKey,
  istDayEnd,
  istDayStart,
} from "@/lib/time";

export const dynamic = "force-dynamic";

function dateKeyOf(value) {
  if (!value) return null;
  return getISTDateKey(new Date(value));
}

function parseLegacyTime(timeStr, dateKey) {
  if (!timeStr || !dateKey) return null;
  const parts = String(timeStr).trim().split(/\s+/);
  const timePart = parts[0];
  const modifier = (parts[1] || "").toUpperCase();
  const [h, m, s] = timePart.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  let hours = h;
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  const dayStart = istDayStart(dateKey);
  if (!dayStart) return null;
  return new Date(dayStart.getTime() + hours * 3600000 + m * 60000 + (s || 0) * 1000);
}

async function closeStaleShifts(userIds = null) {
  if (Array.isArray(userIds) && userIds.length === 0) return;
  const today = getISTDateKey();
  const stale = await prisma.attendanceLog.findMany({
    where: {
      ...(Array.isArray(userIds) ? { userId: { in: userIds } } : {}),
      intimelog: { not: null },
      outtimelog: null,
      logdate: { not: null, lt: today },
    },
  });

  for (const log of stale) {
    const dayEnd = istDayEnd(log.logdate);
    const checkInAt = log.checkInAt
      ? new Date(log.checkInAt)
      : parseLegacyTime(log.intimelog, log.logdate);
    if (!dayEnd) continue;
    const workSeconds = checkInAt
      ? Math.max(0, Math.floor((dayEnd.getTime() - checkInAt.getTime()) / 1000))
      : null;
    await prisma.attendanceLog.update({
      where: { id: log.id },
      data: {
        checkOutAt: dayEnd,
        outtimelog: formatISTTime(dayEnd),
        workSeconds,
        workhours: workSeconds != null ? formatWorkHours(workSeconds) : log.workhours,
        workstatus: "Auto checked out at midnight",
      },
    });
  }
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    // Self attendance is separate from the HR attendance-log permission. A
    // user without the HR page permission can still fetch their own log/draft.
    const canViewTeam = await checkPermission(user, "dashboard", "attendance", "READ");

    let where = {};
    if (user.role.name === "ADMIN" || user.role.name === "HR") {
      where = {};
    } else if (canViewTeam) {
      const scoped = (await getHierarchyScopedUserIds(user, { includeSelf: true })) || [user.id];
      where = { userId: { in: scoped } };
    } else {
      where = { userId: user.id };
    }

    const scopedUserIds = where.userId?.in || null;
    await closeStaleShifts(scopedUserIds);

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const { searchParams } = new URL(req.url);
    const includeDrafts = searchParams.get("includeDrafts") === "1";

    // Lesson-plan drafts are only returned to their owner when explicitly
    // requested (the attendance modal). Management ledgers only show real
    // check-in records.
    const visibleLogs = includeDrafts
      ? logs.filter((log) => log.userId === user.id || !!log.intimelog)
      : logs.filter((log) => !!log.intimelog);

    const userIds = [...new Set(visibleLogs.map((log) => log.userId))];
    const tasks = userIds.length
      ? await prisma.task.findMany({
          where: { assigneeId: { in: userIds } },
          select: {
            id: true,
            assigneeId: true,
            title: true,
            description: true,
            plannedDate: true,
            deadline: true,
            status: true,
            completionDate: true,
          },
        })
      : [];

    const tasksByUserAndDate = {};
    for (const task of tasks) {
      const keys = new Set([dateKeyOf(task.plannedDate), dateKeyOf(task.deadline)].filter(Boolean));
      for (const key of keys) {
        const mapKey = `${task.assigneeId}_${key}`;
        if (!tasksByUserAndDate[mapKey]) tasksByUserAndDate[mapKey] = [];
        if (!tasksByUserAndDate[mapKey].some((t) => t.id === task.id)) {
          tasksByUserAndDate[mapKey].push(task);
        }
      }
    }

    const logsWithTasks = visibleLogs.map((log) => {
      const dateKey = log.logdate;
      const dayTasks = dateKey ? tasksByUserAndDate[`${log.userId}_${dateKey}`] || [] : [];
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

    if (!(await checkPermission(user, "dashboard", "self-attendance", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for self attendance" }, { status: 403 });
    }

    const body = await req.json();
    const today = getISTDateKey();
    const logdate = body.logdate && /^\d{4}-\d{2}-\d{2}$/.test(body.logdate) ? body.logdate : today;

    if (logdate !== today) {
      return NextResponse.json({ error: "Check-in is only allowed for today's IST date" }, { status: 400 });
    }

    const existing = await prisma.attendanceLog.findFirst({
      where: { userId: user.id, logdate },
    });
    if (existing?.intimelog) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Fellows must plan at least one task for the day before checking in.
    if (user.role.name === "FELLOW") {
      const taskCount = await prisma.task.count({ where: dailyTaskWhere(user.id, today) });
      if (taskCount === 0) {
        return NextResponse.json(
          { error: "Add at least one task for today before checking in." },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const logData = {
      email: user.email,
      logdate,
      intimelog: body.intimelog || formatISTTime(now),
      outtimelog: null,
      workhours: null,
      workstatus: body.workstatus || `Logged in at ${formatISTTime(now)}`,
      ef1: body.ef1 ?? existing?.ef1,
      ef2: body.ef2 ?? existing?.ef2,
      logininfo: body.logininfo,
      checkInLat: body.checkInLat,
      checkInLng: body.checkInLng,
      lessonPlanText: body.lessonPlanText ?? existing?.lessonPlanText,
      isTeachingDay:
        typeof body.isTeachingDay === "boolean"
          ? body.isTeachingDay
          : existing?.isTeachingDay ?? null,
      checkInAt: now,
    };

    // A lesson plan may already have created a draft row for today.
    const log = existing
      ? await prisma.attendanceLog.update({ where: { id: existing.id }, data: logData })
      : await prisma.attendanceLog.create({ data: { userId: user.id, ...logData } });

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

    if (!(await checkPermission(user, "dashboard", "self-attendance", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for self attendance" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Attendance log id is required" }, { status: 400 });
    }

    const existingLog = await prisma.attendanceLog.findUnique({ where: { id } });
    if (!existingLog) {
      return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
    }

    if (existingLog.userId !== user.id && user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You can only update your own attendance" }, { status: 403 });
    }

    const isCheckout = body.checkout === true || body.outtimelog != null;
    const data = {
      ...(body.lessonPlanText !== undefined && { lessonPlanText: body.lessonPlanText }),
      ...(typeof body.isTeachingDay === "boolean" && { isTeachingDay: body.isTeachingDay }),
      ...(body.ef1 !== undefined && { ef1: body.ef1 }),
      ...(body.ef2 !== undefined && { ef2: body.ef2 }),
      ...(body.logoutinfo !== undefined && { logoutinfo: body.logoutinfo }),
      ...(body.checkOutLat !== undefined && { checkOutLat: body.checkOutLat }),
      ...(body.checkOutLng !== undefined && { checkOutLng: body.checkOutLng }),
    };

    if (isCheckout && !existingLog.outtimelog) {
      const now = new Date();
      const checkInAt = existingLog.checkInAt
        ? new Date(existingLog.checkInAt)
        : parseLegacyTime(existingLog.intimelog, existingLog.logdate);
      const workSeconds = checkInAt
        ? Math.max(0, Math.floor((now.getTime() - checkInAt.getTime()) / 1000))
        : 0;

      data.checkOutAt = now;
      data.outtimelog = body.outtimelog || formatISTTime(now);
      data.workSeconds = workSeconds;
      data.workhours = formatWorkHours(workSeconds);
      data.workstatus = body.workstatus || "Checked out";
    }

    const log = await prisma.attendanceLog.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Update attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
