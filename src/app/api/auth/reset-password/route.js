import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  normalizeEmailForSave,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { otp, newPassword } = body || {};

    const emailError = validateEmail(body?.email, { required: true });
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json({ error: "OTP is required." }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword, { required: true });
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const normalizedEmail = normalizeEmailForSave(body.email);

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!user || !user.otp || !user.otpExpiry) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (String(user.otp) !== String(otp)) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });

    // Any outstanding emailed reset links become useless after an OTP reset.
    await prisma.verificationToken.updateMany({
      where: { userId: user.id, type: "PASSWORD_RESET", used: false },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
