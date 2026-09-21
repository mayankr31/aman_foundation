import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

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

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
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

    const centre = await prisma.afterSchoolCentre.create({
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

    return NextResponse.json({ success: true, data: centre }, { status: 201 });
  } catch (error) {
    console.error("Create after school centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
