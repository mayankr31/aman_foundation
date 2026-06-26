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

    const schools = await prisma.school.findMany({
      where,
      include: {
        _count: {
          select: { programs: true, students: true, fellows: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const mappedSchools = schools.map((s) => ({
      ...s,
      programs: s._count.programs,
      enrolled: s._count.students,
      fellowsCount: s._count.fellows
    }));

    return NextResponse.json({ success: true, data: mappedSchools });
  } catch (error) {
    console.error("Fetch schools error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    // Limit to ADMIN roles
    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      principalName,
      udiseCode,
      email,
      phone,
      address,
      location,
      status,
      latitude,
      longitude,
      mapUrl,
      img,
      goal
    } = body;

    if (!name) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    const school = await prisma.school.create({
      data: {
        name,
        principalName,
        udiseCode,
        email,
        phone,
        address,
        location,
        status: status || "Active",
        latitude,
        longitude,
        mapUrl,
        img,
        goal: goal ? parseInt(goal) : 80
      }
    });

    return NextResponse.json({ success: true, data: school }, { status: 201 });
  } catch (error) {
    console.error("Create school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
