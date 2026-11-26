import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
  activityNotificationLink,
  getLivelihoodProgramAccess,
  getLivelihoodProgramMemberUserIds,
} from "@/lib/livelihoodActivity";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId, activityId } = await params;
    const access = await getLivelihoodProgramAccess(user, programId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    const activity = await prisma.livelihoodProgramActivity.findFirst({
      where: { id: activityId, programId },
      select: { id: true, title: true, startDate: true, program: { select: { name: true } } },
    });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const body = await req.json();
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Comment must be 2000 characters or fewer" }, { status: 400 });
    }

    const comment = await prisma.livelihoodProgramActivityComment.create({
      data: { activityId, authorId: user.id, text },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: { select: { name: true, displayName: true } } } },
      },
    });

    const memberIds = await getLivelihoodProgramMemberUserIds(programId);
    await notifyUsers(memberIds, {
      type: NOTIFICATION_TYPES.LIVELIHOOD_ACTIVITY_COMMENT,
      title: "New comment on monthly activity",
      message: `${user.name || "A team member"} commented on "${activity.title}" in ${activity.program.name}.`,
      link: activityNotificationLink(programId, activityId, activity.startDate),
      actorId: user.id,
      metadata: { programId, activityId, commentId: comment.id },
    });

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error("Create livelihood activity comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
