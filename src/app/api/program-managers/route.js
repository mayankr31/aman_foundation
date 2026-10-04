import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "employees", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for employees" }, { status: 403 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const managers = await prisma.user.findMany({
      where: { role: { name: "PROGRAM_MANAGER" } },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        mobile: true,
        status: true,
        department: true,
        avatar: true,
        createdAt: true,
        role: { select: { name: true } },
        _count: {
          select: {
            managedSchools: true,
            managedCentres: true,
            managedLivelihoodPrograms: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = managers.map((m) => ({
      id: m.id,
      name: m.name,
      username: m.username,
      email: m.email,
      mobile: m.mobile,
      status: m.status,
      department: m.department,
      avatar: m.avatar,
      createdAt: m.createdAt,
      role: m.role,
      schools: m._count.managedSchools,
      centres: m._count.managedCentres,
      programs: m._count.managedLivelihoodPrograms,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch program managers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
