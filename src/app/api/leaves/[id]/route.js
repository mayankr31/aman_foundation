import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authenticateUser } from "../../../../lib/auth";

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await params;
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, username: true, mobile: true, role: { select: { name: true } }, leavesTaken: true, leavesRemaining: true } },
      },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const isFellowOrOther = user.role?.name !== "ADMIN" && user.role?.name !== "HR";
    if (isFellowOrOther && leave.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this leave request" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error("GET leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.leave.findUnique({
      where: { id },
      include: {
        user: {
          include: { role: true }
        }
      }
    });
    if (!existing) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const isFellowOrOther = user.role?.name !== "ADMIN" && user.role?.name !== "HR";
    if (isFellowOrOther) {
      return NextResponse.json({ error: "Forbidden: You cannot approve or reject leaves" }, { status: 403 });
    }

    const leave = await prisma.leave.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.dates !== undefined && { dates: body.dates }),
        ...(body.reason !== undefined && { reason: body.reason }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    if (body.status === "APPROVED" && existing.status !== "APPROVED") {
      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: {
            leavesTaken: { increment: 1 },
            leavesRemaining: { decrement: 1 },
          },
        });
      }
    } else if (existing.status === "APPROVED" && (body.status === "REJECTED" || body.status === "PENDING")) {
      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: {
            leavesTaken: { decrement: 1 },
            leavesRemaining: { increment: 1 },
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error("PUT leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.leave.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    if (existing.status === "APPROVED" && existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          leavesTaken: { decrement: 1 },
          leavesRemaining: { increment: 1 },
        },
      });
    }

    await prisma.leave.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    console.error("DELETE leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
