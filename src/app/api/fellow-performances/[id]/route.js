import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isFellowManaged } from "@/lib/scope";
import { computeOverallScore } from "@/data/fellowPerformanceConstants";
import { getActiveRatingCategories, isValidRating } from "@/lib/performanceCategories";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const LEGACY_RATING_KEYS = ["lessonPlan", "culture", "lessonFlow", "content", "communityEngagement"];

async function findPerformance(id) {
  return prisma.fellowPerformance.findUnique({ where: { id } });
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    const { id } = await context.params;
    const performance = await prisma.fellowPerformance.findUnique({
      where: { id },
      include: {
        fellow: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });

    if (!performance) {
      return NextResponse.json({ error: "Fellow performance record not found" }, { status: 404 });
    }

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isFellowManaged(user.id, performance.fellowId))) {
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

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
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

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isFellowManaged(user.id, existing.fellowId))) {
      return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
    }

    const body = await req.json();
    const updateData = {};

    if (body.fellowId) {
      if (PROGRAM_ROLES.includes(user.role.name) && !(await isFellowManaged(user.id, body.fellowId))) {
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

    const categories = await getActiveRatingCategories();
    const inputRatings = body.ratings && typeof body.ratings === "object" ? body.ratings : body;

    const existingStored =
      existing.ratings && typeof existing.ratings === "object" && Object.keys(existing.ratings).length
        ? existing.ratings
        : Object.fromEntries(
            LEGACY_RATING_KEYS.filter((key) => existing[key] !== null && existing[key] !== undefined).map(
              (key) => [key, existing[key]]
            )
          );

    const merged = { ...existingStored };
    let hasRatings = false;
    for (const category of categories) {
      if (inputRatings[category.key] !== undefined && inputRatings[category.key] !== "") {
        const value = Number(inputRatings[category.key]);
        if (!isValidRating(value)) {
          return NextResponse.json({ error: `Invalid rating for ${category.label}` }, { status: 400 });
        }
        merged[category.key] = value;
        hasRatings = true;
      }
    }

    if (hasRatings) {
      updateData.ratings = merged;
      updateData.overallScore = computeOverallScore(merged, categories);
      for (const key of LEGACY_RATING_KEYS) {
        if (merged[key] !== undefined) updateData[key] = merged[key];
      }
    }

    const updated = await prisma.fellowPerformance.update({
      where: { id },
      data: updateData,
      include: {
        fellow: { select: { id: true, name: true } },
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

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
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

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isFellowManaged(user.id, existing.fellowId))) {
      return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
    }

    await prisma.fellowPerformance.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Fellow performance record deleted successfully" });
  } catch (err) {
    console.error("Delete fellow performance error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
