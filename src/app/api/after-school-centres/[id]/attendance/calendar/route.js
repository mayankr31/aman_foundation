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
    const month = parseInt(searchParams.get("month"), 10);
    const year = parseInt(searchParams.get("year"), 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const logs = await prisma.afterSchoolStudentAttendanceDayLog.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
        log: {
          student: {
            centreId
          }
        }
      },
      select: {
        date: true,
        status: true,
      }
    });

    const dailyStats = {};

    logs.forEach(log => {
      const y = log.date.getFullYear();
      const m = String(log.date.getMonth() + 1).padStart(2, '0');
      const d = String(log.date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = { total: 0, present: 0 };
      }

      dailyStats[dateStr].total += 1;
      if (log.status === "Present" || log.status === "Late" || log.status === "Excused") {
        dailyStats[dateStr].present += 1;
      }
    });

    const calendarData = Object.keys(dailyStats).map(date => {
      const stats = dailyStats[date];
      return {
        date,
        present: stats.present,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      };
    });

    return NextResponse.json({ success: true, data: calendarData });
  } catch (error) {
    console.error("Fetch calendar attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
