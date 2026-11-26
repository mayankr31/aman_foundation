import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { getISTDateKey, istDayStart } from "@/lib/time";
import {
  activityNotificationLink,
  getCurrentMonthKey,
  getLivelihoodProgramAccess,
  getLivelihoodProgramMemberUserIds,
  getMonthBounds,
  isOpenActivityStatus,
  isValidActivityStatus,
  isValidMonthKey,
  LIVELIHOOD_ACTIVITY_STATUSES,
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

function buildSummary(activities) {
  const todayStart = istDayStart(getISTDateKey());
  const summary = {
    total: activities.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    cancelled: 0,
    overdue: 0,
  };

  activities.forEach((activity) => {
    if (activity.status === "Completed") summary.completed += 1;
    else if (activity.status === "In Progress") summary.inProgress += 1;
    else if (activity.status === "Blocked") summary.blocked += 1;
    else if (activity.status === "Cancelled") summary.cancelled += 1;
    else summary.pending += 1;

    if (
      isOpenActivityStatus(activity.status) &&
      activity.endDate &&
      new Date(activity.endDate).getTime() < todayStart.getTime()
    ) {
      summary.overdue += 1;
    }
  });

  return summary;
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId } = await params;
    const access = await getLivelihoodProgramAccess(user, programId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || getCurrentMonthKey();
    const status = searchParams.get("status") || "";
    const componentTypeKey = searchParams.get("component") || "";

    if (!isValidMonthKey(month)) {
      return NextResponse.json({ error: "month must use YYYY-MM format" }, { status: 400 });
    }
    if (status && !isValidActivityStatus(status)) {
      return NextResponse.json({ error: "Invalid activity status" }, { status: 400 });
    }

    const bounds = getMonthBounds(month);
    const where = {
      programId,
      startDate: { lte: bounds.end },
      endDate: { gte: bounds.start },
    };
    if (componentTypeKey) where.componentTypeKey = componentTypeKey;

    const activities = await prisma.livelihoodProgramActivity.findMany({
      where,
      include: activityInclude(),
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    });

    const summary = buildSummary(activities);
    const filtered = status ? activities.filter((activity) => activity.status === status) : activities;

    return NextResponse.json({
      success: true,
      data: filtered,
      meta: {
        month,
        summary,
        statuses: LIVELIHOOD_ACTIVITY_STATUSES,
      },
    });
  } catch (error) {
    console.error("Fetch livelihood activities error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId } = await params;
    const access = await getLivelihoodProgramAccess(user, programId);
    if (!access.allowed || !(access.isAdmin || access.isManager)) {
      return NextResponse.json({ error: "Forbidden: Only assigned program staff can plan activities" }, { status: 403 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Activity title is required" }, { status: 400 });
    }

    const startDate = parseActivityDate(body.startDate);
    if (!startDate) {
      return NextResponse.json({ error: "A valid start date is required" }, { status: 400 });
    }

    const endDate = parseActivityDate(body.endDate) || startDate;
    if (endDate.getTime() < startDate.getTime()) {
      return NextResponse.json({ error: "End date cannot be before the start date" }, { status: 400 });
    }

    const status = body.status && isValidActivityStatus(body.status) ? body.status : "Pending";

    const program = await prisma.livelihoodProgram.findUnique({
      where: { id: programId },
      include: { components: { select: { typeKey: true } } },
    });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    let componentTypeKey = body.componentTypeKey ? String(body.componentTypeKey).trim() : null;
    if (componentTypeKey) {
      const allowedKeys = new Set(
        program.components.length > 0 ? program.components.map((component) => component.typeKey) : [program.type]
      );
      if (!allowedKeys.has(componentTypeKey)) {
        return NextResponse.json({ error: "Selected activity type is not part of this program" }, { status: 400 });
      }
    } else {
      componentTypeKey = null;
    }

    const activity = await prisma.livelihoodProgramActivity.create({
      data: {
        programId,
        componentTypeKey,
        title,
        description: body.description ? String(body.description).trim() : null,
        startDate,
        endDate,
        status,
        createdById: user.id,
        completedAt: status === "Completed" ? new Date() : null,
        completedById: status === "Completed" ? user.id : null,
      },
      include: activityInclude(),
    });

    const memberIds = await getLivelihoodProgramMemberUserIds(programId);
    await notifyUsers(memberIds, {
      type: NOTIFICATION_TYPES.LIVELIHOOD_ACTIVITY_CREATED,
      title: "New monthly activity planned",
      message: `${user.name || "A manager"} added "${title}" to ${program.name}.`,
      link: activityNotificationLink(programId, activity.id, startDate),
      actorId: user.id,
      metadata: { programId, activityId: activity.id },
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error) {
    console.error("Create livelihood activity error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
