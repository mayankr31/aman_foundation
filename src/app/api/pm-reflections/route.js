import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedFellowIds } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "fellow-observations", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for fellow-observations" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    let fellowWhere = {};
    if (PROGRAM_ROLES.includes(user.role.name)) {
      const fellowIds = await getManagedFellowIds(user.id);
      fellowWhere = { id: { in: fellowIds } };
    }

    const fellows = await prisma.fellow.findMany({
      where: fellowWhere,
      select: { id: true, name: true },
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
