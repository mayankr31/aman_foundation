import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    const alerts = await prisma.broadcastAlert.findMany({
      include: {
        sentByUser: {
          select: { id: true, name: true }
        }
      },
      orderBy: { sentAt: "desc" }
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Fetch alerts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const body = await req.json();
    const { severity, message } = body;

    if (!severity || !message) {
      return NextResponse.json({ error: "Severity and Message are required" }, { status: 400 });
    }

    const alert = await prisma.broadcastAlert.create({
      data: {
        severity,
        message,
        sentByUserId: user.id
      }
    });

    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch (error) {
    console.error("Create alert error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
