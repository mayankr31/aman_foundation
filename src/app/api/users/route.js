import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedTeamUserIds } from "@/lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const isAdmin = user.role.name === "ADMIN";
    const isHr = user.role.name === "HR";
    const isPm = user.role.name === "PROGRAM_MANAGER";

    if (!isAdmin && !isHr && !isPm) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    // Program Managers only see their team (fellows of assigned schools/centres).
    let scopeWhere;
    if (isPm) {
      const team = await getManagedTeamUserIds(user.id);
      scopeWhere = { id: { in: team } };
    }

    const where = {
      ...(scopeWhere || {}),
      ...(roleFilter ? { role: { name: roleFilter } } : {}),
    };

    const users = await prisma.user.findMany({
      where: Object.keys(where).length ? where : undefined,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        mobile: true,
        status: true,
        department: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
