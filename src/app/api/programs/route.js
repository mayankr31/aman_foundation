import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedSchoolIds, getManagedCentreIds } from "@/lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    let where;
    if (user.role.name === "PROGRAM_MANAGER") {
      const [schoolIds, centreIds] = await Promise.all([
        getManagedSchoolIds(user.id),
        getManagedCentreIds(user.id),
      ]);
      const or = [];
      if (schoolIds.length) or.push({ schools: { some: { schoolId: { in: schoolIds } } } });
      if (centreIds.length) or.push({ afterSchoolCentres: { some: { centreId: { in: centreIds } } } });
      where = or.length ? { OR: or } : { id: { in: [] } };
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        _count: {
          select: { schools: true, events: true, afterSchoolCentres: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("Fetch programs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, duration, participantsText, status, icon, iconBg } = body;

    if (!title) {
      return NextResponse.json({ error: "Program title is required" }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        title,
        description,
        duration,
        participantsText,
        status: status || "Planning",
        icon,
        iconBg
      }
    });

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    console.error("Create program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
