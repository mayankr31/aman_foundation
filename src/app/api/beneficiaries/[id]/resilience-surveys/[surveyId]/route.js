import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "FELLOW" &&
      !PROGRAM_ROLES.includes(user.role.name)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { surveyId } = await params;
    const body = await req.json();
    const { responses, scores } = body;

    const existing = await prisma.resilienceSurvey.findUnique({ where: { id: surveyId } });
    if (!existing) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const data = {};
    if (responses !== undefined) data.responses = responses;
    if (scores && Object.keys(scores).length > 0) {
      data.lifeSatisfactionScore = scores.lifeSatisfactionScore || 0;
      data.planningScore = scores.planningScore || 0;
      data.disasterReadinessScore = scores.disasterReadinessScore || 0;
      data.disasterBeliefsScore = scores.disasterBeliefsScore || 0;
      data.disasterMindsetScore = scores.disasterMindsetScore || 0;
      data.financialResilienceScore = scores.financialResilienceScore || 0;
      data.healthResilienceScore = scores.healthResilienceScore || 0;
      data.socialConnectednessScore = scores.socialConnectednessScore || 0;
      data.socialProtectionScore = scores.socialProtectionScore || 0;
      data.disasterWarningScore = scores.disasterWarningScore || 0;
      data.vulnerabilityScore = scores.vulnerabilityScore || 0;
      data.overallScore = scores.overallScore || 0;
    }

    const updated = await prisma.resilienceSurvey.update({
      where: { id: surveyId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update resilience survey error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "FELLOW" &&
      !PROGRAM_ROLES.includes(user.role.name)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { surveyId } = await params;
    const existing = await prisma.resilienceSurvey.findUnique({ where: { id: surveyId } });
    if (!existing) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    await prisma.resilienceSurvey.delete({ where: { id: surveyId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete resilience survey error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
