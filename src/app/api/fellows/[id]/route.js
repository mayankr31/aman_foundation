import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin, isFellowManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import {
  validatePersonName,
  validateEmail,
  validateMobile,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateBankAccount,
  validateIfsc,
  validateRequired,
  validateDateNotFuture,
  firstError,
  normalizeMobileForSave,
  normalizeAadhaarForSave,
  normalizePanForSave,
  normalizeVoterIdForSave,
  normalizeIfscForSave,
  normalizeBankAccountForSave,
  normalizeEmailForSave,
} from "@/lib/validation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const FELLOW_DETAIL_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      mobile: true,
      department: true,
      employeeId: true,
      gender: true,
      maritalStatus: true,
      bloodGroup: true,
      address: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      aadharNumber: true,
      panCard: true,
      voterId: true,
      highestQualification: true,
      highestQualificationDetail: true,
      bankName: true,
      bankAccountNo: true,
      bankIfsc: true,
      dob: true,
      dateOfJoining: true,
      dateOfLeaving: true,
      resignationReason: true,
      inactiveSince: true,
      status: true,
      avatar: true,
      role: { select: { name: true } },
      manager: { select: { id: true, name: true, role: { select: { name: true } } } },
      directReports: {
        select: { id: true, name: true, employeeId: true, status: true, role: { select: { name: true } } },
      },
    },
  },
  schools: { include: { school: { select: { id: true, name: true, location: true, status: true } } } },
  afterSchoolCentres: { include: { centre: { select: { id: true, name: true, location: true } } } },
  livelihoodPrograms: { include: { program: { select: { id: true, name: true, category: true } } } },
  students: true,
  goalSheets: {
    orderBy: { date: "desc" }
  }
};

function parseDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isFellowManaged(user.id, fellowId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this fellow" }, { status: 403 });
    }

    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId },
      include: FELLOW_DETAIL_INCLUDE
    });

    return NextResponse.json({ success: true, data: fellow });
  } catch (error) {
    console.error("Fetch fellow detail error:", error);
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

    if (!isAdmin(user) && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (PROGRAM_ROLES.includes(user.role.name) && !(await isFellowManaged(user.id, fellowId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this fellow" }, { status: 403 });
    }

    const body = await req.json();

    const target = await prisma.fellow.findUnique({
      where: { id: fellowId },
      select: { id: true, userId: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const mobile = body.mobile !== undefined ? body.mobile : body.phone;

    const validationMessage = firstError([
      body.name !== undefined ? validatePersonName(body.name, { required: true }) : null,
      body.email !== undefined ? validateEmail(body.email, { required: true }) : null,
      mobile !== undefined ? validateMobile(mobile, { required: true }) : null,
      body.address !== undefined ? validateRequired(body.address, "Address") : null,
      body.gender !== undefined ? validateRequired(body.gender, "Gender") : null,
      body.dob !== undefined ? validateDateNotFuture(body.dob, { required: true, label: "Date of birth" }) : null,
      body.maritalStatus !== undefined ? validateRequired(body.maritalStatus, "Marital status") : null,
      body.bloodGroup !== undefined ? validateRequired(body.bloodGroup, "Blood group") : null,
      body.emergencyContactName !== undefined
        ? validatePersonName(body.emergencyContactName, { required: true })
        : null,
      body.emergencyContactPhone !== undefined
        ? validateMobile(body.emergencyContactPhone, { required: true })
        : null,
      body.aadharNumber !== undefined ? validateAadhaar(body.aadharNumber, { required: true }) : null,
      body.panCard !== undefined ? validatePan(body.panCard, { required: true }) : null,
      body.voterId !== undefined ? validateVoterId(body.voterId, { required: true }) : null,
      body.highestQualification !== undefined
        ? validateRequired(body.highestQualification, "Highest qualification")
        : null,
      body.highestQualification === "Other"
        ? validateRequired(body.highestQualificationDetail, "Specify qualification")
        : null,
      body.bankName !== undefined ? validateRequired(body.bankName, "Bank name") : null,
      body.bankAccountNo !== undefined ? validateBankAccount(body.bankAccountNo, { required: true }) : null,
      body.bankIfsc !== undefined ? validateIfsc(body.bankIfsc, { required: true }) : null,
      body.dateOfJoining !== undefined && body.dateOfJoining
        ? validateDateNotFuture(body.dateOfJoining, { label: "Date of joining" })
        : null,
    ]);

    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const fellowData = {};
    if (body.name !== undefined) fellowData.name = String(body.name).trim();
    if (body.email !== undefined) fellowData.email = body.email ? normalizeEmailForSave(body.email) : null;
    if (mobile !== undefined) fellowData.phone = mobile ? normalizeMobileForSave(mobile) : null;
    if (body.address !== undefined) fellowData.address = body.address;
    if (body.gender !== undefined) fellowData.gender = body.gender;
    if (body.dob !== undefined) fellowData.dob = parseDate(body.dob);
    if (body.avatar !== undefined) fellowData.avatar = body.avatar;
    if (body.progress !== undefined) fellowData.progress = parseInt(body.progress, 10) || 0;
    if (body.evaluationRating !== undefined) {
      fellowData.evaluationRating = body.evaluationRating === null || body.evaluationRating === ""
        ? null
        : parseFloat(body.evaluationRating);
    }

    const userData = {};
    if (body.name !== undefined) userData.name = String(body.name).trim();
    if (body.email !== undefined) userData.email = body.email ? normalizeEmailForSave(body.email) : null;
    if (mobile !== undefined) userData.mobile = mobile ? normalizeMobileForSave(mobile) : null;
    if (body.address !== undefined) userData.address = body.address;
    if (body.gender !== undefined) userData.gender = body.gender;
    if (body.dob !== undefined) userData.dob = parseDate(body.dob);
    if (body.avatar !== undefined) userData.avatar = body.avatar;
    if (body.maritalStatus !== undefined) userData.maritalStatus = body.maritalStatus;
    if (body.bloodGroup !== undefined) userData.bloodGroup = body.bloodGroup;
    if (body.emergencyContactName !== undefined) userData.emergencyContactName = body.emergencyContactName;
    if (body.emergencyContactPhone !== undefined) {
      userData.emergencyContactPhone = body.emergencyContactPhone
        ? normalizeMobileForSave(body.emergencyContactPhone)
        : null;
    }
    if (body.aadharNumber !== undefined) {
      userData.aadharNumber = body.aadharNumber ? normalizeAadhaarForSave(body.aadharNumber) : null;
    }
    if (body.panCard !== undefined) {
      userData.panCard = body.panCard ? normalizePanForSave(body.panCard) : null;
    }
    if (body.voterId !== undefined) {
      userData.voterId = body.voterId ? normalizeVoterIdForSave(body.voterId) : null;
    }
    if (body.highestQualification !== undefined) {
      userData.highestQualification = String(body.highestQualification).trim();
      userData.highestQualificationDetail =
        body.highestQualification === "Other"
          ? String(body.highestQualificationDetail || "").trim()
          : null;
    }
    if (body.bankName !== undefined) userData.bankName = body.bankName;
    if (body.bankAccountNo !== undefined) {
      userData.bankAccountNo = body.bankAccountNo ? normalizeBankAccountForSave(body.bankAccountNo) : null;
    }
    if (body.bankIfsc !== undefined) {
      userData.bankIfsc = body.bankIfsc ? normalizeIfscForSave(body.bankIfsc) : null;
    }
    if (body.dateOfJoining !== undefined) userData.dateOfJoining = parseDate(body.dateOfJoining);

    const updatedFellow = await prisma.$transaction(async (tx) => {
      if (Object.keys(fellowData).length > 0) {
        await tx.fellow.update({
          where: { id: fellowId },
          data: fellowData,
        });
      }

      if (target.userId && Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: target.userId },
          data: userData,
        });
      }

      return tx.fellow.findUnique({
        where: { id: fellowId },
        include: FELLOW_DETAIL_INCLUDE,
      });
    });

    return NextResponse.json({ success: true, data: updatedFellow });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "email";
      return NextResponse.json({ error: `A record with this ${field} already exists` }, { status: 409 });
    }
    console.error("Update fellow error:", error);
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
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decouple students assigned to this fellow
      await tx.student.updateMany({
        where: { fellowId },
        data: { fellowId: null }
      });

      // 2. Remove school assignments (M2M)
      await tx.fellowSchool.deleteMany({ where: { fellowId } });

      // 3. Delete goal sheets
      await tx.goalSheet.deleteMany({
        where: { fellowId }
      });

      // 4. Delete the fellow record
      await tx.fellow.delete({
        where: { id: fellowId }
      });
    });

    return NextResponse.json({ success: true, message: "Fellow deleted successfully" });
  } catch (error) {
    console.error("Delete fellow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
