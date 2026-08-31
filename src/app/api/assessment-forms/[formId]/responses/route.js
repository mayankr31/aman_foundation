import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { formId } = await context.params;
    const { isEnrolledInSchool, reasonNotEnrolled, subjectResponses, flnScores, selAnswers } = await req.json();

    const existing = await prisma.AssessmentForm.findUnique({ where: { id: formId } });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (isEnrolledInSchool !== undefined || reasonNotEnrolled !== undefined) {
        await tx.AssessmentForm.update({
          where: { id: formId },
          data: {
            isEnrolledInSchool: isEnrolledInSchool !== undefined ? isEnrolledInSchool : undefined,
            reasonNotEnrolled: reasonNotEnrolled !== undefined ? reasonNotEnrolled : undefined
          }
        });
      }

      if (subjectResponses && Array.isArray(subjectResponses)) {
        for (const sr of subjectResponses) {
          if (!sr.subjectTemplateId) continue;
          await tx.SubjectAssessmentResponse.upsert({
            where: {
              assessmentFormId_subjectTemplateId: {
                assessmentFormId: formId,
                subjectTemplateId: sr.subjectTemplateId
              }
            },
            update: { selectedOption: sr.selectedOption },
            create: {
              assessmentFormId: formId,
              subjectTemplateId: sr.subjectTemplateId,
              selectedOption: sr.selectedOption
            }
          });
        }
      }

      if (flnScores && typeof flnScores === "object") {
        for (const [flnQuestionId, score] of Object.entries(flnScores)) {
          await tx.FLNResponse.upsert({
            where: {
              assessmentFormId_flnQuestionId: {
                assessmentFormId: formId,
                flnQuestionId
              }
            },
            update: { score: parseFloat(score) },
            create: {
              assessmentFormId: formId,
              flnQuestionId,
              score: parseFloat(score)
            }
          });
        }
      }

      if (selAnswers && typeof selAnswers === "object") {
        for (const [selQuestionId, answer] of Object.entries(selAnswers)) {
          await tx.SELResponse.upsert({
            where: {
              assessmentFormId_selQuestionId: {
                assessmentFormId: formId,
                selQuestionId
              }
            },
            update: { answer },
            create: {
              assessmentFormId: formId,
              selQuestionId,
              answer
            }
          });
        }
      }
    });

    const updated = await prisma.AssessmentForm.findUnique({
      where: { id: formId },
      include: {
        fellow: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
        enrollmentResponses: true,
        subjectResponses: { include: { subjectTemplate: true } },
        flnResponses: { include: { flnQuestion: { include: { category: true } } } },
        selResponses: { include: { selQuestion: true } }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update assessment responses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
