import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { isSubordinate } from "@/lib/hierarchy";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const canManage =
      user.role.name === "ADMIN" ||
      (await checkPermission(user, "dashboard", "travel-management", "READ"));
    const canTravel = await checkPermission(user, "dashboard", "travel", "READ");
    if (!canManage && !canTravel) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
    }

    const { id } = await context.params;

    const request = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true }
        },
        approver: {
          select: { id: true, name: true }
        },
        reverter: {
          select: { id: true, name: true }
        },
        expenses: true
      }
    });

    if (!request) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }

    if (request.userId !== user.id) {
      if (!canManage) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (user.role.name !== "ADMIN" && !(await isSubordinate(user.id, request.userId))) {
        return NextResponse.json({ error: "Forbidden: Not in your reporting line" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error("Fetch travel request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "travel-management", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Travel management access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, rejectionReason, revertReason } = body;

    if (!status || !["APPROVED", "REJECTED", "REVERTED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (APPROVED, REJECTED, REVERTED, or COMPLETED)" },
        { status: 400 }
      );
    }

    if (status === "REJECTED" && !String(rejectionReason || "").trim()) {
      return NextResponse.json({ error: "Rejection reason is required when rejecting" }, { status: 400 });
    }

    if (status === "REVERTED" && !String(revertReason || "").trim()) {
      return NextResponse.json({ error: "Remarks are required when sending a request back" }, { status: 400 });
    }

    const existing = await prisma.travelRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }

    if (existing.userId === user.id) {
      return NextResponse.json({ error: "You cannot review your own travel request" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !(await isSubordinate(user.id, existing.userId))) {
      return NextResponse.json(
        { error: "Forbidden: You can only review requests from your team" },
        { status: 403 }
      );
    }

    const allowedSources = {
      APPROVED: ["PENDING"],
      REJECTED: ["PENDING"],
      REVERTED: ["PENDING", "APPROVED"],
      COMPLETED: ["APPROVED"],
    };
    if (!allowedSources[status].includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot change a ${existing.status} request to ${status}` },
        { status: 400 }
      );
    }

    const now = new Date();
    const data = { status };

    if (status === "REVERTED") {
      data.revertReason = String(revertReason).trim();
      data.revertedBy = user.id;
      data.revertedAt = now;
      data.revertCount = { increment: 1 };
      data.approvedBy = null;
      data.approvedAt = null;
      data.rejectionReason = null;
    } else if (status === "REJECTED") {
      data.rejectionReason = String(rejectionReason).trim();
      data.approvedBy = user.id;
      data.approvedAt = now;
      data.revertReason = null;
    } else {
      data.approvedBy = user.id;
      data.approvedAt = now;
      data.rejectionReason = null;
      data.revertReason = null;
    }

    const request = await prisma.travelRequest.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true }
        },
        reverter: {
          select: { id: true, name: true }
        },
        expenses: true
      }
    });

    // Notify the request creator about the decision.
    const isRejected = status === "REJECTED";
    const isReverted = status === "REVERTED";
    const isCompleted = status === "COMPLETED";
    await notifyUsers([existing.userId], {
      type: isReverted
        ? NOTIFICATION_TYPES.TRAVEL_REVERTED
        : isRejected
          ? NOTIFICATION_TYPES.TRAVEL_REJECTED
          : isCompleted
            ? NOTIFICATION_TYPES.TRAVEL_COMPLETED
            : NOTIFICATION_TYPES.TRAVEL_APPROVED,
      title: isReverted
        ? "Travel Request Needs Changes"
        : isRejected
          ? "Travel Request Rejected"
          : isCompleted
            ? "Travel Request Completed"
            : "Travel Request Approved",
      message: isReverted
        ? `Your travel request to ${request.destination} was sent back for changes.${revertReason ? ` Remarks: ${revertReason}` : ""}`
        : isRejected
          ? `Your travel request to ${request.destination} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`
          : isCompleted
            ? `Your travel request to ${request.destination} has been marked completed.`
            : `Your travel request to ${request.destination} was approved.`,
      link: `/travel`,
      actorId: user.id,
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error("Update travel request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "travel", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
    }

    const { id } = await context.params;

    const request = await prisma.travelRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }

    if (request.userId !== user.id && user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.travelRequest.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Travel request deleted" });
  } catch (error) {
    console.error("Delete travel request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
