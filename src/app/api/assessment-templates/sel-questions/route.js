import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

function canManageTemplates(user) {
  return user.role.name === "ADMIN" || user.role.name === "PROGRAM_MANAGER";
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const questions = await prisma.SELQuestion.findMany({
      orderBy: { order: "asc" }
    });

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("Fetch SEL questions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!canManageTemplates(user)) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
    }

    const { questionText, options, order } = await req.json();
    if (!questionText) {
      return NextResponse.json({ error: "questionText is required" }, { status: 400 });
    }

    const question = await prisma.SELQuestion.create({
      data: {
        questionText,
        options: options || ["Too Easy", "Easy", "Hard", "Too Hard", "Can with Teachers Help"],
        order: order ?? 0
      }
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error) {
    console.error("Create SEL question error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
