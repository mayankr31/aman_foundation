import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { PHASES, READING_FLUENCY_KEY } from "@/lib/fellowStudentData";
import { canAccessCentre, resolveCentreId } from "@/lib/institutionScope";

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);
    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    if (!(await canAccessCentre(user, centreId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this centre" }, { status: 403 });
    }

    const body = await req.json();
    const { session, phase, sectionKey, note } = body || {};

    if (!session || !phase || !sectionKey) {
      return NextResponse.json({ error: "session, phase, and sectionKey are required" }, { status: 400 });
    }
    if (!PHASES.includes(phase)) {
      return NextResponse.json({ error: "phase must be BASELINE, MIDLINE, or ENDLINE" }, { status: 400 });
    }
    if (sectionKey !== READING_FLUENCY_KEY) {
      const template = await prisma.SubjectAssessmentTemplate.findUnique({
        where: { id: sectionKey },
        select: { id: true },
      });
      if (!template) {
        return NextResponse.json({ error: "Invalid sectionKey" }, { status: 400 });
      }
    }

    const saved = await prisma.InstitutionStudentDataNote.upsert({
      where: {
        scopeType_scopeId_session_phase_sectionKey_source: {
          scopeType: "afterSchoolCentre",
          scopeId: centreId,
          session,
          phase,
          sectionKey,
          source: "afterSchool",
        },
      },
      update: { note: note ?? "" },
      create: {
        scopeType: "afterSchoolCentre",
        scopeId: centreId,
        session,
        phase,
        sectionKey,
        source: "afterSchool",
        note: note ?? "",
      },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Save after school centre student data note error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
