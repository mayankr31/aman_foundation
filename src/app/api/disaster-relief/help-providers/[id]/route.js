import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    const provider = await prisma.helpProvider.findUnique({
      where: { id },
      include: {
        incidents: {
          include: {
            incident: true
          }
        },
        donatedItems: true,
        receivedItems: true
      }
    });

    if (!provider) {
      return NextResponse.json({ error: "Help provider not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: provider });
  } catch (error) {
    console.error("Fetch help provider detail error:", error);
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

    const existingProvider = await prisma.helpProvider.findUnique({
      where: { id }
    });

    if (!existingProvider) {
      return NextResponse.json({ error: "Help provider not found" }, { status: 404 });
    }

    const updatedProvider = await prisma.helpProvider.update({
      where: { id },
      data: {
        name: body.name,
        capabilityType: body.capabilityType,
        contactDetails: body.contactDetails,
        status: body.status
      }
    });

    return NextResponse.json({ success: true, data: updatedProvider });
  } catch (error) {
    console.error("Update help provider error:", error);
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

    const existingProvider = await prisma.helpProvider.findUnique({
      where: { id }
    });

    if (!existingProvider) {
      return NextResponse.json({ error: "Help provider not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated incident assignments
      await tx.helpProviderIncident.deleteMany({
        where: { providerId: id }
      });

      // 2. Delete inventory logs related to this provider
      await tx.inventoryLedger.deleteMany({
        where: {
          OR: [
            { donorProviderId: id },
            { recipientProviderId: id }
          ]
        }
      });

      // 3. Delete provider record
      await tx.helpProvider.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Help provider deleted successfully" });
  } catch (error) {
    console.error("Delete help provider error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
