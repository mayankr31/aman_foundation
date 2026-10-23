import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getFellowIdByUserId } from "@/lib/scope";
import {
  validateEmail,
  validateMobile,
  firstError,
  normalizeEmailForSave,
  normalizeMobileForSave,
} from "@/lib/validation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const where = {};
    if (user.role.name === "FELLOW") {
      where.fellows = {
        some: {
          fellow: { userId: user.id }
        }
      };
    } else if (PROGRAM_ROLES.includes(user.role.name)) {
      where.programManagers = {
        some: { userId: user.id }
      };
    }

    const schools = await prisma.school.findMany({
      where,
      include: {
        _count: {
          select: { programs: true, students: true, fellows: true }
        }
      },
      orderBy: { name: "asc" }
    });

    const mappedSchools = schools.map((s) => ({
      ...s,
      programs: s._count.programs,
      enrolled: s._count.students,
      fellowsCount: s._count.fellows
    }));

    return NextResponse.json({ success: true, data: mappedSchools });
  } catch (error) {
    console.error("Fetch schools error:", error);
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
    const isFellow = user.role.name === "FELLOW";
    if (!isAdmin && !isFellow) {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access only" }, { status: 403 });
    }

    let fellowProfileId = null;
    if (isFellow) {
      fellowProfileId = await getFellowIdByUserId(user.id);
      if (!fellowProfileId) {
        return NextResponse.json({ error: "Forbidden: Fellow profile not found" }, { status: 403 });
      }
    }

    const body = await req.json();
    const {
      name,
      principalName,
      udiseCode,
      email,
      phone,
      address,
      location,
      status,
      latitude,
      longitude,
      mapUrl,
      img
    } = body;

    if (!name) {
      return NextResponse.json({ error: "School name is required" }, { status: 400 });
    }

    const validationMessage = firstError([
      validateEmail(email),
      validateMobile(phone),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const school = await prisma.$transaction(async (tx) => {
      const created = await tx.school.create({
        data: {
          name,
          principalName,
          udiseCode,
          email: normalizeEmailForSave(email),
          phone: normalizeMobileForSave(phone),
          address,
          location,
          status: status || "Active",
          latitude,
          longitude,
          mapUrl,
          img
        }
      });

      // Fellows are scoped to their assigned schools, so link the creator
      // immediately; otherwise the school would be invisible to them.
      if (fellowProfileId) {
        await tx.fellowSchool.create({
          data: { fellowId: fellowProfileId, schoolId: created.id }
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: school }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A school with this name already exists" }, { status: 409 });
    }
    console.error("Create school error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
