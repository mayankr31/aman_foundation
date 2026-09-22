import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isFellowManaged } from "@/lib/scope";
import { computeOverallScore } from "@/data/fellowPerformanceConstants";

const RATING_KEYS = ["lessonPlan", "culture", "lessonFlow", "content", "communityEngagement"];

async function findPerformance(id) {
  return prisma.fellowPerformance.findUnique({ where: { id } });
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const performance = await prisma.fellowPerformance.findUnique({
      where: { id },
      include: {
        fellow: { select: { id: true, name: true, cohort: true } },
        author: { select: { id: true, name: true } },
      },
    });

    if (!performance) {
      return NextResponse.json({ error: "Fellow performance record not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, performance.fellowId))) {
      return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: performance });
  } catch (err) {
    console.error("Fetch fellow performance error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only managers can edit fellow performance records" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const existing = await findPerformance(id);
    if (!existing) {
      return NextResponse.json({ error: "Fellow performance record not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, existing.fellowId))) {
      return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
    }

    const body = await req.json();
    const updateData = {};

    if (body.fellowId) {
      if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, body.fellowId))) {
        return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
      }
      updateData.fellowId = body.fellowId;
    }
    if (body.date) updateData.date = new Date(body.date);
    if (body.classGroup !== undefined) updateData.classGroup = body.classGroup || null;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.strength !== undefined) updateData.strength = body.strength || null;
    if (body.aod !== undefined) updateData.aod = body.aod || null;
    if (body.trend !== undefined) updateData.trend = body.trend || null;

    const ratings = {};
    let hasRatings = false;
    for (const key of RATING_KEYS) {
      if (body[key] !== undefined) {
        const value = Number(body[key]);
        if (Number.isNaN(value) || value < 1 || value > 4) {
          return NextResponse.json({ error: `Invalid rating for ${key}` }, { status: 400 });
        }
        ratings[key] = value;
        hasRatings = true;
      }
    }

    if (hasRatings) {
      const merged = {};
      for (const key of RATING_KEYS) {
        merged[key] = ratings[key] !== undefined ? ratings[key] : existing[key];
      }
      updateData.overallScore = computeOverallScore(merged);
      Object.assign(updateData, ratings);
    }

    const updated = await prisma.fellowPerformance.update({
      where: { id },
      data: updateData,
      include: {
        fellow: { select: { id: true, name: true, cohort: true } },
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update fellow performance error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only managers can delete fellow performance records" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const existing = await findPerformance(id);
    if (!existing) {
      return NextResponse.json({ error: "Fellow performance record not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, existing.fellowId))) {
      return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
    }

    await prisma.fellowPerformance.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Fellow performance record deleted successfully" });
  } catch (err) {
    console.error("Delete fellow performance error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
