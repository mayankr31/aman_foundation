import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { getISTDateKey } from "@/lib/time";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { normalizeCheckInType } from "@/lib/teamCheckIn";
import {
  getTeamCheckInOwner,
  getTeamCheckInReviewerIds,
  resolveTeamCheckInAccess,
} from "@/lib/teamCheckInAccess";
import {
  buildCheckInData,
  normalizePromises,
  parseCheckInDate,
} from "@/lib/teamCheckInServer";

export const dynamic = "force-dynamic";

function checkInInclude() {
  return {
    promises: { orderBy: { order: "asc" } },
    lastEditedBy: { select: { id: true, name: true } },
  };
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user.id;

    const owner = await getTeamCheckInOwner(targetUserId);
    if (!owner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const access = resolveTeamCheckInAccess(user, owner);
    if (!access.canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkIns = await prisma.teamCheckIn.findMany({
      where: { userId: targetUserId },
      include: checkInInclude(),
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: checkIns });
  } catch (err) {
    console.error("Fetch team check-ins error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const owner = await getTeamCheckInOwner(user.id);
    const access = resolveTeamCheckInAccess(user, owner);
    if (!access.canCreate) {
      return NextResponse.json(
        { error: "Forbidden: Team Check-In is not available for your role" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const date = parseCheckInDate(body.date);
    const textData = buildCheckInData(body, { allowManagerFields: false });
    const promises = normalizePromises(body.promises);

    const checkIn = await prisma.teamCheckIn.create({
      data: {
        userId: user.id,
        date,
        checkInType: normalizeCheckInType(body.checkInType),
        ...textData,
        ...(promises.length ? { promises: { create: promises } } : {}),
      },
      include: checkInInclude(),
    });

    const reviewers = await getTeamCheckInReviewerIds(user.id);
    await notifyUsers(reviewers, {
      type: NOTIFICATION_TYPES.TEAM_CHECK_IN_SUBMITTED,
      title: "Team Check-In Submitted",
      message: `${owner.name} submitted a Team Check-In for ${formatDate(getISTDateKey(date))}.`,
      link: `/hr/${user.id}?tab=team-checkin`,
      actorId: user.id,
      metadata: { checkInId: checkIn.id, userId: user.id },
    });

    return NextResponse.json({ success: true, data: checkIn }, { status: 201 });
  } catch (err) {
    console.error("Create team check-in error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
