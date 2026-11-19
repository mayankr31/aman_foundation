import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authenticateUser } from "../../../../lib/auth";
import { canAccessUser } from "../../../../lib/hierarchy";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
  addDays,
  daysInclusive,
  ensureLeaveConfigs,
  parseDateOnly,
  parseLegacyLeaveRange,
  typeKeyFromName,
  validateLeaveQuota,
} from "@/lib/leaves";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

async function isPmTeamMember(managerUser, targetUserId) {
  if (managerUser.id === targetUserId) return true;
  return canAccessUser(managerUser, targetUserId, { allowSelf: false });
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "leaves", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for leaves" }, { status: 403 });
    }

    const { id } = await params;
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, username: true, mobile: true, role: { select: { name: true, displayName: true, rank: true } }, leavesTaken: true, leavesRemaining: true } },
        compOffCredit: true,
      },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const isAdminViewer = ["ADMIN", "HR", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"].includes(user.role?.name);
    const isFellowOrOther = !isAdminViewer;
    if (PROGRAM_ROLES.includes(user.role?.name)) {
      if (!(await isPmTeamMember(user, leave.userId))) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this leave request" }, { status: 403 });
      }
    } else if (isFellowOrOther && leave.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this leave request" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error("GET leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "leaves", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for leaves" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.leave.findUnique({
      where: { id },
      include: {
        user: {
          include: { role: true }
        }
      }
    });
    if (!existing) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const isApprover = ["ADMIN", "HR", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"].includes(user.role?.name);
    const isOwner = existing.userId === user.id;
    const isReviewRequest = body.status !== undefined || body.rejectionReason !== undefined;

    if (!isApprover) {
      if (isReviewRequest) {
        if (PROGRAM_ROLES.includes(user.role?.name)) {
          if (isOwner || !(await isPmTeamMember(user, existing.userId))) {
            return NextResponse.json({ error: "Forbidden: You can only approve leaves for your team" }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: "Forbidden: You cannot approve or reject leaves" }, { status: 403 });
        }
      } else if (isOwner) {
        if (existing.status !== "PENDING") {
          return NextResponse.json(
            { error: "Only pending leave requests can be edited" },
            { status: 403 }
          );
        }
      } else if (
        !PROGRAM_ROLES.includes(user.role?.name) ||
        !(await isPmTeamMember(user, existing.userId))
      ) {
        return NextResponse.json({ error: "Forbidden: You cannot edit this leave request" }, { status: 403 });
      }
    }

    // Applicants can revise their own request while it is still pending. This
    // re-runs the same policy checks as a new request so balances stay accurate.
    if (isOwner && !isReviewRequest && existing.status === "PENDING") {
      const configs = await ensureLeaveConfigs();
      const nextTypeKey =
        body.leaveTypeKey ||
        existing.leaveTypeKey ||
        typeKeyFromName(body.type ?? existing.type, configs);
      const config = configs.find((item) => item.key === nextTypeKey);
      if (!config) {
        return NextResponse.json({ error: "Please select a valid leave type" }, { status: 400 });
      }
      if (!config.active) {
        return NextResponse.json({ error: "This leave type is no longer available" }, { status: 400 });
      }

      const legacyExistingRange = parseLegacyLeaveRange(existing.dates);
      const providedRange = body.dates !== undefined ? parseLegacyLeaveRange(body.dates) : { startDate: null, endDate: null };
      const startDate =
        parseDateOnly(body.startDate ?? body.singleDate) ||
        providedRange.startDate ||
        parseDateOnly(existing.startDate) ||
        legacyExistingRange.startDate;
      const endDate =
        parseDateOnly(body.endDate ?? body.singleDate) ||
        providedRange.endDate ||
        parseDateOnly(existing.endDate) ||
        legacyExistingRange.endDate ||
        startDate;
      if (!startDate || !endDate || endDate < startDate) {
        return NextResponse.json({ error: "Please select valid leave dates" }, { status: 400 });
      }

      const holidayName =
        body.holidayName !== undefined
          ? String(body.holidayName || "").trim()
          : String(existing.holidayName || "").trim();
      if (config.holidayNameRequired && !holidayName) {
        return NextResponse.json({ error: "Enter the name of the approved holiday" }, { status: 400 });
      }

      const days = daysInclusive(startDate, endDate);
      if (!days) {
        return NextResponse.json({ error: "Please select valid leave dates" }, { status: 400 });
      }

      let compOffWorkedDate = null;
      let compOffCreditId = null;
      let policyFlags = [];
      const isCompOff = nextTypeKey === "COMP_OFF" || config.systemType === "COMP_OFF";

      if (isCompOff) {
        const providedWorkedDate =
          body.compOffWorkedDate !== undefined ? body.compOffWorkedDate : existing.compOffWorkedDate;
        compOffWorkedDate = parseDateOnly(providedWorkedDate);
        if (!compOffWorkedDate) {
          return NextResponse.json(
            { error: "Select the date you worked on a non-working day" },
            { status: 400 }
          );
        }

        const workedDateKey = compOffWorkedDate.toISOString().slice(0, 10);
        const isWeeklyOff = compOffWorkedDate.getUTCDay() === 0;
        const publicHoliday = isWeeklyOff
          ? null
          : await prisma.holiday.findFirst({
              where: { dateKey: workedDateKey, active: true, type: "PUBLIC" },
              select: { id: true },
            });
        if (!isWeeklyOff && !publicHoliday) {
          return NextResponse.json(
            { error: "Comp-off can only be claimed for a Sunday or public holiday you worked." },
            { status: 400 }
          );
        }

        if (compOffWorkedDate >= startDate) {
          return NextResponse.json(
            { error: "The comp-off leave date must be after the worked date" },
            { status: 400 }
          );
        }
        const expiry = addDays(compOffWorkedDate, Number(config.validityDays || 90));
        if (startDate > expiry) {
          return NextResponse.json(
            {
              error: `Compensatory leave must be availed within ${Number(
                config.validityDays || 90
              )} days of the worked date`,
            },
            { status: 400 }
          );
        }

        const credit = await prisma.compOffCredit.findUnique({
          where: {
            userId_workedDate: { userId: existing.userId, workedDate: compOffWorkedDate },
          },
        });
        if (!credit) {
          return NextResponse.json(
            {
              error:
                "No comp-off credit found for that day. Comp-off is granted automatically when you check in on a Sunday or public holiday.",
            },
            { status: 400 }
          );
        }
        if (new Date(credit.expiresAt) < new Date()) {
          return NextResponse.json({ error: "This comp-off credit has expired" }, { status: 400 });
        }
        const keepsExistingCredit = existing.compOffCreditId === credit.id;
        if (!keepsExistingCredit && credit.status !== "Available") {
          return NextResponse.json(
            { error: "This comp-off has already been used or reserved" },
            { status: 400 }
          );
        }
        if (keepsExistingCredit && !["Available", "Reserved"].includes(credit.status)) {
          return NextResponse.json({ error: "This comp-off is no longer available" }, { status: 400 });
        }
        if (Number(credit.days) < days) {
          return NextResponse.json(
            { error: "Requested days exceed the available comp-off credit" },
            { status: 400 }
          );
        }
        compOffCreditId = credit.id;
      } else {
        const validation = await validateLeaveQuota({
          userId: existing.userId,
          leaveTypeKey: nextTypeKey,
          startDate,
          endDate,
          excludeLeaveId: existing.id,
        });
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        policyFlags = validation.warnings || [];
      }

      const dates =
        body.dates ||
        `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`;

      const leave = await prisma.$transaction(async (tx) => {
        if (existing.compOffCreditId && existing.compOffCreditId !== compOffCreditId) {
          await tx.compOffCredit.updateMany({
            where: { id: existing.compOffCreditId, status: "Reserved" },
            data: { status: "Available" },
          });
        }
        if (compOffCreditId) {
          await tx.compOffCredit.update({
            where: { id: compOffCreditId },
            data: { status: "Reserved" },
          });
        }

        return tx.leave.update({
          where: { id },
          data: {
            type: config.name,
            leaveTypeKey: nextTypeKey,
            startDate,
            endDate,
            days,
            dates,
            reason: body.reason !== undefined ? body.reason : existing.reason,
            holidayName: holidayName || null,
            compOffWorkedDate,
            compOffCreditId,
            medicalCertificateRequired: policyFlags.includes("MEDICAL_CERTIFICATE_REQUIRED"),
            policyFlags,
          },
          include: { compOffCredit: true },
        });
      });

      return NextResponse.json({ success: true, data: leave });
    }

    const nextStatus = body.status !== undefined ? body.status : existing.status;

    if (nextStatus === "APPROVED" && existing.status !== "APPROVED" && existing.compOffCreditId) {
      const credit = await prisma.compOffCredit.findUnique({ where: { id: existing.compOffCreditId } });
      if (!credit || new Date(credit.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This comp-off credit has expired and cannot be approved" }, { status: 400 });
      }
    }

    let approvalPolicyFlags = null;
    if (nextStatus === "APPROVED" && existing.status !== "APPROVED" && existing.leaveTypeKey !== "COMP_OFF") {
      const startDate = existing.startDate ? parseDateOnly(existing.startDate) : parseLegacyLeaveRange(existing.dates).startDate;
      const endDate = existing.endDate ? parseDateOnly(existing.endDate) : parseLegacyLeaveRange(existing.dates).endDate;
      const leaveTypeKey = existing.leaveTypeKey || typeKeyFromName(existing.type, await ensureLeaveConfigs());
      if (leaveTypeKey && startDate && endDate) {
        const validation = await validateLeaveQuota({
          userId: existing.userId,
          leaveTypeKey,
          startDate,
          endDate,
          excludeLeaveId: existing.id,
          allowInactive: true,
        });
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        approvalPolicyFlags = validation.warnings || [];
      }
    }

    const leave = await prisma.$transaction(async (tx) => {
      const updated = await tx.leave.update({
        where: { id },
        data: {
          ...(body.type !== undefined && { type: body.type }),
          ...(body.dates !== undefined && { dates: body.dates }),
          ...(body.reason !== undefined && { reason: body.reason }),
          ...(body.rejectionReason !== undefined && { rejectionReason: body.rejectionReason }),
          ...(body.status !== undefined && { status: body.status }),
          ...(approvalPolicyFlags !== null && {
            policyFlags: approvalPolicyFlags,
            medicalCertificateRequired: approvalPolicyFlags.includes("MEDICAL_CERTIFICATE_REQUIRED"),
          }),
        },
        include: { compOffCredit: true },
      });

      if (body.status === "APPROVED" && existing.status !== "APPROVED") {
        if (existing.compOffCreditId) {
          await tx.compOffCredit.update({
            where: { id: existing.compOffCreditId },
            data: { status: "Used" },
          });
        }
      } else if (existing.status === "APPROVED" && (body.status === "REJECTED" || body.status === "PENDING")) {
        if (existing.compOffCreditId) {
          await tx.compOffCredit.update({
            where: { id: existing.compOffCreditId },
            data: { status: "Available" },
          });
        }
      } else if (
        body.status === "REJECTED" &&
        (existing.status === "PENDING" || existing.status === "REJECTED") &&
        existing.compOffCreditId
      ) {
        // Release a reservation made when the request was submitted.
        await tx.compOffCredit.updateMany({
          where: { id: existing.compOffCreditId, status: "Reserved" },
          data: { status: "Available" },
        });
      }

      return updated;
    });

    // Notify the request creator when their leave is approved or rejected.
    if (
      existing.userId &&
      (body.status === "APPROVED" || body.status === "REJECTED") &&
      body.status !== existing.status
    ) {
      const isRejected = body.status === "REJECTED";
      await notifyUsers([existing.userId], {
        type: isRejected ? NOTIFICATION_TYPES.LEAVE_REJECTED : NOTIFICATION_TYPES.LEAVE_APPROVED,
        title: isRejected ? "Leave Request Rejected" : "Leave Request Approved",
        message: isRejected
          ? `Your leave request${leave.dates ? ` (${leave.dates})` : ""} was rejected.${leave.rejectionReason ? ` Reason: ${leave.rejectionReason}` : ""}`
          : `Your leave request${leave.dates ? ` (${leave.dates})` : ""} was approved.`,
        link: `/hr/leaves`,
        actorId: user.id,
      });
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error("PUT leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "leaves", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for leaves" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.leave.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const isOwner = existing.userId === user.id;
    const isAdmin = ["ADMIN", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"].includes(user.role?.name);
    let isPmTeam = false;
    if (PROGRAM_ROLES.includes(user.role?.name)) {
      isPmTeam = await isPmTeamMember(user, existing.userId);
    }
    if (!isOwner && !isAdmin && !isPmTeam) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this leave request" }, { status: 403 });
    }
    if (!isAdmin && existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending leave requests can be deleted" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (existing.compOffCreditId) {
        await tx.compOffCredit.updateMany({
          where: { id: existing.compOffCreditId, status: { in: ["Reserved", "Used"] } },
          data: { status: "Available" },
        });
      }
      await tx.leave.delete({ where: { id } });

      // Remove the pending "New Leave Request" notification from approvers so
      // their bell doesn't point at a withdrawn request.
      await tx.notification.deleteMany({
        where: {
          type: NOTIFICATION_TYPES.LEAVE_REQUESTED,
          dedupeKey: { startsWith: `leave-request:${id}:` },
        },
      });
    });

    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    console.error("DELETE leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
