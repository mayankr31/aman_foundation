import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const { action, ids, read } = body;

    if (action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    } else if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: user.id, id: { in: ids } },
        data: { read: read !== false },
      });
    } else {
      return NextResponse.json({ error: "No action specified" }, { status: 400 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { all, ids } = body;

    if (all) {
      await prisma.notification.deleteMany({ where: { userId: user.id } });
    } else if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.deleteMany({ where: { userId: user.id, id: { in: ids } } });
    } else {
      return NextResponse.json({ error: "No action specified" }, { status: 400 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Delete notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
