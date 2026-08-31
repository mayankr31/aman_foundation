import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

function canManageTemplates(user) {
  return user.role.name === "ADMIN" || user.role.name === "PROGRAM_MANAGER";
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const categories = await prisma.FLNCategory.findMany({
      include: {
        questions: { orderBy: { order: "asc" } }
      },
      orderBy: { order: "asc" }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Fetch FLN categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageTemplates(user)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { name, order } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const category = await prisma.FLNCategory.create({
      data: { name, order: order ?? 0 }
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("Create FLN category error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
