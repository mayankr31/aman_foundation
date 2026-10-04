import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin, getManagedFellowIds } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "employees", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for employees" }, { status: 403 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { userId } = await context.params;

    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        mobile: true,
        status: true,
        department: true,
        dob: true,
        gender: true,
        address: true,
        avatar: true,
        createdAt: true,
        role: { select: { name: true } },
        managedSchools: {
          include: { school: { select: { id: true, name: true, location: true } } },
        },
        managedCentres: {
          include: { centre: { select: { id: true, name: true } } },
        },
        managedLivelihoodPrograms: {
          include: { program: { select: { id: true, name: true, category: true } } },
        },
      },
    });

    if (!manager || manager.role?.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Program manager not found" }, { status: 404 });
    }

    const fellowIds = await getManagedFellowIds(userId);
    const fellows = fellowIds.length
      ? await prisma.fellow.findMany({
          where: { id: { in: fellowIds } },
          select: { id: true, name: true, email: true, phone: true, avatar: true },
          orderBy: { name: "asc" },
        })
      : [];

    const data = {
      ...manager,
      schools: (manager.managedSchools || []).map((m) => m.school),
      centres: (manager.managedCentres || []).map((m) => m.centre),
      programs: (manager.managedLivelihoodPrograms || []).map((m) => m.program),
      fellows,
    };
    delete data.managedSchools;
    delete data.managedCentres;
    delete data.managedLivelihoodPrograms;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch program manager detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
