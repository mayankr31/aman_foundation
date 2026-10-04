import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  getAllLivelihoodTypes,
  getActiveLivelihoodTypes,
  slugifyTypeKey,
} from "@/lib/livelihoodTypesDb";
import { normalizeTypeConfig } from "@/lib/livelihoodTypeValidation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function canManage(user) {
  return user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "1";

    let types;
    if (includeInactive) {
      types = await getAllLivelihoodTypes();
      if (category && category !== "all") {
        types = types.filter((t) => t.category === category);
      }
    } else {
      types = await getActiveLivelihoodTypes(category && category !== "all" ? category : undefined);
    }

    return NextResponse.json({ success: true, data: types });
  } catch (err) {
    console.error("Fetch livelihood types error:", err);
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

    if (!canManage(user)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const label = String(body.label || "").trim();
    const category = String(body.category || "").trim();

    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    if (!["FARM", "NON_FARM"].includes(category)) {
      return NextResponse.json({ error: "Category must be FARM or NON_FARM" }, { status: 400 });
    }

    const config = normalizeTypeConfig(body);
    if (config.error) {
      return NextResponse.json({ error: config.error }, { status: 400 });
    }

    // Reactivate a previously deactivated type with the same label if present.
    const existing = await prisma.livelihoodType.findFirst({
      where: { label: { equals: label, mode: "insensitive" }, category },
    });
    if (existing) {
      if (existing.active) {
        return NextResponse.json(
          { error: "A type with this name already exists in this category" },
          { status: 409 }
        );
      }
      const reactivated = await prisma.livelihoodType.update({
        where: { id: existing.id },
        data: {
          active: true,
          icon: body.icon || existing.icon,
          description: body.description ?? existing.description,
          programTargetUnit: body.programTargetUnit ?? existing.programTargetUnit,
          ...config,
        },
      });
      return NextResponse.json({ success: true, data: reactivated }, { status: 200 });
    }

    // Generate a unique key.
    const base = slugifyTypeKey(label);
    let key = base;
    let suffix = 2;
    while (await prisma.livelihoodType.findUnique({ where: { key } })) {
      key = `${base}_${suffix++}`;
    }

    const maxOrder = await prisma.livelihoodType.aggregate({
      where: { category },
      _max: { order: true },
    });

    const type = await prisma.livelihoodType.create({
      data: {
        key,
        category,
        label,
        icon: body.icon || "category",
        description: body.description || null,
        programTargetUnit: body.programTargetUnit || null,
        fields: config.fields,
        eventTypes: config.eventTypes,
        tableColumns: config.tableColumns,
        kpiCards: config.kpiCards,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (err) {
    console.error("Create livelihood type error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
