import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    const { id } = await context.params;

    const distribution = await prisma.reliefDistribution.findUnique({
      where: { id },
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

    if (!distribution) {
      return NextResponse.json({ error: "Relief distribution not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: distribution });
  } catch (error) {
    console.error("Fetch relief distribution detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.reliefDistribution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Relief distribution not found" }, { status: 404 });
    }

    const updated = await prisma.reliefDistribution.update({
      where: { id },
      data: {
        name: body.name,
        aadhar: body.aadhar,
        mobNumber: body.mobNumber,
        address: body.address,
        familySize: body.familySize !== undefined ? parseInt(body.familySize) || 1 : undefined,
        notes: body.notes
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update relief distribution error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "disaster-relief", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for disaster-relief" }, { status: 403 });
    }

    if (user.role.name !== "ADMIN" && !PROGRAM_ROLES.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.reliefDistribution.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Relief distribution not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        if (item.resourceItemId) {
          const resource = await tx.resourceItem.findUnique({ where: { id: item.resourceItemId } });
          if (resource) {
            await tx.resourceItem.update({
              where: { id: item.resourceItemId },
              data: { availableStock: { increment: item.quantity } }
            });
          }
        }
        if (item.incidentResourceNeedId) {
          const need = await tx.incidentResourceNeed.findUnique({ where: { id: item.incidentResourceNeedId } });
          if (need) {
            await tx.incidentResourceNeed.update({
              where: { id: item.incidentResourceNeedId },
              data: {
                quantityDistributed: { decrement: item.quantity },
                transactionsCount: { decrement: 1 }
              }
            });
          }
        }
      }

      await tx.reliefDistribution.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Relief distribution deleted successfully" });
  } catch (error) {
    console.error("Delete relief distribution error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
