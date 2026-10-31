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
    const survey = await prisma.absorptiveCapacitySurvey.findFirst({
      where: { id: surveyId, beneficiaryId },
    });
    if (!survey) {
      return NextResponse.json({ error: "Absorptive capacity survey not found" }, { status: 404 });
    }

    await prisma.absorptiveCapacitySurvey.delete({ where: { id: surveyId } });
    return NextResponse.json({ success: true, message: "Absorptive capacity survey deleted" });
  } catch (err) {
    console.error("Failed to delete absorptive capacity survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
