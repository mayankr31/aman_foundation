import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getDefaultResponses } from "@/data/goalSheetConstants";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where: { fellowId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: goalSheets });
  } catch (err) {
    console.error("Fetch goal sheets error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId } });

    if (user.role.name !== "ADMIN" && user.id !== fellow?.userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot create goal sheets for this fellow" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { date, responses, status, portfolioLink } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const goalSheet = await prisma.goalSheet.create({
      data: {
        fellowId,
        date: new Date(date),
        status: status || "SUBMITTED",
        portfolioLink: portfolioLink || null,
        responses: responses || getDefaultResponses(),
      },
    });

    return NextResponse.json({ success: true, data: goalSheet }, { status: 201 });
  } catch (err) {
    console.error("Create goal sheet error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
