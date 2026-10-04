import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, getAdminUserIds, NOTIFICATION_TYPES } from "@/lib/notifications";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "travel", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for travel" }, { status: 403 });
    }

    const isAdminOrManager = user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);

    const where = isAdminOrManager ? {} : { userId: user.id };

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

    if (user.role.name !== "FELLOW" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Only fellows and program managers can create travel requests" }, { status: 403 });
    }

    const body = await req.json();
    const { destination, purpose, startDate, endDate, expectedExpenses } = body;

    if (!destination || !purpose || !startDate || !endDate) {
      return NextResponse.json({ error: "destination, purpose, startDate, and endDate are required" }, { status: 400 });
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

    const admins = await getAdminUserIds();
    await notifyUsers(admins, {
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
