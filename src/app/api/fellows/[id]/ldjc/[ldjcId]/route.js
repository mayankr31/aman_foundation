import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import {
  notifyUsers,
  getReviewerUserIdsForFellow,
  getFellowUserId,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id, ldjcId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const ldjcRecord = await prisma.goalSheet.findFirst({
      where: { id: ldjcId, fellowId },
    });

    if (!ldjcRecord) {
      return NextResponse.json({ error: "LDJC not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ldjcRecord });
  } catch (err) {
    console.error("Fetch LDJC error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id, ldjcId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const ldjcRecord = await prisma.goalSheet.findFirst({
      where: { id: ldjcId, fellowId },
    });

    if (!ldjcRecord) {
      return NextResponse.json({ error: "LDJC not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, responses, status, portfolioLink } = body;

    // Manager review action — admin/program_manager writes Q6, Q7, Q12, Q13
    if (action === "review") {
      if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
        return NextResponse.json(
          { error: "Forbidden: Only managers can write reviews" },
          { status: 403 }
        );
      }

      const updated = await prisma.goalSheet.update({
        where: { id: ldjcId },
        data: {
          responses: responses || ldjcRecord.responses,
          status: "REVIEWED",
        },
      });

      // Notify the fellow that their LDJC has been reviewed.
      const fellowUserId = await getFellowUserId(fellowId);
      await notifyUsers([fellowUserId], {
        type: NOTIFICATION_TYPES.LDJC_REVIEWED,
        title: "LDJC Reviewed",
        message: `${user.name || "Your manager"} has reviewed your LDJC.`,
        link: `/profile?tab=ldjc`,
        actorId: user.id,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Fellow edits their own responses
    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId } });
    if (user.role.name !== "ADMIN" && user.id !== fellow?.userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify this LDJC" },
        { status: 403 }
      );
    }

    const updateData = {};
    if (responses !== undefined) updateData.responses = responses;
    if (status !== undefined) updateData.status = status;
    if (portfolioLink !== undefined) updateData.portfolioLink = portfolioLink;

    const updated = await prisma.goalSheet.update({
      where: { id: ldjcId },
      data: updateData,
    });

    // Notify reviewers when the fellow edits their own LDJC.
    if (user.id === fellow?.userId) {
      const reviewers = await getReviewerUserIdsForFellow(fellowId);
      await notifyUsers(reviewers, {
        type: NOTIFICATION_TYPES.LDJC_SUBMITTED,
        title: "LDJC Updated",
        message: `${fellow?.name || "A fellow"} has updated their LDJC. It's time for review.`,
        link: `/education/fellows/${fellowId}?tab=ldjc`,
        actorId: user.id,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update LDJC error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (user.role?.name !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can delete records" },
        { status: 403 }
      );
    }


    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id, ldjcId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId } });

    if (user.role.name !== "ADMIN" && user.id !== fellow?.userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete LDJC entries for this fellow" },
        { status: 403 }
      );
    }

    await prisma.goalSheet.delete({
      where: { id: ldjcId },
    });

    return NextResponse.json({ success: true, message: "LDJC deleted successfully" });
  } catch (err) {
    console.error("Delete LDJC error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
