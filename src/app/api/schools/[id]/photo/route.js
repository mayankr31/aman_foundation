import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "school-images");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

async function saveImage(file) {
  if (!file || file.size === 0) return null;
  await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/school-images/${filename}`;
}

async function deleteImage(url) {
  if (!url || !url.startsWith("/uploads/school-images/")) return;
  try {
    await unlink(join(process.cwd(), "public", url));
  } catch {}
}

async function resolveSchoolId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const school = await prisma.school.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return school ? school.id : null;
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("photo");
    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 400 });
    }

    const existing = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { img: true }
    });

    const img = await saveImage(file);
    if (!img) {
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    await prisma.school.update({ where: { id: schoolId }, data: { img } });

    if (existing?.img && existing.img !== img) {
      await deleteImage(existing.img);
    }

    return NextResponse.json({ success: true, data: { img } });
  } catch (error) {
    console.error("Upload school image error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
