import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const gradeGroup = searchParams.get("gradeGroup");
    const status = searchParams.get("status");
    const centreId = searchParams.get("centreId");

    const where = {};
    if (gradeGroup && gradeGroup !== "All Grades") where.gradeGroup = gradeGroup;
    if (status && status !== "All Performance") where.status = status;
    if (centreId && centreId !== "All Centres") where.centreId = centreId;

    if (user.role.name === "FELLOW") {
      where.centre = {
        fellows: {
          some: {
            fellow: { userId: user.id }
          }
        }
      };
    }

    const students = await prisma.afterSchoolStudent.findMany({
      where,
      include: {
        centre: {
          select: { id: true, name: true }
        },
        fellow: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error("Fetch after school students error:", error);
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
      studentId,
      name,
      dob,
      gender,
      email,
      phone,
      address,
      grade,
      gradeGroup,
      district,
      attendance,
      guardianName,
      guardianPhone,
      enrolmentDate,
      primaryLanguage,
      status,
      centreId,
      fellowId
    } = body;

    if (!name || !studentId) {
      return NextResponse.json({ error: "Name and Student ID are required" }, { status: 400 });
    }

    const student = await prisma.afterSchoolStudent.create({
      data: {
        studentId,
        name,
        dob: dob ? new Date(dob) : null,
        gender,
        email,
        phone,
        address,
        grade,
        gradeGroup,
        district,
        attendance: attendance ? parseFloat(attendance) : 0.0,
        guardianName,
        guardianPhone,
        enrolmentDate: enrolmentDate ? new Date(enrolmentDate) : null,
        primaryLanguage,
        status: status || "On Track",
        centreId,
        fellowId
      }
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    console.error("Create after school student error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
