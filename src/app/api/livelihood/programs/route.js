import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where = {};
    if (category && category !== "all") where.category = category;
    if (type) where.type = type;
    if (status) where.status = status;

    const programs = await prisma.livelihoodProgram.findMany({
      where,
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also return old-style programs for backward compatibility
    const goatRearingPrograms = await prisma.goatRearingProgram.findMany({
      orderBy: { name: "asc" },
    });
    const sugarcanePrograms = await prisma.sugarcaneProgram.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        programs,
        goatRearingPrograms,
        sugarcanePrograms,
      },
    });
  } catch (error) {
    console.error("Fetch livelihood programs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER" &&
      user.role.name !== "FELLOW"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category, type, name, description, totalTarget } = body;

    if (!name || !category || !type) {
      return NextResponse.json(
        { error: "Name, category, and type are required" },
        { status: 400 }
      );
    }

    if (!["FARM", "NON_FARM"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be FARM or NON_FARM" },
        { status: 400 }
      );
    }

    const program = await prisma.livelihoodProgram.create({
      data: {
        category,
        type,
        name,
        description: description || null,
        totalTarget: totalTarget ? parseFloat(totalTarget) : null,
      },
    });

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    console.error("Create livelihood program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
