import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function canManageTemplates(user) {
  return user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const questions = await prisma.FLNQuestion.findMany({
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { order: "asc" }]
    });

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("Fetch FLN questions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }
    if (!canManageTemplates(user)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { categoryId, questionText, marks, order } = await req.json();
    if (!categoryId || !questionText || marks === undefined) {
      return NextResponse.json({ error: "categoryId, questionText, and marks are required" }, { status: 400 });
    }

    const question = await prisma.FLNQuestion.create({
      data: {
        categoryId,
        questionText,
        marks: parseFloat(marks),
        order: order ?? 0
      }
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error) {
    console.error("Create FLN question error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
