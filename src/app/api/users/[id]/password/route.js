import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

// ADMIN-only: reset the password of an account the admin created.
export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.createdById !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only reset passwords for accounts you created" },
        { status: 403 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
