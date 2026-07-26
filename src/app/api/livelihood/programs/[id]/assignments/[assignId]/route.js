import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function PATCH(req, { params }) {
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

    const { assignId } = await params;
    const body = await req.json();
    const { attributes, notes } = body;

    const existing = await prisma.beneficiaryLivelihood.findUnique({
      where: { id: assignId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
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

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "PROGRAM_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assignId } = await params;

    const existing = await prisma.beneficiaryLivelihood.findUnique({
      where: { id: assignId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
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
