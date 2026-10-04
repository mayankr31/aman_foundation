import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin, isFellowManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

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
      include: {
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
            bankName: true,
            bankAccountNo: true,
            bankIfsc: true,
            dob: true,
            dateOfJoining: true,
            avatar: true,
          },
        },
        schools: { include: { school: { select: { id: true, name: true, location: true, status: true } } } },
        students: true,
        goalSheets: {
          orderBy: { date: "desc" }
        }
      }
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

    const updatedFellow = await prisma.fellow.update({
      where: { id: fellowId },
      data: {
        name: body.name,
        dob: body.dob ? new Date(body.dob) : undefined,
        gender: body.gender,
        email: body.email,
        phone: body.phone,
        address: body.address,
        avatar: body.avatar,
        progress: body.progress !== undefined ? parseInt(body.progress) : undefined,
        evaluationRating: body.evaluationRating !== undefined ? parseFloat(body.evaluationRating) : undefined,
        userId: body.userId
      }
    });

    return NextResponse.json({ success: true, data: updatedFellow });
  } catch (error) {
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
