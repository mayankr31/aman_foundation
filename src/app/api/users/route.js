import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedTeamUserIds } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "employees", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for employees" }, { status: 403 });
    }

    const isAdmin = user.role.name === "ADMIN";
    const isHr = user.role.name === "HR";
    const isPm = PROGRAM_ROLES.includes(user.role.name);

    if (!isAdmin && !isHr && !isPm) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const rolesFilter = searchParams.get("roles");
    const rolesList = rolesFilter
      ? rolesFilter.split(",").map((r) => r.trim()).filter(Boolean)
      : null;

    // Program Managers only see their team (fellows of assigned schools/centres).
    let scopeWhere;
    if (isPm) {
      const team = await getManagedTeamUserIds(user.id);
      scopeWhere = { id: { in: team } };
    }

    const roleWhere = rolesList?.length
      ? { role: { name: { in: rolesList } } }
      : roleFilter
      ? { role: { name: roleFilter } }
      : null;

    const where = {
      ...(scopeWhere || {}),
      ...(roleWhere || {}),
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
        avatar: true,
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
