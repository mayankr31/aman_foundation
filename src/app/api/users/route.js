import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedTeamUserIds } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

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

    // Program Managers only see their team (fellows of assigned schools/centres).
    let scopeWhere;
    if (isPm) {
      const team = await getManagedTeamUserIds(user.id);
      scopeWhere = { id: { in: team } };
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
        avatar: true,
        createdById: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        },
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
    const { name, email, password, roleId, mobile } = body;

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

    const normalizedEmail = email.trim().toLowerCase();

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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username,
        email: normalizedEmail,
        password: hashedPassword,
        mobile: mobile || null,
        roleId,
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
        avatar: true,
        createdById: true,
        createdAt: true,
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
