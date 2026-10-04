import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getActiveRatingCategories } from "@/lib/performanceCategories";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function canManage(user) {
  return user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);
}

function slugify(label) {
  return (
    String(label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "category"
  );
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    if (!canManage(user)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const categories = await getActiveRatingCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (err) {
    console.error("Fetch rating categories error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    if (!canManage(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only managers can add rating categories" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const label = String(body.label || "").trim();
    if (!label) {
      return NextResponse.json({ error: "Category label is required" }, { status: 400 });
    }

    // Reactivate a previously deleted category with the same label if present.
    const existing = await prisma.performanceRatingCategory.findFirst({
      where: { label: { equals: label, mode: "insensitive" } },
    });
    if (existing) {
      if (existing.active) {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
      }
      const reactivated = await prisma.performanceRatingCategory.update({
        where: { id: existing.id },
        data: { active: true },
      });
      return NextResponse.json({ success: true, data: reactivated }, { status: 200 });
    }

    // Generate a unique key.
    const base = slugify(label);
    let key = base;
    let suffix = 2;
    while (await prisma.performanceRatingCategory.findUnique({ where: { key } })) {
      key = `${base}_${suffix++}`;
    }

    const maxOrder = await prisma.performanceRatingCategory.aggregate({ _max: { order: true } });
    const category = await prisma.performanceRatingCategory.create({
      data: { key, label, order: (maxOrder._max.order ?? -1) + 1 },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (err) {
    console.error("Create rating category error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
