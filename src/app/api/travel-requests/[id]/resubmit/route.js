import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getTravelReviewerUserIds } from "@/lib/travelApprovers";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { validateAmount, validateDateOrder, firstError } from "@/lib/validation";

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "travel", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.travelRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You can only resubmit your own request" }, { status: 403 });
    }
    if (existing.status !== "REVERTED") {
      return NextResponse.json(
        { error: "Only a request sent back for changes can be resubmitted" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const destination = String(body.destination || "").trim();
    const purpose = String(body.purpose || "").trim();
    const startDate = body.startDate;
    const endDate = body.endDate;
    const expectedExpenses = body.expectedExpenses;

    if (!destination || !purpose || !startDate || !endDate) {
      return NextResponse.json(
        { error: "destination, purpose, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const validationMessage = firstError([
      validateDateOrder(startDate, endDate),
      validateAmount(expectedExpenses, { min: 0 }),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const request = await prisma.travelRequest.update({
      where: { id },
      data: {
        destination,
        purpose,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        expectedExpenses: expectedExpenses || 0,
        status: "PENDING",
        revertReason: null,
        revertedBy: null,
        revertedAt: null,
        resubmittedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
        reverter: { select: { id: true, name: true } },
        expenses: true,
      },
    });

    const reviewers = await getTravelReviewerUserIds(user.id);
    await notifyUsers(reviewers, {
      type: NOTIFICATION_TYPES.TRAVEL_REQUESTED,
      title: "Travel Request Resubmitted",
      message: `${user.name || request.user.name || "A staff member"} updated and resubmitted a travel request to ${destination}.`,
      link: `/travel/manage`,
      actorId: user.id,
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error("Resubmit travel request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
