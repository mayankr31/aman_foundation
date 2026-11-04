import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TOKEN_TYPE = "PASSWORD_RESET";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Creates a single-use password-reset token. Any older unused reset tokens for
 * the same user are invalidated so only the newest emailed link works.
 */
export async function createVerificationToken(userId, type = PASSWORD_RESET_TOKEN_TYPE) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });

  await prisma.verificationToken.create({
    data: { userId, token, type, expiresAt },
  });

  return token;
}

export async function validateToken(token, type = PASSWORD_RESET_TOKEN_TYPE) {
  if (!token) return { valid: false, error: "No reset token provided." };

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) return { valid: false, error: "Invalid or expired link." };
  if (record.type !== type) return { valid: false, error: "Invalid link type." };
  if (record.used) return { valid: false, error: "This link has already been used." };
  if (new Date() > new Date(record.expiresAt)) {
    return { valid: false, error: "This link has expired. Please request a new one." };
  }

  return { valid: true };
}

export async function verifyAndConsumeToken(token, type = PASSWORD_RESET_TOKEN_TYPE) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) return { valid: false, error: "Invalid or expired link." };
  if (record.type !== type) return { valid: false, error: "Invalid link type." };
  if (record.used) return { valid: false, error: "This link has already been used." };
  if (new Date() > new Date(record.expiresAt)) {
    return { valid: false, error: "This link has expired. Please request a new one." };
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { valid: true, user: record.user };
}
