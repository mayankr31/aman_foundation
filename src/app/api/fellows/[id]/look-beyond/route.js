import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFellowManaged } from "@/lib/scope";
import {
  notifyUsers,
  getReviewerUserIdsForFellow,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
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
  const { id } = await params;
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

    const surveys = await prisma.lookBeyondSurvey.findMany({
      where: { fellowId },
      orderBy: { surveyDate: "desc" },
    });
    return NextResponse.json({ success: true, data: surveys });
  } catch (err) {
    console.error("Failed to fetch look beyond surveys:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const { user, error } = await authenticateUser(req);
  if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
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

    if (user.role.name !== "ADMIN" && user.id !== fellow.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { surveyDate, responses } = body;

    if (!surveyDate || !responses) {
      return NextResponse.json({ error: "surveyDate and responses are required" }, { status: 400 });
    }

    const newSurvey = await prisma.lookBeyondSurvey.create({
      data: {
        fellowId,
        surveyDate: new Date(surveyDate),
        responses,
      },
    });

    // Notify reviewers only when the fellow submits their own survey.
    if (user.id === fellow.userId) {
      const reviewers = await getReviewerUserIdsForFellow(fellowId);
      await notifyUsers(reviewers, {
        type: NOTIFICATION_TYPES.LOOK_BEYOND_SUBMITTED,
        title: "Look Beyond Survey Submitted",
        message: `${fellow.name || "A fellow"} has submitted their Look Beyond survey.`,
        link: `/education/fellows/${fellowId}?tab=look-beyond-survey`,
        actorId: user.id,
      });
    }

    return NextResponse.json({ success: true, data: newSurvey });
  } catch (err) {
    console.error("Failed to create look beyond survey:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
