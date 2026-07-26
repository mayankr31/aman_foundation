import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER" &&
      user.role.name !== "FELLOW"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { eventType, eventDate, quantity, notes, recordedBy } = body;

    const existing = await prisma.livelihoodEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updateData = {};
    if (eventType !== undefined) updateData.eventType = eventType;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (quantity !== undefined) updateData.quantity = quantity !== "" ? parseFloat(quantity) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (recordedBy !== undefined) updateData.recordedBy = recordedBy;

    const event = await prisma.livelihoodEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.livelihoodEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.livelihoodEvent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
