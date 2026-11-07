import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedSchoolIds, getFellowIdByUserId } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import {
  validatePersonName,
  validateEmail,
  validateMobile,
  validateDateNotFuture,
  validateRequired,
  firstError,
  normalizeMobileForSave,
  normalizeEmailForSave,
  normalizePersonName,
} from "@/lib/validation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

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

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
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

    if (PROGRAM_ROLES.includes(user.role.name)) {
      const studentObj = await prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true }
      });
      const managed = await getManagedSchoolIds(user.id);
      if (!studentObj || !studentObj.schoolId || !managed.includes(studentObj.schoolId)) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: {
          include: {
            fellows: {
              include: { fellow: { select: { id: true, name: true, email: true } } }
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
            school: { select: { id: true, name: true } },
            enrollmentResponses: true,
            subjectResponses: {
              include: { subjectTemplate: true }
            },
            flnResponses: {
              include: { flnQuestion: { include: { category: true } } }
            },
            selResponses: {
              include: { selQuestion: true }
            }
          },
          orderBy: { date: "desc" }
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

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "FELLOW" &&
      !PROGRAM_ROLES.includes(user.role.name)
    ) {
      return NextResponse.json({ error: "Forbidden: Admin, Fellow or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (user.role.name === "FELLOW" || PROGRAM_ROLES.includes(user.role.name)) {
      const studentObj = await prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true }
      });
      if (!studentObj || !studentObj.schoolId) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
      }
      if (user.role.name === "FELLOW") {
        const isAssigned = await prisma.fellowSchool.findFirst({
          where: {
            schoolId: studentObj.schoolId,
            fellow: { userId: user.id }
          }
        });
        if (!isAssigned) {
          return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
        }
      } else {
        const managed = await getManagedSchoolIds(user.id);
        if (!managed.includes(studentObj.schoolId)) {
          return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
        }
      }
    }

    const body = await req.json();
    const isFullEdit = body.name !== undefined;

    if (isFullEdit) {
      const requiredMessage = firstError([
        validateRequired(body.name, "Full name"),
        validateRequired(body.dob, "Date of birth"),
        validateRequired(body.gender, "Gender"),
        validateRequired(body.grade, "Grade"),
        validateRequired(body.gradeGroup, "Grade group"),
        validateRequired(body.district, "District"),
        validateRequired(body.primaryLanguage, "Primary language"),
        validateRequired(body.fatherName, "Father's name"),
        validateRequired(body.fatherMobile, "Father's mobile"),
        validateRequired(body.motherName, "Mother's name"),
        validateRequired(body.address, "Address"),
        validateRequired(body.enrolmentDate, "Enrolment date"),
      ]);
      if (requiredMessage) {
        return NextResponse.json({ error: requiredMessage }, { status: 400 });
      }
    }

    const validationMessage = firstError([
      body.name !== undefined ? validatePersonName(body.name, { required: true }) : null,
      body.dob ? validateDateNotFuture(body.dob, { label: "Date of birth" }) : null,
      body.enrolmentDate ? validateDateNotFuture(body.enrolmentDate, { label: "Enrolment date" }) : null,
      validateMobile(body.phone),
      validateMobile(body.guardianPhone),
      validateMobile(body.fatherMobile, { required: isFullEdit }),
      validateMobile(body.motherMobile),
      validateEmail(body.email),
      validatePersonName(body.guardianName),
      validatePersonName(body.fatherName, { required: isFullEdit }),
      validatePersonName(body.motherName, { required: isFullEdit }),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    if (PROGRAM_ROLES.includes(user.role.name) && body.schoolId) {
      const managed = await getManagedSchoolIds(user.id);
      if (!managed.includes(body.schoolId)) {
        return NextResponse.json({ error: "Forbidden: You can only move students within your assigned schools" }, { status: 403 });
      }
    }

    if (user.role.name === "FELLOW" && body.schoolId) {
      const fellowProfileId = await getFellowIdByUserId(user.id);
      const isAssigned = fellowProfileId
        ? await prisma.fellowSchool.findFirst({
            where: { fellowId: fellowProfileId, schoolId: body.schoolId },
            select: { id: true }
          })
        : null;
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You can only move students within your assigned schools" }, { status: 403 });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        studentId: body.studentId ? String(body.studentId).trim() : undefined,
        name: body.name !== undefined ? normalizePersonName(body.name) : undefined,
        dob: body.dob ? new Date(body.dob) : undefined,
        gender: body.gender,
        email: body.email !== undefined ? normalizeEmailForSave(body.email) : undefined,
        phone: body.phone !== undefined ? normalizeMobileForSave(body.phone) : undefined,
        address: body.address !== undefined ? String(body.address).trim() : undefined,
        grade: body.grade,
        gradeGroup: body.gradeGroup,
        district: body.district !== undefined ? String(body.district).trim() : undefined,
        attendance: body.attendance !== undefined ? parseFloat(body.attendance) : undefined,
        guardianName: body.guardianName !== undefined ? (normalizePersonName(body.guardianName) || null) : undefined,
        guardianPhone: body.guardianPhone !== undefined ? normalizeMobileForSave(body.guardianPhone) : undefined,
        guardianRelation: body.guardianRelation !== undefined ? (String(body.guardianRelation).trim() || null) : undefined,
        fatherName: body.fatherName !== undefined ? normalizePersonName(body.fatherName) : undefined,
        fatherMobile: body.fatherMobile !== undefined ? normalizeMobileForSave(body.fatherMobile) : undefined,
        motherName: body.motherName !== undefined ? normalizePersonName(body.motherName) : undefined,
        motherMobile: body.motherMobile !== undefined ? normalizeMobileForSave(body.motherMobile) : undefined,
        enrolmentDate: body.enrolmentDate ? new Date(body.enrolmentDate) : undefined,
        primaryLanguage: body.primaryLanguage !== undefined ? String(body.primaryLanguage).trim() : undefined,
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

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.studentAttendanceLog.deleteMany({
        where: { studentId }
      });
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
