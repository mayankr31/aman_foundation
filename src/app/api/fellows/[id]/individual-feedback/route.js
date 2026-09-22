import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdminOrPm, isFellowManaged } from "@/lib/scope";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, fellowId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this fellow" }, { status: 403 });
    }

    const records = await prisma.individualFeedback.findMany({
      where: { fellowId },
      orderBy: { date: "desc" },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    console.error("Fetch individual feedback error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isAdminOrPm(user)) {
      return NextResponse.json({ error: "Forbidden: Only managers can create feedback" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    if (user.role.name === "PROGRAM_MANAGER" && !(await isFellowManaged(user.id, fellowId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this fellow" }, { status: 403 });
    }

    const body = await req.json();
    const {
      date,
      classroomLevel,
      classGroup,
      subject,
      subjectOther,
      lessonPlanLink,
      lessonPlanFeedback,
      strengths,
      areasOfDevelopment,
      nextStepsFellow,
      nextStepPM
    } = body;

    if (!date || !subject) {
      return NextResponse.json({ error: "date and subject are required" }, { status: 400 });
    }

    const record = await prisma.individualFeedback.create({
      data: {
        fellowId,
        date: new Date(date),
        classroomLevel: classroomLevel || null,
        classGroup: classGroup || null,
        subject,
        subjectOther: subject === "Other" ? (subjectOther || null) : null,
        lessonPlanLink: lessonPlanLink || null,
        lessonPlanFeedback: Boolean(lessonPlanFeedback),
        strengths: strengths || null,
        areasOfDevelopment: areasOfDevelopment || null,
        nextStepsFellow: nextStepsFellow || null,
        nextStepPM: nextStepPM || null,
        authorId: user.id
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err) {
    console.error("Create individual feedback error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
