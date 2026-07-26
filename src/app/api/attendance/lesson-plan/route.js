import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "lesson-plans");

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
  return `/uploads/lesson-plans/${filename}`;
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const formData = await req.formData();
    const logId = formData.get("logId");
    const lessonPlanText = formData.get("lessonPlanText") || null;

    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const log = await prisma.attendanceLog.findUnique({ where: { id: logId } });
    if (!log) {
      return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
    }
    if (log.userId !== user.id && user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingFiles = (log.lessonPlanFiles && typeof log.lessonPlanFiles === 'object' && !Array.isArray(log.lessonPlanFiles))
      ? []
      : (Array.isArray(log.lessonPlanFiles) ? log.lessonPlanFiles : []);

    const uploadedFiles = [];
    const fileKeys = [...formData.keys()].filter(k => k.startsWith("file_"));
    for (const key of fileKeys) {
      const file = formData.get(key);
      if (file && file.size > 0 && file.name) {
        const url = await saveFile(file);
        if (url) uploadedFiles.push(url);
      }
    }

    const allFiles = [...existingFiles, ...uploadedFiles];

    const updated = await prisma.attendanceLog.update({
      where: { id: logId },
      data: {
        lessonPlanText: lessonPlanText || log.lessonPlanText,
        lessonPlanFiles: allFiles.length > 0 ? allFiles : log.lessonPlanFiles
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Lesson plan upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const logId = searchParams.get("logId");
    const fileIndex = parseInt(searchParams.get("fileIndex"));

    if (!logId || isNaN(fileIndex)) {
      return NextResponse.json({ error: "logId and fileIndex are required" }, { status: 400 });
    }

    const log = await prisma.attendanceLog.findUnique({ where: { id: logId } });
    if (!log) {
      return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
    }
    if (log.userId !== user.id && user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const files = Array.isArray(log.lessonPlanFiles) ? [...log.lessonPlanFiles] : [];
    if (fileIndex >= 0 && fileIndex < files.length) {
      files.splice(fileIndex, 1);
    }

    const updated = await prisma.attendanceLog.update({
      where: { id: logId },
      data: { lessonPlanFiles: files.length > 0 ? files : null }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Lesson plan delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
