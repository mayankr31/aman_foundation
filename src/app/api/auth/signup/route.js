import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, mobile, roleId } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "First name, last name, email, password, and roleId are required" },
        { status: 400 }
      );
    }

    // Auto-generate username from email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // Assure username uniqueness
    while (true) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      if (!existingUsername) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with PENDING status
    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        username,
        email,
        password: hashedPassword,
        mobile,
        roleId,
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        status: true,
        roleId: true,
      }
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
