import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    const { id } = await context.params;

    const incident = await prisma.disasterIncident.findUnique({
      where: { id }
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    console.error("Fetch incident detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existingIncident = await prisma.disasterIncident.findUnique({
      where: { id }
    });

    if (!existingIncident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const updatedIncident = await prisma.disasterIncident.update({
      where: { id },
      data: {
        name: body.name,
        location: body.location,
        type: body.type,
        active: body.active !== undefined ? body.active : undefined
      }
    });

    return NextResponse.json({ success: true, data: updatedIncident });
  } catch (error) {
    console.error("Update incident error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;

    const existingIncident = await prisma.disasterIncident.findUnique({
      where: { id }
    });

    if (!existingIncident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete incident record
      await tx.disasterIncident.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Incident deleted successfully" });
  } catch (error) {
    console.error("Delete incident error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
