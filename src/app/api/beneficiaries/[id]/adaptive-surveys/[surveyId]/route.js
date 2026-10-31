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

    const { id: beneficiaryId, surveyId } = await params;
    const survey = await prisma.adaptiveCapacitySurvey.findFirst({
      where: { id: surveyId, beneficiaryId },
    });
    if (!survey) {
      return NextResponse.json({ error: "Adaptive capacity survey not found" }, { status: 404 });
    }

    await prisma.adaptiveCapacitySurvey.delete({ where: { id: surveyId } });
    return NextResponse.json({ success: true, message: "Adaptive capacity survey deleted" });
  } catch (err) {
    console.error("Failed to delete adaptive capacity survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
