import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getLivelihoodProgramAccess } from "@/lib/livelihoodActivity";

export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id: programId, activityId, commentId } = await params;
    const access = await getLivelihoodProgramAccess(user, programId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
    }

    const comment = await prisma.livelihoodProgramActivityComment.findFirst({
      where: {
        id: commentId,
        activityId,
        activity: { programId },
      },
      select: { id: true, authorId: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const canDelete = user.id === comment.authorId || access.isAdmin || access.isManager;
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own comments" }, { status: 403 });
    }

    await prisma.livelihoodProgramActivityComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete livelihood activity comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
