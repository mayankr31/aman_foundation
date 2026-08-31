import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getDefaultResponses, getDefaultMatrix } from "@/data/pmReflectionConstants";

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

    const reflections = await prisma.pMReflection.findMany({
      where: { fellowId },
      orderBy: { date: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: reflections });
  } catch (err) {
    console.error("Fetch PM reflections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Only managers can create PM reflections" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const body = await req.json();
    const { date, responses, matrix, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const reflection = await prisma.pMReflection.create({
      data: {
        fellowId,
        date: new Date(date),
        responses: responses || getDefaultResponses(),
        matrix: matrix || getDefaultMatrix(),
        notes: notes || null,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: reflection }, { status: 201 });
  } catch (err) {
    console.error("Create PM reflection error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
