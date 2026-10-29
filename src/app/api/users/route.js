import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getHierarchyScopedUserIds } from "@/lib/hierarchy";
import { checkPermission } from "@/lib/permissions";
import { generateEmployeeId } from "@/lib/employeeId";
import { isManagerRoleAllowed } from "@/lib/roleHierarchy";
import {
  validatePersonName,
  validateEmail,
  validateMobile,
  validatePassword,
  validateRequired,
  firstError,
  normalizeMobileForSave,
  normalizeEmailForSave,
} from "@/lib/validation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "employees", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for employees" }, { status: 403 });
    }

    const isAdmin = user.role.name === "ADMIN";
    const isHr = user.role.name === "HR";
    const isPm = PROGRAM_ROLES.includes(user.role.name);

    if (!isAdmin && !isHr && !isPm) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const rolesFilter = searchParams.get("roles");
    const rolesList = rolesFilter
      ? rolesFilter.split(",").map((r) => r.trim()).filter(Boolean)
      : null;

    // Program staff only see themselves and users below them in the
    // Reports To hierarchy (with the legacy assignment scope as a fallback).
    let scopeWhere;
    if (isPm) {
      const team = (await getHierarchyScopedUserIds(user, { includeSelf: true })) || [];
      scopeWhere = { id: { in: team.length ? team : [user.id] } };
    }

    const roleWhere = rolesList?.length
      ? { role: { name: { in: rolesList } } }
      : roleFilter
      ? { role: { name: roleFilter } }
      : null;

    const where = {
      ...(scopeWhere || {}),
      ...(roleWhere || {}),
    };

    const users = await prisma.user.findMany({
      where: Object.keys(where).length ? where : undefined,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        mobile: true,
        status: true,
        department: true,
        employeeId: true,
        inactiveSince: true,
        dateOfLeaving: true,
        avatar: true,
        createdById: true,
        roleId: true,
        managerId: true,
        manager: { select: { id: true, name: true, role: { select: { name: true } } } },
        role: {
          select: {
            id: true,
            name: true,
          }
        },
        fellow: { select: { id: true } },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ADMIN-only: create a user account directly (skips the approval queue).
export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, roleId, mobile, managerId, department } = body;

    // Basic validation
    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const validationMessage = firstError([
      validatePersonName(name, { required: true }),
      validateEmail(email, { required: true }),
      validateMobile(mobile, { required: true }),
      validatePassword(password, { required: true }),
      validateRequired(department, "Department"),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const normalizedEmail = normalizeEmailForSave(email);

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
    }

    // Auto-generate a unique username from the email
    const baseUsername = normalizedEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let username = baseUsername;
    let counter = 1;
    while (true) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (!existingUsername) break;
      username = `${baseUsername}${counter}`;
      counter++;
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
      if (!isManagerRoleAllowed(role.name, manager.role?.name)) {
        return NextResponse.json(
          { error: "Selected manager must be senior to this employee" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employeeId = await generateEmployeeId();

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username,
        email: normalizedEmail,
        password: hashedPassword,
        mobile: normalizeMobileForSave(mobile),
        roleId,
        department: String(department).trim(),
        employeeId,
        managerId: managerId || null,
        status: "ACTIVE",
        createdById: user.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        mobile: true,
        status: true,
        department: true,
        employeeId: true,
        avatar: true,
        createdById: true,
        createdAt: true,
        managerId: true,
        manager: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
