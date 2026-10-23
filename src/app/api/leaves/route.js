import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticateUser } from "../../../lib/auth";
import { getFellowIdByUserId } from "../../../lib/scope";
import { getAncestorUserIds, getHierarchyScopedUserIds } from "../../../lib/hierarchy";
import { checkPermission } from "@/lib/permissions";
import {
  notifyUsers,
  getAdminUserIds,
  getProgramStaffForFellow,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import {
  daysInclusive,
  ensureLeaveConfigs,
  parseDateOnly,
  typeKeyFromName,
  validateLeaveQuota,
} from "@/lib/leaves";

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
      const team = (await getHierarchyScopedUserIds(user, { includeSelf: true })) || [user.id];
      where = { userId: { in: team.length ? team : [user.id] } };
    } else {
      where = { userId: user.id };
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: { select: { name: true } }, leavesTaken: true, leavesRemaining: true } },
        compOffCredit: true,
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
    const configs = await ensureLeaveConfigs();
    const leaveTypeKey = body.leaveTypeKey || typeKeyFromName(type, configs);
    const config = configs.find((c) => c.key === leaveTypeKey);
    if (!config) {
      return NextResponse.json({ error: "Please select a valid leave type" }, { status: 400 });
    }

    const startDate = parseDateOnly(body.startDate || body.singleDate || dates);
    const endDate = parseDateOnly(body.endDate || body.singleDate || dates) || startDate;
    if (!startDate || !endDate || endDate < startDate) {
      return NextResponse.json({ error: "Please select valid leave dates" }, { status: 400 });
    }

    const days = daysInclusive(startDate, endDate);
    let compOffWorkedDate = null;
    let compOffCreditId = null;

    if (leaveTypeKey === "COMP_OFF") {
      compOffWorkedDate = parseDateOnly(body.compOffWorkedDate);
      if (!compOffWorkedDate) {
        return NextResponse.json({ error: "Select the date you worked on a non-working day" }, { status: 400 });
      }
      if (compOffWorkedDate >= startDate) {
        return NextResponse.json({ error: "The comp-off leave date must be after the worked date" }, { status: 400 });
      }
      const expiry = new Date(Date.UTC(
        compOffWorkedDate.getUTCFullYear(),
        compOffWorkedDate.getUTCMonth() + 3,
        compOffWorkedDate.getUTCDate()
      ));
      if (startDate > expiry) {
        return NextResponse.json({ error: "Comp off must be availed within 3 months of the worked date" }, { status: 400 });
      }

      const existingCredit = await prisma.compOffCredit.findUnique({
        where: { userId_workedDate: { userId: user.id, workedDate: compOffWorkedDate } },
      });
      if (existingCredit && new Date(existingCredit.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This comp-off credit has expired" }, { status: 400 });
      }
      if (existingCredit && existingCredit.status !== "Available") {
        return NextResponse.json({ error: "This comp-off has already been used or reserved" }, { status: 400 });
      }
      if (existingCredit && Number(existingCredit.days) < days) {
        return NextResponse.json({ error: "Requested days exceed the available comp-off credit" }, { status: 400 });
      }

      const credit = existingCredit
        ? await prisma.compOffCredit.update({
            where: { id: existingCredit.id },
            data: { status: "Reserved" },
          })
        : await prisma.compOffCredit.create({
            data: {
              userId: user.id,
              workedDate: compOffWorkedDate,
              days: days,
              expiresAt: expiry,
              status: "Reserved",
            },
          });
      compOffCreditId = credit.id;
    } else {
      const validation = await validateLeaveQuota({ userId: user.id, leaveTypeKey, startDate, endDate });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const leave = await prisma.leave.create({
      data: {
        userId: user.id,
        type: config.name,
        leaveTypeKey,
        startDate,
        endDate,
        days,
        dates: body.dates || `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
        reason,
        compOffWorkedDate,
        compOffCreditId,
        status: "PENDING",
      },
      include: { compOffCredit: true },
    });

    // Fellows notify the program staff who manage them plus admins. Every other
    // role (PROGRAM_MANAGER and the new program roles) notifies admins only for now.
    let recipients;
    const [admins, managers] = await Promise.all([
      getAdminUserIds(),
      getAncestorUserIds(user.id),
    ]);
    if (user.role?.name === "FELLOW") {
      const fellowId = await getFellowIdByUserId(user.id);
      const programStaff = await getProgramStaffForFellow(fellowId);
      recipients = [...programStaff, ...managers, ...admins];
    } else {
      recipients = [...managers, ...admins];
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
