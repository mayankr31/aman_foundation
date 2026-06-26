import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveSchoolId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const school = await prisma.school.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return school ? school.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const isAssigned = await prisma.fellowSchool.findFirst({
        where: {
          schoolId,
          fellow: { userId: user.id }
        }
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this school" }, { status: 403 });
      }
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        fellows: {
          include: { fellow: true }
        },
        students: {
          select: {
            id: true,
            studentId: true,
            name: true,
            grade: true,
            gradeGroup: true,
            gender: true,
            status: true,
            attendance: true
          }
        },
        programs: {
          include: { program: true }
        }
      }
    });

    // Compute derived stats dynamically
    const totalEnrolled = school.students.length;
    const maleCount = school.students.filter(s => s.gender?.toLowerCase() === "male").length;
    const femaleCount = school.students.filter(s => s.gender?.toLowerCase() === "female").length;

    return NextResponse.json({
      success: true,
      data: {
        ...school,
        totalEnrolled,
        genderRatio: { male: maleCount, female: femaleCount, other: totalEnrolled - maleCount - femaleCount }
      }
    });
  } catch (error) {
    console.error("Fetch school detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await req.json();

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: body.name,
        principalName: body.principalName,
        udiseCode: body.udiseCode,
        email: body.email,
        phone: body.phone,
        address: body.address,
        location: body.location,
        status: body.status,
        latitude: body.latitude,
        longitude: body.longitude,
        mapUrl: body.mapUrl,
        img: body.img,
        goal: body.goal !== undefined ? parseInt(body.goal) : undefined
      }
    });

    return NextResponse.json({ success: true, data: updatedSchool });
  } catch (error) {
    console.error("Update school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decouple students studying at this school
      await tx.student.updateMany({
        where: { schoolId },
        data: { schoolId: null }
      });

      // 2. Decouple fellows placed at this school (M2M)
      await tx.fellowSchool.deleteMany({ where: { schoolId } });

      // 3. Delete school-program links
      await tx.schoolProgram.deleteMany({ where: { schoolId } });

      // 4. Delete school record
      await tx.school.delete({ where: { id: schoolId } });
    });

    return NextResponse.json({ success: true, message: "School deleted successfully" });
  } catch (error) {
    console.error("Delete school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
