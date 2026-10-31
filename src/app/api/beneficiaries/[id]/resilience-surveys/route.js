import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBeneficiaryAccess } from "@/lib/beneficiaryApiAuth";
import { buildResilienceSurveyCreateData } from "@/lib/resilienceSurvey";

export async function GET(req, { params }) {
  const { id: beneficiaryId } = await params;

  const access = await requireBeneficiaryAccess(req, beneficiaryId, "READ");
  if (access.error) return access.error;

  try {
    const surveys = await prisma.resilienceSurvey.findMany({
      where: { beneficiaryId },
      orderBy: { surveyDate: "desc" },
    });

    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    console.error("Failed to fetch resilience surveys:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { id: beneficiaryId } = await params;

  const access = await requireBeneficiaryAccess(req, beneficiaryId, "WRITE");
  if (access.error) return access.error;

  try {
    const body = await req.json();
    const surveyData = buildResilienceSurveyCreateData(body);

    if (!surveyData) {
      return NextResponse.json({ success: false, error: "Survey responses are required" }, { status: 400 });
    }

    const newSurvey = await prisma.resilienceSurvey.create({
      data: {
        beneficiaryId,
        ...surveyData,
      },
    });

    return NextResponse.json({ success: true, data: newSurvey });
  } catch (error) {
    console.error("Failed to create resilience survey:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
