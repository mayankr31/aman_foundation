import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role?.name !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can delete records" },
        { status: 403 }
      );
    }

    const { id: beneficiaryId, planId } = await params;
    const plan = await prisma.solutionPlan.findFirst({
      where: { id: planId, beneficiaryId },
    });
    if (!plan) {
      return NextResponse.json({ error: "Solution plan not found" }, { status: 404 });
    }

    await prisma.solutionPlan.delete({ where: { id: planId } });
    return NextResponse.json({ success: true, message: "Solution plan deleted" });
  } catch (err) {
    console.error("Failed to delete solution plan:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
