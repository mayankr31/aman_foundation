import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.student.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const studentObj = await prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true }
      });
      if (!studentObj || !studentObj.schoolId) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
      }
      const isAssigned = await prisma.fellowSchool.findFirst({
        where: {
          schoolId: studentObj.schoolId,
          fellow: { userId: user.id }
        }
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: {
          include: {
            fellows: {
              include: { fellow: { select: { id: true, name: true, cohort: true, email: true } } }
            }
          }
        },
        fellow: true,
        subjectMarks: true,
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
        assessments: {
          orderBy: { createdAt: "desc" }
        },
        transitions: {
          orderBy: { createdAt: "desc" }
        },
        beneficiary: {
          select: { id: true, name: true, enrolmentId: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error("Fetch student detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW") {
      const studentObj = await prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true }
      });
      if (!studentObj || !studentObj.schoolId) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
      }
      const isAssigned = await prisma.fellowSchool.findFirst({
        where: {
          schoolId: studentObj.schoolId,
          fellow: { userId: user.id }
        }
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
      }
    }

    const body = await req.json();

    const updatedStudent = await prisma.student.update({
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
        schoolId: body.schoolId,
        fellowId: body.fellowId,
        beneficiaryId: body.beneficiaryId !== undefined ? (body.beneficiaryId || null) : undefined,
        isMigrated: body.isMigrated !== undefined ? Boolean(body.isMigrated) : undefined
      }
    });

    return NextResponse.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error("Update student error:", error);
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
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete student subject marks
      await tx.studentSubjectMark.deleteMany({
        where: { studentId }
      });

      // 2. Delete student attendance logs
      await tx.studentAttendanceLog.deleteMany({
        where: { studentId }
      });

      // 3. Delete student record
      await tx.student.delete({
        where: { id: studentId }
      });
    });

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
