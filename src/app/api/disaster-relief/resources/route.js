import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

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

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
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
