import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { type, id } = await params;

    if (type === "sugarcane") {
      const program = await prisma.sugarcaneProgram.findUnique({
        where: { id },
        include: {
          beneficiaries: {
            include: {
              beneficiary: true
            }
          }
        }
      });
      if (!program) return NextResponse.json({ error: "Not Found" }, { status: 404 });
      return NextResponse.json({ success: true, data: program });
    } else if (type === "goat-rearing" || type === "goat") {
      const program = await prisma.goatRearingProgram.findUnique({
        where: { id },
        include: {
          beneficiaries: {
            include: {
              beneficiary: true,
              events: {
                orderBy: { eventDate: "desc" }
              }
            }
          }
        }
      });
      if (!program) return NextResponse.json({ error: "Not Found" }, { status: 404 });
      return NextResponse.json({ success: true, data: program });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error(`Fetch program error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
