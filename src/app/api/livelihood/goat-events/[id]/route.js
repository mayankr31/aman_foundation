import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "goat-events");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

async function savePhoto(file) {
  if (!file || file.size === 0) return null;
  await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);
  return `/uploads/goat-events/${filename}`;
}

async function deletePhoto(photoUrl) {
  if (!photoUrl) return;
  const filePath = join(process.cwd(), "public", photoUrl);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await params;

    const event = await prisma.goatRearingEvent.findUnique({
      where: { id },
      include: {
        beneficiaryGoatRearing: {
          select: {
            id: true,
            beneficiary: { select: { id: true, name: true } },
            goatRearingProgram: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Fetch goat event error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await req.formData();

    const existing = await prisma.goatRearingEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventType = formData.get("eventType");
    const eventDate = formData.get("eventDate");
    const quantity = formData.get("quantity");
    const notes = formData.get("notes");
    const recordedBy = formData.get("recordedBy");
    const photo = formData.get("photo");

    if (eventType && !["Death", "Pregnancy", "ChildBirth"].includes(eventType)) {
      return NextResponse.json(
        { error: "eventType must be Death, Pregnancy, or ChildBirth" },
        { status: 400 }
      );
    }

    let photoUrl = existing.photoUrl;

    if (photo && photo.size > 0) {
      await deletePhoto(existing.photoUrl);
      photoUrl = await savePhoto(photo);
    }

    const data = {};
    if (eventType) data.eventType = eventType;
    if (eventDate) data.eventDate = new Date(eventDate);
    if (quantity) data.quantity = parseInt(quantity);
    if (notes !== null) data.notes = notes;
    if (recordedBy !== null) data.recordedBy = recordedBy;
    data.photoUrl = photoUrl;

    const updated = await prisma.goatRearingEvent.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update goat event error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const event = await prisma.goatRearingEvent.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await deletePhoto(event.photoUrl);

    await prisma.goatRearingEvent.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete goat event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
