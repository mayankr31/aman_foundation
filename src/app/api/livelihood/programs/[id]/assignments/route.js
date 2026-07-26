import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER" &&
      user.role.name !== "FELLOW"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: programId } = await params;
    const body = await req.json();
    const { beneficiaryId, attributes, notes } = body;

    if (!beneficiaryId) {
      return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
    }

    const program = await prisma.livelihoodProgram.findUnique({
      where: { id: programId },
    });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });
    if (!beneficiary) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    // Check for existing assignment (upsert)
    const existing = await prisma.beneficiaryLivelihood.findFirst({
      where: { beneficiaryId, programId },
    });

    let result;
    if (existing) {
      result = await prisma.beneficiaryLivelihood.update({
        where: { id: existing.id },
        data: {
          attributes: attributes || existing.attributes,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });
    } else {
      result = await prisma.beneficiaryLivelihood.create({
        data: {
          beneficiaryId,
          programId,
          attributes: attributes || {},
          notes: notes || null,
        },
      });
    }

    return NextResponse.json(
      { success: true, data: result, isUpdate: !!existing },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error("Create/update assignment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
