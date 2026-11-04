import nodemailer from "nodemailer";

const MAIL_PORT = Number(process.env.MAIL_PORT || 465);
const MAIL_FROM = process.env.MAIL_FROM || process.env.MAIL_USER;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Aman Foundation";
const APP_URL =
  process.env.APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_PORT === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendForgotPasswordOTPEmail(to, otp, resetToken) {
  const resetLink = `${APP_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeOtp = escapeHtml(otp);

  const info = await transporter.sendMail({
    from: `"${MAIL_FROM_NAME}" <${MAIL_FROM}>`,
    to,
    subject: "Reset your Aman Foundation password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; color: #191c1d; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #006857; margin: 0 0 24px;">Aman Foundation</h2>
        <p style="font-size: 16px; margin: 0 0 8px;">We received a request to reset your Aman Foundation password.</p>
        <p style="font-size: 16px; margin: 0 0 4px;">Your one-time password is:</p>
        <div style="background: #eef9f5; border: 1px solid #c9e9df; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #006857;">${safeOtp}</span>
        </div>
        <p style="font-size: 14px; color: #3d4945; margin: 0 0 24px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <div style="margin: 28px 0; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
          <p style="font-size: 14px; color: #3d4945; margin: 0 0 16px;">Or click below to reset your password directly:</p>
          <a href="${resetLink}" style="display: inline-block; background: #006857; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Reset My Password</a>
          <p style="font-size: 12px; color: #6d7a75; margin: 16px 0 0; word-break: break-all;">${resetLink}</p>
        </div>
        <p style="font-size: 13px; color: #3d4945;">This reset link is valid for <strong>1 hour</strong> and can be used only once.</p>
        <p style="font-size: 12px; color: #6d7a75; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { success: true, messageId: info.messageId };
}
