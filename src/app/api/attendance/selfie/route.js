import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "attendance-selfies");
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "self-attendance", "WRITE"))) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions for self attendance" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: "A selfie image is required." }, { status: 400 });
    }

    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, or WebP images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Selfie must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const filename = `${crypto.randomUUID()}.${extension}`;
    await writeFile(join(UPLOAD_DIR, filename), Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      data: { url: `/uploads/attendance-selfies/${filename}` },
    });
  } catch (error) {
    console.error("Attendance selfie upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
