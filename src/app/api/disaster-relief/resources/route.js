import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    const resources = await prisma.resourceItem.findMany({
      orderBy: { itemName: "asc" }
    });

    return NextResponse.json({ success: true, data: resources });
  } catch (error) {
    console.error("Fetch resources error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const body = await req.json();
    const { itemName, availableStock, unit, status } = body;

    if (!itemName || !unit) {
      return NextResponse.json({ error: "Item Name and Unit are required" }, { status: 400 });
    }

    const resource = await prisma.resourceItem.create({
      data: {
        itemName,
        availableStock: availableStock ? parseFloat(availableStock) : 0.0,
        unit,
        status: status || "Optimal"
      }
    });

    return NextResponse.json({ success: true, data: resource }, { status: 201 });
  } catch (error) {
    console.error("Create resource error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
