import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveCentreId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const centre = await prisma.afterSchoolCentre.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return centre ? centre.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const isAssigned = await prisma.fellowAfterSchoolCentre.findFirst({
        where: {
          centreId,
          fellow: { userId: user.id }
        }
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this centre" }, { status: 403 });
      }
    }

    const centre = await prisma.afterSchoolCentre.findUnique({
      where: { id: centreId },
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

    if (!centre) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    const totalEnrolled = centre.students.length;
    const maleCount = centre.students.filter(s => s.gender?.toLowerCase() === "male").length;
    const femaleCount = centre.students.filter(s => s.gender?.toLowerCase() === "female").length;

    return NextResponse.json({
      success: true,
      data: {
        ...centre,
        totalEnrolled,
        genderRatio: { male: maleCount, female: femaleCount, other: totalEnrolled - maleCount - femaleCount }
      }
    });
  } catch (error) {
    console.error("Fetch after school centre detail error:", error);
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
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    const body = await req.json();

    const updatedCentre = await prisma.afterSchoolCentre.update({
      where: { id: centreId },
      data: {
        name: body.name,
        coordinatorName: body.coordinatorName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        location: body.location,
        status: body.status,
        mapUrl: body.mapUrl,
        img: body.img,
        goal: body.goal !== undefined ? parseInt(body.goal) : undefined
      }
    });

    return NextResponse.json({ success: true, data: updatedCentre });
  } catch (error) {
    console.error("Update after school centre error:", error);
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
    const centreId = await resolveCentreId(id);

    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.afterSchoolStudent.updateMany({
        where: { centreId },
        data: { centreId: null }
      });

      await tx.fellowAfterSchoolCentre.deleteMany({ where: { centreId } });
      await tx.afterSchoolCentreProgram.deleteMany({ where: { centreId } });
      await tx.afterSchoolCentre.delete({ where: { id: centreId } });
    });

    return NextResponse.json({ success: true, message: "After school centre deleted successfully" });
  } catch (error) {
    console.error("Delete after school centre error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
