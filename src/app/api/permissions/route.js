import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { page: "asc" },
        { action: "asc" }
      ]
    });

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error("Fetch permissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const body = await req.json();
    const { app, page, action } = body;

    if (!app || !page || !action) {
      return NextResponse.json({ error: "app, page, and action are required" }, { status: 400 });
    }

    if (!["READ", "WRITE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newPermission = await prisma.permission.create({
      data: { app, page, action },
    });

    return NextResponse.json({ success: true, data: newPermission }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Permission already exists" }, { status: 409 });
    }
    console.error("Create permission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
