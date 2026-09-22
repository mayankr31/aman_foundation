import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedCentreIds } from "@/lib/scope";

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.afterSchoolStudent.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

async function canFellowAccess(studentId, userId) {
  const studentObj = await prisma.afterSchoolStudent.findUnique({
    where: { id: studentId },
    select: { centreId: true }
  });
  if (!studentObj || !studentObj.centreId) return false;
  const isAssigned = await prisma.fellowAfterSchoolCentre.findFirst({
    where: {
      centreId: studentObj.centreId,
      fellow: { userId }
    }
  });
  return !!isAssigned;
}

async function canPmAccess(studentId, userId) {
  const studentObj = await prisma.afterSchoolStudent.findUnique({
    where: { id: studentId },
    select: { centreId: true }
  });
  if (!studentObj || !studentObj.centreId) return false;
  const managed = await getManagedCentreIds(userId);
  return managed.includes(studentObj.centreId);
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const ok = await canFellowAccess(studentId, user.id);
      if (!ok) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
      }
    } else if (user.role.name === "PROGRAM_MANAGER") {
      const ok = await canPmAccess(studentId, user.id);
      if (!ok) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
      }
    }

    const student = await prisma.afterSchoolStudent.findUnique({
      where: { id: studentId },
      include: {
        centre: {
          include: {
            fellows: {
              include: { fellow: { select: { id: true, name: true, cohort: true, email: true } } }
            }
          }
        },
        fellow: true,
        attendanceLogs: {
          include: { dayLogs: { orderBy: { date: "asc" } } },
          orderBy: { createdAt: "desc" }
        },
        learningAssessments: {
          orderBy: { date: "desc" },
          take: 50
        },
        homeworkRecords: {
          orderBy: { date: "desc" },
          take: 50
        },
        transitions: {
          orderBy: { createdAt: "desc" }
        },
        assessmentForms: {
          include: {
            fellow: { select: { id: true, name: true } },
            centre: { select: { id: true, name: true } },
            subjectResponses: {
              include: { subjectTemplate: true }
            },
            flnResponses: {
              include: { flnQuestion: { include: { category: true } } }
            }
          },
          orderBy: { date: "desc" }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error("Fetch after school student detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "FELLOW" &&
      user.role.name !== "PROGRAM_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden: Admin, Fellow or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const ok = await canFellowAccess(studentId, user.id);
      if (!ok) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
      }
    } else if (user.role.name === "PROGRAM_MANAGER") {
      const ok = await canPmAccess(studentId, user.id);
      if (!ok) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's centre" }, { status: 403 });
      }
    }

    const body = await req.json();

    if (user.role.name === "PROGRAM_MANAGER" && body.centreId) {
      const managed = await getManagedCentreIds(user.id);
      if (!managed.includes(body.centreId)) {
        return NextResponse.json({ error: "Forbidden: You can only move students within your assigned centres" }, { status: 403 });
      }
    }

    const updatedStudent = await prisma.afterSchoolStudent.update({
      where: { id: studentId },
      data: {
        studentId: body.studentId,
        name: body.name,
        dob: body.dob ? new Date(body.dob) : undefined,
        gender: body.gender,
        email: body.email,
        phone: body.phone,
        address: body.address,
        grade: body.grade,
        gradeGroup: body.gradeGroup,
        district: body.district,
        attendance: body.attendance !== undefined ? parseFloat(body.attendance) : undefined,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        enrolmentDate: body.enrolmentDate ? new Date(body.enrolmentDate) : undefined,
        primaryLanguage: body.primaryLanguage,
        status: body.status,
        centreId: body.centreId,
        fellowId: body.fellowId
      }
    });

    return NextResponse.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error("Update after school student error:", error);
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
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.afterSchoolStudentAttendanceLog.deleteMany({
        where: { studentId }
      });
      await tx.afterSchoolStudent.delete({
        where: { id: studentId }
      });
    });

    return NextResponse.json({ success: true, message: "After school student deleted successfully" });
  } catch (error) {
    console.error("Delete after school student error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
