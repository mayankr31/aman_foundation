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
  firstError,
  normalizeMobileForSave,
  normalizeEmailForSave,
} from "@/lib/validation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const gradeGroup = searchParams.get("gradeGroup");
    const schoolId = searchParams.get("schoolId");

    const where = {};
    if (gradeGroup && gradeGroup !== "All Grades") where.gradeGroup = gradeGroup;
    if (schoolId && schoolId !== "All Schools") where.schoolId = schoolId;

    if (user.role.name === "FELLOW") {
      where.school = {
        fellows: {
          some: {
            fellow: { userId: user.id }
          }
        }
      };
    } else if (PROGRAM_ROLES.includes(user.role.name)) {
      const managed = await getManagedSchoolIds(user.id);
      if (schoolId && schoolId !== "All Schools") {
        if (!managed.includes(schoolId)) where.schoolId = { in: [] };
      } else {
        where.schoolId = { in: managed };
      }
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        school: {
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
    console.error("Fetch students error:", error);
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
    const isPm = PROGRAM_ROLES.includes(user.role.name);
    const isFellow = user.role.name === "FELLOW";
    if (!isAdmin && !isPm && !isFellow) {
      return NextResponse.json({ error: "Forbidden: Admin, Program Manager or Fellow access only" }, { status: 403 });
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
      guardianRelation,
      fatherName,
      fatherMobile,
      motherName,
      motherMobile,
      enrolmentDate,
      primaryLanguage,
      schoolId,
      fellowId
    } = body;

    if (!name || !studentId || !grade || !gradeGroup) {
      return NextResponse.json({ error: "Name, Student ID, Grade, and Grade Group are required" }, { status: 400 });
    }

    const validationMessage = firstError([
      validatePersonName(name, { required: true }),
      dob ? validateDateNotFuture(dob, { label: "Date of birth" }) : null,
      enrolmentDate ? validateDateNotFuture(enrolmentDate, { label: "Enrolment date" }) : null,
      validateMobile(phone),
      validateMobile(guardianPhone),
      validateMobile(fatherMobile),
      validateMobile(motherMobile),
      validateEmail(email),
      validatePersonName(guardianName),
      validatePersonName(fatherName),
      validatePersonName(motherName),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    let resolvedFellowId = fellowId;

    if (isPm) {
      const managed = await getManagedSchoolIds(user.id);
      if (!schoolId || !managed.includes(schoolId)) {
        return NextResponse.json(
          { error: "Forbidden: You can only add students to your assigned schools" },
          { status: 403 }
        );
      }
    }

    if (isFellow) {
      const fellowProfileId = await getFellowIdByUserId(user.id);
      if (!fellowProfileId) {
        return NextResponse.json({ error: "Forbidden: Fellow profile not found" }, { status: 403 });
      }
      if (!schoolId) {
        return NextResponse.json({ error: "Please select one of your assigned schools" }, { status: 400 });
      }
      const isAssigned = await prisma.fellowSchool.findFirst({
        where: { fellowId: fellowProfileId, schoolId },
        select: { id: true }
      });
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You can only add students to your assigned schools" },
          { status: 403 }
        );
      }
      resolvedFellowId = fellowProfileId;
    }

    const student = await prisma.student.create({
      data: {
        studentId,
        name: name.trim(),
        dob: dob ? new Date(dob) : null,
        gender,
        email: normalizeEmailForSave(email),
        phone: normalizeMobileForSave(phone),
        address,
        grade,
        gradeGroup,
        district,
        attendance: attendance ? parseFloat(attendance) : 0.0,
        guardianName,
        guardianPhone: normalizeMobileForSave(guardianPhone),
        guardianRelation,
        fatherName,
        fatherMobile: normalizeMobileForSave(fatherMobile),
        motherName,
        motherMobile: normalizeMobileForSave(motherMobile),
        enrolmentDate: enrolmentDate ? new Date(enrolmentDate) : null,
        primaryLanguage,
        schoolId,
        fellowId: resolvedFellowId
      }
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
