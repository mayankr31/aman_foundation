import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

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
    const { name, description, displayInRegister } = body;

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Convert name to uppercase uppercase tracking e.g. "PROGRAM_MANAGER"
    const uppercaseName = name.trim().toUpperCase().replace(/[\s-]/g, "_");

    const newRole = await prisma.role.create({
      data: {
        name: uppercaseName,
        description,
        displayInRegister: displayInRegister ?? true,
      }
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
