import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isLivelihoodProgramManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import { isProgramStaffRole } from "@/lib/roles";


export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }


    const { assignId } = await params;
    const body = await req.json();
    const { attributes, notes } = body;

    const existing = await prisma.beneficiaryLivelihood.findUnique({
      where: { id: assignId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (
      isProgramStaffRole(user?.role?.name) &&
      !(await isLivelihoodProgramManaged(user.id, existing.programId))
    ) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    const updateData = {};
    if (attributes !== undefined) updateData.attributes = attributes;
    if (notes !== undefined) updateData.notes = notes;

    const result = await prisma.beneficiaryLivelihood.update({
      where: { id: assignId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Update assignment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }


    const { assignId } = await params;

    const existing = await prisma.beneficiaryLivelihood.findUnique({
      where: { id: assignId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (
      isProgramStaffRole(user?.role?.name) &&
      !(await isLivelihoodProgramManaged(user.id, existing.programId))
    ) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    await prisma.beneficiaryLivelihood.delete({ where: { id: assignId } });

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
