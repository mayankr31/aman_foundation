import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedFellowIds, isFellowManaged } from "@/lib/scope";
import { computeOverallScore } from "@/data/fellowPerformanceConstants";

const RATING_KEYS = ["lessonPlan", "culture", "lessonFlow", "content", "communityEngagement"];

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
        fellow: { select: { id: true, name: true, cohort: true } },
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: performances });
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

    const ratings = {};
    for (const key of RATING_KEYS) {
      const value = Number(body[key]);
      if (Number.isNaN(value) || value < 1 || value > 4) {
        return NextResponse.json({ error: `Invalid rating for ${key}` }, { status: 400 });
      }
      ratings[key] = value;
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
        ...ratings,
        overallScore: computeOverallScore(ratings),
        strength: strength || null,
        aod: aod || null,
        trend: trend || null,
        authorId: user.id,
      },
      include: {
        fellow: { select: { id: true, name: true, cohort: true } },
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: performance }, { status: 201 });
  } catch (err) {
    console.error("Create fellow performance error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
