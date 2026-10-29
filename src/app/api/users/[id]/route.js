import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { canAccessUser, isSubordinate } from "@/lib/hierarchy";
import { isManagerRoleAllowed } from "@/lib/roleHierarchy";
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
  validateDateOrder,
  firstError,
  isBlank,
  normalizeMobileForSave,
  normalizeAadhaarForSave,
  normalizePanForSave,
  normalizeVoterIdForSave,
  normalizeIfscForSave,
  normalizeBankAccountForSave,
  normalizeEmailForSave,
} from "@/lib/validation";

const PERSONAL_FIELDS = [
  "name",
  "email",
  "mobile",
  "department",
  "gender",
  "maritalStatus",
  "bloodGroup",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "aadharNumber",
  "panCard",
  "voterId",
  "highestQualification",
  "highestQualificationDetail",
  "bankName",
  "bankAccountNo",
  "bankIfsc",
  "avatar",
];

const EXIT_MANAGER_ROLES = ["ADMIN", "HR"];

function parseDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function ensureAccess(currentUser, id, action) {
  if (currentUser.id === id) return true;
  if (!(await checkPermission(currentUser, "dashboard", "employees", action))) return false;
  return canAccessUser(currentUser, id, { allowSelf: true });
}

export async function GET(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    if (!(await ensureAccess(currentUser, id, "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        manager: { select: { id: true, name: true, role: { select: { name: true } } } },
        directReports: {
          select: { id: true, name: true, employeeId: true, status: true, role: { select: { name: true } } },
        },
        fellow: {
          select: {
            id: true,
            name: true,
            userId: true,
            schools: { include: { school: { select: { id: true, name: true } } } },
            afterSchoolCentres: { include: { centre: { select: { id: true, name: true } } } },
            livelihoodPrograms: {
              include: { program: { select: { id: true, name: true, category: true } } },
            },
          },
        },
        managedSchools: { include: { school: { select: { id: true, name: true } } } },
        managedCentres: { include: { centre: { select: { id: true, name: true } } } },
        managedLivelihoodPrograms: {
          include: { program: { select: { id: true, name: true, category: true } } },
        },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password: _pw, ...safeUser } = target;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Fetch user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    // Must be ADMIN
    if (currentUser.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;

    // Check if the user is attempting to delete themselves
    if (currentUser.id === id) {
      return NextResponse.json({ error: "Conflict: You cannot delete your own account" }, { status: 409 });
    }

    // Retrieve user and fellow record
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { fellow: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Run programmatic cascade delete in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. If user is a fellow, handle fellow relationships
      if (targetUser.fellow) {
        const fellowId = targetUser.fellow.id;
        
        // Dissociate students (set fellowId to null)
        await tx.student.updateMany({
          where: { fellowId },
          data: { fellowId: null }
        });
        
        // Delete fellow (cascades to GoalSheet, etc. in db)
        await tx.fellow.delete({
          where: { id: fellowId }
        });
      }
      
      // 2. Dissociate broadcast alerts sent by this user
      await tx.broadcastAlert.updateMany({
        where: { sentByUserId: id },
        data: { sentByUserId: null }
      });
      
      // 3. Dissociate inventory ledger transactions handled by this user
      await tx.inventoryLedger.updateMany({
        where: { handledByUserId: id },
        data: { handledByUserId: null }
      });
      
      // 4. Delete the user record (which cascades to UserPermission in db)
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    if (!(await ensureAccess(currentUser, id, "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: { select: { name: true } },
        managerId: true,
        dateOfJoining: true,
        status: true,
      },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const canManageExit = EXIT_MANAGER_ROLES.includes(currentUser.role.name);

    const validationMessage = firstError([
      body.name !== undefined ? validatePersonName(body.name, { required: true }) : null,
      body.email !== undefined ? validateEmail(body.email, { required: true }) : null,
      body.mobile !== undefined ? validateMobile(body.mobile, { required: true }) : null,
      body.department !== undefined ? validateRequired(body.department, "Department") : null,
      body.gender !== undefined ? validateRequired(body.gender, "Gender") : null,
      body.maritalStatus !== undefined ? validateRequired(body.maritalStatus, "Marital status") : null,
      body.bloodGroup !== undefined ? validateRequired(body.bloodGroup, "Blood group") : null,
      body.address !== undefined ? validateRequired(body.address, "Address") : null,
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
      body.dob !== undefined ? validateDateNotFuture(body.dob, { required: true, label: "Date of birth" }) : null,
      body.dateOfJoining !== undefined
        ? validateDateNotFuture(body.dateOfJoining, { required: true, label: "Date of joining" })
        : null,
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const hasExitValue = !isBlank(body.dateOfLeaving) || !isBlank(body.resignationReason);
    if (hasExitValue && !canManageExit) {
      return NextResponse.json(
        { error: "Only HR or the Executive Director can record a resignation" },
        { status: 403 }
      );
    }

    const data = {};
    for (const field of PERSONAL_FIELDS) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    if (body.email !== undefined) data.email = normalizeEmailForSave(body.email);
    if (body.mobile !== undefined) data.mobile = normalizeMobileForSave(body.mobile);
    if (body.emergencyContactPhone !== undefined) data.emergencyContactPhone = normalizeMobileForSave(body.emergencyContactPhone);
    if (body.aadharNumber !== undefined) data.aadharNumber = normalizeAadhaarForSave(body.aadharNumber);
    if (body.panCard !== undefined) data.panCard = normalizePanForSave(body.panCard);
    if (body.voterId !== undefined) data.voterId = normalizeVoterIdForSave(body.voterId);
    if (body.bankAccountNo !== undefined) data.bankAccountNo = normalizeBankAccountForSave(body.bankAccountNo);
    if (body.bankIfsc !== undefined) data.bankIfsc = normalizeIfscForSave(body.bankIfsc);
    if (body.department !== undefined) data.department = String(body.department).trim();
    if (body.highestQualification !== undefined) {
      data.highestQualification = String(body.highestQualification).trim();
      data.highestQualificationDetail =
        body.highestQualification === "Other"
          ? String(body.highestQualificationDetail || "").trim()
          : null;
    }
    if (body.dob !== undefined) data.dob = parseDate(body.dob);
    if (body.dateOfJoining !== undefined) data.dateOfJoining = parseDate(body.dateOfJoining);

    if (canManageExit && (body.dateOfLeaving !== undefined || body.resignationReason !== undefined)) {
      const leavingDate = parseDate(body.dateOfLeaving);
      const exitValidation = firstError([
        validateDateNotFuture(body.dateOfLeaving, { label: "Date of leaving" }),
        !isBlank(body.dateOfLeaving) ? validateRequired(body.resignationReason, "Reason for leaving") : null,
        isBlank(body.dateOfLeaving) && !isBlank(body.resignationReason)
          ? "Date of leaving is required when a reason is provided."
          : null,
        validateDateOrder(
          body.dateOfJoining !== undefined ? parseDate(body.dateOfJoining) : target.dateOfJoining,
          leavingDate,
          { startLabel: "Date of joining", endLabel: "Date of leaving" }
        ),
      ]);
      if (exitValidation) {
        return NextResponse.json({ error: exitValidation }, { status: 400 });
      }

      if (body.dateOfLeaving !== undefined) {
        data.dateOfLeaving = leavingDate;
        if (leavingDate) {
          data.status = "INACTIVE";
          data.inactiveSince = leavingDate;
        } else {
          data.resignationReason = null;
        }
      }
      if (body.resignationReason !== undefined) {
        data.resignationReason = isBlank(body.resignationReason)
          ? null
          : String(body.resignationReason).trim();
      }
    }

    if (body.managerId !== undefined) {
      if (currentUser.role.name !== "ADMIN") {
        return NextResponse.json({ error: "Only admins can change reporting lines" }, { status: 403 });
      }
      const managerId = body.managerId || null;
      const managerChanged = (target.managerId || null) !== managerId;
      if (managerChanged) {
        if (managerId === id) {
          return NextResponse.json({ error: "A user cannot report to themselves" }, { status: 400 });
        }
        if (managerId) {
          const manager = await prisma.user.findUnique({
            where: { id: managerId },
            select: { id: true, status: true, role: { select: { name: true } } },
          });
          if (!manager) {
            return NextResponse.json({ error: "Selected manager not found" }, { status: 404 });
          }
          if (manager.status !== "ACTIVE") {
            return NextResponse.json({ error: "Selected manager is not active" }, { status: 400 });
          }
          if (!isManagerRoleAllowed(target.role?.name, manager.role?.name)) {
            return NextResponse.json(
              { error: "Selected manager must be senior to this employee" },
              { status: 400 }
            );
          }
          if (await isSubordinate(managerId, id)) {
            return NextResponse.json(
              { error: "That reporting line would create a loop" },
              { status: 400 }
            );
          }
        }
      }
      data.managerId = managerId;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
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
        avatar: true,
        status: true,
        managerId: true,
        manager: { select: { id: true, name: true, role: { select: { name: true } } } },
        role: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
