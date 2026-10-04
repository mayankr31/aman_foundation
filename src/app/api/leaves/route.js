import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticateUser } from "../../../lib/auth";
import { getManagedTeamUserIds, getFellowIdByUserId } from "../../../lib/scope";
import { checkPermission } from "@/lib/permissions";
import {
  notifyUsers,
  getAdminUserIds,
  getProgramStaffForFellow,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "leaves", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for leaves" }, { status: 403 });
    }

    // Only Admin/HR roles can see all leaves. PROGRAM_MANAGER sees their team's + own. Others (like FELLOW) see only their own.
    let where;
    if (user.role?.name === "ADMIN" || user.role?.name === "HR") {
      where = undefined;
    } else if (PROGRAM_ROLES.includes(user.role?.name)) {
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

    if (!(await checkPermission(user, "dashboard", "leaves", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for leaves" }, { status: 403 });
    }

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

    // Fellows notify the program staff who manage them plus admins. Every other
    // role (PROGRAM_MANAGER and the new program roles) notifies admins only for now.
    let recipients;
    if (user.role?.name === "FELLOW") {
      const fellowId = await getFellowIdByUserId(user.id);
      const [programStaff, admins] = await Promise.all([
        getProgramStaffForFellow(fellowId),
        getAdminUserIds(),
      ]);
      recipients = [...programStaff, ...admins];
    } else {
      recipients = await getAdminUserIds();
    }

    await notifyUsers(recipients, {
      type: NOTIFICATION_TYPES.LEAVE_REQUESTED,
      title: "New Leave Request",
      message: `${user.name || "A staff member"} has requested leave${type ? ` (${type})` : ""} for approval.`,
      link: `/hr/leaves`,
      actorId: user.id,
    });

    return NextResponse.json({ success: true, data: leave }, { status: 201 });
  } catch (error) {
    console.error("POST leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
