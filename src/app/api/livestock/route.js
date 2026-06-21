import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const healthStatus = searchParams.get("healthStatus");

    const where = {};
    if (healthStatus && healthStatus !== "All") where.healthStatus = healthStatus;

    const livestock = await prisma.livestock.findMany({
      where,
      include: {
        beneficiary: {
          select: { id: true, name: true }
        }
      },
      orderBy: { tagNumber: "asc" }
    });

    return NextResponse.json({ success: true, data: livestock });
  } catch (error) {
    console.error("Fetch livestock error:", error);
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
    const { beneficiaryId, tagNumber, animalType, breed, ageMonths, healthStatus } = body;

    if (!beneficiaryId || !tagNumber || !animalType) {
      return NextResponse.json({ error: "Beneficiary ID, Tag Number, and Animal Type are required" }, { status: 400 });
    }

    const livestockItem = await prisma.livestock.create({
      data: {
        beneficiaryId,
        tagNumber,
        animalType,
        breed,
        ageMonths: ageMonths ? parseInt(ageMonths) : null,
        healthStatus: healthStatus || "Healthy"
      }
    });

    return NextResponse.json({ success: true, data: livestockItem }, { status: 201 });
  } catch (error) {
    console.error("Create livestock error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
