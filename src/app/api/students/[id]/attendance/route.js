import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.student.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

// GET /api/students/[id]/attendance
// Returns all attendance logs (month summaries) with their day logs
export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const logs = await prisma.studentAttendanceLog.findMany({
      where: { studentId },
      include: { dayLogs: { orderBy: { date: "asc" } } },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Fetch attendance logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/students/[id]/attendance
//
// Two modes distinguished by the `action` field in the body:
//
// Mode 1 – create monthly log (default, no action):
//   Body: { month, present, total, percentage, dayLogs?: [{ date, status, note }] }
//
// Mode 2 – add a day log to an existing monthly log (action = "addDay"):
//   Body: { action: "addDay", logId, date, status, note }
export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();

    // ── Mode 2: add a single day log ─────────────────────────────────────────
    if (body.action === "addDay") {
      const { logId, date, status, note } = body;

      if (!logId || !date || !status) {
        return NextResponse.json(
          { error: "logId, date, and status are required for addDay" },
          { status: 400 }
        );
      }

      // Verify the monthly log belongs to this student
      const log = await prisma.studentAttendanceLog.findFirst({
        where: { id: logId, studentId }
      });

      if (!log) {
        return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
      }

      const dayLog = await prisma.studentAttendanceDayLog.create({
        data: {
          logId,
          date: new Date(date),
          status,
          note: note ?? null
        }
      });

      return NextResponse.json({ success: true, data: dayLog }, { status: 201 });
    }

    // ── Mode 1: create a monthly log ─────────────────────────────────────────
    const { month, present, total, percentage, dayLogs } = body;

    if (!month || present === undefined || total === undefined || percentage === undefined) {
      return NextResponse.json(
        { error: "month, present, total, and percentage are required" },
        { status: 400 }
      );
    }

    const attendanceLog = await prisma.studentAttendanceLog.create({
      data: {
        studentId,
        month,
        present: parseInt(present),
        total: parseInt(total),
        percentage: parseFloat(percentage),
        ...(dayLogs && Array.isArray(dayLogs) && dayLogs.length > 0
          ? {
              dayLogs: {
                create: dayLogs.map(({ date, status, note }) => ({
                  date: new Date(date),
                  status: status ?? "Present",
                  note: note ?? null
                }))
              }
            }
          : {})
      },
      include: { dayLogs: true }
    });

    return NextResponse.json({ success: true, data: attendanceLog }, { status: 201 });
  } catch (error) {
    console.error("Create attendance log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/students/[id]/attendance
//
// Two modes distinguished by the `action` field:
//
// Mode 1 – update monthly summary (default, no action):
//   Body: { logId, month, present, total, percentage }
//
// Mode 2 – update a day log (action = "updateDay"):
//   Body: { action: "updateDay", dayLogId, status, note }
export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();

    // ── Mode 2: update a day log ──────────────────────────────────────────────
    if (body.action === "updateDay") {
      const { dayLogId, status, note } = body;

      if (!dayLogId) {
        return NextResponse.json({ error: "dayLogId is required for updateDay" }, { status: 400 });
      }

      // Confirm this dayLog belongs to one of the student's logs
      const dayLog = await prisma.studentAttendanceDayLog.findFirst({
        where: { id: dayLogId, log: { studentId } }
      });

      if (!dayLog) {
        return NextResponse.json({ error: "Day log not found" }, { status: 404 });
      }

      const updated = await prisma.studentAttendanceDayLog.update({
        where: { id: dayLogId },
        data: {
          status: status ?? dayLog.status,
          note: note !== undefined ? note : dayLog.note
        }
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ── Mode 1: update monthly summary ───────────────────────────────────────
    const { logId, month, present, total, percentage } = body;

    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const existing = await prisma.studentAttendanceLog.findFirst({
      where: { id: logId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
    }

    const updated = await prisma.studentAttendanceLog.update({
      where: { id: logId },
      data: {
        month: month ?? existing.month,
        present: present !== undefined ? parseInt(present) : existing.present,
        total: total !== undefined ? parseInt(total) : existing.total,
        percentage: percentage !== undefined ? parseFloat(percentage) : existing.percentage
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update attendance log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/students/[id]/attendance
// Body: { logId }
// Deletes a monthly log (cascades to day logs via schema onDelete: Cascade)
export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const existing = await prisma.studentAttendanceLog.findFirst({
      where: { id: logId, studentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
    }

    await prisma.studentAttendanceLog.delete({ where: { id: logId } });

    return NextResponse.json({ success: true, message: "Attendance log deleted successfully" });
  } catch (error) {
    console.error("Delete attendance log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
