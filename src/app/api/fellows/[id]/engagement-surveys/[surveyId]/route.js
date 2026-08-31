import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id: fellowId, surveyId } = await params;
  const { user, error } = await authenticateUser(req);
  if (error) return error;

  try {
    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId },
    });

    if (!fellow) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (user.role.name !== "ADMIN" && user.id !== fellow.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const survey = await prisma.engagementSurvey.findFirst({
      where: { id: surveyId, fellowId },
    });

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (err) {
    console.error("Failed to fetch engagement survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
