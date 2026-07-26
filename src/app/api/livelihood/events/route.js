import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "livelihood-events");

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
  return `/uploads/livelihood-events/${filename}`;
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const livelihoodId = searchParams.get("livelihoodId");
    const eventType = searchParams.get("eventType");

    const where = {};
    if (livelihoodId) where.livelihoodId = livelihoodId;
    if (eventType) where.eventType = eventType;

    const events = await prisma.livelihoodEvent.findMany({
      where,
      orderBy: { eventDate: "desc" },
      include: {
        livelihood: {
          select: {
            id: true,
            beneficiary: { select: { id: true, name: true } },
            program: { select: { id: true, name: true, type: true, category: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("Fetch livelihood events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req) {
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

    const formData = await req.formData();
    const livelihoodId = formData.get("livelihoodId");
    const eventType = formData.get("eventType");
    const eventDate = formData.get("eventDate") || new Date().toISOString();
    const quantity = formData.get("quantity") ? parseFloat(formData.get("quantity")) : null;
    const notes = formData.get("notes") || null;
    const recordedBy = formData.get("recordedBy") || null;
    const photo = formData.get("photo");

    if (!livelihoodId || !eventType) {
      return NextResponse.json(
        { error: "livelihoodId and eventType are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.beneficiaryLivelihood.findUnique({
      where: { id: livelihoodId },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Livelihood assignment not found" },
        { status: 404 }
      );
    }

    const photoUrl = await savePhoto(photo);

    const event = await prisma.livelihoodEvent.create({
      data: {
        livelihoodId,
        eventType,
        eventDate: new Date(eventDate),
        quantity,
        notes,
        photoUrl,
        recordedBy,
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("Create livelihood event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
