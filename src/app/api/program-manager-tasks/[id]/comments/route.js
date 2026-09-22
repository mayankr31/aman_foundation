import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: taskId } = await params;

    const comments = await prisma.programManagerTaskComment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Error fetching program manager task comments:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const { id: taskId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const newComment = await prisma.programManagerTaskComment.create({
      data: { taskId, authorId: user.id, text },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ success: true, data: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating program manager task comment:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
