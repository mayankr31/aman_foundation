import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendForgotPasswordOTPEmail } from "@/lib/mailer";
import { createVerificationToken } from "@/lib/tokens";
import { normalizeEmailForSave, validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

const GENERIC_MESSAGE = "If an account exists with this email, an OTP and reset link have been sent.";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const emailError = validateEmail(body?.email, { required: true });

    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    const normalizedEmail = normalizeEmailForSave(body.email);

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    // Keep the response generic so this endpoint cannot be used to discover
    // which emails are registered.
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    const resetToken = await createVerificationToken(user.id, "PASSWORD_RESET");

    try {
      await sendForgotPasswordOTPEmail(user.email, otp, resetToken);
    } catch (mailError) {
      console.error("Failed to send password reset email:", mailError);
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
