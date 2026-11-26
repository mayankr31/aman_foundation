import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
  activityNotificationLink,
  getLivelihoodProgramAccess,
  getLivelihoodProgramMemberUserIds,
  isValidActivityStatus,
  parseActivityDate,
} from "@/lib/livelihoodActivity";

export const dynamic = "force-dynamic";

function activityInclude() {
  return {
    createdBy: { select: { id: true, name: true, avatar: true } },
    completedBy: { select: { id: true, name: true, avatar: true } },
    comments: {
      include: {
        author: { select: { id: true, name: true, avatar: true, role: { select: { name: true, displayName: true } } } },
      },
      orderBy: { createdAt: "asc" },
    },
  };
}

export async function PATCH(req, { params }) {
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

    const existing = await prisma.livelihoodProgramActivity.findFirst({
      where: { id: activityId, programId },
      include: { program: { select: { name: true, type: true, components: { select: { typeKey: true } } } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = {};
    let detailsChanged = false;
    let statusChanged = false;

    const isManager = access.isAdmin || access.isManager;

    if (body.title !== undefined) {
      if (!isManager) {
        return NextResponse.json({ error: "Only assigned program staff can edit activity details" }, { status: 403 });
      }
      const title = String(body.title || "").trim();
      if (!title) {
        return NextResponse.json({ error: "Activity title cannot be empty" }, { status: 400 });
      }
      data.title = title;
      detailsChanged = true;
    }

    if (body.description !== undefined) {
      if (!isManager) {
        return NextResponse.json({ error: "Only assigned program staff can edit activity details" }, { status: 403 });
      }
      data.description = body.description ? String(body.description).trim() : null;
      detailsChanged = true;
    }

    if (body.componentTypeKey !== undefined) {
      if (!isManager) {
        return NextResponse.json({ error: "Only assigned program staff can edit activity details" }, { status: 403 });
      }
      const componentTypeKey = body.componentTypeKey ? String(body.componentTypeKey).trim() : null;
      if (componentTypeKey) {
        const allowedKeys = new Set(
          existing.program.components.length > 0
            ? existing.program.components.map((component) => component.typeKey)
            : [existing.program.type]
        );
        if (!allowedKeys.has(componentTypeKey)) {
          return NextResponse.json({ error: "Selected activity type is not part of this program" }, { status: 400 });
        }
      }
      data.componentTypeKey = componentTypeKey || null;
      detailsChanged = true;
    }

    if (body.startDate !== undefined || body.endDate !== undefined) {
      if (!isManager) {
        return NextResponse.json({ error: "Only assigned program staff can edit activity details" }, { status: 403 });
      }
      const startDate = body.startDate !== undefined ? parseActivityDate(body.startDate) : existing.startDate;
      const endDate = body.endDate !== undefined ? parseActivityDate(body.endDate) : existing.endDate;
      if (!startDate) {
        return NextResponse.json({ error: "A valid start date is required" }, { status: 400 });
      }
      if (!endDate || endDate.getTime() < startDate.getTime()) {
        return NextResponse.json({ error: "End date cannot be before the start date" }, { status: 400 });
      }
      data.startDate = startDate;
      data.endDate = endDate;
      detailsChanged = true;
    }

    if (body.status !== undefined) {
      if (!isValidActivityStatus(body.status)) {
        return NextResponse.json({ error: "Invalid activity status" }, { status: 400 });
      }
      data.status = body.status;
      if (body.status === "Completed") {
        if (existing.status !== "Completed") {
          data.completedAt = new Date();
          data.completedById = user.id;
        }
      } else {
        data.completedAt = null;
        data.completedById = null;
      }
      statusChanged = body.status !== existing.status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes supplied" }, { status: 400 });
    }

    const activity = await prisma.livelihoodProgramActivity.update({
      where: { id: activityId },
      data,
      include: activityInclude(),
    });

    const link = activityNotificationLink(programId, activity.id, activity.startDate);

    if (detailsChanged) {
      const memberIds = await getLivelihoodProgramMemberUserIds(programId);
      await notifyUsers(memberIds, {
        type: NOTIFICATION_TYPES.LIVELIHOOD_ACTIVITY_UPDATED,
        title: "Monthly activity updated",
        message: `${user.name || "A manager"} updated "${activity.title}" in ${existing.program.name}.`,
        link,
        actorId: user.id,
        metadata: { programId, activityId: activity.id },
      });
    } else if (statusChanged && user.id !== existing.createdById) {
      await notifyUsers([existing.createdById], {
        type: NOTIFICATION_TYPES.LIVELIHOOD_ACTIVITY_UPDATED,
        title: "Activity status updated",
        message: `${user.name || "A team member"} marked "${activity.title}" as ${activity.status}.`,
        link,
        actorId: user.id,
        metadata: { programId, activityId: activity.id },
      });
    }

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error("Update livelihood activity error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId, activityId } = await params;
    const access = await getLivelihoodProgramAccess(user, programId);
    if (!access.allowed || !(access.isAdmin || access.isManager)) {
      return NextResponse.json({ error: "Forbidden: Only assigned program staff can delete activities" }, { status: 403 });
    }

    const existing = await prisma.livelihoodProgramActivity.findFirst({
      where: { id: activityId, programId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    await prisma.livelihoodProgramActivity.delete({ where: { id: activityId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete livelihood activity error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
