import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyAndConsumeToken } from "@/lib/tokens";
import { validatePassword } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, newPassword } = body || {};

    if (!token) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword, { required: true });
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const result = await verifyAndConsumeToken(token, "PASSWORD_RESET");
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password by token error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
