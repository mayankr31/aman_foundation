import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const ledger = await prisma.inventoryLedger.findMany({
      include: {
        resourceItem: true,
        handledByUser: {
          select: { id: true, name: true }
        },
        incidentResourceNeed: {
          include: {
            incident: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: ledger });
  } catch (error) {
    console.error("Fetch ledger logs error:", error);
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
    const {
      resourceItemId,
      transactionType,
      quantity,
      incidentResourceNeedId,
      notes
    } = body;

    if (!resourceItemId || !transactionType || !quantity) {
      return NextResponse.json({ error: "Resource Item, Transaction Type, and Quantity are required" }, { status: 400 });
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }

    const ledgerEntry = await prisma.$transaction(async (tx) => {
      const resource = await tx.resourceItem.findUnique({
        where: { id: resourceItemId }
      });

      if (!resource) {
        throw new Error("Resource Item not found");
      }

      if (transactionType === "OUT" && resource.availableStock < numQty) {
        throw new Error(`Insufficient stock: Only ${resource.availableStock} ${resource.unit} available.`);
      }

      const stockAdjustment = transactionType === "IN" ? numQty : -numQty;
      await tx.resourceItem.update({
        where: { id: resourceItemId },
        data: {
          availableStock: {
            increment: stockAdjustment
          }
        }
      });

      if (incidentResourceNeedId) {
        await tx.incidentResourceNeed.update({
          where: { id: incidentResourceNeedId },
          data: {
            quantityReceived: { increment: numQty },
            transactionsCount: { increment: 1 }
          }
        });
      }

      return await tx.inventoryLedger.create({
        data: {
          resourceItemId,
          transactionType,
          quantity: numQty,
          incidentResourceNeedId,
          notes,
          handledByUserId: user.id
        }
      });
    });

    return NextResponse.json({ success: true, data: ledgerEntry }, { status: 201 });
  } catch (error) {
    console.error("Create ledger transaction error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
