import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authenticateUser } from "../../../../lib/auth";
import { canAccessUser } from "../../../../lib/hierarchy";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
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
        user: { select: { id: true, name: true, email: true, username: true, mobile: true, role: { select: { name: true } }, leavesTaken: true, leavesRemaining: true } },
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
    if (!isApprover) {
      if (PROGRAM_ROLES.includes(user.role?.name)) {
        if (existing.userId === user.id || !(await isPmTeamMember(user, existing.userId))) {
          return NextResponse.json({ error: "Forbidden: You can only approve leaves for your team" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden: You cannot approve or reject leaves" }, { status: 403 });
      }
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
    if (user.role?.name !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can delete records" },
        { status: 403 }
      );
    }


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

    await prisma.$transaction(async (tx) => {
      if (existing.compOffCreditId) {
        await tx.compOffCredit.updateMany({
          where: { id: existing.compOffCreditId, status: { in: ["Reserved", "Used"] } },
          data: { status: "Available" },
        });
      }
      await tx.leave.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    console.error("DELETE leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
