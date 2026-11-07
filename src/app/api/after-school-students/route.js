import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedCentreIds, getFellowIdByUserId } from "@/lib/scope";
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
import { generateAfterSchoolStudentId } from "@/lib/studentId";

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
    const centreId = searchParams.get("centreId");

    const where = {};
    if (gradeGroup && gradeGroup !== "All Grades") where.gradeGroup = gradeGroup;
    if (centreId && centreId !== "All Centres") where.centreId = centreId;

    if (user.role.name === "FELLOW") {
      where.centre = {
        fellows: {
          some: {
            fellow: { userId: user.id }
          }
        }
      };
    } else if (PROGRAM_ROLES.includes(user.role.name)) {
      const managed = await getManagedCentreIds(user.id);
      if (centreId && centreId !== "All Centres") {
        if (!managed.includes(centreId)) where.centreId = { in: [] };
      } else {
        where.centreId = { in: managed };
      }
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
      centreId,
      fellowId
    } = body;

    const requiredMessage = firstError([
      validateRequired(name, "Full name"),
      validateRequired(centreId, "Centre"),
      validateRequired(dob, "Date of birth"),
      validateRequired(gender, "Gender"),
      validateRequired(grade, "Grade"),
      validateRequired(gradeGroup, "Grade group"),
      validateRequired(district, "District"),
      validateRequired(primaryLanguage, "Primary language"),
      validateRequired(fatherName, "Father's name"),
      validateRequired(fatherMobile, "Father's mobile"),
      validateRequired(motherName, "Mother's name"),
      validateRequired(address, "Address"),
      validateRequired(enrolmentDate, "Enrolment date"),
    ]);
    if (requiredMessage) {
      return NextResponse.json({ error: requiredMessage }, { status: 400 });
    }

    const validationMessage = firstError([
      validatePersonName(name, { required: true }),
      dob ? validateDateNotFuture(dob, { label: "Date of birth" }) : null,
      enrolmentDate ? validateDateNotFuture(enrolmentDate, { label: "Enrolment date" }) : null,
      validateMobile(phone),
      validateMobile(guardianPhone),
      validateMobile(fatherMobile, { required: true }),
      validateMobile(motherMobile),
      validateEmail(email),
      validatePersonName(guardianName),
      validatePersonName(fatherName, { required: true }),
      validatePersonName(motherName, { required: true }),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    let resolvedFellowId = fellowId;
    const cleanName = normalizePersonName(name);
    const cleanDob = new Date(dob);

    if (isPm) {
      const managed = await getManagedCentreIds(user.id);
      if (!managed.includes(centreId)) {
        return NextResponse.json(
          { error: "Forbidden: You can only add students to your assigned centres" },
          { status: 403 }
        );
      }
    }

    if (isFellow) {
      const fellowProfileId = await getFellowIdByUserId(user.id);
      if (!fellowProfileId) {
        return NextResponse.json({ error: "Forbidden: Fellow profile not found" }, { status: 403 });
      }
      const isAssigned = await prisma.fellowAfterSchoolCentre.findFirst({
        where: { fellowId: fellowProfileId, centreId },
        select: { id: true }
      });
      if (!isAssigned) {
        return NextResponse.json(
          { error: "Forbidden: You can only add students to your assigned centres" },
          { status: 403 }
        );
      }
      resolvedFellowId = fellowProfileId;
    }

    const recentDuplicate = await prisma.afterSchoolStudent.findFirst({
      where: {
        name: { equals: cleanName, mode: "insensitive" },
        centreId,
        dob: cleanDob,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { error: "This student was already added moments ago. Refresh the list before adding again." },
        { status: 409 }
      );
    }

    const providedStudentId = studentId ? String(studentId).trim() : "";
    if (providedStudentId) {
      const existing = await prisma.afterSchoolStudent.findUnique({
        where: { studentId: providedStudentId },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: "A student with this Student ID already exists" }, { status: 409 });
      }
    }

    let student = null;
    for (let attempt = 0; attempt < 3 && !student; attempt += 1) {
      const resolvedStudentId = providedStudentId || (await generateAfterSchoolStudentId());
      try {
        student = await prisma.afterSchoolStudent.create({
          data: {
            studentId: resolvedStudentId,
            name: cleanName,
            dob: cleanDob,
            gender,
            email: normalizeEmailForSave(email),
            phone: normalizeMobileForSave(phone),
            address: String(address).trim(),
            grade,
            gradeGroup,
            district: String(district).trim(),
            attendance: attendance ? parseFloat(attendance) : 0.0,
            guardianName: normalizePersonName(guardianName) || null,
            guardianPhone: normalizeMobileForSave(guardianPhone),
            guardianRelation: String(guardianRelation || "").trim() || null,
            fatherName: normalizePersonName(fatherName),
            fatherMobile: normalizeMobileForSave(fatherMobile),
            motherName: normalizePersonName(motherName),
            motherMobile: normalizeMobileForSave(motherMobile),
            enrolmentDate: new Date(enrolmentDate),
            primaryLanguage: String(primaryLanguage).trim(),
            centreId,
            fellowId: resolvedFellowId
          }
        });
      } catch (err) {
        if (err.code === "P2002" && !providedStudentId) continue;
        if (err.code === "P2002") {
          return NextResponse.json({ error: "A student with this Student ID already exists" }, { status: 409 });
        }
        throw err;
      }
    }

    if (!student) {
      return NextResponse.json(
        { error: "Could not generate a unique Student ID. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    console.error("Create after school student error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
