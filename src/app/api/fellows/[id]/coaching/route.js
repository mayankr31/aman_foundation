import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "coaching");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

async function saveFile(file) {
  if (!file || file.size === 0) return null;
  await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "pdf";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);
  return `/uploads/coaching/${filename}`;
}

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const records = await prisma.coachingRecord.findMany({
      where: { fellowId },
      orderBy: { date: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Fetch coaching records error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const heading = formData.get("heading");
    const date = formData.get("date");
    const feedback = formData.get("feedback") || null;
    const observationNotes = formData.get("observationNotes") || null;
    const file = formData.get("file");

    if (!heading || !date) {
      return NextResponse.json({ error: "heading and date are required" }, { status: 400 });
    }

    const fileUrl = await saveFile(file);

    const record = await prisma.coachingRecord.create({
      data: {
        fellowId,
        heading,
        date: new Date(date),
        feedback,
        observationNotes,
        fileUrl,
        authorId: user.id
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Create coaching record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");
    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }

    await prisma.coachingRecord.delete({
      where: { id: recordId }
    });

    return NextResponse.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Delete coaching record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
