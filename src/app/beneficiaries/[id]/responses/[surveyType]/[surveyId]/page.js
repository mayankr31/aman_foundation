import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ResponseViewerClient from "./ResponseViewerClient";

export default async function SurveyResponsePage({ params }) {
  const { id, surveyType, surveyId } = await params;

  let surveyData = null;

  try {
    if (surveyType === "kyr") {
      surveyData = await prisma.resilienceSurvey.findUnique({ where: { id: surveyId } });
    } else if (surveyType === "adaptive") {
      surveyData = await prisma.adaptiveCapacitySurvey.findUnique({ where: { id: surveyId } });
    } else if (surveyType === "absorptive") {
      surveyData = await prisma.absorptiveCapacitySurvey.findUnique({ where: { id: surveyId } });
    } else if (surveyType === "transformative") {
      surveyData = await prisma.transformativeCapacitySurvey.findUnique({ where: { id: surveyId } });
    } else if (surveyType === "vulnerability") {
      surveyData = await prisma.vulnerabilitySurvey.findUnique({ where: { id: surveyId } });
    } else if (surveyType === "solution-plan") {
      surveyData = await prisma.solutionPlan.findUnique({ where: { id: surveyId } });
    }
  } catch (error) {
    console.error("Error fetching survey:", error);
  }

  if (!surveyData) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/beneficiaries/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Profile
      </Link>
      <ResponseViewerClient surveyType={surveyType} surveyData={surveyData} beneficiaryId={id} />
    </div>
  );
}
