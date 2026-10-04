import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: body.read !== false },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.delete({ where: { id } });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
