import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

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

    return NextResponse.json({ success: true, data: logs });
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
    const { logdate, intimelog, outtimelog, workhours, workstatus, ef1, ef2, logininfo, logoutinfo } = body;

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
        logoutinfo
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
    const { id, logdate, intimelog, outtimelog, workhours, workstatus, ef1, ef2, logininfo, logoutinfo } = body;

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
        logoutinfo
      }
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Update attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
