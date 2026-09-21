import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveCentreId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;
  const name = decodeURIComponent(id).replace(/-/g, " ");
  const centre = await prisma.afterSchoolCentre.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return centre ? centre.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const [y, m, d] = dateStr.split('-');
    const startOfDay = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 0, 0, 0, 0);
    const endOfDay = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 23, 59, 59, 999);

    if (isNaN(startOfDay.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const logs = await prisma.afterSchoolStudentAttendanceDayLog.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        log: {
          student: {
            centreId
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

    const [learningAssessments, homework] = await Promise.all([
      prisma.afterSchoolLearningAssessment.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay }, centreId },
        select: { studentId: true, canRead: true }
      }),
      prisma.afterSchoolHomework.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay }, centreId },
        select: { studentId: true, homeworkStatus: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: studentStatuses,
      learningAssessments,
      homework
    });
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
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const isAssigned = await prisma.fellowAfterSchoolCentre.findFirst({
        where: {
          centreId,
          fellow: { userId: user.id }
        }
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this centre" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { date, studentStatuses, learningAssessments, homework } = body;
    // studentStatuses: Array<{ studentId: string, status: string }>
    // learningAssessments (optional): Array<{ studentId: string, canRead: boolean }>
    // homework (optional): Array<{ studentId: string, status: string }>

    if (!date || !studentStatuses || !Array.isArray(studentStatuses)) {
      return NextResponse.json({ error: "Date and studentStatuses array are required" }, { status: 400 });
    }

    const [y, m, d] = date.split('-');
    const startOfDay = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 0, 0, 0, 0);
    const endOfDay = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 23, 59, 59, 999);

    if (isNaN(startOfDay.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const monthStr = startOfDay.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    await prisma.$transaction(async (tx) => {
      for (const { studentId, status } of studentStatuses) {
        let log = await tx.afterSchoolStudentAttendanceLog.findFirst({
          where: { studentId, month: monthStr }
        });

        if (!log) {
          log = await tx.afterSchoolStudentAttendanceLog.create({
            data: {
              studentId,
              month: monthStr,
              present: 0,
              total: 0,
              percentage: 0
            }
          });
        }

        const existingDayLog = await tx.afterSchoolStudentAttendanceDayLog.findFirst({
          where: {
            logId: log.id,
            date: { gte: startOfDay, lte: endOfDay }
          }
        });

        if (existingDayLog) {
          if (existingDayLog.status !== status) {
            await tx.afterSchoolStudentAttendanceDayLog.update({
              where: { id: existingDayLog.id },
              data: { status }
            });
          }
        } else {
          await tx.afterSchoolStudentAttendanceDayLog.create({
            data: {
              logId: log.id,
              date: startOfDay,
              status
            }
          });
        }

        const allDays = await tx.afterSchoolStudentAttendanceDayLog.findMany({
          where: { logId: log.id }
        });
        const total = allDays.length;
        const present = allDays.filter(d => d.status === "Present" || d.status === "Late").length;
        const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0;

        await tx.afterSchoolStudentAttendanceLog.update({
          where: { id: log.id },
          data: { present, total, percentage }
        });

        const allLogs = await tx.afterSchoolStudentAttendanceLog.findMany({
          where: { studentId }
        });
        const overallTotal = allLogs.reduce((acc, curr) => acc + curr.total, 0);
        const overallPresent = allLogs.reduce((acc, curr) => acc + curr.present, 0);
        const overallPercentage = overallTotal > 0 ? parseFloat(((overallPresent / overallTotal) * 100).toFixed(2)) : 0;

        await tx.afterSchoolStudent.update({
          where: { id: studentId },
          data: { attendance: overallPercentage }
        });
      }

      if (learningAssessments && Array.isArray(learningAssessments)) {
        for (const { studentId, canRead } of learningAssessments) {
          const existing = await tx.afterSchoolLearningAssessment.findFirst({
            where: { studentId, date: { gte: startOfDay, lte: endOfDay } }
          });
          if (existing) {
            if (existing.canRead !== canRead) {
              await tx.afterSchoolLearningAssessment.update({
                where: { id: existing.id },
                data: { canRead }
              });
            }
          } else {
            await tx.afterSchoolLearningAssessment.create({
              data: { studentId, centreId, date: startOfDay, canRead }
            });
          }
        }
      }

      if (homework && Array.isArray(homework)) {
        for (const { studentId, status: hwStatus } of homework) {
          const existing = await tx.afterSchoolHomework.findFirst({
            where: { studentId, date: { gte: startOfDay, lte: endOfDay } }
          });
          if (existing) {
            if (existing.homeworkStatus !== hwStatus) {
              await tx.afterSchoolHomework.update({
                where: { id: existing.id },
                data: { homeworkStatus: hwStatus }
              });
            }
          } else {
            await tx.afterSchoolHomework.create({
              data: { studentId, centreId, date: startOfDay, homeworkStatus: hwStatus }
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
