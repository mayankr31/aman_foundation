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

    const distributions = await prisma.reliefDistribution.findMany({
      include: {
        incident: true,
        handledByUser: { select: { id: true, name: true } },
        items: {
          include: {
            resourceItem: true,
            incidentResourceNeed: true
          }
        }
      },
      orderBy: { distributedAt: "desc" }
    });

    return NextResponse.json({ success: true, data: distributions });
  } catch (error) {
    console.error("Fetch relief distributions error:", error);
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
    const {
      incidentId,
      name,
      aadhar,
      mobNumber,
      address,
      familySize,
      notes,
      items
    } = body;

    if (!incidentId || !name) {
      return NextResponse.json({ error: "Calamity and Recipient Name are required" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one aid item is required" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.resourceItemId || !item.itemName) {
        return NextResponse.json({ error: "Each aid item must reference a resource" }, { status: 400 });
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: `Quantity for ${item.itemName} must be a positive number` }, { status: 400 });
      }
    }

    const distribution = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const qty = parseFloat(item.quantity);

        const resource = await tx.resourceItem.findUnique({
          where: { id: item.resourceItemId }
        });

        if (!resource) {
          throw new Error(`Resource item not found: ${item.itemName}`);
        }

        if (resource.availableStock < qty) {
          throw new Error(`Insufficient stock for ${resource.itemName}: only ${resource.availableStock} ${resource.unit} available.`);
        }

        await tx.resourceItem.update({
          where: { id: item.resourceItemId },
          data: { availableStock: { decrement: qty } }
        });

        if (item.incidentResourceNeedId) {
          await tx.incidentResourceNeed.update({
            where: { id: item.incidentResourceNeedId },
            data: {
              quantityDistributed: { increment: qty },
              transactionsCount: { increment: 1 }
            }
          });
        }
      }

      return tx.reliefDistribution.create({
        data: {
          incidentId,
          name,
          aadhar: aadhar || null,
          mobNumber: mobNumber || null,
          address: address || null,
          familySize: familySize ? parseInt(familySize) : 1,
          notes: notes || null,
          handledByUserId: user.id,
          items: {
            create: items.map((it) => ({
              incidentResourceNeedId: it.incidentResourceNeedId || null,
              resourceItemId: it.resourceItemId || null,
              itemName: it.itemName,
              unit: it.unit || "units",
              quantity: parseFloat(it.quantity),
              notes: it.notes || null
            }))
          }
        },
        include: {
          incident: true,
          handledByUser: { select: { id: true, name: true } },
          items: {
            include: {
              resourceItem: true,
              incidentResourceNeed: true
            }
          }
        }
      });
    });

    return NextResponse.json({ success: true, data: distribution }, { status: 201 });
  } catch (error) {
    console.error("Create relief distribution error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
