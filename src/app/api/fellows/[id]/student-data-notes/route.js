import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { PHASES, READING_FLUENCY_KEY } from "@/lib/fellowStudentData";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId }, select: { userId: true } });
    const isFellowSelf = fellow?.userId === user.id;
    const isManager = ["ADMIN", "PROGRAM_MANAGER"].includes(user.role.name);
    if (!isFellowSelf && !isManager) {
      return NextResponse.json({ error: "Forbidden: You cannot edit these notes" }, { status: 403 });
    }

    const { session, phase, sectionKey, note } = await req.json();

    if (!session || !phase || !sectionKey) {
      return NextResponse.json({ error: "session, phase, and sectionKey are required" }, { status: 400 });
    }
    if (!PHASES.includes(phase)) {
      return NextResponse.json({ error: "phase must be BASELINE, MIDLINE, or ENDLINE" }, { status: 400 });
    }
    if (sectionKey !== READING_FLUENCY_KEY) {
      const template = await prisma.SubjectAssessmentTemplate.findUnique({
        where: { id: sectionKey },
        select: { id: true }
      });
      if (!template) {
        return NextResponse.json({ error: "Invalid sectionKey" }, { status: 400 });
      }
    }

    const saved = await prisma.FellowStudentDataNote.upsert({
      where: { fellowId_session_phase_sectionKey: { fellowId, session, phase, sectionKey } },
      update: { note: note ?? "" },
      create: { fellowId, session, phase, sectionKey, note: note ?? "" }
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Save fellow student data note error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
