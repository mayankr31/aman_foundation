import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const sugarcanePrograms = await prisma.sugarcaneProgram.findMany({
      orderBy: { name: "asc" }
    });

    const goatRearingPrograms = await prisma.goatRearingProgram.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      success: true,
      data: {
        sugarcanePrograms,
        goatRearingPrograms
      }
    });
  } catch (error) {
    console.error("Fetch livelihood programs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const body = await req.json();
    const { type, name, description, totalLandHectares, totalGoats } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    let program;
    if (type.toLowerCase() === "sugarcane") {
      program = await prisma.sugarcaneProgram.create({
        data: {
          name,
          description,
          totalLandHectares: totalLandHectares ? parseFloat(totalLandHectares) : 0.0
        }
      });
    } else if (type.toLowerCase() === "goat") {
      program = await prisma.goatRearingProgram.create({
        data: {
          name,
          description,
          totalGoats: totalGoats ? parseInt(totalGoats) : 0
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid program type. Must be 'sugarcane' or 'goat'" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: program }, { status: 201 });
  } catch (error) {
    console.error("Create livelihood program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
