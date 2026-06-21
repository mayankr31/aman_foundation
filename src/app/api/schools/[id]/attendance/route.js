import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveSchoolId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;
  const name = decodeURIComponent(id).replace(/-/g, " ");
  const school = await prisma.school.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return school ? school.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await prisma.studentAttendanceDayLog.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        log: {
          student: {
            schoolId
          }
        }
      },
      include: {
        log: {
          select: { studentId: true }
        }
      }
    });

    const studentStatuses = logs.map(l => ({
      studentId: l.log.studentId,
      status: l.status
    }));

    return NextResponse.json({ success: true, data: studentStatuses });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const isAssigned = await prisma.fellowSchool.findFirst({
        where: {
          schoolId,
          fellow: { userId: user.id }
        }
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this school" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { date, studentStatuses } = body;
    // studentStatuses: Array<{ studentId: string, status: string }>

    if (!date || !studentStatuses || !Array.isArray(studentStatuses)) {
      return NextResponse.json({ error: "Date and studentStatuses array are required" }, { status: 400 });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    
    // Format month as "Jan 2026"
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    await prisma.$transaction(async (tx) => {
      for (const { studentId, status } of studentStatuses) {
        // Find or create StudentAttendanceLog for the month
        let log = await tx.studentAttendanceLog.findFirst({
          where: { studentId, month: monthStr }
        });

        if (!log) {
          log = await tx.studentAttendanceLog.create({
            data: {
              studentId,
              month: monthStr,
              present: 0,
              total: 0,
              percentage: 0
            }
          });
        }

        const existingDayLog = await tx.studentAttendanceDayLog.findFirst({
          where: {
            logId: log.id,
            date: { gte: startOfDay, lte: endOfDay }
          }
        });

        if (existingDayLog) {
          if (existingDayLog.status !== status) {
            await tx.studentAttendanceDayLog.update({
              where: { id: existingDayLog.id },
              data: { status }
            });
          }
        } else {
          await tx.studentAttendanceDayLog.create({
            data: {
              logId: log.id,
              date: startOfDay,
              status
            }
          });
        }

        // Recompute month log
        const allDays = await tx.studentAttendanceDayLog.findMany({
          where: { logId: log.id }
        });
        const total = allDays.length;
        const present = allDays.filter(d => d.status === "Present" || d.status === "Late").length;
        const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0;

        await tx.studentAttendanceLog.update({
          where: { id: log.id },
          data: { present, total, percentage }
        });

        // Recompute overall student attendance
        const allLogs = await tx.studentAttendanceLog.findMany({
          where: { studentId }
        });
        const overallTotal = allLogs.reduce((acc, curr) => acc + curr.total, 0);
        const overallPresent = allLogs.reduce((acc, curr) => acc + curr.present, 0);
        const overallPercentage = overallTotal > 0 ? parseFloat(((overallPresent / overallTotal) * 100).toFixed(2)) : 0;

        await tx.student.update({
          where: { id: studentId },
          data: { attendance: overallPercentage }
        });
      }
    });

    return NextResponse.json({ success: true, message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
