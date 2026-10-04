import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "user-avatars");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

async function saveAvatar(file) {
  if (!file || file.size === 0) return null;
  await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/user-avatars/${filename}`;
}

async function deleteAvatar(url) {
  if (!url || !url.startsWith("/uploads/user-avatars/")) return;
  try {
    await unlink(join(process.cwd(), "public", url));
  } catch {}
}

export async function POST(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    const allowed =
      currentUser.id === id ||
      (await checkPermission(currentUser, "dashboard", "employees", "WRITE"));
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, avatar: true, fellow: { select: { id: true, avatar: true } } },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar");
    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 });
    }

    const avatarUrl = await saveAvatar(file);
    if (!avatarUrl) {
      return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { avatar: avatarUrl } });
      if (target.fellow) {
        await tx.fellow.update({ where: { id: target.fellow.id }, data: { avatar: avatarUrl } });
      }
    });

    if (target.avatar && target.avatar !== avatarUrl) {
      await deleteAvatar(target.avatar);
    }

    return NextResponse.json({ success: true, data: { avatar: avatarUrl } });
  } catch (error) {
    console.error("Upload user avatar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
