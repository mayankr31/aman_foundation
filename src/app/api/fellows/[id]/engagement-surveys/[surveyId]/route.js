import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFellowManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, { params }) {
  const { id, surveyId } = await params;
  const { user, error } = await authenticateUser(req);
  if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

  try {
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId },
    });

    if (!fellow) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const isAdmin = user.role.name === "ADMIN";
    const isOwner = user.id === fellow.userId;
    const isPm = PROGRAM_ROLES.includes(user.role.name);
    const allowed = isAdmin || isOwner || (isPm && (await isFellowManaged(user.id, fellowId)));
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const survey = await prisma.engagementSurvey.findFirst({
      where: { id: surveyId, fellowId },
    });

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (err) {
    console.error("Failed to fetch engagement survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
