import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getTaskTeamUserIds } from "@/lib/taskScope";
import { canAssignTo } from "@/lib/tasks";

export const dynamic = "force-dynamic";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: { select: { name: true } },
};

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
        select: USER_SELECT,
        orderBy: { name: "asc" },
      });
    } else {
      const scopedIds = (await getTaskTeamUserIds(user, { includeSelf: true })) || [];
      const fellows = await prisma.fellow.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
      });
      const targetIds = [
        ...new Set([
          ...(scopedIds.length ? scopedIds : [user.id]),
          ...fellows.map((fellow) => fellow.userId).filter(Boolean),
        ]),
      ];

      const rows = await prisma.user.findMany({
        where: { id: { in: targetIds }, status: "ACTIVE" },
        select: USER_SELECT,
        orderBy: { name: "asc" },
      });

      const checks = await Promise.all(rows.map((row) => canAssignTo(user, row.id)));
      candidates = rows.filter((_, index) => checks[index]);
    }

    const hasTeam = candidates.filter((candidate) => candidate.id !== user.id).length > 0;

    return NextResponse.json({ success: true, data: candidates, meta: { hasTeam } });
  } catch (error) {
    console.error("Fetch assignable users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
