import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isLivelihoodProgramManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import { isProgramStaffRole } from "@/lib/roles";


export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }


    const { id: programId } = await params;
    const body = await req.json();
    const { beneficiaryId } = body;

    if (!beneficiaryId) {
      return NextResponse.json({ error: "beneficiaryId is required" }, { status: 400 });
    }

    const program = await prisma.livelihoodProgram.findUnique({
      where: { id: programId },
      include: { components: { orderBy: { order: "asc" } } },
    });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const allowedTypeKeys = new Set(
      program.components.length > 0
        ? program.components.map((c) => c.typeKey)
        : [program.type]
    );
    const defaultTypeKey =
      program.components.length > 0 ? program.components[0].typeKey : program.type;

    // Accept either a single assignment (backward compatible) or a list of
    // component assignments so a participant can be enrolled in several
    // components of the same program at once.
    const items = Array.isArray(body.components)
      ? body.components
      : [
          {
            typeKey: body.typeKey || defaultTypeKey,
            attributes: body.attributes,
            notes: body.notes,
          },
        ];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Select at least one activity to enroll the participant in" },
        { status: 400 }
      );
    }

    const invalid = items.find(
      (item) => item.typeKey && !allowedTypeKeys.has(item.typeKey)
    );
    if (invalid) {
      return NextResponse.json(
        { error: `"${invalid.typeKey}" is not a component of this program` },
        { status: 400 }
      );
    }

    if (isProgramStaffRole(user?.role?.name) && !(await isLivelihoodProgramManaged(user.id, programId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });
    if (!beneficiary) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const results = [];
    let anyUpdate = false;

    for (const item of items) {
      const typeKey = item.typeKey || defaultTypeKey;
      const existing = await prisma.beneficiaryLivelihood.findFirst({
        where: { beneficiaryId, programId, typeKey },
      });

      if (existing) {
        anyUpdate = true;
        const updated = await prisma.beneficiaryLivelihood.update({
          where: { id: existing.id },
          data: {
            attributes: item.attributes || existing.attributes,
            notes: item.notes !== undefined ? item.notes : existing.notes,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.beneficiaryLivelihood.create({
          data: {
            beneficiaryId,
            programId,
            typeKey,
            attributes: item.attributes || {},
            notes: item.notes || null,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: Array.isArray(body.components) ? results : results[0],
        isUpdate: anyUpdate,
      },
      { status: anyUpdate ? 200 : 201 }
    );
  } catch (error) {
    console.error("Create/update assignment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
