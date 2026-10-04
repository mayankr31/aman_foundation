import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PERSONAL_FIELDS = [
  "name",
  "email",
  "mobile",
  "department",
  "employeeId",
  "gender",
  "maritalStatus",
  "bloodGroup",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "aadharNumber",
  "panCard",
  "bankName",
  "bankAccountNo",
  "bankIfsc",
  "avatar",
];

function parseDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function ensureAccess(currentUser, id, action) {
  if (currentUser.id === id) return true;
  return checkPermission(currentUser, "dashboard", "employees", action);
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
        fellow: {
          select: {
            id: true,
            name: true,
            schools: { include: { school: { select: { id: true, name: true } } } },
          },
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

    const body = await req.json();

    const data = {};
    for (const field of PERSONAL_FIELDS) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    if (body.dob !== undefined) data.dob = parseDate(body.dob);
    if (body.dateOfJoining !== undefined) data.dateOfJoining = parseDate(body.dateOfJoining);

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
        bankName: true,
        bankAccountNo: true,
        bankIfsc: true,
        dob: true,
        dateOfJoining: true,
        avatar: true,
        status: true,
        role: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email or Employee ID already in use" }, { status: 409 });
    }
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
