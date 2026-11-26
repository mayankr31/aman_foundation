import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { isProgramStaffRole } from "@/lib/roles";


export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    // `all=true` lets education users (e.g. a fellow linking a student's
    // parents) see every available livelihood program in the add form,
    // instead of only the programs they are assigned to.
    const all = searchParams.get("all") === "true";

    const canReadLivelihood = await checkPermission(user, "dashboard", "livelihood", "READ");
    const canReadEducation = all && (await checkPermission(user, "dashboard", "education", "READ"));

    if (!canReadLivelihood && !canReadEducation) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const where = {};
    if (category && category !== "all") where.category = category;
    if (type) {
      where.OR = [
        { type },
        { components: { some: { typeKey: type } } },
      ];
    }
    if (status) where.status = status;
    if (!all) {
      if (isProgramStaffRole(user?.role?.name)) {
        where.programManagers = { some: { userId: user.id } };
      } else if (user.role.name === "FELLOW") {
        where.fellows = { some: { fellow: { userId: user.id } } };
      }
    }

    const programs = await prisma.livelihoodProgram.findMany({
      where,
      include: {
        components: { orderBy: { order: "asc" } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also return old-style programs for backward compatibility
    const showLegacy = !all && !isProgramStaffRole(user?.role?.name) && user.role.name !== "FELLOW";
    const goatRearingPrograms = showLegacy
      ? await prisma.goatRearingProgram.findMany({ orderBy: { name: "asc" } })
      : [];
    const sugarcanePrograms = showLegacy
      ? await prisma.sugarcaneProgram.findMany({ orderBy: { name: "asc" } })
      : [];

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

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }


    const body = await req.json();
    const { name, description, totalTarget } = body;
    const type = String(body.type || "").trim();

    // A program can bundle several livelihood types ("components").
    // `type` is still accepted for backward compatibility and creates one component.
    const rawComponents = Array.isArray(body.components)
      ? body.components
      : type
        ? [{ typeKey: type, target: totalTarget }]
        : [];

    const requested = [];
    for (const raw of rawComponents) {
      const typeKey = String(
        typeof raw === "string" ? raw : raw?.typeKey || ""
      ).trim();
      if (!typeKey || requested.some((c) => c.typeKey === typeKey)) continue;
      const target =
        typeof raw === "object" && raw?.target !== undefined && raw?.target !== null && raw?.target !== ""
          ? parseFloat(raw.target)
          : null;
      requested.push({ typeKey, target: Number.isFinite(target) ? target : null });
    }

    if (!name || requested.length === 0) {
      return NextResponse.json(
        { error: "Name and at least one program type are required" },
        { status: 400 }
      );
    }

    const types = await prisma.livelihoodType.findMany({
      where: { key: { in: requested.map((c) => c.typeKey) }, active: true },
      select: { key: true, category: true },
    });

    if (types.length !== requested.length) {
      return NextResponse.json(
        { error: "One or more selected program types are invalid or inactive" },
        { status: 400 }
      );
    }

    // Category is derived from the selected components.
    const categories = new Set(types.map((t) => t.category));
    const category = categories.size > 1 ? "MIXED" : [...categories][0];

    const program = await prisma.livelihoodProgram.create({
      data: {
        category,
        type: requested[0].typeKey,
        name,
        description: description || null,
        totalTarget: totalTarget ? parseFloat(totalTarget) : null,
        components: {
          create: requested.map((component, index) => ({
            typeKey: component.typeKey,
            target: component.target,
            order: index,
          })),
        },
      },
      include: { components: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    console.error("Create livelihood program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
