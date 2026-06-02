import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "03c246d1235e0cdbae738b88993efbf3154ed2b757908cec7a193cfc8db2ed9e";
const JWT_EXPIRES_IN = "7d";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts JWT from Authorization header, verifies it, and fetches the ACTIVE user.
 * @param {Request} req - The Next.js Request object
 * @returns {Promise<{ user: any, error: NextResponse | null }>}
 */
export async function authenticateUser(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 }) };
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return { user: null, error: NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 }) };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return { user: null, error: NextResponse.json({ error: "Unauthorized: User not found" }, { status: 401 }) };
    }

    if (user.status !== "ACTIVE") {
      return { user: null, error: NextResponse.json({ error: `Forbidden: User account is ${user.status}` }, { status: 403 }) };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Authentication error:", error);
    return { user: null, error: NextResponse.json({ error: "Internal Server Error" }, { status: 500 }) };
  }
}
