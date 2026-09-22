import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { currentSession, getFellowStudentData, SOURCES } from "@/lib/fellowStudentData";

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

    if (user.role.name === "FELLOW") {
      const fellow = await prisma.fellow.findUnique({ where: { id: fellowId }, select: { userId: true } });
      if (!fellow || fellow.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden: You can only view your own student data" }, { status: 403 });
      }
    }

    const url = new URL(req.url);
    const session = url.searchParams.get("session") || currentSession();
    const sourceParam = url.searchParams.get("source") || "school";
    const source = SOURCES.includes(sourceParam) ? sourceParam : "school";

    const data = await getFellowStudentData(fellowId, session, source);
    if (!data) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch fellow student data error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
