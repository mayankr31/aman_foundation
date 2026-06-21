import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId }
    });

    if (user.role.name !== "ADMIN" && user.id !== fellow?.userId) {
      return NextResponse.json({ error: "Forbidden: You cannot modify goals for this fellow" }, { status: 403 });
    }

    const body = await req.json();
    const { title, targetDate, milestones } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newGoal = await prisma.fellowGoal.create({
      data: {
        fellowId,
        title,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: "In Progress",
        milestones: {
          create: (milestones || []).map(text => ({ text, done: false }))
        }
      },
      include: {
        milestones: true
      }
    });

    return NextResponse.json({ success: true, data: newGoal }, { status: 201 });
  } catch (err) {
    console.error("Create goal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId }
    });

    if (user.role.name !== "ADMIN" && user.id !== fellow?.userId) {
      return NextResponse.json({ error: "Forbidden: You cannot modify goals for this fellow" }, { status: 403 });
    }

    const body = await req.json();
    const { type, goalId, milestoneId, done, status, review } = body;

    if (type === "TOGGLE_MILESTONE") {
      if (!milestoneId) {
        return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 });
      }
      const updatedMilestone = await prisma.fellowGoalMilestone.update({
        where: { id: milestoneId },
        data: { done: !!done }
      });
      return NextResponse.json({ success: true, data: updatedMilestone });
    }

    if (type === "UPDATE_STATUS") {
      if (!goalId || !status) {
        return NextResponse.json({ error: "Goal ID and Status are required" }, { status: 400 });
      }
      const updatedGoal = await prisma.fellowGoal.update({
        where: { id: goalId },
        data: { status }
      });
      return NextResponse.json({ success: true, data: updatedGoal });
    }

    if (type === "UPDATE_REVIEW") {
      if (!goalId) {
        return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
      }
      if (user.role.name !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Only admins can write reviews" }, { status: 403 });
      }
      const updatedGoal = await prisma.fellowGoal.update({
        where: { id: goalId },
        data: { review: review || "" }
      });
      return NextResponse.json({ success: true, data: updatedGoal });
    }

    return NextResponse.json({ error: "Invalid PATCH action type" }, { status: 400 });
  } catch (err) {
    console.error("Update goal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId }
    });

    if (user.role.name !== "ADMIN" && user.id !== fellow?.userId) {
      return NextResponse.json({ error: "Forbidden: You cannot modify goals for this fellow" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    if (!goalId) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    await prisma.fellowGoal.delete({
      where: { id: goalId }
    });

    return NextResponse.json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    console.error("Delete goal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
