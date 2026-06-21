import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    const livestockItem = await prisma.livestock.findUnique({
      where: { id },
      include: {
        beneficiary: true,
        healthLogs: {
          orderBy: { checkupDate: "desc" }
        }
      }
    });

    if (!livestockItem) {
      return NextResponse.json({ error: "Livestock not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: livestockItem });
  } catch (error) {
    console.error("Fetch livestock detail error:", error);
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

    const existingLivestock = await prisma.livestock.findUnique({
      where: { id }
    });

    if (!existingLivestock) {
      return NextResponse.json({ error: "Livestock not found" }, { status: 404 });
    }

    const updatedLivestock = await prisma.livestock.update({
      where: { id },
      data: {
        tagNumber: body.tagNumber,
        animalType: body.animalType,
        breed: body.breed,
        ageMonths: body.ageMonths !== undefined ? parseInt(body.ageMonths) : undefined,
        healthStatus: body.healthStatus
      }
    });

    return NextResponse.json({ success: true, data: updatedLivestock });
  } catch (error) {
    console.error("Update livestock error:", error);
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

    const existingLivestock = await prisma.livestock.findUnique({
      where: { id }
    });

    if (!existingLivestock) {
      return NextResponse.json({ error: "Livestock not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated health logs
      await tx.livestockHealthLog.deleteMany({
        where: { livestockId: id }
      });

      // 2. Delete livestock record
      await tx.livestock.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Livestock deleted successfully" });
  } catch (error) {
    console.error("Delete livestock error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
