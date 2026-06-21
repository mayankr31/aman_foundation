import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const resourceNeeds = await prisma.incidentResourceNeed.findMany({
      include: {
        incident: true,
        resourceItem: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: resourceNeeds });
  } catch (error) {
    console.error("Fetch resource needs error:", error);
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
    const { incidentId, itemName, unit, quantityNeeded, quantityReceived, transactionsCount } = body;

    if (!incidentId || !itemName) {
      return NextResponse.json({ error: "Incident ID and Item Name are required" }, { status: 400 });
    }

    // Since resourceItemId is required by schema, we should find or create the resource item first.
    let resourceItem = await prisma.resourceItem.findUnique({
      where: { itemName }
    });

    if (!resourceItem) {
      resourceItem = await prisma.resourceItem.create({
        data: {
          itemName,
          unit: unit || "units",
          availableStock: quantityReceived ? parseFloat(quantityReceived) : 0,
          status: "Optimal"
        }
      });
    }

    const need = await prisma.incidentResourceNeed.create({
      data: {
        incidentId,
        resourceItemId: resourceItem.id,
        quantityNeeded: quantityNeeded ? parseFloat(quantityNeeded) : 0,
        quantityReceived: quantityReceived ? parseFloat(quantityReceived) : 0,
        transactionsCount: transactionsCount ? parseInt(transactionsCount) : 0
      }
    });

    return NextResponse.json({ success: true, data: need }, { status: 201 });
  } catch (error) {
    console.error("Create resource need error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

