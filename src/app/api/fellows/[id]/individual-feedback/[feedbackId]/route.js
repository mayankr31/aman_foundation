import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdminOrPm } from "@/lib/scope";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isAdminOrPm(user)) {
      return NextResponse.json({ error: "Forbidden: Only managers can edit feedback" }, { status: 403 });
    }

    const { id, feedbackId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const existing = await prisma.individualFeedback.findFirst({
      where: { id: feedbackId, fellowId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData = {};
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.classroomLevel !== undefined) updateData.classroomLevel = body.classroomLevel || null;
    if (body.classGroup !== undefined) updateData.classGroup = body.classGroup || null;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.subjectOther !== undefined || body.subject !== undefined) {
      const subject = body.subject !== undefined ? body.subject : existing.subject;
      updateData.subjectOther = subject === "Other" ? (body.subjectOther || null) : null;
    }
    if (body.lessonPlanLink !== undefined) updateData.lessonPlanLink = body.lessonPlanLink || null;
    if (body.lessonPlanFeedback !== undefined) updateData.lessonPlanFeedback = Boolean(body.lessonPlanFeedback);
    if (body.strengths !== undefined) updateData.strengths = body.strengths || null;
    if (body.areasOfDevelopment !== undefined) updateData.areasOfDevelopment = body.areasOfDevelopment || null;
    if (body.nextStepsFellow !== undefined) updateData.nextStepsFellow = body.nextStepsFellow || null;
    if (body.nextStepPM !== undefined) updateData.nextStepPM = body.nextStepPM || null;

    const updated = await prisma.individualFeedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update individual feedback error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isAdminOrPm(user)) {
      return NextResponse.json({ error: "Forbidden: Only managers can delete feedback" }, { status: 403 });
    }

    const { id, feedbackId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const existing = await prisma.individualFeedback.findFirst({
      where: { id: feedbackId, fellowId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    await prisma.individualFeedback.delete({ where: { id: feedbackId } });

    return NextResponse.json({ success: true, message: "Feedback deleted successfully" });
  } catch (err) {
    console.error("Delete individual feedback error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
