import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

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

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
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

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
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
