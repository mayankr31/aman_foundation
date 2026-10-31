import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { getISTDateKey } from "@/lib/time";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import {
  getTeamCheckInOwner,
  getTeamCheckInReviewerIds,
  resolveTeamCheckInAccess,
} from "@/lib/teamCheckInAccess";
import {
  buildCheckInData,
  normalizePromises,
  promiseSignature,
} from "@/lib/teamCheckInServer";

export const dynamic = "force-dynamic";

function checkInInclude() {
  return {
    promises: { orderBy: { order: "asc" } },
    lastEditedBy: { select: { id: true, name: true } },
  };
}

async function loadCheckIn(id) {
  return prisma.teamCheckIn.findUnique({
    where: { id },
    include: checkInInclude(),
  });
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const checkIn = await loadCheckIn(id);
    if (!checkIn) {
      return NextResponse.json({ error: "Team Check-In not found" }, { status: 404 });
    }

    const owner = await getTeamCheckInOwner(checkIn.userId);
    const access = resolveTeamCheckInAccess(user, owner);
    if (!access.canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: checkIn });
  } catch (err) {
    console.error("Fetch team check-in error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const existing = await loadCheckIn(id);
    if (!existing) {
      return NextResponse.json({ error: "Team Check-In not found" }, { status: 404 });
    }

    const owner = await getTeamCheckInOwner(existing.userId);
    const access = resolveTeamCheckInAccess(user, owner);
    if (!access.canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updateData = buildCheckInData(body, {
      allowManagerFields: access.canEditManagerFields,
    });
    updateData.lastEditedById = user.id;

    const nextPromises = Array.isArray(body.promises)
      ? normalizePromises(body.promises)
      : null;
    const previousSignature = promiseSignature(existing.promises);
    const promisesChanged = nextPromises
      ? promiseSignature(nextPromises) !== previousSignature
      : false;

    if (nextPromises) {
      updateData.promises = nextPromises.length
        ? { deleteMany: {}, create: nextPromises }
        : { deleteMany: {} };
    }

    const updated = await prisma.teamCheckIn.update({
      where: { id },
      data: updateData,
      include: checkInInclude(),
    });

    const dateLabel = formatDate(getISTDateKey(existing.date));
    const textFieldsChanged = Object.entries(updateData).some(([key, value]) => {
      if (key === "lastEditedById" || key === "promises") return false;
      return (existing[key] ?? null) !== (value ?? null);
    });

    if (access.isOwner && promisesChanged) {
      const reviewers = await getTeamCheckInReviewerIds(existing.userId);
      await notifyUsers(reviewers, {
        type: NOTIFICATION_TYPES.TEAM_CHECK_IN_PROMISE_UPDATED,
        title: "Promise Tracker Updated",
        message: `${owner?.name || "A team member"} updated the promise tracker in their Team Check-In for ${dateLabel}.`,
        link: `/hr/${existing.userId}?tab=team-checkin`,
        actorId: user.id,
        metadata: { checkInId: id, userId: existing.userId },
      });
    } else if (
      !access.isOwner &&
      access.canEditManagerFields &&
      (textFieldsChanged || promisesChanged)
    ) {
      await notifyUsers([existing.userId], {
        type: NOTIFICATION_TYPES.TEAM_CHECK_IN_UPDATED,
        title: "Team Check-In Updated",
        message: `${user.name} updated your Team Check-In for ${dateLabel}.`,
        link: "/profile?tab=team-checkin",
        actorId: user.id,
        metadata: { checkInId: id, userId: existing.userId },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update team check-in error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
