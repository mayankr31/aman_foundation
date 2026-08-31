import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id } = await params;
  const { user, error } = await authenticateUser(req);
  if (error) return error;

  try {
    const fellow = await prisma.fellow.findUnique({
      where: { id },
    });

    if (!fellow) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (user.role.name !== "ADMIN" && user.id !== fellow.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const surveys = await prisma.lookBeyondSurvey.findMany({
      where: { fellowId: id },
      orderBy: { surveyDate: "desc" },
    });
    return NextResponse.json({ success: true, data: surveys });
  } catch (err) {
    console.error("Failed to fetch look beyond surveys:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const { user, error } = await authenticateUser(req);
  if (error) return error;

  try {
    const fellow = await prisma.fellow.findUnique({
      where: { id },
    });

    if (!fellow) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (user.role.name !== "ADMIN" && user.id !== fellow.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { surveyDate, responses } = body;

    if (!surveyDate || !responses) {
      return NextResponse.json({ error: "surveyDate and responses are required" }, { status: 400 });
    }

    const newSurvey = await prisma.lookBeyondSurvey.create({
      data: {
        fellowId: id,
        surveyDate: new Date(surveyDate),
        responses,
      },
    });

    return NextResponse.json({ success: true, data: newSurvey });
  } catch (err) {
    console.error("Failed to create look beyond survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
