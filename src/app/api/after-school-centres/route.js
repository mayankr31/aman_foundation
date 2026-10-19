import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getFellowIdByUserId } from "@/lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const where = {};
    if (user.role.name === "FELLOW") {
      where.fellows = {
        some: {
          fellow: { userId: user.id }
        }
      };
    }

    const centres = await prisma.afterSchoolCentre.findMany({
      where,
      include: {
        _count: {
          select: { programs: true, students: true, fellows: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const mappedCentres = centres.map((c) => ({
      ...c,
      programs: c._count.programs,
      enrolled: c._count.students,
      fellowsCount: c._count.fellows
    }));

    return NextResponse.json({ success: true, data: mappedCentres });
  } catch (error) {
    console.error("Fetch after school centres error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const isAdmin = user.role.name === "ADMIN";
    const isFellow = user.role.name === "FELLOW";
    if (!isAdmin && !isFellow) {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access only" }, { status: 403 });
    }

    let fellowProfileId = null;
    if (isFellow) {
      fellowProfileId = await getFellowIdByUserId(user.id);
      if (!fellowProfileId) {
        return NextResponse.json({ error: "Forbidden: Fellow profile not found" }, { status: 403 });
      }
    }

    const body = await req.json();
    const {
      name,
      coordinatorName,
      email,
      phone,
      address,
      location,
      status,
      mapUrl,
      img,
      goal
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Centre name is required" }, { status: 400 });
    }

    const centre = await prisma.$transaction(async (tx) => {
      const created = await tx.afterSchoolCentre.create({
        data: {
          name,
          coordinatorName,
          email,
          phone,
          address,
          location,
          status: status || "Active",
          mapUrl,
          img,
          goal: goal ? parseInt(goal) : 80
        }
      });

      // Fellows are scoped to their assigned centres, so link the creator
      // immediately; otherwise the centre would be invisible to them.
      if (fellowProfileId) {
        await tx.fellowAfterSchoolCentre.create({
          data: { fellowId: fellowProfileId, centreId: created.id }
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: centre }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "An after school centre with this name already exists" }, { status: 409 });
    }
    console.error("Create after school centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
