import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const providers = await prisma.helpProvider.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: providers });
  } catch (error) {
    console.error("Fetch help providers error:", error);
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
    const { name, capabilityType, contactDetails, status } = body;

    if (!name || !capabilityType || !contactDetails) {
      return NextResponse.json({ error: "Name, Capability Type, and Contact Details are required" }, { status: 400 });
    }

    const provider = await prisma.helpProvider.create({
      data: {
        name,
        capabilityType,
        contactDetails,
        status: status || "Active"
      }
    });

    return NextResponse.json({ success: true, data: provider }, { status: 201 });
  } catch (error) {
    console.error("Create help provider error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
