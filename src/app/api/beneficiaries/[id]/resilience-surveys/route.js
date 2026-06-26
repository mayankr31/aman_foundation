import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id: beneficiaryId } = await params;

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

  try {
    const body = await req.json();
    const { responses, scores } = body;

    const newSurvey = await prisma.resilienceSurvey.create({
      data: {
        beneficiaryId,
        responses,
        lifeSatisfactionScore: scores?.lifeSatisfactionScore || 0,
        planningScore: scores?.planningScore || 0,
        disasterReadinessScore: scores?.disasterReadinessScore || 0,
        disasterBeliefsScore: scores?.disasterBeliefsScore || 0,
        disasterMindsetScore: scores?.disasterMindsetScore || 0,
        financialResilienceScore: scores?.financialResilienceScore || 0,
        healthResilienceScore: scores?.healthResilienceScore || 0,
        socialConnectednessScore: scores?.socialConnectednessScore || 0,
        socialProtectionScore: scores?.socialProtectionScore || 0,
        disasterWarningScore: scores?.disasterWarningScore || 0,
        vulnerabilityScore: scores?.vulnerabilityScore || 0,
        overallScore: scores?.overallScore || 0,
      },
    });

    // Update the beneficiary's main resilienceScore to the newest survey's overall score
    await prisma.beneficiary.update({
      where: { id: beneficiaryId },
      data: {
        resilienceScore: Math.round(scores?.overallScore || 0),
      },
    });

    return NextResponse.json({ success: true, data: newSurvey });
  } catch (error) {
    console.error("Failed to create resilience survey:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
