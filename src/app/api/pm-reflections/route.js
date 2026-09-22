import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedFellowIds } from "@/lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    let fellowWhere = {};
    if (user.role.name === "PROGRAM_MANAGER") {
      const fellowIds = await getManagedFellowIds(user.id);
      fellowWhere = { id: { in: fellowIds } };
    }

    const fellows = await prisma.fellow.findMany({
      where: fellowWhere,
      select: { id: true, name: true, cohort: true },
      orderBy: { name: "asc" },
    });

    const fellowIds = fellows.map((f) => f.id);

    let reflections = [];
    if (fellowIds.length) {
      reflections = await prisma.pMReflection.findMany({
        where: { fellowId: { in: fellowIds } },
        orderBy: { date: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });
    }

    const latestByFellow = new Map();
    for (const reflection of reflections) {
      if (!latestByFellow.has(reflection.fellowId)) {
        latestByFellow.set(reflection.fellowId, reflection);
      }
    }

    const data = fellows.map((fellow) => ({
      ...fellow,
      latestReflection: latestByFellow.get(fellow.id) || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Fetch latest PM reflections error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
