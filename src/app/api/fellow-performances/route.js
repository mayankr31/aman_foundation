import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedFellowIds, isFellowManaged } from "@/lib/scope";
import { computeOverallScore } from "@/data/fellowPerformanceConstants";
import { getActiveRatingCategories, isValidRating } from "@/lib/performanceCategories";

const LEGACY_RATING_KEYS = ["lessonPlan", "culture", "lessonFlow", "content", "communityEngagement"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    let where = {};
    if (user.role.name === "PROGRAM_MANAGER") {
      const fellowIds = await getManagedFellowIds(user.id);
      where = { fellowId: { in: fellowIds } };
    }

    const performances = await prisma.fellowPerformance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        fellow: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });

    const categories = await getActiveRatingCategories();

    return NextResponse.json({ success: true, data: performances, categories });
  } catch (err) {
    console.error("Fetch fellow performances error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only managers can create fellow performance records" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      fellowId,
      date,
      classGroup,
      subject,
      strength,
      aod,
      trend,
    } = body;

    if (!fellowId || !date || !subject) {
      return NextResponse.json(
        { error: "fellowId, date and subject are required" },
        { status: 400 }
      );
    }

    const categories = await getActiveRatingCategories();
    const inputRatings = body.ratings && typeof body.ratings === "object" ? body.ratings : body;

    const ratings = {};
    for (const category of categories) {
      const value = Number(inputRatings[category.key]);
      if (!isValidRating(value)) {
        return NextResponse.json({ error: `Invalid rating for ${category.label}` }, { status: 400 });
      }
      ratings[category.key] = value;
    }

    const legacyRatings = {};
    for (const key of LEGACY_RATING_KEYS) {
      legacyRatings[key] = ratings[key] ?? null;
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, fellowId))) {
      return NextResponse.json({ error: "Forbidden: Fellow not in your scope" }, { status: 403 });
    }

    const performance = await prisma.fellowPerformance.create({
      data: {
        fellowId,
        date: new Date(date),
        classGroup: classGroup || null,
        subject,
        ...legacyRatings,
        ratings,
        overallScore: computeOverallScore(ratings, categories),
        strength: strength || null,
        aod: aod || null,
        trend: trend || null,
        authorId: user.id,
      },
      include: {
        fellow: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: performance }, { status: 201 });
  } catch (err) {
    console.error("Create fellow performance error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
