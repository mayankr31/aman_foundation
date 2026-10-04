import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "beneficiary-photos");

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
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);
  return `/uploads/beneficiary-photos/${filename}`;
}

async function deletePhoto(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith("/uploads/beneficiary-photos/")) return;
  try {
    await unlink(join(process.cwd(), "public", photoUrl));
  } catch {}
}

async function resolveBeneficiaryId(id) {
  if (!id || id === "undefined" || id === "null") return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const byEnrolment = await prisma.beneficiary.findFirst({
    where: { enrolmentId: { equals: id, mode: "insensitive" } },
  });
  if (byEnrolment) return byEnrolment.id;

  const decodedId = decodeURIComponent(id);
  const byNameDirect = await prisma.beneficiary.findFirst({
    where: { name: { equals: decodedId, mode: "insensitive" } },
  });
  if (byNameDirect) return byNameDirect.id;

  const name = decodedId.replace(/-/g, " ");
  const byName = await prisma.beneficiary.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return byName ? byName.id : null;
}

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "FELLOW" &&
      !PROGRAM_ROLES.includes(user.role.name)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);
    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const photo = formData.get("photo");
    if (!photo || typeof photo === "string" || photo.size === 0) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 400 });
    }

    const existing = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { photoUrl: true },
    });

    const photoUrl = await savePhoto(photo);
    if (!photoUrl) {
      return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
    }

    const updated = await prisma.beneficiary.update({
      where: { id: beneficiaryId },
      data: { photoUrl },
    });

    if (existing?.photoUrl && existing.photoUrl !== photoUrl) {
      await deletePhoto(existing.photoUrl);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Upload beneficiary photo error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
