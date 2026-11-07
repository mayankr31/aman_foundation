import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import {
  HOLIDAY_TYPES,
  HOLIDAY_TYPE_LABELS,
  getHolidaysForYear,
  isValidDateKey,
  normalizeHolidayType,
} from "@/lib/holidays";

export const dynamic = "force-dynamic";

const HOLIDAY_MANAGER_ROLES = ["ADMIN", "HR", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"];

function canManageHolidays(user) {
  return HOLIDAY_MANAGER_ROLES.includes(user?.role?.name);
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const holidays = await getHolidaysForYear(year);

    return NextResponse.json({
      success: true,
      data: holidays,
      meta: { types: HOLIDAY_TYPES, labels: HOLIDAY_TYPE_LABELS },
    });
  } catch (error) {
    console.error("Fetch holidays error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!canManageHolidays(user)) {
      return NextResponse.json({ error: "Forbidden: Only Admin/HR can manage holidays" }, { status: 403 });
    }

    const body = await req.json();
    const dateKey = String(body.dateKey || "").trim();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim() || null;
    const type = normalizeHolidayType(body.type);

    if (!isValidDateKey(dateKey)) {
      return NextResponse.json({ error: "Select a valid holiday date." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Holiday name is required." }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: { dateKey, name, description, type },
    });

    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A holiday already exists on that date." },
        { status: 409 }
      );
    }
    console.error("Create holiday error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
