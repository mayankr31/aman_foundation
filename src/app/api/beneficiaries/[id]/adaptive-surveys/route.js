import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id: beneficiaryId } = await params;

  try {
    const surveys = await prisma.adaptiveCapacitySurvey.findMany({
      where: { beneficiaryId },
      orderBy: { surveyDate: "desc" },
    });

    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    console.error("Error fetching adaptive capacity surveys:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch adaptive capacity surveys" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { id: beneficiaryId } = await params;

  try {
    const body = await req.json();
    const { responses, overallScore } = body;

    const survey = await prisma.adaptiveCapacitySurvey.create({
      data: {
        beneficiaryId,
        responses,
        overallScore,
      },
    });

    return NextResponse.json({ success: true, data: survey }, { status: 201 });
  } catch (error) {
    console.error("Error creating adaptive capacity survey:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create adaptive capacity survey" },
      { status: 500 }
    );
  }
}
