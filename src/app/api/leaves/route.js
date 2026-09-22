import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticateUser } from "../../../lib/auth";
import { getManagedTeamUserIds } from "../../../lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    // Only Admin/HR roles can see all leaves. PROGRAM_MANAGER sees their team's + own. Others (like FELLOW) see only their own.
    let where;
    if (user.role?.name === "ADMIN" || user.role?.name === "HR") {
      where = undefined;
    } else if (user.role?.name === "PROGRAM_MANAGER") {
      const team = await getManagedTeamUserIds(user.id);
      where = { userId: { in: [...team, user.id] } };
    } else {
      where = { userId: user.id };
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: { select: { name: true } }, leavesTaken: true, leavesRemaining: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: leaves });
  } catch (error) {
    console.error("GET leaves error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const { type, dates, reason } = body;

    const leave = await prisma.leave.create({
      data: {
        userId: user.id,
        type,
        dates,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: leave }, { status: 201 });
  } catch (error) {
    console.error("POST leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
