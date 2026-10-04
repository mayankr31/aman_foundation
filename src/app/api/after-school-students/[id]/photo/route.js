import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedCentreIds } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "after-school-student-photos");

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
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/after-school-student-photos/${filename}`;
}

async function deletePhoto(url) {
  if (!url || !url.startsWith("/uploads/after-school-student-photos/")) return;
  try {
    await unlink(join(process.cwd(), "public", url));
  } catch {}
}

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.afterSchoolStudent.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const isAdmin = user.role.name === "ADMIN";
    const isPm = PROGRAM_ROLES.includes(user.role.name);
    const isFellow = user.role.name === "FELLOW";
    if (!isAdmin && !isPm && !isFellow) {
      return NextResponse.json({ error: "Forbidden: Admin, Program Manager or Fellow access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);
    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    if (isFellow || isPm) {
      const studentObj = await prisma.afterSchoolStudent.findUnique({
        where: { id: studentId },
        select: { centreId: true }
      });
      if (!studentObj || !studentObj.centreId) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
      }
      if (isFellow) {
        const isAssigned = await prisma.fellowAfterSchoolCentre.findFirst({
          where: { centreId: studentObj.centreId, fellow: { userId: user.id } }
        });
        if (!isAssigned) {
          return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
        }
      } else {
        const managed = await getManagedCentreIds(user.id);
        if (!managed.includes(studentObj.centreId)) {
          return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
        }
      }
    }

    const formData = await req.formData();
    const file = formData.get("photo");
    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 400 });
    }

    const existing = await prisma.afterSchoolStudent.findUnique({
      where: { id: studentId },
      select: { photoUrl: true }
    });

    const photoUrl = await savePhoto(file);
    if (!photoUrl) {
      return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
    }

    await prisma.afterSchoolStudent.update({ where: { id: studentId }, data: { photoUrl } });

    if (existing?.photoUrl && existing.photoUrl !== photoUrl) {
      await deletePhoto(existing.photoUrl);
    }

    return NextResponse.json({ success: true, data: { photoUrl } });
  } catch (error) {
    console.error("Upload after school student photo error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
