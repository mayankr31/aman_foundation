import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { getSubordinateUserIds } from "@/lib/hierarchy";
import { getTravelReviewerUserIds } from "@/lib/travelApprovers";
import { validateAmount, validateDateOrder, firstError } from "@/lib/validation";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "mine";

    let where = {};
    if (scope === "manage") {
      const canManage =
        user.role.name === "ADMIN" ||
        (await checkPermission(user, "dashboard", "travel-management", "READ"));
      if (!canManage) {
        return NextResponse.json({ error: "Forbidden: Travel management access required" }, { status: 403 });
      }

      if (user.role.name !== "ADMIN") {
        // A reviewer sees their reporting subtree only, never their own request.
        const reportIds = await getSubordinateUserIds(user.id);
        where = { userId: { in: reportIds } };
      }
    } else {
      if (!(await checkPermission(user, "dashboard", "travel", "READ"))) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
      }
      where = { userId: user.id };
    }

    const requests = await prisma.travelRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("Fetch travel requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "travel", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
    }

    if (user.role.name === "ADMIN") {
      return NextResponse.json({ error: "Admins do not submit travel requests" }, { status: 403 });
    }

    const body = await req.json();
    const { destination, purpose, startDate, endDate, expectedExpenses } = body;

    if (!destination || !purpose || !startDate || !endDate) {
      return NextResponse.json({ error: "destination, purpose, startDate, and endDate are required" }, { status: 400 });
    }

    const validationMessage = firstError([
      validateDateOrder(startDate, endDate),
      validateAmount(expectedExpenses, { min: 0 }),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const request = await prisma.travelRequest.create({
      data: {
        userId: user.id,
        destination,
        purpose,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        expectedExpenses: expectedExpenses || 0,
        status: "PENDING"
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const reviewers = await getTravelReviewerUserIds(user.id);
    await notifyUsers(reviewers, {
      type: NOTIFICATION_TYPES.TRAVEL_REQUESTED,
      title: "New Travel Request",
      message: `${user.name || request.user.name || "A staff member"} submitted a travel request to ${destination} for approval.`,
      link: `/travel/manage`,
      actorId: user.id,
    });

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (error) {
    console.error("Create travel request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
