import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getHierarchyScopedUserIds } from "@/lib/hierarchy";
import { canAssignTo } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "tasks", "READ"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let candidates = [];

    if (user.role.name === "ADMIN") {
      candidates = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });
    } else {
      const scopedIds = (await getHierarchyScopedUserIds(user, { includeSelf: true })) || [];
      if (!scopedIds.length) {
        candidates = await prisma.user.findMany({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: { select: { name: true } },
          },
        });
      } else {
        const rows = await prisma.user.findMany({
          where: { id: { in: scopedIds }, status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });
        const checks = await Promise.all(rows.map((row) => canAssignTo(user, row.id)));
        candidates = rows.filter((_, index) => checks[index]);
      }
    }

    return NextResponse.json({ success: true, data: candidates });
  } catch (error) {
    console.error("Fetch assignable users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
