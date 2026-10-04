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

    const incidents = await prisma.disasterIncident.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: incidents });
  } catch (error) {
    console.error("Fetch incidents error:", error);
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
    const { name, location, type, active, expectedFamiliesAffected, humanLossDied, humanLossInjured, humanLossMissing, propertyLossEstimate } = body;

    if (!name || !location || !type) {
      return NextResponse.json({ error: "Name, Location, and Type are required" }, { status: 400 });
    }

    const incident = await prisma.disasterIncident.create({
      data: {
        name,
        location,
        type,
        active: active !== undefined ? active : true,
        expectedFamiliesAffected: expectedFamiliesAffected ? parseInt(expectedFamiliesAffected) : 0,
        humanLossDied: humanLossDied ? parseInt(humanLossDied) : 0,
        humanLossInjured: humanLossInjured ? parseInt(humanLossInjured) : 0,
        humanLossMissing: humanLossMissing ? parseInt(humanLossMissing) : 0,
        propertyLossEstimate: propertyLossEstimate ? parseFloat(propertyLossEstimate) : 0.0
      }
    });

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error) {
    console.error("Create incident error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
