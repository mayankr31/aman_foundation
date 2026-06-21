import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    const resource = await prisma.resourceItem.findUnique({
      where: { id },
      include: {
        ledgerTransactions: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: resource });
  } catch (error) {
    console.error("Fetch resource detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existingResource = await prisma.resourceItem.findUnique({
      where: { id }
    });

    if (!existingResource) {
      return NextResponse.json({ error: "Resource item not found" }, { status: 404 });
    }

    const updatedResource = await prisma.resourceItem.update({
      where: { id },
      data: {
        itemName: body.itemName,
        availableStock: body.availableStock !== undefined ? parseFloat(body.availableStock) : undefined,
        unit: body.unit,
        status: body.status
      }
    });

    return NextResponse.json({ success: true, data: updatedResource });
  } catch (error) {
    console.error("Update resource error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;

    const existingResource = await prisma.resourceItem.findUnique({
      where: { id }
    });

    if (!existingResource) {
      return NextResponse.json({ error: "Resource item not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated ledger transactions
      await tx.inventoryLedger.deleteMany({
        where: { resourceItemId: id }
      });

      // 2. Delete resource record
      await tx.resourceItem.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Resource item deleted successfully" });
  } catch (error) {
    console.error("Delete resource error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
