import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getISTDateKey } from "@/lib/time";
import { saveUploadedFile } from "@/lib/uploadStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LESSON_PLAN_FOLDER = "attendance-lesson-plans";

async function canWriteLessonPlan(user) {
  if (await checkPermission(user, "dashboard", "self-attendance", "WRITE")) return true;
  // Fellows are the primary lesson-plan users; allow their education write
  // permission as a fallback so a stale/missing self-attendance grant does not
  // silently block document uploads.
  if (user?.role?.name === "FELLOW") {
    return checkPermission(user, "dashboard", "education", "WRITE");
  }
  return false;
}

function collectLessonPlanFiles(formData) {
  const files = [];
  const seen = new Set();

  for (const file of formData.getAll("files")) {
    if (file && typeof file !== "string" && file.size > 0) files.push(file);
  }

  for (const key of formData.keys()) {
    if (!key.startsWith("file_") || seen.has(key)) continue;
    seen.add(key);
    const file = formData.get(key);
    if (file && typeof file !== "string" && file.size > 0) {
      files.push(file);
    }
  }

  return files;
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await canWriteLessonPlan(user))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for attendance" }, { status: 403 });
    }

    const formData = await req.formData();
    const logId = formData.get("logId");
    const logdate = formData.get("logdate") || getISTDateKey();
    const lessonPlanText = formData.get("lessonPlanText") || null;
    const teachingDayValue = formData.get("isTeachingDay");

    let log = null;

    if (logId) {
      log = await prisma.attendanceLog.findUnique({ where: { id: logId } });
      if (!log) {
        return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
      }
    } else {
      // Saving a lesson plan before check-in creates a lightweight draft row
      // for today. It becomes the real attendance log when the user checks in.
      log = await prisma.attendanceLog.findFirst({
        where: { userId: user.id, logdate },
      });
      if (!log) {
        log = await prisma.attendanceLog.create({
          data: {
            userId: user.id,
            email: user.email,
            logdate,
            workstatus: "Draft lesson plan",
            lessonPlanText,
            isTeachingDay:
              teachingDayValue === null ? null : String(teachingDayValue) === "true",
          },
        });
      }
    }

    if (log.userId !== user.id && user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingFiles = (log.lessonPlanFiles && typeof log.lessonPlanFiles === 'object' && !Array.isArray(log.lessonPlanFiles))
      ? []
      : (Array.isArray(log.lessonPlanFiles) ? log.lessonPlanFiles : []);

    const uploadedFiles = [];
    for (const file of collectLessonPlanFiles(formData)) {
      const url = await saveUploadedFile(file, { folder: LESSON_PLAN_FOLDER });
      if (url) uploadedFiles.push(url);
    }

    const allFiles = [...existingFiles, ...uploadedFiles];

    const updated = await prisma.attendanceLog.update({
      where: { id: log.id },
      data: {
        lessonPlanText: lessonPlanText ?? log.lessonPlanText,
        lessonPlanFiles: allFiles.length > 0 ? allFiles : log.lessonPlanFiles,
        ...(teachingDayValue !== null && {
          isTeachingDay: String(teachingDayValue) === "true",
        }),
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Lesson plan upload error:", error);
    return NextResponse.json(
      {
        error:
          error?.status === 400
            ? error.message
            : error?.message?.startsWith("Upload directory is not writable")
              ? "The server's upload folder is not writable. Please contact the administrator."
              : "Could not save the lesson plan document. Please try again.",
      },
      { status: error?.status === 400 ? 400 : 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await canWriteLessonPlan(user))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for attendance" }, { status: 403 });
    }

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
