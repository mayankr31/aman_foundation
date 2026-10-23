import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "tasks");

function safeExtension(name) {
  const ext = String(name || "").split(".").pop() || "bin";
  return /^[a-z0-9]{1,8}$/i.test(ext) ? ext : "bin";
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

async function loadTaskForUser(user, taskId) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { task: null, allowed: false };
  const allowed =
    user.role.name === "ADMIN" ||
    task.assigneeId === user.id ||
    task.assignedById === user.id;
  return { task, allowed };
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "READ"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const { allowed } = await loadTaskForUser(user, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const documents = await prisma.taskDocument.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("Fetch task documents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { allowed } = await loadTaskForUser(user, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const files = formData.getAll("files").filter((file) => file && file.size > 0);
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    await ensureUploadDir();
    const created = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${crypto.randomUUID()}.${safeExtension(file.name)}`;
      await writeFile(join(UPLOAD_DIR, filename), buffer);
      const doc = await prisma.taskDocument.create({
        data: {
          taskId: id,
          name: file.name || filename,
          url: `/uploads/tasks/${filename}`,
          mimeType: file.type || null,
          size: file.size || null,
          uploadedById: user.id,
        },
      });
      created.push(doc);
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Upload task documents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { allowed } = await loadTaskForUser(user, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json({ error: "documentId is required" }, { status: 400 });

    const document = await prisma.taskDocument.findUnique({ where: { id: documentId } });
    if (!document || document.taskId !== id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.taskDocument.delete({ where: { id: documentId } });
    try {
      const filePath = join(process.cwd(), "public", document.url.replace(/^\//, ""));
      await unlink(filePath);
    } catch {
      // File may already be missing; the database record is still removed.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task document error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
