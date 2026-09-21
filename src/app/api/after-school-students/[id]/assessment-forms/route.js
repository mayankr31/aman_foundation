import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveStudentId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const student = await prisma.afterSchoolStudent.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return student ? student.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const forms = await prisma.afterSchoolAssessmentForm.findMany({
      where: { studentId },
      include: {
        fellow: { select: { id: true, name: true } },
        centre: { select: { id: true, name: true } },
        subjectResponses: {
          include: { subjectTemplate: true }
        },
        flnResponses: {
          include: { flnQuestion: { include: { category: true } } }
        }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json({ success: true, data: forms });
  } catch (error) {
    console.error("Fetch assessment forms error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const studentId = await resolveStudentId(id);

    if (!studentId) {
      return NextResponse.json({ error: "After school student not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      assessmentType,
      date,
      isEnrolledInSchool,
      reasonNotEnrolled,
      subjectResponses,
      flnScores
    } = body;

    if (!assessmentType || !date) {
      return NextResponse.json({ error: "assessmentType and date are required" }, { status: 400 });
    }

    if (!["BASELINE", "MIDLINE", "ENDLINE"].includes(assessmentType)) {
      return NextResponse.json({ error: "assessmentType must be BASELINE, MIDLINE, or ENDLINE" }, { status: 400 });
    }

    const student = await prisma.afterSchoolStudent.findUnique({
      where: { id: studentId },
      select: { centreId: true }
    });

    const form = await prisma.afterSchoolAssessmentForm.create({
      data: {
        studentId,
        fellowId: user.fellow?.id || null,
        centreId: student?.centreId || null,
        assessmentType,
        date: new Date(date),
        isEnrolledInSchool: isEnrolledInSchool ?? null,
        reasonNotEnrolled: reasonNotEnrolled || null,
        subjectResponses: subjectResponses && Array.isArray(subjectResponses) ? {
          create: subjectResponses.map(sr => ({
            subjectTemplateId: sr.subjectTemplateId,
            selectedOption: sr.selectedOption
          }))
        } : undefined,
        flnResponses: flnScores && typeof flnScores === "object" ? {
          create: Object.entries(flnScores).map(([flnQuestionId, score]) => ({
            flnQuestionId,
            score: parseFloat(score)
          }))
        } : undefined
      },
      include: {
        fellow: { select: { id: true, name: true } },
        centre: { select: { id: true, name: true } },
        subjectResponses: { include: { subjectTemplate: true } },
        flnResponses: { include: { flnQuestion: { include: { category: true } } } }
      }
    });

    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (error) {
    console.error("Create assessment form error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
