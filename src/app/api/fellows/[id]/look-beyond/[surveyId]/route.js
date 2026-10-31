import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  return fellow ? fellow.id : null;
}

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

    const { id, surveyId } = await params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const survey = await prisma.lookBeyondSurvey.findFirst({
      where: { id: surveyId, fellowId },
    });
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    await prisma.lookBeyondSurvey.delete({ where: { id: surveyId } });
    return NextResponse.json({ success: true, message: "Look Beyond survey deleted" });
  } catch (err) {
    console.error("Failed to delete Look Beyond survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
