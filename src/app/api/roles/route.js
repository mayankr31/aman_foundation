import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { buildRoleCode, formatRoleLabel } from "@/lib/roles";
import { DEFAULT_CUSTOM_ROLE_RANK } from "@/lib/roleHierarchy";

function parseRank(value) {
  if (value === undefined || value === null || value === "") {
    return { rank: DEFAULT_CUSTOM_ROLE_RANK };
  }
  const rank = Number(value);
  if (!Number.isInteger(rank) || rank < 0) {
    return { error: "Seniority must be a whole number of 0 or higher" };
  }
  return { rank };
}

async function findDuplicateLabel(displayName, excludeId) {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, displayName: true },
  });
  const target = displayName.toLowerCase();
  return roles.find(
    (role) =>
      role.id !== excludeId &&
      formatRoleLabel(role).toLowerCase() === target
  );
}

// Public GET to load roles for register dropdown
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const roles = await prisma.role.findMany({
      where: all ? {} : { displayInRegister: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        rank: true,
        description: true,
        displayInRegister: true,
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error("Fetch roles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Restricted POST to create new roles (ADMIN only)
export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const body = await req.json();
    // `name` is accepted for backwards compatibility, but it now means the
    // display label. The internal stable code is generated below.
    const displayName = String(body.displayName ?? body.name ?? "").trim();
    const description =
      body.description === undefined || body.description === null
        ? null
        : String(body.description).trim() || null;
    const { rank, error: rankError } = parseRank(body.rank);

    if (!displayName) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }
    if (displayName.length > 80) {
      return NextResponse.json(
        { error: "Role name must be 80 characters or fewer" },
        { status: 400 }
      );
    }
    if (rankError) {
      return NextResponse.json({ error: rankError }, { status: 400 });
    }

    if (await findDuplicateLabel(displayName)) {
      return NextResponse.json({ error: "Role already exists" }, { status: 409 });
    }

    const existingRoles = await prisma.role.findMany({ select: { name: true } });
    const internalName = buildRoleCode(
      displayName,
      existingRoles.map((role) => role.name)
    );

    const newRole = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: internalName,
          displayName,
          rank,
          description,
          displayInRegister: body.displayInRegister ?? true,
        },
      });

      // Every role gets access to its own attendance logs by default. Admins
      // can still remove it from Role Permissions if needed.
      const attendanceRead = await tx.permission.findFirst({
        where: { app: "dashboard", page: "attendance", action: "READ" },
        select: { id: true },
      });
      if (attendanceRead) {
        await tx.rolePermission.create({
          data: { roleId: role.id, permissionId: attendanceRead.id },
        });
      }

      return role;
    });

    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Role already exists" }, { status: 409 });
    }
    console.error("Create role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
