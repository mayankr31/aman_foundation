import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "travel", "READ"))) {
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
        expenses: true
      }
    });

    if (!request) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }

    const isAdminOrManager = user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);
    if (request.userId !== user.id && !isAdminOrManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!(await checkPermission(user, "dashboard", "travel", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Only admins and managers can approve/reject" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!status || !["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required (APPROVED, REJECTED, or COMPLETED)" }, { status: 400 });
    }

    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required when rejecting" }, { status: 400 });
    }

    const existing = await prisma.travelRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }

    const request = await prisma.travelRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        approvedBy: user.id,
        approvedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true }
        },
        expenses: true
      }
    });

    // Notify the request creator about the decision.
    const isRejected = status === "REJECTED";
    const isCompleted = status === "COMPLETED";
    await notifyUsers([existing.userId], {
      type: isRejected
        ? NOTIFICATION_TYPES.TRAVEL_REJECTED
        : isCompleted
          ? NOTIFICATION_TYPES.TRAVEL_COMPLETED
          : NOTIFICATION_TYPES.TRAVEL_APPROVED,
      title: isRejected
        ? "Travel Request Rejected"
        : isCompleted
          ? "Travel Request Completed"
          : "Travel Request Approved",
      message: isRejected
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
