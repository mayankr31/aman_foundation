import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { HOLIDAY_TYPES, isValidDateKey, normalizeHolidayType } from "@/lib/holidays";

export const dynamic = "force-dynamic";

const HOLIDAY_MANAGER_ROLES = ["ADMIN", "HR", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"];

function canManageHolidays(user) {
  return HOLIDAY_MANAGER_ROLES.includes(user?.role?.name);
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!canManageHolidays(user)) {
      return NextResponse.json({ error: "Forbidden: Only Admin/HR can manage holidays" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = {};

    if (body.dateKey !== undefined) {
      const dateKey = String(body.dateKey || "").trim();
      if (!isValidDateKey(dateKey)) {
        return NextResponse.json({ error: "Select a valid holiday date." }, { status: 400 });
      }
      data.dateKey = dateKey;
    }
    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Holiday name is required." }, { status: 400 });
      }
      data.name = name;
    }
    if (body.description !== undefined) {
      data.description = String(body.description || "").trim() || null;
    }
    if (body.type !== undefined) {
      if (!HOLIDAY_TYPES.includes(String(body.type).toUpperCase())) {
        return NextResponse.json({ error: "Select a valid holiday type." }, { status: 400 });
      }
      data.type = normalizeHolidayType(body.type);
    }
    if (body.active !== undefined) data.active = Boolean(body.active);

    const holiday = await prisma.holiday.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: holiday });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A holiday already exists on that date." },
        { status: 409 }
      );
    }
    console.error("Update holiday error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!canManageHolidays(user)) {
      return NextResponse.json({ error: "Forbidden: Only Admin/HR can manage holidays" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
