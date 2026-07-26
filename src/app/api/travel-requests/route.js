import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const isAdminOrManager = user.role.name === "ADMIN" || user.role.name === "PROGRAM_MANAGER";

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

    if (user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Only fellows can create travel requests" }, { status: 403 });
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

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (error) {
    console.error("Create travel request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
